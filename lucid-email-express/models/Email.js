const mongoose = require("mongoose");

const EmailSchema = new mongoose.Schema(
  {
    address: { type: String, required: true },
    subject: { type: String, required: true },
    rawHeaders: { type: Object },
    receivedRaw: { type: [String], default: [] },
    receivingChain: { type: [Object], default: [] },
    esp: { type: String },
    metadata: { type: Object }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Email", EmailSchema);
