# backend/api/transactions.py
from fastapi import APIRouter, Depends, Body
from pydantic import BaseModel
from datetime import datetime, timezone
import uuid
from services.kafka_producer import publish_financial_event
from config import settings

router = APIRouter(prefix="/transactions", tags=["transactions"])

# ---------- A) CUSTOMER PAYMENT ----------
class CustomerPaymentIn(BaseModel):
    amount: float
    method: str  # "cash" or "bank"
    note: str | None = None
    invoice_id: str | None = None  # optional link

@router.post("/customer-payment/publish")
async def publish_customer_payment(body: CustomerPaymentIn):
    tx_id = str(uuid.uuid4())
    event = {
        "event_id": str(uuid.uuid4()),
        "schema_version": 1,
        "tenant_id": settings.TEST_TENANT_ID,
        "transaction_id": tx_id,
        "type": "payment_recorded",
        "occurred_at": datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00","Z"),
        "payload": {
            "amount": body.amount,
            "method": body.method.lower().strip(),
            "note": body.note,
            "invoice_id": body.invoice_id,
            # accounts (defaults from env)
            "ar_account_id": settings.AR_ACCOUNT_ID,
            "cash_account_id": settings.CASH_ACCOUNT_ID,
            "bank_account_id": settings.BANK_ACCOUNT_ID,
        },
    }
    publish_financial_event(event)
    return {"status": "queued", "transaction_id": tx_id}

# ---------- B) VENDOR BILL ----------
class VendorBillLine(BaseModel):
    qty: float = 1
    unit_price: float
    tax_rate: float = 0

class VendorBillIn(BaseModel):
    bill_number: str
    lines: list[VendorBillLine]

@router.post("/purchases/vendor-bill/publish")
async def publish_vendor_bill(body: VendorBillIn):
    tx_id = str(uuid.uuid4())
    event = {
        "event_id": str(uuid.uuid4()),
        "schema_version": 1,
        "tenant_id": settings.TEST_TENANT_ID,
        "transaction_id": tx_id,
        "type": "bill_created",
        "occurred_at": datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00","Z"),
        "payload": {
            "bill_number": body.bill_number,
            "lines": [l.model_dump() for l in body.lines],
            # accounts
            "expense_account_id": settings.EXPENSE_ACCOUNT_ID,
            "ap_account_id": settings.AP_ACCOUNT_ID,
            "input_tax_account_id": settings.INPUT_TAX_ACCOUNT_ID,
        },
    }
    publish_financial_event(event)
    return {"status": "queued", "transaction_id": tx_id}

# ---------- C) VENDOR PAYMENT ----------
class VendorPaymentIn(BaseModel):
    amount: float
    method: str  # "cash" or "bank"
    note: str | None = None
    bill_id: str | None = None

@router.post("/purchases/vendor-payment/publish")
async def publish_vendor_payment(body: VendorPaymentIn):
    tx_id = str(uuid.uuid4())
    event = {
        "event_id": str(uuid.uuid4()),
        "schema_version": 1,
        "tenant_id": settings.TEST_TENANT_ID,
        "transaction_id": tx_id,
        "type": "vendor_payment_recorded",
        "occurred_at": datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00","Z"),
        "payload": {
            "amount": body.amount,
            "method": body.method.lower().strip(),
            "note": body.note,
            "bill_id": body.bill_id,
            # accounts
            "ap_account_id": settings.AP_ACCOUNT_ID,
            "cash_account_id": settings.CASH_ACCOUNT_ID,
            "bank_account_id": settings.BANK_ACCOUNT_ID,
        },
    }
    publish_financial_event(event)
    return {"status": "queued", "transaction_id": tx_id}
