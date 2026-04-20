"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Shirt,
  Wand2,
  History,
  MoreHorizontal,
  MessageCircle,
  CalendarDays,
  Leaf,
  Sparkles,
  Backpack,
  User,
  LogOut,
  Moon,
  Sun,
  X,
  ShoppingBag,
} from "lucide-react";
import { useTheme } from "@/components/layout/ThemeProvider";

// The 5 pinned bottom tabs
const PRIMARY_TABS = [
  { href: "/dashboard", label: "Home",    icon: LayoutDashboard },
  { href: "/wardrobe",  label: "Wardrobe", icon: Shirt },
  { href: "/outfits",   label: "Outfits",  icon: Wand2,  hero: true },
  { href: "/history",   label: "History",  icon: History },
];

// Items shown inside the "More" sheet
const MORE_LINKS = [
  { href: "/chat",           label: "Style Chat",  icon: MessageCircle },
  { href: "/calendar",       label: "Calendar",    icon: CalendarDays },
  { href: "/sustainability",  label: "Insights",    icon: Leaf },
  { href: "/capsule",        label: "Capsule",     icon: Sparkles },
  { href: "/wishlist",       label: "Wishlist",    icon: ShoppingBag },
  { href: "/packing",        label: "Packing",     icon: Backpack },
  { href: "/profile",        label: "Profile",     icon: User },
];

export default function BottomNav() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [sheetOpen, setSheetOpen] = useState(false);

  if (!session) return null;

  // Any MORE_LINKS route counts as "more" being active
  const moreActive = MORE_LINKS.some((l) => pathname.startsWith(l.href));

  return (
    <>
      {/* Bottom bar */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur border-t border-gray-100 dark:border-gray-800"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex items-end justify-around px-2 pt-2 pb-2">
          {PRIMARY_TABS.map(({ href, label, icon: Icon, hero }) => {
            const active = pathname.startsWith(href);

            if (hero) {
              return (
                <Link
                  key={href}
                  href={href}
                  className="flex flex-col items-center -mt-5"
                >
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-300/50 transition-transform active:scale-95 ${
                      active
                        ? "bg-purple-700"
                        : "bg-gradient-to-br from-purple-600 to-pink-500"
                    }`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <span className={`text-[10px] mt-1 font-medium ${active ? "text-purple-600" : "text-gray-400"}`}>
                    {label}
                  </span>
                </Link>
              );
            }

            return (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-colors"
              >
                <Icon
                  className={`w-5 h-5 transition-colors ${
                    active ? "text-purple-600 dark:text-purple-400" : "text-gray-400 dark:text-gray-500"
                  }`}
                />
                <span
                  className={`text-[10px] font-medium transition-colors ${
                    active ? "text-purple-600 dark:text-purple-400" : "text-gray-400 dark:text-gray-500"
                  }`}
                >
                  {label}
                </span>
                {active && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="w-1 h-1 rounded-full bg-purple-600 dark:bg-purple-400"
                  />
                )}
              </Link>
            );
          })}

          {/* More tab */}
          <button
            onClick={() => setSheetOpen(true)}
            className="flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-colors"
          >
            <MoreHorizontal
              className={`w-5 h-5 ${
                moreActive || sheetOpen
                  ? "text-purple-600 dark:text-purple-400"
                  : "text-gray-400 dark:text-gray-500"
              }`}
            />
            <span
              className={`text-[10px] font-medium ${
                moreActive || sheetOpen
                  ? "text-purple-600 dark:text-purple-400"
                  : "text-gray-400 dark:text-gray-500"
              }`}
            >
              More
            </span>
            {moreActive && (
              <motion.div
                layoutId="bottomNavIndicator"
                className="w-1 h-1 rounded-full bg-purple-600 dark:bg-purple-400"
              />
            )}
          </button>
        </div>
      </nav>

      {/* More sheet */}
      <AnimatePresence>
        {sheetOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSheetOpen(false)}
              className="lg:hidden fixed inset-0 z-40 bg-black/40"
            />

            {/* Sheet */}
            <motion.div
              key="sheet"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl"
              style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-gray-700" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3">
                <span className="font-bold text-gray-900 dark:text-white text-base">More</span>
                <button
                  onClick={() => setSheetOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              {/* Nav links grid */}
              <div className="grid grid-cols-3 gap-2 px-4 pb-3">
                {MORE_LINKS.map(({ href, label, icon: Icon }) => {
                  const active = pathname.startsWith(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setSheetOpen(false)}
                      className={`flex flex-col items-center gap-2 py-4 rounded-2xl transition ${
                        active
                          ? "bg-purple-50 dark:bg-purple-900/40"
                          : "bg-gray-50 dark:bg-gray-800 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 ${
                          active ? "text-purple-600 dark:text-purple-400" : "text-gray-500 dark:text-gray-400"
                        }`}
                      />
                      <span
                        className={`text-xs font-medium ${
                          active ? "text-purple-700 dark:text-purple-300" : "text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        {label}
                      </span>
                    </Link>
                  );
                })}
              </div>

              {/* Divider */}
              <div className="mx-4 border-t border-gray-100 dark:border-gray-800" />

              {/* Theme + Sign out */}
              <div className="flex items-center justify-between px-4 py-4 gap-3">
                <button
                  onClick={toggleTheme}
                  className="flex items-center gap-2.5 flex-1 px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  {theme === "dark" ? (
                    <Sun className="w-4 h-4 text-yellow-500" />
                  ) : (
                    <Moon className="w-4 h-4 text-gray-500" />
                  )}
                  <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                    {theme === "dark" ? "Light Mode" : "Dark Mode"}
                  </span>
                </button>

                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="flex items-center gap-2.5 flex-1 px-4 py-3 rounded-2xl bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition"
                >
                  <LogOut className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-red-600 dark:text-red-400 font-medium">Sign Out</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
