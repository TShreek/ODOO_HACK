#!/usr/bin/env bash
set -euo pipefail
BASE=${BASE:-http://127.0.0.1:8000}
USER=demo$RANDOM
PASS=pass1234

echo "Register user..." >&2
TOKEN_JSON=$(curl -s -X POST "$BASE/register" -H 'Content-Type: application/json' -d '{"login_id":"'$USER'","password":"'$PASS'","email_id":"'$USER'@ex.com","name":"Demo User"}')
ACCESS=$(echo "$TOKEN_JSON" | python -c 'import sys,json;print(json.load(sys.stdin)["access_token"])')
AUTH="Authorization: Bearer $ACCESS"

echo "Create purchase order (auto_post)" >&2
curl -s -X POST "$BASE/transactions/purchase_order" -H "$AUTH" -H 'Content-Type: application/json' -d '{"vendor_id":"00000000-0000-0000-0000-000000000001","items":[{"product_id":"00000000-0000-0000-0000-000000000001","qty":"1","unit_price":"50.00","tax_percent":"0"}],"order_date":"2025-09-21T10:00:00Z","expected_receipt_date":"2025-09-21T10:00:00Z","auto_post":true}' >/dev/null || true

sleep 1

echo "Fetch summary" >&2
curl -s -H "$AUTH" "$BASE/reports/summary" | jq . || true
