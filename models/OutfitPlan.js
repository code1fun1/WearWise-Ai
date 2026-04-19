import mongoose from "mongoose";

const OutfitPlanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // Date this outfit is planned for (YYYY-MM-DD)
    date: { type: String, required: true },
    occasion: { type: String, default: "casual" },
    items: [{ type: mongoose.Schema.Types.ObjectId, ref: "ClothingItem" }],
    note: { type: String, default: "" },
    weather: {
      temp:      { type: Number },
      condition: { type: String },
      city:      { type: String },
    },
  },
  { timestamps: true }
);

// One plan per user per date
OutfitPlanSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.models.OutfitPlan ||
  mongoose.model("OutfitPlan", OutfitPlanSchema);
