import { useEffect, useRef, useCallback } from "react";
import socket from "../utils/socket";

const ActivityMonitor = ({ candidateId, examId, candidateName, email }) => {
  const idleTimeout = useRef(null);

  const report = useCallback((violationType) => {
    socket.emit("suspicious_event", { 
      candidate_id: candidateId, 
      exam_id: examId, 
      candidate_name: candidateName,
      email: email,
      violation_type: violationType, 
      timestamp: new Date().toISOString() 
    });
  }, [candidateId, examId, candidateName, email]);

  useEffect(() => {
    const handleVisibility = () => { if (document.hidden) report("tab_switch"); };

    const resetInactivity = () => {
      clearTimeout(idleTimeout.current);
      idleTimeout.current = setTimeout(() => report("inactivity"), 60000);
    };

    const handleSelection = (e) => { e.preventDefault(); report("text_selection"); };

    const allowRightClick = (e) => { e.stopPropagation(); };

    window.addEventListener("mousemove", resetInactivity);
    window.addEventListener("keydown", resetInactivity);
    document.addEventListener("visibilitychange", handleVisibility);
    document.addEventListener("selectstart", handleSelection);
    document.addEventListener("contextmenu", allowRightClick, true);

    resetInactivity();

    return () => {
      window.removeEventListener("mousemove", resetInactivity);
      window.removeEventListener("keydown", resetInactivity);
      document.removeEventListener("visibilitychange", handleVisibility);
      document.removeEventListener("selectstart", handleSelection);
      document.removeEventListener("contextmenu", allowRightClick, true);
      clearTimeout(idleTimeout.current);
    };
  }, [report]);

  return null;
};

export default ActivityMonitor;
