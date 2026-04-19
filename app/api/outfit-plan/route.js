import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectDB } from "@/lib/mongodb";
import OutfitPlan from "@/models/OutfitPlan";
import ClothingItem from "@/models/ClothingItem";

/**
 * GET /api/outfit-plan?month=YYYY-MM
 * Returns all outfit plans for the given month.
 */
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorised" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month"); // "2024-06"

    await connectDB();

    const query = { userId: session.user.id };
    if (month) {
      query.date = { $regex: `^${month}` };
    }

    const plans = await OutfitPlan.find(query).lean();

    // Hydrate item IDs
    const allItemIds = plans.flatMap((p) => p.items);
    const items = await ClothingItem.find({ _id: { $in: allItemIds } }).lean();
    const itemMap = {};
    items.forEach((i) => { itemMap[i._id.toString()] = i; });

    const hydrated = plans.map((p) => ({
      ...p,
      items: p.items.map((id) => itemMap[id.toString()]).filter(Boolean),
    }));

    return NextResponse.json({ plans: hydrated });
  } catch (error) {
    console.error("[OUTFIT PLAN GET ERROR]", error);
    return NextResponse.json({ message: "Failed to fetch plans" }, { status: 500 });
  }
}

/**
 * POST /api/outfit-plan
 * Body: { date, occasion, items: [itemId], note? }
 */
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorised" }, { status: 401 });

    const { date, occasion, items, note } = await request.json();
    if (!date || !items?.length) {
      return NextResponse.json({ message: "Date and items are required" }, { status: 400 });
    }

    await connectDB();

    // Upsert — one plan per user per date
    const plan = await OutfitPlan.findOneAndUpdate(
      { userId: session.user.id, date },
      { $set: { occasion: occasion || "casual", items, note: note || "" } },
      { upsert: true, new: true }
    ).lean();

    return NextResponse.json({ plan }, { status: 201 });
  } catch (error) {
    console.error("[OUTFIT PLAN POST ERROR]", error);
    return NextResponse.json({ message: "Failed to save plan" }, { status: 500 });
  }
}

/**
 * DELETE /api/outfit-plan?date=YYYY-MM-DD
 */
export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorised" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    if (!date) return NextResponse.json({ message: "Date required" }, { status: 400 });

    await connectDB();
    await OutfitPlan.deleteOne({ userId: session.user.id, date });

    return NextResponse.json({ message: "Plan removed" });
  } catch (error) {
    console.error("[OUTFIT PLAN DELETE ERROR]", error);
    return NextResponse.json({ message: "Failed to delete plan" }, { status: 500 });
  }
}
