import mongoose from "mongoose";

const OutfitSchema = new mongoose.Schema(
  {
    // Array of ClothingItem ObjectIds that form the outfit
    items: [{ type: mongoose.Schema.Types.ObjectId, ref: "ClothingItem" }],
    // AI-generated explanation of why this outfit works
    explanation: { type: String, default: "" },
  },
  { _id: false }
);

const OutfitHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // The occasion the user requested outfits for
    occasion: { type: String, required: true },
    // Weather snapshot at generation time
    weather: {
      temp: Number,
      condition: String,
      city: String,
    },
    // All outfits generated in this session (usually 3)
    generatedOutfits: { type: [OutfitSchema], default: [] },
    // Index into generatedOutfits that the user selected (null = none)
    selectedOutfitIndex: { type: Number, default: null },
    // Indexes the user rejected
    rejectedOutfitIndexes: { type: [Number], default: [] },
    // Whether this was generated as "Outfit of the Day"
    isOutfitOfTheDay: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.OutfitHistory ||
  mongoose.model("OutfitHistory", OutfitHistorySchema);
