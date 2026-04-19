import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectDB } from "@/lib/mongodb";
import ClothingItem from "@/models/ClothingItem";

/**
 * GET /api/sustainability
 * Returns cost-per-wear, utilization stats, dead items, and sustainability score.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorised" }, { status: 401 });

    await connectDB();

    const items = await ClothingItem.find({ userId: session.user.id }).lean();

    if (!items.length) {
      return NextResponse.json({ items: [], stats: getEmptyStats() });
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    const enriched = items.map((item) => {
      const price = item.purchasePrice ?? null;
      const wears = item.wearCount || 0;
      const costPerWear = price && wears > 0 ? +(price / wears).toFixed(2) : null;
      const daysSinceWorn = item.lastWorn
        ? Math.floor((now - new Date(item.lastWorn)) / (1000 * 60 * 60 * 24))
        : null;
      const isDead = wears === 0 && new Date(item.createdAt) < thirtyDaysAgo;
      const isUnderused = wears > 0 && wears < 3 && new Date(item.createdAt) < thirtyDaysAgo;

      return {
        _id: item._id,
        imageUrl: item.imageUrl,
        type: item.type,
        color: item.color,
        customName: item.customName,
        purchasePrice: price,
        wearCount: wears,
        costPerWear,
        lastWorn: item.lastWorn,
        daysSinceWorn,
        isDead,
        isUnderused,
        inLaundry: item.inLaundry,
      };
    });

    // Overall stats
    const priced = enriched.filter((i) => i.purchasePrice !== null);
    const totalValue = priced.reduce((s, i) => s + i.purchasePrice, 0);
    const avgCostPerWear = priced.filter((i) => i.costPerWear !== null).length
      ? +(
          priced
            .filter((i) => i.costPerWear !== null)
            .reduce((s, i) => s + i.costPerWear, 0) /
            priced.filter((i) => i.costPerWear !== null).length
        ).toFixed(2)
      : null;

    const deadCount = enriched.filter((i) => i.isDead).length;
    const underusedCount = enriched.filter((i) => i.isUnderused).length;
    const wornRecently = enriched.filter(
      (i) => i.lastWorn && new Date(i.lastWorn) > thirtyDaysAgo
    ).length;

    const utilizationScore = items.length
      ? Math.round((wornRecently / items.length) * 100)
      : 0;

    // Sustainability score (0-100)
    // Higher score = more sustainable (fewer dead items, higher wear counts)
    const avgWears = items.length
      ? enriched.reduce((s, i) => s + i.wearCount, 0) / items.length
      : 0;
    const sustainabilityScore = Math.min(
      100,
      Math.round(
        (avgWears * 10) + (utilizationScore * 0.5) - (deadCount * 5)
      )
    );

    return NextResponse.json({
      items: enriched,
      stats: {
        totalItems: items.length,
        totalValue: +totalValue.toFixed(2),
        avgCostPerWear,
        utilizationScore,
        sustainabilityScore: Math.max(0, sustainabilityScore),
        deadItems: deadCount,
        underusedItems: underusedCount,
        mostWorn: enriched.sort((a, b) => b.wearCount - a.wearCount)[0] || null,
        bestValue: priced.filter((i) => i.costPerWear !== null).sort(
          (a, b) => a.costPerWear - b.costPerWear
        )[0] || null,
      },
    });
  } catch (error) {
    console.error("[SUSTAINABILITY ERROR]", error);
    return NextResponse.json({ message: "Failed to fetch sustainability data" }, { status: 500 });
  }
}

function getEmptyStats() {
  return {
    totalItems: 0,
    totalValue: 0,
    avgCostPerWear: null,
    utilizationScore: 0,
    sustainabilityScore: 0,
    deadItems: 0,
    underusedItems: 0,
    mostWorn: null,
    bestValue: null,
  };
}
