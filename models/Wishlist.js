import mongoose from "mongoose";

const WishlistSchema = new mongoose.Schema(
  {
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    itemType:  { type: String, required: true },   // e.g. "blazer", "white sneakers"
    reason:    { type: String, default: "" },       // why it was recommended / user note
    source:    { type: String, enum: ["capsule", "manual"], default: "manual" },
    purchased: { type: Boolean, default: false },
    purchasedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.models.Wishlist || mongoose.model("Wishlist", WishlistSchema);
