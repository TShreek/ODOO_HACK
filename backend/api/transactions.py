from fastapi import APIRouter, Depends, HTTPException, status
import os
from pydantic import BaseModel, Field, condecimal
from typing import List, Optional
from decimal import Decimal
from datetime import datetime
import uuid

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database import get_db_session
from dependencies import get_current_user, CurrentUser
from models.transactions import Transaction
from models.ledger import JournalEntry, JournalLine
from models.masters import ChartOfAccounts
from services import accounting_engine
from services.event_dispatcher import dispatch_transaction_event_async
from services.realtime import notify_journal_update

Money = condecimal(max_digits=14, decimal_places=2)
Qty = condecimal(max_digits=12, decimal_places=3)

class ItemModel(BaseModel):
    product_id: str
    qty: Qty
    unit_price: Money
    tax_percent: Optional[condecimal(max_digits=5, decimal_places=2)] = 0
    discount: Optional[Money] = 0

class CreatePurchaseOrder(BaseModel):
    txn_id: Optional[str]
    vendor_id: str
    items: List[ItemModel]
    order_date: datetime
    expected_receipt_date: Optional[datetime]
    auto_post: Optional[bool] = True
    meta: Optional[dict] = {}

class CreateSalesOrder(BaseModel):
    txn_id: Optional[str]
    customer_id: str
    items: List[ItemModel]
    order_date: datetime
    invoice_on_confirm: Optional[bool] = True
    meta: Optional[dict] = {}

class CreatePayment(BaseModel):
    txn_id: Optional[str]
    direction: str = Field(pattern="^(in|out)$", description="in=receipt, out=payment")
    amount: Decimal
    payment_date: datetime
    party_type: Optional[str] = Field(default=None, description="customer|vendor (optional metadata)")
    party_id: Optional[str] = None
    apply_to_txn_id: Optional[str] = Field(default=None, description="Invoice/Bill transaction txn_id to apply this payment toward")
    meta: Optional[dict] = {}

router = APIRouter(prefix="/transactions", tags=["Transactions"])

async def _get_existing(db: AsyncSession, txn_id: str):
    res = await db.execute(select(Transaction).where(Transaction.txn_id == txn_id))
    return res.scalars().first()

async def _create_transaction(db: AsyncSession, *, txn_id: str, ttype: str, total: Decimal, meta: dict, status_: str, ref_id: Optional[str] = None) -> Transaction:
    trx = Transaction(
        txn_id=txn_id,
        type=ttype,
        ref_id=ref_id,
        status=status_,
        total_amount=total,
        meta=meta or {},
    )
    db.add(trx)
    await db.commit()
    await db.refresh(trx)
    return trx


async def _persist_journal_if_configured(
    db: AsyncSession,
    current_user: CurrentUser,
    txn_id: str,
    ref_type: str,
    ref_id: str,
    event_entries: list,
    description: str,
):
    """Persist JournalEntry/Lines immediately if PERSIST_JOURNAL_IMMEDIATE=true.
    Avoid duplicate creation if an entry with txn_id already exists.
    Returns dict with persistence_status and entry_id (if created)."""
    if os.getenv("PERSIST_JOURNAL_IMMEDIATE", "false").lower() != "true":
        return {"persistence": "disabled"}

    # Check existing journal entry
    existing_q = await db.execute(select(JournalEntry).where(JournalEntry.txn_id == txn_id, JournalEntry.tenant_id == current_user.tenant_id))
    existing = existing_q.scalars().first()
    if existing:
        return {"persistence": "exists", "entry_id": str(existing.id)}

    entry = JournalEntry(
        tenant_id=current_user.tenant_id,
        entry_date=datetime.utcnow(),
        reference=ref_id,
        doc_type=ref_type,
        doc_id=None,
        txn_id=txn_id,
    )
    db.add(entry)

    for line in event_entries:
        acct_stmt = select(ChartOfAccounts).where(
            ChartOfAccounts.account_code == line["account_code"],
            ChartOfAccounts.tenant_id == current_user.tenant_id,
        )
        acct = (await db.execute(acct_stmt)).scalars().first()
        if not acct:
            raise HTTPException(status_code=400, detail=f"Account code {line['account_code']} not found")
        jl = JournalLine(
            tenant_id=current_user.tenant_id,
            entry=entry,
            account_id=acct.id,
            description=description,
            debit=Decimal(str(line["debit"])),
            credit=Decimal(str(line["credit"])),
        )
        db.add(jl)
    await db.commit()
    await db.refresh(entry)
    return {"persistence": "created", "entry_id": str(entry.id)}

@router.post("/purchase_order", status_code=status.HTTP_201_CREATED)
async def create_purchase_order(po: CreatePurchaseOrder, db: AsyncSession = Depends(get_db_session), current_user: CurrentUser = Depends(get_current_user)):
    if not po.items:
        raise HTTPException(422, detail="At least one line item required")
    txn_id = po.txn_id or f"PO-{uuid.uuid4()}"
    existing = await _get_existing(db, txn_id)
    if existing:
        return {"transaction": existing, "journal_summary": None, "dispatch_status": "idempotent"}

    entries = accounting_engine.generate_purchase_entries(po.model_dump())
    summary = accounting_engine.summarize_entries(entries)
    total = summary["total_debit"]  # for purchases debit = total cost
    meta = po.meta or {}
    # Always retain a stable snapshot of original line items for downstream conversion
    meta = {**meta, "lines_snapshot": [i.model_dump() for i in po.items]}
    if not po.auto_post:
        # Persist original items for later posting (legacy key _draft_items) while in draft
        meta = {**meta, "_draft_items": [i.model_dump() for i in po.items], "_order_date": po.order_date.isoformat()}
    trx = await _create_transaction(db, txn_id=txn_id, ttype="PURCHASE_ORDER", total=total, meta=meta, status_="POSTED" if po.auto_post else "DRAFT")

    event = {
        "txn_id": txn_id,
        "ref_type": "PURCHASE_ORDER",
        "ref_id": str(trx.id),
        "tenant_id": str(current_user.tenant_id),
        "user_id": str(current_user.user_id),
        "date": po.order_date.isoformat(),
        "description": f"Purchase Order {txn_id}",
        "entries": [
            {"account_code": e["account_code"], "debit": str(e["debit"]), "credit": str(e["credit"]) }
            for e in entries
        ],
        "meta": po.meta or {},
    }
    persistence = await _persist_journal_if_configured(
        db, current_user, txn_id, "PURCHASE_ORDER", str(trx.id), event["entries"], event["description"],
    )
    if persistence.get("persistence") == "created":
        await notify_journal_update(current_user.tenant_id)
    dispatch_status = await dispatch_transaction_event_async(event)
    return {"transaction": trx, "journal_summary": summary, "dispatch_status": dispatch_status, **persistence}

@router.post("/sales_order", status_code=status.HTTP_201_CREATED)
async def create_sales_order(so: CreateSalesOrder, db: AsyncSession = Depends(get_db_session), current_user: CurrentUser = Depends(get_current_user)):
    if not so.items:
        raise HTTPException(422, detail="At least one line item required")
    txn_id = so.txn_id or f"SO-{uuid.uuid4()}"
    existing = await _get_existing(db, txn_id)
    if existing:
        return {"transaction": existing, "journal_summary": None, "dispatch_status": "idempotent"}

    entries = accounting_engine.generate_sales_entries(so.model_dump())
    summary = accounting_engine.summarize_entries(entries)
    total = summary["total_debit"]  # sales: debit is AR total
    meta = so.meta or {}
    # Always retain a stable snapshot of original line items for downstream conversion
    meta = {**meta, "lines_snapshot": [i.model_dump() for i in so.items]}
    if not so.invoice_on_confirm:
        meta = {**meta, "_draft_items": [i.model_dump() for i in so.items], "_order_date": so.order_date.isoformat()}
    trx = await _create_transaction(db, txn_id=txn_id, ttype="SALES_ORDER", total=total, meta=meta, status_="POSTED" if so.invoice_on_confirm else "DRAFT")

    event = {
        "txn_id": txn_id,
        "ref_type": "SALES_ORDER",
        "ref_id": str(trx.id),
        "tenant_id": str(current_user.tenant_id),
        "user_id": str(current_user.user_id),
        "date": so.order_date.isoformat(),
        "description": f"Sales Order {txn_id}",
        "entries": [
            {"account_code": e["account_code"], "debit": str(e["debit"]), "credit": str(e["credit"])}
            for e in entries
        ],
        "meta": so.meta or {},
    }
    persistence = await _persist_journal_if_configured(
        db, current_user, txn_id, "SALES_ORDER", str(trx.id), event["entries"], event["description"],
    )
    if persistence.get("persistence") == "created":
        await notify_journal_update(current_user.tenant_id)
    dispatch_status = await dispatch_transaction_event_async(event)
    return {"transaction": trx, "journal_summary": summary, "dispatch_status": dispatch_status, **persistence}

@router.get("/{txn_id}")
async def get_transaction(txn_id: str, db: AsyncSession = Depends(get_db_session), current_user: CurrentUser = Depends(get_current_user)):
    trx = await _get_existing(db, txn_id)
    if not trx:
        raise HTTPException(404, detail="Transaction not found")
    return trx


@router.post("/{txn_id}/post")
async def post_transaction(txn_id: str, db: AsyncSession = Depends(get_db_session), current_user: CurrentUser = Depends(get_current_user)):
    trx = await _get_existing(db, txn_id)
    if not trx:
        raise HTTPException(404, detail="Transaction not found")
    if trx.status != "DRAFT":
        return {"transaction": trx, "message": "Already posted or not in DRAFT"}
    # Retrieve draft items snapshot
    if not trx.meta or "_draft_items" not in trx.meta:
        raise HTTPException(400, detail="Draft items snapshot missing; cannot post")
    draft_items = trx.meta["_draft_items"]
    order_date = trx.meta.get("_order_date")
    payload = {"items": draft_items}
    # Generate entries based on type
    if trx.type == "PURCHASE_ORDER":
        entries = accounting_engine.generate_purchase_entries(payload)
        ref_type = "PURCHASE_ORDER"
    elif trx.type == "SALES_ORDER":
        entries = accounting_engine.generate_sales_entries(payload)
        ref_type = "SALES_ORDER"
    else:
        raise HTTPException(400, detail="Unsupported transaction type for posting")
    summary = accounting_engine.summarize_entries(entries)
    # Update transaction status
    trx.status = "POSTED"
    # Remove only ephemeral draft markers but retain lines_snapshot for future conversion
    cleaned_meta = {}
    for k, v in (trx.meta or {}).items():
        if k in ("_order_date",) or k.startswith("_draft"):
            continue
        cleaned_meta[k] = v
    trx.meta = cleaned_meta
    await db.commit()
    await db.refresh(trx)

    event = {
        "txn_id": txn_id,
        "ref_type": ref_type,
        "ref_id": str(trx.id),
        "tenant_id": str(current_user.tenant_id),
        "user_id": str(current_user.user_id),
        "date": order_date or datetime.utcnow().isoformat(),
        "description": f"{ref_type} {txn_id} POSTED",
        "entries": [
            {"account_code": e["account_code"], "debit": str(e["debit"]), "credit": str(e["credit"])}
            for e in entries
        ],
        "meta": trx.meta or {},
    }
    persistence = await _persist_journal_if_configured(
        db, current_user, txn_id, ref_type, str(trx.id), event["entries"], event["description"],
    )
    if persistence.get("persistence") == "created":
        await notify_journal_update(current_user.tenant_id)
    dispatch_status = await dispatch_transaction_event_async(event)
    return {"transaction": trx, "journal_summary": summary, "dispatch_status": dispatch_status, **persistence}


@router.post("/payment", status_code=status.HTTP_201_CREATED)
async def create_payment(payment: CreatePayment, db: AsyncSession = Depends(get_db_session), current_user: CurrentUser = Depends(get_current_user)):
    txn_id = payment.txn_id or f"PAY-{uuid.uuid4()}"
    existing = await _get_existing(db, txn_id)
    if existing:
        return {"transaction": existing, "journal_summary": None, "dispatch_status": "idempotent"}

    entries = accounting_engine.generate_payment_entries({
        "amount": payment.amount,
        "direction": payment.direction,
    })
    summary = accounting_engine.summarize_entries(entries)
    total = summary["total_debit"]  # cash in => debit cash, or debit AP when paying out; consistent for totals
    meta = payment.meta or {}
    meta = {**meta, "party_type": payment.party_type, "party_id": payment.party_id, "apply_to_txn_id": payment.apply_to_txn_id}
    trx = await _create_transaction(db, txn_id=txn_id, ttype="PAYMENT", total=total, meta=meta, status_="POSTED")

    event = {
        "txn_id": txn_id,
        "ref_type": "PAYMENT",
        "ref_id": str(trx.id),
        "tenant_id": str(current_user.tenant_id),
        "user_id": str(current_user.user_id),
        "date": payment.payment_date.isoformat(),
        "description": f"Payment {txn_id} {payment.direction}",
        "entries": [
            {"account_code": e["account_code"], "debit": str(e["debit"]), "credit": str(e["credit"])}
            for e in entries
        ],
        "meta": meta,
    }
    persistence = await _persist_journal_if_configured(
        db, current_user, txn_id, "PAYMENT", str(trx.id), event["entries"], event["description"],
    )
    if persistence.get("persistence") == "created":
        await notify_journal_update(current_user.tenant_id)
    dispatch_status = await dispatch_transaction_event_async(event)
    # Optional: apply payment to target invoice/bill
    allocation = None
    if payment.apply_to_txn_id:
        allocation = await _apply_payment_allocation(db, current_user, payment.apply_to_txn_id, payment.amount)
    return {"transaction": trx, "journal_summary": summary, "dispatch_status": dispatch_status, **persistence, "allocation": allocation}

class ConvertRequest(BaseModel):
    target_type: str = Field(pattern="^(VENDOR_BILL|CUSTOMER_INVOICE)$")
    invoice_date: Optional[datetime] = None
    meta: Optional[dict] = {}

@router.post("/{txn_id}/convert", status_code=201)
async def convert_transaction(txn_id: str, req: ConvertRequest, db: AsyncSession = Depends(get_db_session), current_user: CurrentUser = Depends(get_current_user)):
    source = await _get_existing(db, txn_id)
    if not source:
        raise HTTPException(404, detail="Source transaction not found")
    if source.type not in ("PURCHASE_ORDER", "SALES_ORDER"):
        raise HTTPException(400, detail="Unsupported source type for conversion")
    if source.status != "POSTED":
        raise HTTPException(400, detail="Source must be POSTED before conversion")
    target_type = req.target_type
    # Prefer legacy _draft_items (still present if not posted yet) else use persistent lines_snapshot
    if source.meta:
        if "_draft_items" in source.meta:
            items_payload = {"items": source.meta["_draft_items"]}
        elif "lines_snapshot" in source.meta:
            items_payload = {"items": source.meta["lines_snapshot"]}
        else:
            raise HTTPException(400, detail="Original line items snapshot missing (no lines_snapshot)")
    else:
        raise HTTPException(400, detail="Original line items snapshot missing")
    if source.type == "PURCHASE_ORDER" and target_type != "VENDOR_BILL":
        raise HTTPException(400, detail="PURCHASE_ORDER can only convert to VENDOR_BILL")
    if source.type == "SALES_ORDER" and target_type != "CUSTOMER_INVOICE":
        raise HTTPException(400, detail="SALES_ORDER can only convert to CUSTOMER_INVOICE")
    if target_type == "VENDOR_BILL":
        entries = accounting_engine.generate_purchase_entries(items_payload)
    else:
        entries = accounting_engine.generate_sales_entries(items_payload)
    summary = accounting_engine.summarize_entries(entries)
    new_txn_id = f"{target_type[:2]}-{uuid.uuid4()}"
    new_trx = await _create_transaction(db, txn_id=new_txn_id, ttype=target_type, total=summary["total_debit"], meta={**(req.meta or {}), "source_txn": txn_id}, status_="POSTED")
    event = {
        "txn_id": new_txn_id,
        "ref_type": target_type,
        "ref_id": str(new_trx.id),
        "tenant_id": str(current_user.tenant_id),
        "user_id": str(current_user.user_id),
        "date": (req.invoice_date or datetime.utcnow()).isoformat(),
        "description": f"Conversion {txn_id} -> {target_type} {new_txn_id}",
        "entries": [{"account_code": e["account_code"], "debit": str(e["debit"]), "credit": str(e["credit"])} for e in entries],
        "meta": req.meta or {},
    }
    persistence = await _persist_journal_if_configured(
        db, current_user, new_txn_id, target_type, str(new_trx.id), event["entries"], event["description"],
    )
    if persistence.get("persistence") == "created":
        await notify_journal_update(current_user.tenant_id)
    dispatch_status = await dispatch_transaction_event_async(event)
    return {"transaction": new_trx, "journal_summary": summary, "dispatch_status": dispatch_status, **persistence}

async def _apply_payment_allocation(db: AsyncSession, current_user: CurrentUser, target_txn_id: str, amount: Decimal):
    target = await _get_existing(db, target_txn_id)
    if not target:
        raise HTTPException(404, detail="Target transaction not found for allocation")
    if target.type not in ("CUSTOMER_INVOICE", "VENDOR_BILL"):
        raise HTTPException(400, detail="Allocation target must be invoice or bill")
    # Record cumulative applied amount in meta
    applied = Decimal(str((target.meta or {}).get("applied_amount", 0))) + amount
    target.meta = {**(target.meta or {}), "applied_amount": float(applied)}
    # Determine status
    if applied >= target.total_amount:
        target.status = "PAID"
    else:
        target.status = "PARTIAL"
    await db.commit()
    await db.refresh(target)
    return {"target_txn": target_txn_id, "applied_amount": str(applied), "status": target.status}
