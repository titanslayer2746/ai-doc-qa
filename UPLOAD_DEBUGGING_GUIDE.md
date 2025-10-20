# 🐛 Upload Debugging Guide

## Issue: "Document validation failed: content: Path `content` is required"

This error means the document's content field is empty when trying to save to MongoDB.

## ✅ Fixes Applied:

### 1. **Added Better Error Handling**

- Validates file upload
- Checks if text was extracted
- Better error messages

### 2. **Added Console Logging**

- Shows which file is being processed
- Shows text extraction length
- Shows each step of the process

### 3. **Created Uploads Directory**

- Automatically creates `backend/uploads/` if it doesn't exist
- Added to `.gitignore`

### 4. **Improved Text Extraction**

- Case-insensitive file extension check
- Trims whitespace from extracted text
- Validates text is not empty

## 🧪 How to Test:

### Step 1: Restart Backend

```bash
cd backend
npm run dev
```

### Step 2: Check the Console

You should see:

```
Server running in development mode on port 5000
MongoDB Connected: ...
Created uploads directory (if it didn't exist)
```

### Step 3: Test with TXT File

A test file has been created: `backend/test-document.txt`

1. Start the frontend: `cd frontend && npm run dev`
2. Open http://localhost:3000
3. Click "Upload Document"
4. Select `backend/test-document.txt`
5. Click "Upload"

### Step 4: Watch Backend Console

You should see:

```
Processing file: test-document.txt
Reading TXT file...
Read text length: 675
Saving to MongoDB...
Document saved with ID: 507f1f77bcf86cd799439011
Adding to processing queue...
Upload complete!
```

### Step 5: Check for Errors

If you see an error, the console will show:

```
Upload error: [specific error message]
```

## 🔍 Common Issues & Solutions:

### Issue 1: "No file uploaded"

**Solution:** Make sure you selected a file before clicking Upload

### Issue 2: "Unsupported file type"

**Solution:** Only PDF and TXT files are supported. Check file extension.

### Issue 3: "Could not extract text from the document"

**Solutions:**

- For TXT: Check if file has content
- For PDF: Try a different PDF file (pdf2json might not support all PDFs)

### Issue 4: "MongoServerError: connect ECONNREFUSED"

**Solution:** MongoDB is not running

```bash
# Windows
net start MongoDB

# Mac/Linux
brew services start mongodb-community
# or
sudo systemctl start mongod
```

### Issue 5: "Redis connection error"

**Solution:** Redis is not running - but this won't block upload, only queuing

---

## 📊 What Happens During Upload:

1. **File Upload** → Multer saves to `uploads/` folder
2. **Text Extraction**:
   - TXT: Read with `fs.readFileSync()`
   - PDF: Parse with `pdf2json` library
3. **Validation** → Check text is not empty
4. **Save to MongoDB** → Create document with filename & content
5. **Add to Queue** → Bull queue processes document for RAG
6. **Cleanup** → Delete uploaded file from uploads folder
7. **Response** → Send documentId back to frontend

---

## 🎯 Testing Different File Types:

### Test with TXT (Easiest):

```
File: backend/test-document.txt (provided)
Should work immediately
```

### Test with PDF:

```
Try a simple PDF with text (not scanned images)
pdf2json can extract text from text-based PDFs
Scanned PDFs need OCR (not implemented)
```

---

## 📝 Console Logs You Should See:

### Successful Upload:

```
Processing file: test-document.txt
Reading TXT file...
Read text length: 675
Saving to MongoDB...
Document saved with ID: 67890abc...
Adding to processing queue...
Upload complete!
```

### Failed Upload (empty file):

```
Processing file: empty.txt
Reading TXT file...
Read text length: 0
Upload error: Could not extract text from the document
```

---

## 🚀 Next Steps After Successful Upload:

1. ✅ Upload works
2. ⏳ Document is in queue for processing
3. 🔧 Need to implement RAG services:
   - `ai.service.js` - Gemini AI integration
   - `rag.service.js` - Text chunking & embeddings
   - `document.queue.js` - Queue processor

---

**The upload now has better error handling and logging!**
Check the backend console for detailed information about what's happening.

