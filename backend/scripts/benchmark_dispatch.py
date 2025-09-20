#!/usr/bin/env python
"""Benchmark event dispatch throughput.

Measures:
1. Sequential transaction endpoints (purchase_order) which internally dispatch events
2. Direct /events/transaction posting (simulated already-generated entries)

Outputs simple JSON metrics summarizing avg latency, total time, RPS.

Usage:
  export TOKEN=...  (JWT with permission)
  python scripts/benchmark_dispatch.py --count 50 --mode both

Flags:
  --host          API host (default 127.0.0.1)
  --port          API port (default 8000)
  --count         Number of iterations (default 20)
  --mode          transaction|event|both
  --concurrency   Future placeholder (currently sequential)
"""
import argparse, asyncio, json, time, uuid, random, os
from decimal import Decimal
import httpx

PURCHASE_ITEMS = [
    {"product_id": "p1", "qty": "1", "unit_price": "100.00", "tax_percent": "5"},
    {"product_id": "p2", "qty": "2", "unit_price": "50.00", "tax_percent": "5"},
]

async def bench_transactions(client: httpx.AsyncClient, count: int):
    latencies = []
    for i in range(count):
        payload = {
            "vendor_id": f"VENDOR{i%5}",
            "items": PURCHASE_ITEMS,
            "order_date": "2025-01-01T00:00:00Z",
            "txn_id": f"BM-PO-{uuid.uuid4()}"
        }
        start = time.perf_counter()
        r = await client.post("/transactions/purchase_order", json=payload)
        end = time.perf_counter()
        latencies.append(end-start)
        if r.status_code not in (200,201):
            print("Transaction error:", r.status_code, r.text)
    return latencies

async def bench_events(client: httpx.AsyncClient, count: int):
    latencies = []
    for i in range(count):
        total = Decimal("210.00")
        event = {
            "txn_id": f"BM-EVT-{uuid.uuid4()}",
            "ref_type": "BENCH",
            "ref_id": str(uuid.uuid4()),
            "date": "2025-01-01T00:00:00Z",
            "description": "Benchmark event",
            "entries": [
                {"account_code": "1100", "debit": str(total), "credit": "0.00"},
                {"account_code": "4000", "debit": "0.00", "credit": str(total)}
            ],
            "meta": {"benchmark": True}
        }
        start = time.perf_counter()
        r = await client.post("/events/transaction", json=event)
        end = time.perf_counter()
        latencies.append(end-start)
        if r.status_code not in (200,201):
            print("Event error:", r.status_code, r.text)
    return latencies

def summarize(name: str, latencies):
    if not latencies:
        return {"name": name, "count": 0}
    total = sum(latencies)
    return {
        "name": name,
        "count": len(latencies),
        "total_s": round(total,4),
        "avg_ms": round((total/len(latencies))*1000,2),
        "rps": round(len(latencies)/total,2) if total>0 else None,
        "p95_ms": round(sorted(latencies)[int(len(latencies)*0.95)-1]*1000,2)
    }

async def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--host", default="127.0.0.1")
    ap.add_argument("--port", default="8000")
    ap.add_argument("--count", type=int, default=20)
    ap.add_argument("--mode", choices=["transaction","event","both"], default="both")
    ap.add_argument("--concurrency", type=int, default=1)
    args = ap.parse_args()

    base_url = f"http://{args.host}:{args.port}"
    headers = {}
    token = os.getenv("TOKEN")
    if token:
        headers["Authorization"] = f"Bearer {token}"

    async with httpx.AsyncClient(base_url=base_url, headers=headers, timeout=10.0) as client:
        results = []
        if args.mode in ("transaction","both"):
            tx_lat = await bench_transactions(client, args.count)
            results.append(summarize("transactions", tx_lat))
        if args.mode in ("event","both"):
            ev_lat = await bench_events(client, args.count)
            results.append(summarize("events", ev_lat))
    print(json.dumps({"results": results}, indent=2))

if __name__ == "main":  # allows running via python -m scripts.benchmark_dispatch maybe
    asyncio.run(main())

# Normal entry
if __name__ == "__main__":
    asyncio.run(main())
