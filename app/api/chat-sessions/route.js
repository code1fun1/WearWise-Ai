export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectDB } from "@/lib/mongodb";
import ChatSession from "@/models/ChatSession";

// GET  /api/chat-sessions  — list all sessions (no messages, just metadata)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorised" }, { status: 401 });

  await connectDB();
  const sessions = await ChatSession.find({ userId: session.user.id })
    .select("_id title updatedAt")
    .sort({ updatedAt: -1 })
    .limit(50)
    .lean();

  return NextResponse.json({ sessions });
}

// POST /api/chat-sessions  — create new session
export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorised" }, { status: 401 });

  await connectDB();
  const { title, messages } = await request.json();

  const doc = await ChatSession.create({
    userId: session.user.id,
    title: title || "New Chat",
    messages: messages || [],
  });

  return NextResponse.json({ session: doc }, { status: 201 });
}
