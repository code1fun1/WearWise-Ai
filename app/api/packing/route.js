import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectDB } from "@/lib/mongodb";
import ClothingItem from "@/models/ClothingItem";
import { getWeather } from "@/services/weatherService";
import { generatePackingList } from "@/services/geminiService";
import { rateLimit, rateLimitResponse, LIMITS } from "@/lib/rateLimit";

/**
 * POST /api/packing
 * Body: { destination: string, days: number, purpose: string }
 */
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorised" }, { status: 401 });

    const rl = rateLimit(session.user.id, "packing", LIMITS["packing"]);
    if (!rl.allowed) return rateLimitResponse(NextResponse, rl, "Packing List generation");

    const { destination, days, purpose } = await request.json();
    if (!destination || !days || !purpose) {
      return NextResponse.json(
        { message: "Destination, days, and purpose are required" },
        { status: 400 }
      );
    }

    await connectDB();

    const wardrobe = await ClothingItem.find({
      userId: session.user.id,
      inLaundry: false,
    }).lean();

    if (wardrobe.length < 3) {
      return NextResponse.json(
        { message: "Add at least 3 clothing items to your wardrobe to use Packing Assistant." },
        { status: 400 }
      );
    }

    const weather = await getWeather(destination).catch(() => null);

    const result = await generatePackingList({
      wardrobe,
      destination,
      days: parseInt(days),
      purpose,
      weather,
    }).catch(() => buildFallbackPackingList(wardrobe, parseInt(days)));

    // Resolve item IDs to full objects
    const itemMap = {};
    wardrobe.forEach((i) => { itemMap[i._id.toString()] = i; });

    const enrichedList = result.packingList
      .map((p) => ({
        ...p,
        item: itemMap[p.itemId] || null,
      }))
      .filter((p) => p.item !== null);

    const enrichedOutfits = (result.outfitCombinations || []).map((o) => ({
      ...o,
      itemObjects: o.items.map((id) => itemMap[id]).filter(Boolean),
    }));

    return NextResponse.json({
      packingList: enrichedList,
      outfitCombinations: enrichedOutfits,
      totalItems: enrichedList.length,
      tips: result.tips || [],
      weather,
      destination,
      days,
      purpose,
    });
  } catch (error) {
    console.error("[PACKING ERROR]", error);
    return NextResponse.json({ message: "Failed to generate packing list" }, { status: 500 });
  }
}

function buildFallbackPackingList(wardrobe, days) {
  const tops    = wardrobe.filter((i) => ["t-shirt", "shirt", "blouse", "kurta", "sweater", "hoodie"].includes(i.type));
  const bottoms = wardrobe.filter((i) => ["jeans", "trousers", "skirt", "shorts"].includes(i.type));
  const shoes   = wardrobe.filter((i) => ["sneakers", "shoes", "sandals", "boots", "heels"].includes(i.type));

  const needed = Math.min(days + 1, tops.length + bottoms.length);
  const items = [...tops.slice(0, Math.ceil(needed / 2)), ...bottoms.slice(0, Math.floor(needed / 2)), ...shoes.slice(0, 1)];

  return {
    packingList: items.map((i) => ({
      itemId: i._id.toString(),
      outfitsItCreates: 2,
      reason: "Versatile piece for your trip",
    })),
    outfitCombinations: [],
    tips: ["Pack versatile, mix-and-match pieces", "Roll clothes to save space"],
  };
}
