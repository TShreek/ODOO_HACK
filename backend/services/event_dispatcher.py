import os, asyncio, time, json, sys
from typing import Dict, Any
import httpx

USE_INTERNAL_POST = os.getenv("USE_INTERNAL_POST", "true").lower() == "true"
PROCESS_LOCALLY = os.getenv("PROCESS_LOCALLY", "false").lower() == "true"
CONSUMER_HOST = os.getenv("CONSUMER_HOST", "localhost")
CONSUMER_PORT = os.getenv("CONSUMER_PORT", "8000")
EVENT_URL = f"http://{CONSUMER_HOST}:{CONSUMER_PORT}/events/transaction"

async def dispatch_transaction_event_async(event: Dict[str, Any]) -> Dict[str, Any]:
    if PROCESS_LOCALLY:
        # Future: directly call ingestion function
        pass
    if not USE_INTERNAL_POST:
        return {"status": "skipped"}
    delay = 0.25
    for attempt in range(1,4):
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.post(EVENT_URL, json=event)
                _log_dispatch("success", attempt, event, extra={"status_code": resp.status_code})
                return {"status": resp.status_code, "attempt": attempt}
        except Exception as e:
            _log_dispatch("error", attempt, event, extra={"error": str(e)})
            if attempt == 3:
                return {"status": "error", "error": str(e), "attempt": attempt}
            await asyncio.sleep(delay)
            delay *= 2
    return {"status": "error", "error": "unknown"}

def dispatch_transaction_event_sync(event: Dict[str, Any]) -> Dict[str, Any]:
    if PROCESS_LOCALLY:
        pass
    if not USE_INTERNAL_POST:
        return {"status": "skipped"}
    import requests  # type: ignore
    delay = 0.25
    for attempt in range(1,4):
        try:
            resp = requests.post(EVENT_URL, json=event, timeout=5)
            _log_dispatch("success", attempt, event, extra={"status_code": resp.status_code})
            return {"status": resp.status_code, "attempt": attempt}
        except Exception as e:
            _log_dispatch("error", attempt, event, extra={"error": str(e)})
            if attempt == 3:
                return {"status": "error", "error": str(e), "attempt": attempt}
            time.sleep(delay)
            delay *= 2
    return {"status": "error", "error": "unknown"}


def _log_dispatch(state: str, attempt: int, event: Dict[str, Any], extra: Dict[str, Any]):
    fields = {
        "component": "event_dispatcher",
        "state": state,
        "attempt": attempt,
        "txn_id": event.get("txn_id"),
        "ref_type": event.get("ref_type"),
        "ref_id": event.get("ref_id"),
        "tenant_id": event.get("tenant_id"),
        **extra,
    }
    try:
        sys.stdout.write(json.dumps(fields) + "\n")
    except Exception:
        pass
