# Transaction Models - Transaction, JournalEntry for financial records
import uuid
from datetime import datetime
from typing import Optional, List
from decimal import Decimal
from enum import Enum

from sqlalchemy import Column, String, Numeric, DateTime, Text, Boolean, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class TransactionType(str, Enum):
    """Enum for transaction types"""
    SALES_ORDER = "sales_order"
    PURCHASE_ORDER = "purchase_order"
    INVOICE = "invoice"
    BILL = "bill"
    PAYMENT = "payment"
    RECEIPT = "receipt"
    JOURNAL = "journal"


class TransactionStatus(str, Enum):
    """Enum for transaction status"""
    DRAFT = "draft"
    CONFIRMED = "confirmed"
    POSTED = "posted"
    CANCELLED = "cancelled"


class Transaction(Base):
    """
    Main transaction table for sales orders, purchase orders, invoices, etc.
    This feeds the accounting system via Kafka events.
    """
    __tablename__ = "transactions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4
    )
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        nullable=False,
        index=True
    )
    
    # Transaction basic info
    transaction_number: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    transaction_type: Mapped[TransactionType] = mapped_column(String(20), nullable=False)
    transaction_status: Mapped[TransactionStatus] = mapped_column(
        String(20), 
        nullable=False, 
        default=TransactionStatus.DRAFT
    )
    
    # Dates
    transaction_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    due_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Contact and references
    contact_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("contacts.id"),
        nullable=False
    )
    reference: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    # Amounts
    subtotal: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False, default=0.00)
    tax_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False, default=0.00)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False, default=0.00)
    
    # Additional info
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # System fields
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, 
        default=datetime.utcnow, 
        onupdate=datetime.utcnow, 
        nullable=False
    )
    created_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    
    # Kafka processing status
    kafka_processed: Mapped[bool] = mapped_column(Boolean, default=False)
    kafka_processed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Relationships
    contact: Mapped["Contact"] = relationship("Contact")
    transaction_lines: Mapped[List["TransactionLine"]] = relationship(
        "TransactionLine", 
        back_populates="transaction",
        cascade="all, delete-orphan"
    )
    journal_entries: Mapped[List["JournalEntry"]] = relationship(
        "JournalEntry", 
        back_populates="transaction"
    )


class TransactionLine(Base):
    """
    Transaction line items (products/services in a transaction)
    """
    __tablename__ = "transaction_lines"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4
    )
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        nullable=False,
        index=True
    )
    
    # Transaction reference
    transaction_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("transactions.id"),
        nullable=False
    )
    
    # Product and quantities
    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("products.id"),
        nullable=False
    )
    quantity: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False, default=1.0000)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    
    # Tax information
    tax_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("taxes.id"),
        nullable=True
    )
    tax_rate: Mapped[Decimal] = mapped_column(Numeric(10, 4), nullable=False, default=0.0000)
    tax_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False, default=0.00)
    
    # Calculated amounts
    line_total: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False, default=0.00)
    
    # Additional info
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Relationships
    transaction: Mapped["Transaction"] = relationship("Transaction", back_populates="transaction_lines")
    product: Mapped["Product"] = relationship("Product")
    tax: Mapped[Optional["Tax"]] = relationship("Tax")


class JournalEntry(Base):
    """
    Double-entry accounting journal entries.
    Generated from transactions via the accounting engine.
    """
    __tablename__ = "journal_entries"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4
    )
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        nullable=False,
        index=True
    )
    
    # Journal entry info
    entry_number: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    entry_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    description: Mapped[str] = mapped_column(String(255), nullable=False)
    
    # Source transaction reference
    transaction_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("transactions.id"),
        nullable=True  # Some journal entries might be manual
    )
    
    # Accounting details
    account_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("chart_of_accounts.id"),
        nullable=False
    )
    
    # Double-entry amounts (one will be zero, other will have value)
    debit_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False, default=0.00)
    credit_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False, default=0.00)
    
    # Additional references
    contact_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("contacts.id"),
        nullable=True
    )
    
    # System fields
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    created_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    
    # Relationships
    transaction: Mapped[Optional["Transaction"]] = relationship("Transaction", back_populates="journal_entries")
    account: Mapped["ChartOfAccounts"] = relationship("ChartOfAccounts")
    contact: Mapped[Optional["Contact"]] = relationship("Contact")


# Import the existing models to ensure relationships work
from .masters import Contact, Product, Tax, ChartOfAccounts