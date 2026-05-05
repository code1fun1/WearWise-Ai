export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorised" }, { status: 401 });

    await connectDB();
    const user = await User.findById(session.user.id)
      .select("name email image preferences onboardingCompleted createdAt")
      .lean();

    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

    return NextResponse.json({
      name: user.name,
      email: user.email,
      image: user.image,
      preferences: user.preferences || {},
      onboardingCompleted: user.onboardingCompleted ?? false,
      memberSince: user.createdAt,
    });
  } catch (error) {
    console.error("[PROFILE GET ERROR]", error);
    return NextResponse.json({ message: "Failed to fetch profile" }, { status: 500 });
  }
}

/**
 * PATCH /api/profile
 * Body: { city?, skinTone?, skinToneImageUrl? }
 * Updates user profile fields.
 */
export async function PATCH(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorised" }, { status: 401 });

    const body = await request.json();
    await connectDB();

    const updateFields = {};
    if (body.city !== undefined)                updateFields["preferences.city"] = body.city.trim();
    if (body.skinTone !== undefined)            updateFields["preferences.skinTone"] = body.skinTone;
    if (body.skinToneImageUrl !== undefined)    updateFields["preferences.skinToneImageUrl"] = body.skinToneImageUrl;
    if (body.commonOccasions !== undefined)     updateFields["preferences.commonOccasions"] = body.commonOccasions;
    if (body.onboardingCompleted !== undefined) updateFields["onboardingCompleted"] = body.onboardingCompleted;

    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json({ message: "Nothing to update" }, { status: 400 });
    }

    const user = await User.findByIdAndUpdate(
      session.user.id,
      { $set: updateFields },
      { new: true }
    ).select("preferences").lean();

    return NextResponse.json({ preferences: user.preferences });
  } catch (error) {
    console.error("[PROFILE PATCH ERROR]", error);
    return NextResponse.json({ message: "Failed to update profile" }, { status: 500 });
  }
}
