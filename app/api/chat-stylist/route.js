import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectDB } from "@/lib/mongodb";
import ClothingItem from "@/models/ClothingItem";
import User from "@/models/User";
import { getWeather } from "@/services/weatherService";
import { chatWithStylist } from "@/services/geminiService";
import { rateLimit, rateLimitResponse, LIMITS } from "@/lib/rateLimit";

/**
 * POST /api/chat-stylist
 * Body: { messages: [{role: "user"|"assistant", content: string}] }
 *
 * Conversational AI stylist that knows your wardrobe.
 */
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorised" }, { status: 401 });

    const rl = rateLimit(session.user.id, "chat-stylist", LIMITS["chat-stylist"]);
    if (!rl.allowed) return rateLimitResponse(NextResponse, rl, "Style Chat messages");

    const { messages } = await request.json();
    if (!messages?.length) {
      return NextResponse.json({ message: "Messages required" }, { status: 400 });
    }

    await connectDB();

    const [wardrobeItems, user] = await Promise.all([
      ClothingItem.find({ userId: session.user.id, inLaundry: false }).lean(),
      User.findById(session.user.id).select("preferences").lean(),
    ]);

    const city = user?.preferences?.city || "Mumbai";
    const weather = await getWeather(city).catch(() => null);

    // Fallback if Gemini unavailable
    const reply = await chatWithStylist({
      messages,
      wardrobe: wardrobeItems,
      weather,
      preferences: user?.preferences || {},
    }).catch(() =>
      "I'm having trouble connecting right now. Please try again in a moment!"
    );

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("[CHAT STYLIST ERROR]", error);
    return NextResponse.json({ message: "Failed to get AI response" }, { status: 500 });
  }
}
