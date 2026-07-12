#!/usr/bin/env bash
# deploy/deploy.sh — Idempotent deployment script for SS Jewellery backend
# Works identically in QA (Contabo, Singapore) and PROD (Oracle Cloud, Mumbai).
# ─────────────────────────────────────────────────────────────────────────────
# Usage:
#   bash /opt/mybackend/deploy/deploy.sh
#
# Requirements on the server:
#   • Docker + Docker Compose v2
#   • Git repository checked out at DEPLOY_DIR
#   • .env file present at DEPLOY_DIR/.env with all required variables
#
# The script:
#   1.  Changes to the deployment directory
#   2.  Verifies the deploy user can run Docker
#   3.  Verifies .env exists
#   4.  Verifies required environment variables are set (without printing values)
#   5.  Fetches latest code from origin
#   6.  Resets to origin/main safely (preserves untracked .env)
#   7.  Records the previously deployed commit SHA
#   8.  Builds the new Docker image
#   9.  Runs database migrations (flask db upgrade)
#   10. Starts or updates containers
#   11. Waits for the backend container's built-in health check to pass
#   12. Tests the public HTTPS /health endpoint
#   13. Prints the deployed Git commit SHA
#   14. Prunes dangling Docker images safely
#   15. Fails clearly when deployment is unhealthy
# ─────────────────────────────────────────────────────────────────────────────

set -Eeuo pipefail

# ── Configuration ─────────────────────────────────────────────────────────────
DEPLOY_DIR="${DEPLOY_DIR:-/opt/mybackend}"
BACKEND_CONTAINER="ss_jewellery_backend"
COMPOSE_CMD="docker compose"     # Docker Compose v2 plugin
HEALTH_RETRIES=24                # 24 × 5 s = 120 s max wait
HEALTH_SLEEP=5                   # seconds between container health retries
PUBLIC_HEALTH_RETRIES=6          # additional retries for the public endpoint
PUBLIC_HEALTH_SLEEP=5

# ── Colours (only when connected to a terminal) ───────────────────────────────
if [[ -t 1 ]]; then
  RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
else
  RED=''; GREEN=''; YELLOW=''; CYAN=''; NC=''
fi

log()  { echo -e "${GREEN}[DEPLOY]${NC} $*"; }
info() { echo -e "${CYAN}[INFO]${NC}   $*"; }
warn() { echo -e "${YELLOW}[WARN]${NC}  $*"; }
fail() { echo -e "${RED}[ERROR]${NC} $*" >&2; exit 1; }

# ── 1. Move to the deployment directory ───────────────────────────────────────
log "Changing to deployment directory: $DEPLOY_DIR"
[[ -d "$DEPLOY_DIR" ]] || fail "Deployment directory '$DEPLOY_DIR' does not exist."
cd "$DEPLOY_DIR"

# ── 2. Verify Docker access ───────────────────────────────────────────────────
log "Verifying Docker access..."
docker info > /dev/null 2>&1 || fail "Current user cannot run Docker. Add user to the docker group: sudo usermod -aG docker \$USER"
$COMPOSE_CMD version > /dev/null 2>&1 || fail "Docker Compose v2 plugin not found. Install it: https://docs.docker.com/compose/install/"

# ── 3. Verify .env file ───────────────────────────────────────────────────────
log "Verifying .env file..."
[[ -f "$DEPLOY_DIR/.env" ]] || fail ".env file not found at $DEPLOY_DIR/.env

Create it from the template:
  cp .env.example .env
  nano .env   # fill in real values"

# ── 4. Verify required environment variables (without printing values) ────────
log "Checking required environment variables..."
# Source .env temporarily to check keys exist; use subshell to avoid polluting environment
(
  set -a
  # shellcheck disable=SC1091
  source "$DEPLOY_DIR/.env"
  set +a
  missing=()
  for var in SECRET_KEY DATABASE_URL APP_DOMAIN CORS_ALLOWED_ORIGINS; do
    if [[ -z "${!var:-}" ]]; then
      missing+=("$var")
    fi
  done
  if [[ ${#missing[@]} -gt 0 ]]; then
    echo "[ERROR] Missing required .env variables: ${missing[*]}" >&2
    exit 1
  fi
) || fail "Required environment variables are missing. Edit $DEPLOY_DIR/.env"
log "All required environment variables are present."

# ── 5. Record previous commit SHA (for rollback reference) ───────────────────
PREV_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
info "Previous commit: $PREV_SHA"

# ── 6. Pull the latest code ───────────────────────────────────────────────────
log "Fetching latest code from origin..."
git fetch --tags origin

# Reset to origin/main safely.
# git reset --hard does NOT delete untracked files (i.e., .env is safe).
git reset --hard origin/main

COMMIT_SHA=$(git rev-parse --short HEAD)
COMMIT_MSG=$(git log -1 --pretty=%s)
log "Now at commit: $COMMIT_SHA — $COMMIT_MSG"

# ── 7. Make deploy scripts executable ─────────────────────────────────────────
chmod +x "$DEPLOY_DIR/deploy/deploy.sh"
[[ -f "$DEPLOY_DIR/deploy/rollback.sh" ]] && chmod +x "$DEPLOY_DIR/deploy/rollback.sh"

# ── 8. Build Docker images ─────────────────────────────────────────────────────
log "Building Docker images..."
$COMPOSE_CMD build --pull --no-cache

# ── 9. Run database migrations (Flask-Migrate / Alembic) ──────────────────────
log "Running database migrations..."
# flask db upgrade requires FLASK_APP; it is set in docker-compose.yml environment.
$COMPOSE_CMD run --rm backend flask db upgrade \
  || fail "Database migration failed.

Investigate with:
  docker compose run --rm backend flask db current
  docker compose run --rm backend flask db history

DO NOT restart the application with unresolved migration failures."

# ── 10. Start / update containers ─────────────────────────────────────────────
log "Starting containers..."
$COMPOSE_CMD up -d --remove-orphans

# ── 11. Wait for backend container health check ───────────────────────────────
log "Waiting for backend container health check (max $((HEALTH_RETRIES * HEALTH_SLEEP))s)..."
healthy=false
for i in $(seq 1 "$HEALTH_RETRIES"); do
  status=$(docker inspect --format='{{.State.Health.Status}}' "$BACKEND_CONTAINER" 2>/dev/null || echo "missing")
  if [[ "$status" == "healthy" ]]; then
    healthy=true
    log "Container reported healthy on attempt $i."
    break
  fi
  warn "Container health status: '$status' (attempt $i/$HEALTH_RETRIES) — retrying in ${HEALTH_SLEEP}s..."
  sleep "$HEALTH_SLEEP"
done

if [[ "$healthy" != "true" ]]; then
  fail "Backend container did not become healthy within $((HEALTH_RETRIES * HEALTH_SLEEP))s.

Diagnose with:
  docker logs $BACKEND_CONTAINER --tail 100
  docker inspect $BACKEND_CONTAINER

To roll back to the previous commit:
  bash $DEPLOY_DIR/deploy/rollback.sh $PREV_SHA"
fi

# ── 12. Test the public HTTPS health endpoint ─────────────────────────────────
# Load APP_DOMAIN from .env for the public endpoint check
APP_DOMAIN_VALUE=""
if APP_DOMAIN_VALUE=$(grep -m1 '^APP_DOMAIN=' "$DEPLOY_DIR/.env" | cut -d= -f2- | tr -d ' \r'); then
  APP_DOMAIN_VALUE="${APP_DOMAIN_VALUE%%#*}"   # strip inline comments
  APP_DOMAIN_VALUE="${APP_DOMAIN_VALUE//[[:space:]]/}"
fi

if [[ -n "$APP_DOMAIN_VALUE" ]]; then
  PUBLIC_URL="https://${APP_DOMAIN_VALUE}/health"
  log "Testing public endpoint: $PUBLIC_URL"
  pub_healthy=false
  for i in $(seq 1 "$PUBLIC_HEALTH_RETRIES"); do
    if curl -fsS --max-time 10 "$PUBLIC_URL" > /dev/null 2>&1; then
      pub_healthy=true
      log "Public health endpoint responded successfully."
      break
    fi
    warn "Public health check attempt $i/$PUBLIC_HEALTH_RETRIES failed — retrying in ${PUBLIC_HEALTH_SLEEP}s..."
    sleep "$PUBLIC_HEALTH_SLEEP"
  done
  if [[ "$pub_healthy" != "true" ]]; then
    warn "Public endpoint $PUBLIC_URL did not respond.
This could mean:
  • DNS for $APP_DOMAIN_VALUE has not propagated yet
  • Caddy is still obtaining a TLS certificate from Let's Encrypt
  • A firewall rule is blocking ports 80/443

The containers are healthy; check Caddy logs:
  docker compose logs --tail 50 caddy"
  fi
else
  warn "APP_DOMAIN not found in .env — skipping public HTTPS health check."
fi

# ── 13. Remove dangling Docker images safely ───────────────────────────────────
log "Pruning dangling Docker images..."
docker image prune -f

# ── 14. Print deployed commit SHA ──────────────────────────────────────────────
log "────────────────────────────────────────────────"
log "Deployment successful!"
log "Previous commit: $PREV_SHA"
log "Deployed commit: $COMMIT_SHA"
log "Commit message:  $COMMIT_MSG"
log "────────────────────────────────────────────────"
log "Useful commands:"
log "  docker compose ps"
log "  docker compose logs -f backend"
log "  docker compose logs -f caddy"
log "  docker compose run --rm backend flask db current"
log "────────────────────────────────────────────────"
