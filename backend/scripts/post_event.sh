#!/usr/bin/env bash
set -euo pipefail
BASE_URL=${BASE_URL:-http://localhost:8000}
TOKEN=${TOKEN:-}
EVENT_FILE=${1:-}
if [ -z "$EVENT_FILE" ]; then
  echo "Usage: $0 event.json" >&2; exit 1; fi
curl -s -X POST "$BASE_URL/events/transaction" \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $TOKEN" \
  --data @"$EVENT_FILE" | jq '.'
