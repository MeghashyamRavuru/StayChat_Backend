const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const File = require("../models/File");

/**
 * @route   POST /api/files
 * @desc    Upload a file (multipart form-data OR base64 in JSON body)
 * @access  Protected
 */
const uploadFile = async (req, res) => {
  try {
    // ── Option 1: Multipart file upload via multer ──
    if (req.file) {
      const fileDoc = await File.create({
        originalName: req.file.originalname,
        storedName: req.file.filename,
        mimeType: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
        uploadedBy: req.user ? req.user._id : null,
      });

      return res.status(201).json({
        success: true,
        message: "File uploaded successfully.",
        data: fileDoc,
      });
    }

    // ── Option 2: Base64 upload via JSON body ──
    const { fileName, mimeType, base64Data } = req.body;

    if (!fileName || !base64Data) {
      return res.status(400).json({
        success: false,
        error: "Provide a file via form-data, or send fileName + base64Data in JSON body.",
      });
    }

    // Decode base64 and write to disk
    const buffer = Buffer.from(base64Data, "base64");
    const ext = path.extname(fileName) || "";
    const storedName = `${uuidv4()}${ext}`;
    const filePath = path.join(__dirname, "..", "uploads", storedName);

    fs.writeFileSync(filePath, buffer);

    const fileDoc = await File.create({
      originalName: fileName,
      storedName,
      mimeType: mimeType || "application/octet-stream",
      size: buffer.length,
      path: filePath,
      uploadedBy: req.user ? req.user._id : null,
    });

    return res.status(201).json({
      success: true,
      message: "File uploaded successfully (base64).",
      data: fileDoc,
    });
  } catch (error) {
    console.error("Upload error:", error.message);
    res.status(500).json({ success: false, error: "File upload failed." });
  }
};

/**
 * @route   GET /api/files
 * @desc    List all files with metadata
 * @access  Protected
 */
const getFiles = async (req, res) => {
  try {
    const filter = req.user ? { uploadedBy: req.user._id } : {};
    const files = await File.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: files.length,
      data: files,
    });
  } catch (error) {
    console.error("Get files error:", error.message);
    res.status(500).json({ success: false, error: "Could not retrieve files." });
  }
};

/**
 * @route   DELETE /api/files/:id
 * @desc    Delete a file by ID
 * @access  Protected
 */
const deleteFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({
        success: false,
        error: "File not found.",
      });
    }

    // Ownership check (if auth is active)
    if (
      req.user &&
      file.uploadedBy &&
      file.uploadedBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        error: "You are not authorized to delete this file.",
      });
    }

    // Delete physical file from disk
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    // Delete metadata from DB
    await File.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "File deleted successfully.",
      data: { id: req.params.id },
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        error: "Invalid file ID format.",
      });
    }
    console.error("Delete error:", error.message);
    res.status(500).json({ success: false, error: "Could not delete file." });
  }
};

module.exports = { uploadFile, getFiles, deleteFile };
