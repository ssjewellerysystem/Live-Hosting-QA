#!/usr/bin/env bash
# deploy/rollback.sh — Roll back the SS Jewellery backend to a specific commit.
# ─────────────────────────────────────────────────────────────────────────────
# Usage:
#   bash /opt/mybackend/deploy/rollback.sh <COMMIT_SHA>
#
# Example:
#   bash /opt/mybackend/deploy/rollback.sh abc1234
#
# What this script does:
#   1. Verifies the target SHA exists in the repository
#   2. Prints a clear warning about database migrations
#   3. Resets git to the target commit
#   4. Rebuilds the Docker image from that commit's code
#   5. Restarts the containers
#   6. Waits for the container health check to pass
#   7. Tests the public HTTPS /health endpoint
#   8. Prints the active commit SHA
#
# What this script does NOT do:
#   • It does NOT reverse database migrations automatically.
#   • Destructive schema changes (DROP COLUMN, DROP TABLE) cannot be reversed
#     by rolling back application code. You may need to restore from a Neon
#     database backup if the migration cannot be reversed with flask db downgrade.
# ─────────────────────────────────────────────────────────────────────────────

set -Eeuo pipefail

# ── Configuration ─────────────────────────────────────────────────────────────
DEPLOY_DIR="${DEPLOY_DIR:-/opt/mybackend}"
BACKEND_CONTAINER="ss_jewellery_backend"
COMPOSE_CMD="docker compose"
HEALTH_RETRIES=24
HEALTH_SLEEP=5
PUBLIC_HEALTH_RETRIES=6
PUBLIC_HEALTH_SLEEP=5

# ── Colours ───────────────────────────────────────────────────────────────────
if [[ -t 1 ]]; then
  RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
else
  RED=''; GREEN=''; YELLOW=''; CYAN=''; NC=''
fi

log()  { echo -e "${GREEN}[ROLLBACK]${NC} $*"; }
info() { echo -e "${CYAN}[INFO]${NC}    $*"; }
warn() { echo -e "${YELLOW}[WARN]${NC}   $*"; }
fail() { echo -e "${RED}[ERROR]${NC}  $*" >&2; exit 1; }

# ── Argument validation ───────────────────────────────────────────────────────
TARGET_SHA="${1:-}"
if [[ -z "$TARGET_SHA" ]]; then
  fail "Usage: bash rollback.sh <COMMIT_SHA>

Example:
  bash $DEPLOY_DIR/deploy/rollback.sh abc1234

Find available commits:
  git -C $DEPLOY_DIR log --oneline -20"
fi

# ── 1. Change to the deployment directory ─────────────────────────────────────
log "Changing to deployment directory: $DEPLOY_DIR"
[[ -d "$DEPLOY_DIR" ]] || fail "Deployment directory '$DEPLOY_DIR' does not exist."
cd "$DEPLOY_DIR"

# ── 2. Verify Docker access ───────────────────────────────────────────────────
docker info > /dev/null 2>&1 || fail "Current user cannot run Docker."

# ── 3. Verify .env exists ─────────────────────────────────────────────────────
[[ -f "$DEPLOY_DIR/.env" ]] || fail ".env file not found at $DEPLOY_DIR/.env"

# ── 4. Verify the target SHA exists in the repository ─────────────────────────
log "Verifying commit SHA: $TARGET_SHA"
git fetch --tags origin 2>/dev/null || true
if ! git cat-file -e "${TARGET_SHA}^{commit}" 2>/dev/null; then
  fail "Commit SHA '$TARGET_SHA' not found in the local repository.

Fetch all history and try again:
  git -C $DEPLOY_DIR fetch --unshallow origin
  git -C $DEPLOY_DIR log --oneline -20"
fi

FULL_SHA=$(git rev-parse "$TARGET_SHA")
COMMIT_MSG=$(git log -1 --pretty=%s "$FULL_SHA")
CURRENT_SHA=$(git rev-parse --short HEAD)

info "Current commit:  $CURRENT_SHA"
info "Target commit:   $(git rev-parse --short "$FULL_SHA") — $COMMIT_MSG"

# ── 5. Print database migration warning ───────────────────────────────────────
echo ""
echo -e "${YELLOW}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║              ⚠  DATABASE MIGRATION WARNING  ⚠               ║${NC}"
echo -e "${YELLOW}╠══════════════════════════════════════════════════════════════╣${NC}"
echo -e "${YELLOW}║  This rollback resets APPLICATION CODE only.                ║${NC}"
echo -e "${YELLOW}║  Database schema changes are NOT automatically reversed.    ║${NC}"
echo -e "${YELLOW}║                                                              ║${NC}"
echo -e "${YELLOW}║  If the failed deployment ran schema-altering migrations:   ║${NC}"
echo -e "${YELLOW}║    1. Check current migration state:                        ║${NC}"
echo -e "${YELLOW}║       docker compose run --rm backend flask db current      ║${NC}"
echo -e "${YELLOW}║    2. Attempt a downgrade (if migration supports it):       ║${NC}"
echo -e "${YELLOW}║       docker compose run --rm backend flask db downgrade    ║${NC}"
echo -e "${YELLOW}║    3. If the migration is destructive, restore Neon backup. ║${NC}"
echo -e "${YELLOW}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Pause 5 seconds to allow the operator to read the warning before proceeding
sleep 5

# ── 6. Reset git to the target commit ─────────────────────────────────────────
log "Resetting to commit $(git rev-parse --short "$FULL_SHA")..."
# git reset --hard does NOT delete untracked files (i.e., .env is preserved).
git reset --hard "$FULL_SHA"
log "Git reset complete. Active commit: $(git rev-parse --short HEAD)"

# ── 7. Rebuild the Docker image ────────────────────────────────────────────────
log "Rebuilding Docker image from rolled-back code..."
$COMPOSE_CMD build --pull --no-cache

# ── 8. Restart containers ──────────────────────────────────────────────────────
log "Restarting containers..."
$COMPOSE_CMD up -d --remove-orphans

# ── 9. Wait for container health check ────────────────────────────────────────
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
  fail "Backend container did not become healthy after rollback.

Diagnose with:
  docker logs $BACKEND_CONTAINER --tail 100
  docker compose logs --tail 50 backend

The rollback commit may also have issues."
fi

# ── 10. Test the public HTTPS health endpoint ──────────────────────────────────
APP_DOMAIN_VALUE=""
if APP_DOMAIN_VALUE=$(grep -m1 '^APP_DOMAIN=' "$DEPLOY_DIR/.env" | cut -d= -f2- | tr -d ' \r'); then
  APP_DOMAIN_VALUE="${APP_DOMAIN_VALUE%%#*}"
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
    warn "Public health check attempt $i/$PUBLIC_HEALTH_RETRIES — retrying in ${PUBLIC_HEALTH_SLEEP}s..."
    sleep "$PUBLIC_HEALTH_SLEEP"
  done
  [[ "$pub_healthy" == "true" ]] || warn "Public endpoint did not respond. Check Caddy logs: docker compose logs --tail 50 caddy"
fi

# ── 11. Remove dangling images ─────────────────────────────────────────────────
docker image prune -f

# ── 12. Print active commit SHA ────────────────────────────────────────────────
log "────────────────────────────────────────────────"
log "Rollback successful!"
log "Rolled back from: $CURRENT_SHA"
log "Active commit:    $(git rev-parse --short HEAD)"
log "Commit message:   $COMMIT_MSG"
log "────────────────────────────────────────────────"
log "Next steps:"
log "  • Verify the application is behaving correctly"
log "  • Check database migration state if needed:"
log "      docker compose run --rm backend flask db current"
log "  • Remove the bad commit from the QA branch to prevent it re-deploying"
log "────────────────────────────────────────────────"
