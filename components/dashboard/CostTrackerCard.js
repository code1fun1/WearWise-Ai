"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  IndianRupee,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Loader2,
  Tag,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import axios from "axios";

export default function CostTrackerCard() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("/api/cost-summary")
      .then(({ data }) => setData(data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <CardShell>
        <div className="flex items-center justify-center py-10 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Calculating costs…
        </div>
      </CardShell>
    );
  }

  if (!data || data.empty) return null;

  if (!data.hasPrices) {
    return (
      <CardShell>
        <NoPricesState totalItems={data.totalItems} />
      </CardShell>
    );
  }

  const maxCPW = data.mostExpensive[0]?.costPerWear || 1;

  return (
    <CardShell>
      {/* Top stats strip */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <StatPill
          icon={<IndianRupee className="w-3.5 h-3.5 text-emerald-600" />}
          label="Wardrobe Value"
          value={`₹${data.totalValue.toLocaleString("en-IN")}`}
          bg="bg-emerald-50 dark:bg-emerald-900/20"
          valueColor="text-emerald-700 dark:text-emerald-400"
        />
        <StatPill
          icon={<TrendingDown className="w-3.5 h-3.5 text-blue-600" />}
          label="Avg Cost/Wear"
          value={data.avgCostPerWear ? `₹${data.avgCostPerWear}` : "—"}
          bg="bg-blue-50 dark:bg-blue-900/20"
          valueColor="text-blue-700 dark:text-blue-400"
        />
        <StatPill
          icon={<AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
          label="Never Worn"
          value={data.deadCount}
          bg={data.deadCount > 0 ? "bg-amber-50 dark:bg-amber-900/20" : "bg-gray-50 dark:bg-gray-800"}
          valueColor={data.deadCount > 0 ? "text-amber-700 dark:text-amber-400" : "text-gray-500"}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

        {/* Most expensive per wear */}
        <div>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-red-400" />
            Most Expensive Per Wear
          </p>
          <div className="space-y-3">
            {data.mostExpensive.map((item, i) => (
              <CostRow
                key={item._id}
                item={item}
                barWidth={Math.round((item.costPerWear / maxCPW) * 100)}
                rank={i}
                avg={data.avgCostPerWear}
              />
            ))}
          </div>
        </div>

        {/* Right column: best value + unused money */}
        <div className="space-y-4">

          {/* Best value */}
          {data.bestValue && (
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                Best Value
              </p>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800">
                <ItemThumb item={data.bestValue} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 dark:text-white truncate capitalize">
                    {data.bestValue.customName || data.bestValue.type}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    ₹{data.bestValue.purchasePrice?.toLocaleString("en-IN")} · {data.bestValue.wearCount} wears
                  </p>
                  <p className="text-sm font-bold text-purple-600 dark:text-purple-400 mt-0.5">
                    ₹{data.bestValue.costPerWear}/wear ✨
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Unused money warning */}
          {data.unusedValue > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800"
            >
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-red-700 dark:text-red-400">
                  ₹{data.unusedValue.toLocaleString("en-IN")} sitting idle
                </p>
                <p className="text-xs text-red-500 dark:text-red-400 mt-0.5">
                  {data.deadCount} item{data.deadCount !== 1 ? "s" : ""} you own but have never worn
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Footer link */}
      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <p className="text-xs text-gray-400">
          Based on {data.pricedItems} of {data.totalItems} items with prices added
        </p>
        <Link
          href="/sustainability"
          className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 font-semibold hover:underline"
        >
          Full report <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </CardShell>
  );
}

// ── Sub-components ────────────────────────────────────────────────

function CostRow({ item, barWidth, rank, avg }) {
  const label   = item.customName || item.type;
  const isWorn  = item.wearCount > 0;

  // Color logic: top item is red, second orange, third yellow
  const barColors = [
    "bg-red-400 dark:bg-red-500",
    "bg-orange-400 dark:bg-orange-500",
    "bg-yellow-400 dark:bg-yellow-500",
  ];
  const badgeColors = [
    "text-red-600 dark:text-red-400",
    "text-orange-600 dark:text-orange-400",
    "text-yellow-600 dark:text-yellow-400",
  ];
  const emoji = rank === 0 ? "😬" : rank === 1 ? "😐" : "🙂";

  return (
    <div className="flex items-center gap-3">
      <ItemThumb item={item} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1 mb-1">
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate capitalize">
            {label}
          </span>
          <span className={`text-xs font-bold shrink-0 ${badgeColors[rank]}`}>
            ₹{item.costPerWear}/wear {emoji}
          </span>
        </div>
        {/* Bar */}
        <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${barWidth}%` }}
            transition={{ duration: 0.6, delay: rank * 0.1, ease: "easeOut" }}
            className={`h-full rounded-full ${barColors[rank]}`}
          />
        </div>
        <p className="text-[10px] text-gray-400 mt-0.5">
          ₹{item.purchasePrice?.toLocaleString("en-IN")} · {isWorn ? `${item.wearCount} wear${item.wearCount !== 1 ? "s" : ""}` : "never worn"}
        </p>
      </div>
    </div>
  );
}

function ItemThumb({ item, size = "md" }) {
  const dim = size === "sm" ? "w-9 h-9" : "w-11 h-11";
  return (
    <div className={`${dim} rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 shrink-0`}>
      <Image
        src={item.imageUrl}
        alt={item.customName || item.type}
        width={44}
        height={44}
        className="w-full h-full object-cover"
      />
    </div>
  );
}

function StatPill({ icon, label, value, bg, valueColor }) {
  return (
    <div className={`${bg} rounded-xl p-3 flex flex-col gap-1`}>
      <div className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">
        {icon}
        {label}
      </div>
      <p className={`text-base font-bold ${valueColor} leading-tight`}>{value}</p>
    </div>
  );
}

function NoPricesState({ totalItems }) {
  return (
    <div className="flex flex-col items-center py-8 text-center gap-3">
      <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
        <Tag className="w-6 h-6 text-emerald-400" />
      </div>
      <div>
        <p className="font-semibold text-gray-800 dark:text-white text-sm">Track your cost per wear</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xs mx-auto">
          Add purchase prices to your {totalItems} wardrobe item{totalItems !== 1 ? "s" : ""} to see exactly how much each wear costs you
        </p>
      </div>
      <Link
        href="/sustainability"
        className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 transition"
      >
        Add Prices <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}

function CardShell({ children }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.18 }}
      className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <IndianRupee className="w-5 h-5 text-emerald-500" />
          <h2 className="font-bold text-gray-800 dark:text-white">Cost Tracker</h2>
        </div>
        <Link
          href="/sustainability"
          className="text-xs text-purple-600 dark:text-purple-400 font-semibold hover:underline flex items-center gap-1"
        >
          Details <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      {children}
    </motion.section>
  );
}
