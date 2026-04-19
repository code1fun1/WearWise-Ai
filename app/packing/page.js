"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Backpack,
  MapPin,
  Calendar,
  Briefcase,
  Loader2,
  Check,
  Lightbulb,
  CloudSun,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Image from "next/image";
import axios from "axios";
import { toast } from "react-toastify";

const PURPOSES = [
  "business trip",
  "beach vacation",
  "wedding/formal event",
  "adventure/outdoor",
  "city sightseeing",
  "family visit",
  "weekend getaway",
];

export default function PackingPage() {
  const [destination, setDestination] = useState("");
  const [days, setDays] = useState(3);
  const [purpose, setPurpose] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [expandedDay, setExpandedDay] = useState(null);

  async function handleGenerate(e) {
    e.preventDefault();
    if (!destination || !purpose) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const { data } = await axios.post("/api/packing", { destination, days, purpose });
      setResult(data);
      toast.success("Packing list ready!");
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to generate packing list";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Backpack className="w-6 h-6 text-purple-600" />
          Smart Packing Assistant
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          AI creates a packing list from your wardrobe — minimal items, maximum outfits
        </p>
      </div>

      {/* Form */}
      <form
        onSubmit={handleGenerate}
        className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Destination */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
              Destination
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="e.g. Goa, Paris, Delhi"
                required
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 dark:text-white"
              />
            </div>
          </div>

          {/* Days */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
              Duration (days)
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="number"
                min={1}
                max={30}
                value={days}
                onChange={(e) => setDays(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 dark:text-white"
              />
            </div>
          </div>

          {/* Purpose */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
              Trip Purpose
            </label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                required
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 dark:text-white"
              >
                <option value="">Select trip type…</option>
                {PURPOSES.map((p) => (
                  <option key={p} value={p} className="capitalize">{p}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-5 w-full flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold transition disabled:opacity-60 shadow-sm"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Building your packing list...
            </>
          ) : (
            <>
              <Backpack className="w-4 h-4" />
              Generate Packing List
            </>
          )}
        </button>
      </form>

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            {/* Summary bar */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-500 rounded-2xl p-5 text-white flex flex-wrap gap-4 items-center justify-between">
              <div>
                <h2 className="font-bold text-lg">{result.destination} · {result.days} days</h2>
                <p className="text-purple-100 text-sm capitalize">{result.purpose}</p>
              </div>
              <div className="flex gap-6 text-center">
                <div>
                  <p className="text-2xl font-bold">{result.totalItems}</p>
                  <p className="text-xs text-purple-200">items to pack</p>
                </div>
                {result.weather && (
                  <div className="flex items-center gap-1.5 text-sm">
                    <CloudSun className="w-4 h-4" />
                    <span>{result.weather.temp}°C · {result.weather.condition}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Items to pack */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
              <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                Items to Pack
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {result.packingList.map((p, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700 rounded-xl p-2.5"
                  >
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-gray-100 dark:border-gray-600 shrink-0 bg-white">
                      <Image
                        src={p.item.imageUrl}
                        alt={p.item.customName || p.item.type}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-800 dark:text-white capitalize truncate">
                        {p.item.customName || p.item.type}
                      </p>
                      <p className="text-[10px] text-gray-400 capitalize">{p.item.color}</p>
                      <p className="text-[10px] text-purple-600 dark:text-purple-400">{p.outfitsItCreates} outfits</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Day-by-day outfit plan */}
            {result.outfitCombinations?.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
                <h3 className="font-bold text-gray-800 dark:text-white mb-4">Day-by-Day Outfits</h3>
                <div className="space-y-2">
                  {result.outfitCombinations.map((combo, i) => (
                    <div key={i} className="border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setExpandedDay(expandedDay === i ? null : i)}
                        className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                      >
                        <span className="font-medium text-sm text-gray-800 dark:text-white">
                          Day {combo.day} — <span className="capitalize text-gray-500 dark:text-gray-400">{combo.occasion}</span>
                        </span>
                        {expandedDay === i ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                      </button>
                      <AnimatePresence>
                        {expandedDay === i && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: "auto" }}
                            exit={{ height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="px-3 pb-3">
                              <div className="flex gap-2 flex-wrap mb-2">
                                {(combo.itemObjects || []).map((item, j) => (
                                  <div key={j} className="flex flex-col items-center gap-1">
                                    <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-gray-100 dark:border-gray-600 bg-gray-50">
                                      <Image src={item.imageUrl} alt={item.type} fill className="object-cover" sizes="56px" />
                                    </div>
                                    <span className="text-[10px] text-gray-400 capitalize w-14 text-center truncate">
                                      {item.customName || item.type}
                                    </span>
                                  </div>
                                ))}
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{combo.description}</p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tips */}
            {result.tips?.length > 0 && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl border border-yellow-100 dark:border-yellow-800 p-5">
                <h3 className="font-bold text-yellow-800 dark:text-yellow-300 mb-3 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  Packing Tips
                </h3>
                <ul className="space-y-2">
                  {result.tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-yellow-700 dark:text-yellow-400">
                      <span className="mt-1 w-1.5 h-1.5 rounded-full bg-yellow-500 shrink-0" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
