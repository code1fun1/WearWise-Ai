"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ThumbsUp, ThumbsDown, Sparkles, Share2 } from "lucide-react";
import ShareCardModal from "@/components/outfits/ShareCardModal";

/**
 * Displays a single generated outfit.
 * Shows clothing item images in a row + AI explanation.
 * Select / Reject buttons emit callbacks to the parent.
 */
export default function OutfitCard({ outfit, index, onSelect, onReject, selected, rejected, occasion }) {
  const isSelected = selected;
  const isRejected = rejected;
  const [showShare, setShowShare] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`rounded-2xl border-2 p-4 transition-all ${
        isSelected
          ? "border-green-400 bg-green-50"
          : isRejected
          ? "border-gray-200 bg-gray-50 opacity-50"
          : "border-gray-200 bg-white hover:border-purple-300"
      }`}
    >
      {/* Share modal */}
      {showShare && (
        <ShareCardModal
          outfit={outfit}
          occasion={occasion || "casual"}
          onClose={() => setShowShare(false)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-500" />
          <span className="text-sm font-semibold text-gray-700">
            Outfit {index + 1}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {isSelected && (
            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">
              Selected
            </span>
          )}
          {isRejected && (
            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full font-medium">
              Skipped
            </span>
          )}
          <button
            onClick={() => setShowShare(true)}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition text-gray-400 hover:text-purple-600"
            title="Share this outfit"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Clothing item images */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-3">
        {outfit.items.map((item) => (
          <div
            key={item._id}
            className="flex-shrink-0 flex flex-col items-center gap-1"
          >
            <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
              <Image
                src={item.imageUrl}
                alt={item.customName || item.type}
                fill
                className="object-cover"
                sizes="80px"
              />
            </div>
            <span className="text-[10px] text-gray-500 capitalize text-center w-20 truncate">
              {item.customName || item.type}
            </span>
          </div>
        ))}
      </div>

      {/* AI explanation */}
      <p className="text-xs text-gray-500 mb-4 leading-relaxed">
        {outfit.explanation}
      </p>

      {/* Actions */}
      {!isSelected && !isRejected && (
        <div className="flex gap-2">
          <button
            onClick={() => onSelect(index)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 transition"
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            Wear This
          </button>
          <button
            onClick={() => onReject(index)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition"
          >
            <ThumbsDown className="w-3.5 h-3.5" />
            Skip
          </button>
        </div>
      )}
    </motion.div>
  );
}
