"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Sparkles,
  Shirt,
  Wand2,
  CloudSun,
  ArrowRight,
  Loader2,
  RefreshCcw,
  MessageCircle,
  Leaf,
  CalendarDays,
  Backpack,
  History,
} from "lucide-react";
import axios from "axios";
import OnboardingWizard from "@/components/onboarding/OnboardingWizard";
import CostTrackerCard from "@/components/dashboard/CostTrackerCard";

export default function DashboardPage() {
  const { data: session } = useSession();

  const [wardrobe, setWardrobe]         = useState([]);
  const [ootd, setOotd]                 = useState(null);
  const [ootdLoading, setOotdLoading]   = useState(true);
  const [wardrobeLoading, setWardrobeLoading] = useState(true);
  const [showOnboarding, setShowOnboarding]   = useState(false);

  useEffect(() => {
    fetchWardrobe();
    fetchOotd();
    checkOnboarding();
  }, []);

  async function checkOnboarding() {
    try {
      const { data } = await axios.get("/api/profile");
      if (!data.onboardingCompleted) setShowOnboarding(true);
    } catch {
      // Non-critical — skip wizard if check fails
    }
  }

  async function fetchWardrobe() {
    try {
      const { data } = await axios.get("/api/wardrobe");
      setWardrobe(data.items);
    } catch {
      // non-critical
    } finally {
      setWardrobeLoading(false);
    }
  }

  async function fetchOotd() {
    setOotdLoading(true);
    try {
      const { data } = await axios.get("/api/outfit-of-the-day");
      setOotd(data);
    } catch {
      setOotd(null);
    } finally {
      setOotdLoading(false);
    }
  }

  const firstName = session?.user?.name?.split(" ")[0] || "there";

  return (
    <>
      {showOnboarding && (
        <OnboardingWizard
          userName={session?.user?.name || "there"}
          onComplete={() => setShowOnboarding(false)}
        />
      )}
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">

      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Good {getGreeting()}, {firstName} 👋
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Here&apos;s your style overview for today
        </p>
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatCard
          icon={<Shirt className="w-5 h-5 text-purple-500" />}
          label="Wardrobe Items"
          value={wardrobeLoading ? "—" : wardrobe.length}
          bg="bg-purple-50 dark:bg-purple-900/20"
        />
        <StatCard
          icon={<Wand2 className="w-5 h-5 text-pink-500" />}
          label="Generate Outfits"
          value="Try Now"
          href="/outfits"
          bg="bg-pink-50 dark:bg-pink-900/20"
        />
        <StatCard
          icon={<Sparkles className="w-5 h-5 text-yellow-500" />}
          label="Add Clothing"
          value="Upload"
          href="/wardrobe"
          bg="bg-yellow-50 dark:bg-yellow-900/20"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Outfit of the Day */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              <h2 className="font-bold text-gray-800 dark:text-white">Outfit of the Day</h2>
            </div>
            <button
              onClick={fetchOotd}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition text-gray-400 hover:text-purple-600"
              title="Refresh"
            >
              <RefreshCcw className="w-4 h-4" />
            </button>
          </div>

          {ootdLoading ? (
            <div className="flex items-center justify-center py-12 text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              Styling your day…
            </div>
          ) : !ootd?.outfit ? (
            <OotdEmpty />
          ) : (
            <OotdDisplay ootd={ootd} />
          )}
        </motion.section>

        {/* Wardrobe preview */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Shirt className="w-5 h-5 text-purple-500" />
              <h2 className="font-bold text-gray-800 dark:text-white">Your Wardrobe</h2>
            </div>
            <Link
              href="/wardrobe"
              className="flex items-center gap-1 text-xs text-purple-600 font-semibold hover:underline"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {wardrobeLoading ? (
            <div className="flex items-center justify-center py-12 text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              Loading…
            </div>
          ) : wardrobe.length === 0 ? (
            <WardrobeEmpty />
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {wardrobe.slice(0, 8).map((item) => (
                <div
                  key={item._id}
                  className="relative aspect-square rounded-xl overflow-hidden border border-gray-100 bg-gray-50"
                >
                  <Image
                    src={item.imageUrl}
                    alt={item.customName || item.type}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </div>
              ))}
            </div>
          )}
        </motion.section>
      </div>

      {/* Cost Tracker */}
      <CostTrackerCard />

      {/* Feature cards */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">Explore Features</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <FeatureCard href="/history"        icon={<History className="w-5 h-5 text-purple-500" />}      label="History"        desc="Browse past outfits"  bg="bg-purple-50 dark:bg-purple-900/20" />
          <FeatureCard href="/chat"          icon={<MessageCircle className="w-5 h-5 text-blue-500" />}    label="Style Chat"     desc="Chat with AI stylist" bg="bg-blue-50 dark:bg-blue-900/20" />
          <FeatureCard href="/calendar"      icon={<CalendarDays className="w-5 h-5 text-green-500" />}    label="Calendar"       desc="Plan weekly outfits" bg="bg-green-50 dark:bg-green-900/20" />
          <FeatureCard href="/sustainability" icon={<Leaf className="w-5 h-5 text-emerald-500" />}         label="Insights"       desc="Cost per wear" bg="bg-emerald-50 dark:bg-emerald-900/20" />
          <FeatureCard href="/packing"       icon={<Backpack className="w-5 h-5 text-orange-500" />}       label="Packing"        desc="Smart trip packing" bg="bg-orange-50 dark:bg-orange-900/20" />
        </div>
      </motion.section>

      {/* Quick actions */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-gradient-to-r from-purple-600 to-pink-500 rounded-2xl p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-4"
      >
        <div>
          <h3 className="font-bold text-lg">Ready to get dressed?</h3>
          <p className="text-sm text-purple-100 mt-0.5">
            Tell us your occasion and get 3 AI-curated outfits in seconds.
          </p>
        </div>
        <Link
          href="/outfits"
          className="flex items-center gap-2 px-5 py-2.5 bg-white text-purple-700 rounded-xl text-sm font-bold hover:bg-purple-50 transition shrink-0"
        >
          <Wand2 className="w-4 h-4" />
          Generate Outfits
        </Link>
      </motion.section>
    </main>
    </>
  );
}

// ── Sub-components ───────────────────────────────────────────────

function FeatureCard({ href, icon, label, desc, bg }) {
  return (
    <Link href={href} className={`${bg} rounded-2xl p-4 flex flex-col gap-2 hover:opacity-90 transition`}>
      {icon}
      <p className="font-semibold text-gray-800 dark:text-white text-sm">{label}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
    </Link>
  );
}

function StatCard({ icon, label, value, bg, href }) {
  const content = (
    <div className={`${bg} rounded-2xl p-4 flex items-center gap-3 hover:opacity-90 transition`}>
      <div className="shrink-0">{icon}</div>
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className="font-bold text-gray-800 dark:text-white text-lg leading-tight">{value}</p>
      </div>
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : <div>{content}</div>;
}

function OotdDisplay({ ootd }) {
  return (
    <div>
      {ootd.weather && (
        <div className="flex items-center gap-1.5 text-xs text-blue-500 mb-3">
          <CloudSun className="w-3.5 h-3.5" />
          {ootd.weather.city} · {ootd.weather.temp}°C · {ootd.weather.condition}
          {ootd.cached && (
            <span className="ml-1 text-gray-400">(today&apos;s cached look)</span>
          )}
        </div>
      )}
      <div className="flex gap-2 mb-3 overflow-x-auto">
        {ootd.outfit.items.map((item) => (
          <div key={item._id} className="shrink-0 flex flex-col items-center gap-1">
            <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
              <Image
                src={item.imageUrl}
                alt={item.customName || item.type}
                fill
                className="object-cover"
                sizes="64px"
              />
            </div>
            <span className="text-[10px] text-gray-400 capitalize w-16 text-center truncate">
              {item.customName || item.type}
            </span>
          </div>
        ))}
      </div>
      {ootd.outfit.explanation && (
        <p className="text-xs text-gray-500 leading-relaxed">
          {ootd.outfit.explanation}
        </p>
      )}
    </div>
  );
}

function OotdEmpty() {
  return (
    <div className="flex flex-col items-center py-10 text-center">
      <Sparkles className="w-8 h-8 text-purple-300 mb-2" />
      <p className="text-sm text-gray-500 mb-3">
        Add clothes to your wardrobe to get your daily outfit suggestion
      </p>
      <Link
        href="/wardrobe"
        className="text-xs text-purple-600 font-semibold hover:underline"
      >
        Add clothing items →
      </Link>
    </div>
  );
}

function WardrobeEmpty() {
  return (
    <div className="flex flex-col items-center py-10 text-center">
      <Shirt className="w-8 h-8 text-purple-300 mb-2" />
      <p className="text-sm text-gray-500 mb-3">Your wardrobe is empty</p>
      <Link
        href="/wardrobe"
        className="text-xs text-purple-600 font-semibold hover:underline"
      >
        Upload your first item →
      </Link>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
