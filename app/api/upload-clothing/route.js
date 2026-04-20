import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectDB } from "@/lib/mongodb";
import ClothingItem from "@/models/ClothingItem";
import { uploadImage } from "@/services/cloudinaryService";
import { tagClothingImage } from "@/services/geminiService";
import { rateLimit, rateLimitResponse, LIMITS } from "@/lib/rateLimit";

/**
 * POST /api/upload-clothing
 * Content-Type: multipart/form-data
 * Fields: image (File), customName? (string), notes? (string)
 *
 * Flow:
 *  1. Validate session
 *  2. Parse multipart form — extract image bytes
 *  3. Upload to Cloudinary  ─┐ run in parallel
 *  4. Tag via Gemini Vision  ─┘
 *  5. Save ClothingItem to MongoDB
 *  6. Return saved item
 */
export async function POST(request) {
  try {
    // ── Auth ────────────────────────────────────────────────────
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorised" }, { status: 401 });

    const rl = rateLimit(session.user.id, "upload-clothing", LIMITS["upload-clothing"]);
    if (!rl.allowed) return rateLimitResponse(NextResponse, rl, "clothing uploads");

    // ── Parse form data ─────────────────────────────────────────
    const formData = await request.formData();
    const file = formData.get("image");
    const customName = formData.get("customName") || "";
    const notes = formData.get("notes") || "";

    if (!file || typeof file === "string") {
      return NextResponse.json(
        { message: "No image file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { message: "Only JPEG, PNG, WEBP and GIF images are supported" },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { message: "Image must be smaller than 10MB" },
        { status: 400 }
      );
    }

    // Convert to base64 — needed by both Cloudinary and Gemini
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    // ── Step 3 & 4: Upload + Tag in parallel ────────────────────
    const [cloudinaryResult, aiTagsRaw] = await Promise.all([
      uploadImage(base64, file.type, "wardrobe"),
      tagClothingImage(base64, file.type).catch((err) => {
        // Fallback tags if Gemini is unavailable (quota / key issue)
        console.warn("[GEMINI FALLBACK] Using default tags:", err.message);
        return {
          type: customName || "clothing",
          color: "unknown",
          pattern: "solid",
          style: "casual",
          occasion: ["casual"],
          season: "all",
          _fallback: true,
        };
      }),
    ]);
    const aiTags = aiTagsRaw;

    // ── Step 5: Save to MongoDB ──────────────────────────────────
    await connectDB();

    const clothingItem = await ClothingItem.create({
      userId: session.user.id,
      imageUrl: cloudinaryResult.url,
      cloudinaryId: cloudinaryResult.publicId,
      type: aiTags.type,
      color: aiTags.color,
      pattern: aiTags.pattern || "solid",
      style: aiTags.style || "casual",
      occasion: Array.isArray(aiTags.occasion) ? aiTags.occasion : [],
      season: aiTags.season || "all",
      customName,
      notes,
    });

    return NextResponse.json(
      {
        message: "Clothing item added successfully",
        item: clothingItem,
        tags: aiTags,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[UPLOAD CLOTHING ERROR]", error);
    return NextResponse.json(
      { message: error.message || "Failed to process clothing item" },
      { status: 500 }
    );
  }
}
