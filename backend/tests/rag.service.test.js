const ragService = require("../src/services/rag.service");

describe("RAG Service", () => {
  it("should chunk text correctly", () => {
    const text = "a".repeat(1200);
    const chunks = ragService.chunkText(text, 500);
    expect(chunks.length).toBe(3);
  });

  it("should calculate cosine similarity", () => {
    const vec1 = [1, 0, 0];
    const vec2 = [1, 0, 0];
    const similarity = ragService.cosineSimilarity(vec1, vec2);
    expect(similarity).toBeCloseTo(1);
  });
});
