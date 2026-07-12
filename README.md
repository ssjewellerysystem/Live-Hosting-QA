# SS Jewellery — Backend API

> ⚠️ **PRODUCTION SECRETS MUST NEVER BE COPIED FROM QA.**
> QA and PROD use entirely separate Neon accounts, secret keys, SSH keys, and Vercel projects.

---

## Table of Contents

1. [Architecture](#architecture)
2. [Local Development](#local-development)
3. [Environment Variables](#environment-variables)
4. [QA Deployment Flow](#qa-deployment-flow)
5. [PROD Promotion and Deployment Flow](#prod-promotion-and-deployment-flow)
6. [GitHub Actions Secrets](#github-actions-secrets)
7. [Server Directories](#server-directories)
8. [One-Time Server Bootstrap](#one-time-server-bootstrap)
9. [Health Check](#health-check)
10. [Rollback Procedure](#rollback-procedure)
11. [Troubleshooting Commands](#troubleshooting-commands)
12. [Security Checklist](#security-checklist)

---

## Architecture

```
Vercel (Frontend, QA)                Vercel (Frontend, PROD)
       │                                     │
       ▼  HTTPS                              ▼  HTTPS
Caddy (QA — Contabo, Singapore)     Caddy (PROD — Oracle Cloud, Mumbai)
       │                                     │
       ▼  internal Docker net               ▼  internal Docker net
Flask/Gunicorn (Docker container)   Flask/Gunicorn (Docker container)
       │                                     │
       ▼  TLS                               ▼  TLS
Neon PostgreSQL (QA account)        Neon PostgreSQL (PROD account)
```

| Layer            | QA                           | PROD                         |
|------------------|------------------------------|------------------------------|
| Repository       | Private QA GitHub repo       | Private PROD GitHub repo     |
| Server           | Contabo VPS, Singapore       | Oracle Cloud Free Tier, Mumbai |
| vCPU / RAM       | 1 CPU / 6 GB                 | 2 CPU / 12 GB                |
| Gunicorn workers | 2                            | 4                            |
| Database         | QA Neon account              | PROD Neon account            |
| Frontend         | Vercel (QA project)          | Vercel (PROD project)        |

**The Dockerfile, docker-compose.yml, deploy.sh, Caddyfile, and Python version are identical between QA and PROD.**
Only the server-side `.env` file differs.

---

## Local Development

### Prerequisites

- Python 3.11
- Docker Desktop (optional, for container testing)

### Setup

```bash
# 1. Clone the QA repository
git clone <QA_REPO_URL>
cd ss-jewellery-backend

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

> **Note:** `DEBUG=false` is required in QA and PROD.  
> For local development you may set `DEBUG=true` and `OTP_MODE=development`.

---

## Environment Variables

All variables must be present in the server-side `.env` file (never committed).

| Variable               | Required | Example / Notes                                        |
|------------------------|----------|-------------------------------------------------------|
| `APP_ENV`              | ✅        | `qa` or `production`                                 |
| `APP_DOMAIN`           | ✅        | `api.qa.example.com` — used by Caddy for TLS         |
| `PORT`                 | ✅        | `5000`                                               |
| `DEBUG`                | ✅        | `false` (must be false in QA/PROD)                   |
| `LOG_LEVEL`            |          | `INFO` (default)                                     |
| `GUNICORN_WORKERS`     |          | `2` for QA, `4` for PROD                             |
| `OTP_MODE`             |          | `production` (set `development` locally only)        |
| `SECRET_KEY`           | ✅        | 64+ random hex characters — unique per environment   |
| `DATABASE_URL`         | ✅        | Neon pooler URL with `sslmode=require`               |
| `ALLOWED_HOSTS`        | ✅        | Comma-separated hostnames                            |
| `CORS_ALLOWED_ORIGINS` | ✅        | Comma-separated Vercel origin URLs (no localhost)    |
| `MAIL_SERVER`          |          | `smtp.gmail.com`                                     |
| `MAIL_PORT`            |          | `587`                                                |
| `MAIL_USE_TLS`         |          | `true`                                               |
| `MAIL_USERNAME`        | ✅        | Gmail address                                        |
| `MAIL_PASSWORD`        | ✅        | Gmail App Password (not your account password)       |
| `SMTP_FROM`            |          | `SSJewellery <email@gmail.com>`                      |
| `CLOUDINARY_URL`       | ✅        | Full Cloudinary URL                                  |
| `PROXY_FIX_NUM_PROXIES`|          | `1` (Caddy only)                                     |

Generate a secret key:

```bash
python -c "import secrets; print(secrets.token_hex(64))"
```

---

## QA Deployment Flow

1. A developer pushes code (or opens a PR merged) to the **QA `main` branch**.
2. GitHub Actions triggers `deploy-qa.yml`:
   - Installs Python 3.11.
   - Installs `requirements/base.txt`.
   - Runs `pytest tests/`.
   - If tests pass, SSHes to the Contabo server as the deploy user.
   - Runs `/opt/ss-jewellery/deploy/deploy.sh` on the server.
3. `deploy.sh` on the server:
   - Pulls latest `main` from the QA repository.
   - Verifies `.env` exists.
   - Builds the Docker image (with `--no-cache`).
   - Runs `flask db upgrade` via `docker compose run`.
   - Starts containers with `docker compose up -d --remove-orphans`.
   - Polls `http://localhost/health` up to 20 times (100 s total).
   - If unhealthy, prints rollback instructions and exits non-zero (fails the workflow).
   - Prunes dangling images.
   - Prints the deployed commit SHA.

---

## PROD Promotion and Deployment Flow

> Only the project owner can run this workflow. Developers must not have access to the PROD repository.

1. The owner goes to the **QA repository → Actions → "Promote QA to PROD"** and clicks **Run workflow**.
2. GitHub Actions runs `promote-to-prod.yml`:
   - Checks out the QA repository.
   - Clones the PROD repository using `PROD_REPO_TOKEN`.
   - Uses `rsync --delete` to copy application code into the PROD repo clone.
   - **Excludes** `.git`, `.github/workflows`, `.env`, logs, uploads, and cache.
   - Restores the PROD repository's own `.github/workflows/deploy-prod.yml`.
   - Commits only when there are actual changes, with message including the QA commit SHA.
   - Pushes to the PROD repository's `main` branch (no force-push).
3. The push to PROD `main` triggers `deploy-prod.yml` in the PROD repository:
   - Same test → SSH → `deploy.sh` sequence as QA.
   - Uses separate `PROD_SSH_PRIVATE_KEY` and `PROD_SSH_KNOWN_HOSTS` secrets.
   - Runs on the Oracle Cloud server.

---

## GitHub Actions Secrets

### QA Repository Secrets

| Secret                | Description                                                      |
|-----------------------|------------------------------------------------------------------|
| `QA_HOST`             | IP address or hostname of the Contabo VPS                        |
| `QA_USER`             | SSH username on the QA server (e.g., `deploy`)                   |
| `QA_SSH_PRIVATE_KEY`  | Contents of the QA deploy SSH private key (`id_ed25519`)         |
| `QA_SSH_KNOWN_HOSTS`  | Output of `ssh-keyscan <QA_HOST>` (prevents MITM attacks)        |
| `PROD_REPO_TOKEN`     | Fine-grained PAT for the PROD repository (content: write only)   |

### QA Repository Variables (non-secret)

| Variable    | Description                             |
|-------------|-----------------------------------------|
| `PROD_REPO` | Owner/repo of the PROD repository, e.g. `myorg/ss-jewellery-prod` |

### PROD Repository Secrets

| Secret                 | Description                                                      |
|------------------------|------------------------------------------------------------------|
| `PROD_HOST`            | IP address or hostname of the Oracle Cloud instance              |
| `PROD_USER`            | SSH username on the PROD server (e.g., `deploy`)                 |
| `PROD_SSH_PRIVATE_KEY` | Contents of the PROD deploy SSH private key (different from QA!) |
| `PROD_SSH_KNOWN_HOSTS` | Output of `ssh-keyscan <PROD_HOST>`                              |

---

## Server Directories

Both servers use the same directory layout:

```
/opt/ss-jewellery/        ← Git checkout of the repository
├── backend/
├── requirements/
├── deploy/
│   ├── Caddyfile
│   └── deploy.sh
├── migrations/
├── .env                  ← Created manually; NEVER committed to git
├── docker-compose.yml
└── Dockerfile
```

---

## One-Time Server Bootstrap

Run these commands **once** on each server (QA and PROD separately) as root, then switch to the deploy user for all subsequent operations.

```bash
# ── 1. Update the system ────────────────────────────────────────────────────
apt-get update && apt-get upgrade -y

# ── 2. Install Docker ───────────────────────────────────────────────────────
curl -fsSL https://get.docker.com | sh
systemctl enable --now docker

# ── 3. Create a non-root deploy user ───────────────────────────────────────
useradd -m -s /bin/bash deploy
usermod -aG docker deploy

# ── 4. Create the application directory ───────────────────────────────────
mkdir -p /opt/ss-jewellery
chown deploy:deploy /opt/ss-jewellery

# ── 5. Add the QA (or PROD) deploy SSH public key ──────────────────────────
#    Generate the key pair on your LOCAL machine, not on the server:
#      ssh-keygen -t ed25519 -C "deploy-qa" -f ~/.ssh/deploy_qa_ed25519
#    Copy the PUBLIC key content to the server:
su - deploy -c "mkdir -p ~/.ssh && chmod 700 ~/.ssh"
echo "ssh-ed25519 AAAA...your-public-key..." >> /home/deploy/.ssh/authorized_keys
chmod 600 /home/deploy/.ssh/authorized_keys

# ── 6. Allow deploy user to run Docker Compose without sudo ────────────────
#    (already handled by docker group above)

# ── 7. Clone the repository as the deploy user ─────────────────────────────
su - deploy
cd /opt/ss-jewellery
git clone <QA_OR_PROD_REPO_SSH_URL> .
# If using HTTPS with a token instead:
# git clone https://x-access-token:<TOKEN>@github.com/org/repo.git .

# ── 8. Create the .env file ────────────────────────────────────────────────
cp .env.example .env
nano .env           # Fill in all real values — see Environment Variables table

# ── 9. Make the deploy script executable ───────────────────────────────────
chmod +x /opt/ss-jewellery/deploy/deploy.sh

# ── 10. Firewall — expose only ports 22, 80, 443 ──────────────────────────
ufw default deny incoming
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# ── 11. Verify the setup ───────────────────────────────────────────────────
cd /opt/ss-jewellery
bash deploy/deploy.sh
```

---

## Health Check

The `/health` endpoint is a lightweight, unauthenticated GET route:

```
GET https://api.qa.example.com/health
→ 200 OK {"status": "ok", "service": "ss-jewellery-backend"}
```

- Called by Docker's `HEALTHCHECK` directive every 30 seconds.
- Called by Caddy's `health_uri` directive.
- Does **not** expose database credentials, configuration, or stack traces.
- `deploy.sh` polls `http://localhost/health` (via Caddy) before declaring success.

---

## Rollback Procedure

If the new deployment is unhealthy and `deploy.sh` exits with an error:

```bash
# On the server, as the deploy user:
cd /opt/ss-jewellery

# Roll back git to the previous commit
git reset --hard HEAD~1

# Rebuild and restart containers with the previous code
docker compose up -d --build --remove-orphans

# Verify health
curl -fsS http://localhost/health
```

To roll back a specific number of commits:

```bash
# List recent commits
git log --oneline -10

# Roll back to a specific SHA
git reset --hard <COMMIT_SHA>
docker compose up -d --build --remove-orphans
```

---

## Troubleshooting Commands

```bash
# View application logs (last 100 lines, follow)
docker logs ss_jewellery_app --tail 100 -f

# View Caddy logs
docker logs ss_jewellery_caddy --tail 100 -f

# Check container status and health
docker ps -a
docker inspect ss_jewellery_app | python3 -m json.tool | grep -A 10 '"Health"'

# Run a one-off Flask command inside the container
docker compose run --rm -e FLASK_APP=backend.app app flask db current

# Apply database migrations manually
docker compose run --rm -e FLASK_APP=backend.app app flask db upgrade

# Check open ports on the server (PostgreSQL must NOT be listed)
ss -tlnp | grep -E '5432|5000'

# Prune all stopped containers, unused images, and volumes (DESTRUCTIVE)
# Only run if you are sure nothing important is stopped
docker system prune -f
```

---

## Security Checklist

- [ ] `.env` is **not** committed to git (verified by `git status`)
- [ ] `SECRET_KEY` is different between QA and PROD
- [ ] `DATABASE_URL` points to separate Neon accounts in QA and PROD
- [ ] QA and PROD use separate SSH key pairs
- [ ] `CORS_ALLOWED_ORIGINS` contains no `localhost` in QA or PROD
- [ ] `DEBUG=false` in both QA and PROD `.env` files
- [ ] PostgreSQL port 5432 is **not** exposed on either server (`ss -tlnp | grep 5432`)
- [ ] Only ports 22, 80, 443 are open (`ufw status`)
- [ ] The deploy user is **not** root
- [ ] Caddy handles HTTPS termination; the Python port is internal only
- [ ] Cloudinary credentials are separate per environment
- [ ] Flask-Mail credentials are separate per environment
- [ ] No hardcoded secrets remain in `backend/config.py` or `backend/app.py`
- [ ] `PROD_REPO_TOKEN` has the minimum required permission (Contents: write)
- [ ] Developers do not have access to the PROD repository
- [ ] `deploy.sh` never prints secret values (`grep -i secret deploy/deploy.sh`)
