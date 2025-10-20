# 🤖 Gemini AI Service Setup Guide

## ✅ What Was Implemented:

Based on the [official Gemini API documentation](https://ai.google.dev/gemini-api/docs/embeddings), the AI service now includes:

### 1. **Real Gemini Embeddings**

- Model: `gemini-embedding-001`
- Task types support: RETRIEVAL_DOCUMENT, RETRIEVAL_QUERY, SEMANTIC_SIMILARITY
- Batch embedding support
- 768-dimension embeddings (configurable)

### 2. **Text Generation**

- Model: `gemini-1.5-flash` (fast and cost-effective)
- Context-aware Q&A
- Fallback to dummy responses if API key not configured

### 3. **Error Handling**

- Invalid API key detection
- Quota exceeded handling
- Graceful fallback to dummy data

---

## 🚀 Setup Instructions:

### Step 1: Install Required Package

```bash
cd backend
npm install @google/generative-ai
```

### Step 2: Get Your Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "**Get API Key**" or "**Create API Key**"
4. Copy the API key

**Note:** The Gemini API has a generous free tier:

- ✅ 60 requests per minute
- ✅ No credit card required
- ✅ Perfect for development and testing

### Step 3: Add API Key to .env File

Open or create `backend/.env` and add:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/ai-doc-qa

# Redis
REDIS_URL=redis://default:your_password@your-redis-host:port
REDIS_HOST=your-redis-host
REDIS_PORT=14580

# Gemini API (NEW!)
GEMINI_API_KEY=your_gemini_api_key_here

# Server
PORT=5000
NODE_ENV=development
```

### Step 4: Restart Backend

```bash
cd backend
npm run dev
```

You should see:

```
Server running in development mode on port 5000
MongoDB Connected: ...
✅ Document queue is ready (if Redis running)
```

**No warning about Gemini API = configured correctly!** ✅

---

## 🧪 Testing the Integration:

### Test 1: Upload a Document

1. Open http://localhost:3000
2. Upload `backend/test-document.txt`
3. Watch backend console

**Expected output:**

```
Processing file: test-document.txt
Reading TXT file...
Read text length: 675
Saving to MongoDB...
Document saved with ID: ...
Adding to processing queue...
Processing document ...
Generating embeddings for document ...
✅ Generated embedding (768 dimensions) for text: "AI and Machine Learning..."
✅ Generated embedding (768 dimensions) for text: "Artificial Intelligence..."
✅ Document ... processed successfully
Upload complete!
```

### Test 2: Ask a Question

Once document is processed (check `processed: true` in MongoDB):

1. In the chat interface, type: "What is AI?"
2. Click "Ask"

**Expected output:**

```
✅ Generated embedding (768 dimensions) for text: "What is AI?..."
✅ Generated answer for question: "What is AI?"
```

**Response will be based on the document content!**

---

## 📊 Features Enabled:

### With Gemini API Key:

- ✅ Real embeddings (768 dimensions)
- ✅ Semantic search
- ✅ Context-aware Q&A
- ✅ RAG (Retrieval-Augmented Generation)
- ✅ Smart document chunking
- ✅ Cosine similarity search

### Without Gemini API Key:

- ⚠️ Dummy embeddings (random vectors)
- ⚠️ Placeholder answers
- ✅ Upload still works
- ✅ Documents saved to MongoDB

---

## 🔧 API Service Methods:

### 1. `generateEmbedding(text, taskType)`

Generates embedding for a single text.

```javascript
const embedding = await aiService.generateEmbedding(
  "What is machine learning?",
  "RETRIEVAL_QUERY"
);
// Returns: Array of 768 numbers
```

**Task Types:**

- `RETRIEVAL_DOCUMENT` - For document chunks (default)
- `RETRIEVAL_QUERY` - For user queries
- `SEMANTIC_SIMILARITY` - For comparing texts
- `CLASSIFICATION` - For categorization
- `CLUSTERING` - For grouping

### 2. `generateEmbeddings(texts, taskType)`

Batch generate embeddings for multiple texts.

```javascript
const embeddings = await aiService.generateEmbeddings(
  ["Text 1", "Text 2", "Text 3"],
  "RETRIEVAL_DOCUMENT"
);
// Returns: Array of embedding arrays
```

### 3. `generateAnswer(context, question)`

Generate AI answer based on context.

```javascript
const answer = await aiService.generateAnswer(
  "AI is the simulation of human intelligence...",
  "What is AI?"
);
// Returns: String answer
```

### 4. `isReady()`

Check if API is configured.

```javascript
if (aiService.isReady()) {
  console.log("Gemini API ready!");
}
```

---

## 🐛 Troubleshooting:

### Warning: "GEMINI_API_KEY not found"

**Solution:**

1. Check `.env` file exists in `backend/` folder
2. Verify `GEMINI_API_KEY=...` is present
3. No quotes needed around the key
4. Restart the backend server

### Error: "Invalid API key"

**Solutions:**

1. Verify you copied the complete API key
2. Check for extra spaces
3. Generate a new API key at [Google AI Studio](https://makersuite.google.com/app/apikey)

### Error: "API quota exceeded"

**Solutions:**

1. Check usage at [Google AI Studio](https://makersuite.google.com/)
2. Free tier: 60 requests/minute
3. Wait a minute and try again
4. Consider upgrading for higher limits

### Embeddings work but answers are wrong

**Check:**

1. Document was fully processed (processed: true in MongoDB)
2. Embeddings were generated for all chunks
3. Question is relevant to document content
4. Try rephrasing the question

---

## 📈 Performance Tips:

### 1. **Use Appropriate Task Types**

```javascript
// For storing document chunks
await aiService.generateEmbedding(chunk, "RETRIEVAL_DOCUMENT");

// For user queries
await aiService.generateEmbedding(question, "RETRIEVAL_QUERY");
```

Task types improve embedding quality by 2-5% according to Google's benchmarks.

### 2. **Batch Processing**

When processing multiple chunks:

```javascript
// Better performance
const embeddings = await aiService.generateEmbeddings(chunks);

// vs processing one by one
for (const chunk of chunks) {
  await aiService.generateEmbedding(chunk);
}
```

### 3. **Caching**

The system already caches Q&A responses in Redis. Embeddings are stored in MongoDB.

---

## 🎯 Testing Checklist:

- [ ] Installed `@google/generative-ai` package
- [ ] Got Gemini API key from Google AI Studio
- [ ] Added `GEMINI_API_KEY` to `.env` file
- [ ] Restarted backend server
- [ ] No "GEMINI_API_KEY not found" warning
- [ ] Uploaded a test document
- [ ] Saw "Generated embedding" in console
- [ ] Document marked as `processed: true`
- [ ] Asked a question
- [ ] Received relevant answer based on document

---

## 📚 References:

- [Gemini API Embeddings Documentation](https://ai.google.dev/gemini-api/docs/embeddings)
- [Google AI Studio](https://makersuite.google.com/)
- [Gemini API Pricing](https://ai.google.dev/pricing)
- [Model Versions](https://ai.google.dev/gemini-api/docs/models/gemini)

---

## 🎉 You're All Set!

Your AI Document Q&A system is now powered by Google's Gemini API!

**Features working:**

- ✅ Document upload
- ✅ Text extraction (PDF/TXT)
- ✅ Automatic chunking
- ✅ Embedding generation
- ✅ Semantic search
- ✅ Context-aware Q&A
- ✅ Response caching

**Try it now:**

1. Upload a document
2. Wait for processing
3. Ask questions about it
4. Get AI-powered answers!

🚀 Happy building!

