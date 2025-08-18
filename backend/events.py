from flask import request
from flask_socketio import SocketIO

def register_socket_events(socketio: SocketIO):
    @socketio.on("connect")
    def handle_connect():
        pass  # No console logs

    @socketio.on("disconnect")
    def handle_disconnect():
        pass  # No console logs

    @socketio.on("suspicious_event")
    def handle_suspicious_event(data):
        event_type = data.get("type")
        timestamp = data.get("timestamp")

        # ✅ Only emit to client, no logs saved
        socketio.emit("warning", {
            "type": event_type,
            "timestamp": timestamp
        }, to=request.sid)
