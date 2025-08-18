import { useEffect } from "react";

const WarningPopup = ({ message, onHide }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onHide();
    }, 3000); // Auto-hide after 3s
    return () => clearTimeout(timer);
  },);

  return (
    <div className="warning-popup">
      {message}
    </div>
  );
};

export default WarningPopup;
