const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

class AIService {
  constructor() {
    this.embeddingModel = null;
    this.textModel = null;
    this.isConfigured = !!process.env.GEMINI_API_KEY;

    if (!this.isConfigured) {
      console.warn("⚠️ GEMINI_API_KEY not found in environment variables.");
      console.warn(
        "   Get your API key from: https://makersuite.google.com/app/apikey"
      );
      console.warn(
        "   Add it to backend/.env file: GEMINI_API_KEY=your_key_here"
      );
    }
  }

  /**
   * Get the embedding model instance
   * Model: text-embedding-004 (latest stable embedding model)
   * Reference: https://ai.google.dev/gemini-api/docs/embeddings
   */
  getEmbeddingModel() {
    if (!this.embeddingModel) {
      this.embeddingModel = genAI.getGenerativeModel({
        model: "text-embedding-004",
      });
    }
    return this.embeddingModel;
  }

  /**
   * Get the text generation model instance
   * Model: gemini-2.0-flash-exp (experimental but working model)
   */
  getTextModel() {
    if (!this.textModel) {
      this.textModel = genAI.getGenerativeModel({
        model: "gemini-2.0-flash-exp",
      });
    }
    return this.textModel;
  }

  /**
   * Generate embeddings for text
   * @param {string} text - Text to generate embeddings for
   * @param {string} taskType - Task type: RETRIEVAL_DOCUMENT, RETRIEVAL_QUERY, SEMANTIC_SIMILARITY, CLASSIFICATION, CLUSTERING
   * @returns {Promise<number[]>} Array of embedding values
   *
   * Reference: https://ai.google.dev/gemini-api/docs/embeddings
   */
  async generateEmbedding(text, taskType = "RETRIEVAL_DOCUMENT") {
    if (!this.isConfigured) {
      console.warn("⚠️ Using dummy embeddings - Gemini API not configured");
      // Return a dummy 768-dimension embedding
      return Array(768)
        .fill(0)
        .map(() => Math.random());
    }

    try {
      const model = this.getEmbeddingModel();

      // Generate embedding with task type for better performance
      const result = await model.embedContent({
        content: { parts: [{ text }] },
        taskType: taskType,
      });

      const embedding = result.embedding;

      console.log(
        `✅ Generated embedding (${
          embedding.values.length
        } dimensions) for text: "${text.substring(0, 50)}..."`
      );

      return embedding.values;
    } catch (error) {
      console.error("Error generating embedding:", error.message);

      // Check for common errors
      if (error.message.includes("API key")) {
        console.error(
          "❌ Invalid API key. Please check your GEMINI_API_KEY in .env file"
        );
      } else if (error.message.includes("quota")) {
        console.error(
          "❌ API quota exceeded. Check your usage at: https://makersuite.google.com/"
        );
      }

      throw error;
    }
  }

  /**
   * Generate embeddings for multiple texts in batch
   * @param {string[]} texts - Array of texts to generate embeddings for
   * @param {string} taskType - Task type for all embeddings
   * @returns {Promise<number[][]>} Array of embedding arrays
   */
  async generateEmbeddings(texts, taskType = "RETRIEVAL_DOCUMENT") {
    if (!this.isConfigured) {
      console.warn("⚠️ Using dummy embeddings - Gemini API not configured");
      return texts.map(() =>
        Array(768)
          .fill(0)
          .map(() => Math.random())
      );
    }

    try {
      const model = this.getEmbeddingModel();

      // Generate embeddings for all texts
      const embeddings = await Promise.all(
        texts.map((text) =>
          model.embedContent({
            content: { parts: [{ text }] },
            taskType: taskType,
          })
        )
      );

      console.log(`✅ Generated ${embeddings.length} embeddings in batch`);

      return embeddings.map((result) => result.embedding.values);
    } catch (error) {
      console.error("Error generating batch embeddings:", error.message);
      throw error;
    }
  }

  /**
   * Generate AI answer based on context and question
   * @param {string} context - Context/document content
   * @param {string} question - User's question
   * @returns {Promise<string>} Generated answer
   */
  async generateAnswer(context, question) {
    if (!this.isConfigured) {
      console.warn("⚠️ Using dummy answer - Gemini API not configured");
      return `This is a placeholder answer. Please configure the Gemini API key in your .env file to get real AI-powered responses.

To set up:
1. Get API key from: https://makersuite.google.com/app/apikey
2. Add to backend/.env: GEMINI_API_KEY=your_key_here
3. Restart the server

Context preview: ${context.substring(0, 100)}...
Question: ${question}`;
    }

    try {
      const model = this.getTextModel();

      // Create a prompt that instructs the model to answer based on context
      const prompt = `You are a helpful AI assistant. Answer the following question based ONLY on the provided context. If the answer cannot be found in the context, say "I cannot find the answer in the provided document."

Context:
${context}

Question: ${question}

Answer:`;

      console.log(`Calling Gemini API with model: gemini-2.0-flash-exp`);

      // Call Gemini API (matching the Next.js pattern exactly)
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const answer = response.text();

      if (!answer) {
        throw new Error("Empty response from Gemini API");
      }

      console.log(
        `✅ Generated answer for question: "${question.substring(0, 50)}..."`
      );

      return answer;
    } catch (error) {
      console.error("Error generating answer:", error);
      console.error("Error details:", {
        message: error.message,
        name: error.name,
        stack: error.stack,
      });

      if (error.message && error.message.includes("API key")) {
        throw new Error("Invalid Gemini API key. Please check your .env file.");
      } else if (error.message && error.message.includes("quota")) {
        throw new Error(
          "API quota exceeded. Please check your Google AI Studio usage."
        );
      } else if (error.message && error.message.includes("fetch")) {
        throw new Error(
          "Network error connecting to Gemini API. Please check your connection."
        );
      } else if (error.message && error.message.includes("models")) {
        throw new Error(
          "Model not available. The API might be experiencing issues."
        );
      }

      throw new Error(`Failed to generate answer: ${error.message}`);
    }
  }

  /**
   * Check if the AI service is properly configured
   * @returns {boolean} True if API key is configured
   */
  isReady() {
    return this.isConfigured;
  }
}

module.exports = new AIService();
