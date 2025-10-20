const documentQueue = require("../src/queues/document.queue");

describe("Document Queue", () => {
  it("should export document queue", () => {
    expect(documentQueue).toBeDefined();
    expect(typeof documentQueue.add).toBe("function");
    expect(typeof documentQueue.process).toBe("function");
  });
});
