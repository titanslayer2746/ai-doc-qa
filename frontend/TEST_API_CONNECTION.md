# 🧪 Testing API Connection from Frontend to Backend

## ✅ What Was Added:

### 1. **API Utility (`src/utils/api.js`)**

- Centralized Axios configuration
- Automatic error handling
- API endpoint functions
- Health check endpoint

### 2. **ConnectionStatus Component**

- Real-time backend connection indicator
- Automatically checks on load
- Retry button if connection fails
- Visual status indicators

### 3. **Updated All Components**

- All components now use the centralized API utility
- Better error handling
- Cleaner code

## 🚀 How to Test:

### Step 1: Start the Backend

```bash
# Terminal 1
cd backend
npm run dev
```

You should see:

```
Server running in development mode on port 5000
MongoDB Connected: ...
```

### Step 2: Start the Frontend

```bash
# Terminal 2
cd frontend
npm run dev
```

Frontend runs on: **http://localhost:3000**

### Step 3: Check Connection Status

Open http://localhost:3000 in your browser.

You should see at the top:

- ✅ **Green badge**: "Backend connected on port 5000" (if backend is running)
- ❌ **Red badge**: "Backend not connected" (if backend is NOT running)

### Step 4: Test API Calls

#### Open Browser Developer Tools (F12) → Console

You can manually test API calls:

```javascript
// Test health check
fetch("/api/health")
  .then((res) => res.json())
  .then((data) => console.log(data));

// Expected: { status: "OK", message: "Server is running" }
```

### Step 5: Test File Upload

1. Click "Upload Document"
2. Select a PDF or TXT file
3. Click "Upload"

**Check browser Network tab:**

- Request: `POST /api/documents/upload`
- Status: Should be `200 OK`
- Response: `{ message: "Document uploaded successfully", documentId: "..." }`

**Check terminal (backend):**

- You should see the upload being processed

## 📡 API Endpoints Being Called:

### Health Check

```javascript
GET http://localhost:5000/api/health
```

### Upload Document

```javascript
POST http://localhost:5000/api/documents/upload
Content-Type: multipart/form-data
Body: { file: <File> }
```

### Query Document

```javascript
POST http://localhost:5000/api/documents/query
Content-Type: application/json
Body: { documentId: "...", question: "..." }
```

### Get All Documents

```javascript
GET http://localhost:5000/api/documents
```

## 🔍 How the Proxy Works:

### Development Mode (Vite Dev Server):

```
Frontend (localhost:3000)  →  /api/...  →  Vite Proxy  →  Backend (localhost:5000)
```

The proxy in `vite.config.js` automatically forwards all `/api/*` requests to the backend.

### Production Mode:

```
Frontend  →  http://your-domain.com/api/...  →  Backend
```

## 🐛 Troubleshooting:

### "Backend not connected" message:

1. **Check if backend is running:**

   ```bash
   curl http://localhost:5000/api/health
   ```

2. **Check CORS in backend `app.js`:**

   ```javascript
   app.use(cors()); // Should be enabled
   ```

3. **Check Vite proxy configuration:**
   ```javascript
   // vite.config.js
   proxy: {
     "/api": {
       target: "http://localhost:5000",
       changeOrigin: true,
     },
   }
   ```

### Network errors in browser console:

- **ERR_CONNECTION_REFUSED**: Backend is not running
- **CORS error**: CORS not configured properly in backend
- **404 Not Found**: API endpoint doesn't exist

### Upload fails:

1. Check `uploads/` folder exists in backend
2. Check Multer configuration
3. Check file size limits
4. Check backend logs for errors

## 📊 Visual Indicators:

### Connection Status Badge Colors:

- 🟡 **Yellow/White**: Checking...
- 🟢 **Green**: Connected to backend on port 5000
- 🔴 **Red**: Not connected (with Retry button)

### Message Colors in Chat:

- 🔵 **Blue**: Your questions
- 🟢 **Green**: AI answers
- 🔴 **Red**: Errors
- 🟠 **Orange**: Loading...

## ✨ Test Checklist:

- [ ] Backend starts without errors
- [ ] Frontend starts and shows connection status
- [ ] Connection status turns green
- [ ] Can upload a file
- [ ] Can see upload success message
- [ ] Can ask a question (once RAG is implemented)
- [ ] Can see answers

---

**The frontend is now fully configured to communicate with the backend on port 5000!** 🎉
