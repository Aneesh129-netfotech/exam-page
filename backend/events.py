from flask_socketio import SocketIO
from supabase import create_client
from dotenv import load_dotenv
import os

# Load .env variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Supabase credentials not found! Make sure .env has SUPABASE_URL and SUPABASE_KEY.")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def register_socket_events(socketio: SocketIO):
    @socketio.on("connect")
    def handle_connect():
        pass  # Optional: log or ignore

    @socketio.on("disconnect")
    def handle_disconnect():
        pass  # Optional: log or ignore

    @socketio.on("suspicious_event")
    def handle_suspicious_event(data):
        candidate_id = data.get("candidate_id")
        exam_id = data.get("exam_id")
        candidate_name = data.get("candidate_name")
        violation_type = data.get("violation_type")

        if not candidate_id or not exam_id or not violation_type or not candidate_name:
            return  # Ignore incomplete data

        # Map violation → column
        column_map = {
            "tab_switch": "tab_switches",
            "inactivity": "inactivities",
            "text_selection": "text_selections",
            "copy": "copies",
            "paste": "pastes",
            "right_click": "right_clicks"
        }

        col = column_map.get(violation_type)
        if col:
            try:
                supabase.rpc("increment_violation", {
                    "cand_id": candidate_id,
                    "exam": exam_id,
                    "field": col
                }).execute()
            except Exception as e:
                print(f"⚠️ Failed to update violation: {e}")