import { io } from "socket.io-client";

// Connect to the Flask Socket.IO server
const socket = io("https://cheating-7.onrender.com/", {
  withCredentials: true,
  transports: ["websocket"],
});

socket.on("connect", () => {
  console.log("✅ Connected to backend with socket ID:", socket.id);
});

socket.on("connect_error", (err) => {
  console.error("❌ Socket connection error:", err.message);
});

// ✅ Helper function to emit violations (aligned with backend)
export function emitViolation(questionSetId, candidateName, candidateEmail, violationType) {
  socket.emit("suspicious_event", {
    question_set_id: questionSetId,
    candidate_name: candidateName,
    candidate_email: candidateEmail,
    violation_type: violationType,
    timestamp: new Date().toISOString(),
  });
}

export default socket;