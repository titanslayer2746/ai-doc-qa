import { useState, useEffect } from "react";
import { documentAPI } from "../utils/api";

function ConnectionStatus() {
  const [status, setStatus] = useState("checking");
  const [message, setMessage] = useState("Checking backend connection...");

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const response = await documentAPI.healthCheck();
      if (response.data.status === "OK") {
        setStatus("connected");
        setMessage("✅ Backend connected on port 5000");
      }
    } catch (error) {
      setStatus("disconnected");
      setMessage(
        "❌ Backend not connected. Make sure it's running on port 5000"
      );
      console.error("Connection error:", error);
    }
  };

  return (
    <div className={`connection-status ${status}`}>
      <span>{message}</span>
      {status === "disconnected" && (
        <button onClick={checkConnection} className="retry-btn">
          Retry
        </button>
      )}
    </div>
  );
}

export default ConnectionStatus;
