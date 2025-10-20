const Queue = require("bull");
const Document = require("../models/Document");
const ragService = require("../services/rag.service");

let documentQueue;

try {
  // Bull Queue with proper TLS configuration for Upstash
  console.log("🔗 Initializing Bull Queue with TLS support...");

  const redisConfig = {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
  };

  // Enable TLS for Upstash (required!)
  if (
    process.env.REDIS_URL?.startsWith("rediss://") ||
    process.env.REDIS_HOST?.includes("upstash.io")
  ) {
    redisConfig.tls = {
      rejectUnauthorized: false, // Required for Upstash
    };
    console.log("🔒 TLS enabled for Bull Queue");
  }

  documentQueue = new Queue("document-processing", {
    redis: redisConfig,
    defaultJobOptions: {
      attempts: 3, // Retry up to 3 times
      backoff: {
        type: "exponential",
        delay: 2000, // Start with 2s delay, doubles each retry
      },
      removeOnComplete: true, // Clean up completed jobs
      removeOnFail: false, // Keep failed jobs for debugging
    },
  });

  // Event: Queue error
  documentQueue.on("error", (error) => {
    console.error("❌ Queue error:", error.message);
  });

  // Event: Queue ready
  documentQueue.on("ready", () => {
    console.log("✅ Document queue is ready and connected to Redis");
  });

  // Event: Job failed
  documentQueue.on("failed", (job, err) => {
    console.error(`❌ Job ${job.id} failed:`, err.message);
  });

  // Event: Job completed
  documentQueue.on("completed", (job, result) => {
    console.log(`✅ Job ${job.id} completed:`, result);
  });

  // Process jobs from the queue
  documentQueue.process("process-document", async (job) => {
    const { documentId } = job.data;

    try {
      console.log(`\n🔄 [Queue] Processing document ${documentId}...`);

      const document = await Document.findById(documentId);

      if (!document) {
        throw new Error(`Document ${documentId} not found`);
      }

      if (!document.content || document.content.trim().length === 0) {
        throw new Error(`Document ${documentId} has no content`);
      }

      // Update job progress
      job.progress(25);

      // Process document with RAG service (generates embeddings)
      console.log(
        `🧮 [Queue] Generating embeddings for document ${documentId}...`
      );
      await ragService.storeDocumentChunks(documentId, document.content);

      // Update job progress
      job.progress(75);

      // Mark as processed
      document.processed = true;
      await document.save();

      // Update job progress
      job.progress(100);

      console.log(
        `✅ [Queue] Document ${documentId} processed successfully!\n`
      );
      return {
        success: true,
        documentId,
        chunksGenerated: document.chunks.length,
      };
    } catch (error) {
      console.error(
        `❌ [Queue] Processing error for ${documentId}:`,
        error.message
      );
      throw error; // Bull will retry based on defaultJobOptions
    }
  });

  console.log("📋 Bull Queue initialized successfully");
} catch (error) {
  console.error("⚠️ Failed to initialize Bull Queue:", error.message);
  console.log(
    "   Documents will be processed immediately (synchronous fallback)"
  );
  console.log("   To enable queue: Start Redis and restart server");

  // Fallback: dummy queue that won't crash
  documentQueue = {
    add: async () => {
      console.warn("⚠️ Queue unavailable - will use synchronous processing");
      return { id: "fallback" };
    },
    close: async () => {},
  };
}

module.exports = documentQueue;
