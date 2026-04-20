"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Shirt, Loader2, Globe2, LayoutGrid } from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import UploadClothingModal from "@/components/wardrobe/UploadClothingModal";
import ClothingCard from "@/components/wardrobe/ClothingCard";
import WardrobeFilters from "@/components/wardrobe/WardrobeFilters";
import WardrobeGlobe from "@/components/wardrobe/WardrobeGlobe";

export default function WardrobePage() {
  const [items, setItems]           = useState([]);
  const [filtered, setFiltered]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [view, setView]             = useState("globe"); // "globe" | "grid"

  useEffect(() => { fetchWardrobe(); }, []);

  async function fetchWardrobe() {
    try {
      setLoading(true);
      const { data } = await axios.get("/api/wardrobe");
      setItems(data.items);
      setFiltered(data.items);
    } catch {
      toast.error("Failed to load wardrobe");
    } finally {
      setLoading(false);
    }
  }

  function handleUploadSuccess(newItem) {
    setItems((prev) => [newItem, ...prev]);
    setFiltered((prev) => [newItem, ...prev]);
    setShowUpload(false);
  }

  function handleDelete(deletedId) {
    setItems((prev) => prev.filter((i) => i._id !== deletedId));
    setFiltered((prev) => prev.filter((i) => i._id !== deletedId));
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Wardrobe</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {items.length} item{items.length !== 1 ? "s" : ""} in your wardrobe
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle — desktop */}
          {items.length > 0 && (
            <div className="hidden sm:flex items-center bg-gray-100 dark:bg-gray-800 rounded-xl p-1 gap-0.5">
              <button
                onClick={() => setView("globe")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  view === "globe"
                    ? "bg-white dark:bg-gray-700 text-purple-700 dark:text-purple-300 shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
                }`}
              >
                <Globe2 className="w-3.5 h-3.5" />
                Globe
              </button>
              <button
                onClick={() => setView("grid")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  view === "grid"
                    ? "bg-white dark:bg-gray-700 text-purple-700 dark:text-purple-300 shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Grid
              </button>
            </div>
          )}

          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        </div>
      </div>

      {/* ── Loading ─────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-24 text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin mr-2" />
          Loading wardrobe…
        </div>

      ) : items.length === 0 ? (
        <EmptyState onAdd={() => setShowUpload(true)} hasItems={false} />

      ) : (
        <>
          {/* Filters */}
          <WardrobeFilters items={items} onFilter={setFiltered} />

          {filtered.length === 0 ? (
            <EmptyState onAdd={() => setShowUpload(true)} hasItems={true} />
          ) : (
            <AnimatePresence mode="wait">

              {view === "globe" && (
                <motion.div
                  key="globe"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.3 }}
                  className="mt-4"
                >
                  <WardrobeGlobe items={filtered} onDelete={handleDelete} />
                </motion.div>
              )}

              {view === "grid" && (
                <motion.div
                  key="grid"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.25 }}
                  className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-4"
                >
                  {filtered.map((item, i) => (
                    <motion.div
                      key={item._id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      <ClothingCard item={item} onDelete={handleDelete} />
                    </motion.div>
                  ))}
                </motion.div>
              )}

            </AnimatePresence>
          )}
        </>
      )}

      {/* Mobile view toggle (floating pill) */}
      {items.length > 0 && !loading && (
        <div className="sm:hidden fixed bottom-24 right-4 z-30">
          <button
            onClick={() => setView(view === "globe" ? "grid" : "globe")}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-900/90 backdrop-blur text-white rounded-2xl text-xs font-semibold shadow-xl border border-white/10"
          >
            {view === "globe"
              ? <><LayoutGrid className="w-3.5 h-3.5" /> Grid view</>
              : <><Globe2 className="w-3.5 h-3.5" /> Globe view</>
            }
          </button>
        </div>
      )}

      {/* Upload modal */}
      {showUpload && (
        <UploadClothingModal
          onClose={() => setShowUpload(false)}
          onSuccess={handleUploadSuccess}
        />
      )}
    </main>
  );
}

function EmptyState({ onAdd, hasItems }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4">
        <Shirt className="w-8 h-8 text-purple-500" />
      </div>
      <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-1">
        {hasItems ? "No items match your filters" : "Your wardrobe is empty"}
      </h3>
      <p className="text-sm text-gray-400 mb-4">
        {hasItems
          ? "Try adjusting the filters above"
          : "Start by uploading your first clothing item"}
      </p>
      {!hasItems && (
        <button
          onClick={onAdd}
          className="px-5 py-2 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 transition"
        >
          Add First Item
        </button>
      )}
    </div>
  );
}
