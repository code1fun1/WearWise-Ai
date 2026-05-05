"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  ExternalLink,
  Sparkles,
  Clock,
  MapPin,
  Check,
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
  const [gcalConnected, setGcalConnected] = useState(false);
  const [gcalEvents, setGcalEvents] = useState([]);
  const [gcalLoading, setGcalLoading] = useState(false);
  const plansRef = useRef({});

  const [suggestModalOpen, setSuggestModalOpen] = useState(false);
  const [suggestingEvent, setSuggestingEvent] = useState(null);
  const [suggestedOutfits, setSuggestedOutfits] = useState([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [savingSuggestion, setSavingSuggestion] = useState(null);

  const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`;

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`/api/outfit-plan?month=${monthKey}`);
      const planMap = {};
      data.plans.forEach((p) => { planMap[p.date] = p; });
      plansRef.current = planMap;
      setPlans(planMap);
    } catch {
      toast.error("Failed to load plans");
    } finally {
      setLoading(false);
    }
  }, [monthKey]);

  const fetchGoogleCalendar = useCallback(async () => {
    setGcalLoading(true);
    try {
      const { data } = await axios.get("/api/google-calendar");
      setGcalConnected(data.connected || false);
      if (data.events) {
        setGcalEvents(data.events);
        data.events.forEach((event) => {
          if (!plansRef.current[event.date] && event.occasion !== "casual") {
            toast.info(`Upcoming ${event.occasion} event: ${event.title}`, { autoClose: 3000 });
          }
        });
      }
    } catch {
      setGcalConnected(false);
    } finally {
      setGcalLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
    fetchGoogleCalendar();
    axios.get("/api/wardrobe").then(({ data }) => setWardrobe(data.items)).catch(() => {});
  }, [fetchPlans, fetchGoogleCalendar]);

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  function openModal(dateStr, suggestedOccasion) {
    setSelectedDate(dateStr);
    const existing = plans[dateStr];
    setSelectedItems(existing?.items?.map((i) => i._id) || []);
    setOccasion(suggestedOccasion || existing?.occasion || "casual");
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

  async function connectGoogleCalendar() {
    try {
      const { data } = await axios.get("/api/google-calendar");
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch {
      toast.error("Failed to start Google Calendar connection");
    }
  }

  async function disconnectGoogleCalendar() {
    if (!confirm("Disconnect Google Calendar?")) return;
    try {
      await axios.get("/api/google-calendar?action=disconnect");
      setGcalConnected(false);
      setGcalEvents([]);
      toast.success("Disconnected");
    } catch {
      toast.error("Failed to disconnect");
    }
  }

  async function generateForEvent(event) {
    setSuggestingEvent(event);
    setSuggestedOutfits([]);
    setSuggestModalOpen(true);
    setSuggestLoading(true);
    try {
      const { data } = await axios.post("/api/generate-outfit", { occasion: event.occasion });
      setSuggestedOutfits(data.outfits || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to generate outfits");
      setSuggestModalOpen(false);
    } finally {
      setSuggestLoading(false);
    }
  }

  async function saveFromSuggestion(outfit) {
    if (!suggestingEvent?.date) return;
    setSavingSuggestion(outfit.items.map((i) => i._id).join(","));
    try {
      await axios.post("/api/outfit-plan", {
        date: suggestingEvent.date,
        occasion: suggestingEvent.occasion,
        items: outfit.items.map((i) => i._id),
        note: suggestingEvent.title,
      });
      toast.success(`Outfit saved for ${suggestingEvent.date}!`);
      setSuggestModalOpen(false);
      fetchPlans();
    } catch {
      toast.error("Failed to save outfit plan");
    } finally {
      setSavingSuggestion(null);
    }
  }

  // Show events from Google Calendar on their dates
  const getGcalEventsForDate = (dateStr) => {
    return gcalEvents.filter((e) => e.date === dateStr);
  };

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
        <div className="flex items-center gap-2">
          {gcalLoading && <Loader2 className="w-5 h-5 animate-spin text-gray-400" />}
          {!gcalConnected && (
            <button
              onClick={connectGoogleCalendar}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Connect Google Calendar
            </button>
          )}
          {gcalConnected && (
            <button
              onClick={disconnectGoogleCalendar}
              className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              Disconnect
            </button>
          )}
          {loading && <Loader2 className="w-5 h-5 animate-spin text-gray-400" />}
        </div>
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
            const gcalEventsOnDate = getGcalEventsForDate(dateStr);

            return (
              <div
                key={dateStr}
                onClick={() => {
                  const gcalEvent = gcalEventsOnDate.find((e) => e.occasion !== "casual");
                  openModal(dateStr, gcalEvent?.occasion || "casual");
                }}
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

                {/* Show Google Calendar events */}
                {gcalEventsOnDate.length > 0 && !plan && (
                  <div className="absolute top-1 left-1 w-2 h-2 bg-blue-500 rounded-full" title="Calendar event" />
                )}

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

      {/* Upcoming Events from Google Calendar */}
      {gcalConnected && gcalEvents.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
          <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-purple-500" />
            Upcoming Events — Plan Your Outfits
          </h3>
          <div className="space-y-3">
            {gcalEvents.map((event) => {
              const alreadyPlanned = !!plans[event.date];
              return (
                <div key={event.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm text-gray-800 dark:text-white truncate">{event.title}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize ${
                        event.occasion === "casual" ? "bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300"
                        : event.occasion === "party" ? "bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300"
                        : event.occasion === "wedding" ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300"
                        : event.occasion === "office" ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                        : "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300"
                      }`}>
                        {event.occasion}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {event.date}{event.time ? ` at ${event.time}` : ""}
                      </span>
                      {event.location && (
                        <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          {event.location}
                        </span>
                      )}
                    </div>
                  </div>
                  {alreadyPlanned ? (
                    <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium shrink-0">
                      <Check className="w-3.5 h-3.5" /> Planned
                    </span>
                  ) : (
                    <button
                      onClick={() => generateForEvent(event)}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium transition shrink-0"
                    >
                      <Wand2 className="w-3.5 h-3.5" />
                      Generate Outfit
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

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
      {/* AI Outfit Suggestion Modal */}
      <AnimatePresence>
        {suggestModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
            onClick={() => setSuggestModalOpen(false)}
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
                  <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    AI Outfit Suggestions
                  </h3>
                  {suggestingEvent && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {suggestingEvent.title} · {suggestingEvent.date} · <span className="capitalize">{suggestingEvent.occasion}</span>
                    </p>
                  )}
                </div>
                <button onClick={() => setSuggestModalOpen(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 p-5">
                {suggestLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">Generating outfits for your event...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {suggestedOutfits.map((outfit, idx) => {
                      const key = outfit.items.map((i) => i._id).join(",");
                      const isSaving = savingSuggestion === key;
                      return (
                        <div key={idx} className="border border-gray-100 dark:border-gray-700 rounded-xl p-4 space-y-3">
                          <div className="flex gap-2 flex-wrap">
                            {outfit.items.map((item) => (
                              <div key={item._id} className="flex flex-col items-center gap-1">
                                <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-600">
                                  <Image src={item.imageUrl} alt={item.type} fill className="object-cover" sizes="64px" />
                                </div>
                                <span className="text-[10px] text-gray-500 dark:text-gray-400 capitalize">{item.type}</span>
                              </div>
                            ))}
                          </div>
                          {outfit.explanation && (
                            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{outfit.explanation}</p>
                          )}
                          <button
                            onClick={() => saveFromSuggestion(outfit)}
                            disabled={!!savingSuggestion}
                            className="w-full flex items-center justify-center gap-2 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white rounded-lg text-sm font-medium transition"
                          >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            {isSaving ? "Saving..." : "Use This Outfit"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
