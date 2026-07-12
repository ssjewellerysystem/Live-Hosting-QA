# ── Stage 1: dependency builder ─────────────────────────────────────────────
# Uses a fixed Python 3.11 slim image.  The builder stage compiles wheels and
# installs packages into /install so they are easy to copy into the runtime
# image without bringing build tools along.
FROM python:3.11-slim AS builder

# Prevent Python from writing .pyc files and buffer stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /build

# Install OS-level build tools needed to compile Python wheels.
# libpq-dev is required by psycopg2-binary.
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy only the requirements first so Docker can cache this layer
# and avoid re-installing packages when only application code changes.
COPY requirements/production.txt requirements/production.txt
COPY requirements/base.txt       requirements/base.txt

# Install Python dependencies into a separate prefix so they are easy to copy.
RUN pip install --upgrade pip \
 && pip install --prefix=/install --no-cache-dir -r requirements/production.txt


# ── Stage 2: runtime image ──────────────────────────────────────────────────
FROM python:3.11-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/home/appuser/.local/bin:$PATH"

# Install only runtime OS dependencies (libpq5 for psycopg2, curl for health check).
RUN apt-get update && apt-get install -y --no-install-recommends \
        libpq5 \
        curl \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root system user so the process cannot write root-owned files.
RUN addgroup --system appgroup \
 && adduser  --system --ingroup appgroup --home /home/appuser appuser

WORKDIR /app

# Copy installed Python packages from the builder stage.
COPY --from=builder /install /usr/local

# Copy application source (owned by appuser so the process cannot write root files).
# The .dockerignore file ensures that frontend/, logs, .env, caches, and secrets
# are excluded from the build context.
COPY --chown=appuser:appgroup . .

# Switch to non-root user
USER appuser

# Expose the internal application port (NOT published to the host — Caddy handles that).
EXPOSE 5000

# Container health check — calls the lightweight /health endpoint.
# start-period gives the app time to run migrations and seed the database on first start.
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -fsS http://localhost:${PORT:-5000}/health || exit 1

# Start Flask via Gunicorn with configurable workers.
# GUNICORN_WORKERS defaults to 2 (suitable for 1-CPU QA server).
# Set GUNICORN_WORKERS=4 in the PROD .env for the 2-CPU Oracle server.
# FLASK_APP must be set so flask db upgrade works in docker compose run.
CMD ["sh", "-c", \
     "exec gunicorn \
          --bind 0.0.0.0:${PORT:-5000} \
          --workers ${GUNICORN_WORKERS:-2} \
          --worker-class sync \
          --timeout ${GUNICORN_TIMEOUT:-120} \
          --keep-alive 5 \
          --access-logfile - \
          --error-logfile - \
          --log-level ${LOG_LEVEL:-info} \
          backend.app:app"]
