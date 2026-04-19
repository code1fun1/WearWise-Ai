"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, ImagePlus, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "react-toastify";
import Image from "next/image";
import axios from "axios";

/**
 * Modal dialog for uploading a new clothing item.
 * On success it calls onSuccess(newItem) so the parent can prepend
 * the new card without a full page refresh.
 */
export default function UploadClothingModal({ onClose, onSuccess }) {
  const fileInputRef = useRef(null);

  const [preview, setPreview] = useState(null);     // data-URL for preview
  const [file, setFile] = useState(null);           // actual File object
  const [customName, setCustomName] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiTags, setAiTags] = useState(null);       // shown after upload

  // ── File selection ────────────────────────────────────────────
  function handleFileChange(e) {
    const selected = e.target.files?.[0];
    if (!selected) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(selected.type)) {
      toast.error("Please select a JPEG, PNG, WEBP or GIF image");
      return;
    }
    if (selected.size > 10 * 1024 * 1024) {
      toast.error("Image must be smaller than 10MB");
      return;
    }

    setFile(selected);
    setAiTags(null);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(selected);
  }

  // ── Drag-and-drop ─────────────────────────────────────────────
  function handleDrop(e) {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      // Reuse the same validation by creating a synthetic event
      handleFileChange({ target: { files: [dropped] } });
    }
  }

  // ── Submit ────────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) {
      toast.error("Please select an image first");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("customName", customName);
      formData.append("notes", notes);

      const { data } = await axios.post("/api/upload-clothing", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setAiTags(data.tags);
      toast.success("Clothing item added!");
      onSuccess(data.item);
    } catch (err) {
      const msg =
        err.response?.data?.message || "Upload failed. Please try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Panel */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-800 text-lg">Add Clothing Item</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Drop zone */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className="relative border-2 border-dashed border-purple-200 rounded-xl cursor-pointer hover:border-purple-400 transition bg-purple-50/40 flex items-center justify-center"
              style={{ minHeight: 200 }}
            >
              {preview ? (
                <Image
                  src={preview}
                  alt="Preview"
                  fill
                  className="object-contain rounded-xl p-2"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-purple-400 p-8">
                  <ImagePlus className="w-10 h-10" />
                  <p className="text-sm font-medium">
                    Click or drag & drop an image
                  </p>
                  <p className="text-xs text-gray-400">
                    JPEG, PNG, WEBP up to 10MB
                  </p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {/* AI tags preview (shown after upload) */}
            {aiTags && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold mb-1">
                  <CheckCircle2 className="w-4 h-4" />
                  AI Tags Detected
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    aiTags.type,
                    aiTags.color,
                    aiTags.pattern,
                    aiTags.style,
                    aiTags.season,
                    ...(aiTags.occasion || []),
                  ].map((tag, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-green-100 rounded-full text-xs capitalize"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Optional name */}
            <input
              type="text"
              placeholder="Custom name (optional)"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm"
            />

            {/* Optional notes */}
            <textarea
              placeholder="Notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm resize-none"
            />

            <button
              type="submit"
              disabled={loading || !file}
              className="w-full py-2.5 rounded-lg bg-purple-600 text-white font-semibold text-sm hover:bg-purple-700 transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading & tagging…
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload & Analyse
                </>
              )}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
