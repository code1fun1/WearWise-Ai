import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { analyzeSkinTone } from "@/services/geminiService";
import { uploadImage } from "@/services/cloudinaryService";

/**
 * POST /api/skin-tone
 * Multipart: image file
 * Analyzes skin tone and saves result to user profile.
 */
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorised" }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get("image");

    if (!file || typeof file === "string") {
      return NextResponse.json({ message: "No image provided" }, { status: 400 });
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ message: "Only JPEG, PNG, WEBP supported" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    // Run analysis and upload in parallel
    const [analysisResult, uploadResult] = await Promise.all([
      analyzeSkinTone(base64, file.type).catch(() => ({
        undertone: "neutral",
        description: "Could not analyze — using neutral as default",
        bestColors: ["navy", "white", "grey", "black", "beige"],
        colorsToAvoid: [],
        seasonPalette: "Summer",
      })),
      uploadImage(base64, file.type, "skin-tone").catch(() => null),
    ]);

    await connectDB();
    await User.findByIdAndUpdate(session.user.id, {
      $set: {
        "preferences.skinTone": analysisResult.undertone,
        "preferences.skinToneImageUrl": uploadResult?.url || "",
      },
    });

    return NextResponse.json({ analysis: analysisResult });
  } catch (error) {
    console.error("[SKIN TONE ERROR]", error);
    return NextResponse.json({ message: "Failed to analyze skin tone" }, { status: 500 });
  }
}
