"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wand2,
  CloudSun,
  Loader2,
  RotateCcw,
  MapPin,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import OutfitCard from "@/components/outfits/OutfitCard";

const OCCASION_OPTIONS = [
  "casual",
  "office",
  "smart casual",
  "party",
  "wedding",
  "date",
  "festive",
  "outdoor",
  "gym",
  "beach",
  "formal",
];

export default function OutfitsPage() {
  const [occasion, setOccasion] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);

  // Auto-load city from profile
  useEffect(() => {
    axios.get("/api/profile").then(({ data }) => {
      if (data.preferences?.city) setCity(data.preferences.city);
    }).catch(() => {});
  }, []);

  // Results
  const [outfits, setOutfits] = useState([]);
  const [weather, setWeather] = useState(null);
  const [historyId, setHistoryId] = useState(null);
  const [occasionDesc, setOccasionDesc] = useState("");

  // Feedback state
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [rejectedIndexes, setRejectedIndexes] = useState([]);
  const [feedbackSent, setFeedbackSent] = useState(false);

  // ── Generate outfits ─────────────────────────────────────────
  async function handleGenerate(e) {
    e.preventDefault();
    if (!occasion) {
      toast.error("Please select an occasion first");
      return;
    }

    setLoading(true);
    setOutfits([]);
    setWeather(null);
    setSelectedIndex(null);
    setRejectedIndexes([]);
    setFeedbackSent(false);

    try {
      const { data } = await axios.post("/api/generate-outfit", {
        occasion,
        city: city || "Mumbai",
      });

      setOutfits(data.outfits);
      setWeather(data.weather);
      setHistoryId(data.historyId);
      setOccasionDesc(data.occasionDescription);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Failed to generate outfits. Please try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  // ── Feedback: select ─────────────────────────────────────────
  async function handleSelect(index) {
    setSelectedIndex(index);
    await submitFeedback(index, rejectedIndexes);
  }

  // ── Feedback: reject ─────────────────────────────────────────
  async function handleReject(index) {
    const newRejected = [...rejectedIndexes, index];
    setRejectedIndexes(newRejected);

    // If all outfits rejected, still record that
    if (newRejected.length === outfits.length) {
      await submitFeedback(null, newRejected);
    }
  }

  async function submitFeedback(selected, rejected) {
    if (feedbackSent || !historyId) return;
    try {
      await axios.post("/api/feedback", {
        historyId,
        selectedOutfitIndex: selected,
        rejectedOutfitIndexes: rejected,
      });
      setFeedbackSent(true);
      if (selected !== null) {
        toast.success("Great choice! Your preferences have been updated.");
      }
    } catch {
      // Feedback failure is non-critical — don't toast an error
    }
  }

  function handleReset() {
    setOutfits([]);
    setWeather(null);
    setSelectedIndex(null);
    setRejectedIndexes([]);
    setFeedbackSent(false);
  }

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Outfit Generator</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Tell us the occasion and get 3 AI-curated outfits from your wardrobe
        </p>
      </div>

      {/* Form */}
      <form
        onSubmit={handleGenerate}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8"
      >
        <div className="flex flex-wrap gap-4">
          {/* Occasion */}
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
              Occasion
            </label>
            <select
              value={occasion}
              onChange={(e) => setOccasion(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm capitalize"
            >
              <option value="">Select occasion…</option>
              {OCCASION_OPTIONS.map((o) => (
                <option key={o} value={o} className="capitalize">
                  {o}
                </option>
              ))}
            </select>
          </div>

          {/* City */}
          <div className="flex-1 min-w-[160px]">
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
              Your City <span className="normal-case text-gray-400 font-normal">(saved in profile)</span>
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="e.g. Mumbai"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 transition disabled:opacity-60 shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Styling…
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  Generate Outfits
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Weather strip */}
      <AnimatePresence>
        {weather && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-6 text-sm text-blue-700"
          >
            <CloudSun className="w-5 h-5 shrink-0" />
            <span>
              <strong>{weather.city}</strong> — {weather.temp}°C,{" "}
              {weather.condition}
              {weather.isFallback && (
                <span className="text-blue-400 ml-1">
                  (weather API not configured — using default)
                </span>
              )}
            </span>
            {occasionDesc && (
              <span className="ml-auto text-xs text-blue-500 capitalize italic hidden sm:block">
                {occasionDesc}
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Outfit cards */}
      <AnimatePresence>
        {outfits.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-gray-800">
                Your Outfit Suggestions
              </h2>
              <button
                onClick={handleReset}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-purple-600 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Start over
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {outfits.map((outfit, i) => (
                <OutfitCard
                  key={i}
                  outfit={outfit}
                  index={i}
                  onSelect={handleSelect}
                  onReject={handleReject}
                  selected={selectedIndex === i}
                  rejected={rejectedIndexes.includes(i)}
                />
              ))}
            </div>

            {feedbackSent && selectedIndex !== null && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-sm text-green-600 mt-2"
              >
                Your style preferences have been updated based on this choice!
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
