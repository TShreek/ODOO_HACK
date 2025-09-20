# services/kafka_producer.py
import json
from typing import Any, Dict
from kafka import KafkaProducer
from config import settings

# robust parser shared here too
def _parse_bootstrap(val) -> list[str]:
    if isinstance(val, (list, tuple)):
        return [str(x).strip().strip('"').strip("'") for x in val if str(x).strip()]
    s = str(val or "").strip()
    s = s.replace("[", "").replace("]", "")  # remove brackets if someone put JSON-y value
    s = s.replace('"', "").replace("'", "")  # strip any quotes anywhere
    parts = [p.strip() for p in s.split(",") if p.strip()]
    return parts

_BOOTSTRAPS = _parse_bootstrap(settings.KAFKA_BOOTSTRAP_SERVERS)

# lazy, cached producer to avoid import-time connect and reloader duplication
_producer: KafkaProducer | None = None

def _get_producer() -> KafkaProducer:
    global _producer
    if _producer is None:
        _producer = KafkaProducer(
            bootstrap_servers=_BOOTSTRAPS,
            value_serializer=lambda v: json.dumps(v).encode("utf-8"),
            key_serializer=lambda k: (k.encode("utf-8") if isinstance(k, str) else k),
            # this avoids long auto-version probing stalls
            api_version_auto_timeout_ms=5000,
        )
    return _producer

REQUIRED = {"event_id","schema_version","tenant_id","transaction_id","type","occurred_at","payload"}

def publish_financial_event(event: Dict[str, Any]) -> None:
    # validate minimal envelope
    missing = REQUIRED - event.keys()
    if missing:
        raise ValueError(f"event missing fields: {missing}")

    # key by tenant
    key = event["tenant_id"]

    # send
    producer = _get_producer()
    fut = producer.send(settings.KAFKA_FINANCIAL_TRANSACTIONS_TOPIC, key=key, value=event)
    md = fut.get(timeout=10)
    print(f"[producer] sent to {md.topic} [p{md.partition}] @ offset {md.offset}")

