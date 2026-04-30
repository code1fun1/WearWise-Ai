"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle, Send, Loader2, Sparkles, Shirt,
  Plus, Trash2, ChevronLeft, Clock,
} from "lucide-react";
import Image from "next/image";
import axios from "axios";
import { toast } from "react-toastify";

const WELCOME = "Hi! I'm StyleAI, your personal fashion assistant. I know your entire wardrobe and can suggest outfits for any occasion. What are you dressing for today?";

const STARTERS = [
  "What should I wear to a job interview tomorrow?",
  "Suggest a casual weekend outfit for warm weather",
  "I have a wedding next week, what from my wardrobe works?",
  "Give me a smart casual look for a dinner date",
  "I need a gym outfit from what I have",
];

const INITIAL_MESSAGES = [{ role: "assistant", content: WELCOME }];

export default function ChatPage() {
  const [sessions, setSessions]       = useState([]);       // sidebar list
  const [activeId, setActiveId]       = useState(null);     // current session _id
  const [messages, setMessages]       = useState(INITIAL_MESSAGES);
  const [input, setInput]             = useState("");
  const [loading, setLoading]         = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [wardrobeItems, setWardrobeItems] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(false);    // mobile only

  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);
  const saveTimer  = useRef(null);

  // Load wardrobe map for outfit card rendering
  useEffect(() => {
    axios.get("/api/wardrobe").then(({ data }) => {
      const map = {};
      data.items.forEach((i) => { map[i._id] = i; });
      setWardrobeItems(map);
    }).catch(() => {});
  }, []);

  // Load session list
  useEffect(() => {
    axios.get("/api/chat-sessions").then(({ data }) => {
      setSessions(data.sessions);
    }).catch(() => {}).finally(() => setLoadingSessions(false));
  }, []);

  // Scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Debounced save — called after AI reply arrives
  const saveSession = useCallback(async (msgs, sessionId, sessionTitle) => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        if (sessionId) {
          await axios.patch(`/api/chat-sessions/${sessionId}`, { messages: msgs });
        } else {
          // Create new session; title = first user message truncated
          const firstUser = msgs.find((m) => m.role === "user");
          const title = firstUser
            ? firstUser.content.slice(0, 45) + (firstUser.content.length > 45 ? "…" : "")
            : "New Chat";
          const { data } = await axios.post("/api/chat-sessions", { title, messages: msgs });
          setActiveId(data.session._id);
          setSessions((prev) => [
            { _id: data.session._id, title: data.session.title, updatedAt: data.session.updatedAt },
            ...prev,
          ]);
          return data.session._id;
        }
        // Update sidebar title/timestamp
        setSessions((prev) =>
          prev.map((s) =>
            s._id === sessionId ? { ...s, updatedAt: new Date().toISOString() } : s
          )
        );
      } catch {
        // silent — not critical
      }
    }, 800);
  }, []);

  async function sendMessage(text) {
    const userText = (text || input).trim();
    if (!userText || loading) return;

    const newMessages = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const { data } = await axios.post("/api/chat-stylist", { messages: newMessages });
      const finalMessages = [...newMessages, { role: "assistant", content: data.reply }];
      setMessages(finalMessages);
      saveSession(finalMessages, activeId);
    } catch {
      toast.error("Could not get a response. Please try again.");
      setMessages(newMessages);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function startNewChat() {
    setActiveId(null);
    setMessages(INITIAL_MESSAGES);
    setInput("");
    setSidebarOpen(false);
    inputRef.current?.focus();
  }

  async function loadSession(id) {
    if (id === activeId) { setSidebarOpen(false); return; }
    try {
      const { data } = await axios.get(`/api/chat-sessions/${id}`);
      setActiveId(data.session._id);
      setMessages(data.session.messages.length ? data.session.messages : INITIAL_MESSAGES);
      setSidebarOpen(false);
    } catch {
      toast.error("Could not load chat.");
    }
  }

  async function deleteSession(e, id) {
    e.stopPropagation();
    await axios.delete(`/api/chat-sessions/${id}`).catch(() => {});
    setSessions((prev) => prev.filter((s) => s._id !== id));
    if (activeId === id) startNewChat();
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] max-w-6xl mx-auto overflow-hidden">

      {/* ── Sidebar ──────────────────────────────────────────────────── */}
      <aside
        className={`
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 fixed lg:relative z-30 lg:z-auto
          w-64 h-full bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800
          flex flex-col transition-transform duration-200
        `}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 dark:border-gray-800">
          <span className="font-semibold text-sm text-gray-700 dark:text-gray-300">Chats</span>
          <button
            onClick={startNewChat}
            className="p-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition"
            title="New chat"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Session list */}
        <div className="flex-1 overflow-y-auto py-2">
          {loadingSessions ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8 px-4">No previous chats yet</p>
          ) : (
            sessions.map((s) => (
              <button
                key={s._id}
                onClick={() => loadSession(s._id)}
                className={`w-full text-left px-4 py-2.5 group flex items-start gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition ${
                  activeId === s._id ? "bg-purple-50 dark:bg-purple-900/20" : ""
                }`}
              >
                <MessageCircle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-gray-400" />
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium truncate ${
                    activeId === s._id ? "text-purple-700 dark:text-purple-300" : "text-gray-700 dark:text-gray-300"
                  }`}>
                    {s.title}
                  </p>
                  <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                    <Clock className="w-2.5 h-2.5" />
                    {formatDate(s.updatedAt)}
                  </p>
                </div>
                <button
                  onClick={(e) => deleteSession(e, s._id)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:text-red-500 text-gray-400 transition"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Main chat area ──────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {/* Mobile: open sidebar */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              <ChevronLeft className="w-4 h-4 text-gray-500 rotate-180" />
            </button>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 dark:text-white text-sm">StyleAI Chat</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Your personal fashion assistant</p>
            </div>
          </div>
          <button
            onClick={startNewChat}
            className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-purple-600 transition px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Plus className="w-3.5 h-3.5" />
            New chat
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mr-2 mt-0.5 shrink-0">
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-purple-600 text-white rounded-tr-sm"
                      : "bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-sm shadow-sm"
                  }`}
                >
                  <MessageContent content={msg.content} wardrobeItems={wardrobeItems} />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mr-2 shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                <div className="flex gap-1.5 items-center">
                  <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </motion.div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Starter prompts */}
        {messages.length === 1 && (
          <div className="py-3 flex flex-wrap gap-2">
            {STARTERS.map((s, i) => (
              <button
                key={i}
                onClick={() => sendMessage(s)}
                className="text-xs px-3 py-1.5 rounded-full border border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder="Ask your stylist anything..."
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 dark:text-white dark:placeholder-gray-500"
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl transition"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function MessageContent({ content, wardrobeItems }) {
  const parts = [];
  const regex = /<outfit>([\s\S]*?)<\/outfit>/g;
  let last = 0;
  let match;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > last) parts.push({ type: "text", value: content.slice(last, match.index) });
    try {
      parts.push({ type: "outfit", value: JSON.parse(match[1]) });
    } catch {
      parts.push({ type: "text", value: match[0] });
    }
    last = regex.lastIndex;
  }
  if (last < content.length) parts.push({ type: "text", value: content.slice(last) });

  return (
    <div className="space-y-3">
      {parts.map((part, i) =>
        part.type === "text" ? (
          <p key={i} className="whitespace-pre-wrap">{part.value}</p>
        ) : (
          <OutfitCard key={i} outfit={part.value} wardrobeItems={wardrobeItems} />
        )
      )}
    </div>
  );
}

function OutfitCard({ outfit, wardrobeItems }) {
  const items = (outfit.items || []).map((id) => wardrobeItems[id]).filter(Boolean);
  if (!items.length) return null;

  return (
    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3 border border-purple-100 dark:border-purple-800 mt-2">
      <div className="flex items-center gap-1 mb-2">
        <Shirt className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
        <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">Outfit Suggestion</span>
      </div>
      <div className="flex gap-2 flex-wrap">
        {items.map((item) => (
          <div key={item._id} className="flex flex-col items-center gap-1">
            <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-purple-200 dark:border-purple-700 bg-white">
              <Image src={item.imageUrl} alt={item.customName || item.type} fill className="object-cover" sizes="56px" />
            </div>
            <span className="text-[10px] text-gray-500 dark:text-gray-400 capitalize w-14 text-center truncate">
              {item.customName || item.type}
            </span>
          </div>
        ))}
      </div>
      {outfit.explanation && (
        <p className="text-xs text-purple-600 dark:text-purple-400 mt-2 italic">{outfit.explanation}</p>
      )}
    </div>
  );
}
