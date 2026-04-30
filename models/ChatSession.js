import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    role:    { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
  },
  { _id: false, timestamps: false }
);

const ChatSessionSchema = new mongoose.Schema(
  {
    userId:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title:    { type: String, default: "New Chat" },
    messages: { type: [MessageSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.models.ChatSession || mongoose.model("ChatSession", ChatSessionSchema);
