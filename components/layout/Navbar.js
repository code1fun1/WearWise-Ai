"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  LayoutDashboard,
  Shirt,
  Wand2,
  User,
  LogOut,
  MessageCircle,
  Leaf,
  CalendarDays,
  Backpack,
  Moon,
  Sun,
  History,
  ShoppingBag,
  ChevronDown,
} from "lucide-react";
import Image from "next/image";
import { useTheme } from "@/components/layout/ThemeProvider";

// Primary links always visible in the top nav
const PRIMARY_LINKS = [
  { href: "/dashboard",  label: "Dashboard",  icon: LayoutDashboard },
  { href: "/wardrobe",   label: "Wardrobe",   icon: Shirt },
  { href: "/outfits",    label: "Outfits",    icon: Wand2 },
  { href: "/history",    label: "History",    icon: History },
  { href: "/chat",       label: "Style Chat", icon: MessageCircle },
];

// Secondary links shown in the "More" dropdown
const MORE_LINKS = [
  { href: "/calendar",       label: "Calendar",   icon: CalendarDays },
  { href: "/sustainability",  label: "Insights",   icon: Leaf },
  { href: "/capsule",        label: "Capsule",    icon: Sparkles },
  { href: "/wishlist",       label: "Wishlist",   icon: ShoppingBag },
  { href: "/packing",        label: "Packing",    icon: Backpack },
  { href: "/profile",        label: "Profile",    icon: User },
];

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [moreOpen, setMoreOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setMoreOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!session) return null;

  const moreActive = MORE_LINKS.some((l) => pathname.startsWith(l.href));

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-100 dark:border-gray-800">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-gray-900 dark:text-white hidden sm:block">
            WearWize
          </span>
        </Link>

        {/* Desktop primary links */}
        <div className="hidden lg:flex items-center gap-0.5 flex-1 justify-center">
          {PRIMARY_LINKS.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                  active
                    ? "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
                {active && (
                  <span className="w-1 h-1 rounded-full bg-purple-600 dark:bg-purple-400 ml-0.5" />
                )}
              </Link>
            );
          })}

          {/* More dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setMoreOpen((o) => !o)}
              className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition ${
                moreActive || moreOpen
                  ? "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              More
              <ChevronDown className={`w-3 h-3 transition-transform ${moreOpen ? "rotate-180" : ""}`} />
            </button>

            {moreOpen && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-lg py-1.5 z-50">
                {MORE_LINKS.map(({ href, label, icon: Icon }) => {
                  const active = pathname.startsWith(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setMoreOpen(false)}
                      className={`flex items-center gap-2.5 px-4 py-2 text-xs font-medium transition ${
                        active
                          ? "text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/20"
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right controls */}
        <div className="hidden lg:flex items-center gap-2 shrink-0">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition text-gray-500 dark:text-gray-400"
            title="Toggle dark mode"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {session.user?.image ? (
            <Image
              src={session.user.image}
              alt={session.user.name || "User"}
              width={32}
              height={32}
              className="rounded-full border-2 border-purple-200"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-400 flex items-center justify-center text-white font-bold text-sm">
              {session.user?.name?.[0]?.toUpperCase() || "U"}
            </div>
          )}
          <span className="text-sm text-gray-700 dark:text-gray-300 max-w-[90px] truncate font-medium">
            {session.user?.name?.split(" ")[0]}
          </span>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Mobile: theme + avatar only — nav handled by BottomNav */}
        <div className="lg:hidden flex items-center gap-1.5">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition text-gray-500 dark:text-gray-400"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          {session.user?.image ? (
            <Image
              src={session.user.image}
              alt={session.user.name || "User"}
              width={30}
              height={30}
              className="rounded-full border-2 border-purple-200"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-400 flex items-center justify-center text-white font-bold text-xs">
              {session.user?.name?.[0]?.toUpperCase() || "U"}
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
