const mongoose = require("mongoose");
const { connectDB } = require("../src/config/db");

describe("Database Connection", () => {
  it("should have connectDB function", () => {
    expect(typeof connectDB).toBe("function");
  });

  it("should export mongoose", () => {
    expect(mongoose).toBeDefined();
  });
});
