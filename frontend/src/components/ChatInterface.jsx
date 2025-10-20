import { useState, useEffect } from "react";
import { documentAPI } from "../utils/api";

function ChatInterface({ documentId }) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [documentReady, setDocumentReady] = useState(false);
  const [checking, setChecking] = useState(true);

  // Check if document is processed before allowing questions
  useEffect(() => {
    checkDocumentStatus();
  }, [documentId]);

  const checkDocumentStatus = async () => {
    try {
      const response = await documentAPI.getStatus(documentId);
      const { processed } = response.data;

      setDocumentReady(processed);
      setChecking(false);

      if (!processed) {
        setMessages([
          {
            type: "info",
            text: "⏳ Document is still being processed. Please wait...",
          },
        ]);

        // Poll until ready
        setTimeout(checkDocumentStatus, 3000);
      }
    } catch (error) {
      console.error("Error checking document status:", error);
      setChecking(false);
      setDocumentReady(true); // Assume ready on error
    }
  };

  const handleAsk = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    const userMessage = { type: "question", text: question };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const response = await documentAPI.query(documentId, question);

      const answerMessage = {
        type: "answer",
        text: response.data.answer.answer,
        cached: response.data.cached,
        relevantChunks: response.data.answer.relevantChunks,
      };

      setMessages((prev) => [...prev, answerMessage]);
      setQuestion("");
    } catch (error) {
      const errorMessage = {
        type: "error",
        text: "Query failed: " + (error.response?.data?.error || error.message),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-section">
      <h2>💬 Ask Questions</h2>

      {checking && (
        <div className="message loading">
          <strong>🔍</strong> Checking document status...
        </div>
      )}

      {!checking && !documentReady && (
        <div className="message loading">
          <strong>⏳</strong> Document is being processed. Please wait...
        </div>
      )}

      {!checking && documentReady && (
        <>
          <div className="chat-messages">
            {messages.length === 0 && (
              <p className="empty-state">
                Ask a question about your document...
              </p>
            )}

            {messages.map((msg, idx) => (
              <div key={idx} className={`message ${msg.type}`}>
                {msg.type === "question" && <strong>Q:</strong>}
                {msg.type === "answer" && <strong>A:</strong>}
                {msg.type === "error" && <strong>❌</strong>}
                {msg.type === "info" && <strong>ℹ️</strong>}
                <p>{msg.text}</p>
                {msg.cached && (
                  <small className="cached-badge">⚡ From cache</small>
                )}
              </div>
            ))}

            {loading && (
              <div className="message loading">
                <strong>🤔</strong> Thinking...
              </div>
            )}
          </div>

          <form onSubmit={handleAsk} className="chat-input">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question..."
              disabled={loading || !documentReady}
            />
            <button
              type="submit"
              disabled={!question.trim() || loading || !documentReady}
            >
              {loading ? "⏳" : "🚀"} Ask
            </button>
          </form>
        </>
      )}
    </div>
  );
}

export default ChatInterface;
