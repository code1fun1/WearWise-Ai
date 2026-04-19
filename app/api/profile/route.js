import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

/**
 * GET /api/profile
 * Returns the logged-in user's profile including learned preferences.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorised" }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(session.user.id)
      .select("name email image preferences createdAt")
      .lean();

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      name: user.name,
      email: user.email,
      image: user.image,
      preferences: user.preferences || {},
      memberSince: user.createdAt,
    });
  } catch (error) {
    console.error("[PROFILE GET ERROR]", error);
    return NextResponse.json(
      { message: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}
