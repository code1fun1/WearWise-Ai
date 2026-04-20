"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag,
  Plus,
  Check,
  Trash2,
  ExternalLink,
  Loader2,
  Tag,
  Sparkles,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";

const STORE_LINKS = [
  {
    name: "Myntra",
    color: "bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100",
    url: (type) => `https://www.myntra.com/search?rawQuery=${encodeURIComponent(type)}`,
  },
  {
    name: "AJIO",
    color: "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100",
    url: (type) => `https://www.ajio.com/search/?text=${encodeURIComponent(type)}`,
  },
  {
    name: "Flipkart",
    color: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
    url: (type) => `https://www.flipkart.com/search?q=${encodeURIComponent(type + " clothing")}`,
  },
  {
    name: "Amazon",
    color: "bg-yellow-50 text-yellow-800 border-yellow-200 hover:bg-yellow-100",
    url: (type) => `https://www.amazon.in/s?k=${encodeURIComponent(type + " clothing")}`,
  },
];

function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? "1 month ago" : `${months} months ago`;
}

function WishlistItem({ item, onToggle, onDelete, toggling, deleting }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`bg-white dark:bg-gray-800 rounded-2xl border p-4 ${
        item.purchased
          ? "border-green-100 dark:border-green-900/40 opacity-70"
          : "border-gray-100 dark:border-gray-700"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Check button */}
        <button
          onClick={() => onToggle(item)}
          disabled={toggling}
          className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition ${
            item.purchased
              ? "bg-green-500 border-green-500 text-white"
              : "border-gray-300 dark:border-gray-600 hover:border-green-400"
          }`}
        >
          {toggling ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            item.purchased && <Check className="w-3 h-3" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          {/* Title row */}
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`font-semibold text-sm capitalize ${item.purchased ? "line-through text-gray-400" : "text-gray-800 dark:text-white"}`}>
              {item.itemType}
            </p>
            {item.source === "capsule" && (
              <span className="flex items-center gap-1 text-[10px] bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full font-medium">
                <Sparkles className="w-2.5 h-2.5" />
                AI Suggested
              </span>
            )}
          </div>

          {/* Reason */}
          {item.reason && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.reason}</p>
          )}

          {/* Purchased date */}
          {item.purchased && item.purchasedAt && (
            <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
              ✓ Purchased {timeAgo(item.purchasedAt)}
            </p>
          )}

          {/* Store links — only for unpurchased */}
          {!item.purchased && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {STORE_LINKS.map((store) => (
                <a
                  key={store.name}
                  href={store.url(item.itemType)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg border font-medium transition ${store.color}`}
                >
                  {store.name}
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Meta + delete */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className="text-[10px] text-gray-400 dark:text-gray-500">{timeAgo(item.createdAt)}</span>
          <button
            onClick={() => onDelete(item._id)}
            disabled={deleting}
            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-300 hover:text-red-500 transition"
          >
            {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function WishlistPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("pending");
  const [newItem, setNewItem] = useState("");
  const [adding, setAdding] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => { fetchItems(); }, []);

  async function fetchItems() {
    try {
      const { data } = await axios.get("/api/wishlist");
      setItems(data.items);
    } catch {
      toast.error("Failed to load wishlist");
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!newItem.trim()) return;
    setAdding(true);
    try {
      const { data } = await axios.post("/api/wishlist", {
        itemType: newItem.trim(),
        source: "manual",
      });
      if (data.duplicate) {
        toast.info(`"${newItem}" is already on your list`);
      } else {
        setItems((prev) => [data.item, ...prev]);
        toast.success(`Added "${data.item.itemType}" to wishlist`);
      }
      setNewItem("");
    } catch {
      toast.error("Failed to add item");
    } finally {
      setAdding(false);
    }
  }

  async function handleToggle(item) {
    setTogglingId(item._id);
    try {
      const { data } = await axios.patch(`/api/wishlist/${item._id}`, {
        purchased: !item.purchased,
      });
      setItems((prev) => prev.map((i) => (i._id === item._id ? data.item : i)));
      toast.success(data.item.purchased ? "Marked as purchased!" : "Moved back to wishlist");
    } catch {
      toast.error("Failed to update item");
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(id) {
    setDeletingId(id);
    try {
      await axios.delete(`/api/wishlist/${id}`);
      setItems((prev) => prev.filter((i) => i._id !== id));
    } catch {
      toast.error("Failed to delete item");
    } finally {
      setDeletingId(null);
    }
  }

  const pending = items.filter((i) => !i.purchased);
  const purchased = items.filter((i) => i.purchased);
  const shown = tab === "pending" ? pending : purchased;

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <ShoppingBag className="w-6 h-6 text-purple-600" />
          Shop the Gap
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Items your wardrobe is missing — shop them on your favourite stores
        </p>
      </div>

      {/* Add item */}
      <form onSubmit={handleAdd} className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            placeholder="Add an item (e.g. white linen shirt)"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-800 dark:text-white placeholder-gray-400"
          />
        </div>
        <button
          type="submit"
          disabled={adding || !newItem.trim()}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 disabled:opacity-50 transition"
        >
          {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Add
        </button>
      </form>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-5">
        {[
          { key: "pending", label: `To Buy (${pending.length})` },
          { key: "purchased", label: `Purchased (${purchased.length})` },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${
              tab === key
                ? "bg-white dark:bg-gray-700 text-purple-700 dark:text-purple-300 shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-7 h-7 animate-spin text-purple-400" />
        </div>
      ) : shown.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">
            {tab === "pending"
              ? "Your wishlist is empty — add items above or check your Capsule Analysis"
              : "Nothing purchased yet"}
          </p>
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="space-y-3">
            {shown.map((item) => (
              <WishlistItem
                key={item._id}
                item={item}
                onToggle={handleToggle}
                onDelete={handleDelete}
                toggling={togglingId === item._id}
                deleting={deletingId === item._id}
              />
            ))}
          </div>
        </AnimatePresence>
      )}
    </main>
  );
}
