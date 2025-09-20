#!/usr/bin/env bash
set -euo pipefail
BASE_URL=${BASE_URL:-http://localhost:8000}
TOKEN=${TOKEN:?"Set TOKEN env var with Bearer JWT"}
cat > /tmp/sample_purchase.json <<'JSON'
{
  "vendor_id": "VENDOR1",
  "items": [
    {"product_id": "p1", "qty": "2", "unit_price": "100.00", "tax_percent": "5"},
    {"product_id": "p2", "qty": "1", "unit_price": "50.00", "tax_percent": "5"}
  ],
  "order_date": "2025-09-20T00:00:00Z",
  "expected_receipt_date": "2025-09-25T00:00:00Z"
}
JSON
curl -s -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d @/tmp/sample_purchase.json "$BASE_URL/transactions/purchase_order" | jq '.'
