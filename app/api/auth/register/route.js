export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

/**
 * POST /api/auth/register
 * Body: { name, email, password }
 *
 * Creates a new user with a hashed password.
 * Returns 201 on success, 400/409/500 on failure.
 */
export async function POST(request) {
  try {
    const { name, email, password } = await request.json();

    // ── Validation ────────────────────────────────────────────
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Name, email and password are all required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: "Please provide a valid email address" },
        { status: 400 }
      );
    }

    // ── DB check ─────────────────────────────────────────────
    await connectDB();

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json(
        { message: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // ── Create user ──────────────────────────────────────────
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase(),
      password: hashedPassword,
    });

    return NextResponse.json(
      {
        message: "Account created successfully",
        user: { id: user._id, name: user.name, email: user.email },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[REGISTER ERROR]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
