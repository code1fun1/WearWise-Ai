import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectDB } from "@/lib/mongodb";
import ClothingItem from "@/models/ClothingItem";
import { generateCapsuleAnalysis } from "@/services/geminiService";
import { rateLimit, rateLimitResponse, LIMITS } from "@/lib/rateLimit";

/**
 * GET /api/capsule
 * Returns AI-powered capsule wardrobe analysis.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorised" }, { status: 401 });

    const rl = rateLimit(session.user.id, "capsule", LIMITS["capsule"]);
    if (!rl.allowed) return rateLimitResponse(NextResponse, rl, "Capsule Analysis");

    await connectDB();

    const wardrobe = await ClothingItem.find({ userId: session.user.id }).lean();

    if (wardrobe.length < 5) {
      return NextResponse.json(
        { message: "Add at least 5 clothing items to get a Capsule Wardrobe Analysis." },
        { status: 400 }
      );
    }

    const analysis = await generateCapsuleAnalysis(wardrobe).catch(() =>
      buildFallbackAnalysis(wardrobe)
    );

    // Resolve capsule item IDs to full objects
    const itemMap = {};
    wardrobe.forEach((i) => { itemMap[i._id.toString()] = i; });

    const capsuleItems = (analysis.capsuleItems || [])
      .map((id) => itemMap[id])
      .filter(Boolean);

    const deadItems = (analysis.deadItems || [])
      .map((id) => itemMap[id])
      .filter(Boolean);

    return NextResponse.json({
      ...analysis,
      capsuleItems,
      deadItems,
      totalWardrobeItems: wardrobe.length,
    });
  } catch (error) {
    console.error("[CAPSULE ERROR]", error);
    return NextResponse.json({ message: "Failed to analyze wardrobe" }, { status: 500 });
  }
}

function buildFallbackAnalysis(wardrobe) {
  const topItems = [...wardrobe].sort((a, b) => (b.wearCount || 0) - (a.wearCount || 0));
  const capsule = topItems.slice(0, Math.min(10, wardrobe.length));
  const dead = wardrobe.filter((i) => (i.wearCount || 0) === 0);

  return {
    utilizationScore: Math.round((capsule.length / wardrobe.length) * 100),
    wardrobePersonality: "Versatile Dresser",
    styleBreakdown: { casual: 60, formal: 20, ethnic: 10, sporty: 5, other: 5 },
    capsuleItems: capsule.map((i) => i._id.toString()),
    capsuleReasoning: "These are your most-worn items that form the core of your wardrobe.",
    deadItems: dead.map((i) => i._id.toString()),
    missingPieces: [{ type: "blazer", reason: "Bridges casual and formal outfits" }],
    insights: [
      "Focus on versatile, mix-and-match pieces",
      "Consider donating unworn items",
      "Invest in quality basics that work across occasions",
    ],
    outfitCombinations: Math.floor(capsule.length * 1.5),
  };
}
