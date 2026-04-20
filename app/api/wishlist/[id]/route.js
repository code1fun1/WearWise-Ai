import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectDB } from "@/lib/mongodb";
import Wishlist from "@/models/Wishlist";

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorised" }, { status: 401 });

    const body = await request.json();
    await connectDB();

    const update = {};
    if (body.purchased !== undefined) {
      update.purchased    = body.purchased;
      update.purchasedAt  = body.purchased ? new Date() : null;
    }

    const item = await Wishlist.findOneAndUpdate(
      { _id: params.id, userId: session.user.id },
      { $set: update },
      { new: true }
    ).lean();

    if (!item) return NextResponse.json({ message: "Not found" }, { status: 404 });
    return NextResponse.json({ item });
  } catch (error) {
    console.error("[WISHLIST PATCH ERROR]", error);
    return NextResponse.json({ message: "Failed to update wishlist item" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorised" }, { status: 401 });

    await connectDB();
    await Wishlist.findOneAndDelete({ _id: params.id, userId: session.user.id });

    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    console.error("[WISHLIST DELETE ERROR]", error);
    return NextResponse.json({ message: "Failed to delete wishlist item" }, { status: 500 });
  }
}
