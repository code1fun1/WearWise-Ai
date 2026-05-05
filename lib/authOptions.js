import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

/**
 * Centralised NextAuth config exported from lib/ so it can be
 * imported by both the API route and any server component that
 * needs getServerSession().
 */
export const authOptions = {
  providers: [
    // ── Google OAuth ──────────────────────────────────────────
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/callback/google`,
        },
      },
    }),

    // ── Email / Password ──────────────────────────────────────
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        await connectDB();

        const user = await User.findOne({ email: credentials.email });
        if (!user) throw new Error("No account found with that email");
        if (!user.password)
          throw new Error("This account uses Google sign-in. Please use Google.");

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) throw new Error("Incorrect password");

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
  ],

  // ── Callbacks ────────────────────────────────────────────────
  callbacks: {
    /**
     * Runs on every sign-in.
     * For Google, create the user in MongoDB on first login.
     */
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        await connectDB();
        const existing = await User.findOne({ email: user.email });
        if (!existing) {
          await User.create({
            name: user.name,
            email: user.email,
            image: user.image,
          });
        }
      }
      return true;
    },

    /**
     * Attach the MongoDB _id to the JWT token so we can use it
     * in API routes without a second DB query.
     */
    async jwt({ token, user }) {
      if (user) {
        // user object is available only on initial sign-in
        await connectDB();
        const dbUser = await User.findOne({ email: token.email });
        if (dbUser) token.id = dbUser._id.toString();
      }
      return token;
    },

    /**
     * Expose token.id on the client-side session object.
     */
    async session({ session, token }) {
      if (token?.id) session.user.id = token.id;
      return session;
    },
  },

  // ── Pages ────────────────────────────────────────────────────
  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin",  // Errors redirect back to sign-in with ?error=
  },

  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
};
