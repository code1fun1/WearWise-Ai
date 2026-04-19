/**
 * Occasion Intelligence Mapper
 *
 * Maps a user-selected occasion to:
 *  - styles   : clothing styles that fit the occasion
 *  - occasions: clothing occasion tags to filter by
 *  - formality: 1 (very casual) → 5 (very formal)
 *
 * This is used to pre-filter the wardrobe BEFORE sending to Gemini,
 * so the LLM only sees relevant items and generates better outfits.
 */

const OCCASION_MAP = {
  casual: {
    styles: ["casual", "sporty", "streetwear", "bohemian"],
    occasions: ["casual", "outdoor"],
    formality: 1,
    description: "relaxed everyday wear",
  },
  office: {
    styles: ["formal", "smart casual", "minimal"],
    occasions: ["office", "formal"],
    formality: 4,
    description: "professional workplace attire",
  },
  "smart casual": {
    styles: ["smart casual", "casual", "formal"],
    occasions: ["casual", "office", "date"],
    formality: 3,
    description: "smart casual — elevated everyday look",
  },
  party: {
    styles: ["festive", "smart casual", "streetwear", "bohemian"],
    occasions: ["party", "festive", "date"],
    formality: 3,
    description: "fun and stylish party look",
  },
  wedding: {
    styles: ["ethnic", "festive", "formal"],
    occasions: ["wedding", "festive", "formal"],
    formality: 5,
    description: "elegant wedding guest or ceremonial wear",
  },
  date: {
    styles: ["smart casual", "casual", "bohemian"],
    occasions: ["date", "casual", "party"],
    formality: 2,
    description: "stylish and put-together date look",
  },
  festive: {
    styles: ["ethnic", "festive", "formal"],
    occasions: ["festive", "wedding", "party"],
    formality: 4,
    description: "festive ethnic or traditional wear",
  },
  outdoor: {
    styles: ["sporty", "casual", "streetwear"],
    occasions: ["outdoor", "casual", "gym"],
    formality: 1,
    description: "practical outdoor-ready outfit",
  },
  gym: {
    styles: ["sporty"],
    occasions: ["gym", "outdoor"],
    formality: 1,
    description: "comfortable activewear",
  },
  beach: {
    styles: ["casual", "bohemian", "sporty"],
    occasions: ["beach", "casual", "outdoor"],
    formality: 1,
    description: "light and breezy beach outfit",
  },
  formal: {
    styles: ["formal"],
    occasions: ["formal", "office", "wedding"],
    formality: 5,
    description: "strictly formal attire",
  },
};

/**
 * @param {string} occasion - User-selected occasion
 * @returns {{ styles: string[], occasions: string[], formality: number, description: string }}
 */
export function mapOccasionToStyle(occasion) {
  const key = occasion?.toLowerCase()?.trim();
  return (
    OCCASION_MAP[key] ?? {
      styles: ["casual", "smart casual"],
      occasions: ["casual"],
      formality: 2,
      description: occasion || "general occasion",
    }
  );
}

/**
 * Returns all available occasion options for the UI dropdown.
 */
export function getOccasionOptions() {
  return Object.keys(OCCASION_MAP);
}
