export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { google } from "googleapis";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXTAUTH_URL}/api/google-calendar/callback`
);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/calendar?error=access_denied`);
    }

    if (!code) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/calendar?error=no_code`);
    }

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/login`);
    }

    const { tokens } = await oauth2Client.getToken(code);

    await connectDB();
    await User.findByIdAndUpdate(session.user.id, {
      googleTokens: {
        refreshToken: tokens.refresh_token,
        accessToken: tokens.access_token,
        expiryDate: tokens.expiry_date,
      },
    });

    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/calendar?connected=1`);
  } catch (error) {
    console.error("[GOOGLE CALENDAR CALLBACK ERROR]", error);
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/calendar?error=callback_failed`);
  }
}
