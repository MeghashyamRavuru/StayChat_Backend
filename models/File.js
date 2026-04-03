const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema(
  {
    originalName: {
      type: String,
      required: [true, "File name is required"],
      trim: true,
    },
    storedName: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    path: {
      type: String,
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for human-readable file size
fileSchema.virtual("readableSize").get(function () {
  const units = ["B", "KB", "MB", "GB"];
  let size = this.size;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(2)} ${units[unitIndex]}`;
});

fileSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("File", fileSchema);
