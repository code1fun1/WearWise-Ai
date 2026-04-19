import mongoose from "mongoose";

const ClothingItemSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // Original uploaded image URL (Cloudinary)
    imageUrl: { type: String, required: true },
    // Cloudinary public_id — needed for deletion
    cloudinaryId: { type: String, required: true },

    // --- AI-generated tags ---
    type: {
      type: String,
      // e.g. "t-shirt", "jeans", "dress", "sneakers", "jacket"
      required: true,
    },
    color: { type: String, required: true },   // e.g. "navy blue"
    pattern: { type: String, default: "solid" }, // e.g. "solid", "stripes", "floral"
    style: { type: String, default: "casual" },  // e.g. "casual", "formal", "ethnic"
    occasion: { type: [String], default: [] },   // e.g. ["office", "casual"]
    season: { type: String, default: "all" },    // e.g. "summer", "winter", "all"

    // Optional user override
    customName: { type: String, default: "" },
    notes: { type: String, default: "" },

    // How many times this item was included in a selected outfit
    wearCount: { type: Number, default: 0 },
    lastWorn: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.models.ClothingItem ||
  mongoose.model("ClothingItem", ClothingItemSchema);
