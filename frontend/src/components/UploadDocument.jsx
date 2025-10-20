import { useState } from "react";
import { documentAPI } from "../utils/api";

function UploadDocument({ onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    setMessage("");

    try {
      const response = await documentAPI.upload(formData);
      const { documentId, processing: processingStatus } = response.data;

      // Check if document is being processed in queue or already done
      if (processingStatus === "queued") {
        setMessage("✅ Document uploaded! Processing in background...");
        setProcessing(true);

        // Poll for processing status
        pollDocumentStatus(documentId);
      } else {
        setMessage("✅ Document uploaded and processed successfully!");
      }

      onUploadSuccess(documentId);
      setFile(null);
    } catch (error) {
      setMessage(
        "Upload failed: " + (error.response?.data?.error || error.message)
      );
    } finally {
      setUploading(false);
    }
  };

  // Poll document status until processed
  const pollDocumentStatus = async (documentId) => {
    const maxAttempts = 30; // 30 attempts = 1 minute max
    let attempts = 0;

    const checkStatus = async () => {
      try {
        const response = await documentAPI.getStatus(documentId);
        const { processed, chunksCount } = response.data;

        if (processed) {
          setProcessing(false);
          setMessage(
            `✅ Document processed successfully! (${chunksCount} chunks created)`
          );
          return true;
        }

        attempts++;
        if (attempts >= maxAttempts) {
          setProcessing(false);
          setMessage(
            "⚠️ Processing is taking longer than expected. Try refreshing."
          );
          return true;
        }

        // Continue polling
        setTimeout(checkStatus, 2000); // Check every 2 seconds
      } catch (error) {
        console.error("Error checking document status:", error);
        setProcessing(false);
        setMessage("⚠️ Could not verify processing status");
      }
    };

    checkStatus();
  };

  return (
    <div className="upload-section">
      <h2>📄 Upload Document</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="file"
          accept=".pdf,.txt"
          onChange={(e) => setFile(e.target.files[0])}
          disabled={uploading || processing}
        />
        <button type="submit" disabled={!file || uploading || processing}>
          {uploading
            ? "⏳ Uploading..."
            : processing
            ? "🔄 Processing..."
            : "📤 Upload"}
        </button>
      </form>
      {message && (
        <p className={message.includes("failed") ? "error" : "success"}>
          {message}
        </p>
      )}
      {processing && (
        <div className="processing-indicator">
          <div className="spinner"></div>
          <span>Generating embeddings in background...</span>
        </div>
      )}
    </div>
  );
}

export default UploadDocument;
