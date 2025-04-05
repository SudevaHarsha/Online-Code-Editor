import mongoose from "mongoose";
const fileSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  codeId: { type: String, required: true },
  code: { type: String, default: "" },
  language: { type: String, default: "" },
  input: { type: String, default: "" },
  fileName: { type: String, default: "" },
  updatedAt: { type: Date, default: Date.now },
});

// Ensure (userId, codeId) combination is unique
fileSchema.index({ userId: 1, codeId: 1 }, { unique: true });

export default mongoose.model("CodeFile", fileSchema);
