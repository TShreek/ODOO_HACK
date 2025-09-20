# backend/services/tx_headers.py
from datetime import datetime
from decimal import Decimal
import uuid

from sqlalchemy.ext.asyncio import AsyncSession
from models.transactions import Transaction, TransactionType, TransactionStatus


async def create_transaction_header(
    session: AsyncSession,
    *,
    tenant_id: str,
    transaction_number: str,
    contact_id: str,
    transaction_type: TransactionType = TransactionType.INVOICE,
    transaction_date: datetime,
    due_date: datetime | None,
    subtotal: Decimal,
    tax_amount: Decimal,
    total_amount: Decimal,
    created_by: str,
) -> uuid.UUID:
    """Insert a minimal transactions header row and return its id."""
    tx = Transaction(
        tenant_id=tenant_id,
        transaction_number=transaction_number,
        transaction_type=transaction_type.value,
        transaction_status=TransactionStatus.CONFIRMED.value,
        transaction_date=transaction_date,
        due_date=due_date,
        contact_id=contact_id,
        subtotal=subtotal,
        tax_amount=tax_amount,
        total_amount=total_amount,
        created_by=created_by,
        kafka_processed=False,
    )
    session.add(tx)
    await session.flush()  # assigns tx.id from DB
    return tx.id
