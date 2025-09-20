import time
import threading
from typing import Dict, Tuple
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, JSONResponse


class TokenBucket:
    def __init__(self, rate: int, per_seconds: int, burst: int):
        self.rate = rate
        self.per = per_seconds
        self.capacity = burst
        self.tokens = burst
        self.updated = time.time()
        self.lock = threading.Lock()

    def allow(self) -> bool:
        now = time.time()
        with self.lock:
            # Refill
            elapsed = now - self.updated
            if elapsed > 0:
                refill = (elapsed / self.per) * self.rate
                if refill > 0:
                    self.tokens = min(self.capacity, self.tokens + refill)
                    self.updated = now
            if self.tokens >= 1:
                self.tokens -= 1
                return True
            return False


class RateLimiter:
    def __init__(self, rate: int = 30, per_seconds: int = 60, burst: int = 60):
        self.rate = rate
        self.per = per_seconds
        self.burst = burst
        self.buckets: Dict[str, TokenBucket] = {}
        self.lock = threading.Lock()

    def check(self, key: str) -> bool:
        with self.lock:
            bucket = self.buckets.get(key)
            if not bucket:
                bucket = TokenBucket(self.rate, self.per, self.burst)
                self.buckets[key] = bucket
        return bucket.allow()


rate_limiter = RateLimiter()


class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host if request.client else "unknown"
        key = f"ip:{client_ip}"
        if not rate_limiter.check(key):
            return JSONResponse(
                status_code=429,
                content={
                    "detail": "Too Many Requests",
                    "retry_after_seconds": rate_limiter.per
                }
            )
        return await call_next(request)