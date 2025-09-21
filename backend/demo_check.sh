#!/usr/bin/env bash
set -euo pipefail

# --- config you can tweak if needed ---
DB_USER="appuser"
DB_NAME="accounts_db"
ENV_FILE=".env"
# -------------------------------------

section () {
  echo ""
  echo "=========================="
  echo "▶ $1"
  echo "=========================="
}

# ensure we're at repo root or backend dir
if [[ -f "pyproject.toml" && -d "alembic" ]]; then
  ROOT="."
elif [[ -d "backend" && -f "backend/pyproject.toml" ]]; then
  cd backend
  ROOT="backend"
else
  echo "❌ Run this from repo root or backend/ folder (where pyproject.toml & alembic/ exist)."
  exit 1
fi

# sanity: tools available
command -v uv >/dev/null || { echo "❌ uv not found. Install uv first."; exit 1; }
command -v psql >/dev/null || { echo "❌ psql not found. Install Postgres client."; exit 1; }

# show top of .env
section "Show .env (first lines)"
if [[ -f "$ENV_FILE" ]]; then
  # show first 12 lines so judges can see DB + Kafka config quickly
  sed -n '1,12p' "$ENV_FILE"
else
  echo "⚠️  $ENV_FILE not found"
fi

# alembic: upgrade head (idempotent)
section "Alembic upgrade -> head"
uv run alembic upgrade head

# alembic: current head
section "Alembic current"
uv run alembic current

# alembic: last 5 revisions
section "Alembic history (last 5)"
uv run alembic history -n 5

# prove tables exist
section "Postgres tables in ${DB_NAME}"
psql -U "${DB_USER}" -d "${DB_NAME}" -c "\dt"

# quick async ping via SQLAlchemy
section "Async DB ping (SELECT 1)"
uv run python - <<'PY'
from sqlalchemy import text
from database import engine
import asyncio

async def ping():
    async with engine.begin() as conn:
        r = await conn.execute(text("SELECT 1"))
        print("DB OK:", r.scalar()==1)

asyncio.run(ping())
PY

echo ""
echo "✅ Demo checks completed."
