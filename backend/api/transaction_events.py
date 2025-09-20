from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from pydantic import BaseModel, Field, validator
from typing import List, Optional, Union
from decimal import Decimal
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid

from database import get_db_session
from dependencies import get_current_user, CurrentUser
from models.masters import ChartOfAccounts
from models.ledger import JournalEntry, JournalLine

router = APIRouter(prefix="/events", tags=["Transaction Events"])


class EntryModel(BaseModel):
    account_code: str
    debit: Decimal = Field(default=Decimal("0"))
    credit: Decimal = Field(default=Decimal("0"))

    @validator("debit", "credit", pre=True)
    def to_decimal(cls, v):
        if isinstance(v, str):
            return Decimal(v)
        return v

    @validator("credit")
    def not_both_zero(cls, v, values):
        if v == 0 and values.get("debit", 0) == 0:
            raise ValueError("Either debit or credit must be non-zero")
        if v > 0 and values.get("debit", 0) > 0:
            raise ValueError("Cannot have both debit and credit > 0")
        return v


class TransactionEvent(BaseModel):
    txn_id: str
    ref_type: str
    ref_id: str
    date: datetime
    description: Optional[str] = None
    entries: List[EntryModel]
    meta: Optional[dict] = Field(default_factory=dict)

    @validator("entries")
    def balanced(cls, v: List[EntryModel]):
        total_debit = sum(e.debit for e in v)
        total_credit = sum(e.credit for e in v)
        if total_debit != total_credit:
            raise ValueError("Entries are not balanced (total debit != total credit)")
        return v


async def _process_event(db: AsyncSession, tenant_id: uuid.UUID, ev: TransactionEvent):
    existing = await db.execute(select(JournalEntry).where(JournalEntry.txn_id == ev.txn_id, JournalEntry.tenant_id == tenant_id))
    if existing.scalars().first():
        return {"txn_id": ev.txn_id, "status": "already_processed"}

    entry = JournalEntry(
        tenant_id=tenant_id,
        entry_date=ev.date,
        reference=ev.ref_id,
        doc_type=ev.ref_type,
        doc_id=None,
        txn_id=ev.txn_id,
    )
    db.add(entry)
    # Resolve accounts and add lines
    account_map = {}
    for line in ev.entries:
        acct_stmt = select(ChartOfAccounts).where(ChartOfAccounts.account_code == line.account_code, ChartOfAccounts.tenant_id == tenant_id)
        acct = (await db.execute(acct_stmt)).scalars().first()
        if not acct:
            raise HTTPException(status_code=400, detail=f"Account code {line.account_code} not found")
        jl = JournalLine(
            tenant_id=tenant_id,
            entry=entry,
            account_id=acct.id,
            description=ev.description,
            debit=line.debit,
            credit=line.credit,
        )
        db.add(jl)
    await db.commit()
    await db.refresh(entry)
    return {"txn_id": ev.txn_id, "status": "created", "entry_id": str(entry.id)}


@router.post("/transaction", status_code=status.HTTP_201_CREATED)
async def ingest_transaction_events(
    payload: Union[TransactionEvent, List[TransactionEvent]],
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    tenant_id = current_user.tenant_id
    events = payload if isinstance(payload, list) else [payload]
    results = []
    # Process sequentially for now (could parallelize)
    for ev in events:
        res = await _process_event(db, tenant_id, ev)
        results.append(res)
    # Determine status code override if all already processed
    if all(r["status"] == "already_processed" for r in results):
        return {"results": results, "message": "all already processed"}
    return {"results": results}
