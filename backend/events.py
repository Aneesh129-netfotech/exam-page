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
        print("✅ Client connected")

    @socketio.on("disconnect")
    def handle_disconnect():
        print("❌ Client disconnected")

    @socketio.on("suspicious_event")
    def handle_suspicious_event(data):
        question_set_id = data.get("question_set_id")
        candidate_name = data.get("candidate_name")
        candidate_email = data.get("candidate_email")
        violation_type = data.get("violation_type")

        if not question_set_id or not violation_type:
            print("⚠️ Ignoring event: missing question_set_id or violation_type")
            return  

        column_map = {
            "tab_switch": "tab_switches",
            "inactivity": "inactivities",
            "text_selection": "text_selections",
            "copy": "copies",
            "paste": "pastes",
            "right_click": "right_clicks",
            "face_not_visible": "face_not_visible"
        }

        col = column_map.get(violation_type)
        if not col:
            print(f"⚠️ Unknown violation type: {violation_type}")
            return  

        try:
            # Fetch current violation row
            result = supabase.table("violations") \
                .select(col) \
                .eq("question_set_id", question_set_id) \
                .eq("candidate_email", candidate_email) \
                .execute()

            current_value = result.data[0][col] if result.data else 0

            # Prepare record (ensures row exists or gets created)
            record = {
                "question_set_id": question_set_id,
                "candidate_name": candidate_name,
                "candidate_email": candidate_email,
                col: current_value + 1
            }

            # Upsert (insert if new, update if exists)
            supabase.table("violations").upsert(record).execute()
            # Notify all connected clients about updated violations
            socketio.emit("violation_update", {
                "candidate_email": candidate_email,
                "question_set_id": question_set_id,
                "tab_switches": record.get("tab_switches", 0),
                "inactivities": record.get("inactivities", 0),
                "text_selections": record.get("text_selections", 0),
                "copies": record.get("copies", 0),
                "pastes": record.get("pastes", 0),
                "right_clicks": record.get("right_clicks", 0)
            })

            print(f"✅ {violation_type} logged for {candidate_email} in set {question_set_id}")

        except Exception as e:
            print(f"❌ Failed to update violation: {e}")