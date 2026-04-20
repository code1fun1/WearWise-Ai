import mongoose from "mongoose";

const PreferencesSchema = new mongoose.Schema(
  {
    preferredColors:   { type: [String], default: [] },
    avoidedColors:     { type: [String], default: [] },
    preferredStyles:   { type: [String], default: [] },
    avoidedStyles:     { type: [String], default: [] },
    preferredPatterns: { type: [String], default: [] },
    commonOccasions:   { type: [String], default: [] },
    // Location — entered once on profile, used everywhere
    city: { type: String, default: "" },
    // Skin tone analysis result (warm / cool / neutral / unknown)
    skinTone:         { type: String, default: "" },
    skinToneImageUrl: { type: String, default: "" },
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true },
    email:    { type: String, required: true, unique: true },
    password: { type: String, default: null },
    image:    { type: String, default: null },
    preferences:    { type: PreferencesSchema, default: () => ({}) },
    onboardingCompleted: { type: Boolean, default: false },
    lastOutfitDate: { type: String, default: null },
    outfitOfTheDay: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", UserSchema);
