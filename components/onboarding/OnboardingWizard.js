"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  MapPin,
  Tag,
  Shirt,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Upload,
  ImagePlus,
  Loader2,
  PartyPopper,
  X,
} from "lucide-react";
import Image from "next/image";
import axios from "axios";
import { toast } from "react-toastify";
import { compressImage } from "@/lib/compressImage";

const OCCASIONS = [
  { id: "casual",      label: "Casual",       emoji: "👕" },
  { id: "office",      label: "Office",        emoji: "💼" },
  { id: "party",       label: "Party",         emoji: "🎉" },
  { id: "wedding",     label: "Wedding",       emoji: "💍" },
  { id: "date",        label: "Date Night",    emoji: "🌹" },
  { id: "festive",     label: "Festive",       emoji: "✨" },
  { id: "outdoor",     label: "Outdoor",       emoji: "🌿" },
  { id: "gym",         label: "Gym",           emoji: "💪" },
  { id: "beach",       label: "Beach",         emoji: "🏖️" },
  { id: "formal",      label: "Formal",        emoji: "🎩" },
];

const STEPS = ["welcome", "city", "occasions", "upload", "done"];

const variants = {
  enter: (dir) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center:        ({ x: 0, opacity: 1 }),
  exit:  (dir) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

export default function OnboardingWizard({ userName, onComplete }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection]  = useState(1);

  // Step 2 — city
  const [city, setCity] = useState("");

  // Step 3 — occasions
  const [occasions, setOccasions] = useState([]);

  // Step 4 — upload
  const fileInputRef = useRef(null);
  const [preview, setPreview]     = useState(null);
  const [file, setFile]           = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded]   = useState(false);

  // Saving state for final step
  const [saving, setSaving] = useState(false);

  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;

  function go(delta) {
    setDirection(delta);
    setStepIndex((i) => i + delta);
  }

  function toggleOccasion(id) {
    setOccasions((prev) =>
      prev.includes(id) ? prev.filter((o) => o !== id) : [...prev, id]
    );
  }

  async function handleFileChange(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) { toast.error("Image must be under 10MB"); return; }
    setUploaded(false);

    const { file: compressed } = await compressImage(f);
    setFile(compressed);

    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(compressed);
  }

  function handleDrop(e) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) handleFileChange({ target: { files: [f] } });
  }

  async function uploadItem() {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      await axios.post("/api/upload-clothing", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUploaded(true);
      toast.success("Item added to your wardrobe!");
    } catch {
      toast.error("Upload failed — you can add items later from the Wardrobe page.");
    } finally {
      setUploading(false);
    }
  }

  async function finish() {
    setSaving(true);
    try {
      await axios.patch("/api/profile", {
        city: city.trim(),
        commonOccasions: occasions,
        onboardingCompleted: true,
      });
    } catch {
      // Non-fatal — still dismiss
    } finally {
      setSaving(false);
      onComplete();
    }
  }

  // Called when user clicks Next/Done on each step
  async function handleNext() {
    if (step === "done") { await finish(); return; }
    if (step === "upload" && file && !uploaded) {
      await uploadItem();
      // Whether upload succeeded or not, advance
    }
    go(1);
  }

  const canNext =
    step === "welcome"   ? true :
    step === "city"      ? city.trim().length > 0 :
    step === "occasions" ? occasions.length > 0 :
    step === "upload"    ? true : // skip allowed
    true;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Progress bar */}
        <div className="h-1 bg-gray-100 dark:bg-gray-800">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
            animate={{ width: `${((stepIndex) / (STEPS.length - 1)) * 100}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>

        {/* Step counter */}
        {step !== "done" && (
          <div className="flex items-center justify-between px-6 pt-4 pb-0">
            <span className="text-xs text-gray-400 font-medium">
              Step {stepIndex + 1} of {STEPS.length - 1}
            </span>
            {stepIndex > 0 && step !== "done" && (
              <button
                onClick={() => go(-1)}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
            )}
          </div>
        )}

        {/* Step content */}
        <div className="px-8 py-6 min-h-[360px] flex flex-col">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28, ease: "easeInOut" }}
              className="flex flex-col flex-1"
            >
              {step === "welcome" && (
                <WelcomeStep userName={userName} />
              )}
              {step === "city" && (
                <CityStep city={city} setCity={setCity} />
              )}
              {step === "occasions" && (
                <OccasionsStep occasions={occasions} toggleOccasion={toggleOccasion} />
              )}
              {step === "upload" && (
                <UploadStep
                  fileInputRef={fileInputRef}
                  preview={preview}
                  file={file}
                  uploading={uploading}
                  uploaded={uploaded}
                  handleFileChange={handleFileChange}
                  handleDrop={handleDrop}
                />
              )}
              {step === "done" && (
                <DoneStep userName={userName} itemUploaded={uploaded} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer actions */}
        <div className="px-8 pb-7 flex flex-col gap-2">
          <button
            onClick={handleNext}
            disabled={!canNext || uploading || saving}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold text-sm hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-purple-200"
          >
            {saving || uploading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Please wait…</>
            ) : step === "done" ? (
              <><PartyPopper className="w-4 h-4" /> Let&apos;s Go!</>
            ) : (
              <>Continue <ArrowRight className="w-4 h-4" /></>
            )}
          </button>

          {/* Skip option for upload step */}
          {step === "upload" && !uploaded && (
            <button
              onClick={() => go(1)}
              className="text-xs text-gray-400 hover:text-gray-600 transition text-center py-1"
            >
              Skip for now — I&apos;ll add items later
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ── Step sub-components ───────────────────────────────────────────

function WelcomeStep({ userName }) {
  return (
    <div className="flex flex-col items-center text-center gap-4 pt-4">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-200">
        <Sparkles className="w-8 h-8 text-white" />
      </div>
      <div>
        <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">
          Welcome, {userName?.split(" ")[0]}!
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 max-w-xs mx-auto">
          WearWize is your personal AI stylist. Let&apos;s set you up in under a minute so your outfits are perfectly tailored to you.
        </p>
      </div>
      <div className="grid grid-cols-3 gap-3 w-full mt-2">
        {[
          { icon: <Shirt className="w-5 h-5 text-purple-500" />, label: "Upload clothes" },
          { icon: <Sparkles className="w-5 h-5 text-pink-500" />, label: "Get AI outfits" },
          { icon: <CheckCircle2 className="w-5 h-5 text-green-500" />, label: "Look great" },
        ].map((f) => (
          <div key={f.label} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 flex flex-col items-center gap-1.5">
            {f.icon}
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{f.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CityStep({ city, setCity }) {
  return (
    <div className="flex flex-col gap-5 pt-2">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
          <MapPin className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Where are you based?</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">We use this to make weather-aware outfit suggestions</p>
        </div>
      </div>
      <input
        type="text"
        placeholder="e.g. Mumbai, Delhi, Bangalore…"
        value={city}
        onChange={(e) => setCity(e.target.value)}
        autoFocus
        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm"
      />
      <div className="flex flex-wrap gap-2">
        {["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Pune"].map((c) => (
          <button
            key={c}
            onClick={() => setCity(c)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
              city === c
                ? "bg-purple-100 border-purple-300 text-purple-700 dark:bg-purple-900/40 dark:border-purple-600 dark:text-purple-300"
                : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-purple-200 hover:text-purple-600"
            }`}
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}

function OccasionsStep({ occasions, toggleOccasion }) {
  return (
    <div className="flex flex-col gap-4 pt-2">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-pink-100 dark:bg-pink-900/40 flex items-center justify-center shrink-0">
          <Tag className="w-5 h-5 text-pink-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">What occasions do you dress for?</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">Pick all that apply — we&apos;ll tailor suggestions to these</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {OCCASIONS.map((o) => {
          const active = occasions.includes(o.id);
          return (
            <button
              key={o.id}
              onClick={() => toggleOccasion(o.id)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition ${
                active
                  ? "bg-purple-50 border-purple-300 text-purple-700 dark:bg-purple-900/40 dark:border-purple-600 dark:text-purple-300"
                  : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-purple-200 hover:bg-purple-50/50"
              }`}
            >
              <span>{o.emoji}</span>
              {o.label}
              {active && <CheckCircle2 className="w-3.5 h-3.5 ml-auto text-purple-500" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function UploadStep({ fileInputRef, preview, file, uploading, uploaded, handleFileChange, handleDrop }) {
  return (
    <div className="flex flex-col gap-4 pt-2">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/40 flex items-center justify-center shrink-0">
          <Shirt className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Add your first clothing item</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">AI will auto-tag it by type, color, style and more</p>
        </div>
      </div>

      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => !uploaded && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl flex items-center justify-center transition cursor-pointer ${
          uploaded
            ? "border-green-300 bg-green-50 dark:bg-green-900/20"
            : "border-purple-200 bg-purple-50/40 hover:border-purple-400"
        }`}
        style={{ minHeight: 160 }}
      >
        {uploaded ? (
          <div className="flex flex-col items-center gap-2 py-6">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
            <p className="text-sm font-semibold text-green-700 dark:text-green-400">Item added!</p>
          </div>
        ) : preview ? (
          <Image
            src={preview}
            alt="Preview"
            fill
            className="object-contain rounded-2xl p-2"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-purple-400 p-8">
            <ImagePlus className="w-10 h-10" />
            <p className="text-sm font-medium text-center">Click or drag & drop a photo of a clothing item</p>
            <p className="text-xs text-gray-400">JPEG, PNG or WEBP · max 10MB</p>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {file && !uploaded && (
        <button
          onClick={async (e) => {
            e.stopPropagation();
            // Handled by parent handleNext, but allow direct click too
          }}
          className="text-xs text-purple-600 text-center"
        >
          Hit Continue to upload & analyse with AI
        </button>
      )}
    </div>
  );
}

function DoneStep({ userName, itemUploaded }) {
  return (
    <div className="flex flex-col items-center text-center gap-5 pt-4">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
        className="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-xl shadow-purple-200"
      >
        <PartyPopper className="w-10 h-10 text-white" />
      </motion.div>
      <div>
        <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">You&apos;re all set!</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 max-w-xs mx-auto">
          {itemUploaded
            ? "Your first item is in your wardrobe. Keep adding more for better outfit suggestions!"
            : "Head to your wardrobe and start uploading your clothes. The more you add, the smarter WearWize gets."}
        </p>
      </div>
      <div className="flex flex-col gap-2 w-full">
        {[
          "Add more clothes to unlock outfit suggestions",
          "Chat with your AI stylist any time",
          "We learn your style with every choice you make",
        ].map((tip) => (
          <div key={tip} className="flex items-center gap-2.5 bg-purple-50 dark:bg-purple-900/20 rounded-xl px-4 py-2.5">
            <CheckCircle2 className="w-4 h-4 text-purple-500 shrink-0" />
            <span className="text-xs text-gray-600 dark:text-gray-400 text-left">{tip}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
