import uuid
from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, ConfigDict


class JournalLineBase(BaseModel):
    account_id: uuid.UUID
    description: Optional[str] = None
    debit: Decimal = Decimal("0")
    credit: Decimal = Decimal("0")
    partner_id: Optional[uuid.UUID] = None
    product_id: Optional[uuid.UUID] = None
    tax_id: Optional[uuid.UUID] = None


class JournalLineCreate(JournalLineBase):
    pass


class JournalLineRead(JournalLineBase):
    id: uuid.UUID
    tenant_id: uuid.UUID
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class JournalEntryBase(BaseModel):
    entry_date: Optional[datetime] = None
    reference: Optional[str] = None
    doc_type: Optional[str] = None
    doc_id: Optional[uuid.UUID] = None


class JournalEntryCreate(JournalEntryBase):
    lines: List[JournalLineCreate]


class JournalEntryRead(JournalEntryBase):
    id: uuid.UUID
    tenant_id: uuid.UUID
    posted_by: Optional[uuid.UUID] = None
    created_at: datetime
    lines: List[JournalLineRead] = []
    model_config = ConfigDict(from_attributes=True)


class StockMoveBase(BaseModel):
    product_id: uuid.UUID
    ref_doc_type: Optional[str] = None
    ref_doc_id: Optional[uuid.UUID] = None
    qty_in: Decimal = Decimal("0")
    qty_out: Decimal = Decimal("0")
    unit_cost: Decimal = Decimal("0")
    total_cost: Decimal = Decimal("0")


class StockMoveCreate(StockMoveBase):
    pass


class StockMoveRead(StockMoveBase):
    id: uuid.UUID
    tenant_id: uuid.UUID
    move_date: datetime
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


# Payment Schemas
class PaymentAllocationBase(BaseModel):
    journal_entry_id: uuid.UUID
    allocated_amount: Decimal


class PaymentAllocationCreate(PaymentAllocationBase):
    pass


class PaymentAllocationRead(PaymentAllocationBase):
    id: uuid.UUID
    tenant_id: uuid.UUID
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class PaymentBase(BaseModel):
    partner_id: uuid.UUID
    direction: str  # inbound/outbound
    method: str = "cash"
    amount: Decimal
    currency: str = "INR"
    payment_date: Optional[datetime] = None


class PaymentCreate(PaymentBase):
    allocations: List[PaymentAllocationCreate] = []


class PaymentRead(PaymentBase):
    id: uuid.UUID
    tenant_id: uuid.UUID
    status: str
    remaining_amount: Decimal
    created_at: datetime
    allocations: List[PaymentAllocationRead] = []
    model_config = ConfigDict(from_attributes=True)
