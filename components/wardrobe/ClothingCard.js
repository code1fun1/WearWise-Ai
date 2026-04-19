"use client";

import Image from "next/image";
import { useState } from "react";
import { Trash2, Tag } from "lucide-react";
import { toast } from "react-toastify";
import axios from "axios";

/**
 * Single clothing item card shown in the wardrobe grid.
 * Shows image + AI tags on hover, with a delete button.
 */
export default function ClothingCard({ item, onDelete }) {
  const [deleting, setDeleting] = useState(false);
  const [hovered, setHovered] = useState(false);

  async function handleDelete() {
    if (!confirm("Remove this item from your wardrobe?")) return;
    setDeleting(true);
    try {
      await axios.delete(`/api/wardrobe/${item._id}`);
      toast.success("Item removed");
      onDelete(item._id);
    } catch {
      toast.error("Failed to remove item");
      setDeleting(false);
    }
  }

  return (
    <div
      className="relative group rounded-xl overflow-hidden border border-gray-100 bg-white shadow-sm hover:shadow-md transition"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image */}
      <div className="relative aspect-square bg-gray-50">
        <Image
          src={item.imageUrl}
          alt={item.customName || item.type}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 50vw, 20vw"
        />

        {/* Hover overlay with tags */}
        {hovered && (
          <div className="absolute inset-0 bg-black/50 flex flex-col justify-end p-2 gap-1">
            <div className="flex flex-wrap gap-1">
              {[item.color, item.pattern, item.style].map((tag, i) => (
                <span
                  key={i}
                  className="px-1.5 py-0.5 bg-white/20 text-white text-[10px] rounded-full capitalize"
                >
                  {tag}
                </span>
              ))}
            </div>
            {item.occasion?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {item.occasion.slice(0, 3).map((occ, i) => (
                  <span
                    key={i}
                    className="px-1.5 py-0.5 bg-purple-500/60 text-white text-[10px] rounded-full capitalize"
                  >
                    {occ}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Delete button */}
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/90 text-red-500 opacity-0 group-hover:opacity-100 transition hover:bg-red-50 disabled:opacity-50"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Footer */}
      <div className="px-2.5 py-2">
        <p className="text-xs font-semibold text-gray-700 capitalize truncate">
          {item.customName || item.type}
        </p>
        <p className="text-[10px] text-gray-400 capitalize truncate">
          {item.color} · {item.season}
        </p>
      </div>
    </div>
  );
}
