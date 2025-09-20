from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from dependencies import get_current_user, CurrentUser
from services.realtime import manager

router = APIRouter()

@router.websocket("/ws/dashboard")
async def websocket_dashboard(ws: WebSocket, current_user: CurrentUser = Depends(get_current_user)):
    tenant_id = current_user.tenant_id
    await manager.connect(tenant_id, ws)
    try:
        while True:
            # We ignore any inbound messages; keep alive / future filters
            await ws.receive_text()
    except WebSocketDisconnect:
        await manager.disconnect(tenant_id, ws)
    except Exception:
        await manager.disconnect(tenant_id, ws)
