const express = require("express");
const multer = require("multer");
const {
  uploadDocument,
  queryDocument,
  getDocumentStatus,
  getAllDocuments,
} = require("../controllers/document.controller");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// Upload document
router.post("/upload", upload.single("file"), uploadDocument);

// Query document
router.post("/query", queryDocument);

// Get document status
router.get("/:documentId/status", getDocumentStatus);

// Get all documents
router.get("/", getAllDocuments);

module.exports = router;
