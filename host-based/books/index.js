const express = require("express");
const path = require("path");
const helmet = require("helmet");
const morgan = require("morgan");
const cors = require("cors");
const data = require("./data");

const app = express();
const PORT = process.env.PORT || 3400;

// --- Middlewares ---
// Security headers
app.use(helmet({ contentSecurityPolicy: false }));
// Request logging for AWS CloudWatch
app.use(morgan("combined"));

// Production CORS Configuration
// Restrict access so only your Dashboard application can make API requests
const corsOptions = {
  origin: process.env.DASHBOARD_URL || "*",
  methods: ["GET", "OPTIONS"],
  allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept"],
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// --- Routes ---
// Serve the main HTML file at the root path
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html"));
});

// Health check endpoint (Essential for the ALB Target Group)
app.get("/health", (req, res) => {
  res
    .status(200)
    .json({
      status: "ok",
      message: "Books service is healthy",
      uptime: process.uptime(),
    });
});

// Books API endpoint
app.get("/api", async (req, res) => {
  try {
    res.json({
      books: data.books,
    });
  } catch (err) {
    console.error("Books fetch error:", err);
    res.status(500).json({ error: "Unable to fetch books" });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal Server Error in Books Service" });
});

// --- Server Initialization ---
const server = app.listen(PORT, () => {
  console.log(`Books service is running on port ${PORT}`);
});

// --- Graceful Shutdown (Crucial for ECS task lifecycle) ---
process.on("SIGTERM", () => {
  console.info(
    "SIGTERM signal received: Closing Books HTTP server to drain inflight requests.",
  );
  server.close(() => {
    console.info("Books HTTP server closed.");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.info("SIGINT signal received: Shutting down locally.");
  server.close(() => {
    process.exit(0);
  });
});
