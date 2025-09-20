import time
import threading
from typing import Dict
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


class InMemoryMetrics:
    def __init__(self):
        self._lock = threading.Lock()
        self.counters: Dict[str, int] = {
            "requests_total": 0,
            "requests_errors": 0,
        }
        self.latency_sum_ms: float = 0.0

    def record(self, path: str, status_code: int, latency_ms: float):
        with self._lock:
            self.counters["requests_total"] += 1
            if status_code >= 500:
                self.counters["requests_errors"] += 1
            self.latency_sum_ms += latency_ms

    def snapshot(self):
        with self._lock:
            avg_latency = 0.0
            if self.counters["requests_total"]:
                avg_latency = self.latency_sum_ms / self.counters["requests_total"]
            return {
                **self.counters,
                "avg_latency_ms": round(avg_latency, 2),
            }

    def prometheus_text(self) -> str:
        snap = self.snapshot()
        # Basic exposition; for richer histograms we would track buckets.
        lines = [
            "# HELP app_requests_total Total HTTP requests",
            "# TYPE app_requests_total counter",
            f"app_requests_total {snap['requests_total']}",
            "# HELP app_requests_errors Total HTTP 5xx errors",
            "# TYPE app_requests_errors counter",
            f"app_requests_errors {snap['requests_errors']}",
            "# HELP app_request_avg_latency_ms Average request latency in ms",
            "# TYPE app_request_avg_latency_ms gauge",
            f"app_request_avg_latency_ms {snap['avg_latency_ms']}",
        ]
        return "\n".join(lines) + "\n"


metrics_store = InMemoryMetrics()


class MetricsMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start = time.perf_counter()
        response: Response = await call_next(request)
        duration_ms = (time.perf_counter() - start) * 1000.0
        metrics_store.record(request.url.path, response.status_code, duration_ms)
        return response


def get_metrics_snapshot(prometheus: bool = False):
    if prometheus:
        return metrics_store.prometheus_text()
    return metrics_store.snapshot()