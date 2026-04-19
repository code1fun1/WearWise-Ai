import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// gemini-2.0-flash-lite: available on free tier, supports vision + text
const visionModel = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
const textModel   = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

/**
 * Analyse a clothing image and return structured tags.
 *
 * @param {string} base64Image  - Raw base64 image data (no data-URI prefix)
 * @param {string} mimeType     - e.g. "image/jpeg"
 * @returns {Promise<{type,color,pattern,style,occasion,season}>}
 */
export async function tagClothingImage(base64Image, mimeType) {
  const prompt = `You are a professional fashion analyst. Analyse this clothing item image carefully.

Return ONLY a valid JSON object with exactly these fields (no markdown, no explanation):
{
  "type": "one of: t-shirt, shirt, blouse, dress, skirt, jeans, trousers, shorts, jacket, coat, sweater, hoodie, kurta, saree, lehenga, suit, blazer, sneakers, shoes, sandals, boots, heels, accessory, other",
  "color": "primary color name (e.g. navy blue, off-white, olive green)",
  "pattern": "one of: solid, stripes, checks, floral, geometric, abstract, printed, embroidered, other",
  "style": "one of: casual, formal, smart casual, ethnic, festive, sporty, bohemian, streetwear, other",
  "occasion": ["array of applicable occasions from: casual, office, party, wedding, date, festive, outdoor, gym, beach, formal"],
  "season": "one of: summer, winter, monsoon, spring, all"
}`;

  const imagePart = {
    inlineData: {
      data: base64Image,
      mimeType: mimeType,
    },
  };

  const result = await visionModel.generateContent([prompt, imagePart]);
  const text = result.response.text().trim();

  // Strip markdown code fences if Gemini wraps the JSON
  const jsonStr = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

  try {
    return JSON.parse(jsonStr);
  } catch {
    throw new Error(`Gemini returned invalid JSON: ${text}`);
  }
}

/**
 * Generate outfit recommendations using Gemini text model.
 *
 * @param {object} params
 * @param {Array}  params.wardrobe     - Filtered clothing items
 * @param {string} params.occasion     - e.g. "office"
 * @param {object} params.weather      - { temp, condition, city }
 * @param {object} params.preferences  - User's learned style preferences
 * @returns {Promise<{outfits: Array<{items: string[], explanation: string}>}>}
 */
export async function generateOutfits({ wardrobe, occasion, weather, preferences }) {
  // Compress wardrobe to only what Gemini needs
  const wardrobeList = wardrobe.map((item) => ({
    id: item._id.toString(),
    type: item.type,
    color: item.color,
    pattern: item.pattern,
    style: item.style,
    occasion: item.occasion,
    season: item.season,
  }));

  const preferencesText = buildPreferencesText(preferences);

  const prompt = `You are a professional fashion stylist with expertise in Indian and Western wear.

WARDROBE (use ONLY these items — reference them by their id):
${JSON.stringify(wardrobeList, null, 2)}

CONTEXT:
- Occasion: ${occasion}
- Weather: ${weather.temp}°C, ${weather.condition} in ${weather.city}
- User Preferences: ${preferencesText}

TASK: Generate exactly 3 complete outfit combinations.

Rules:
1. Each outfit MUST include at minimum: a top AND a bottom OR a full outfit (dress/saree/suit)
2. Optionally include: footwear, outerwear, accessory
3. Ensure color harmony — no clashing combinations
4. Match the occasion appropriately
5. Consider the weather (${weather.temp}°C — ${weather.temp > 30 ? "hot, prefer light fabrics" : weather.temp < 15 ? "cold, include layers" : "comfortable temperature"})
6. Only use items that exist in the wardrobe above
7. Prefer items matching user preferences

Return ONLY a valid JSON object (no markdown):
{
  "outfits": [
    {
      "items": ["<item id>", "<item id>"],
      "explanation": "Brief 1-2 sentence explanation of why this outfit works"
    }
  ]
}`;

  const result = await textModel.generateContent(prompt);
  const text = result.response.text().trim();
  const jsonStr = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

  try {
    return JSON.parse(jsonStr);
  } catch {
    throw new Error(`Gemini returned invalid JSON for outfit generation: ${text}`);
  }
}

// ── Helpers ─────────────────────────────────────────────────────

function buildPreferencesText(prefs) {
  if (!prefs) return "No preferences recorded yet";

  const parts = [];
  if (prefs.preferredColors?.length)
    parts.push(`Likes colors: ${prefs.preferredColors.join(", ")}`);
  if (prefs.avoidedColors?.length)
    parts.push(`Avoids colors: ${prefs.avoidedColors.join(", ")}`);
  if (prefs.preferredStyles?.length)
    parts.push(`Prefers styles: ${prefs.preferredStyles.join(", ")}`);
  if (prefs.avoidedStyles?.length)
    parts.push(`Dislikes styles: ${prefs.avoidedStyles.join(", ")}`);
  if (prefs.preferredPatterns?.length)
    parts.push(`Likes patterns: ${prefs.preferredPatterns.join(", ")}`);

  return parts.length ? parts.join(". ") : "No strong preferences yet";
}
