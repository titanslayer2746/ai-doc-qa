import axios from "axios";

// API base URL - uses relative URLs in production (Nginx proxy), empty in development (Vite proxy)
const API_BASE_URL = "";

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;

// API endpoints
export const documentAPI = {
  upload: (formData) =>
    api.post("/api/documents/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  query: (documentId, question) =>
    api.post("/api/documents/query", { documentId, question }),
  getAll: () => api.get("/api/documents"),
  getStatus: (documentId) => api.get(`/api/documents/${documentId}/status`),
  healthCheck: () => api.get("/api/health"),
};
