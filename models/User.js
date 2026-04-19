import mongoose from "mongoose";

const PreferencesSchema = new mongoose.Schema(
  {
    // Colors the user tends to pick (e.g. ["black", "white", "navy"])
    preferredColors: { type: [String], default: [] },
    // Colors the user has rejected
    avoidedColors: { type: [String], default: [] },
    // Styles they like (e.g. ["casual", "formal"])
    preferredStyles: { type: [String], default: [] },
    // Styles they dislike
    avoidedStyles: { type: [String], default: [] },
    // Patterns they like (e.g. ["solid", "stripes"])
    preferredPatterns: { type: [String], default: [] },
    // Occasions they dress for most
    commonOccasions: { type: [String], default: [] },
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    // Hashed password — null for OAuth users
    password: { type: String, default: null },
    image: { type: String, default: null },
    // Learned style preferences updated after each feedback
    preferences: { type: PreferencesSchema, default: () => ({}) },
    // Date of the last generated Outfit of the Day (YYYY-MM-DD string)
    lastOutfitDate: { type: String, default: null },
    // Cached Outfit of the Day for today
    outfitOfTheDay: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", UserSchema);
