"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  User,
  Palette,
  Shirt,
  Tag,
  LogOut,
  Loader2,
  X,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";

export default function ProfilePage() {
  const { data: session } = useSession();
  const [prefs, setPrefs] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      const [prefsRes, wardrobeRes] = await Promise.all([
        axios.get("/api/profile"),
        axios.get("/api/wardrobe"),
      ]);
      setPrefs(prefsRes.data.preferences);
      const items = wardrobeRes.data.items;
      setStats({
        total: items.length,
        types: countBy(items, "type"),
        topColor: topValue(items, "color"),
        topStyle: topValue(items, "style"),
      });
    } catch {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-gray-400">
        <Loader2 className="w-7 h-7 animate-spin mr-2" />
        Loading profile…
      </div>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">

      {/* User card */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center gap-4"
      >
        {session?.user?.image ? (
          <Image
            src={session.user.image}
            alt={session.user.name || "User"}
            width={64}
            height={64}
            className="rounded-full border-2 border-purple-200"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 text-2xl font-bold">
            {session?.user?.name?.[0]?.toUpperCase() || "U"}
          </div>
        )}
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">
            {session?.user?.name}
          </h1>
          <p className="text-sm text-gray-400">{session?.user?.email}</p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-100 text-red-500 text-sm hover:bg-red-50 transition"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </motion.section>

      {/* Wardrobe stats */}
      {stats && (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
        >
          <SectionTitle icon={<Shirt className="w-4 h-4 text-purple-500" />} title="Wardrobe Stats" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
            <StatBox label="Total Items" value={stats.total} />
            <StatBox label="Top Color" value={stats.topColor || "—"} capitalize />
            <StatBox label="Top Style" value={stats.topStyle || "—"} capitalize />
            <StatBox label="Types" value={Object.keys(stats.types).length} />
          </div>
        </motion.section>
      )}

      {/* Learned preferences */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
      >
        <SectionTitle icon={<Palette className="w-4 h-4 text-pink-500" />} title="Learned Style Preferences" />
        <p className="text-xs text-gray-400 mt-1 mb-4">
          These are updated automatically each time you select or skip an outfit.
        </p>

        {!prefs || isEmptyPrefs(prefs) ? (
          <p className="text-sm text-gray-400 text-center py-6">
            No preferences learned yet. Generate and rate some outfits to get started!
          </p>
        ) : (
          <div className="space-y-4">
            <PrefRow label="Favourite Colors" tags={prefs.preferredColors} color="purple" />
            <PrefRow label="Favourite Styles" tags={prefs.preferredStyles} color="blue" />
            <PrefRow label="Favourite Patterns" tags={prefs.preferredPatterns} color="green" />
            <PrefRow label="Common Occasions" tags={prefs.commonOccasions} color="yellow" />
            <PrefRow label="Avoided Colors" tags={prefs.avoidedColors} color="red" />
            <PrefRow label="Avoided Styles" tags={prefs.avoidedStyles} color="orange" />
          </div>
        )}
      </motion.section>
    </main>
  );
}

// ── Sub-components ───────────────────────────────────────────────

function SectionTitle({ icon, title }) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <h2 className="font-bold text-gray-800">{title}</h2>
    </div>
  );
}

function StatBox({ label, value, capitalize }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3 text-center">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className={`font-bold text-gray-800 text-sm ${capitalize ? "capitalize" : ""}`}>
        {value}
      </p>
    </div>
  );
}

function PrefRow({ label, tags, color }) {
  if (!tags?.length) return null;

  const colorMap = {
    purple: "bg-purple-100 text-purple-700",
    blue:   "bg-blue-100 text-blue-700",
    green:  "bg-green-100 text-green-700",
    yellow: "bg-yellow-100 text-yellow-700",
    red:    "bg-red-100 text-red-600",
    orange: "bg-orange-100 text-orange-600",
  };

  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag, i) => (
          <span
            key={i}
            className={`px-2.5 py-1 rounded-full text-xs capitalize font-medium ${colorMap[color]}`}
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────

function countBy(arr, key) {
  return arr.reduce((acc, item) => {
    const val = item[key];
    if (val) acc[val] = (acc[val] || 0) + 1;
    return acc;
  }, {});
}

function topValue(arr, key) {
  const counts = countBy(arr, key);
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[0] || null;
}

function isEmptyPrefs(prefs) {
  return (
    !prefs.preferredColors?.length &&
    !prefs.preferredStyles?.length &&
    !prefs.preferredPatterns?.length &&
    !prefs.commonOccasions?.length &&
    !prefs.avoidedColors?.length &&
    !prefs.avoidedStyles?.length
  );
}
