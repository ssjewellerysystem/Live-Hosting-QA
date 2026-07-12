# ── Stage 1: dependency builder ─────────────────────────────────────────────
FROM python:3.11-slim AS builder

# Prevent Python from writing .pyc files and buffer stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /build

# Install OS-level build tools needed to compile Python wheels
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy only the requirements first so Docker can cache this layer
COPY requirements/production.txt requirements/production.txt
COPY requirements/base.txt       requirements/base.txt

# Install Python dependencies into a separate prefix so they are easy to copy
RUN pip install --upgrade pip \
 && pip install --prefix=/install --no-cache-dir -r requirements/production.txt


# ── Stage 2: runtime image ──────────────────────────────────────────────────
FROM python:3.11-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/home/appuser/.local/bin:$PATH"

# Install only runtime OS dependencies (libpq for psycopg2-binary)
RUN apt-get update && apt-get install -y --no-install-recommends \
        libpq5 \
        curl \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root system user
RUN addgroup --system appgroup \
 && adduser  --system --ingroup appgroup --home /home/appuser appuser

WORKDIR /app

# Copy installed Python packages from the builder stage
COPY --from=builder /install /usr/local

# Copy application source (owned by appuser so the process cannot write root files)
COPY --chown=appuser:appgroup . .

# Switch to non-root user
USER appuser

# Expose the internal application port (NOT published to the host — done via Caddy)
EXPOSE 5000

# Container health check — calls the lightweight /health endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=45s --retries=3 \
    CMD curl -fsS http://localhost:5000/health || exit 1

# Start Flask via Gunicorn with 2-4 synchronous workers.
# The PORT environment variable defaults to 5000.
CMD ["sh", "-c", \
     "exec gunicorn \
          --bind 0.0.0.0:${PORT:-5000} \
          --workers ${GUNICORN_WORKERS:-2} \
          --worker-class sync \
          --timeout 120 \
          --keep-alive 5 \
          --access-logfile - \
          --error-logfile - \
          --log-level ${LOG_LEVEL:-info} \
          backend.app:app"]
