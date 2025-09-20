#!/usr/bin/env bash
set -euo pipefail
BASE=${BASE:-http://127.0.0.1:8000}
USER=conv$RANDOM
PASS=pass1234

reg(){ curl -s -X POST "$BASE/register" -H 'Content-Type: application/json' -d '{"login_id":"'$USER'","password":"'$PASS'","email_id":"'$USER'@ex.com","name":"Demo User"}'; }
TOKEN_JSON=$(reg)
ACCESS=$(echo "$TOKEN_JSON" | python -c 'import sys,json;print(json.load(sys.stdin)["access_token"])')
AUTH="Authorization: Bearer $ACCESS"

echo "Create SALES ORDER (draft)" >&2
SO=$(curl -s -X POST "$BASE/transactions/sales_order" -H "$AUTH" -H 'Content-Type: application/json' -d '{"customer_id":"00000000-0000-0000-0000-000000000001","items":[{"product_id":"00000000-0000-0000-0000-000000000001","qty":"1","unit_price":"150.00","tax_percent":"0"}],"order_date":"2025-09-21T10:00:00Z","invoice_on_confirm":false}')
SO_ID=$(echo "$SO" | python -c 'import sys,json;print(json.load(sys.stdin)["transaction"]["txn_id"])')

echo "Post draft SO" >&2
curl -s -X POST "$BASE/transactions/$SO_ID/post" -H "$AUTH" >/dev/null

echo "Convert SO -> CUSTOMER_INVOICE" >&2
INV=$(curl -s -X POST "$BASE/transactions/$SO_ID/convert" -H "$AUTH" -H 'Content-Type: application/json' -d '{"target_type":"CUSTOMER_INVOICE"}')
INV_ID=$(echo "$INV" | python -c 'import sys,json;print(json.load(sys.stdin)["transaction"]["txn_id"])')

echo "Apply payment to invoice" >&2
curl -s -X POST "$BASE/transactions/payment" -H "$AUTH" -H 'Content-Type: application/json' -d '{"direction":"in","amount":"150.00","payment_date":"2025-09-21T11:00:00Z","apply_to_txn_id":"'$INV_ID'"}' >/dev/null

echo "Fetch invoice status" >&2
curl -s -H "$AUTH" "$BASE/transactions/$INV_ID" | jq '.status'
