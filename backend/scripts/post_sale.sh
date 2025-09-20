#!/usr/bin/env bash
set -euo pipefail
BASE_URL=${BASE_URL:-http://localhost:8000}
TOKEN=${TOKEN:?"Set TOKEN env var with Bearer JWT"}
cat > /tmp/sample_sale.json <<'JSON'
{
  "customer_id": "CUSTOMER1",
  "items": [
    {"product_id": "p1", "qty": "3", "unit_price": "19.99", "tax_percent": "10", "discount": "1.00"}
  ],
  "order_date": "2025-09-20T00:00:00Z"
}
JSON
curl -s -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d @/tmp/sample_sale.json "$BASE_URL/transactions/sales_order" | jq '.'
