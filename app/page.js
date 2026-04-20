"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Sparkles, Shirt, Brain, CloudSun } from "lucide-react";

const features = [
  {
    icon: <Shirt className="w-7 h-7 text-purple-500" />,
    title: "Smart Wardrobe",
    desc: "Upload your clothes and let AI tag them automatically by type, color, style and occasion.",
  },
  {
    icon: <Sparkles className="w-7 h-7 text-pink-500" />,
    title: "AI Outfit Generator",
    desc: "Get 3 curated outfit suggestions tailored to your occasion, style and weather.",
  },
  {
    icon: <Brain className="w-7 h-7 text-blue-500" />,
    title: "Style Learning",
    desc: "The more you use it, the better it knows your taste. It learns from your choices.",
  },
  {
    icon: <CloudSun className="w-7 h-7 text-yellow-500" />,
    title: "Weather-Aware",
    desc: "Outfits are adjusted for today's weather so you're always dressed right.",
  },
];

export default function LandingPage() {
  const { data: session } = useSession();
  const router = useRouter();

  // Redirect logged-in users straight to the dashboard
  useEffect(() => {
    if (session) router.push("/dashboard");
  }, [session, router]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-purple-600" />
          <span className="text-xl font-bold text-purple-700">
            WearWize
          </span>
        </div>
        <div className="flex gap-3">
          <Link
            href="/auth/signin"
            className="px-4 py-2 text-sm text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-50 transition"
          >
            Sign In
          </Link>
          <Link
            href="/auth/signup"
            className="px-4 py-2 text-sm text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center text-center px-6 pt-20 pb-16 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block px-4 py-1 mb-6 text-xs font-semibold tracking-widest text-purple-600 bg-purple-100 rounded-full uppercase">
            Powered by AI
          </span>
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
            Your Personal{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500">
              AI Stylist
            </span>
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-10">
            Upload your clothes, tell us the occasion, and get AI-curated
            outfits that match your style, the weather, and your mood — every
            single day.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/auth/signup"
              className="px-8 py-3 text-white bg-purple-600 rounded-xl font-semibold hover:bg-purple-700 shadow-lg shadow-purple-200 transition"
            >
              Start Styling Free
            </Link>
            <Link
              href="#features"
              className="px-8 py-3 text-gray-700 bg-white border border-gray-200 rounded-xl font-semibold hover:bg-gray-50 transition"
            >
              See How It Works
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="max-w-6xl mx-auto px-6 pb-24 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {features.map((f, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i + 0.4 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition"
          >
            <div className="mb-4">{f.icon}</div>
            <h3 className="font-bold text-gray-800 mb-2">{f.title}</h3>
            <p className="text-sm text-gray-500">{f.desc}</p>
          </motion.div>
        ))}
      </section>

      {/* Footer */}
      <footer className="text-center py-6 text-sm text-gray-400 border-t border-gray-100">
        © {new Date().getFullYear()} WearWize. All rights reserved.
      </footer>
    </main>
  );
}
