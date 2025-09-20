#!/usr/bin/env bash
set -euo pipefail

BASE_URL="http://127.0.0.1:8000"
USER_LOGIN="demo$(date +%s)"
PASSWORD="Passw0rd!"

echo "Registering user..."
TOKEN_JSON=$(curl -s -X POST "$BASE_URL/register" -H 'Content-Type: application/json' -d '{"login_id":"'$USER_LOGIN'","password":"'$PASSWORD'","full_name":"Demo User"}')
ACCESS=$(echo "$TOKEN_JSON" | python -c 'import sys, json; print(json.load(sys.stdin)["access_token"])')
AUTH="Authorization: Bearer $ACCESS"
echo "Access token acquired"

echo "Creating contact (customer)..."
CONTACT_JSON=$(curl -s -X POST "$BASE_URL/masters/contacts" -H 'Content-Type: application/json' -H "$AUTH" -d '{"name":"Acme Corp","contact_type":"customer","email":"acme@example.com"}')
CONTACT_ID=$(echo "$CONTACT_JSON" | python -c 'import sys,json;print(json.load(sys.stdin)["id"])')
echo "Customer ID: $CONTACT_ID"

echo "Creating product..."
PRODUCT_JSON=$(curl -s -X POST "$BASE_URL/masters/products" -H 'Content-Type: application/json' -H "$AUTH" -d '{"name":"Widget","sku":"WID-001","hsn_code":"1234","unit_price":100.00}')
PRODUCT_ID=$(echo "$PRODUCT_JSON" | python -c 'import sys,json;print(json.load(sys.stdin)["id"])')
echo "Product ID: $PRODUCT_ID"

ORDER_DATE=$(date -u +%Y-%m-%dT%H:%M:%SZ)

echo "Creating SALES ORDER in DRAFT (invoice_on_confirm=false)..."
SO_JSON=$(curl -s -X POST "$BASE_URL/transactions/sales_order" -H 'Content-Type: application/json' -H "$AUTH" -d '{"customer_id":"'$CONTACT_ID'","order_date":"'$ORDER_DATE'","invoice_on_confirm":false,"items":[{"product_id":"'$PRODUCT_ID'","qty":2,"unit_price":150.00,"tax_percent":18}]}' )
SO_TXN_ID=$(echo "$SO_JSON" | python -c 'import sys,json;print(json.load(sys.stdin)["transaction"]["txn_id"])')
echo "Sales Order txn_id: $SO_TXN_ID"

echo "Posting SALES ORDER..."
POST_JSON=$(curl -s -X POST "$BASE_URL/transactions/$SO_TXN_ID/post" -H "$AUTH")
echo "$POST_JSON" | python -m json.tool | sed 's/^/POSTED: /'

echo "Converting to CUSTOMER_INVOICE..."
CONV_JSON=$(curl -s -X POST "$BASE_URL/transactions/$SO_TXN_ID/convert" -H 'Content-Type: application/json' -H "$AUTH" -d '{"target_type":"CUSTOMER_INVOICE"}')
INV_TXN_ID=$(echo "$CONV_JSON" | python -c 'import sys,json;print(json.load(sys.stdin)["transaction"]["txn_id"])')
echo "Invoice txn_id: $INV_TXN_ID"

echo "Applying payment (receipt) fully settling invoice..."
PAYMENT_DATE=$(date -u +%Y-%m-%dT%H:%M:%SZ)
PAY_JSON=$(curl -s -X POST "$BASE_URL/transactions/payment" -H 'Content-Type: application/json' -H "$AUTH" -d '{"direction":"in","amount":354.00,"payment_date":"'$PAYMENT_DATE'","party_type":"customer","party_id":"'$CONTACT_ID'","apply_to_txn_id":"'$INV_TXN_ID'"}')
echo "$PAY_JSON" | python -m json.tool | sed 's/^/PAYMENT: /'

echo "Fetching updated invoice to confirm status..."
INV_FETCH=$(curl -s -X GET "$BASE_URL/transactions/$INV_TXN_ID" -H "$AUTH")
echo "$INV_FETCH" | python -m json.tool | sed 's/^/INVOICE: /'

echo "Dashboard summary after flow:"
SUMMARY=$(curl -s -X GET "$BASE_URL/reports/summary" -H "$AUTH")
echo "$SUMMARY" | python -m json.tool | sed 's/^/SUMMARY: /'

echo "Done."