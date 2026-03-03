// backend/src/server.js
import dotenv from "dotenv";
dotenv.config();
import app from "./app.js";
import {
  getHealthStatus,
  handleManualCleanup,
  handleGracefulShutdown,
  initializeServer,
} from "./utils/serverUtils.js";


const PORT = process.env.PORT || 3000;

// Start server
const server = app.listen(PORT, async () => {
  console.log(`🚀 App is listening on http://localhost:${PORT}`);

  // Initialize cleanup + monitoring system
  await initializeServer();
});

// Configure server timeouts
server.keepAliveTimeout = 120000;
server.headersTimeout = 120100;

// Health endpoint
app.get("/health", async (req, res) => {
  const health = await getHealthStatus();
  res.status(health.status === "unhealthy" ? 500 : 200).json(health);
});

// Manual cleanup endpoint
app.post("/admin/cleanup", async (req, res) => {
  const { type = "full" } = req.body;
  const result = await handleManualCleanup(type);
  res.status(result.success ? 200 : 500).json(result);
});

// Graceful shutdown handlers
process.on("SIGINT", () => handleGracefulShutdown(server, "SIGINT"));
process.on("SIGTERM", () => handleGracefulShutdown(server, "SIGTERM"));
