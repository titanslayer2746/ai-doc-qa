const fs = require("fs");
const pdfParse = require("pdf-parse");
const Document = require("../models/Document");
const documentQueue = require("../queues/document.queue");

const redisClient = require("../config/redis");
const ragService = require("../services/rag.service");

// Helper function to parse PDF (using pdf-parse - better for complex PDFs)
const parsePDF = async (filePath) => {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } catch (error) {
    console.error("PDF parsing error:", error.message);
    throw new Error(`Failed to parse PDF: ${error.message}`);
  }
};

// Get document status
exports.getDocumentStatus = async (req, res) => {
  try {
    const { documentId } = req.params;

    const document = await Document.findById(documentId);

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    res.json({
      documentId: document._id,
      filename: document.filename,
      processed: document.processed,
      chunksCount: document.chunks ? document.chunks.length : 0,
      uploadedAt: document.createdAt,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all documents
exports.getAllDocuments = async (req, res) => {
  try {
    const documents = await Document.find()
      .select("filename processed createdAt")
      .sort({ createdAt: -1 });

    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.queryDocument = async (req, res) => {
  try {
    const { documentId, question } = req.body;

    // Create cache key
    const cacheKey = `query:${documentId}:${question}`;

    // Try to get from cache (if Redis is available)
    try {
      const cachedAnswer = await redisClient.get(cacheKey);
      if (cachedAnswer) {
        console.log(
          `✅ Cache HIT for question: "${question.substring(0, 50)}..."`
        );
        return res.json({
          answer: JSON.parse(cachedAnswer),
          cached: true,
        });
      }
    } catch (cacheError) {
      console.warn(
        "⚠️ Cache read failed (Redis might be down):",
        cacheError.message
      );
      // Continue without cache
    }

    console.log(
      `🔍 Cache MISS - generating new answer for: "${question.substring(
        0,
        50
      )}..."`
    );

    // Get answer from RAG
    const result = await ragService.answerQuestion(documentId, question);

    // Try to cache the result (if Redis is available)
    try {
      await redisClient.setEx(cacheKey, 3600, JSON.stringify(result));
      console.log("💾 Answer cached for 1 hour");
    } catch (cacheError) {
      console.warn(
        "⚠️ Cache write failed (Redis might be down):",
        cacheError.message
      );
      // Continue without caching
    }

    res.json({
      answer: result,
      cached: false,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.uploadDocument = async (req, res) => {
  let uploadedFilePath = null;

  try {
    // Validate file upload
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const { path, originalname } = req.file;
    uploadedFilePath = path;

    console.log(`Processing file: ${originalname}`);

    // Extract text from PDF or TXT
    let text = "";

    if (originalname.toLowerCase().endsWith(".pdf")) {
      console.log("Parsing PDF...");
      text = await parsePDF(path);
      console.log(`Extracted text length: ${text.length}`);
    } else if (originalname.toLowerCase().endsWith(".txt")) {
      console.log("Reading TXT file...");
      text = fs.readFileSync(path, "utf8");
      console.log(`Read text length: ${text.length}`);
    } else {
      throw new Error("Unsupported file type. Please upload PDF or TXT files.");
    }

    // Validate extracted text
    if (!text || text.trim().length === 0) {
      throw new Error(
        "Could not extract text from the document. The file might be empty or corrupted."
      );
    }

    console.log("Saving to MongoDB...");

    // Save to MongoDB
    const document = await Document.create({
      filename: originalname,
      content: text.trim(),
    });

    console.log(`Document saved with ID: ${document._id}`);

    // Try queue-based processing first (async, faster upload)
    let queueSuccess = false;
    try {
      console.log("📋 Adding document to processing queue...");
      const job = await documentQueue.add("process-document", {
        documentId: document._id.toString(),
      });

      if (job && job.id !== "fallback") {
        console.log(`✅ Document added to queue (Job ID: ${job.id})`);
        console.log("   Processing will happen in background");
        queueSuccess = true;
      }
    } catch (queueError) {
      console.warn("⚠️ Queue unavailable:", queueError.message);
      console.log("   Falling back to immediate processing...");
    }

    // Fallback: Process immediately if queue failed
    if (!queueSuccess) {
      try {
        console.log(
          "🔄 Processing document immediately (queue unavailable)..."
        );
        console.log("⏳ Generating embeddings - this may take a moment...");

        await ragService.storeDocumentChunks(
          document._id.toString(),
          text.trim()
        );

        // Mark as processed
        document.processed = true;
        await document.save();

        console.log("✅ Document processed successfully with embeddings!");
      } catch (processError) {
        console.error("❌ Document processing failed:", processError.message);
        console.log(
          "   Document saved but not processed - Q&A may not work properly"
        );
        // Don't fail the upload if processing fails
      }
    }

    // Clean up uploaded file
    fs.unlinkSync(path);
    console.log("📤 Upload complete!");

    res.json({
      message: queueSuccess
        ? "Document uploaded successfully. Processing in background..."
        : "Document uploaded and processed successfully",
      documentId: document._id,
      processing: queueSuccess ? "queued" : "completed",
    });
  } catch (error) {
    console.error("Upload error:", error);

    // Clean up file if it exists
    if (uploadedFilePath && fs.existsSync(uploadedFilePath)) {
      try {
        fs.unlinkSync(uploadedFilePath);
      } catch (cleanupError) {
        console.error("Error cleaning up file:", cleanupError);
      }
    }

    res.status(500).json({ error: error.message });
  }
};
