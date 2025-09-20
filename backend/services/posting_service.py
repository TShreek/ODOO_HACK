import uuid
from decimal import Decimal
from typing import List
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from models.ledger import JournalEntry, JournalLine
from models.payments import Payment, PaymentAllocation
from models.masters import ChartOfAccounts, Contact, Product


class PostingError(Exception):
    pass


async def create_journal_entry(
    session: AsyncSession,
    tenant_id: uuid.UUID,
    lines: List[dict],
    reference: str | None = None,
    doc_type: str | None = None,
    doc_id: uuid.UUID | None = None,
    posted_by: uuid.UUID | None = None,
    entry_date: datetime | None = None,
) -> JournalEntry:
    entry_date = entry_date or datetime.utcnow()

    total_debit = Decimal("0")
    total_credit = Decimal("0")
    jl_models: List[JournalLine] = []
    for l in lines:
        debit = Decimal(str(l.get("debit", 0)))
        credit = Decimal(str(l.get("credit", 0)))
        if debit > 0 and credit > 0:
            raise PostingError("Line cannot have both debit and credit")
        if debit == 0 and credit == 0:
            raise PostingError("Line cannot be zero on both sides")
        jl_models.append(
            JournalLine(
                tenant_id=tenant_id,
                account_id=l["account_id"],
                partner_id=l.get("partner_id"),
                product_id=l.get("product_id"),
                tax_id=l.get("tax_id"),
                description=l.get("description"),
                debit=debit,
                credit=credit,
            )
        )
        total_debit += debit
        total_credit += credit

    if total_debit != total_credit:
        raise PostingError("Journal not balanced: debit!=credit")

    entry = JournalEntry(
        tenant_id=tenant_id,
        entry_date=entry_date,
        reference=reference,
        doc_type=doc_type,
        doc_id=doc_id,
        posted_by=posted_by,
        lines=jl_models,
    )
    session.add(entry)
    await session.flush()  # assign IDs
    return entry


# Placeholder simple invoice posting using existing products & contacts.
async def post_simple_invoice(
    session: AsyncSession,
    tenant_id: uuid.UUID,
    customer_id: uuid.UUID,
    product_id: uuid.UUID,
    quantity: Decimal,
    unit_price: Decimal,
    sales_account_code: str = "4000",
    ar_account_code: str = "1100",
    output_tax_account_code: str = "4100",
    cogs_account_code: str = "5100",
    inventory_account_code: str = "1200",
    tax_rate: Decimal = Decimal("0"),
    posted_by: uuid.UUID | None = None,
) -> JournalEntry:
    # Validate foreign keys (simple existence check)
    await session.execute(select(Contact).where(Contact.id == customer_id, Contact.tenant_id == tenant_id))
    await session.execute(select(Product).where(Product.id == product_id, Product.tenant_id == tenant_id))

    def account_id(code: str) -> uuid.UUID:
        q = select(ChartOfAccounts).where(
            ChartOfAccounts.account_code == code,
            ChartOfAccounts.tenant_id == tenant_id,
        )
        res = session.execute(q)
        return res

    # Fetch accounts
    ar_acc = await session.scalar(select(ChartOfAccounts.id).where(ChartOfAccounts.account_code == ar_account_code, ChartOfAccounts.tenant_id == tenant_id))
    sales_acc = await session.scalar(select(ChartOfAccounts.id).where(ChartOfAccounts.account_code == sales_account_code, ChartOfAccounts.tenant_id == tenant_id))
    tax_acc = await session.scalar(select(ChartOfAccounts.id).where(ChartOfAccounts.account_code == output_tax_account_code, ChartOfAccounts.tenant_id == tenant_id))
    cogs_acc = await session.scalar(select(ChartOfAccounts.id).where(ChartOfAccounts.account_code == cogs_account_code, ChartOfAccounts.tenant_id == tenant_id))
    inv_acc = await session.scalar(select(ChartOfAccounts.id).where(ChartOfAccounts.account_code == inventory_account_code, ChartOfAccounts.tenant_id == tenant_id))
    if not (ar_acc and sales_acc and tax_acc and cogs_acc and inv_acc):
        raise PostingError("Required accounts missing for invoice posting")

    subtotal = (quantity * unit_price).quantize(Decimal("0.01"))
    tax_amount = (subtotal * tax_rate / Decimal("100")).quantize(Decimal("0.01"))
    total = subtotal + tax_amount

    lines = [
        {"account_id": ar_acc, "partner_id": customer_id, "debit": total, "description": "Invoice AR"},
        {"account_id": sales_acc, "partner_id": customer_id, "credit": subtotal, "description": "Sales"},
    ]
    if tax_amount > 0:
        lines.append({"account_id": tax_acc, "partner_id": customer_id, "credit": tax_amount, "description": "Output Tax"})

    # COGS / Inventory posting using average cost
    # Import locally to avoid circular import
    from services.inventory_service import record_sale_issue, compute_moving_average_cost
    avg_cost = await compute_moving_average_cost(session, tenant_id, product_id)
    cogs_amount = (avg_cost * quantity).quantize(Decimal("0.01"))
    if cogs_amount > 0:
        await record_sale_issue(session, tenant_id, product_id, quantity, "invoice", None)
        lines.append({"account_id": cogs_acc, "partner_id": customer_id, "debit": cogs_amount, "description": "COGS"})
        lines.append({"account_id": inv_acc, "partner_id": customer_id, "credit": cogs_amount, "description": "Inventory"})

    entry = await create_journal_entry(
        session=session,
        tenant_id=tenant_id,
        lines=lines,
        reference="INV",
        doc_type="invoice",
        doc_id=None,
        posted_by=posted_by,
    )
    await session.commit()
    return entry


async def post_payment(
    session: AsyncSession,
    tenant_id: uuid.UUID,
    partner_id: uuid.UUID,
    amount: Decimal,
    direction: str,  # inbound (customer pays us) or outbound (we pay vendor)
    method: str = "cash",
    ar_account_code: str = "1100",
    ap_account_code: str = "2000",
    cash_account_code: str = "1000",
    bank_account_code: str = "1010",
    use_bank: bool = False,
    allocations: list[dict] | None = None,
) -> Payment:
    if direction not in ("inbound", "outbound"):
        raise PostingError("direction must be inbound or outbound")
    if amount <= 0:
        raise PostingError("amount must be positive")

    cash_code = bank_account_code if use_bank else cash_account_code

    cash_acc = await session.scalar(select(ChartOfAccounts.id).where(ChartOfAccounts.account_code == cash_code, ChartOfAccounts.tenant_id == tenant_id))
    ar_acc = await session.scalar(select(ChartOfAccounts.id).where(ChartOfAccounts.account_code == ar_account_code, ChartOfAccounts.tenant_id == tenant_id))
    ap_acc = await session.scalar(select(ChartOfAccounts.id).where(ChartOfAccounts.account_code == ap_account_code, ChartOfAccounts.tenant_id == tenant_id))
    if not (cash_acc and ar_acc and ap_acc):
        raise PostingError("Required accounts missing for payment posting")

    # Build journal lines (simplified: no allocation-level lines; allocation reduces AR/AP exposure already carried in invoice entries)
    if direction == "inbound":  # Customer payment: DR Cash / CR AR
        jl = [
            {"account_id": cash_acc, "partner_id": partner_id, "debit": amount, "description": "Customer Payment"},
            {"account_id": ar_acc, "partner_id": partner_id, "credit": amount, "description": "Settle Receivable"},
        ]
    else:  # outbound vendor payment: DR AP / CR Cash
        jl = [
            {"account_id": ap_acc, "partner_id": partner_id, "debit": amount, "description": "Settle Payable"},
            {"account_id": cash_acc, "partner_id": partner_id, "credit": amount, "description": "Vendor Payment"},
        ]

    j_entry = await create_journal_entry(
        session=session,
        tenant_id=tenant_id,
        lines=jl,
        reference="PAY",
        doc_type="payment",
    )

    payment = Payment(
        tenant_id=tenant_id,
        partner_id=partner_id,
        direction=direction,
        method=method,
        amount=amount,
        remaining_amount=amount,
        status="posted",
    )
    session.add(payment)
    await session.flush()

    # Apply explicit allocations if provided (list of {journal_entry_id, allocate_amount})
    total_alloc = Decimal("0")
    alloc_models: list[PaymentAllocation] = []
    for a in allocations or []:
        alloc_amt = Decimal(str(a["allocate_amount"]))
        if alloc_amt <= 0:
            continue
        alloc_models.append(
            PaymentAllocation(
                tenant_id=tenant_id,
                payment_id=payment.id,
                journal_entry_id=a["journal_entry_id"],
                allocated_amount=alloc_amt,
            )
        )
        total_alloc += alloc_amt
    if total_alloc > amount:
        raise PostingError("Allocated amount exceeds payment amount")

    for m in alloc_models:
        session.add(m)
    payment.remaining_amount = amount - total_alloc
    if payment.remaining_amount == 0:
        payment.status = "reconciled"
    elif total_alloc > 0:
        payment.status = "partial"

    await session.commit()
    return payment
