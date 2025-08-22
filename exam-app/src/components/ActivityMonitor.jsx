import { useEffect, useRef, useCallback } from "react";
import socket from "../../utils/socket";

const ActivityMonitor = ({ candidateId, examId, candidateName, email }) => {
  const idleTimeout = useRef(null);

  const report = useCallback(
    (violationType) => {
      socket.emit("suspicious_event", {
        candidate_id: candidateId,
        exam_id: examId,
        candidate_name: candidateName,
        candidate_email: email,
        violation_type: violationType,
        timestamp: new Date().toISOString(),
      });
    },
    [candidateId, examId, candidateName, email]
  );

  useEffect(() => {
    // Tab switch
    const handleVisibility = () => {
      if (document.hidden) report("tab_switch");
    };

    // Idle detection (60s)
    const resetInactivity = () => {
      clearTimeout(idleTimeout.current);
      idleTimeout.current = setTimeout(() => report("inactivity"), 60000);
    };

    // Text selection
    const handleSelection = (e) => {
      e.preventDefault();
      report("text_selection");
    };

    // Right click
    const handleRightClick = (e) => {
      e.preventDefault();
      report("right_click");
    };

    // Copy
    const handleCopy = () => {
      report("copy");
    };

    // Paste
    const handlePaste = () => {
      report("paste");
    };

    // Listeners
    window.addEventListener("mousemove", resetInactivity);
    window.addEventListener("keydown", resetInactivity);
    document.addEventListener("visibilitychange", handleVisibility);
    document.addEventListener("selectstart", handleSelection);
    document.addEventListener("contextmenu", handleRightClick);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("paste", handlePaste);

    resetInactivity();

    return () => {
      window.removeEventListener("mousemove", resetInactivity);
      window.removeEventListener("keydown", resetInactivity);
      document.removeEventListener("visibilitychange", handleVisibility);
      document.removeEventListener("selectstart", handleSelection);
      document.removeEventListener("contextmenu", handleRightClick);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handlePaste);
      clearTimeout(idleTimeout.current);
    };
  }, [report]);

  return null;
};

export default ActivityMonitor;
