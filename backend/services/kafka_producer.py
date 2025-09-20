# services/kafka_producer.py
import json, hashlib
from typing import Any, Dict
from kafka import KafkaProducer
from config import settings

_required = {"event_id","schema_version","tenant_id","transaction_id","type","occurred_at","payload"}

def _stable_json(obj: Any) -> str:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"))

def _calc_hash(event: Dict[str, Any]) -> str:
    body = f"{event['type']}{event['transaction_id']}{_stable_json(event['payload'])}"
    return hashlib.sha256(body.encode("utf-8")).hexdigest()

def _parse_bootstrap(val) -> list[str]:
    if isinstance(val, (list, tuple)):
        return [str(x).strip() for x in val if str(x).strip()]
    if isinstance(val, str):
        return [s.strip().strip('"').strip("'") for s in val.split(",") if s.strip()]
    return [str(val).strip()]

BOOTSTRAPS = _parse_bootstrap(settings.KAFKA_BOOTSTRAP_SERVERS)

# create a module-level producer (single, reused)
_producer = KafkaProducer(
    bootstrap_servers=BOOTSTRAPS,
    key_serializer=lambda x: x.encode("utf-8"),
    value_serializer=lambda v: json.dumps(v).encode("utf-8"),
)

def publish_financial_event(event: Dict[str, Any]) -> None:
    # 1) validate envelope
    missing = _required - event.keys()
    if missing:
        raise ValueError(f"Missing required fields: {missing}")
    # 2) ensure/compute hash
    expected = _calc_hash(event)
    if "hash" not in event:
        event["hash"] = expected
    elif event["hash"] != expected:
        raise ValueError("hash does not match computed payload hash")
    # 3) send
    topic = settings.KAFKA_FINANCIAL_TRANSACTIONS_TOPIC
    key = str(event["tenant_id"])
    fut = _producer.send(topic, key=key, value=event)
    md = fut.get(timeout=10)
    print(f"[producer] sent to {md.topic} [p{md.partition}] @ offset {md.offset}")

