import asyncio
from typing import Dict, Set, Any
from fastapi import WebSocket
import uuid

class ConnectionManager:
    def __init__(self):
        self._lock = asyncio.Lock()
        # tenant_id -> set of websockets
        self._connections: Dict[uuid.UUID, Set[WebSocket]] = {}

    async def connect(self, tenant_id: uuid.UUID, websocket: WebSocket):
        await websocket.accept()
        async with self._lock:
            self._connections.setdefault(tenant_id, set()).add(websocket)

    async def disconnect(self, tenant_id: uuid.UUID, websocket: WebSocket):
        async with self._lock:
            conns = self._connections.get(tenant_id)
            if conns and websocket in conns:
                conns.remove(websocket)
                if not conns:
                    self._connections.pop(tenant_id, None)

    async def broadcast(self, tenant_id: uuid.UUID, message: Dict[str, Any]):
        async with self._lock:
            conns = list(self._connections.get(tenant_id, []))
        remove: list[WebSocket] = []
        for ws in conns:
            try:
                await ws.send_json(message)
            except Exception:
                remove.append(ws)
        if remove:
            async with self._lock:
                live = self._connections.get(tenant_id, set())
                for r in remove:
                    live.discard(r)
                if not live:
                    self._connections.pop(tenant_id, None)

manager = ConnectionManager()

async def notify_journal_update(tenant_id: uuid.UUID):
    await manager.broadcast(tenant_id, {"type": "journal_update"})
