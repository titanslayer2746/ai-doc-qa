const redis = require("redis");

// Create Redis client with Upstash TLS support
const client = redis.createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
  socket: {
    tls: process.env.REDIS_URL?.startsWith("rediss://"), // Enable TLS for Upstash
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.error("❌ Redis: Too many retry attempts, giving up");
        return false; // Stop reconnecting after 10 attempts
      }
      // Exponential backoff: 100ms, 200ms, 400ms, etc.
      return Math.min(retries * 100, 3000);
    },
  },
});

// Event handlers
client.on("error", (err) => {
  console.error("❌ Redis connection error:", err.message);
});

client.on("connect", () => {
  console.log("🔄 Connecting to Redis...");
});

client.on("ready", () => {
  console.log("✅ Redis client is ready!");
});

client.on("reconnecting", () => {
  console.log("🔄 Redis reconnecting...");
});

// Connect to Redis
(async () => {
  try {
    await client.connect();
  } catch (err) {
    console.error("❌ Failed to connect to Redis:", err.message);
    console.log(
      "   Make sure Redis is running or check your REDIS_URL in .env"
    );
  }
})();

module.exports = client;
