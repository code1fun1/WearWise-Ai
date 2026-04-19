"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  Send,
  Loader2,
  Sparkles,
  Shirt,
  RotateCcw,
} from "lucide-react";
import Image from "next/image";
import axios from "axios";
import { toast } from "react-toastify";

const STARTERS = [
  "What should I wear to a job interview tomorrow?",
  "Suggest a casual weekend outfit for warm weather",
  "I have a wedding next week, what from my wardrobe works?",
  "Give me a smart casual look for a dinner date",
  "I need a gym outfit from what I have",
];

export default function ChatPage() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi! I'm StyleAI, your personal fashion assistant. I know your entire wardrobe and can suggest outfits for any occasion. What are you dressing for today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [wardrobeItems, setWardrobeItems] = useState({});
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    // Pre-fetch wardrobe for rendering outfit cards
    axios.get("/api/wardrobe").then(({ data }) => {
      const map = {};
      data.items.forEach((i) => { map[i._id] = i; });
      setWardrobeItems(map);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text) {
    const userText = (text || input).trim();
    if (!userText || loading) return;

    const newMessages = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const { data } = await axios.post("/api/chat-stylist", {
        messages: newMessages,
      });
      setMessages([...newMessages, { role: "assistant", content: data.reply }]);
    } catch {
      toast.error("Could not get a response. Please try again.");
      setMessages(newMessages);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleReset() {
    setMessages([
      {
        role: "assistant",
        content:
          "Hi! I'm StyleAI, your personal fashion assistant. I know your entire wardrobe and can suggest outfits for any occasion. What are you dressing for today?",
      },
    ]);
  }

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900 dark:text-white">StyleAI Chat</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Your personal fashion assistant</p>
          </div>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-purple-600 transition px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <RotateCcw className="w-3.5 h-3.5" />
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
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

      {/* Starter prompts (only before first user message) */}
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
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </main>
  );
}

// Parses <outfit>{...}</outfit> blocks and renders them as outfit cards
function MessageContent({ content, wardrobeItems }) {
  const parts = [];
  const regex = /<outfit>([\s\S]*?)<\/outfit>/g;
  let last = 0;
  let match;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > last) {
      parts.push({ type: "text", value: content.slice(last, match.index) });
    }
    try {
      const data = JSON.parse(match[1]);
      parts.push({ type: "outfit", value: data });
    } catch {
      parts.push({ type: "text", value: match[0] });
    }
    last = regex.lastIndex;
  }
  if (last < content.length) {
    parts.push({ type: "text", value: content.slice(last) });
  }

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
  const items = (outfit.items || [])
    .map((id) => wardrobeItems[id])
    .filter(Boolean);

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
