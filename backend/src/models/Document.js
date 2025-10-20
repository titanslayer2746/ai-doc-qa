const mongoose = require("mongoose");

const DocumentSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    content: { type: String, required: true },
    chunks: [
      {
        text: String,
        embedding: [Number],
      },
    ],
    processed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Document", DocumentSchema);
