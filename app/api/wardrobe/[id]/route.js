import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectDB } from "@/lib/mongodb";
import ClothingItem from "@/models/ClothingItem";
import { deleteImage } from "@/services/cloudinaryService";

/**
 * DELETE /api/wardrobe/[id]
 * Removes a clothing item from MongoDB and deletes the image from Cloudinary.
 */
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorised" }, { status: 401 });
    }

    await connectDB();

    const item = await ClothingItem.findOne({
      _id: params.id,
      userId: session.user.id, // ensure ownership
    });

    if (!item) {
      return NextResponse.json(
        { message: "Item not found" },
        { status: 404 }
      );
    }

    // Delete from Cloudinary first
    await deleteImage(item.cloudinaryId);

    // Then remove from DB
    await ClothingItem.deleteOne({ _id: params.id });

    return NextResponse.json({ message: "Item deleted successfully" });
  } catch (error) {
    console.error("[WARDROBE DELETE ERROR]", error);
    return NextResponse.json(
      { message: "Failed to delete item" },
      { status: 500 }
    );
  }
}
