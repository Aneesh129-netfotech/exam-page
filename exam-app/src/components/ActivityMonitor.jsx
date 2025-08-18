import { useEffect, useRef } from "react";
import socket from "../utils/socket";

const ActivityMonitor = ({ onWarning }) => {
  const idleTimeout = useRef(null);

  const report = (type) => {
    socket.emit("suspicious_event", {
      type,
      timestamp: new Date().toISOString(),
    });

    if (onWarning) onWarning(type);
  };

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) report("tab_switch");
    };

    const resetInactivity = () => {
      clearTimeout(idleTimeout.current);
      idleTimeout.current = setTimeout(() => report("inactivity"), 60000); // 60 sec idle
    };

    window.addEventListener("mousemove", resetInactivity);
    window.addEventListener("keydown", resetInactivity);
    document.addEventListener("visibilitychange", handleVisibility);

    resetInactivity();

    // ✅ Block only text selection
    const handleSelection = (e) => {
      e.preventDefault();
      report("text_selection");
    };

    document.addEventListener("selectstart", handleSelection);

    // ✅ Remove ALL contextmenu listeners (right-click allowed)
    const allowRightClick = (e) => {
      e.stopPropagation(); // Stop any other handler
    };

    document.addEventListener("contextmenu", allowRightClick, true);

    return () => {
      window.removeEventListener("mousemove", resetInactivity);
      window.removeEventListener("keydown", resetInactivity);
      document.removeEventListener("visibilitychange", handleVisibility);
      document.removeEventListener("selectstart", handleSelection);
      document.removeEventListener("contextmenu", allowRightClick, true);
      clearTimeout(idleTimeout.current);
    };
  }, );

  return null;
};

export default ActivityMonitor;
