"""
IBVAP — WebSocket connection manager.
Thread-safe enough for a single-process FastAPI prototype.
"""
from __future__ import annotations
import json
from typing import List

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self) -> None:
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket) -> None:
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict) -> None:
        """Send JSON message to all connected clients. Dead connections are dropped silently."""
        message_str = json.dumps(message, default=str)
        dead: List[WebSocket] = []
        for connection in list(self.active_connections):
            try:
                await connection.send_text(message_str)
            except Exception:
                dead.append(connection)
        for d in dead:
            self.disconnect(d)

    @property
    def connection_count(self) -> int:
        return len(self.active_connections)


# Module-level singleton
manager = ConnectionManager()
