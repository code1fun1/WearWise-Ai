"use client";

import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import {
  Sparkles,
  Shirt,
  Brain,
  CloudSun,
  Wand2,
  CalendarDays,
  Leaf,
  MessageCircle,
  ShoppingBag,
  Backpack,
  ArrowRight,
  CheckCircle2,
  Star,
  Zap,
} from "lucide-react";

// ── Data ─────────────────────────────────────────────────────────

const features = [
  {
    icon: <Shirt className="w-6 h-6 text-purple-500" />,
    bg: "bg-purple-50",
    title: "Smart Wardrobe",
    desc: "Upload your clothes and AI auto-tags them by type, color, style and occasion.",
  },
  {
    icon: <Sparkles className="w-6 h-6 text-pink-500" />,
    bg: "bg-pink-50",
    title: "AI Outfit Generator",
    desc: "Get 3 curated outfit suggestions tailored to your occasion, style and weather.",
  },
  {
    icon: <Brain className="w-6 h-6 text-blue-500" />,
    bg: "bg-blue-50",
    title: "Style Learning",
    desc: "The AI learns from your choices — the more you use it, the better it gets.",
  },
  {
    icon: <CloudSun className="w-6 h-6 text-yellow-500" />,
    bg: "bg-yellow-50",
    title: "Weather-Aware",
    desc: "Outfits are adjusted for today's weather so you're always dressed right.",
  },
  {
    icon: <CalendarDays className="w-6 h-6 text-green-500" />,
    bg: "bg-green-50",
    title: "Outfit Calendar",
    desc: "Plan your week ahead. Never repeat an outfit without meaning to.",
  },
  {
    icon: <Leaf className="w-6 h-6 text-emerald-500" />,
    bg: "bg-emerald-50",
    title: "Sustainability Score",
    desc: "Track cost-per-wear, utilization and the eco impact of your wardrobe.",
  },
  {
    icon: <MessageCircle className="w-6 h-6 text-cyan-500" />,
    bg: "bg-cyan-50",
    title: "AI Style Chat",
    desc: "Ask your personal stylist anything — it knows your wardrobe inside out.",
  },
  {
    icon: <Backpack className="w-6 h-6 text-orange-500" />,
    bg: "bg-orange-50",
    title: "Smart Packing",
    desc: "Generate a perfect packing list for any trip with one click.",
  },
];

const steps = [
  {
    num: "01",
    title: "Upload Your Clothes",
    desc: "Take photos of your wardrobe. Our AI automatically identifies type, color, style and occasion for every piece.",
    color: "text-purple-600",
    border: "border-purple-200",
    bg: "bg-purple-50",
  },
  {
    num: "02",
    title: "Tell Us Your Occasion",
    desc: "Heading to the office? A party? The gym? Select your occasion and city — we'll check the weather for you.",
    color: "text-pink-600",
    border: "border-pink-200",
    bg: "bg-pink-50",
  },
  {
    num: "03",
    title: "Get Curated Outfits",
    desc: "Receive 3 AI-curated outfit combinations from your own wardrobe, styled just for you.",
    color: "text-blue-600",
    border: "border-blue-200",
    bg: "bg-blue-50",
  },
  {
    num: "04",
    title: "Your Style Evolves",
    desc: "Pick your favourite outfit and the AI learns your taste — getting smarter with every choice.",
    color: "text-emerald-600",
    border: "border-emerald-200",
    bg: "bg-emerald-50",
  },
];

const stats = [
  { value: "3 sec", label: "Outfit generation", icon: <Zap className="w-5 h-5 text-yellow-500" /> },
  { value: "8+", label: "AI-powered features", icon: <Sparkles className="w-5 h-5 text-purple-500" /> },
  { value: "100%", label: "From your own wardrobe", icon: <Shirt className="w-5 h-5 text-pink-500" /> },
  { value: "Free", label: "To get started", icon: <Star className="w-5 h-5 text-emerald-500" /> },
];

const testimonials = [
  {
    name: "Priya S.",
    role: "Working professional",
    text: "I used to spend 20 minutes every morning deciding what to wear. Now WearWize picks a perfect outfit in seconds — and it actually knows my style.",
    avatar: "P",
    color: "bg-purple-100 text-purple-700",
  },
  {
    name: "Rahul M.",
    role: "College student",
    text: "The packing list feature alone is worth it. Planned a 5-day trip and it picked exactly the right pieces from my wardrobe.",
    avatar: "R",
    color: "bg-blue-100 text-blue-700",
  },
  {
    name: "Anjali K.",
    role: "Fashion enthusiast",
    text: "The sustainability score made me realise 40% of my wardrobe was never worn. Donated half and now every piece gets used.",
    avatar: "A",
    color: "bg-pink-100 text-pink-700",
  },
];

// ── Animation helpers ─────────────────────────────────────────────

function FadeIn({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────

export default function LandingPage() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) router.push("/dashboard");
  }, [session, router]);

  return (
    <main className="min-h-screen bg-white overflow-x-hidden">

      {/* ── Navbar ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-gray-100">
        <nav className="flex items-center justify-between px-6 sm:px-10 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">WearWize</span>
          </div>
          <div className="hidden sm:flex items-center gap-6 text-sm text-gray-500">
            <a href="#features" className="hover:text-purple-600 transition">Features</a>
            <a href="#how-it-works" className="hover:text-purple-600 transition">How it works</a>
            <a href="#testimonials" className="hover:text-purple-600 transition">Reviews</a>
          </div>
          <div className="flex gap-2">
            <Link
              href="/auth/signin"
              className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="px-4 py-2 text-sm text-white bg-gradient-to-r from-purple-600 to-pink-500 rounded-lg hover:opacity-90 transition shadow-sm"
            >
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-purple-50 via-pink-50/40 to-white pt-20 pb-28 px-6">
        {/* Decorative blobs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-purple-200/40 blur-3xl pointer-events-none" />
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-pink-200/40 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-32 bg-gradient-to-t from-white to-transparent pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 mb-8 text-xs font-semibold tracking-widest text-purple-700 bg-purple-100 rounded-full uppercase">
              <Zap className="w-3 h-3" />
              Powered by Google Gemini AI
            </span>

            <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-gray-900 leading-[1.08] mb-6 tracking-tight">
              Your wardrobe,{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-500 to-rose-400">
                styled by AI
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
              Upload your clothes once. Get AI-curated outfits every day — tailored to
              your occasion, weather, and personal taste.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <Link
                href="/auth/signup"
                className="group flex items-center gap-2 px-8 py-3.5 text-white bg-gradient-to-r from-purple-600 to-pink-500 rounded-xl font-semibold text-sm hover:opacity-90 shadow-lg shadow-purple-200/60 transition"
              >
                Start Styling Free
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <a
                href="#how-it-works"
                className="flex items-center gap-2 px-8 py-3.5 text-gray-600 bg-white border border-gray-200 rounded-xl font-semibold text-sm hover:bg-gray-50 transition"
              >
                See How It Works
              </a>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-5 mt-10 text-xs text-gray-400">
              {["No credit card required", "Free forever plan", "Works with any wardrobe size"].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                  {t}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Hero mockup card strip */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="mt-16 flex items-center justify-center gap-3 flex-wrap"
          >
            {[
              { label: "Outfit of the Day", icon: <Sparkles className="w-4 h-4 text-purple-500" />, sub: "casual · 28°C Mumbai", chip: "Today", chipColor: "bg-purple-100 text-purple-700" },
              { label: "Style Chat", icon: <MessageCircle className="w-4 h-4 text-blue-500" />, sub: "Ask me anything about your wardrobe", chip: "AI", chipColor: "bg-blue-100 text-blue-700" },
              { label: "Capsule Analysis", icon: <Leaf className="w-4 h-4 text-emerald-500" />, sub: "78% wardrobe utilization", chip: "New", chipColor: "bg-emerald-100 text-emerald-700" },
            ].map((card, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-gray-100 shadow-md p-4 w-52 text-left"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center">
                    {card.icon}
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${card.chipColor}`}>
                    {card.chip}
                  </span>
                </div>
                <p className="text-sm font-semibold text-gray-800 mb-0.5">{card.label}</p>
                <p className="text-xs text-gray-400 leading-snug">{card.sub}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Stats ──────────────────────────────────────────────── */}
      <section className="bg-gradient-to-r from-purple-600 to-pink-500 py-12 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6">
          {stats.map((s, i) => (
            <FadeIn key={i} delay={i * 0.08}>
              <div className="text-center text-white">
                <div className="flex justify-center mb-2 opacity-80">{s.icon}</div>
                <p className="text-3xl font-extrabold">{s.value}</p>
                <p className="text-sm text-purple-100 mt-1">{s.label}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────── */}
      <section id="features" className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-14">
            <span className="text-xs font-semibold tracking-widest text-purple-600 uppercase">Everything you need</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mt-3 mb-4">
              A complete AI styling toolkit
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto text-sm leading-relaxed">
              From uploading your first piece to planning a week of outfits — every feature
              is designed around your real wardrobe.
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f, i) => (
              <FadeIn key={i} delay={i * 0.06}>
                <div className="group bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                  <div className={`w-10 h-10 rounded-xl ${f.bg} flex items-center justify-center mb-4`}>
                    {f.icon}
                  </div>
                  <h3 className="font-bold text-gray-800 mb-1.5 text-sm">{f.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ───────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <FadeIn className="text-center mb-14">
            <span className="text-xs font-semibold tracking-widest text-purple-600 uppercase">Simple process</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mt-3 mb-4">
              How WearWize works
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto text-sm leading-relaxed">
              Four simple steps from uploading your wardrobe to getting dressed effortlessly every day.
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {steps.map((s, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <div className={`relative bg-white rounded-2xl border ${s.border} p-6 shadow-sm overflow-hidden`}>
                  <div className={`absolute -top-4 -right-4 text-8xl font-extrabold ${s.color} opacity-[0.06] select-none pointer-events-none`}>
                    {s.num}
                  </div>
                  <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${s.bg} mb-4`}>
                    <span className={`text-sm font-extrabold ${s.color}`}>{s.num}</span>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{s.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ───────────────────────────────────────── */}
      <section id="testimonials" className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <FadeIn className="text-center mb-14">
            <span className="text-xs font-semibold tracking-widest text-purple-600 uppercase">Loved by users</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mt-3">
              Real people, real style
            </h2>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {testimonials.map((t, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed flex-1">&ldquo;{t.text}&rdquo;</p>
                  <div className="flex items-center gap-3 pt-2 border-t border-gray-50">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${t.color}`}>
                      {t.avatar}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{t.name}</p>
                      <p className="text-xs text-gray-400">{t.role}</p>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-gradient-to-br from-purple-600 via-purple-600 to-pink-500 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.12),_transparent_60%)] pointer-events-none" />
        <div className="max-w-3xl mx-auto text-center relative">
          <FadeIn>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white mb-5 leading-tight">
              Stop staring at your wardrobe.<br />Let AI dress you.
            </h2>
            <p className="text-purple-100 mb-10 text-sm sm:text-base leading-relaxed max-w-xl mx-auto">
              Join thousands of users who have simplified their morning routine
              with WearWize — your personal AI stylist that knows your wardrobe
              better than you do.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/auth/signup"
                className="group inline-flex items-center gap-2 px-8 py-3.5 bg-white text-purple-700 rounded-xl font-bold text-sm hover:bg-purple-50 transition shadow-lg"
              >
                Get Started — It&apos;s Free
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                href="/auth/signin"
                className="inline-flex items-center gap-2 px-8 py-3.5 text-white border border-white/30 rounded-xl font-semibold text-sm hover:bg-white/10 transition"
              >
                Already have an account?
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="bg-gray-900 text-gray-400 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-white text-sm">WearWize</span>
          </div>
          <p className="text-xs text-center">
            © {new Date().getFullYear()} WearWize. All rights reserved. Powered by Google Gemini AI.
          </p>
          <div className="flex items-center gap-5 text-xs">
            <a href="#features" className="hover:text-white transition">Features</a>
            <a href="#how-it-works" className="hover:text-white transition">How it works</a>
            <Link href="/auth/signup" className="hover:text-white transition">Sign Up</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
