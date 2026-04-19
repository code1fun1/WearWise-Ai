import mongoose from "mongoose";

const ClothingItemSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    imageUrl:    { type: String, required: true },
    cloudinaryId:{ type: String, required: true },

    // AI-generated tags
    type:    { type: String, required: true },
    color:   { type: String, required: true },
    pattern: { type: String, default: "solid" },
    style:   { type: String, default: "casual" },
    occasion:{ type: [String], default: [] },
    season:  { type: String, default: "all" },

    // User overrides
    customName: { type: String, default: "" },
    notes:      { type: String, default: "" },

    // Wear tracking
    wearCount: { type: Number, default: 0 },
    lastWorn:  { type: Date, default: null },

    // Cost per wear
    purchasePrice: { type: Number, default: null },

    // Laundry tracker — excluded from recommendations when true
    inLaundry: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.ClothingItem ||
  mongoose.model("ClothingItem", ClothingItemSchema);
