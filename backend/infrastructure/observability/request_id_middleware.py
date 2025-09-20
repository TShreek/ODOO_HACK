import uuid
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp, Receive, Scope, Send

DEFAULT_HEADER = "X-Request-ID"


class RequestIDMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp, header_name: str = DEFAULT_HEADER):
        super().__init__(app)
        self.header_name = header_name

    async def dispatch(self, request, call_next):  # type: ignore
        request_id = request.headers.get(self.header_name)
        if not request_id:
            request_id = uuid.uuid4().hex
        # Attach to state so handlers/loggers can use it
        request.state.request_id = request_id
        response = await call_next(request)
        response.headers[self.header_name] = request_id
        return response
