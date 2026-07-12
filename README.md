# SS Jewellery — Backend API

> ⚠️ **PRODUCTION SECRETS MUST NEVER BE COPIED FROM QA.**
> QA and PROD use entirely separate Neon accounts, secret keys, SSH keys, and Vercel projects.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Repository Structure](#2-repository-structure)
3. [Local Backend Startup](#3-local-backend-startup)
4. [Docker Local Startup](#4-docker-local-startup)
5. [Environment Variables](#5-environment-variables)
6. [QA Deployment Process](#6-qa-deployment-process)
7. [PROD Promotion and Deployment](#7-prod-promotion-and-deployment)
8. [GitHub Actions Secrets](#8-github-actions-secrets)
9. [Initial Contabo QA Setup](#9-initial-contabo-qa-setup)
10. [Initial Oracle Cloud PROD Setup](#10-initial-oracle-cloud-prod-setup)
11. [First Deployment Commands](#11-first-deployment-commands)
12. [Health Check Commands](#12-health-check-commands)
13. [Log Commands](#13-log-commands)
14. [Migration Commands](#14-migration-commands)
15. [Rollback Procedure](#15-rollback-procedure)
16. [DNS Records](#16-dns-records)
17. [Vercel Frontend Configuration](#17-vercel-frontend-configuration)
18. [Neon Database Separation](#18-neon-database-separation)
19. [Common Troubleshooting Commands](#19-common-troubleshooting-commands)
20. [Security Checklist](#20-security-checklist)

---

## 1. Architecture Overview

```
Developer Laptop                  GitHub (QA repo)
     │  git push main                   │
     └──────────────────────────────────►│
                                         │
                              GitHub Actions (deploy-qa.yml)
                                         │  pytest tests/
                                         │  SSH → Contabo
                                         │  deploy.sh
                                         ▼
                              Contabo VPS (Singapore, 1 CPU / 6 GB)
                              /opt/mybackend/
                              ┌─────────────────────┐
                              │  Caddy (80 + 443)   │◄─── HTTPS from users
                              │  (Docker container) │
                              └──────────┬──────────┘
                                         │ internal Docker net (proxy_net)
                              ┌──────────▼──────────┐
                              │ Flask + Gunicorn     │
                              │ (Docker container)  │
                              │ backend:5000        │
                              └──────────┬──────────┘
                                         │ TLS
                                         ▼
                              Neon PostgreSQL (QA account)

Owner triggers "Promote QA to PROD" workflow
     │  rsync QA → PROD repo
     └──────────────────────────────────►│
                              PROD repo main push
                                         │
                              GitHub Actions (deploy-prod.yml)
                                         │  pytest tests/
                                         │  SSH → Oracle Cloud
                                         │  deploy.sh
                                         ▼
                              Oracle Cloud (Mumbai, 2 CPU / 12 GB)
                              Same Docker stack, different .env
```

| Layer | QA | PROD |
|---|---|---|
| Repository | `ssjewellerysystem/Live-hosting-QA` | Private PROD repo |
| Server | Contabo VPS, Singapore | Oracle Cloud Free Tier, Mumbai |
| vCPU / RAM | 1 CPU / 6 GB | 2 CPU / 12 GB |
| Deploy dir | `/opt/mybackend` | `/opt/mybackend` |
| Gunicorn workers | 2 | 4 |
| Database | QA Neon account | PROD Neon account |
| Frontend | Vercel (QA project) | Vercel (PROD project) |
| App domain | `api.qa.example.com` | `api.example.com` |

**The Dockerfile, docker-compose.yml, deploy.sh, Caddyfile, and Python version are identical between QA and PROD. Only the server-side `.env` differs.**

---

## 2. Repository Structure

```
Live-Hosting-QA/
├── backend/
│   ├── app.py              ← Flask application, blueprints, health route
│   ├── config.py           ← All config read from environment variables
│   ├── extensions.py       ← db, migrate, mail Flask extension objects
│   ├── middleware/
│   │   └── auth.py
│   ├── models/             ← SQLAlchemy ORM models
│   ├── routes/             ← Flask blueprints (/api/auth, /api/products, etc.)
│   ├── utils/              ← Helpers, email service, report automation
│   ├── data/               ← Seed data files
│   ├── reports/            ← Generated report output directory
│   └── static/
│       └── uploads/        ← Uploaded files (Docker volume, not in git)
│
├── migrations/             ← Alembic migration history (committed to git)
│   ├── alembic.ini
│   ├── env.py
│   ├── script.py.mako
│   └── versions/
│
├── requirements/
│   ├── base.txt            ← Pinned runtime dependencies
│   └── production.txt      ← base.txt + gunicorn
│
├── tests/
│   ├── __init__.py
│   └── test_health.py
│
├── deploy/
│   ├── Caddyfile           ← Caddy reverse proxy config
│   ├── deploy.sh           ← Idempotent deployment script
│   └── rollback.sh         ← Roll back to a specific git commit SHA
│
├── frontend/               ← Deployed separately on Vercel (not in Docker image)
├── docs/
├── artifacts/
│
├── .github/
│   └── workflows/
│       ├── deploy-qa.yml       ← CI/CD for QA
│       ├── promote-to-prod.yml ← Manual: copy QA code → PROD repo
│       └── deploy-prod.yml     ← For PROD repo only (copy there manually)
│
├── Dockerfile              ← Single multi-stage Dockerfile (QA + PROD)
├── docker-compose.yml      ← Single compose file (QA + PROD via .env)
├── .env.example            ← Placeholder template — safe to commit
├── .dockerignore
├── .gitignore
└── README.md
```

---

## 3. Local Backend Startup

### Prerequisites

- Python 3.11
- Git

### Setup

```bash
# 1. Clone the QA repository
git clone https://github.com/ssjewellerysystem/Live-hosting-QA.git
cd Live-Hosting-QA

# 2. Create and activate a virtual environment
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate

# 3. Install base dependencies
pip install -r requirements/base.txt
pip install pytest                # for running tests locally

# 4. Create a local .env file
cp .env.example .env
# Edit .env with your local Neon QA connection string and a dev secret key

# 5. Run the Flask development server
export FLASK_APP=backend.app
flask run --port 5000

# 6. Run tests
pytest tests/ -v
```

> **Note:** `DEBUG=false` is required in QA and PROD. For local development you may set `DEBUG=true` and `OTP_MODE=development`.

---

## 4. Docker Local Startup

```bash
# 1. Create a .env file (copy from example and fill in values)
cp .env.example .env
nano .env

# 2. Build and start the full stack (Flask + Caddy)
docker compose up -d

# 3. Check container status
docker compose ps

# 4. View logs
docker compose logs -f backend
docker compose logs -f caddy

# 5. Test locally (Caddy requires a valid domain with DNS for HTTPS)
#    For local testing, use the internal port directly:
curl http://localhost:5000/health

# 6. Stop containers
docker compose down

# 7. Rebuild after code changes
docker compose build --no-cache
docker compose up -d
```

---

## 5. Environment Variables

All variables must be present in the server-side `.env` file. Never commit the real `.env`.

| Variable | Required | Example / Notes |
|---|---|---|
| `APP_ENV` | ✅ | `qa` or `production` |
| `APP_DOMAIN` | ✅ | `api.qa.example.com` — used by Caddy for TLS |
| `PORT` | ✅ | `5000` |
| `DEBUG` | ✅ | `false` (must be false in QA/PROD) |
| `LOG_LEVEL` | | `INFO` (default) |
| `GUNICORN_WORKERS` | | `2` for QA, `4` for PROD |
| `GUNICORN_TIMEOUT` | | `120` seconds (default) |
| `OTP_MODE` | | `production` (set `development` locally only) |
| `SECRET_KEY` | ✅ | 64+ random hex characters — unique per environment |
| `DATABASE_URL` | ✅ | Neon pooler URL with `sslmode=require` |
| `ALLOWED_HOSTS` | ✅ | Comma-separated hostnames |
| `CORS_ALLOWED_ORIGINS` | ✅ | Comma-separated Vercel origin URLs (no localhost in QA/PROD) |
| `MAIL_SERVER` | | `smtp.gmail.com` |
| `MAIL_PORT` | | `587` |
| `MAIL_USE_TLS` | | `true` |
| `MAIL_USERNAME` | ✅ | Gmail address |
| `MAIL_PASSWORD` | ✅ | Gmail App Password |
| `SMTP_FROM` | | `SSJewellery <email@gmail.com>` |
| `CLOUDINARY_URL` | ✅ | Full Cloudinary URL |
| `PROXY_FIX_NUM_PROXIES` | | `1` (Caddy only) |

Generate a secret key:

```bash
python -c "import secrets; print(secrets.token_hex(64))"
```

---

## 6. QA Deployment Process

**Automatic trigger:** Any push to `main` branch.
**Manual trigger:** Actions → Deploy to QA → Run workflow.

**Flow:**
1. GitHub Actions runs backend tests (`pytest tests/`) with an in-memory SQLite database.
2. If tests fail, deployment is blocked.
3. If tests pass, GitHub Actions SSHes to the Contabo server as the `deploy` user.
4. Executes `/opt/mybackend/deploy/deploy.sh` on the server.

**`deploy.sh` steps:**
1. Changes to `/opt/mybackend`
2. Verifies Docker access
3. Verifies `.env` exists
4. Checks required env vars are set (without printing values)
5. Fetches and resets to `origin/main` (`.env` is preserved — it is untracked)
6. Builds Docker image with `--no-cache`
7. Runs `flask db upgrade` in a temporary container
8. Starts/updates containers with `docker compose up -d --remove-orphans`
9. Polls the container health check (up to 2 minutes)
10. Tests `https://<APP_DOMAIN>/health` over public HTTPS
11. Prunes dangling Docker images
12. Prints the deployed commit SHA

---

## 7. PROD Promotion and Deployment

> Only the project owner can run the promotion workflow. Developers must not have access to the PROD repository.

### Promotion (QA → PROD)

1. Go to: **QA repository → Actions → Promote QA to PROD → Run workflow**
2. Enter an optional release note.
3. Type `PROMOTE` in the confirmation field.
4. The workflow:
   - Checks out QA code
   - Clones the private PROD repository using `PROD_REPO_TOKEN`
   - Uses `rsync --delete` to copy approved code (excluding secrets, logs, uploads, caches, and QA workflows)
   - Restores PROD's own `deploy-prod.yml` from PROD git history
   - Commits with message including the QA commit SHA
   - Pushes to PROD `main` (never force-push)

### PROD Deployment (automatic after promotion)

1. The push to PROD `main` triggers `deploy-prod.yml` in the **PROD repository**.
2. Same test → SSH → `deploy.sh` sequence as QA.
3. Uses `PROD_SSH_PRIVATE_KEY`, `PROD_HOST`, `PROD_USER`, `PROD_SSH_KNOWN_HOSTS`.
4. Runs on the Oracle Cloud server.

---

## 8. GitHub Actions Secrets

### QA Repository Secrets

| Secret | Description | How to obtain |
|---|---|---|
| `QA_HOST` | IP address or hostname of the Contabo VPS | Contabo control panel |
| `QA_USER` | SSH username on the QA server — must be `deploy` | Set during server bootstrap |
| `QA_SSH_PRIVATE_KEY` | Private key content for QA deploy key | `cat ~/.ssh/deploy_qa_ed25519` |
| `QA_SSH_KNOWN_HOSTS` | Host fingerprint — prevents MITM | `ssh-keyscan <QA_HOST>` |
| `PROD_REPO_TOKEN` | Fine-grained PAT with Contents:write on PROD repo | GitHub → Settings → Fine-grained tokens |

### QA Repository Variables (non-secret)

| Variable | Example |
|---|---|
| `PROD_REPO` | `ssjewellerysystem/ss-jewellery-prod` |

### PROD Repository Secrets

| Secret | Description |
|---|---|
| `PROD_HOST` | IP address or hostname of the Oracle Cloud instance |
| `PROD_USER` | SSH username — must be `deploy` |
| `PROD_SSH_PRIVATE_KEY` | PROD deploy private key (different from QA!) |
| `PROD_SSH_KNOWN_HOSTS` | `ssh-keyscan <PROD_HOST>` |

---

## 9. Initial Contabo QA Setup

Run as `root` on the Contabo VPS. Docker and Docker Compose are already installed.

```bash
# ── 1. Update the system ────────────────────────────────────────────────────
apt-get update && apt-get upgrade -y

# ── 2. Verify Docker is installed ──────────────────────────────────────────
docker --version
docker compose version

# ── 3. Create a non-root deploy user ──────────────────────────────────────
useradd -m -s /bin/bash deploy
usermod -aG docker deploy

# ── 4. Create the application directory ───────────────────────────────────
mkdir -p /opt/mybackend
chown deploy:deploy /opt/mybackend

# ── 5. Add the QA deploy SSH public key ────────────────────────────────────
# On your LOCAL machine, generate the key pair:
#   ssh-keygen -t ed25519 -C "deploy-qa" -f ~/.ssh/deploy_qa_ed25519
#   cat ~/.ssh/deploy_qa_ed25519.pub   ← copy this line

su - deploy -c "mkdir -p ~/.ssh && chmod 700 ~/.ssh"
echo "ssh-ed25519 AAAA...your-qa-public-key..." >> /home/deploy/.ssh/authorized_keys
chmod 600 /home/deploy/.ssh/authorized_keys
chown deploy:deploy /home/deploy/.ssh/authorized_keys

# ── 6. Clone the QA repository as the deploy user ─────────────────────────
su - deploy
cd /opt/mybackend
git clone https://github.com/ssjewellerysystem/Live-hosting-QA.git .

# ── 7. Create the QA .env file ─────────────────────────────────────────────
cp .env.example .env
nano .env   # Fill in all real QA values

# ── 8. Make deploy scripts executable ──────────────────────────────────────
chmod +x /opt/mybackend/deploy/deploy.sh
chmod +x /opt/mybackend/deploy/rollback.sh

# ── 9. Firewall — expose only ports 22, 80, 443 ───────────────────────────
ufw default deny incoming
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# ── 10. Run the first deployment ──────────────────────────────────────────
bash /opt/mybackend/deploy/deploy.sh

# ── 11. Collect the known_hosts entry for GitHub Actions ──────────────────
# On your LOCAL machine:
#   ssh-keyscan <QA_HOST>
# Copy the output and add it as the QA_SSH_KNOWN_HOSTS secret.
```

---

## 10. Initial Oracle Cloud PROD Setup

Run as `root` on the Oracle Cloud instance.

```bash
# ── 1. Update the system ────────────────────────────────────────────────────
apt-get update && apt-get upgrade -y

# ── 2. Install Docker ───────────────────────────────────────────────────────
curl -fsSL https://get.docker.com | sh
systemctl enable --now docker

# ── 3. Create a non-root deploy user ──────────────────────────────────────
useradd -m -s /bin/bash deploy
usermod -aG docker deploy

# ── 4. Create the application directory ───────────────────────────────────
mkdir -p /opt/mybackend
chown deploy:deploy /opt/mybackend

# ── 5. Add the PROD deploy SSH public key (DIFFERENT from QA key) ──────────
# On your LOCAL machine:
#   ssh-keygen -t ed25519 -C "deploy-prod" -f ~/.ssh/deploy_prod_ed25519
#   cat ~/.ssh/deploy_prod_ed25519.pub   ← copy this line

su - deploy -c "mkdir -p ~/.ssh && chmod 700 ~/.ssh"
echo "ssh-ed25519 AAAA...your-prod-public-key..." >> /home/deploy/.ssh/authorized_keys
chmod 600 /home/deploy/.ssh/authorized_keys
chown deploy:deploy /home/deploy/.ssh/authorized_keys

# ── 6. Clone the PROD repository as the deploy user ───────────────────────
su - deploy
cd /opt/mybackend
# Use the PROD_REPO_TOKEN if the repo is private:
git clone https://x-access-token:<PROD_REPO_TOKEN>@github.com/ssjewellerysystem/ss-jewellery-prod.git .

# ── 7. Create the PROD .env file (different values from QA) ───────────────
cp .env.example .env
nano .env   # Fill in all real PROD values — different from QA!
            # Set: GUNICORN_WORKERS=4, APP_ENV=production, APP_DOMAIN=api.example.com

# ── 8. Make deploy scripts executable ──────────────────────────────────────
chmod +x /opt/mybackend/deploy/deploy.sh
chmod +x /opt/mybackend/deploy/rollback.sh

# ── 9. Firewall ─────────────────────────────────────────────────────────────
ufw default deny incoming
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# ── 10. Copy deploy-prod.yml to the PROD repo .github/workflows/ ──────────
# This step is done from your local machine after the PROD repo is created:
#   mkdir -p prod-repo/.github/workflows
#   cp .github/workflows/deploy-prod.yml prod-repo/.github/workflows/
#   git -C prod-repo add .github/workflows/deploy-prod.yml
#   git -C prod-repo commit -m "chore: add PROD deployment workflow"
#   git -C prod-repo push origin main

# ── 11. Run the first deployment ──────────────────────────────────────────
bash /opt/mybackend/deploy/deploy.sh

# ── 12. Collect the known_hosts entry for GitHub Actions ──────────────────
# On your LOCAL machine:
#   ssh-keyscan <PROD_HOST>
# Copy the output and add it as the PROD_SSH_KNOWN_HOSTS secret.
```

---

## 11. First Deployment Commands

```bash
# On the server (QA or PROD) as the deploy user
cd /opt/mybackend

# Verify .env is correct (check key names, not values)
grep -E '^(APP_ENV|APP_DOMAIN|PORT|DEBUG)=' .env

# Run the first deployment
bash deploy/deploy.sh

# Verify containers started successfully
docker compose ps

# Check logs
docker compose logs -f backend --tail 50
docker compose logs -f caddy --tail 50

# Test health endpoint (via Caddy — requires valid DNS)
curl -fsS https://<APP_DOMAIN>/health

# Test health endpoint directly (bypasses Caddy, for debugging only)
curl -fsS http://localhost:5000/health
```

---

## 12. Health Check Commands

```bash
# Test via Caddy (HTTPS — production path)
curl -fsS https://<APP_DOMAIN>/health
# Expected: {"status": "ok", "service": "ss-jewellery-backend"}

# Test directly via container (internal — no TLS)
docker exec ss_jewellery_backend curl -fsS http://localhost:5000/health

# Check Docker's built-in health status
docker inspect ss_jewellery_backend --format='{{.State.Health.Status}}'
# Expected: healthy

# Check all container health statuses
docker compose ps
```

---

## 13. Log Commands

```bash
# Stream application logs
docker compose logs -f backend

# Stream Caddy access logs
docker compose logs -f caddy

# Show last 100 lines of application logs
docker compose logs --tail 100 backend

# View structured JSON logs (parse with jq)
docker compose logs --tail 50 backend | python3 -m json.tool

# Check journald logs (if using systemd)
journalctl -u docker.service --since "1 hour ago"
```

---

## 14. Migration Commands

```bash
# Check the current migration state
docker compose run --rm backend flask db current

# Show migration history
docker compose run --rm backend flask db history

# Apply all pending migrations
docker compose run --rm backend flask db upgrade

# Downgrade one migration (use with caution — may be irreversible)
docker compose run --rm backend flask db downgrade

# Generate a new migration after model changes (run locally, commit to git)
FLASK_APP=backend.app flask db migrate -m "describe your change"
git add migrations/versions/
git commit -m "feat: add migration for <change>"
```

> **Important:** The `FLASK_APP` environment variable is automatically set in `docker-compose.yml`. All `docker compose run` commands pick it up.

---

## 15. Rollback Procedure

### Automatic rollback (when deploy.sh detects an unhealthy container)

`deploy.sh` exits non-zero if the container is not healthy. The GitHub Actions workflow fails and no traffic is routed to the broken container (Caddy's upstream health check prevents it).

### Manual rollback to a previous commit

```bash
# On the server (QA or PROD), as the deploy user
cd /opt/mybackend

# Find the commit you want to roll back to
git log --oneline -10

# Roll back to a specific commit SHA
bash deploy/rollback.sh abc1234

# The script will:
# 1. Verify the SHA exists
# 2. Print a database migration warning
# 3. Reset git to that commit
# 4. Rebuild the Docker image
# 5. Restart containers
# 6. Poll container health check
# 7. Test the public HTTPS endpoint
```

> ⚠️ **Database warning:** Rolling back application code does NOT reverse database migrations. If the failed deployment ran schema-altering migrations (DROP COLUMN, etc.), you must:
> 1. Try `flask db downgrade` if the migration supports it
> 2. Restore from a Neon database backup if it does not

---

## 16. DNS Records

Point your domain's DNS to the server IP before running deploy.sh. Caddy obtains TLS certificates from Let's Encrypt automatically — it requires DNS to be correctly set up.

| Type | Name | Value |
|---|---|---|
| A | `api.qa.example.com` | `<Contabo VPS IP>` |
| A | `api.example.com` | `<Oracle Cloud IP>` |

---

## 17. Vercel Frontend Configuration

The frontend is deployed separately on Vercel. Set these environment variables in each Vercel project:

**QA Vercel project:**

| Variable | Value |
|---|---|
| `VITE_API_BASE_URL` (or `NEXT_PUBLIC_API_URL`) | `https://api.qa.example.com` |

**PROD Vercel project:**

| Variable | Value |
|---|---|
| `VITE_API_BASE_URL` (or `NEXT_PUBLIC_API_URL`) | `https://api.example.com` |

The frontend domain must also appear in `CORS_ALLOWED_ORIGINS` in the backend `.env`.

---

## 18. Neon Database Separation

| | QA | PROD |
|---|---|---|
| Neon project | Separate QA project | Separate PROD project |
| Pooler URL | QA pooler endpoint | PROD pooler endpoint |
| `DATABASE_URL` | Different credentials | Different credentials |
| Migrations | Applied on every QA deploy | Applied on every PROD deploy |
| Backups | Enable Neon branch protection | Enable Neon branch protection + point-in-time recovery |

To create a new Neon project: [neon.tech](https://neon.tech)

---

## 19. Common Troubleshooting Commands

```bash
# Container not starting
docker compose ps -a
docker compose logs --tail 100 backend
docker inspect ss_jewellery_backend | python3 -m json.tool | grep -A 10 '"Health"'

# Database connection issues
docker compose run --rm backend flask db current
# Look for: ConnectionError, OperationalError, SSL issues

# Caddy not serving HTTPS (TLS certificate issues)
docker compose logs --tail 50 caddy | grep -i "error\|tls\|acme"
# Ensure DNS is propagated: dig api.qa.example.com
# Ensure ports 80 and 443 are open: ufw status

# Flask app crashed on startup
docker compose logs --tail 100 backend | grep -i "error\|exception\|traceback"
# Check for missing env vars: grep "_require" backend/config.py

# Port 5000 incorrectly exposed (security issue)
ss -tlnp | grep 5000
# This should return nothing — 5000 must not be published to the host

# PostgreSQL port exposed (security issue)
ss -tlnp | grep 5432
# This should return nothing — the database is hosted on Neon

# Check open ports
ufw status
ss -tlnp | grep -E '80|443|22'

# Manual docker compose commands
docker compose ps
docker compose build --no-cache
docker compose up -d
docker compose down
docker compose restart backend
docker compose run --rm backend flask db current

# Prune dangling images (safe)
docker image prune -f

# Hard reset — stop everything, remove containers and images (CAUTION: not volumes)
docker compose down --rmi local
docker compose up -d --build
```

---

## 20. Security Checklist

Before going live on each environment:

- [ ] `.env` is **not** tracked in git — `git status` shows it as untracked
- [ ] `git log --all --oneline -- .env` shows no commits containing `.env`
- [ ] `SECRET_KEY` is a 64+ character random hex value, different in QA and PROD
- [ ] `DATABASE_URL` points to separate Neon accounts in QA and PROD
- [ ] QA and PROD SSH key pairs are different
- [ ] `CORS_ALLOWED_ORIGINS` contains no `localhost` in QA or PROD `.env`
- [ ] `DEBUG=false` in both QA and PROD `.env` files
- [ ] PostgreSQL port 5432 is **not** exposed — `ss -tlnp | grep 5432` returns nothing
- [ ] Flask port 5000 is **not** exposed — `ss -tlnp | grep 5000` returns nothing
- [ ] Only ports 22, 80, 443 are open — `ufw status`
- [ ] The deploy user is **not** root — `whoami` returns `deploy`
- [ ] Docker container runs as `appuser` — `docker inspect ss_jewellery_backend --format='{{.Config.User}}'`
- [ ] Caddy handles HTTPS; Python is internal only
- [ ] `PROD_REPO_TOKEN` has the minimum required permission (Contents: write only)
- [ ] Developers do not have access to the PROD repository or PROD secrets
- [ ] `deploy.sh` never prints secret values — `grep -i 'echo.*SECRET\|echo.*PASSWORD' deploy/deploy.sh`
- [ ] ⚠️ **Revoke the hardcoded SMTP password** in `backend/utils/report_automation.py` line ~128 from your Google account and update `MAIL_PASSWORD` in `.env`
- [ ] Cloudinary credentials are separate per environment
- [ ] Flask-Mail credentials are separate per environment
- [ ] No hardcoded database URLs or credentials remain in Python files
