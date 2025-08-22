import { useEffect, useRef, useCallback } from "react";
import socket from "../utils/socket";

const ActivityMonitor = ({ questionSetId, candidateName, candidateEmail }) => {
  const idleTimeout = useRef(null);

  const report = useCallback((violationType) => {
    socket.emit("suspicious_event", { 
      question_set_id: questionSetId,
      candidate_name: candidateName,
      candidate_email: candidateEmail,
      violation_type: violationType, 
      timestamp: new Date().toISOString() 
    });
  }, [questionSetId, candidateName, candidateEmail]);

  useEffect(() => {
    const handleVisibility = () => { 
      if (document.hidden) report("tab_switch"); 
    };

    const resetInactivity = () => {
      clearTimeout(idleTimeout.current);
      idleTimeout.current = setTimeout(() => report("inactivity"), 60000);
    };

    const handleSelection = () => report("text_selection");
    const handleCopy = () => report("copy");
    const handlePaste = () => report("paste");
    const handleRightClick = () => report("right_click");

    // Activity listeners
    window.addEventListener("mousemove", resetInactivity);
    window.addEventListener("keydown", resetInactivity);
    document.addEventListener("visibilitychange", handleVisibility);
    document.addEventListener("selectstart", handleSelection);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("paste", handlePaste);
    document.addEventListener("contextmenu", handleRightClick);

    resetInactivity();

    return () => {
      window.removeEventListener("mousemove", resetInactivity);
      window.removeEventListener("keydown", resetInactivity);
      document.removeEventListener("visibilitychange", handleVisibility);
      document.removeEventListener("selectstart", handleSelection);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("contextmenu", handleRightClick);
      clearTimeout(idleTimeout.current);
    };
  }, [report]);

  return null;
};

export default ActivityMonitor;
