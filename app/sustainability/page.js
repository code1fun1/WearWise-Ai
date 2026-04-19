"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Leaf,
  TrendingUp,
  AlertTriangle,
  Star,
  IndianRupee,
  Shirt,
  Loader2,
  RefreshCcw,
} from "lucide-react";
import Image from "next/image";
import axios from "axios";
import { toast } from "react-toastify";

export default function SustainabilityPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingPrice, setEditingPrice] = useState(null);
  const [priceInput, setPriceInput] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const { data: res } = await axios.get("/api/sustainability");
      setData(res);
    } catch {
      toast.error("Failed to load sustainability data");
    } finally {
      setLoading(false);
    }
  }

  async function savePrice(itemId) {
    const price = parseFloat(priceInput);
    if (isNaN(price) || price < 0) {
      toast.error("Enter a valid price");
      return;
    }
    try {
      await axios.patch(`/api/wardrobe/${itemId}/price`, { purchasePrice: price });
      setEditingPrice(null);
      setPriceInput("");
      fetchData();
      toast.success("Price saved!");
    } catch {
      toast.error("Failed to save price");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-gray-400">
        <Loader2 className="w-7 h-7 animate-spin mr-2" />
        Calculating sustainability score...
      </div>
    );
  }

  const { stats, items } = data || { stats: {}, items: [] };
  const deadItems = items.filter((i) => i.isDead);
  const underusedItems = items.filter((i) => i.isUnderused);
  const pricedItems = items.filter((i) => i.purchasePrice !== null);
  const unpricedItems = items.filter((i) => i.purchasePrice === null);

  const scoreColor =
    stats.sustainabilityScore >= 70 ? "text-green-600" :
    stats.sustainabilityScore >= 40 ? "text-yellow-600" : "text-red-500";

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Leaf className="w-6 h-6 text-green-500" />
            Wardrobe Insights
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Track cost-per-wear, sustainability, and wardrobe health
          </p>
        </div>
        <button onClick={fetchData} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition text-gray-400">
          <RefreshCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Score cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <ScoreCard
          icon={<Leaf className="w-5 h-5 text-green-500" />}
          label="Sustainability Score"
          value={`${stats.sustainabilityScore}/100`}
          bg="bg-green-50 dark:bg-green-900/20"
          valueClass={scoreColor}
        />
        <ScoreCard
          icon={<TrendingUp className="w-5 h-5 text-blue-500" />}
          label="Wardrobe Utilization"
          value={`${stats.utilizationScore}%`}
          bg="bg-blue-50 dark:bg-blue-900/20"
        />
        <ScoreCard
          icon={<IndianRupee className="w-5 h-5 text-purple-500" />}
          label="Total Wardrobe Value"
          value={stats.totalValue ? `₹${stats.totalValue.toLocaleString()}` : "—"}
          bg="bg-purple-50 dark:bg-purple-900/20"
        />
        <ScoreCard
          icon={<AlertTriangle className="w-5 h-5 text-orange-500" />}
          label="Unused Items"
          value={stats.deadItems || 0}
          bg="bg-orange-50 dark:bg-orange-900/20"
        />
      </div>

      {/* Best performers */}
      {(stats.mostWorn || stats.bestValue) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {stats.mostWorn && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 flex items-center gap-3"
            >
              <Star className="w-5 h-5 text-yellow-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 dark:text-gray-400">Most Worn Item</p>
                <p className="font-semibold text-gray-800 dark:text-white capitalize truncate">
                  {stats.mostWorn.customName || stats.mostWorn.type}
                </p>
                <p className="text-xs text-gray-400">{stats.mostWorn.wearCount} wears</p>
              </div>
              {stats.mostWorn.imageUrl && (
                <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-gray-100 shrink-0">
                  <Image src={stats.mostWorn.imageUrl} alt="" fill className="object-cover" sizes="56px" />
                </div>
              )}
            </motion.div>
          )}
          {stats.bestValue && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 flex items-center gap-3"
            >
              <IndianRupee className="w-5 h-5 text-green-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 dark:text-gray-400">Best Value Item</p>
                <p className="font-semibold text-gray-800 dark:text-white capitalize truncate">
                  {stats.bestValue.customName || stats.bestValue.type}
                </p>
                <p className="text-xs text-gray-400">₹{stats.bestValue.costPerWear}/wear</p>
              </div>
              {stats.bestValue.imageUrl && (
                <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-gray-100 shrink-0">
                  <Image src={stats.bestValue.imageUrl} alt="" fill className="object-cover" sizes="56px" />
                </div>
              )}
            </motion.div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-100 dark:border-gray-800">
        {[
          { id: "overview", label: "All Items" },
          { id: "dead", label: `Unused (${deadItems.length})` },
          { id: "unpriced", label: `Add Prices (${unpricedItems.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition -mb-px ${
              activeTab === tab.id
                ? "border-purple-600 text-purple-700 dark:text-purple-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Item list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {(activeTab === "overview" ? items :
          activeTab === "dead" ? deadItems : unpricedItems
        ).map((item) => (
          <motion.div
            key={item._id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`bg-white dark:bg-gray-800 rounded-xl border p-3 flex items-center gap-3 ${
              item.isDead
                ? "border-orange-200 dark:border-orange-800"
                : "border-gray-100 dark:border-gray-700"
            }`}
          >
            <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700 shrink-0 bg-gray-50">
              <Image src={item.imageUrl} alt={item.type} fill className="object-cover" sizes="56px" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-gray-800 dark:text-white capitalize truncate">
                {item.customName || item.type}
                {item.isDead && (
                  <span className="ml-1.5 text-[10px] bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-1.5 py-0.5 rounded-full">Never worn</span>
                )}
                {item.inLaundry && (
                  <span className="ml-1.5 text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-full">Laundry</span>
                )}
              </p>
              <p className="text-xs text-gray-400 capitalize">{item.color} {item.type}</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-gray-500 dark:text-gray-400">{item.wearCount} wears</span>
                {item.costPerWear !== null && (
                  <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                    ₹{item.costPerWear}/wear
                  </span>
                )}
              </div>
            </div>
            {/* Price edit */}
            {editingPrice === item._id ? (
              <div className="flex items-center gap-1 shrink-0">
                <input
                  type="number"
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  placeholder="₹"
                  className="w-20 px-2 py-1 text-xs border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 dark:bg-gray-700 dark:text-white"
                  onKeyDown={(e) => e.key === "Enter" && savePrice(item._id)}
                  autoFocus
                />
                <button onClick={() => savePrice(item._id)} className="text-xs px-2 py-1 bg-purple-600 text-white rounded-lg">OK</button>
                <button onClick={() => setEditingPrice(null)} className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg">X</button>
              </div>
            ) : (
              <button
                onClick={() => { setEditingPrice(item._id); setPriceInput(item.purchasePrice?.toString() || ""); }}
                className="shrink-0 text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-purple-300 hover:text-purple-600 transition"
              >
                {item.purchasePrice !== null ? `₹${item.purchasePrice}` : "+ Price"}
              </button>
            )}
          </motion.div>
        ))}
      </div>

      {items.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Leaf className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p>Add items to your wardrobe to see sustainability insights</p>
        </div>
      )}
    </main>
  );
}

function ScoreCard({ icon, label, value, bg, valueClass }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${bg} rounded-2xl p-4`}
    >
      <div className="flex items-center gap-2 mb-2">{icon}<p className="text-xs text-gray-500 dark:text-gray-400">{label}</p></div>
      <p className={`text-2xl font-bold text-gray-800 dark:text-white ${valueClass || ""}`}>{value}</p>
    </motion.div>
  );
}
