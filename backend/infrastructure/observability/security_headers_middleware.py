from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, *, csp: str | None = None):
        super().__init__(app)
        self.csp = csp or "default-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'"

    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)
        # Basic hardened defaults (adjust for frontend integration as needed)
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        response.headers.setdefault("X-XSS-Protection", "0")  # Modern browsers rely on CSP
        response.headers.setdefault("Content-Security-Policy", self.csp)
        response.headers.setdefault("Permissions-Policy", "geolocation=(), microphone=(), camera=()")
        return response
