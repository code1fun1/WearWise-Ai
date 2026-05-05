export const dynamic = "force-dynamic";

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
import { rateLimit, rateLimitResponse, LIMITS } from "@/lib/rateLimit";

/**
 * GET /api/outfit-of-the-day?city=Mumbai
 *
 * Returns one outfit for today.
 * - If already generated today → return cached result (no Gemini call)
 * - Otherwise → generate fresh, pick best outfit, cache on User document
 * - Avoids repeating the same outfit as the previous day
 */
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorised" }, { status: 401 });

    const rl = rateLimit(session.user.id, "outfit-of-the-day", LIMITS["outfit-of-the-day"]);
    if (!rl.allowed) return rateLimitResponse(NextResponse, rl, "Outfit of the Day");

    const { searchParams } = new URL(request.url);

    await connectDB();

    const user = await User.findById(session.user.id);
    // Use query param → stored profile city → default
    const city = searchParams.get("city") || user?.preferences?.city || "Mumbai";
    const today = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"

    // ── Return cached outfit if already generated today ──────────
    if (user.lastOutfitDate === today && user.outfitOfTheDay) {
      // Re-hydrate items (stored as IDs in cache)
      const populated = await populateOutfit(user.outfitOfTheDay);
      return NextResponse.json({
        outfit: populated,
        cached: true,
        date: today,
      });
    }

    // ── Generate a fresh outfit ──────────────────────────────────
    const wardrobeItems = await ClothingItem.find({
      userId: session.user.id,
      inLaundry: false,
    }).lean();

    if (wardrobeItems.length < 2) {
      return NextResponse.json(
        {
          message:
            "Add at least 2 clothing items to your wardrobe to get an Outfit of the Day.",
        },
        { status: 400 }
      );
    }

    const weather = await getWeather(city);
    const occasionMeta = mapOccasionToStyle("casual"); // OOTD defaults to casual
    const filteredWardrobe = filterWardrobeForOutfit(
      wardrobeItems,
      occasionMeta,
      weather
    );

    // Build exclusion hint — avoid yesterday's items if possible
    const yesterdayItemIds = user.outfitOfTheDay?.items || [];

    const geminiResult = await generateOutfits({
      wardrobe: filteredWardrobe,
      occasion: "casual everyday wear",
      weather,
      preferences: user.preferences || {},
    }).catch(() => buildFallbackOutfits(filteredWardrobe));

    if (!geminiResult?.outfits?.length) {
      return NextResponse.json(
        { message: "Could not generate Outfit of the Day. Try again later." },
        { status: 500 }
      );
    }

    // Build item lookup
    const itemMap = {};
    wardrobeItems.forEach((item) => {
      itemMap[item._id.toString()] = item;
    });

    // Resolve all outfits and pick the one least overlapping with yesterday
    const resolvedOutfits = geminiResult.outfits
      .map((o) => ({
        items: o.items.map((id) => itemMap[id]).filter(Boolean),
        explanation: o.explanation,
      }))
      .filter((o) => o.items.length >= 2);

    if (!resolvedOutfits.length) {
      return NextResponse.json(
        { message: "Could not match outfit items. Try again later." },
        { status: 500 }
      );
    }

    // Score: lower overlap with yesterday = better
    const yesterdaySet = new Set(
      yesterdayItemIds.map((id) => id.toString())
    );
    const scored = resolvedOutfits.map((o) => ({
      outfit: o,
      overlap: o.items.filter((i) => yesterdaySet.has(i._id.toString())).length,
    }));
    scored.sort((a, b) => a.overlap - b.overlap);
    const chosen = scored[0].outfit;

    // ── Cache result on user document ────────────────────────────
    user.lastOutfitDate = today;
    user.outfitOfTheDay = {
      items: chosen.items.map((i) => i._id),
      explanation: chosen.explanation,
    };
    await user.save();

    // ── Save to OutfitHistory ─────────────────────────────────────
    await OutfitHistory.create({
      userId: session.user.id,
      occasion: "casual",
      weather: { temp: weather.temp, condition: weather.condition, city: weather.city },
      generatedOutfits: resolvedOutfits.map((o) => ({
        items: o.items.map((i) => i._id),
        explanation: o.explanation,
      })),
      isOutfitOfTheDay: true,
    });

    return NextResponse.json({
      outfit: chosen,
      cached: false,
      weather,
      date: today,
    });
  } catch (error) {
    console.error("[OUTFIT OF THE DAY ERROR]", error);
    return NextResponse.json(
      { message: "Failed to get Outfit of the Day" },
      { status: 500 }
    );
  }
}

// ── Helper: re-hydrate cached outfit (items stored as IDs) ───────
async function populateOutfit(cached) {
  if (!cached?.items?.length) return cached;
  const items = await ClothingItem.find({
    _id: { $in: cached.items },
  }).lean();
  return { items, explanation: cached.explanation };
}

// ── Fallback: rule-based outfit picker (no AI needed) ────────────
function buildFallbackOutfits(items) {
  const tops    = items.filter(i => ["t-shirt","shirt","blouse","kurta","sweater","hoodie"].includes(i.type));
  const bottoms = items.filter(i => ["jeans","trousers","skirt","shorts"].includes(i.type));
  const full    = items.filter(i => ["dress","saree","suit","lehenga"].includes(i.type));
  const shoes   = items.filter(i => ["sneakers","shoes","sandals","boots","heels"].includes(i.type));

  const outfits = [];

  // Try top + bottom combos
  if (tops.length && bottoms.length) {
    outfits.push({
      items: [tops[0]._id.toString(), bottoms[0]._id.toString(), ...(shoes[0] ? [shoes[0]._id.toString()] : [])],
      explanation: "A simple everyday combination from your wardrobe.",
    });
  }
  // Full outfit (dress/saree)
  if (full.length) {
    outfits.push({
      items: [full[0]._id.toString(), ...(shoes[0] ? [shoes[0]._id.toString()] : [])],
      explanation: "A complete outfit from your wardrobe.",
    });
  }
  // Fallback: just pick first 2 items
  if (!outfits.length && items.length >= 2) {
    outfits.push({
      items: [items[0]._id.toString(), items[1]._id.toString()],
      explanation: "Items picked from your wardrobe.",
    });
  }

  return { outfits };
}
