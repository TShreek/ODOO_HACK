import json
import logging
import os
import sys
from datetime import datetime, timezone

REQUEST_ID_ATTR = "request_id"


class JsonLogFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        data = {
            "ts": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "msg": record.getMessage(),
            "service": os.getenv("SERVICE_NAME", "backend"),
            "env": os.getenv("ENVIRONMENT", "local"),
        }
        req_id = getattr(record, REQUEST_ID_ATTR, None)
        if req_id:
            data["request_id"] = req_id
        if record.exc_info:
            data["exc_type"] = record.exc_info[0].__name__ if record.exc_info[0] else None
        return json.dumps(data, separators=(",", ":"))


def configure_logging():
    level = os.getenv("LOG_LEVEL", "INFO").upper()
    root = logging.getLogger()
    if any(isinstance(h, logging.StreamHandler) for h in root.handlers):
        # Assume already configured
        return
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JsonLogFormatter())
    root.setLevel(level)
    root.addHandler(handler)


def bind_request_id(logger: logging.Logger, request_id: str):
    # Convenience to attach request id to log extra
    return logging.LoggerAdapter(logger, {REQUEST_ID_ATTR: request_id})
