"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Loader2,
  Shirt,
  Wand2,
} from "lucide-react";
import Image from "next/image";
import axios from "axios";
import { toast } from "react-toastify";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function CalendarPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [plans, setPlans] = useState({});
  const [wardrobe, setWardrobe] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [occasion, setOccasion] = useState("casual");
  const [note, setNote] = useState("");

  const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`;

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`/api/outfit-plan?month=${monthKey}`);
      const planMap = {};
      data.plans.forEach((p) => { planMap[p.date] = p; });
      setPlans(planMap);
    } catch {
      toast.error("Failed to load plans");
    } finally {
      setLoading(false);
    }
  }, [monthKey]);

  useEffect(() => {
    fetchPlans();
    axios.get("/api/wardrobe").then(({ data }) => setWardrobe(data.items)).catch(() => {});
  }, [fetchPlans]);

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  function openModal(dateStr) {
    setSelectedDate(dateStr);
    const existing = plans[dateStr];
    setSelectedItems(existing?.items?.map((i) => i._id) || []);
    setOccasion(existing?.occasion || "casual");
    setNote(existing?.note || "");
    setModalOpen(true);
  }

  function toggleItem(id) {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }

  async function savePlan() {
    if (!selectedItems.length) {
      toast.error("Select at least one clothing item");
      return;
    }
    setSaving(true);
    try {
      await axios.post("/api/outfit-plan", {
        date: selectedDate,
        occasion,
        items: selectedItems,
        note,
      });
      toast.success("Outfit planned!");
      setModalOpen(false);
      fetchPlans();
    } catch {
      toast.error("Failed to save plan");
    } finally {
      setSaving(false);
    }
  }

  async function removePlan(dateStr) {
    try {
      await axios.delete(`/api/outfit-plan?date=${dateStr}`);
      setPlans((prev) => {
        const next = { ...prev };
        delete next[dateStr];
        return next;
      });
      toast.success("Plan removed");
    } catch {
      toast.error("Failed to remove plan");
    }
  }

  // Build calendar grid
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-purple-600" />
            Outfit Calendar
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Plan your outfits ahead of time</p>
        </div>
        {loading && <Loader2 className="w-5 h-5 animate-spin text-gray-400" />}
      </div>

      {/* Month navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <h2 className="font-bold text-gray-800 dark:text-white text-lg">
            {MONTHS[month]} {year}
          </h2>
          <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
            <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Day labels */}
        <div className="grid grid-cols-7 border-b border-gray-100 dark:border-gray-700">
          {DAYS.map((d) => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-gray-400 dark:text-gray-500">
              {d}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            if (!day) return <div key={`empty-${i}`} className="aspect-square border-b border-r border-gray-50 dark:border-gray-800" />;

            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const plan = plans[dateStr];
            const isToday = dateStr === today.toISOString().split("T")[0];

            return (
              <div
                key={dateStr}
                onClick={() => openModal(dateStr)}
                className={`aspect-square border-b border-r border-gray-50 dark:border-gray-800 p-1 cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/20 transition relative group ${
                  isToday ? "bg-purple-50 dark:bg-purple-900/30" : ""
                }`}
              >
                <span
                  className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${
                    isToday
                      ? "bg-purple-600 text-white"
                      : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {day}
                </span>

                {plan && (
                  <>
                    <div className="flex gap-0.5 mt-0.5 flex-wrap">
                      {plan.items.slice(0, 2).map((item) => (
                        <div
                          key={item._id}
                          className="relative w-5 h-5 rounded overflow-hidden border border-white dark:border-gray-700"
                        >
                          <Image src={item.imageUrl} alt="" fill className="object-cover" sizes="20px" />
                        </div>
                      ))}
                      {plan.items.length > 2 && (
                        <span className="text-[9px] text-purple-600 dark:text-purple-400 font-bold">
                          +{plan.items.length - 2}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); removePlan(dateStr); }}
                      className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white rounded-full hidden group-hover:flex items-center justify-center text-[10px]"
                    >
                      ×
                    </button>
                  </>
                )}

                {!plan && (
                  <Plus className="w-3 h-3 text-gray-300 dark:text-gray-600 absolute bottom-1 right-1 hidden group-hover:block" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Plan outfit modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
                <div>
                  <h3 className="font-bold text-gray-800 dark:text-white">Plan Outfit</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{selectedDate}</p>
                </div>
                <button onClick={() => setModalOpen(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 p-5 space-y-4">
                {/* Occasion */}
                <div>
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Occasion</label>
                  <select
                    value={occasion}
                    onChange={(e) => setOccasion(e.target.value)}
                    className="mt-1.5 w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 dark:text-white"
                  >
                    {["casual", "office", "smart casual", "party", "wedding", "date", "festive", "outdoor", "gym", "formal"].map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>

                {/* Pick items */}
                <div>
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                    Select Items ({selectedItems.length} selected)
                  </label>
                  <div className="mt-2 grid grid-cols-4 gap-2">
                    {wardrobe.map((item) => {
                      const selected = selectedItems.includes(item._id);
                      return (
                        <button
                          key={item._id}
                          onClick={() => toggleItem(item._id)}
                          className={`relative aspect-square rounded-xl overflow-hidden border-2 transition ${
                            selected
                              ? "border-purple-500 ring-2 ring-purple-300"
                              : "border-gray-100 dark:border-gray-600 hover:border-purple-300"
                          }`}
                        >
                          <Image src={item.imageUrl} alt={item.type} fill className="object-cover" sizes="80px" />
                          {selected && (
                            <div className="absolute inset-0 bg-purple-600/20 flex items-center justify-center">
                              <div className="w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center">
                                <span className="text-white text-[10px] font-bold">✓</span>
                              </div>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Note */}
                <div>
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Note (optional)</label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="e.g. Priya's wedding rehearsal"
                    className="mt-1.5 w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 dark:text-white dark:placeholder-gray-500"
                  />
                </div>
              </div>

              <div className="p-5 border-t border-gray-100 dark:border-gray-700">
                <button
                  onClick={savePlan}
                  disabled={saving || !selectedItems.length}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold text-sm transition disabled:opacity-60"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shirt className="w-4 h-4" />}
                  {saving ? "Saving..." : "Save Outfit Plan"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
