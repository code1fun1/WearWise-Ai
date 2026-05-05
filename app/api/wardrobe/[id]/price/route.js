export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectDB } from "@/lib/mongodb";
import ClothingItem from "@/models/ClothingItem";

/**
 * PATCH /api/wardrobe/[id]/price
 * Body: { purchasePrice: number }
 */
export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorised" }, { status: 401 });

    const { purchasePrice } = await request.json();
    if (purchasePrice === undefined || purchasePrice < 0) {
      return NextResponse.json({ message: "Invalid price" }, { status: 400 });
    }

    await connectDB();

    const item = await ClothingItem.findOneAndUpdate(
      { _id: params.id, userId: session.user.id },
      { $set: { purchasePrice } },
      { new: true }
    ).lean();

    if (!item) return NextResponse.json({ message: "Item not found" }, { status: 404 });

    return NextResponse.json({ purchasePrice: item.purchasePrice });
  } catch (error) {
    console.error("[PRICE UPDATE ERROR]", error);
    return NextResponse.json({ message: "Failed to update price" }, { status: 500 });
  }
}
