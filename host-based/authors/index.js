const express = require("express");
const path = require("path");
const helmet = require("helmet");
const morgan = require("morgan");
const cors = require("cors");
const data = require("./data");

const app = express();
const PORT = process.env.PORT || 3300;

// --- Middlewares ---
// Security headers
app.use(helmet({ contentSecurityPolicy: false }));
// Request logging (essential for tracking ALB traffic in CloudWatch)
app.use(morgan("combined"));

// Production CORS Configuration
// In ECS, you can set the DASHBOARD_URL environment variable (e.g., https://dashboard.yourdomain.com)
// to lock down this API so ONLY your dashboard can read from it.
const corsOptions = {
  origin: process.env.DASHBOARD_URL || "*",
  methods: ["GET", "OPTIONS"],
  allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept"],
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// --- Routes ---
// Serve the main HTML file at the root of the subdomain
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html"));
});

// Health check endpoint (Point your ALB target group health check to /health)
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Authors service is healthy",
    uptime: process.uptime(),
  });
});

// Authors API endpoint
app.get("/api", async (req, res) => {
  try {
    res.json({
      authors: data.authors,
    });
  } catch (err) {
    console.error("Authors fetch error:", err);
    res.status(500).json({ error: "Unable to fetch authors" });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal Server Error in Authors Service" });
});

// --- Server Initialization ---
const server = app.listen(PORT, () => {
  console.log(`Authors service is running on port ${PORT}`);
});

// --- Graceful Shutdown (Critical for ECS deployments & scaling) ---
process.on("SIGTERM", () => {
  console.info(
    "SIGTERM signal received: Closing Authors HTTP server to drain inflight requests.",
  );
  server.close(() => {
    console.info("Authors HTTP server closed.");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.info("SIGINT signal received: Shutting down locally.");
  server.close(() => {
    process.exit(0);
  });
});
