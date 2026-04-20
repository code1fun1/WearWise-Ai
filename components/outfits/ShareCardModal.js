"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Download,
  Share2,
  Loader2,
  CheckCircle2,
  ImageIcon,
} from "lucide-react";
import { toast } from "react-toastify";

/**
 * Modal that renders a shareable outfit card image and lets the user
 * download it or share it via the Web Share API.
 *
 * Props:
 *   outfit   — { items: [{ imageUrl }], explanation }
 *   occasion — string
 *   onClose  — () => void
 */
export default function ShareCardModal({ outfit, occasion, onClose }) {
  const [imgLoaded, setImgLoaded]   = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing]       = useState(false);
  const [shared, setShared]         = useState(false);

  const cardUrl = buildCardUrl(outfit, occasion);

  async function getImageBlob() {
    const res = await fetch(cardUrl);
    if (!res.ok) throw new Error("Failed to fetch share card");
    return res.blob();
  }

  async function handleDownload() {
    setDownloading(true);
    try {
      const blob = await getImageBlob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `wearwize-${occasion}-outfit.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Image saved!");
    } catch {
      toast.error("Download failed — please try again");
    } finally {
      setDownloading(false);
    }
  }

  async function handleShare() {
    setSharing(true);
    try {
      const blob = await getImageBlob();
      const file = new File([blob], `wearwize-${occasion}-outfit.png`, { type: "image/png" });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title:  `My ${occasion} outfit — styled by WearWize AI`,
          text:   outfit.explanation || "Check out this outfit I styled with WearWize!",
          files:  [file],
        });
        setShared(true);
      } else if (navigator.share) {
        // Desktop: share without file
        await navigator.share({
          title: `My ${occasion} outfit — styled by WearWize AI`,
          text:  outfit.explanation || "Check out this outfit I styled with WearWize!",
        });
        setShared(true);
      } else {
        // No Share API — fall back to download
        await handleDownload();
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        // Share cancelled by user — no toast needed
        toast.error("Sharing failed — image downloaded instead");
        await handleDownload();
      }
    } finally {
      setSharing(false);
    }
  }

  const busy = downloading || sharing;

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      >
        {/* Panel */}
        <motion.div
          key="panel"
          initial={{ scale: 0.94, opacity: 0 }}
          animate={{ scale: 1,    opacity: 1 }}
          exit={{ scale: 0.94,    opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-purple-500" />
              <h2 className="font-bold text-gray-800 dark:text-white text-sm">Share Outfit</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* Card preview */}
          <div className="relative bg-gray-950 aspect-square overflow-hidden">
            {!imgLoaded && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-gray-500">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="text-xs">Generating your card…</span>
              </div>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cardUrl}
              alt="Share card preview"
              className={`w-full h-full object-cover transition-opacity duration-300 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
              onLoad={() => setImgLoaded(true)}
            />
          </div>

          {/* Actions */}
          <div className="p-5 space-y-3">
            {/* Share (primary) */}
            <button
              onClick={handleShare}
              disabled={busy || !imgLoaded}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold text-sm hover:opacity-90 transition disabled:opacity-50 shadow-lg shadow-purple-200 dark:shadow-none"
            >
              {sharing ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Sharing…</>
              ) : shared ? (
                <><CheckCircle2 className="w-4 h-4" /> Shared!</>
              ) : (
                <><Share2 className="w-4 h-4" /> Share to Instagram / Stories</>
              )}
            </button>

            {/* Download (secondary) */}
            <button
              onClick={handleDownload}
              disabled={busy || !imgLoaded}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition disabled:opacity-50"
            >
              {downloading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Downloading…</>
              ) : (
                <><Download className="w-4 h-4" /> Save as Image</>
              )}
            </button>

            <p className="text-center text-[11px] text-gray-400">
              1080×1080 · Perfect for Instagram & Stories
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Helpers ──────────────────────────────────────────────────────

function buildCardUrl(outfit, occasion) {
  const items = (outfit?.items || [])
    .slice(0, 3)
    .map((i) => i.imageUrl)
    .filter(Boolean)
    .join(",");

  const explanation = (outfit?.explanation || "").slice(0, 140);

  const params = new URLSearchParams({
    occasion:    occasion || "casual",
    explanation,
    items,
  });

  return `/api/share-card?${params.toString()}`;
}
