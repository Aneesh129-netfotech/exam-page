from flask import Flask, jsonify, request
from flask_socketio import SocketIO
from flask_cors import CORS
from dotenv import load_dotenv
import os
import logging
import asyncio

from events import register_socket_events
from test_generator import generate_questions, TestRequest  # your async generator

load_dotenv()

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
        # For demo, we generate questions based on test_id as topic
        test_request = TestRequest(
            topic=f"Demo topic for test {test_id}",
            difficulty="easy",
            num_questions=5,
            question_type="mcq",
            jd_id=test_id
        )

        # Run async generator safely in existing event loop
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
        # TODO: Evaluate or save answers to DB if needed
        return jsonify({"status": "success", "submitted_data": data})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=5173, debug=False)
