# AI Document Q&A - Frontend

React + Vite frontend for the AI Document Q&A system.

## 🚀 Getting Started

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

The app will be available at: http://localhost:3000

### Build for Production

```bash
npm run build
```

The build output will be in the `dist/` folder.

### Preview Production Build

```bash
npm run preview
```

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── UploadDocument.jsx   # File upload component
│   │   ├── ChatInterface.jsx     # Q&A chat component
│   │   └── DocumentList.jsx      # Document list component
│   ├── App.jsx                   # Main app component
│   ├── App.css                   # Global styles
│   ├── main.jsx                  # App entry point
│   └── index.css                 # Base CSS
├── vite.config.js                # Vite configuration
└── package.json
```

## ⚙️ Configuration

### API Proxy

The Vite dev server is configured to proxy API requests to the backend:

```javascript
// vite.config.js
proxy: {
  "/api": {
    target: "http://localhost:5000",
    changeOrigin: true,
  },
}
```

This allows you to make requests to `/api/documents/upload` which will be proxied to `http://localhost:5000/api/documents/upload`.

## 🎨 Features

- **Document Upload**: Upload PDF or TXT files
- **Real-time Chat**: Ask questions about your documents
- **Cache Indicator**: See when responses are served from cache
- **Beautiful UI**: Modern gradient design with smooth animations
- **Responsive**: Works on desktop and mobile

## 🔧 Tech Stack

- **React 18**: UI library
- **Vite**: Build tool and dev server
- **Axios**: HTTP client for API calls
- **CSS3**: Modern styling with gradients and animations

## 📝 Environment

Make sure the backend server is running on `http://localhost:5000` before starting the frontend.

## 🐛 Troubleshooting

### Port Already in Use

If port 3000 is already in use, update `vite.config.js`:

```javascript
server: {
  port: 3001, // Change to any available port
}
```

### API Connection Issues

1. Ensure backend is running on port 5000
2. Check browser console for CORS errors
3. Verify proxy configuration in `vite.config.js`
