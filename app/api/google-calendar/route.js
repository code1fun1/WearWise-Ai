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
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorised" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    await connectDB();
    const user = await User.findById(session.user.id);

    // Handle disconnect
    if (action === "disconnect") {
      user.googleTokens = undefined;
      await user.save();
      return NextResponse.json({ message: "Disconnected from Google Calendar" });
    }

    // Return auth URL for new connection
    if (!user?.googleTokens?.refreshToken) {
      const authUrl = oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: ["https://www.googleapis.com/auth/calendar.readonly"],
        prompt: "consent",
        state: session.user.id,
      });
      return NextResponse.json({ authUrl, connected: false });
    }

    // Fetch calendar events
    oauth2Client.setCredentials({
      refresh_token: user.googleTokens.refreshToken,
    });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });
    
    const now = new Date();
    const timeMin = now.toISOString();
    const timeMax = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString();

    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin,
      timeMax,
      maxResults: 20,
      singleEvents: true,
      orderBy: "startTime",
    });

    const events = (response.data.items || []).map((event) => ({
      id: event.id,
      title: event.summary || "Untitled Event",
      date: event.start?.dateTime?.split("T")[0] || event.start?.date,
      time: event.start?.dateTime?.split("T")[1]?.substring(0, 5) || null,
      endTime: event.end?.dateTime?.split("T")[1]?.substring(0, 5) || null,
      description: event.description,
      location: event.location,
      occasion: mapEventToOccasion(event.summary || "", event.description || ""),
    }));

    return NextResponse.json({ events, connected: true });
  } catch (error) {
    console.error("[GOOGLE CALENDAR ERROR]", error);
    return NextResponse.json({ message: "Failed to fetch calendar events", error: error.message }, { status: 500 });
  }
}

function mapEventToOccasion(title, description) {
  const text = `${title} ${description}`.toLowerCase();
  
  if (text.match(/\b(interview|meeting|work|office|conference|business)\b/)) return "office";
  if (text.match(/\b(wedding|reception|haldi|mehndi|sangeet)\b/)) return "wedding";
  if (text.match(/\b(party|celebration|birthday|anniversary|festival)\b/)) return "party";
  if (text.match(/\b(date|dinner|movie)\b/)) return "date";
  if (text.match(/\b(gym|workout|exercise|training)\b/)) return "gym";
  if (text.match(/\b(beach|pool|swim)\b/)) return "beach";
  if (text.match(/\b(wedding|formal|black-tie|ceremony)\b/)) return "formal";
  
  return "casual";
}