import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";

// ── Gemini: Vision ONLY (image tagging + skin tone) ─────────────
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const visionModel = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

// ── Groq: All text tasks (outfits, chat, capsule, packing) ───────
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const GROQ_MODEL = "llama-3.3-70b-versatile"; // free, 32k context, very fast

async function groqChat(systemPrompt, userMessage, jsonMode = true) {
  const response = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user",   content: userMessage },
    ],
    temperature: 0.7,
    max_tokens: 4096,
    ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
  });
  return response.choices[0]?.message?.content || "";
}

// ── 1. Tag clothing image (Gemini Vision) ────────────────────────

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
    throw new Error(`Gemini Vision returned invalid JSON: ${text}`);
  }
}

// ── 2. Analyze skin tone (Gemini Vision) ─────────────────────────

export async function analyzeSkinTone(base64Image, mimeType) {
  const prompt = `You are a professional color analyst and fashion consultant. Analyze this person's photo carefully.

Determine their skin tone undertone and return ONLY a valid JSON object (no markdown):
{
  "undertone": "one of: warm, cool, neutral",
  "description": "1 sentence describing their skin tone",
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
    throw new Error(`Gemini Vision returned invalid JSON for skin tone: ${text}`);
  }
}

// ── 3. Generate outfit recommendations (Groq) ────────────────────

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

  const system = `You are a professional fashion stylist with expertise in Indian and Western wear.
You always respond with valid JSON only — no markdown, no explanation outside the JSON.`;

  const user = `WARDROBE (use ONLY these items — reference by id):
${JSON.stringify(wardrobeList, null, 2)}

CONTEXT:
- Occasion: ${occasion}
- Weather: ${weather.temp}°C, ${weather.condition} in ${weather.city}
- User Preferences: ${buildPreferencesText(preferences)}

Generate exactly 3 complete outfit combinations. Rules:
1. Each outfit needs minimum: top + bottom OR full outfit (dress/saree/suit)
2. Ensure color harmony, match the occasion
3. Consider weather: ${weather.temp > 30 ? "hot — prefer light fabrics" : weather.temp < 15 ? "cold — include layers" : "comfortable temperature"}
4. Only use items from the wardrobe above

Return this JSON:
{
  "outfits": [
    { "items": ["<id>", "<id>"], "explanation": "1-2 sentence explanation" }
  ]
}`;

  const text = await groqChat(system, user, true);
  const jsonStr = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  try {
    return JSON.parse(jsonStr);
  } catch {
    throw new Error(`Groq returned invalid JSON for outfit generation: ${text}`);
  }
}

// ── 4. AI Chat Stylist (Groq) ────────────────────────────────────

function isFashionRelatedQuestion(content) {
  const fashionKeywords = [
    "wear", "outfit", "wardrobe", "clothes", "clothing", "dress", "shirt", "pant",
    "jeans", "skirt", "jacket", "coat", "shoe", "sneaker", "boot", "sandals",
    "color", "style", "fashion", "occasion", "casual", "formal", "party", "wedding",
    "interview", "work", "office", "date", "gym", "beach", "weather", "season",
    "match", "combination", "look", "style", "accessory", "bag", "hat",
    "summer", "winter", "spring", "fall", "monsoon", "ethnic", "western",
    "kurta", "saree", "lehenga", "suit", "blazer", "hoodie", "sweater", "t-shirt",
    "what should i wear", "suggest", "recommend", "outfit for", "matching",
    "layer", "pair", "coordinate", "outfit combination", "what to wear",
  ];

  const lowerContent = content.toLowerCase();
  return fashionKeywords.some((kw) => lowerContent.includes(kw));
}

export async function chatWithStylist({ messages, wardrobe, weather, preferences }) {
  const lastUserMessage = messages.filter((m) => m.role === "user").pop();
  if (lastUserMessage && !isFashionRelatedQuestion(lastUserMessage.content)) {
    return "I'm StyleAI, your personal fashion stylist. I can help you with outfit suggestions, wardrobe combinations, and fashion advice based on your clothes. Please ask me something related to fashion or styling!";
  }

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

  const weatherText = weather
    ? `Current weather: ${weather.temp}°C, ${weather.condition} in ${weather.city}`
    : "Weather: unknown";

  const systemPrompt = `You are StyleAI, a personal fashion stylist assistant. You help users create outfits from their wardrobe.
You ONLY answer questions about fashion, clothing, outfits, and personal styling. If asked about anything else, politely decline.

WARDROBE (JSON — reference items by their id when suggesting outfits):
${JSON.stringify(wardrobeList, null, 2)}

${weatherText}
User Preferences: ${buildPreferencesText(preferences)}

Rules:
- Be conversational, friendly, and concise
- When suggesting outfits, always reference actual item IDs from the wardrobe
- Format outfit suggestions using this exact block so the UI can render them:
<outfit>{"items":["id1","id2"],"explanation":"why this works"}</outfit>
- You can include multiple <outfit> blocks in one message
- Consider weather and occasion from the user's message
- If wardrobe is empty, say so helpfully`;

  // Convert message history for Groq
  const groqMessages = [
    { role: "system", content: systemPrompt },
    ...messages.map((m) => ({
      role: m.role === "user" ? "user" : "assistant",
      content: m.content,
    })),
  ];

  const response = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: groqMessages,
    temperature: 0.8,
    max_tokens: 1024,
  });

  return response.choices[0]?.message?.content || "I couldn't generate a response. Please try again.";
}

// ── 5. Capsule wardrobe analysis (Groq) ──────────────────────────

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

  const system = `You are a fashion consultant specializing in capsule wardrobes. Respond with valid JSON only.`;

  const user = `Analyze this wardrobe and return a JSON capsule analysis:
${JSON.stringify(wardrobeList, null, 2)}

Return this JSON:
{
  "utilizationScore": <0-100>,
  "wardrobePersonality": "<2-3 word style identity>",
  "styleBreakdown": { "casual": <pct>, "formal": <pct>, "ethnic": <pct>, "sporty": <pct>, "other": <pct> },
  "capsuleItems": ["<id>", ...],
  "capsuleReasoning": "2-3 sentences",
  "deadItems": ["<id>", ...],
  "missingPieces": [{ "type": "<type>", "reason": "<reason>" }],
  "insights": ["insight1", "insight2", "insight3"],
  "outfitCombinations": <number>
}`;

  const text = await groqChat(system, user, true);
  const jsonStr = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  try {
    return JSON.parse(jsonStr);
  } catch {
    throw new Error(`Groq returned invalid JSON for capsule analysis: ${text}`);
  }
}

// ── 6. Smart packing list (Groq) ─────────────────────────────────

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

  const system = `You are an expert travel stylist. Respond with valid JSON only.`;

  const user = `Create a smart packing list for this trip using only items from the wardrobe.

WARDROBE:
${JSON.stringify(wardrobeList, null, 2)}

TRIP:
- Destination: ${destination}
- Duration: ${days} days
- Purpose: ${purpose}
- Weather: ${weather ? `${weather.temp}°C, ${weather.condition}` : "unknown"}

Maximize outfit combinations with minimal items.

Return this JSON:
{
  "packingList": [{ "itemId": "<id>", "outfitsItCreates": <number>, "reason": "<why pack this>" }],
  "outfitCombinations": [{ "day": <n>, "occasion": "<occasion>", "items": ["<id>"], "description": "<brief>" }],
  "totalItems": <number>,
  "tips": ["tip1", "tip2"]
}`;

  const text = await groqChat(system, user, true);
  const jsonStr = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  try {
    return JSON.parse(jsonStr);
  } catch {
    throw new Error(`Groq returned invalid JSON for packing list: ${text}`);
  }
}

// ── Helper ────────────────────────────────────────────────────────

function buildPreferencesText(prefs) {
  if (!prefs) return "No preferences recorded yet";
  const parts = [];
  if (prefs.preferredColors?.length)   parts.push(`Likes colors: ${prefs.preferredColors.join(", ")}`);
  if (prefs.avoidedColors?.length)     parts.push(`Avoids colors: ${prefs.avoidedColors.join(", ")}`);
  if (prefs.preferredStyles?.length)   parts.push(`Prefers styles: ${prefs.preferredStyles.join(", ")}`);
  if (prefs.avoidedStyles?.length)     parts.push(`Dislikes styles: ${prefs.avoidedStyles.join(", ")}`);
  if (prefs.preferredPatterns?.length) parts.push(`Likes patterns: ${prefs.preferredPatterns.join(", ")}`);
  if (prefs.skinTone)                  parts.push(`Skin tone: ${prefs.skinTone}`);
  return parts.length ? parts.join(". ") : "No strong preferences yet";
}
