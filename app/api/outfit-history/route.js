import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectDB } from "@/lib/mongodb";
import OutfitHistory from "@/models/OutfitHistory";
import ClothingItem from "@/models/ClothingItem";

/**
 * GET /api/outfit-history?page=1&limit=12&occasion=&selectedOnly=false
 *
 * Returns paginated outfit history for the logged-in user,
 * with all ClothingItem references hydrated to full objects.
 */
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorised" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page         = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit        = Math.min(20, Math.max(1, parseInt(searchParams.get("limit") || "12")));
    const occasion     = searchParams.get("occasion") || "";
    const selectedOnly = searchParams.get("selectedOnly") === "true";

    await connectDB();

    // ── Build query ───────────────────────────────────────────────
    const query = { userId: session.user.id };
    if (occasion) query.occasion = occasion;
    if (selectedOnly) query.selectedOutfitIndex = { $ne: null };

    const [records, total] = await Promise.all([
      OutfitHistory.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      OutfitHistory.countDocuments(query),
    ]);

    if (!records.length) {
      return NextResponse.json({ history: [], total: 0, page, pages: 0 });
    }

    // ── Hydrate item IDs → full ClothingItem objects ──────────────
    const allItemIds = [
      ...new Set(
        records.flatMap((r) => r.generatedOutfits.flatMap((o) => o.items.map(String)))
      ),
    ];

    const items = await ClothingItem.find({ _id: { $in: allItemIds } })
      .select("_id type color customName imageUrl")
      .lean();

    const itemMap = {};
    items.forEach((item) => { itemMap[item._id.toString()] = item; });

    const history = records.map((record) => ({
      _id:                   record._id,
      occasion:              record.occasion,
      weather:               record.weather,
      isOutfitOfTheDay:      record.isOutfitOfTheDay,
      selectedOutfitIndex:   record.selectedOutfitIndex,
      rejectedOutfitIndexes: record.rejectedOutfitIndexes,
      createdAt:             record.createdAt,
      generatedOutfits: record.generatedOutfits.map((outfit) => ({
        explanation: outfit.explanation,
        items: outfit.items
          .map((id) => itemMap[id.toString()])
          .filter(Boolean),
      })),
    }));

    return NextResponse.json({ history, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("[OUTFIT HISTORY ERROR]", error);
    return NextResponse.json({ message: "Failed to fetch outfit history" }, { status: 500 });
  }
}
