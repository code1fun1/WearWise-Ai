export { default } from "next-auth/middleware";

/**
 * Protect these routes — NextAuth will redirect unauthenticated
 * users to /auth/signin automatically.
 */
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/wardrobe/:path*",
    "/outfits/:path*",
    "/profile/:path*",
    "/api/wardrobe/:path*",
    "/api/upload-clothing/:path*",
    "/api/generate-outfit/:path*",
    "/api/outfit-of-the-day/:path*",
    "/api/feedback/:path*",
  ],
};
