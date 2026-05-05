export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectDB } from "@/lib/mongodb";
import ClothingItem from "@/models/ClothingItem";

/**
 * GET /api/cost-summary
 *
 * Lightweight endpoint for the dashboard Cost Tracker card.
 * Returns only what the card needs — avoids loading full sustainability page data.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorised" }, { status: 401 });

    await connectDB();

    const items = await ClothingItem.find({ userId: session.user.id })
      .select("_id type color customName imageUrl purchasePrice wearCount lastWorn createdAt")
      .lean();

    if (!items.length) {
      return NextResponse.json({ empty: true });
    }

    const now           = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    const priced = items
      .filter((i) => i.purchasePrice != null && i.purchasePrice > 0)
      .map((i) => ({
        _id:          i._id,
        type:         i.type,
        color:        i.color,
        customName:   i.customName,
        imageUrl:     i.imageUrl,
        purchasePrice: i.purchasePrice,
        wearCount:    i.wearCount || 0,
        costPerWear:  i.wearCount > 0
          ? +(i.purchasePrice / i.wearCount).toFixed(0)
          : i.purchasePrice, // never worn → full price is current CPW
      }));

    const deadItems = items.filter(
      (i) => (i.wearCount || 0) === 0 && new Date(i.createdAt) < thirtyDaysAgo
    );

    const totalValue = priced.reduce((s, i) => s + i.purchasePrice, 0);
    const avgCostPerWear =
      priced.filter((i) => i.wearCount > 0).length > 0
        ? +(
            priced
              .filter((i) => i.wearCount > 0)
              .reduce((s, i) => s + i.costPerWear, 0) /
            priced.filter((i) => i.wearCount > 0).length
          ).toFixed(0)
        : null;

    // Most expensive per wear (top 3)
    const mostExpensive = [...priced]
      .sort((a, b) => b.costPerWear - a.costPerWear)
      .slice(0, 3);

    // Best value: lowest CPW among items actually worn
    const bestValue = [...priced]
      .filter((i) => i.wearCount > 0)
      .sort((a, b) => a.costPerWear - b.costPerWear)[0] || null;

    // Unused value — sum of purchase price of never-worn priced items
    const unusedValue = priced
      .filter((i) => i.wearCount === 0)
      .reduce((s, i) => s + i.purchasePrice, 0);

    return NextResponse.json({
      empty:          false,
      hasPrices:      priced.length > 0,
      totalItems:     items.length,
      pricedItems:    priced.length,
      totalValue:     +totalValue.toFixed(0),
      avgCostPerWear,
      deadCount:      deadItems.length,
      unusedValue:    +unusedValue.toFixed(0),
      mostExpensive,
      bestValue,
    });
  } catch (error) {
    console.error("[COST SUMMARY ERROR]", error);
    return NextResponse.json({ message: "Failed to fetch cost summary" }, { status: 500 });
  }
}
