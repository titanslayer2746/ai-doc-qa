import { useState, useEffect } from "react";
import { documentAPI } from "../utils/api";

function DocumentList({ onSelectDocument }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const response = await documentAPI.getAll();
      setDocuments(response.data);
    } catch (error) {
      console.error("Failed to fetch documents:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="document-list">
      <h3>📚 Your Documents</h3>
      {loading && <p>Loading...</p>}
      <ul>
        {documents.map((doc) => (
          <li key={doc._id} onClick={() => onSelectDocument(doc._id)}>
            <span>{doc.filename}</span>
            <span className={doc.processed ? "processed" : "processing"}>
              {doc.processed ? "✅" : "⏳"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default DocumentList;
