export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectDB } from "@/lib/mongodb";
import ClothingItem from "@/models/ClothingItem";

/**
 * PATCH /api/wardrobe/[id]/laundry
 * Toggles the inLaundry flag on a clothing item.
 */
export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorised" }, { status: 401 });

    await connectDB();

    const item = await ClothingItem.findOne({
      _id: params.id,
      userId: session.user.id,
    });

    if (!item) return NextResponse.json({ message: "Item not found" }, { status: 404 });

    item.inLaundry = !item.inLaundry;
    await item.save();

    return NextResponse.json({ inLaundry: item.inLaundry });
  } catch (error) {
    console.error("[LAUNDRY TOGGLE ERROR]", error);
    return NextResponse.json({ message: "Failed to update laundry status" }, { status: 500 });
  }
}
