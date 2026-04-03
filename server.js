require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const connectDB = require("./config/db");

// ── Import Routes ──
const authRoutes = require("./routes/authRoutes");
const fileRoutes = require("./routes/fileRoutes");

// ── Initialize Express ──
const app = express();

// ── Create uploads directory if it doesn't exist ──
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ── Middleware ──
app.use(cors());
app.use(express.json({ limit: "50mb" })); // Large limit for base64 uploads
app.use(express.urlencoded({ extended: true }));

// ── Health Check ──
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "🗄️ StayChat File Vault API is running!",
    version: "1.0.0",
    endpoints: {
      auth: {
        register: "POST /api/auth/register",
        login: "POST /api/auth/login",
      },
      files: {
        upload: "POST /api/files",
        list: "GET /api/files",
        delete: "DELETE /api/files/:id",
      },
    },
  });
});

// ── Routes ──
app.use("/api/auth", authRoutes);
app.use("/api/files", fileRoutes);

// ── 404 Handler ──
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.originalUrl} not found.`,
  });
});

// ── Global Error Handler ──
app.use((err, req, res, next) => {
  console.error("💥 Unhandled Error:", err.message);

  // Multer file size error
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      success: false,
      error: `File too large. Maximum size is ${process.env.MAX_FILE_SIZE_MB || 10}MB.`,
    });
  }

  // Multer file type error
  if (err.message && err.message.includes("not allowed")) {
    return res.status(415).json({
      success: false,
      error: err.message,
    });
  }

  res.status(500).json({
    success: false,
    error: "Internal server error.",
  });
});

// ── Start Server ──
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🚀 Server running on port ${PORT}`);
    console.log(`📁 File Vault API ready at http://localhost:${PORT}`);
    console.log(`🔐 Auth endpoints at http://localhost:${PORT}/api/auth`);
    console.log(`📂 File endpoints at http://localhost:${PORT}/api/files\n`);
  });
});

module.exports = app;
