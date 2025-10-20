import { useState } from "react";
import UploadDocument from "./components/UploadDocument";
import ChatInterface from "./components/ChatInterface";
import DocumentList from "./components/DocumentList";
import ConnectionStatus from "./components/ConnectionStatus";
import "./App.css";

function App() {
  const [documentId, setDocumentId] = useState(null);

  return (
    <div className="App">
      <header>
        <h1>🤖 AI Document Q&A</h1>
        <p>Upload documents and ask questions powered by Gemini AI</p>
        <ConnectionStatus />
      </header>

      <div className="container">
        <UploadDocument onUploadSuccess={setDocumentId} />
        {documentId && <ChatInterface documentId={documentId} />}
      </div>
    </div>
  );
}

export default App;
