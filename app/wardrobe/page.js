"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Shirt, Loader2 } from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import UploadClothingModal from "@/components/wardrobe/UploadClothingModal";
import ClothingCard from "@/components/wardrobe/ClothingCard";
import WardrobeFilters from "@/components/wardrobe/WardrobeFilters";

export default function WardrobePage() {
  const [items, setItems] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);

  // Fetch wardrobe on mount
  useEffect(() => {
    fetchWardrobe();
  }, []);

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

  // Prepend new item optimistically without refetch
  function handleUploadSuccess(newItem) {
    setItems((prev) => [newItem, ...prev]);
    setFiltered((prev) => [newItem, ...prev]);
    setShowUpload(false);
  }

  // Remove deleted item from state
  function handleDelete(deletedId) {
    setItems((prev) => prev.filter((i) => i._id !== deletedId));
    setFiltered((prev) => prev.filter((i) => i._id !== deletedId));
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Wardrobe</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {items.length} item{items.length !== 1 ? "s" : ""} in your wardrobe
          </p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Item
        </button>
      </div>

      {/* Filters */}
      {items.length > 0 && (
        <WardrobeFilters
          items={items}
          onFilter={setFiltered}
        />
      )}

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-24 text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin mr-2" />
          Loading wardrobe…
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState onAdd={() => setShowUpload(true)} hasItems={items.length > 0} />
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-4"
        >
          {filtered.map((item, i) => (
            <motion.div
              key={item._id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <ClothingCard item={item} onDelete={handleDelete} />
            </motion.div>
          ))}
        </motion.div>
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
      <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center mb-4">
        <Shirt className="w-8 h-8 text-purple-500" />
      </div>
      <h3 className="font-semibold text-gray-700 mb-1">
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
