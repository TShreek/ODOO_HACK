#!/usr/bin/env bash
set -euo pipefail

BASE_URL=${BASE_URL:-http://127.0.0.1:8000}

echo "[SMOKE] Root" && curl -sf "$BASE_URL/" >/dev/null && echo OK
echo "[SMOKE] /health" && curl -sf "$BASE_URL/health" >/dev/null && echo OK
echo "[SMOKE] /api/v1/healthz" && curl -sf "$BASE_URL/api/v1/healthz" | grep -q '"ok"' && echo OK

echo "[SMOKE] Masters list (expect auth failure or data)" && curl -s -o /dev/null -w "%{http_code}\n" "$BASE_URL/api/v1/masters/accounts" || true

echo "[SMOKE] Done."