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
