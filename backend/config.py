"""
backend/config.py — Application configuration driven entirely by environment variables.

Environment variables are loaded from the server-side .env file via python-dotenv.
No secrets, database URLs, or passwords are hard-coded here.
"""

import os
import logging
from urllib.parse import urlparse, urlunparse, parse_qs, urlencode
import socket

from dotenv import load_dotenv

# Load .env from the repo root (one level above the backend/ package)
_here = os.path.dirname(os.path.abspath(__file__))
_root = os.path.dirname(_here)
load_dotenv(os.path.join(_root, ".env"), override=False)


# ── Neon PostgreSQL helper ──────────────────────────────────────────────────
def _resolve_neon_uri(uri: str) -> str:
    """
    Neon PostgreSQL requires the endpoint-id hint in the connection options when
    connecting via an IPv4 address (needed because Docker may not support IPv6).
    Falls back to the original URI if anything fails.
    """
    if not uri:
        return uri
    try:
        parsed = urlparse(uri)
        hostname = parsed.hostname or ""
        if hostname.endswith(".neon.tech") or "neon" in hostname:
            addrinfo = socket.getaddrinfo(
                hostname, parsed.port or 5432, socket.AF_INET, socket.SOCK_STREAM
            )
            if addrinfo:
                ipv4 = addrinfo[0][4][0]
                endpoint_id = hostname.split(".")[0]

                port_str = f":{parsed.port}" if parsed.port else ""
                auth_str = ""
                if parsed.username:
                    auth_str += parsed.username
                    if parsed.password:
                        auth_str += f":{parsed.password}"
                    auth_str += "@"

                new_netloc = f"{auth_str}{ipv4}{port_str}"
                query_params = parse_qs(parsed.query)
                query_params["options"] = [f"endpoint={endpoint_id}"]
                new_query = urlencode(query_params, doseq=True)
                return urlunparse(parsed._replace(netloc=new_netloc, query=new_query))
    except Exception:
        pass
    return uri


def _require(name: str) -> str:
    """Raise at startup if a required environment variable is missing."""
    value = os.environ.get(name)
    if not value:
        raise RuntimeError(
            f"Required environment variable '{name}' is not set. "
            "Check your server-side .env file."
        )
    return value


# ── Build the database URI ───────────────────────────────────────────────────
_raw_db_uri = os.environ.get("DATABASE_URL") or os.environ.get("DATABASE_URI") or ""
# Heroku/Render/Neon sometimes return postgres:// — SQLAlchemy needs postgresql://
if _raw_db_uri.startswith("postgres://"):
    _raw_db_uri = _raw_db_uri.replace("postgres://", "postgresql://", 1)


class Config:
    """Single configuration class shared by QA and PROD.

    All tunables are read from environment variables.
    """

    # ── Security ──────────────────────────────────────────────────────────────
    SECRET_KEY: str = _require("SECRET_KEY")

    # ── Debug / environment ───────────────────────────────────────────────────
    DEBUG: bool = os.environ.get("DEBUG", "false").lower() in ("true", "1", "yes")
    APP_ENV: str = os.environ.get("APP_ENV", "production")
    LOG_LEVEL: str = os.environ.get("LOG_LEVEL", "INFO").upper()

    # ── OTP mode — only expose OTP in response during local development ───────
    OTP_MODE: str = os.environ.get("OTP_MODE", "production")

    # ── Database ──────────────────────────────────────────────────────────────
    SQLALCHEMY_DATABASE_URI: str = _resolve_neon_uri(_raw_db_uri) if _raw_db_uri else ""
    SQLALCHEMY_TRACK_MODIFICATIONS: bool = False
    SQLALCHEMY_ECHO: bool = DEBUG  # Only echo SQL in debug mode
    SQLALCHEMY_ENGINE_OPTIONS: dict = {
        "pool_pre_ping": True,          # Drop stale connections automatically
        "pool_recycle": 300,            # Recycle connections every 5 minutes
        "pool_size": 5,
        "max_overflow": 10,
    }

    # ── CORS / Allowed hosts ──────────────────────────────────────────────────
    ALLOWED_HOSTS: list = [
        h.strip()
        for h in os.environ.get("ALLOWED_HOSTS", "").split(",")
        if h.strip()
    ]
    CORS_ALLOWED_ORIGINS: list = [
        o.strip()
        for o in os.environ.get("CORS_ALLOWED_ORIGINS", "").split(",")
        if o.strip()
    ]

    # ── Flask-Mail ────────────────────────────────────────────────────────────
    MAIL_SERVER: str   = os.environ.get("MAIL_SERVER", "smtp.gmail.com")
    MAIL_PORT: int     = int(os.environ.get("MAIL_PORT", 587))
    MAIL_USE_TLS: bool = os.environ.get("MAIL_USE_TLS", "true").lower() in ("true", "1", "yes")
    MAIL_USE_SSL: bool = os.environ.get("MAIL_USE_SSL", "false").lower() in ("true", "1", "yes")
    MAIL_USERNAME: str = os.environ.get("MAIL_USERNAME") or os.environ.get("EMAIL_ADDRESS", "")
    MAIL_PASSWORD: str = os.environ.get("MAIL_PASSWORD") or os.environ.get("EMAIL_APP_PASSWORD", "")

    _default_sender = MAIL_USERNAME or "no-reply@ssjewellery.com"
    MAIL_DEFAULT_SENDER: str = (
        os.environ.get("SMTP_FROM")
        or f"SSJewellery <{_default_sender}>"
    )

    # ── Cloudinary (optional — used for image uploads) ────────────────────────
    CLOUDINARY_URL: str = os.environ.get("CLOUDINARY_URL", "")

    # ── Proxy / HTTPS ─────────────────────────────────────────────────────────
    # Caddy sets X-Forwarded-Proto; Flask needs this to generate correct URLs
    PREFERRED_URL_SCHEME: str = "https"
    PROXY_FIX_NUM_PROXIES: int = int(os.environ.get("PROXY_FIX_NUM_PROXIES", 1))


def configure_logging(app) -> None:
    """Set up structured JSON-style logging to stdout."""
    log_level = getattr(logging, app.config.get("LOG_LEVEL", "INFO"), logging.INFO)

    handler = logging.StreamHandler()
    handler.setLevel(log_level)
    formatter = logging.Formatter(
        fmt='{"time": "%(asctime)s", "level": "%(levelname)s", '
            '"logger": "%(name)s", "message": "%(message)s"}',
        datefmt="%Y-%m-%dT%H:%M:%S",
    )
    handler.setFormatter(formatter)

    # Replace Flask's default handlers with the structured one
    app.logger.handlers = [handler]
    app.logger.setLevel(log_level)
    app.logger.propagate = False

    # Also configure the root logger so SQLAlchemy / libraries use the same level
    logging.basicConfig(level=log_level, handlers=[handler], force=True)
