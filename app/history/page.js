"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  History,
  CloudSun,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  Wand2,
  Loader2,
  Filter,
  ChevronDown,
  RotateCcw,
  Share2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import axios from "axios";
import ShareCardModal from "@/components/outfits/ShareCardModal";

const OCCASIONS = [
  "casual", "office", "smart casual", "party", "wedding",
  "date", "festive", "outdoor", "gym", "beach", "formal",
];

const OCCASION_COLORS = {
  casual:        "bg-blue-100 text-blue-700",
  office:        "bg-slate-100 text-slate-700",
  "smart casual":"bg-indigo-100 text-indigo-700",
  party:         "bg-pink-100 text-pink-700",
  wedding:       "bg-rose-100 text-rose-700",
  date:          "bg-red-100 text-red-700",
  festive:       "bg-orange-100 text-orange-700",
  outdoor:       "bg-green-100 text-green-700",
  gym:           "bg-yellow-100 text-yellow-700",
  beach:         "bg-cyan-100 text-cyan-700",
  formal:        "bg-purple-100 text-purple-700",
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 60)   return `${mins}m ago`;
  if (hours < 24)  return `${hours}h ago`;
  if (days === 1)  return "Yesterday";
  if (days < 7)    return `${days} days ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function HistoryPage() {
  const [history, setHistory]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage]             = useState(1);
  const [pages, setPages]           = useState(1);
  const [total, setTotal]           = useState(0);

  // Filters
  const [occasion, setOccasion]     = useState("");
  const [selectedOnly, setSelectedOnly] = useState(false);
  const [filtersOpen, setFiltersOpen]   = useState(false);

  // Stats (derived from first page load without filters)
  const [stats, setStats]           = useState(null);

  const fetchHistory = useCallback(async (pg = 1, replace = true) => {
    if (pg === 1) setLoading(true); else setLoadingMore(true);
    try {
      const params = new URLSearchParams({ page: pg, limit: 12 });
      if (occasion) params.set("occasion", occasion);
      if (selectedOnly) params.set("selectedOnly", "true");

      const { data } = await axios.get(`/api/outfit-history?${params}`);
      setTotal(data.total);
      setPages(data.pages);
      setPage(pg);
      setHistory((prev) => replace ? data.history : [...prev, ...data.history]);

      // Compute stats once on initial unfiltered load
      if (pg === 1 && !occasion && !selectedOnly && data.history.length) {
        computeStats(data.history, data.total);
      }
    } catch {
      // non-critical
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [occasion, selectedOnly]);

  useEffect(() => { fetchHistory(1, true); }, [fetchHistory]);

  function computeStats(records, totalCount) {
    const worn = records.filter((r) => r.selectedOutfitIndex !== null).length;
    const freq = {};
    records.forEach((r) => { freq[r.occasion] = (freq[r.occasion] || 0) + 1; });
    const top = Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0];
    setStats({ total: totalCount, worn, topOccasion: top });
  }

  function handleFilterApply() {
    setFiltersOpen(false);
    fetchHistory(1, true);
  }

  function handleReset() {
    setOccasion("");
    setSelectedOnly(false);
  }

  const hasActiveFilters = occasion || selectedOnly;

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <History className="w-6 h-6 text-purple-500" />
            Outfit History
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Every outfit you&apos;ve generated — browse, re-wear, track your style over time
          </p>
        </div>
        <Link
          href="/outfits"
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 transition shrink-0"
        >
          <Wand2 className="w-4 h-4" />
          New Outfit
        </Link>
      </div>

      {/* Stats */}
      {stats && !hasActiveFilters && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-3 gap-3"
        >
          <StatCard
            icon={<History className="w-4 h-4 text-purple-500" />}
            label="Sessions"
            value={stats.total}
            bg="bg-purple-50 dark:bg-purple-900/20"
          />
          <StatCard
            icon={<CheckCircle2 className="w-4 h-4 text-green-500" />}
            label="Outfits Worn"
            value={stats.worn}
            bg="bg-green-50 dark:bg-green-900/20"
          />
          <StatCard
            icon={<Sparkles className="w-4 h-4 text-pink-500" />}
            label="Top Occasion"
            value={stats.topOccasion ? capitalize(stats.topOccasion) : "—"}
            bg="bg-pink-50 dark:bg-pink-900/20"
          />
        </motion.div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setFiltersOpen((v) => !v)}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition ${
            hasActiveFilters
              ? "border-purple-300 bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
              : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300"
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          Filters
          {hasActiveFilters && (
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
          )}
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${filtersOpen ? "rotate-180" : ""}`} />
        </button>

        {hasActiveFilters && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-gray-500 hover:text-gray-700 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Clear
          </button>
        )}

        {total > 0 && (
          <span className="ml-auto text-xs text-gray-400">
            {total} session{total !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      <AnimatePresence>
        {filtersOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 space-y-4">
              <div className="flex flex-wrap gap-2">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide w-full">
                  Occasion
                </span>
                {OCCASIONS.map((o) => (
                  <button
                    key={o}
                    onClick={() => setOccasion(occasion === o ? "" : o)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition capitalize ${
                      occasion === o
                        ? "border-purple-300 bg-purple-50 text-purple-700 dark:bg-purple-900/40 dark:border-purple-600 dark:text-purple-300"
                        : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-purple-200"
                    }`}
                  >
                    {o}
                  </button>
                ))}
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <div
                  onClick={() => setSelectedOnly((v) => !v)}
                  className={`w-10 h-5 rounded-full transition-colors relative ${
                    selectedOnly ? "bg-purple-600" : "bg-gray-200 dark:bg-gray-700"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                      selectedOnly ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Worn outfits only</span>
              </label>

              <button
                onClick={handleFilterApply}
                className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 transition"
              >
                Apply Filters
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Loading your history…
        </div>
      ) : history.length === 0 ? (
        <EmptyState hasFilters={hasActiveFilters} onClear={handleReset} />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {history.map((record, i) => (
                <HistoryCard key={record._id} record={record} index={i} />
              ))}
            </AnimatePresence>
          </div>

          {/* Load more */}
          {page < pages && (
            <div className="flex justify-center pt-2">
              <button
                onClick={() => fetchHistory(page + 1, false)}
                disabled={loadingMore}
                className="flex items-center gap-2 px-6 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:border-purple-300 hover:text-purple-600 transition disabled:opacity-50"
              >
                {loadingMore ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Loading…</>
                ) : (
                  "Load more"
                )}
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
}

// ── History Card ─────────────────────────────────────────────────

function HistoryCard({ record, index }) {
  const [showShare, setShowShare] = useState(false);

  const selectedOutfit =
    record.selectedOutfitIndex !== null
      ? record.generatedOutfits[record.selectedOutfitIndex]
      : null;

  // Show the selected outfit if the user picked one, otherwise show the first generated outfit
  const displayOutfit = selectedOutfit || record.generatedOutfits[0];
  const wasWorn       = record.selectedOutfitIndex !== null;
  const allRejected   =
    !wasWorn &&
    record.rejectedOutfitIndexes?.length === record.generatedOutfits.length;

  const occasionColor = OCCASION_COLORS[record.occasion] || "bg-gray-100 text-gray-700";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.3) }}
      className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
    >
      {/* Top strip — status colour */}
      <div
        className={`h-1 w-full ${
          wasWorn ? "bg-green-400" : allRejected ? "bg-gray-200" : "bg-purple-300"
        }`}
      />

      <div className="p-4 space-y-3">
        {/* Meta row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${occasionColor}`}>
              {record.occasion}
            </span>
            {record.isOutfitOfTheDay && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-yellow-100 text-yellow-700 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> OOTD
              </span>
            )}
          </div>
          <span className="text-[11px] text-gray-400 flex items-center gap-1 shrink-0">
            <Clock className="w-3 h-3" />
            {timeAgo(record.createdAt)}
          </span>
        </div>

        {/* Outfit items */}
        {displayOutfit?.items?.length > 0 ? (
          <div className="flex gap-2 overflow-x-auto pb-0.5">
            {displayOutfit.items.slice(0, 4).map((item) => (
              <div key={item._id} className="flex-shrink-0 flex flex-col items-center gap-1">
                <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
                  <Image
                    src={item.imageUrl}
                    alt={item.customName || item.type}
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                </div>
                <span className="text-[9px] text-gray-400 capitalize w-14 text-center truncate">
                  {item.customName || item.type}
                </span>
              </div>
            ))}
            {displayOutfit.items.length > 4 && (
              <div className="flex-shrink-0 flex flex-col items-center gap-1">
                <div className="w-14 h-14 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-center text-xs text-gray-400 font-medium">
                  +{displayOutfit.items.length - 4}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="h-14 flex items-center justify-center text-xs text-gray-400">
            Items removed from wardrobe
          </div>
        )}

        {/* Weather */}
        {record.weather?.city && (
          <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
            <CloudSun className="w-3 h-3 shrink-0" />
            {record.weather.city} · {record.weather.temp}°C · {record.weather.condition}
          </div>
        )}

        {/* Explanation snippet */}
        {displayOutfit?.explanation && (
          <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2">
            {displayOutfit.explanation}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-1 border-t border-gray-50 dark:border-gray-800">
          <StatusBadge wasWorn={wasWorn} allRejected={allRejected} count={record.generatedOutfits.length} />
          <div className="flex items-center gap-2">
            {displayOutfit?.items?.length > 0 && (
              <button
                onClick={() => setShowShare(true)}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition text-gray-400 hover:text-purple-600"
                title="Share this outfit"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>
            )}
            <Link
              href={`/outfits?occasion=${encodeURIComponent(record.occasion)}`}
              className="flex items-center gap-1 text-[11px] text-purple-600 font-semibold hover:underline"
            >
              <RotateCcw className="w-3 h-3" />
              Wear Again
            </Link>
          </div>
        </div>

        {/* Share modal */}
        {showShare && (
          <ShareCardModal
            outfit={displayOutfit}
            occasion={record.occasion}
            onClose={() => setShowShare(false)}
          />
        )}
      </div>
    </motion.div>
  );
}

function StatusBadge({ wasWorn, allRejected, count }) {
  if (wasWorn) {
    return (
      <span className="flex items-center gap-1 text-[11px] text-green-600 font-medium">
        <CheckCircle2 className="w-3.5 h-3.5" /> Wore it
      </span>
    );
  }
  if (allRejected) {
    return (
      <span className="flex items-center gap-1 text-[11px] text-gray-400">
        <XCircle className="w-3.5 h-3.5" /> Skipped all
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-[11px] text-gray-400">
      <Sparkles className="w-3.5 h-3.5 text-purple-400" />
      {count} suggestion{count !== 1 ? "s" : ""} generated
    </span>
  );
}

// ── Helpers ──────────────────────────────────────────────────────

function StatCard({ icon, label, value, bg }) {
  return (
    <div className={`${bg} rounded-2xl p-4 flex items-center gap-3`}>
      <div className="shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className="font-bold text-gray-800 dark:text-white text-lg leading-tight truncate">{value}</p>
      </div>
    </div>
  );
}

function EmptyState({ hasFilters, onClear }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center mb-4">
        <History className="w-8 h-8 text-purple-300" />
      </div>
      {hasFilters ? (
        <>
          <p className="text-gray-600 dark:text-gray-400 font-medium mb-1">No results for these filters</p>
          <p className="text-sm text-gray-400 mb-4">Try removing some filters to see more history</p>
          <button
            onClick={onClear}
            className="text-sm text-purple-600 font-semibold hover:underline"
          >
            Clear filters
          </button>
        </>
      ) : (
        <>
          <p className="text-gray-600 dark:text-gray-400 font-medium mb-1">No outfit history yet</p>
          <p className="text-sm text-gray-400 mb-4">Generate your first outfit to see it here</p>
          <Link
            href="/outfits"
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 transition"
          >
            <Wand2 className="w-4 h-4" />
            Generate Outfits
          </Link>
        </>
      )}
    </motion.div>
  );
}

function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : str;
}
