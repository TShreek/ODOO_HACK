#!/usr/bin/env bash
set -euo pipefail
BASE_URL=${BASE_URL:-http://localhost:8000}
TOKEN=${TOKEN:-}
if [ -z "$TOKEN" ]; then
  echo "Provide TOKEN env var (Bearer JWT) or disable auth for local testing." >&2
fi
# This script assumes accounts already seeded by startup; placeholder for custom adds
curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/v1/reports/balance-sheet" | jq '.' || true
