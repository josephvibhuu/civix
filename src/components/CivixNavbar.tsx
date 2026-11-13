"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { 
  Layers, Sparkles, LogIn, LogOut, Code2, Compass, Shield, 
  Users, Bell, Search, ShieldAlert, ChevronDown, User, ExternalLink, LayoutGrid, Trophy 
} from "lucide-react";
import CommandPalette from "./CommandPalette";
import { AppItem } from "./AppCard";

interface Citizen {
  id: string;
  currentUsername: string;
  gameProfileId: string;
  verificationTier?: string;
  isVerified: boolean;
  isAdmin?: boolean;
}

interface NotificationItem {
  id: string;
  appId: string | null;
  title: string;
  message: string;
  type: string;
  actionUrl: string | null;
  isRead: boolean;
  createdAt: string;
}

export default function CivixNavbar({ apps = [] }: { apps?: AppItem[] }) {
  const [citizen, setCitizen] = useState<Citizen | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.authenticated) {
          setCitizen(d.citizen);
          fetch("/api/notifications")
            .then((nr) => nr.json())
            .then((nd) => {
              if (nd.authenticated) {
                setNotifications(nd.notifications || []);
                setUnreadCount(nd.unreadCount || 0);
              }
            })
            .catch(() => {});
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifs(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // Shortcut for Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setCitizen(null);
    window.location.reload();
  };

  const handleMarkAllRead = async () => {
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark_all_read" }),
    });
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-cyan-950/40 bg-[#070a12]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 gap-4">
          {/* Brand */}
          <div className="flex items-center gap-6 lg:gap-8 shrink-0">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 via-sky-500 to-indigo-600 shadow-md shadow-cyan-500/25 group-hover:shadow-cyan-400/50 group-hover:scale-105 transition-all">
                <Layers className="h-5 w-5 text-zinc-950 stroke-[2.4]" />
                <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/30" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                  CIVIX
                  <span className="rounded-full bg-cyan-500/10 px-1.5 py-0.2 text-[8px] font-black text-cyan-300 border border-cyan-500/30 tracking-widest uppercase">
                    STORE
                  </span>
                </span>
                <span className="text-[9px] font-semibold text-cyan-400/80 tracking-widest uppercase -mt-0.5">
                  Universal Identity
                </span>
              </div>
            </Link>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              <Link
                href="/"
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                <Compass className="h-3.5 w-3.5 text-cyan-400" />
                Store
              </Link>
              <Link
                href="/workspace"
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:text-white hover:bg-cyan-500/10 transition-colors"
              >
                <LayoutGrid className="h-3.5 w-3.5 text-cyan-400" />
                <span>Workspace</span>
                <span className="rounded-full bg-cyan-400/20 px-1.5 py-0.2 text-[8px] font-black text-cyan-300 border border-cyan-400/40 tracking-wider">
                  WebOS
                </span>
              </Link>
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                <Shield className="h-3.5 w-3.5 text-emerald-400" />
                Dashboard
              </Link>
              <Link
                href="/referrals"
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                <Users className="h-3.5 w-3.5 text-sky-400" />
                Referrals
              </Link>
              <Link
                href="/leaderboard"
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                <Trophy className="h-3.5 w-3.5 text-amber-400" />
                Leaderboard
              </Link>
              <Link
                href="/developers"
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                <Code2 className="h-3.5 w-3.5 text-indigo-400" />
                Developers
              </Link>
              {citizen?.isAdmin && (
                <Link
                  href="/admin"
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 transition-colors"
                >
                  <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
                  Admin
                </Link>
              )}
            </nav>
          </div>

          {/* Search Trigger (Cmd+K) */}
          <div className="flex-1 max-w-sm hidden sm:block">
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="w-full flex items-center justify-between rounded-xl border border-zinc-800 bg-[#0b101c]/80 px-3.5 py-1.5 text-xs text-zinc-400 hover:border-cyan-500/40 hover:text-zinc-200 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Search className="h-3.5 w-3.5 text-cyan-400" />
                <span>Search verified apps...</span>
              </div>
              <kbd className="rounded bg-zinc-900 border border-zinc-700/80 px-1.5 py-0.5 text-[10px] font-mono text-zinc-400">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Mobile Search Button */}
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="sm:hidden p-2 rounded-lg text-zinc-400 hover:bg-white/5 hover:text-white"
            >
              <Search className="h-4 w-4" />
            </button>

            {loading ? (
              <div className="h-8 w-24 animate-pulse rounded bg-zinc-800" />
            ) : citizen ? (
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Notifications Bell */}
                <div className="relative" ref={notifRef}>
                  <button
                    type="button"
                    onClick={() => setShowNotifs((o) => !o)}
                    className="relative rounded-lg p-2 text-zinc-400 hover:bg-white/5 hover:text-cyan-300 transition-colors"
                    title="Ecosystem Notifications"
                  >
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-400 text-[9px] font-black text-black animate-pulse">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {showNotifs && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-cyan-900/40 bg-[#0a0e17] p-4 shadow-2xl z-50">
                      <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-3">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Bell className="h-3.5 w-3.5 text-cyan-400" />
                          Ecosystem Inbox
                        </span>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            className="text-[11px] text-cyan-400 hover:underline"
                          >
                            Mark all as read
                          </button>
                        )}
                      </div>

                      {notifications.length === 0 ? (
                        <div className="py-6 text-center text-xs text-zinc-500">
                          No notifications right now.
                        </div>
                      ) : (
                        <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                          {notifications.map((n) => (
                            <div
                              key={n.id}
                              className={`rounded-xl p-2.5 text-xs transition-colors border ${
                                n.isRead
                                  ? "bg-zinc-900/40 border-zinc-900 text-zinc-400"
                                  : "bg-cyan-950/20 border-cyan-500/30 text-zinc-200"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-semibold text-zinc-100">{n.title}</span>
                                <span className="text-[10px] text-zinc-500">
                                  {new Date(n.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-[11px] text-zinc-400 leading-relaxed">{n.message}</p>
                              {n.actionUrl && (
                                <Link
                                  href={n.actionUrl}
                                  onClick={() => setShowNotifs(false)}
                                  className="inline-block mt-2 text-[10px] font-semibold text-cyan-400 hover:underline"
                                >
                                  View Details →
                                </Link>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Citizen User Menu */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    type="button"
                    onClick={() => setShowUserMenu((o) => !o)}
                    className="flex items-center gap-2 rounded-xl p-1.5 pr-2.5 border border-zinc-800 bg-[#0b101c] hover:border-cyan-500/40 transition-colors"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-sky-600 text-xs font-black text-black">
                      {citizen.currentUsername[0]?.toUpperCase()}
                    </div>
                    <div className="hidden sm:flex flex-col text-left">
                      <span className="text-xs font-semibold text-zinc-100 leading-tight">
                        {citizen.currentUsername}
                      </span>
                      <span className="text-[10px] text-cyan-400 font-mono leading-none">
                        {citizen.verificationTier === "tier_3_sovereign"
                          ? "Sovereign"
                          : citizen.verificationTier === "tier_2_bank_verified"
                          ? "Bank Verified"
                          : "Citizen"}
                      </span>
                    </div>
                    <ChevronDown className="h-3 w-3 text-zinc-400 ml-1" />
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-cyan-900/50 bg-[#0a0e17] p-2 shadow-2xl z-50 text-xs">
                      <div className="p-2 border-b border-zinc-800/80 mb-1">
                        <span className="font-semibold text-white block truncate">
                          {citizen.currentUsername}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500 truncate block">
                          {citizen.gameProfileId}
                        </span>
                      </div>

                      <Link
                        href="/dashboard"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-zinc-200 hover:bg-cyan-500/10 hover:text-cyan-300 transition-colors"
                      >
                        <User className="h-3.5 w-3.5 text-cyan-400" />
                        <span>Citizen Dashboard</span>
                      </Link>

                      <Link
                        href="/referrals"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-zinc-200 hover:bg-cyan-500/10 hover:text-cyan-300 transition-colors"
                      >
                        <Users className="h-3.5 w-3.5 text-sky-400" />
                        <span>Referral Links</span>
                      </Link>

                      {citizen.isAdmin && (
                        <Link
                          href="/admin"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-2 rounded-xl px-3 py-2 text-amber-300 hover:bg-amber-500/10 transition-colors"
                        >
                          <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
                          <span>Admin Console</span>
                        </Link>
                      )}

                      <div className="my-1 border-t border-zinc-800/80" />

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-rose-400 hover:bg-rose-500/10 transition-colors text-left"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 px-4 py-2 text-xs font-bold text-black shadow-md shadow-cyan-500/25 hover:from-cyan-400 hover:to-sky-400 transition-all active:scale-95"
              >
                <LogIn className="h-3.5 w-3.5 stroke-[2.5]" />
                <span>Sign In</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <div className="fixed bottom-0 inset-x-0 z-40 border-t border-cyan-950/60 bg-[#070a12]/95 backdrop-blur-xl md:hidden px-3 py-2 flex items-center justify-around">
        <Link
          href="/"
          className="flex flex-col items-center gap-1 text-[10px] font-semibold text-zinc-400 hover:text-white"
        >
          <Compass className="h-4 w-4 text-cyan-400" />
          <span>Store</span>
        </Link>

        <Link
          href="/workspace"
          className="flex flex-col items-center gap-1 text-[10px] font-semibold text-cyan-300"
        >
          <div className="relative">
            <LayoutGrid className="h-4 w-4 text-cyan-400" />
            <span className="absolute -top-1 -right-1 h-1.5 w-1.5 rounded-full bg-cyan-400" />
          </div>
          <span>Workspace</span>
        </Link>

        <button
          onClick={() => setPaletteOpen(true)}
          className="flex flex-col items-center gap-1 text-[10px] font-semibold text-zinc-400 hover:text-white"
        >
          <Search className="h-4 w-4 text-zinc-400" />
          <span>Search</span>
        </button>

        <Link
          href="/dashboard"
          className="flex flex-col items-center gap-1 text-[10px] font-semibold text-zinc-400 hover:text-white"
        >
          <Shield className="h-4 w-4 text-emerald-400" />
          <span>Passport</span>
        </Link>
      </div>

      {/* Cmd+K Palette */}
      <CommandPalette
        apps={apps}
        isOpen={paletteOpen}
        onClose={() => setPaletteOpen(false)}
      />
    </>
  );
}
