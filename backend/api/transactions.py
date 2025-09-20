# backend/api/transactions.py
import uuid, datetime
from decimal import Decimal
from fastapi import APIRouter
from database import AsyncSessionLocal
from config import settings
from services.tx_headers import create_transaction_header
from services.kafka_producer import publish_financial_event

router = APIRouter(prefix="/transactions", tags=["transactions"])

@router.post("/invoice/publish")
async def publish_invoice_event():
    now = datetime.datetime.utcnow().replace(microsecond=0)
    invoice_number = "INV-0001"
    tenant_id = settings.TEST_TENANT_ID
    contact_id = settings.DEV_CONTACT_ID

    net = Decimal("1000.00")
    tax = Decimal("180.00")
    gross = net + tax

    async with AsyncSessionLocal() as session:
        async with session.begin():
            tx_id = await create_transaction_header(
                session,
                tenant_id=tenant_id,
                transaction_number=invoice_number,
                contact_id=contact_id,
                transaction_date=now,
                due_date=now,
                subtotal=net,
                tax_amount=tax,
                total_amount=gross,
                created_by=settings.SYSTEM_USER_ID,
            )

    event = {
        "event_id": str(uuid.uuid4()),
        "schema_version": 1,
        "tenant_id": tenant_id,
        "transaction_id": str(tx_id),
        "type": "invoice_created",
        "occurred_at": now.isoformat() + "Z",
        "payload": {
            "invoice_number": invoice_number,
            "invoice_date": now.date().isoformat(),
            "due_date": now.date().isoformat(),
            "lines": [{"product_id": str(uuid.uuid4()), "qty": 1, "unit_price": float(net), "tax_rate": 0.18}],
            "currency": "INR",
        },
    }
    publish_financial_event(event)
    return {"status": "queued", "transaction_id": str(tx_id)}

@router.post("/customer-payment/publish")
async def publish_customer_payment_event():
    now = datetime.datetime.utcnow().replace(microsecond=0)
    payment_number = "PAY-0001"
    tenant_id = settings.TEST_TENANT_ID
    contact_id = settings.DEV_CONTACT_ID

    amount = Decimal("500.00")

    async with AsyncSessionLocal() as session:
        async with session.begin():
            tx_id = await create_transaction_header(
                session,
                tenant_id=tenant_id,
                transaction_number=payment_number,
                contact_id=contact_id,
                transaction_date=now,
                due_date=now,
                subtotal=amount,
                tax_amount=Decimal("0.00"),
                total_amount=amount,
                created_by=settings.SYSTEM_USER_ID,
            )

    event = {
        "event_id": str(uuid.uuid4()),
        "schema_version": 1,
        "tenant_id": tenant_id,
        "transaction_id": str(tx_id),
        "type": "customer_payment_received",
        "occurred_at": now.isoformat() + "Z",
        "payload": {
            "payment_number": payment_number,
            "payment_date": now.date().isoformat(),
            "amount": float(amount),
            "currency": "INR",
        },
    }
    publish_financial_event(event)
    return {"status": "queued", "transaction_id": str(tx_id)}

@router.post("/purchases/vendor-bill/publish")
async def publish_vendor_bill_event():
    now = datetime.datetime.utcnow().replace(microsecond=0)
    bill_number = "BILL-0001"
    tenant_id = settings.TEST_TENANT_ID
    contact_id = settings.DEV_CONTACT_ID

    net = Decimal("500.00")
    tax = net * Decimal("0.18")
    gross = net + tax

    async with AsyncSessionLocal() as session:
        async with session.begin():
            tx_id = await create_transaction_header(
                session,
                tenant_id=tenant_id,
                transaction_number=bill_number,
                contact_id=contact_id,
                transaction_date=now,
                due_date=now,
                subtotal=net,
                tax_amount=tax,
                total_amount=gross,
                created_by=settings.SYSTEM_USER_ID,
            )

    event = {
        "event_id": str(uuid.uuid4()),
        "schema_version": 1,
        "tenant_id": tenant_id,
        "transaction_id": str(tx_id),
        "type": "bill_created",
        "occurred_at": now.isoformat() + "Z",
        "payload": {
            "bill_number": bill_number,
            "bill_date": now.date().isoformat(),
            "lines": [{"qty": 1, "unit_price": float(net), "tax_rate": 0.18}],
            "expense_account_id": settings.EXPENSE_ACCOUNT_ID,
            "ap_account_id": settings.AP_ACCOUNT_ID,
            "input_tax_account_id": settings.INPUT_TAX_ACCOUNT_ID,
        },
    }
    publish_financial_event(event)
    return {"status": "queued", "transaction_id": str(tx_id)}

@router.post("/purchases/vendor-payment/publish")
async def publish_vendor_payment_event():
    now = datetime.datetime.utcnow().replace(microsecond=0)
    payment_number = "PAY-0002"
    tenant_id = settings.TEST_TENANT_ID
    contact_id = settings.DEV_CONTACT_ID

    amount = Decimal("590.00")

    async with AsyncSessionLocal() as session:
        async with session.begin():
            tx_id = await create_transaction_header(
                session,
                tenant_id=tenant_id,
                transaction_number=payment_number,
                contact_id=contact_id,
                transaction_date=now,
                due_date=now,
                subtotal=amount,
                tax_amount=Decimal("0.00"),
                total_amount=amount,
                created_by=settings.SYSTEM_USER_ID,
            )

    event = {
        "event_id": str(uuid.uuid4()),
        "schema_version": 1,
        "tenant_id": tenant_id,
        "transaction_id": str(tx_id),
        "type": "vendor_payment_recorded",
        "occurred_at": now.isoformat() + "Z",
        "payload": {
            "amount": float(amount),
            "method": "bank",
            "ap_account_id": settings.AP_ACCOUNT_ID,
            "cash_account_id": settings.CASH_ACCOUNT_ID,
            "bank_account_id": settings.BANK_ACCOUNT_ID,
            "bill_id": None,  # Optional link to bill
        },
    }
    publish_financial_event(event)
    return {"status": "queued", "transaction_id": str(tx_id)}
