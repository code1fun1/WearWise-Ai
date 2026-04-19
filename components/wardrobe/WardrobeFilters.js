"use client";

import { useState } from "react";

const TYPE_OPTIONS = [
  "all", "t-shirt", "shirt", "blouse", "dress", "skirt", "jeans",
  "trousers", "shorts", "jacket", "coat", "sweater", "hoodie",
  "kurta", "saree", "lehenga", "suit", "blazer", "sneakers",
  "shoes", "sandals", "boots", "heels", "accessory",
];

const SEASON_OPTIONS = ["all", "summer", "winter", "monsoon", "spring"];

const OCCASION_OPTIONS = [
  "all", "casual", "office", "party", "wedding",
  "date", "festive", "outdoor", "gym", "beach", "formal",
];

/**
 * Filter bar for the wardrobe grid.
 * Calls onFilter(filteredItems) whenever any filter changes.
 */
export default function WardrobeFilters({ items, onFilter }) {
  const [type, setType] = useState("all");
  const [season, setSeason] = useState("all");
  const [occasion, setOccasion] = useState("all");
  const [search, setSearch] = useState("");

  function applyFilters({ newType, newSeason, newOccasion, newSearch }) {
    const t = newType ?? type;
    const s = newSeason ?? season;
    const o = newOccasion ?? occasion;
    const q = newSearch ?? search;

    const result = items.filter((item) => {
      const matchType = t === "all" || item.type === t;
      const matchSeason = s === "all" || item.season === s || item.season === "all";
      const matchOccasion =
        o === "all" || (item.occasion && item.occasion.includes(o));
      const matchSearch =
        !q ||
        item.type?.toLowerCase().includes(q.toLowerCase()) ||
        item.color?.toLowerCase().includes(q.toLowerCase()) ||
        item.style?.toLowerCase().includes(q.toLowerCase()) ||
        item.customName?.toLowerCase().includes(q.toLowerCase());

      return matchType && matchSeason && matchOccasion && matchSearch;
    });

    onFilter(result);
  }

  function handleType(v) {
    setType(v);
    applyFilters({ newType: v });
  }
  function handleSeason(v) {
    setSeason(v);
    applyFilters({ newSeason: v });
  }
  function handleOccasion(v) {
    setOccasion(v);
    applyFilters({ newOccasion: v });
  }
  function handleSearch(v) {
    setSearch(v);
    applyFilters({ newSearch: v });
  }

  return (
    <div className="flex flex-wrap gap-3 items-center mb-2">
      {/* Search */}
      <input
        type="text"
        placeholder="Search…"
        value={search}
        onChange={(e) => handleSearch(e.target.value)}
        className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 w-36"
      />

      {/* Type */}
      <select
        value={type}
        onChange={(e) => handleType(e.target.value)}
        className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 capitalize"
      >
        {TYPE_OPTIONS.map((o) => (
          <option key={o} value={o} className="capitalize">
            {o === "all" ? "All types" : o}
          </option>
        ))}
      </select>

      {/* Season */}
      <select
        value={season}
        onChange={(e) => handleSeason(e.target.value)}
        className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 capitalize"
      >
        {SEASON_OPTIONS.map((o) => (
          <option key={o} value={o} className="capitalize">
            {o === "all" ? "All seasons" : o}
          </option>
        ))}
      </select>

      {/* Occasion */}
      <select
        value={occasion}
        onChange={(e) => handleOccasion(e.target.value)}
        className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 capitalize"
      >
        {OCCASION_OPTIONS.map((o) => (
          <option key={o} value={o} className="capitalize">
            {o === "all" ? "All occasions" : o}
          </option>
        ))}
      </select>
    </div>
  );
}
