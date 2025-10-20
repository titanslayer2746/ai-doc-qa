# Backend Environment Setup

## 1. Create .env file

Create a `.env` file in the `backend` directory with the following variables:

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

## 2. Get Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Get API Key" or "Create API Key"
4. Copy the key and paste it in your `.env` file

## 3. Install Dependencies

```bash
npm install
```

## 4. Start MongoDB and Redis

**MongoDB:**

```bash
# Mac/Linux
brew services start mongodb-community
# or
sudo systemctl start mongod

# Windows
net start MongoDB
```

**Redis:**

```bash
# Mac/Linux
brew services start redis
# or
sudo systemctl start redis

# Windows
# Use Redis for Windows or WSL
```

## 5. Run the Server

**Development mode:**

```bash
npm run dev
```

**Production mode:**

```bash
npm start
```

## 6. Test the API

Visit: http://localhost:5000/api/health

You should see:

```json
{
  "status": "OK",
  "message": "Server is running"
}
```
