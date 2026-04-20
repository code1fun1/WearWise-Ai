"use client";

import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  Sparkles, Shirt, Brain, CloudSun, CalendarDays, Leaf,
  MessageCircle, Backpack, ArrowRight, CheckCircle2, Star, Zap,
} from "lucide-react";
import ParticleHeadline from "@/components/landing/ParticleHeadline";

// ── Deterministic background data (no Math.random → no hydration mismatch) ──
const STARS = Array.from({ length: 160 }, (_, i) => ({
  x: ((i * 7919 + 31) % 1000) / 10,
  y: ((i * 6271 + 17) % 1000) / 10,
  r: (i * 3457 + 7) % 10 < 2 ? 1.5 : 1,
  o: 0.08 + (((i * 2311) % 100) / 100) * 0.35,
}));

const ORBS = [
  { x: "15%",  y: "8%",  w: 480, c: "rgba(124,58,237,0.16)" },
  { x: "72%",  y: "18%", w: 360, c: "rgba(236,72,153,0.11)" },
  { x: "5%",   y: "42%", w: 320, c: "rgba(139,92,246,0.12)" },
  { x: "82%",  y: "52%", w: 400, c: "rgba(236,72,153,0.09)" },
  { x: "42%",  y: "68%", w: 500, c: "rgba(124,58,237,0.13)" },
  { x: "10%",  y: "82%", w: 340, c: "rgba(167,139,250,0.10)" },
  { x: "76%",  y: "90%", w: 380, c: "rgba(236,72,153,0.10)" },
];

// ── Page data ─────────────────────────────────────────────────────
const FEATURES = [
  { icon: Shirt,         color: "text-purple-400", bg: "bg-purple-500/10",  title: "Smart Wardrobe",      desc: "Upload clothes once. AI auto-tags type, color, style and occasion instantly." },
  { icon: Sparkles,      color: "text-pink-400",   bg: "bg-pink-500/10",    title: "AI Outfit Generator", desc: "3 curated outfits from your wardrobe, matched to occasion and weather." },
  { icon: Brain,         color: "text-blue-400",   bg: "bg-blue-500/10",    title: "Style Learning",      desc: "Picks up your taste from every choice and keeps getting sharper." },
  { icon: CloudSun,      color: "text-yellow-400", bg: "bg-yellow-500/10",  title: "Weather-Aware",       desc: "Live weather data ensures you're always dressed for the day ahead." },
  { icon: CalendarDays,  color: "text-green-400",  bg: "bg-green-500/10",   title: "Outfit Calendar",     desc: "Plan the full week. Never accidentally repeat an outfit." },
  { icon: Leaf,          color: "text-emerald-400",bg: "bg-emerald-500/10", title: "Sustainability",      desc: "Track cost-per-wear and wardrobe utilisation with real numbers." },
  { icon: MessageCircle, color: "text-cyan-400",   bg: "bg-cyan-500/10",    title: "Style Chat",          desc: "Ask your AI stylist anything. It knows every item in your wardrobe." },
  { icon: Backpack,      color: "text-orange-400", bg: "bg-orange-500/10",  title: "Smart Packing",       desc: "One-click packing list for any trip, pulled from your real wardrobe." },
];

const STEPS = [
  { num: "01", color: "text-purple-400",  border: "rgba(167,139,250,0.65)", title: "Upload Your Clothes",   desc: "Photograph your wardrobe. AI tags every piece by type, color, style and occasion — instantly." },
  { num: "02", color: "text-pink-400",    border: "rgba(236,72,153,0.65)",  title: "Pick Your Occasion",    desc: "Office, party, gym? Select occasion and city — we check today's weather for you." },
  { num: "03", color: "text-blue-400",    border: "rgba(96,165,250,0.65)",  title: "Get 3 Curated Outfits", desc: "Receive three outfit combinations built entirely from your own wardrobe." },
  { num: "04", color: "text-emerald-400", border: "rgba(52,211,153,0.65)",  title: "Your Style Evolves",    desc: "Pick a favourite — the AI learns your taste and gets smarter with every choice." },
];

const STATS = [
  { value: "3 sec", label: "Outfit generation",      icon: <Zap        className="w-5 h-5 text-yellow-400" /> },
  { value: "8+",    label: "AI-powered features",    icon: <Sparkles   className="w-5 h-5 text-purple-400" /> },
  { value: "100%",  label: "From your own wardrobe", icon: <Shirt      className="w-5 h-5 text-pink-400"   /> },
  { value: "Free",  label: "To get started",         icon: <Star       className="w-5 h-5 text-emerald-400"/> },
];

const TESTIMONIALS = [
  { name: "Priya S.",  role: "Working professional", avatar: "P", grad: "from-purple-600 to-purple-800",
    text: "I used to spend 20 minutes every morning deciding what to wear. WearWize picks a perfect outfit in seconds — and it actually knows my style." },
  { name: "Rahul M.",  role: "College student",      avatar: "R", grad: "from-blue-600 to-blue-800",
    text: "The packing list feature alone is worth it. Planned a 5-day trip and it picked exactly the right pieces from my wardrobe." },
  { name: "Anjali K.", role: "Fashion enthusiast",   avatar: "A", grad: "from-pink-600 to-pink-800",
    text: "The sustainability score made me realise 40% of my wardrobe was never worn. Donated half and now every piece gets used." },
];

// ── Reusable components ───────────────────────────────────────────

// Spotlight glow card — border lights up where cursor is closest
function GlowCard({ children, clientPos, borderColor = "rgba(167,139,250,0.65)", innerBg = "bg-[#0d0a1a]", className = "" }) {
  const ref = useRef(null);
  const { rx, ry } = useMemo(() => {
    if (!ref.current) return { rx: -500, ry: -500 };
    const r = ref.current.getBoundingClientRect();
    return { rx: clientPos.x - r.left, ry: clientPos.y - r.top };
  }, [clientPos]);

  return (
    <div ref={ref} className={`relative rounded-2xl p-[1px] ${className}`}
      style={{
        background: `radial-gradient(240px circle at ${rx}px ${ry}px,
          ${borderColor},
          rgba(236,72,153,0.15) 45%,
          rgba(255,255,255,0.04) 70%)`,
      }}
    >
      <div className={`relative rounded-2xl ${innerBg} h-full overflow-hidden`}>
        <div className="absolute inset-0 pointer-events-none rounded-2xl"
          style={{ background: `radial-gradient(200px circle at ${rx}px ${ry}px, rgba(124,58,237,0.06), transparent 70%)` }}
        />
        {children}
      </div>
    </div>
  );
}

// Scroll-triggered fade-in
function FadeIn({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-70px" });
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Section label
function Label({ children }) {
  return (
    <span className="inline-block text-[11px] font-semibold tracking-[0.18em] text-purple-400/80 uppercase mb-4">
      {children}
    </span>
  );
}

// Thin section divider
function Divider() {
  return <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-20" />;
}

// ─────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  useEffect(() => { if (session) router.push("/dashboard"); }, [session, router]);

  // clientX/Y so spotlight works correctly while scrolling
  const [clientPos, setClientPos] = useState({ x: -999, y: -999 });
  const handleMouseMove = useCallback((e) => {
    setClientPos({ x: e.clientX, y: e.clientY });
  }, []);

  return (
    <main
      className="relative min-h-screen bg-[#07030f] overflow-x-hidden"
      onMouseMove={handleMouseMove}
    >
      {/* ── Global fixed spotlight ─────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-10"
        style={{
          background: `radial-gradient(700px circle at ${clientPos.x}px ${clientPos.y}px,
            rgba(124,58,237,0.09),
            rgba(236,72,153,0.04) 40%,
            transparent 65%)`,
        }}
      />

      {/* ── Fixed background layer: stars + orbs + dot grid ───── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.055) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
        {STARS.map((s, i) => (
          <div key={i} className="absolute rounded-full bg-white"
            style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.r, height: s.r, opacity: s.o }} />
        ))}
        {ORBS.map((o, i) => (
          <div key={i} className="absolute rounded-full"
            style={{
              left: o.x, top: o.y, width: o.w, height: o.w,
              background: `radial-gradient(circle, ${o.c} 0%, transparent 70%)`,
              filter: "blur(48px)", transform: "translate(-50%, -50%)",
            }}
          />
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════════
          NAVBAR
      ════════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#07030f]/80 backdrop-blur-xl">
        <nav className="flex items-center justify-between px-6 sm:px-10 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-900/50">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white">WearWize</span>
          </div>
          <div className="hidden sm:flex items-center gap-7 text-sm text-gray-400">
            <a href="#features"     className="hover:text-white transition">Features</a>
            <a href="#how-it-works" className="hover:text-white transition">How it works</a>
            <a href="#reviews"      className="hover:text-white transition">Reviews</a>
          </div>
          <div className="flex gap-2">
            <Link href="/auth/signin"
              className="px-4 py-2 text-sm text-gray-300 border border-white/10 rounded-lg hover:border-white/25 hover:text-white transition">
              Sign In
            </Link>
            <Link href="/auth/signup"
              className="px-4 py-2 text-sm text-white bg-gradient-to-r from-purple-600 to-pink-500 rounded-lg hover:opacity-90 transition shadow-lg shadow-purple-900/40">
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      {/* ════════════════════════════════════════════════════════════
          HERO
      ════════════════════════════════════════════════════════════ */}
      <section className="relative z-20 flex flex-col items-center justify-center text-center px-6 pt-28 pb-20 max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.75 }}>
          <div className="mb-6">
            <ParticleHeadline line1="Your wardrobe," line2="styled by AI" />
          </div>

          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Upload your clothes once. Get AI-curated outfits every day — tailored
            to your occasion, weather, and personal taste.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-10">
            <Link href="/auth/signup"
              className="group flex items-center gap-2 px-8 py-3.5 text-white bg-gradient-to-r from-purple-600 to-pink-500 rounded-xl font-semibold text-sm hover:opacity-90 shadow-xl shadow-purple-900/40 transition">
              Start Styling Free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <a href="#features"
              className="flex items-center gap-2 px-8 py-3.5 text-gray-300 border border-white/12 rounded-xl font-semibold text-sm hover:border-white/25 hover:text-white transition">
              See All Features
            </a>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-5 text-xs text-gray-500">
            {["No credit card required", "Free forever plan", "Works with any wardrobe size"].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />{t}
              </span>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          STATS
      ════════════════════════════════════════════════════════════ */}
      <section className="relative z-20 px-6 pb-20 max-w-5xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {STATS.map((s, i) => (
            <FadeIn key={i} delay={i * 0.07}>
              <GlowCard clientPos={clientPos}>
                <div className="p-5 text-center">
                  <div className="flex justify-center mb-2">{s.icon}</div>
                  <p className="text-3xl font-extrabold text-white">{s.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{s.label}</p>
                </div>
              </GlowCard>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          FEATURES — spotlight card grid
      ════════════════════════════════════════════════════════════ */}
      <section id="features" className="relative z-20 px-6 py-20 max-w-6xl mx-auto">
        <Divider />
        <FadeIn className="text-center mb-12">
          <Label>Everything you need</Label>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            A complete AI styling toolkit
          </h2>
          <p className="text-gray-400 max-w-lg mx-auto text-sm leading-relaxed">
            From uploading your first piece to planning a full week of outfits —
            every feature is built around your real wardrobe.
          </p>
          <p className="text-xs text-purple-400/50 mt-4 tracking-wide">Move your cursor over the cards</p>
        </FadeIn>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <FadeIn key={i} delay={i * 0.05}>
                <GlowCard clientPos={clientPos} className="h-full">
                  <div className="p-5 h-full">
                    <div className={`w-10 h-10 rounded-xl ${f.bg} flex items-center justify-center mb-4`}>
                      <Icon className={`w-5 h-5 ${f.color}`} />
                    </div>
                    <h3 className="font-bold text-white mb-1.5 text-sm">{f.title}</h3>
                    <p className="text-xs text-gray-400 leading-relaxed">{f.desc}</p>
                  </div>
                </GlowCard>
              </FadeIn>
            );
          })}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          HOW IT WORKS
      ════════════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="relative z-20 px-6 py-20 max-w-5xl mx-auto">
        <Divider />
        <FadeIn className="text-center mb-12">
          <Label>Simple process</Label>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            How WearWize works
          </h2>
          <p className="text-gray-400 max-w-lg mx-auto text-sm leading-relaxed">
            Four steps from uploading your wardrobe to getting dressed effortlessly every day.
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {STEPS.map((s, i) => (
            <FadeIn key={i} delay={i * 0.1}>
              <GlowCard clientPos={clientPos} borderColor={s.border} className="h-full">
                <div className="relative p-6 h-full overflow-hidden">
                  <span className={`absolute -top-3 -right-2 text-8xl font-extrabold ${s.color} opacity-[0.07] select-none pointer-events-none leading-none`}>
                    {s.num}
                  </span>
                  <div className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-white/5 mb-4">
                    <span className={`text-sm font-extrabold ${s.color}`}>{s.num}</span>
                  </div>
                  <h3 className="font-bold text-white mb-2">{s.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{s.desc}</p>
                </div>
              </GlowCard>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          TESTIMONIALS
      ════════════════════════════════════════════════════════════ */}
      <section id="reviews" className="relative z-20 px-6 py-20 max-w-5xl mx-auto">
        <Divider />
        <FadeIn className="text-center mb-12">
          <Label>Loved by users</Label>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Real people, real style
          </h2>
        </FadeIn>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {TESTIMONIALS.map((t, i) => (
            <FadeIn key={i} delay={i * 0.1}>
              <GlowCard clientPos={clientPos} className="h-full">
                <div className="p-6 flex flex-col gap-4 h-full">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-sm text-gray-400 leading-relaxed flex-1">&ldquo;{t.text}&rdquo;</p>
                  <div className="flex items-center gap-3 pt-3 border-t border-white/[0.06]">
                    <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${t.grad} flex items-center justify-center font-bold text-sm text-white shrink-0`}>
                      {t.avatar}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{t.name}</p>
                      <p className="text-xs text-gray-500">{t.role}</p>
                    </div>
                  </div>
                </div>
              </GlowCard>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          FINAL CTA
      ════════════════════════════════════════════════════════════ */}
      <section className="relative z-20 px-6 py-28 max-w-3xl mx-auto text-center">
        <Divider />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] pointer-events-none"
          style={{ background: "radial-gradient(ellipse, rgba(124,58,237,0.18) 0%, transparent 70%)", filter: "blur(40px)" }}
        />
        <FadeIn className="relative">
          <Label>Get started today</Label>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-5 leading-tight">
            Stop staring at your wardrobe.{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400">
              Let AI dress you.
            </span>
          </h2>
          <p className="text-gray-400 mb-10 text-sm sm:text-base leading-relaxed max-w-xl mx-auto">
            Join thousands of users who have simplified their morning routine with
            WearWize — your personal AI stylist that knows your wardrobe better than you do.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/auth/signup"
              className="group inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl font-bold text-sm hover:opacity-90 transition shadow-xl shadow-purple-900/40">
              Get Started — It&apos;s Free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link href="/auth/signin"
              className="inline-flex items-center justify-center px-8 py-3.5 text-gray-300 border border-white/12 rounded-xl font-semibold text-sm hover:border-white/25 hover:text-white transition">
              Already have an account?
            </Link>
          </div>
        </FadeIn>
      </section>

      {/* ════════════════════════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════════════════════════ */}
      <footer className="relative z-20 border-t border-white/[0.06] px-6 py-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-white text-sm">WearWize</span>
          </div>
          <p className="text-xs text-gray-600 text-center">
            © {new Date().getFullYear()} WearWize. All rights reserved. Powered by Google Gemini AI.
          </p>
          <div className="flex items-center gap-5 text-xs text-gray-500">
            <a href="#features"     className="hover:text-white transition">Features</a>
            <a href="#how-it-works" className="hover:text-white transition">How it works</a>
            <Link href="/auth/signup" className="hover:text-white transition">Sign Up</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
