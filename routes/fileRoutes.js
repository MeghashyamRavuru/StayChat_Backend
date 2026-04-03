const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const upload = require("../middleware/upload");
const { uploadFile, getFiles, deleteFile } = require("../controllers/fileController");

// POST /api/files → Upload a file (protected)
router.post("/", auth, upload.single("file"), uploadFile);

// GET /api/files → List all files (protected)
router.get("/", auth, getFiles);

// DELETE /api/files/:id → Delete a file (protected)
router.delete("/:id", auth, deleteFile);

module.exports = router;
