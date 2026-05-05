"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Sparkles,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Shirt,
  Brain,
  CloudSun,
} from "lucide-react";
import { toast } from "react-toastify";
import ParticleHeadline from "@/components/landing/ParticleHeadline";

const perks = [
  { icon: <Sparkles className="w-4 h-4" />, text: "AI-curated outfits from your wardrobe" },
  { icon: <Brain className="w-4 h-4" />, text: "Style learning that gets smarter daily" },
  { icon: <CloudSun className="w-4 h-4" />, text: "Weather-aware outfit suggestions" },
  { icon: <Shirt className="w-4 h-4" />, text: "Smart capsule & packing lists" },
];

export default function SignInPage() {
  return (
    <Suspense>
      <SignInInner />
    </Suspense>
  );
}

function SignInInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const errorMessages = {
    CredentialsSignin: "Invalid email or password.",
    OAuthAccountNotLinked: "This email is registered with a different provider.",
    default: "Something went wrong. Please try again.",
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    const result = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });
    setLoading(false);
    if (result?.error) {
      toast.error(errorMessages[result.error] ?? errorMessages.default);
    } else {
      toast.success("Welcome back!");
      router.push("/dashboard");
      router.refresh();
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    await signIn("google", { callbackUrl: "/dashboard" });
  }

  return (
    <div className="min-h-screen flex">

      {/* ── Left branding panel (hidden on mobile) ───────────────── */}
      <div className="hidden lg:flex lg:w-[46%] bg-gradient-to-br from-purple-700 via-purple-600 to-pink-500 flex-col justify-between p-12 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white">WearWize</span>
        </div>

        {/* Center content */}
        <div className="relative">
          <ParticleHeadline line1="Start dressing" line2="smarter today" height={180} allWhite line2Scale={0.65} />
          <p className="text-purple-100 text-sm leading-relaxed mb-10 max-w-xs mt-4">
            Upload your clothes once. Get a perfect outfit every day — tailored to
            your occasion, the weather, and your personal taste.
          </p>
          <div className="space-y-3">
            {perks.map((p, i) => (
              <div key={i} className="flex items-center gap-3 text-white/80 text-sm">
                <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                  {p.icon}
                </div>
                {p.text}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <p className="relative text-purple-200 text-xs">
          © {new Date().getFullYear()} WearWize. Powered by Google Gemini AI.
        </p>
      </div>

      {/* ── Right form panel ─────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900">WearWize</span>
          </div>

          <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Welcome back</h1>
          <p className="text-sm text-gray-400 mb-8">
            Don&apos;t have an account?{" "}
            <Link href="/auth/signup" className="text-purple-600 font-semibold hover:underline">
              Sign up free
            </Link>
          </p>

          {/* URL error */}
          {urlError && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">
              {errorMessages[urlError] ?? errorMessages.default}
            </div>
          )}

          {/* Google */}
          <button
            onClick={handleGoogle}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl border-2 border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition disabled:opacity-60 mb-5"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {googleLoading ? "Redirecting…" : "Continue with Google"}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium">or sign in with email</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-0 transition"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Your password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  className="w-full pl-10 pr-10 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-0 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold text-sm hover:opacity-90 transition disabled:opacity-60 shadow-md shadow-purple-200 mt-2"
            >
              {loading ? (
                "Signing in…"
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
