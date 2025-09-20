# consumers/transaction_consumer.py
import json, hashlib, asyncio, uuid
from typing import Any, Dict
from kafka import KafkaConsumer, KafkaProducer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from config import settings
from database import AsyncSessionLocal
from models.events import ProcessedEvent
from models.transactions import JournalEntry, Transaction
from services.accounting_engine import generate_entries

REQUIRED = {"event_id","schema_version","tenant_id","transaction_id","type","occurred_at","payload"}

def _stable_json(obj: Any) -> str:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"))

def _calc_hash(event: Dict[str, Any]) -> str:
    body = f"{event['type']}{event['transaction_id']}{_stable_json(event['payload'])}"
    return hashlib.sha256(body.encode("utf-8")).hexdigest()

async def handle_event(event: Dict[str, Any]):
    # minimal envelope validation so old test messages are skipped
    missing = REQUIRED - event.keys()
    if missing:
        print("[consumer] skipping invalid event (missing:", missing, ")")
        return

    # Set default account IDs in the payload
    p = event.setdefault("payload", {})
    p.setdefault("ar_account_id", settings.AR_ACCOUNT_ID)
    p.setdefault("revenue_account_id", settings.REVENUE_ACCOUNT_ID)
    p.setdefault("tax_payable_account_id", settings.TAX_ACCOUNT_ID)

    async with AsyncSessionLocal() as session:
        # Use ONE explicit transaction for the whole flow
        async with session.begin():
            # 1) idempotency check
            evt_hash = _calc_hash(event)
            existing = await session.execute(
                select(ProcessedEvent).where(
                    (ProcessedEvent.event_id == event["event_id"]) |
                    (ProcessedEvent.event_hash == evt_hash)
                )
            )
            if existing.scalar_one_or_none():
                print("[consumer] duplicate event, skipping", event["event_id"])
                return

            # 2) generate accounting rows
            entries = generate_entries(event)

            # Check if the source transaction exists; if not, null the FK to avoid FK violation
            tx_id = event["transaction_id"]
            exists = await session.execute(
                select(Transaction.id).where(Transaction.id == tx_id)
            )
            if exists.scalar_one_or_none() is None:
                for e in entries:
                    e["transaction_id"] = None  # allow journal entry without a header row

            # 3) insert rows
            for e in entries:
                # ensure created_by is set
                e.setdefault("created_by", settings.SYSTEM_USER_ID)
                session.add(JournalEntry(**e))

            # 4) mark processed
            session.add(ProcessedEvent(
                event_id=event["event_id"],
                event_hash=evt_hash,
                status="processed",
            ))
        # exiting the 'with session.begin()' commits successfully

def _parse_bootstrap(val) -> list[str]:
    # Accept list/tuple or string; strip brackets/quotes/whitespace
    if isinstance(val, (list, tuple)):
        return [str(x).strip().strip('"').strip("'") for x in val if str(x).strip()]
    s = str(val).strip()
    # remove JSON-ish brackets if present
    s = s.replace("[", "").replace("]", "")
    # remove any quotes anywhere
    s = s.replace('"', "").replace("'", "")
    parts = [p.strip() for p in s.split(",") if p.strip()]
    return parts

BOOTSTRAPS = _parse_bootstrap(settings.KAFKA_BOOTSTRAP_SERVERS)

DLQ_TOPIC = "financial_transactions_dlq"
_dlq = KafkaProducer(
    bootstrap_servers=BOOTSTRAPS,
    value_serializer=lambda v: json.dumps(v).encode("utf-8"),
)

async def main():
    consumer = KafkaConsumer(
        settings.KAFKA_FINANCIAL_TRANSACTIONS_TOPIC,
        bootstrap_servers=BOOTSTRAPS,
        group_id=settings.KAFKA_CONSUMER_GROUP_ID,
        value_deserializer=lambda b: json.loads(b.decode("utf-8")),
        key_deserializer=lambda b: b.decode("utf-8") if b else None,
        enable_auto_commit=False,
        auto_offset_reset="latest",
    )
    try:
        while True:
            records = consumer.poll(timeout_ms=1000)
            for tp, msgs in records.items():
                for m in msgs:
                    try:
                        await handle_event(m.value)
                        consumer.commit()  # commit after DB success
                        print(f"[consumer] committed offset {m.offset} on p{m.partition}")
                    except Exception as e:
                        print("[consumer] error, NOT committing:", e)

                        # mark failed in processed_events (best-effort)
                        try:
                            async with AsyncSessionLocal() as s:
                                async with s.begin():
                                    evt = m.value if isinstance(m.value, dict) else {}
                                    ev_id = evt.get("event_id") or str(uuid.uuid4())
                                    s.add(ProcessedEvent(
                                        event_id=ev_id,
                                        event_hash=_calc_hash(evt) if evt else "unknown",
                                        status="failed",
                                        error_text=str(e)[:500],
                                    ))
                        except Exception as ie:
                            print("[consumer] failed to record failure:", ie)

                        # send original to DLQ (best-effort)
                        try:
                            _dlq.send(DLQ_TOPIC, m.value if isinstance(m.value, dict) else {"raw": str(m.value)})
                        except Exception as pe:
                            print("[consumer] failed to send to DLQ:", pe)

                        # do not commit offset; move to next message
    finally:
        consumer.close()

if __name__ == "__main__":
    asyncio.run(main())


