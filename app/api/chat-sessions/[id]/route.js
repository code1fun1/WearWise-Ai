import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectDB } from "@/lib/mongodb";
import ChatSession from "@/models/ChatSession";

async function getOwned(id, userId) {
  return ChatSession.findOne({ _id: id, userId });
}

// GET /api/chat-sessions/[id]  — full session with messages
export async function GET(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorised" }, { status: 401 });

  await connectDB();
  const doc = await getOwned(params.id, session.user.id);
  if (!doc) return NextResponse.json({ message: "Not found" }, { status: 404 });

  return NextResponse.json({ session: doc });
}

// PATCH /api/chat-sessions/[id]  — update messages (and optionally title)
export async function PATCH(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorised" }, { status: 401 });

  await connectDB();
  const { messages, title } = await request.json();

  const update = {};
  if (messages !== undefined) update.messages = messages;
  if (title !== undefined) update.title = title;

  const doc = await ChatSession.findOneAndUpdate(
    { _id: params.id, userId: session.user.id },
    { $set: update },
    { new: true }
  );
  if (!doc) return NextResponse.json({ message: "Not found" }, { status: 404 });

  return NextResponse.json({ session: doc });
}

// DELETE /api/chat-sessions/[id]
export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorised" }, { status: 401 });

  await connectDB();
  await ChatSession.deleteOne({ _id: params.id, userId: session.user.id });

  return NextResponse.json({ success: true });
}
