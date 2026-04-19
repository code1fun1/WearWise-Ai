export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/wardrobe/:path*",
    "/outfits/:path*",
    "/profile/:path*",
    "/chat/:path*",
    "/sustainability/:path*",
    "/packing/:path*",
    "/calendar/:path*",
    "/capsule/:path*",
    "/api/wardrobe/:path*",
    "/api/upload-clothing/:path*",
    "/api/generate-outfit/:path*",
    "/api/outfit-of-the-day/:path*",
    "/api/feedback/:path*",
    "/api/profile/:path*",
    "/api/chat-stylist/:path*",
    "/api/sustainability/:path*",
    "/api/packing/:path*",
    "/api/capsule/:path*",
    "/api/outfit-plan/:path*",
    "/api/skin-tone/:path*",
  ],
};
