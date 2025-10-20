# AI-Powered Document Q&A System

A minimal full-stack learning project that demonstrates Generative AI, RAG, React, Node.js, Express.js, MongoDB, AWS deployment, PM2, Redis caching, Bull Queue, and TDD with Jest.

## 🎯 Project Overview

Build a simple app where users upload documents (PDF/TXT), and an AI answers questions about them using Retrieval-Augmented Generation (RAG).

---

## 🛠 Tech Stack

- **Frontend**: React + Vite (fast dev server, file upload, chat interface)
- **Backend**: Node.js + Express.js
- **Database**: MongoDB (store documents metadata, chat history)
- **AI**: Gemini API (free tier) for embeddings + LLM
- **RAG**: Simple vector storage in MongoDB
- **Cache**: Redis (cache frequent queries)
- **Queue**: Bull (process document uploads async)
- **Deployment**: AWS EC2 + PM2
- **Testing**: Jest (TDD approach)

---

## 📁 Project Structure

```
ai-doc-qa/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js
│   │   │   └── redis.js
│   │   ├── routes/
│   │   │   └── document.routes.js
│   │   ├── controllers/
│   │   │   └── document.controller.js
│   │   ├── models/
│   │   │   └── Document.js
│   │   ├── services/
│   │   │   ├── ai.service.js
│   │   │   └── rag.service.js
│   │   ├── queues/
│   │   │   └── document.queue.js
│   │   └── app.js
│   ├── tests/
│   ├── .env
│   ├── server.js
│   └── ecosystem.config.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── UploadDocument.jsx
│   │   │   ├── ChatInterface.jsx
│   │   │   └── DocumentList.jsx
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
└── README.md
```

---

## 📅 3-Day Implementation Plan

### **DAY 1: Backend Foundation + AI Integration**

#### **Step 1: Project Setup (30 min)**

```bash
mkdir ai-doc-qa && cd ai-doc-qa
mkdir backend frontend
cd backend
npm init -y
npm install express mongoose dotenv cors
npm install --save-dev jest supertest nodemon
```

Create basic folder structure as shown above.

---

#### **Step 2: MongoDB Setup + First Test (45 min)**

**Install MongoDB:**

- Local: Follow [MongoDB installation guide](https://docs.mongodb.com/manual/installation/)
- Cloud: Use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (free tier)

**Write your first test (TDD approach):**

`tests/db.test.js`:

```javascript
const mongoose = require("mongoose");
const { connectDB } = require("../src/config/db");

describe("Database Connection", () => {
  it("should connect to MongoDB", async () => {
    await connectDB();
    expect(mongoose.connection.readyState).toBe(1);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });
});
```

**Create Document Model:**

`src/models/Document.js`:

```javascript
const mongoose = require("mongoose");

const DocumentSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    content: { type: String, required: true },
    chunks: [
      {
        text: String,
        embedding: [Number],
      },
    ],
    processed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Document", DocumentSchema);
```

---

#### **Step 3: Gemini AI Integration (1.5 hrs)**

```bash
npm install @google/generative-ai
```

**Get your free Gemini API key:**

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with Google account
3. Click "Get API Key"
4. Copy the key to your `.env` file

**Create AI Service:**

`src/services/ai.service.js`:

```javascript
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

class AIService {
  async generateEmbedding(text) {
    const model = genAI.getGenerativeModel({ model: "embedding-001" });
    const result = await model.embedContent(text);
    return result.embedding.values;
  }

  async generateAnswer(context, question) {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = `Context: ${context}\n\nQuestion: ${question}\n\nAnswer:`;
    const result = await model.generateContent(prompt);
    return result.response.text();
  }
}

module.exports = new AIService();
```

**Write tests:**

`tests/ai.service.test.js`:

```javascript
const aiService = require("../src/services/ai.service");

describe("AI Service", () => {
  it("should generate embeddings", async () => {
    const embedding = await aiService.generateEmbedding("Hello world");
    expect(Array.isArray(embedding)).toBe(true);
    expect(embedding.length).toBeGreaterThan(0);
  });

  it("should generate answer", async () => {
    const answer = await aiService.generateAnswer(
      "The sky is blue.",
      "What color is the sky?"
    );
    expect(typeof answer).toBe("string");
    expect(answer.length).toBeGreaterThan(0);
  });
});
```

---

#### **Step 4: Document Upload Endpoint (1 hr)**

```bash
npm install multer pdf2json
```

**Create upload route:**

`src/routes/document.routes.js`:

```javascript
const express = require("express");
const multer = require("multer");
const { uploadDocument } = require("../controllers/document.controller");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/upload", upload.single("file"), uploadDocument);

module.exports = router;
```

**Create controller:**

`src/controllers/document.controller.js`:

```javascript
const fs = require("fs");
const PDFParser = require("pdf2json");
const Document = require("../models/Document");
const documentQueue = require("../queues/document.queue");

// Helper function to parse PDF
const parsePDF = (filePath) => {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser();

    pdfParser.on("pdfParser_dataError", (errData) =>
      reject(errData.parserError)
    );

    pdfParser.on("pdfParser_dataReady", (pdfData) => {
      const text = pdfParser.getRawTextContent();
      resolve(text);
    });

    pdfParser.loadPDF(filePath);
  });
};

exports.uploadDocument = async (req, res) => {
  try {
    const { path, originalname } = req.file;

    // Extract text from PDF or TXT
    let text;
    if (originalname.endsWith(".pdf")) {
      text = await parsePDF(path);
    } else {
      text = fs.readFileSync(path, "utf8");
    }

    // Save to MongoDB
    const document = await Document.create({
      filename: originalname,
      content: text,
    });

    // Add to processing queue
    await documentQueue.add("process-document", { documentId: document._id });

    // Clean up uploaded file
    fs.unlinkSync(path);

    res.json({
      message: "Document uploaded successfully",
      documentId: document._id,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

---

### **DAY 2: RAG + Queue + Cache**

#### **Step 5: Redis Setup (30 min)**

```bash
npm install redis
```

**Install Redis:**

- Local: `brew install redis` (Mac) or follow [Redis installation guide](https://redis.io/docs/getting-started/installation/)
- Cloud: Use [Redis Cloud](https://redis.com/try-free/) (free tier)

**Create Redis client:**

`src/config/redis.js`:

```javascript
const redis = require("redis");

const client = redis.createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

client.on("error", (err) => console.error("Redis error:", err));
client.connect();

module.exports = client;
```

**Write test:**

`tests/redis.test.js`:

```javascript
const redisClient = require("../src/config/redis");

describe("Redis Connection", () => {
  it("should connect to Redis", async () => {
    await redisClient.set("test-key", "test-value");
    const value = await redisClient.get("test-key");
    expect(value).toBe("test-value");
  });

  afterAll(async () => {
    await redisClient.quit();
  });
});
```

---

#### **Step 6: Bull Queue for Document Processing (1.5 hrs)**

```bash
npm install bull
```

**Create document queue:**

`src/queues/document.queue.js`:

```javascript
const Queue = require("bull");
const Document = require("../models/Document");
const ragService = require("../services/rag.service");

const documentQueue = new Queue("document-processing", {
  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: process.env.REDIS_PORT || 6379,
  },
});

documentQueue.process("process-document", async (job) => {
  const { documentId } = job.data;

  try {
    const document = await Document.findById(documentId);

    // Process document with RAG service
    await ragService.storeDocumentChunks(documentId, document.content);

    // Mark as processed
    document.processed = true;
    await document.save();

    return { success: true, documentId };
  } catch (error) {
    console.error("Queue processing error:", error);
    throw error;
  }
});

module.exports = documentQueue;
```

**Write test:**

`tests/queue.test.js`:

```javascript
const documentQueue = require("../src/queues/document.queue");

describe("Document Queue", () => {
  it("should add job to queue", async () => {
    const job = await documentQueue.add("process-document", {
      documentId: "test-id-123",
    });
    expect(job.id).toBeDefined();
  });

  afterAll(async () => {
    await documentQueue.close();
  });
});
```

---

#### **Step 7: RAG Implementation (2 hrs)**

**Create RAG service:**

`src/services/rag.service.js`:

```javascript
const Document = require("../models/Document");
const aiService = require("./ai.service");

class RAGService {
  // Split text into chunks of ~500 characters
  chunkText(text, chunkSize = 500) {
    const chunks = [];
    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.slice(i, i + chunkSize));
    }
    return chunks;
  }

  // Store document chunks with embeddings
  async storeDocumentChunks(documentId, text) {
    const chunks = this.chunkText(text);
    const document = await Document.findById(documentId);

    document.chunks = [];

    for (const chunk of chunks) {
      const embedding = await aiService.generateEmbedding(chunk);
      document.chunks.push({ text: chunk, embedding });
    }

    await document.save();
    return document;
  }

  // Calculate cosine similarity
  cosineSimilarity(vecA, vecB) {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }

  // Find relevant chunks using similarity search
  async findRelevantChunks(documentId, question, topK = 3) {
    const document = await Document.findById(documentId);
    const questionEmbedding = await aiService.generateEmbedding(question);

    const chunksWithScores = document.chunks.map((chunk) => ({
      text: chunk.text,
      score: this.cosineSimilarity(questionEmbedding, chunk.embedding),
    }));

    return chunksWithScores.sort((a, b) => b.score - a.score).slice(0, topK);
  }

  // Answer question using RAG
  async answerQuestion(documentId, question) {
    const relevantChunks = await this.findRelevantChunks(documentId, question);
    const context = relevantChunks.map((c) => c.text).join("\n\n");
    const answer = await aiService.generateAnswer(context, question);

    return {
      answer,
      relevantChunks: relevantChunks.map((c) => ({
        text: c.text.substring(0, 100) + "...",
        score: c.score,
      })),
    };
  }
}

module.exports = new RAGService();
```

**Write tests:**

`tests/rag.service.test.js`:

```javascript
const ragService = require("../src/services/rag.service");

describe("RAG Service", () => {
  it("should chunk text correctly", () => {
    const text = "a".repeat(1200);
    const chunks = ragService.chunkText(text, 500);
    expect(chunks.length).toBe(3);
  });

  it("should calculate cosine similarity", () => {
    const vec1 = [1, 0, 0];
    const vec2 = [1, 0, 0];
    const similarity = ragService.cosineSimilarity(vec1, vec2);
    expect(similarity).toBeCloseTo(1);
  });
});
```

---

#### **Step 8: Query Endpoint with Redis Cache (1 hr)**

**Add query controller:**

`src/controllers/document.controller.js` (add to existing file):

```javascript
const redisClient = require("../config/redis");
const ragService = require("../services/rag.service");

exports.queryDocument = async (req, res) => {
  try {
    const { documentId, question } = req.body;

    // Create cache key
    const cacheKey = `query:${documentId}:${question}`;

    // Check cache
    const cachedAnswer = await redisClient.get(cacheKey);
    if (cachedAnswer) {
      return res.json({
        answer: JSON.parse(cachedAnswer),
        cached: true,
      });
    }

    // Get answer from RAG
    const result = await ragService.answerQuestion(documentId, question);

    // Cache for 1 hour
    await redisClient.setEx(cacheKey, 3600, JSON.stringify(result));

    res.json({
      answer: result,
      cached: false,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

**Add route:**

`src/routes/document.routes.js` (add to existing file):

```javascript
router.post("/query", queryDocument);
```

---

### **DAY 3: Frontend + AWS Deployment**

#### **Step 9: React Frontend with Vite (2.5 hrs)**

```bash
cd ../frontend
npm create vite@latest . -- --template react
npm install
npm install axios
```

**Configure Vite:**

`vite.config.js`:

```javascript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
});
```

**Create components:**

`src/components/UploadDocument.jsx`:

```javascript
import { useState } from "react";
import axios from "axios";

function UploadDocument({ onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    setMessage("");

    try {
      const response = await axios.post("/api/documents/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMessage("Document uploaded successfully! Processing...");
      onUploadSuccess(response.data.documentId);
      setFile(null);
    } catch (error) {
      setMessage(
        "Upload failed: " + (error.response?.data?.error || error.message)
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="upload-section">
      <h2>📄 Upload Document</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="file"
          accept=".pdf,.txt"
          onChange={(e) => setFile(e.target.files[0])}
          disabled={uploading}
        />
        <button type="submit" disabled={!file || uploading}>
          {uploading ? "⏳ Uploading..." : "📤 Upload"}
        </button>
      </form>
      {message && (
        <p className={message.includes("failed") ? "error" : "success"}>
          {message}
        </p>
      )}
    </div>
  );
}

export default UploadDocument;
```

`src/components/ChatInterface.jsx`:

```javascript
import { useState } from "react";
import axios from "axios";

function ChatInterface({ documentId }) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleAsk = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    const userMessage = { type: "question", text: question };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const response = await axios.post("/api/documents/query", {
        documentId,
        question,
      });

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

      <div className="chat-messages">
        {messages.length === 0 && (
          <p className="empty-state">Ask a question about your document...</p>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.type}`}>
            {msg.type === "question" && <strong>Q:</strong>}
            {msg.type === "answer" && <strong>A:</strong>}
            {msg.type === "error" && <strong>❌</strong>}
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
          disabled={loading}
        />
        <button type="submit" disabled={!question.trim() || loading}>
          {loading ? "⏳" : "🚀"} Ask
        </button>
      </form>
    </div>
  );
}

export default ChatInterface;
```

`src/components/DocumentList.jsx`:

```javascript
import { useState, useEffect } from "react";
import axios from "axios";

function DocumentList({ onSelectDocument }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/documents");
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
```

`src/App.jsx`:

```javascript
import { useState } from "react";
import UploadDocument from "./components/UploadDocument";
import ChatInterface from "./components/ChatInterface";
import DocumentList from "./components/DocumentList";
import "./App.css";

function App() {
  const [documentId, setDocumentId] = useState(null);

  return (
    <div className="App">
      <header>
        <h1>🤖 AI Document Q&A</h1>
        <p>Upload documents and ask questions powered by Gemini AI</p>
      </header>

      <div className="container">
        <UploadDocument onUploadSuccess={setDocumentId} />
        {documentId && <ChatInterface documentId={documentId} />}
      </div>
    </div>
  );
}

export default App;
```

`src/App.css`:

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
    Ubuntu, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}

.App {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

header {
  text-align: center;
  color: white;
  margin-bottom: 2rem;
}

header h1 {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.container {
  display: grid;
  gap: 2rem;
  grid-template-columns: 1fr;
}

.upload-section,
.chat-section {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

h2 {
  margin-bottom: 1rem;
  color: #333;
}

form {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

input[type="file"],
input[type="text"] {
  flex: 1;
  padding: 0.75rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
}

button {
  padding: 0.75rem 1.5rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: background 0.3s;
}

button:hover:not(:disabled) {
  background: #5568d3;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.chat-messages {
  max-height: 400px;
  overflow-y: auto;
  margin-bottom: 1rem;
  padding: 1rem;
  background: #f7fafc;
  border-radius: 8px;
}

.message {
  margin-bottom: 1rem;
  padding: 1rem;
  border-radius: 8px;
}

.message.question {
  background: #e6f3ff;
  border-left: 4px solid #667eea;
}

.message.answer {
  background: #e6ffe6;
  border-left: 4px solid #48bb78;
}

.message.error {
  background: #ffe6e6;
  border-left: 4px solid #f56565;
}

.message.loading {
  background: #fff5e6;
  border-left: 4px solid #ed8936;
}

.cached-badge {
  display: inline-block;
  background: #ffd700;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  margin-top: 0.5rem;
}

.empty-state {
  text-align: center;
  color: #999;
  font-style: italic;
}

.success {
  color: #48bb78;
  margin-top: 0.5rem;
}

.error {
  color: #f56565;
  margin-top: 0.5rem;
}
```

**Why Vite?**

- ⚡ Lightning-fast HMR (Hot Module Replacement)
- 🚀 Instant server start (no bundling in dev)
- 📦 Optimized production builds with Rollup
- 🔧 Simple configuration
- 🎯 Better developer experience than CRA

---

#### **Step 10: AWS EC2 Setup (1 hr)**

**Launch EC2 Instance:**

1. Go to AWS Console → EC2
2. Launch Instance
3. Choose Ubuntu 22.04 LTS (free tier)
4. Instance type: t2.micro
5. Create key pair (download .pem file)
6. Security Group: Allow ports 22, 80, 3000, 5000
7. Launch instance

**Connect to EC2:**

```bash
chmod 400 your-key.pem
ssh -i your-key.pem ubuntu@your-ec2-ip
```

**Install dependencies:**

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod

# Install Redis
sudo apt install -y redis-server
sudo systemctl start redis
sudo systemctl enable redis

# Install PM2
sudo npm install -g pm2
```

---

#### **Step 11: PM2 Deployment (1 hr)**

**Create PM2 config:**

`backend/ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: "ai-doc-qa-backend",
      script: "./server.js",
      instances: 2,
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 5000,
        MONGODB_URI: "mongodb://localhost:27017/ai-doc-qa",
        REDIS_URL: "redis://localhost:6379",
        GEMINI_API_KEY: process.env.GEMINI_API_KEY,
      },
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
  ],
};
```

**Deploy to EC2:**

```bash
# On local machine
git init
git add .
git commit -m "Initial commit"
git push origin main

# On EC2
cd ~
git clone your-repo-url
cd ai-doc-qa

# Backend setup
cd backend
npm install
echo "GEMINI_API_KEY=your-key-here" > .env

# Frontend setup & build
cd ../frontend
npm install
npm run build
# Serve built files with nginx or serve them via Express

# Start backend with PM2
cd ../backend
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Monitor
pm2 status
pm2 logs
pm2 monit
```

**PM2 commands:**

```bash
pm2 restart ai-doc-qa-backend
pm2 stop ai-doc-qa-backend
pm2 delete ai-doc-qa-backend
pm2 reload ai-doc-qa-backend  # Zero downtime reload
```

**Serve Vite Frontend (Option 1: Express Static):**

Add to your `backend/src/app.js`:

```javascript
const path = require("path");

// Serve static files from Vite build
app.use(express.static(path.join(__dirname, "../../frontend/dist")));

// Catch-all route for client-side routing
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../../frontend/dist/index.html"));
});
```

**Serve Vite Frontend (Option 2: Nginx):**

`/etc/nginx/sites-available/ai-doc-qa`:

```nginx
server {
  listen 80;
  server_name your-domain.com;

  # Frontend
  location / {
    root /home/ubuntu/ai-doc-qa/frontend/dist;
    try_files $uri $uri/ /index.html;
  }

  # Backend API
  location /api {
    proxy_pass http://localhost:5000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}
```

---

#### **Step 12: Final Testing & Cleanup (30 min)**

**Run all tests:**

```bash
cd backend
npm test
npm test -- --coverage
```

**Test full flow:**

1. Upload a document
2. Wait for processing (check PM2 logs)
3. Query the document
4. Verify caching (second query should be faster)

**Add error handling:**

- Validate file types
- Handle missing documents
- Handle AI API failures
- Add rate limiting

**Update README with:**

- Setup instructions
- Environment variables
- API endpoints
- Testing commands

---

## 🏗 System Architecture

```
User → React (Port 3000)
         ↓
    Express API (Port 5000)
         ↓
    ┌────┼────┐
    ↓    ↓    ↓
MongoDB Redis Bull Queue
    ↓          ↓
Store Docs   Process:
  ↓          - Chunk text
RAG Search   - Generate embeddings
  ↓          - Store in MongoDB
Generate     ↓
Answer  ←────┘
  ↓
Gemini API
```

---

## 🔑 Environment Variables

Create `.env` file in backend folder:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/ai-doc-qa

# Redis
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379

# Gemini API
GEMINI_API_KEY=your_gemini_api_key_here

# Server
PORT=5000
NODE_ENV=development
```

---

## 🚀 Running the Application

**Development mode:**

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend (Vite)
cd frontend
npm run dev

# Terminal 3 - Queue Worker (optional separate process)
cd backend
node src/queues/document.queue.js
```

**Production mode (with PM2):**

```bash
cd backend
pm2 start ecosystem.config.js
pm2 logs
```

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test tests/ai.service.test.js

# Watch mode
npm test -- --watch
```

---

## 📚 API Endpoints

### Upload Document

```http
POST /api/documents/upload
Content-Type: multipart/form-data

Body: { file: <PDF or TXT file> }

Response: {
  "message": "Document uploaded successfully",
  "documentId": "507f1f77bcf86cd799439011"
}
```

### Query Document

```http
POST /api/documents/query
Content-Type: application/json

Body: {
  "documentId": "507f1f77bcf86cd799439011",
  "question": "What is the main topic?"
}

Response: {
  "answer": {
    "answer": "The main topic is...",
    "relevantChunks": [...]
  },
  "cached": false
}
```

---

## 💡 Key Learning Outcomes

1. **Vite**:

   - Modern frontend tooling
   - Fast HMR & instant server start
   - Proxy configuration for API calls
   - Production optimization with Rollup

2. **Gemini AI**:

   - Free embeddings generation
   - LLM-powered responses
   - API integration

3. **RAG (Retrieval-Augmented Generation)**:

   - Text chunking strategies
   - Vector embeddings
   - Cosine similarity search
   - Context-aware responses

4. **Bull Queue**:

   - Async job processing
   - Background tasks
   - Job monitoring

5. **Redis**:

   - Response caching
   - Performance optimization
   - TTL management

6. **PM2**:

   - Process management
   - Zero-downtime deployment
   - Cluster mode
   - Log management

7. **TDD with Jest**:

   - Unit tests
   - Integration tests
   - Test coverage

8. **AWS EC2**:
   - Server setup
   - Deployment
   - Security configuration

---

## 🎯 Minimal Viable Features

✅ Upload document (PDF/TXT)  
✅ Process document async (chunks + embeddings)  
✅ Ask questions about document  
✅ Get AI-generated answers  
✅ Cache frequent queries  
✅ Deploy with PM2 on AWS  
✅ Test coverage with Jest

---

## 🔧 Cursor IDE Tips

1. **Use Cmd+K** (Mac) or **Ctrl+K** (Windows) to generate boilerplate code
2. **Use Cmd+L** for AI chat to debug errors
3. Ask Cursor to write tests first (TDD approach)
4. Use Cursor's terminal integration for git commits
5. Let Cursor scaffold folder structures
6. Use inline suggestions for faster coding

**Example prompts for Cursor:**

- "Write a Jest test for this function"
- "Create a React component for file upload with Vite"
- "Add error handling to this controller"
- "Refactor this code to be more modular"
- "Set up Vite proxy configuration for API calls"

---

## 🆚 Gemini vs OpenAI

**Why Gemini is perfect for this project:**

✅ **Free tier**: 60 requests/minute  
✅ **Embeddings**: `embedding-001` model  
✅ **Text generation**: `gemini-pro` model  
✅ **No credit card** required  
✅ **Function calling** supported  
✅ **Large context window**

**Use OpenAI only if:**

- You need GPT-4 level reasoning
- You already have API credits
- Your project requires OpenAI-specific features

For this learning project, **Gemini is more than sufficient** and completely free!

---

## 🐛 Common Issues & Solutions

### Issue: Redis connection error

```bash
# Start Redis server
sudo systemctl start redis
```

### Issue: MongoDB connection failed

```bash
# Start MongoDB
sudo systemctl start mongod
```

### Issue: PM2 not found

```bash
# Install PM2 globally
sudo npm install -g pm2
```

### Issue: Bull queue not processing jobs

```bash
# Check Redis is running
redis-cli ping
# Should return: PONG
```

### Issue: Gemini API rate limit

- Free tier: 60 requests/minute
- Add delays between requests
- Implement exponential backoff

---

## 📖 Additional Resources

- [Vite Documentation](https://vitejs.dev/guide/)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [Bull Queue Guide](https://github.com/OptimalBits/bull)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [Jest Testing Guide](https://jestjs.io/docs/getting-started)
- [MongoDB Atlas Setup](https://www.mongodb.com/cloud/atlas)
- [Redis Cloud](https://redis.com/try-free/)
- [Vite + React Guide](https://vitejs.dev/guide/#scaffolding-your-first-vite-project)

---

## 🎓 Next Steps

After completing this project, consider:

1. Add user authentication (JWT)
2. Support multiple document formats (DOCX, PPT)
3. Implement conversation history
4. Add document similarity search
5. Create a Chrome extension
6. Deploy frontend to Vercel/Netlify (Vite builds work seamlessly)
7. Add CI/CD pipeline with GitHub Actions
8. Implement websockets for real-time updates
9. Add document versioning
10. Scale with Kubernetes
11. Add React Router for multi-page navigation
12. Implement PWA features with Vite PWA plugin

---

## 📝 License

MIT License - Feel free to use this project for learning!

---

## 🤝 Contributing

This is a learning project. Feel free to:

- Fork the repository
- Create feature branches
- Submit pull requests
- Report issues

---

**Happy Learning! 🚀**

Built with ❤️ for learning Generative AI, RAG, and full-stack development.
