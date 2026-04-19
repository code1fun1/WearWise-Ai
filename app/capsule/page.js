"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Loader2,
  RefreshCcw,
  ShoppingBag,
  Star,
} from "lucide-react";
import Image from "next/image";
import axios from "axios";
import { toast } from "react-toastify";

export default function CapsulePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAnalysis(); }, []);

  async function fetchAnalysis() {
    setLoading(true);
    try {
      const { data: res } = await axios.get("/api/capsule");
      setData(res);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to analyze wardrobe";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        <p className="text-sm">Analyzing your wardrobe with AI...</p>
      </div>
    );
  }

  if (!data) return null;

  const styleEntries = Object.entries(data.styleBreakdown || {}).sort((a, b) => b[1] - a[1]);

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-600" />
            Capsule Wardrobe Analysis
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            AI analysis of your wardrobe — what to keep, what to donate, what's missing
          </p>
        </div>
        <button onClick={fetchAnalysis} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition text-gray-400">
          <RefreshCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Personality + scores */}
      <div className="bg-gradient-to-br from-purple-600 to-pink-500 rounded-2xl p-6 text-white">
        <p className="text-purple-200 text-sm font-medium mb-1">Your Wardrobe Personality</p>
        <h2 className="text-3xl font-bold mb-4">{data.wardrobePersonality}</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/20 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold">{data.utilizationScore}%</p>
            <p className="text-xs text-purple-200">Utilization</p>
          </div>
          <div className="bg-white/20 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold">{data.outfitCombinations}+</p>
            <p className="text-xs text-purple-200">Outfit Combos</p>
          </div>
          <div className="bg-white/20 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold">{data.totalWardrobeItems}</p>
            <p className="text-xs text-purple-200">Total Items</p>
          </div>
        </div>
      </div>

      {/* Style breakdown */}
      {styleEntries.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5"
        >
          <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            Style Breakdown
          </h3>
          <div className="space-y-3">
            {styleEntries.map(([style, pct]) => (
              <div key={style}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="capitalize text-gray-700 dark:text-gray-300 font-medium">{style}</span>
                  <span className="text-gray-500 dark:text-gray-400">{pct}%</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full bg-purple-500 rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Capsule items */}
      {data.capsuleItems?.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5"
        >
          <h3 className="font-bold text-gray-800 dark:text-white mb-1 flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-500" />
            Your Core Capsule ({data.capsuleItems.length} items)
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">{data.capsuleReasoning}</p>
          <div className="flex flex-wrap gap-2">
            {data.capsuleItems.map((item) => (
              <div key={item._id} className="flex flex-col items-center gap-1">
                <div className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-yellow-200 dark:border-yellow-700 bg-gray-50">
                  <Image src={item.imageUrl} alt={item.type} fill className="object-cover" sizes="64px" />
                </div>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 capitalize w-16 text-center truncate">
                  {item.customName || item.type}
                </span>
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Dead items */}
      {data.deadItems?.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-orange-50 dark:bg-orange-900/20 rounded-2xl border border-orange-100 dark:border-orange-800 p-5"
        >
          <h3 className="font-bold text-orange-800 dark:text-orange-300 mb-1 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Consider Donating ({data.deadItems.length} items)
          </h3>
          <p className="text-xs text-orange-600 dark:text-orange-400 mb-4">
            These items have never been worn. Consider donating them to make space.
          </p>
          <div className="flex flex-wrap gap-2">
            {data.deadItems.map((item) => (
              <div key={item._id} className="flex flex-col items-center gap-1 opacity-70">
                <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-orange-200 dark:border-orange-700 bg-gray-50 grayscale">
                  <Image src={item.imageUrl} alt={item.type} fill className="object-cover" sizes="56px" />
                </div>
                <span className="text-[10px] text-gray-400 capitalize w-14 text-center truncate">
                  {item.customName || item.type}
                </span>
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Missing pieces */}
      {data.missingPieces?.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5"
        >
          <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-purple-500" />
            What You're Missing
          </h3>
          <div className="space-y-3">
            {data.missingPieces.map((piece, i) => (
              <div key={i} className="flex items-start gap-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/40 rounded-lg flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-800 dark:text-white capitalize">{piece.type}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{piece.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {/* AI Insights */}
      {data.insights?.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5"
        >
          <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-yellow-500" />
            AI Insights
          </h3>
          <ul className="space-y-2">
            {data.insights.map((insight, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
                {insight}
              </li>
            ))}
          </ul>
        </motion.section>
      )}
    </main>
  );
}
