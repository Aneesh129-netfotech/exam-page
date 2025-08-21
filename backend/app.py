from flask import Flask, jsonify, request
from flask_socketio import SocketIO
from flask_cors import CORS
from dotenv import load_dotenv
import os
import logging
import asyncio
from supabase import create_client

from events import register_socket_events
from test_generator import generate_questions, TestRequest  # your async generator

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

app = Flask(__name__)
CORS(app, supports_credentials=True)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "defaultsecret")

# Disable Flask logs
log = logging.getLogger('werkzeug')
log.setLevel(logging.ERROR)

socketio = SocketIO(app, cors_allowed_origins="*", async_mode="threading")
register_socket_events(socketio)

@app.route("/")
def index():
    return jsonify({"status": "Server is running."})

# GET test by ID (generate questions on the fly for demo)
@app.route("/api/test/<test_id>", methods=["GET"])
def get_test(test_id):
    try:
        test_request = TestRequest(
            topic=f"Demo topic for test {test_id}",
            difficulty="easy",
            num_questions=5,
            question_type="mcq",
            jd_id=test_id
        )
        questions = asyncio.run(generate_questions(test_request))
        return jsonify({"test_id": test_id, "questions": questions})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# POST generate test
@app.route("/api/test/generate", methods=["POST"])
def generate_test_route():
    try:
        data = request.get_json()
        test_request = TestRequest(
            topic=data.get("topic"),
            difficulty=data.get("difficulty", "easy"),
            num_questions=data.get("num_questions", 5),
            question_type=data.get("question_type", "mcq"),
            jd_id=data.get("jd_id"),
            mcq_count=data.get("mcq_count"),
            coding_count=data.get("coding_count")
        )
        questions = asyncio.run(generate_questions(test_request))
        return jsonify({"questions": questions})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# POST submit test
@app.route("/api/test/submit", methods=["POST"])
def submit_test():
    try:
        data = request.get_json()
        return jsonify({"status": "success", "submitted_data": data})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# GET feedback summary
@app.route("/api/feedback/<candidate_id>/<exam_id>", methods=["GET"])
def get_feedback(candidate_id, exam_id):
    try:
        response = supabase.table("violations") \
            .select("*") \
            .eq("candidate_id", candidate_id) \
            .eq("exam_id", exam_id) \
            .execute()
        return jsonify(response.data[0] if response.data else {})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# POST feedback (insert or update)
@app.route("/api/feedback", methods=["POST"])
def post_feedback():
    try:
        data = request.get_json()
 
        candidate_id = data.get("candidate_id")
        exam_id = data.get("exam_id")
 
        if not candidate_id or not exam_id:
            return jsonify({"error": "candidate_id and exam_id are required"}), 400
 
        # Default values for all counters
        feedback = {
            "candidate_id": candidate_id,
            "exam_id": exam_id,
            "tab_switches": data.get("tab_switches", 0),
            "inactivities": data.get("inactivities", 0),
            "copies": data.get("copies", 0),
            "pastes": data.get("pastes", 0),
            "right_clicks": data.get("right_clicks", 0),
            "text_selections": data.get("text_selections", 0),
        }
 
        # Upsert into Supabase (insert if not exists, update if exists)
        response = supabase.table("violations").upsert(feedback).execute()
 
        return jsonify({
            "status": "success",
            "saved_data": feedback
        })
 
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=5173, debug=False)