import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional, List

from sqlalchemy import String, DateTime, ForeignKey, Numeric, CheckConstraint, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class JournalEntry(Base):
    __tablename__ = "journal_entries"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)
    entry_date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    reference: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    doc_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    doc_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), nullable=True)
    posted_by: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    txn_id: Mapped[Optional[str]] = mapped_column(String(100), unique=True, nullable=True, index=True)

    lines: Mapped[List["JournalLine"]] = relationship(
        "JournalLine", back_populates="entry", cascade="all, delete-orphan"
    )


class JournalLine(Base):
    __tablename__ = "journal_lines"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)
    entry_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("journal_entries.id", ondelete="CASCADE"), nullable=False, index=True)
    account_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("chart_of_accounts.id"), nullable=False, index=True)
    partner_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("contacts.id"), nullable=True, index=True)
    product_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=True, index=True)
    tax_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("taxes.id"), nullable=True, index=True)
    description: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    debit: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=0, nullable=False)
    credit: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    entry: Mapped[JournalEntry] = relationship("JournalEntry", back_populates="lines")

    __table_args__ = (
        CheckConstraint("NOT (debit > 0 AND credit > 0)", name="ck_journal_line_not_both"),
        CheckConstraint("NOT (debit = 0 AND credit = 0)", name="ck_journal_line_not_zero"),
        Index("ix_journal_lines_tenant_account_created", "tenant_id", "account_id", "created_at"),
        Index("ix_journal_lines_tenant_partner_created", "tenant_id", "partner_id", "created_at"),
    )


class StockMove(Base):
    __tablename__ = "stock_moves"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)
    product_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False, index=True)
    move_date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    ref_doc_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    ref_doc_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), nullable=True)
    qty_in: Mapped[Decimal] = mapped_column(Numeric(14, 4), default=0, nullable=False)
    qty_out: Mapped[Decimal] = mapped_column(Numeric(14, 4), default=0, nullable=False)
    unit_cost: Mapped[Decimal] = mapped_column(Numeric(14, 4), default=0, nullable=False)
    total_cost: Mapped[Decimal] = mapped_column(Numeric(14, 4), default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index("ix_stock_moves_tenant_product_created", "tenant_id", "product_id", "created_at"),
    )
