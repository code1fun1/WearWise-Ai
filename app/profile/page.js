"use client";

import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  User, Palette, Shirt, LogOut, Loader2,
  MapPin, Save, Camera, Sparkles, Link as LinkIcon,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";

export default function ProfilePage() {
  const { data: session } = useSession();
  const [prefs, setPrefs]   = useState(null);
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [city, setCity]     = useState("");
  const [savingCity, setSavingCity] = useState(false);
  const [skinAnalysis, setSkinAnalysis] = useState(null);
  const [analyzingSkin, setAnalyzingSkin] = useState(false);
  const skinInputRef = useRef(null);

  useEffect(() => { fetchProfile(); }, []);

  async function fetchProfile() {
    try {
      const [prefsRes, wardrobeRes] = await Promise.all([
        axios.get("/api/profile"),
        axios.get("/api/wardrobe"),
      ]);
      setPrefs(prefsRes.data.preferences);
      setCity(prefsRes.data.preferences?.city || "");
      const items = wardrobeRes.data.items;
      setStats({
        total: items.length,
        types: countBy(items, "type"),
        topColor: topValue(items, "color"),
        topStyle: topValue(items, "style"),
        mostWorn: items.sort((a, b) => (b.wearCount || 0) - (a.wearCount || 0))[0] || null,
      });
    } catch {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  }

  async function saveCity() {
    setSavingCity(true);
    try {
      await axios.patch("/api/profile", { city });
      toast.success("City saved! It will be used for all weather-based features.");
    } catch {
      toast.error("Failed to save city");
    } finally {
      setSavingCity(false);
    }
  }

  async function handleSkinToneUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAnalyzingSkin(true);
    const formData = new FormData();
    formData.append("image", file);
    try {
      const { data } = await axios.post("/api/skin-tone", formData);
      setSkinAnalysis(data.analysis);
      await fetchProfile();
      toast.success("Skin tone analyzed!");
    } catch {
      toast.error("Failed to analyze skin tone — try a clearer photo");
    } finally {
      setAnalyzingSkin(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-gray-400">
        <Loader2 className="w-7 h-7 animate-spin mr-2" />
        Loading profile...
      </div>
    );
  }

  const skinTone = skinAnalysis?.undertone || prefs?.skinTone;
  const skinPalette = skinAnalysis?.seasonPalette;

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-5">

      {/* User card */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 flex items-center gap-4"
      >
        {session?.user?.image ? (
          <Image src={session.user.image} alt={session.user.name || "User"} width={64} height={64} className="rounded-full border-2 border-purple-200" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-purple-700 dark:text-purple-300 text-2xl font-bold">
            {session?.user?.name?.[0]?.toUpperCase() || "U"}
          </div>
        )}
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{session?.user?.name}</h1>
          <p className="text-sm text-gray-400">{session?.user?.email}</p>
          {skinTone && (
            <span className="inline-flex items-center gap-1 mt-1 text-xs bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 px-2 py-0.5 rounded-full capitalize">
              <Sparkles className="w-3 h-3" />
              {skinTone} undertone {skinPalette ? `· ${skinPalette}` : ""}
            </span>
          )}
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-100 text-red-500 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </motion.section>

      {/* Location */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.04 }}
        className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6"
      >
        <SectionTitle icon={<MapPin className="w-4 h-4 text-blue-500" />} title="Your City" />
        <p className="text-xs text-gray-400 mt-1 mb-4">
          Saved once — used automatically for weather-based outfit suggestions and OOTD.
        </p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Mumbai, Delhi, Bangalore"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 dark:text-white dark:placeholder-gray-500"
            />
          </div>
          <button
            onClick={saveCity}
            disabled={savingCity}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold transition disabled:opacity-60"
          >
            {savingCity ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save
          </button>
        </div>
      </motion.section>

      {/* Skin tone analysis */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06 }}
        className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6"
      >
        <SectionTitle icon={<Camera className="w-4 h-4 text-pink-500" />} title="Skin Tone Analysis" />
        <p className="text-xs text-gray-400 mt-1 mb-4">
          Upload a selfie to analyze your skin tone. AI will suggest flattering colors for your outfits.
        </p>

        {(skinAnalysis || prefs?.skinTone) && (
          <div className="mb-4 bg-pink-50 dark:bg-pink-900/20 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full border-2 border-white shadow ${
                (skinAnalysis?.undertone || prefs?.skinTone) === "warm" ? "bg-amber-400" :
                (skinAnalysis?.undertone || prefs?.skinTone) === "cool" ? "bg-blue-400" : "bg-gray-400"
              }`} />
              <div>
                <p className="font-semibold text-sm text-gray-800 dark:text-white capitalize">
                  {skinAnalysis?.undertone || prefs?.skinTone} undertone
                </p>
                {skinAnalysis?.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">{skinAnalysis.description}</p>
                )}
              </div>
            </div>
            {skinAnalysis?.bestColors && (
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Best colors for you</p>
                <div className="flex flex-wrap gap-1.5">
                  {skinAnalysis.bestColors.map((c, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-full text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 capitalize font-medium">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {skinAnalysis?.colorsToAvoid?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Colors to avoid</p>
                <div className="flex flex-wrap gap-1.5">
                  {skinAnalysis.colorsToAvoid.map((c, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-full text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 capitalize font-medium">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <input ref={skinInputRef} type="file" accept="image/*" onChange={handleSkinToneUpload} className="hidden" />
        <button
          onClick={() => skinInputRef.current?.click()}
          disabled={analyzingSkin}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-pink-200 dark:border-pink-700 text-pink-600 dark:text-pink-400 text-sm font-medium hover:bg-pink-50 dark:hover:bg-pink-900/20 transition disabled:opacity-60"
        >
          {analyzingSkin ? (
            <><Loader2 className="w-4 h-4 animate-spin" />Analyzing...</>
          ) : (
            <><Camera className="w-4 h-4" />{prefs?.skinTone ? "Re-analyze Skin Tone" : "Upload Selfie for Analysis"}</>
          )}
        </button>
      </motion.section>

      {/* Wardrobe stats */}
      {stats && (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6"
        >
          <SectionTitle icon={<Shirt className="w-4 h-4 text-purple-500" />} title="Wardrobe Stats" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
            <StatBox label="Total Items" value={stats.total} />
            <StatBox label="Top Color"   value={stats.topColor || "—"} capitalize />
            <StatBox label="Top Style"   value={stats.topStyle || "—"} capitalize />
            <StatBox label="Types"       value={Object.keys(stats.types).length} />
          </div>
          {stats.mostWorn && (
            <div className="mt-4 flex items-center gap-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-3">
              <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-yellow-100 dark:border-yellow-800 shrink-0">
                <Image src={stats.mostWorn.imageUrl} alt="" fill className="object-cover" sizes="40px" />
              </div>
              <div>
                <p className="text-xs text-yellow-700 dark:text-yellow-400 font-semibold">Most Worn Item</p>
                <p className="text-sm font-bold text-gray-800 dark:text-white capitalize">
                  {stats.mostWorn.customName || stats.mostWorn.type} · {stats.mostWorn.wearCount} wears
                </p>
              </div>
            </div>
          )}
        </motion.section>
      )}

      {/* Style DNA card */}
      {prefs && !isEmptyPrefs(prefs) && (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-purple-600 to-pink-500 rounded-2xl p-6 text-white"
        >
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5" />
            <h2 className="font-bold text-lg">Your Style DNA</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {prefs.preferredColors?.length > 0 && (
              <div>
                <p className="text-xs text-purple-200 font-semibold mb-1.5">Signature Colors</p>
                <div className="flex flex-wrap gap-1">
                  {prefs.preferredColors.slice(0, 4).map((c, i) => (
                    <span key={i} className="px-2 py-0.5 bg-white/20 rounded-full text-xs capitalize">{c}</span>
                  ))}
                </div>
              </div>
            )}
            {prefs.preferredStyles?.length > 0 && (
              <div>
                <p className="text-xs text-purple-200 font-semibold mb-1.5">Style Identity</p>
                <div className="flex flex-wrap gap-1">
                  {prefs.preferredStyles.slice(0, 3).map((s, i) => (
                    <span key={i} className="px-2 py-0.5 bg-white/20 rounded-full text-xs capitalize">{s}</span>
                  ))}
                </div>
              </div>
            )}
            {prefs.preferredPatterns?.length > 0 && (
              <div>
                <p className="text-xs text-purple-200 font-semibold mb-1.5">Favourite Patterns</p>
                <div className="flex flex-wrap gap-1">
                  {prefs.preferredPatterns.slice(0, 3).map((p, i) => (
                    <span key={i} className="px-2 py-0.5 bg-white/20 rounded-full text-xs capitalize">{p}</span>
                  ))}
                </div>
              </div>
            )}
            {skinTone && (
              <div>
                <p className="text-xs text-purple-200 font-semibold mb-1.5">Skin Tone</p>
                <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs capitalize">{skinTone} undertone</span>
              </div>
            )}
          </div>
        </motion.section>
      )}

      {/* Learned preferences */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6"
      >
        <SectionTitle icon={<Palette className="w-4 h-4 text-pink-500" />} title="Learned Style Preferences" />
        <p className="text-xs text-gray-400 mt-1 mb-4">
          Updated automatically each time you select or skip an outfit.
        </p>
        {!prefs || isEmptyPrefs(prefs) ? (
          <p className="text-sm text-gray-400 text-center py-6">
            No preferences learned yet. Generate and rate some outfits to get started!
          </p>
        ) : (
          <div className="space-y-4">
            <PrefRow label="Favourite Colors"   tags={prefs.preferredColors}  color="purple" />
            <PrefRow label="Favourite Styles"   tags={prefs.preferredStyles}  color="blue" />
            <PrefRow label="Favourite Patterns" tags={prefs.preferredPatterns} color="green" />
            <PrefRow label="Common Occasions"   tags={prefs.commonOccasions}  color="yellow" />
            <PrefRow label="Avoided Colors"     tags={prefs.avoidedColors}    color="red" />
            <PrefRow label="Avoided Styles"     tags={prefs.avoidedStyles}    color="orange" />
          </div>
        )}
      </motion.section>
    </main>
  );
}

function SectionTitle({ icon, title }) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <h2 className="font-bold text-gray-800 dark:text-white">{title}</h2>
    </div>
  );
}

function StatBox({ label, value, capitalize }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 text-center">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className={`font-bold text-gray-800 dark:text-white text-sm ${capitalize ? "capitalize" : ""}`}>{value}</p>
    </div>
  );
}

function PrefRow({ label, tags, color }) {
  if (!tags?.length) return null;
  const colorMap = {
    purple: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    blue:   "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    green:  "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    yellow: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
    red:    "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
    orange: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
  };
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag, i) => (
          <span key={i} className={`px-2.5 py-1 rounded-full text-xs capitalize font-medium ${colorMap[color]}`}>
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

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
