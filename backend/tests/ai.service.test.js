const aiService = require("../src/services/ai.service");

describe("AI Service", () => {
  it("should generate embeddings", async () => {
    const embedding = await aiService.generateEmbedding("Hello world");
    expect(Array.isArray(embedding)).toBe(true);
    expect(embedding.length).toBeGreaterThan(0);
  });

  it("should generate answer", async () => {
    const answer = await aiService.generateAnswer(
      "The sky is blue.",
      "What color is the sky?"
    );
    expect(typeof answer).toBe("string");
    expect(answer.length).toBeGreaterThan(0);
  });
});
