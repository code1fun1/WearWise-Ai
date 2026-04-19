"use client";

import { SessionProvider } from "next-auth/react";

// Wraps the app in NextAuth's SessionProvider so any component
// can call useSession() to get the current user.
export default function AuthProvider({ children }) {
  return <SessionProvider>{children}</SessionProvider>;
}
