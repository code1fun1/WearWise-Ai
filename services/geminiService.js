import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const visionModel = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
const textModel   = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

// ── Clothing image tagging ───────────────────────────────────────

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

  const imagePart = { inlineData: { data: base64Image, mimeType } };
  const result = await visionModel.generateContent([prompt, imagePart]);
  const text = result.response.text().trim();
  const jsonStr = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  try {
    return JSON.parse(jsonStr);
  } catch {
    throw new Error(`Gemini returned invalid JSON: ${text}`);
  }
}

// ── Outfit generation ────────────────────────────────────────────

export async function generateOutfits({ wardrobe, occasion, weather, preferences }) {
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

// ── AI Chat Stylist ──────────────────────────────────────────────

export async function chatWithStylist({ messages, wardrobe, weather, preferences }) {
  const wardrobeList = wardrobe.map((item) => ({
    id: item._id.toString(),
    type: item.type,
    color: item.color,
    pattern: item.pattern,
    style: item.style,
    occasion: item.occasion,
    season: item.season,
    customName: item.customName || null,
  }));

  const preferencesText = buildPreferencesText(preferences);
  const weatherText = weather
    ? `Current weather: ${weather.temp}°C, ${weather.condition} in ${weather.city}`
    : "Weather: unknown";

  const systemPrompt = `You are StyleAI, a personal fashion stylist assistant. You help users create outfits from their wardrobe.

WARDROBE (JSON — reference items by their id field when suggesting outfits):
${JSON.stringify(wardrobeList, null, 2)}

${weatherText}
User Preferences: ${preferencesText}

Rules:
- When suggesting outfits, ALWAYS reference actual item IDs from the wardrobe above
- Keep responses conversational, friendly, and concise
- If suggesting an outfit, format it clearly with item IDs
- Consider weather and occasion context from the user's message
- If wardrobe is empty or insufficient, say so helpfully
- When you suggest outfits, output them in this JSON block format so the UI can render them:
<outfit>{"items":["id1","id2"],"explanation":"why this works"}</outfit>
You can suggest multiple outfits in one message using multiple <outfit> blocks.`;

  // Build conversation history for Gemini
  const conversationHistory = messages.slice(0, -1).map((m) => ({
    role: m.role === "user" ? "user" : "model",
    parts: [{ text: m.content }],
  }));

  const lastMessage = messages[messages.length - 1];

  const chat = textModel.startChat({
    history: [
      { role: "user", parts: [{ text: systemPrompt }] },
      { role: "model", parts: [{ text: "Got it! I'm StyleAI, your personal stylist. I have your wardrobe loaded and I'm ready to help you put together great outfits. What are you dressing for today?" }] },
      ...conversationHistory,
    ],
  });

  const result = await chat.sendMessage(lastMessage.content);
  return result.response.text();
}

// ── Skin tone analysis ───────────────────────────────────────────

export async function analyzeSkinTone(base64Image, mimeType) {
  const prompt = `You are a professional color analyst and fashion consultant. Analyze this person's photo carefully.

Determine their skin tone undertone and return ONLY a valid JSON object (no markdown):
{
  "undertone": "one of: warm, cool, neutral",
  "description": "1 sentence describing their skin tone (e.g. warm golden undertones)",
  "bestColors": ["5-6 colors that complement this skin tone"],
  "colorsToAvoid": ["3-4 colors that clash with this skin tone"],
  "seasonPalette": "one of: Spring, Summer, Autumn, Winter"
}`;

  const imagePart = { inlineData: { data: base64Image, mimeType } };
  const result = await visionModel.generateContent([prompt, imagePart]);
  const text = result.response.text().trim();
  const jsonStr = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  try {
    return JSON.parse(jsonStr);
  } catch {
    throw new Error(`Gemini returned invalid JSON for skin tone: ${text}`);
  }
}

// ── Capsule wardrobe analysis ────────────────────────────────────

export async function generateCapsuleAnalysis(wardrobe) {
  const wardrobeList = wardrobe.map((item) => ({
    id: item._id.toString(),
    type: item.type,
    color: item.color,
    pattern: item.pattern,
    style: item.style,
    occasion: item.occasion,
    season: item.season,
    wearCount: item.wearCount || 0,
    customName: item.customName || null,
  }));

  const prompt = `You are a fashion consultant specializing in capsule wardrobes and wardrobe optimization.

USER'S WARDROBE:
${JSON.stringify(wardrobeList, null, 2)}

Analyze this wardrobe deeply and return ONLY a valid JSON object (no markdown):
{
  "utilizationScore": <0-100 number representing wardrobe utilization>,
  "wardrobePersonality": "<2-3 word style identity e.g. 'Casual Minimalist', 'Bold Maximalist'>",
  "styleBreakdown": {
    "casual": <percentage>,
    "formal": <percentage>,
    "ethnic": <percentage>,
    "sporty": <percentage>,
    "other": <percentage>
  },
  "capsuleItems": ["<id>", "<id>", ...],
  "capsuleReasoning": "2-3 sentences explaining why these items form the ideal capsule",
  "deadItems": ["<id>", "<id>"],
  "missingPieces": [
    { "type": "<clothing type>", "reason": "<why it would expand outfit combinations>" }
  ],
  "insights": ["3-4 actionable insights about the wardrobe"],
  "outfitCombinations": <estimated number of outfit combinations possible>
}`;

  const result = await textModel.generateContent(prompt);
  const text = result.response.text().trim();
  const jsonStr = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  try {
    return JSON.parse(jsonStr);
  } catch {
    throw new Error(`Gemini returned invalid JSON for capsule analysis: ${text}`);
  }
}

// ── Smart packing list ────────────────────────────────────────────

export async function generatePackingList({ wardrobe, destination, days, purpose, weather }) {
  const wardrobeList = wardrobe.map((item) => ({
    id: item._id.toString(),
    type: item.type,
    color: item.color,
    style: item.style,
    occasion: item.occasion,
    season: item.season,
    customName: item.customName || null,
  }));

  const prompt = `You are an expert travel stylist. Help pack the perfect wardrobe for a trip.

USER'S WARDROBE:
${JSON.stringify(wardrobeList, null, 2)}

TRIP DETAILS:
- Destination: ${destination}
- Duration: ${days} days
- Purpose: ${purpose}
- Weather at destination: ${weather ? `${weather.temp}°C, ${weather.condition}` : "unknown"}

Create a smart packing list using items from the wardrobe. Maximize outfit combinations with minimal items.

Return ONLY a valid JSON object (no markdown):
{
  "packingList": [
    {
      "itemId": "<id from wardrobe>",
      "outfitsItCreates": <number>,
      "reason": "<why pack this>"
    }
  ],
  "outfitCombinations": [
    {
      "day": <day number>,
      "occasion": "<occasion for that day>",
      "items": ["<id>", "<id>"],
      "description": "<brief description>"
    }
  ],
  "totalItems": <number>,
  "tips": ["2-3 packing tips for this specific trip"]
}`;

  const result = await textModel.generateContent(prompt);
  const text = result.response.text().trim();
  const jsonStr = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  try {
    return JSON.parse(jsonStr);
  } catch {
    throw new Error(`Gemini returned invalid JSON for packing list: ${text}`);
  }
}

// ── Helpers ──────────────────────────────────────────────────────

function buildPreferencesText(prefs) {
  if (!prefs) return "No preferences recorded yet";
  const parts = [];
  if (prefs.preferredColors?.length)  parts.push(`Likes colors: ${prefs.preferredColors.join(", ")}`);
  if (prefs.avoidedColors?.length)    parts.push(`Avoids colors: ${prefs.avoidedColors.join(", ")}`);
  if (prefs.preferredStyles?.length)  parts.push(`Prefers styles: ${prefs.preferredStyles.join(", ")}`);
  if (prefs.avoidedStyles?.length)    parts.push(`Dislikes styles: ${prefs.avoidedStyles.join(", ")}`);
  if (prefs.preferredPatterns?.length)parts.push(`Likes patterns: ${prefs.preferredPatterns.join(", ")}`);
  if (prefs.skinTone)                 parts.push(`Skin tone: ${prefs.skinTone}`);
  return parts.length ? parts.join(". ") : "No strong preferences yet";
}
