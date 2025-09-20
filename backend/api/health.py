# backend/api/health.py
import time, json, uuid
from fastapi import APIRouter
from sqlalchemy import text
from database import AsyncSessionLocal
from config import settings

# kafka
from kafka import KafkaProducer, KafkaConsumer

router = APIRouter(prefix="/health", tags=["health"])

# ----- DB HEALTH ------------------------------------------------------------
@router.get("/db")
async def health_db():
    started = time.time()
    async with AsyncSessionLocal() as s:
        r = await s.execute(text("SELECT 1"))
        ok = (r.scalar() == 1)
    return {
        "ok": ok,
        "dialect": "postgresql+asyncpg",
        "latency_ms": round((time.time() - started) * 1000, 1),
    }

# ----- KAFKA HEALTH (produce + poll) ----------------------------------------
def _parse_bootstrap(val):
    if isinstance(val, (list, tuple)):
        return [str(x).strip() for x in val if str(x).strip()]
    if isinstance(val, str):
        return [s.strip().strip('"').strip("'") for s in val.split(",") if s.strip()]
    return [str(val).strip()]

@router.get("/kafka")
def health_kafka():
    """
    Quick end-to-end check:
      1) create a short-lived consumer on topic 'health_checks'
      2) produce one probe message
      3) poll until we see it (<= 3s)
    """
    topic = "health_checks"
    bootstraps = _parse_bootstrap(settings.KAFKA_BOOTSTRAP_SERVERS)
    probe_id = str(uuid.uuid4())
    started = time.time()

    # 1) consumer first (so we don't miss the message)
    consumer = KafkaConsumer(
        topic,
        bootstrap_servers=bootstraps,
        value_deserializer=lambda b: json.loads(b.decode("utf-8")),
        key_deserializer=lambda b: b.decode("utf-8") if b else None,
        group_id=f"health_probe_{probe_id}",
        enable_auto_commit=False,
        auto_offset_reset="latest",
        consumer_timeout_ms=3000,  # give up after ~3s
    )

    # 2) produce the probe
    producer = KafkaProducer(
        bootstrap_servers=bootstraps,
        value_serializer=lambda v: json.dumps(v).encode("utf-8"),
        key_serializer=lambda k: k.encode("utf-8") if k else None,
    )
    payload = {"probe_id": probe_id, "ts": time.time()}
    rec = producer.send(topic, key=probe_id, value=payload)
    rec.get(timeout=5)  # broker acked
    producer.flush()

    # 3) poll to see our message
    seen = None
    for m in consumer:
        if m.key == probe_id:
            seen = {
                "topic": m.topic,
                "partition": m.partition,
                "offset": m.offset,
                "value": m.value,
            }
            break

    # cleanup
    try:
        consumer.close()
    except Exception:
        pass
    try:
        producer.close()
    except Exception:
        pass

    ok = seen is not None
    return {
        "ok": ok,
        "latency_ms": round((time.time() - started) * 1000, 1),
        "probe_id": probe_id,
        "seen": seen,
        "bootstrap": bootstraps,
        "topic": topic,
        "note": "Topic must be auto-created or pre-created for this to pass.",
    }
