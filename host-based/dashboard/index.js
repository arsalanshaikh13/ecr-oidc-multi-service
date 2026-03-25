const express = require("express");
const path = require("path");
const helmet = require("helmet");
const morgan = require("morgan");

const app = express();
const PORT = process.env.PORT || 3200;

// --- Middlewares ---
// Security headers (CSP disabled purely to allow the inline script in index.html for this example)
app.use(helmet({ contentSecurityPolicy: false }));
// Request logging for CloudWatch observability
app.use(morgan("combined"));

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// --- Routes ---
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html"));
});

// Health check endpoint (Essential for ECS ALB Target Group health checks)
app.get("/health", (req, res) => {
  res
    .status(200)
    .json({
      status: "ok",
      message: "Dashboard service is healthy",
      uptime: process.uptime(),
    });
});

// Config endpoint
// In ECS, pass the full subdomains as environment variables.
app.get("/config", (req, res) => {
  res.status(200).json({
    // Example ECS ENV vars: https://books.yourdomain.com
    BOOKS_SERVICE_URL: process.env.BOOKS_SERVICE_URL || "http://localhost:3400",
    AUTHORS_SERVICE_URL:
      process.env.AUTHORS_SERVICE_URL || "http://localhost:3300",
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

// --- Server Initialization ---
const server = app.listen(PORT, () => {
  console.log(`Dashboard server is running on port ${PORT}`);
});

// --- Graceful Shutdown (Critical for ECS deployments/scaling) ---
process.on("SIGTERM", () => {
  console.info(
    "SIGTERM received: Draining inflight requests before ECS termination.",
  );
  server.close(() => {
    console.info("Dashboard HTTP server closed.");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.info("SIGINT received: Shutting down local instance.");
  server.close(() => {
    process.exit(0);
  });
});
