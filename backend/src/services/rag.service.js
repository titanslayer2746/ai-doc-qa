const Document = require("../models/Document");
const aiService = require("./ai.service");

class RAGService {
  // Split text into chunks of ~500 characters
  chunkText(text, chunkSize = 500) {
    const chunks = [];
    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.slice(i, i + chunkSize));
    }
    return chunks;
  }

  // Store document chunks with embeddings
  async storeDocumentChunks(documentId, text) {
    const chunks = this.chunkText(text);
    const document = await Document.findById(documentId);

    document.chunks = [];

    for (const chunk of chunks) {
      const embedding = await aiService.generateEmbedding(chunk);
      document.chunks.push({ text: chunk, embedding });
    }

    await document.save();
    return document;
  }

  // Calculate cosine similarity
  cosineSimilarity(vecA, vecB) {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }

  // Find relevant chunks using similarity search
  async findRelevantChunks(documentId, question, topK = 3) {
    const document = await Document.findById(documentId);
    const questionEmbedding = await aiService.generateEmbedding(question);

    const chunksWithScores = document.chunks.map((chunk) => ({
      text: chunk.text,
      score: this.cosineSimilarity(questionEmbedding, chunk.embedding),
    }));

    return chunksWithScores.sort((a, b) => b.score - a.score).slice(0, topK);
  }

  // Answer question using RAG
  async answerQuestion(documentId, question) {
    const relevantChunks = await this.findRelevantChunks(documentId, question);
    const context = relevantChunks.map((c) => c.text).join("\n\n");
    const answer = await aiService.generateAnswer(context, question);

    return {
      answer,
      relevantChunks: relevantChunks.map((c) => ({
        text: c.text.substring(0, 100) + "...",
        score: c.score,
      })),
    };
  }
}

module.exports = new RAGService();
