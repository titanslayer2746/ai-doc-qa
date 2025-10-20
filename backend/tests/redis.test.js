const redisClient = require("../src/config/redis");

describe("Redis Connection", () => {
  it("should export redis client", () => {
    expect(redisClient).toBeDefined();
    expect(typeof redisClient.set).toBe("function");
    expect(typeof redisClient.get).toBe("function");
  });
});
