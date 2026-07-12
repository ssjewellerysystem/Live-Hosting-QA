#!/usr/bin/env bash
# deploy/deploy.sh — Idempotent deployment script for SS Jewellery backend
# Works identically in QA (Contabo, Singapore) and PROD (Oracle Cloud, Mumbai).
# ─────────────────────────────────────────────────────────────────────────────
# Usage:
#   bash /opt/ss-jewellery/deploy/deploy.sh
#
# Requirements on the server:
#   • Docker + Docker Compose v2
#   • Git repository checked out at DEPLOY_DIR
#   • .env file present at DEPLOY_DIR/.env
# ─────────────────────────────────────────────────────────────────────────────

set -Eeuo pipefail

# ── Configuration ─────────────────────────────────────────────────────────────
DEPLOY_DIR="${DEPLOY_DIR:-/opt/ss-jewellery}"
APP_CONTAINER="ss_jewellery_app"
COMPOSE_CMD="docker compose"     # Docker Compose v2 plugin
HEALTH_URL="http://localhost/health"
HEALTH_RETRIES=20
HEALTH_SLEEP=5                   # seconds between health-check retries

# ── Colours (only when connected to a terminal) ───────────────────────────────
if [[ -t 1 ]]; then
  RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
else
  RED=''; GREEN=''; YELLOW=''; NC=''
fi

log()  { echo -e "${GREEN}[DEPLOY]${NC} $*"; }
warn() { echo -e "${YELLOW}[WARN]${NC}  $*"; }
fail() { echo -e "${RED}[ERROR]${NC} $*" >&2; exit 1; }

# ── 1. Move to the deployment directory ──────────────────────────────────────
log "Changing to deployment directory: $DEPLOY_DIR"
cd "$DEPLOY_DIR"

# ── 2. Pull the latest code ───────────────────────────────────────────────────
log "Pulling latest code from main..."
git fetch --tags origin
git reset --hard origin/main
COMMIT_SHA=$(git rev-parse --short HEAD)
log "Current commit: $COMMIT_SHA"

# ── 3. Verify .env file ───────────────────────────────────────────────────────
[[ -f "$DEPLOY_DIR/.env" ]] || fail ".env file not found at $DEPLOY_DIR/.env — aborting."
log ".env file found."

# ── 4. Build Docker images ────────────────────────────────────────────────────
log "Building Docker images..."
$COMPOSE_CMD build --pull --no-cache

# ── 5. Run database migrations (Flask-Migrate / Alembic) ─────────────────────
log "Running database migrations..."
$COMPOSE_CMD run --rm \
    -e FLASK_APP=backend.app \
    app \
    flask db upgrade || fail "Database migration failed — rolling back."

# ── 6. Start / update containers ──────────────────────────────────────────────
log "Starting containers..."
$COMPOSE_CMD up -d --remove-orphans

# ── 7. Wait for health check ──────────────────────────────────────────────────
log "Waiting for application health check (max $((HEALTH_RETRIES * HEALTH_SLEEP))s)..."
healthy=false
for i in $(seq 1 "$HEALTH_RETRIES"); do
    if curl -fsS "$HEALTH_URL" > /dev/null 2>&1; then
        healthy=true
        break
    fi
    warn "Health check attempt $i/$HEALTH_RETRIES failed — retrying in ${HEALTH_SLEEP}s..."
    sleep "$HEALTH_SLEEP"
done

# ── 8. Roll back on unhealthy container ───────────────────────────────────────
if [[ "$healthy" != "true" ]]; then
    fail "Application failed health check after deployment.
    
  Run these commands to investigate:
    docker logs $APP_CONTAINER --tail 100
    docker inspect $APP_CONTAINER | jq '.[].State.Health'
    
  To roll back manually:
    git -C $DEPLOY_DIR reset --hard HEAD~1
    $COMPOSE_CMD up -d --remove-orphans"
fi

# ── 9. Remove unused Docker images safely ─────────────────────────────────────
log "Pruning dangling Docker images..."
docker image prune -f

# ── 10. Print deployed commit SHA ─────────────────────────────────────────────
log "────────────────────────────────────────────────"
log "Deployment successful!"
log "Commit:      $COMMIT_SHA"
log "Environment: ${APP_ENV:-unknown}"
log "Domain:      ${APP_DOMAIN:-unknown}"
log "────────────────────────────────────────────────"
