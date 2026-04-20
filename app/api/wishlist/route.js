import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectDB } from "@/lib/mongodb";
import Wishlist from "@/models/Wishlist";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorised" }, { status: 401 });

    await connectDB();

    const items = await Wishlist.find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ items });
  } catch (error) {
    console.error("[WISHLIST GET ERROR]", error);
    return NextResponse.json({ message: "Failed to fetch wishlist" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorised" }, { status: 401 });

    const { itemType, reason, source } = await request.json();
    if (!itemType?.trim()) {
      return NextResponse.json({ message: "itemType is required" }, { status: 400 });
    }

    await connectDB();

    // Avoid duplicates — don't add the same type twice if not yet purchased
    const existing = await Wishlist.findOne({
      userId:    session.user.id,
      itemType:  itemType.trim().toLowerCase(),
      purchased: false,
    });
    if (existing) {
      return NextResponse.json({ item: existing, duplicate: true });
    }

    const item = await Wishlist.create({
      userId:   session.user.id,
      itemType: itemType.trim().toLowerCase(),
      reason:   reason?.trim() || "",
      source:   source || "manual",
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error("[WISHLIST POST ERROR]", error);
    return NextResponse.json({ message: "Failed to add wishlist item" }, { status: 500 });
  }
}
