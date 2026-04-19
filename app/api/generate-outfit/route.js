import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectDB } from "@/lib/mongodb";
import ClothingItem from "@/models/ClothingItem";
import OutfitHistory from "@/models/OutfitHistory";
import User from "@/models/User";
import { getWeather } from "@/services/weatherService";
import { generateOutfits } from "@/services/geminiService";
import { mapOccasionToStyle } from "@/lib/occasionMapper";
import { filterWardrobeForOutfit } from "@/lib/wardrobeFilter";

/**
 * POST /api/generate-outfit
 * Body: { occasion: string, city?: string }
 *
 * Flow:
 *  1. Fetch user's wardrobe + preferences
 *  2. Fetch current weather
 *  3. Map occasion → style context
 *  4. Pre-filter wardrobe (season + occasion + weather)
 *  5. Call Gemini to generate 3 outfits
 *  6. Resolve item IDs → full clothing objects
 *  7. Save to OutfitHistory
 *  8. Return enriched outfits
 */
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorised" }, { status: 401 });
    }

    const body = await request.json();
    const occasion = body.occasion?.trim();

    if (!occasion) {
      return NextResponse.json(
        { message: "Occasion is required" },
        { status: 400 }
      );
    }

    await connectDB();

    // ── 1. Fetch wardrobe + user preferences ───────────────────
    const [wardrobeItems, user] = await Promise.all([
      ClothingItem.find({ userId: session.user.id, inLaundry: false }).lean(),
      User.findById(session.user.id).select("preferences").lean(),
    ]);

    // Use body city → stored profile city → default
    const city = body.city?.trim() || user?.preferences?.city || "Mumbai";

    if (wardrobeItems.length < 2) {
      return NextResponse.json(
        {
          message:
            "You need at least 2 clothing items in your wardrobe to generate outfits. Please add more items first.",
        },
        { status: 400 }
      );
    }

    // ── 2. Weather ──────────────────────────────────────────────
    const weather = await getWeather(city);

    // ── 3. Occasion intelligence ────────────────────────────────
    const occasionMeta = mapOccasionToStyle(occasion);

    // ── 4. Pre-filter wardrobe ──────────────────────────────────
    const filteredWardrobe = filterWardrobeForOutfit(
      wardrobeItems,
      occasionMeta,
      weather
    );

    // ── 5. Call Gemini (with rule-based fallback) ───────────────
    const geminiResult = await generateOutfits({
      wardrobe: filteredWardrobe,
      occasion: `${occasion} (${occasionMeta.description})`,
      weather,
      preferences: user?.preferences || {},
    }).catch(() => buildFallbackOutfits(filteredWardrobe));

    if (!geminiResult?.outfits?.length) {
      return NextResponse.json(
        { message: "AI could not generate outfits. Please try again." },
        { status: 500 }
      );
    }

    // ── 6. Resolve item IDs → full clothing objects ─────────────
    // Build a lookup map for O(1) access
    const itemMap = {};
    wardrobeItems.forEach((item) => {
      itemMap[item._id.toString()] = item;
    });

    const enrichedOutfits = geminiResult.outfits.map((outfit) => ({
      items: outfit.items
        .map((id) => itemMap[id])
        .filter(Boolean), // drop any hallucinated IDs
      explanation: outfit.explanation,
    }));

    // Remove any outfit that ended up with fewer than 2 real items
    const validOutfits = enrichedOutfits.filter((o) => o.items.length >= 2);

    if (validOutfits.length === 0) {
      return NextResponse.json(
        {
          message:
            "AI generated outfits but couldn't match wardrobe items. Please try again.",
        },
        { status: 500 }
      );
    }

    // ── 7. Save to OutfitHistory ────────────────────────────────
    const historyRecord = await OutfitHistory.create({
      userId: session.user.id,
      occasion,
      weather: {
        temp: weather.temp,
        condition: weather.condition,
        city: weather.city,
      },
      generatedOutfits: validOutfits.map((o) => ({
        items: o.items.map((item) => item._id),
        explanation: o.explanation,
      })),
    });

    // ── 8. Return ───────────────────────────────────────────────
    return NextResponse.json({
      historyId: historyRecord._id,
      outfits: validOutfits,
      weather,
      occasion,
      occasionDescription: occasionMeta.description,
    });
  } catch (error) {
    console.error("[GENERATE OUTFIT ERROR]", error);
    return NextResponse.json(
      { message: error.message || "Failed to generate outfits" },
      { status: 500 }
    );
  }
}

// ── Fallback: rule-based outfit builder (no Gemini needed) ───────
function buildFallbackOutfits(items) {
  const tops    = items.filter(i => ["t-shirt","shirt","blouse","kurta","sweater","hoodie"].includes(i.type));
  const bottoms = items.filter(i => ["jeans","trousers","skirt","shorts"].includes(i.type));
  const full    = items.filter(i => ["dress","saree","suit","lehenga"].includes(i.type));
  const shoes   = items.filter(i => ["sneakers","shoes","sandals","boots","heels"].includes(i.type));
  const outfits = [];

  for (let i = 0; i < Math.min(3, Math.max(tops.length, full.length)); i++) {
    if (tops[i] && bottoms[i % bottoms.length]) {
      outfits.push({
        items: [tops[i]._id.toString(), bottoms[i % bottoms.length]._id.toString(), ...(shoes[i % (shoes.length||1)] ? [shoes[i % (shoes.length||1)]._id.toString()] : [])],
        explanation: "A curated combination from your wardrobe (AI unavailable — using smart matching).",
      });
    } else if (full[i]) {
      outfits.push({
        items: [full[i]._id.toString(), ...(shoes[0] ? [shoes[0]._id.toString()] : [])],
        explanation: "A complete outfit from your wardrobe (AI unavailable — using smart matching).",
      });
    }
  }

  if (!outfits.length && items.length >= 2) {
    outfits.push({ items: [items[0]._id.toString(), items[1]._id.toString()], explanation: "Items from your wardrobe." });
  }

  return { outfits };
}
