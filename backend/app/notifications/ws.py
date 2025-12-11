"""WebSocket notification manager."""
from typing import Dict, Set
from uuid import UUID
from fastapi import WebSocket

# Store active WebSocket connections by user_id
active_connections: Dict[UUID, Set[WebSocket]] = {}


async def connect_websocket(websocket: WebSocket, user_id: UUID):
    """
    Register a WebSocket connection for a user.
    
    Args:
        websocket: The WebSocket connection
        user_id: UUID of the user
    """
    await websocket.accept()
    if user_id not in active_connections:
        active_connections[user_id] = set()
    active_connections[user_id].add(websocket)


async def disconnect_websocket(websocket: WebSocket, user_id: UUID):
    """
    Unregister a WebSocket connection.
    
    Args:
        websocket: The WebSocket connection
        user_id: UUID of the user
    """
    if user_id in active_connections:
        active_connections[user_id].discard(websocket)
        if not active_connections[user_id]:
            del active_connections[user_id]


async def send_to_user(user_id: UUID, message: dict):
    """
    Send a message to all WebSocket connections for a user.
    
    Args:
        user_id: UUID of the user
        message: Dictionary to send as JSON
    """
    if user_id not in active_connections:
        return
    
    disconnected = set()
    for websocket in active_connections[user_id]:
        try:
            await websocket.send_json(message)
        except Exception:
            disconnected.add(websocket)
    
    # Remove disconnected websockets
    for ws in disconnected:
        active_connections[user_id].discard(ws)


async def send_to_admins(message: dict, db):
    """
    Send a message to all admin users.
    
    Args:
        message: Dictionary to send as JSON
        db: Database session
    """
    from app.models import User, UserRole
    
    admins = db.query(User).filter(User.role == UserRole.ADMIN).all()
    for admin in admins:
        await send_to_user(admin.id, message)

