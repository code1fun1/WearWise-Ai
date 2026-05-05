export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectDB } from "@/lib/mongodb";
import ClothingItem from "@/models/ClothingItem";

/**
 * GET /api/wardrobe
 * Returns all clothing items for the logged-in user, newest first.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorised" }, { status: 401 });
    }

    await connectDB();

    const items = await ClothingItem.find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ items });
  } catch (error) {
    console.error("[WARDROBE GET ERROR]", error);
    return NextResponse.json(
      { message: "Failed to fetch wardrobe" },
      { status: 500 }
    );
  }
}
