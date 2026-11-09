"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { Shield, Sparkles, LogIn, LogOut, Code2, Compass, KeyRound, ExternalLink, Users, Bell, CheckCircle2 } from "lucide-react";

interface Citizen {
  id: string;
  currentUsername: string;
  gameProfileId: string;
  verificationTier?: string;
  isVerified: boolean;
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

export default function CivixNavbar() {
  const [citizen, setCitizen] = useState<Citizen | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.authenticated) {
          setCitizen(d.citizen);
          // Fetch notifications
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

  // Close dropdown on outside click
  useEffect(() => {
    if (!showNotifs) return;
    const onDown = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [showNotifs]);

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
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <Shield className="h-5 w-5 text-zinc-950 stroke-[2.5]" />
              <div className="absolute inset-0 rounded-lg ring-1 ring-inset ring-white/25" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
                CIVIX
                <span className="rounded bg-amber-400/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400 border border-amber-400/20">
                  HUB
                </span>
              </span>
              <span className="text-[10px] font-medium text-zinc-400 tracking-wider uppercase -mt-0.5">
                Parlamentum Ecosystem
              </span>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/"
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors"
            >
              <Compass className="h-4 w-4 text-amber-400" />
              App Store
            </Link>
            <Link
              href="/referrals"
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition-colors"
            >
              <Users className="h-4 w-4 text-emerald-400" />
              Universal Referrals
            </Link>
            <Link
              href="/developers"
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors"
            >
              <Code2 className="h-4 w-4 text-sky-400" />
              Developer BaaS & SDK
            </Link>
          </nav>
        </div>

        {/* User Account / Login */}
        <div className="flex items-center gap-3">
          {loading ? (
            <div className="h-8 w-24 animate-pulse rounded bg-zinc-800" />
          ) : citizen ? (
            <div className="flex items-center gap-3">
              {/* Universal Notifications Bell */}
              <div className="relative" ref={notifRef}>
                <button
                  type="button"
                  onClick={() => setShowNotifs((o) => !o)}
                  className="relative rounded-lg p-2 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 transition-colors"
                  title="Universal Ecosystem Notifications"
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-black text-black animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifs && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-zinc-800 bg-zinc-950 p-4 shadow-2xl z-50">
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-3">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Bell className="h-3.5 w-3.5 text-amber-400" />
                        Ecosystem Inbox
                      </span>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-[11px] text-amber-400 hover:underline"
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
                            className={`rounded-lg p-2.5 text-xs transition-colors border ${
                              n.isRead
                                ? "bg-zinc-900/40 border-zinc-900 text-zinc-400"
                                : "bg-zinc-900/90 border-amber-500/30 text-zinc-200"
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
                                className="inline-block mt-2 text-[10px] font-semibold text-amber-400 hover:underline"
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

              {/* Citizen KYC Badge */}
              <div className="hidden sm:flex items-center gap-1.5 rounded-md border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-1 text-xs">
                <Shield className="h-3.5 w-3.5 text-emerald-400" />
                <span className="font-semibold text-emerald-300">
                  {citizen.verificationTier === "tier_3_sovereign"
                    ? "Sovereign"
                    : citizen.verificationTier === "tier_2_bank_verified"
                    ? "Bank Verified"
                    : "Verified Citizen"}
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">KYC-1</span>
              </div>

              {/* Citizen Avatar & Logout */}
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 border border-zinc-700 text-xs font-bold text-amber-400">
                  {citizen.currentUsername[0]?.toUpperCase()}
                </div>
                <div className="hidden md:flex flex-col text-left">
                  <span className="text-xs font-semibold text-zinc-100">{citizen.currentUsername}</span>
                  <span className="text-[10px] font-mono text-zinc-500 truncate max-w-[100px]">{citizen.gameProfileId}</span>
                </div>
                <button
                  onClick={handleLogout}
                  title="Sign out"
                  className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-900 hover:text-red-400 transition-colors ml-1"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-3.5 py-1.5 text-xs font-bold text-zinc-950 shadow-md shadow-amber-500/10 hover:from-amber-400 hover:to-amber-500 transition-all active:scale-95"
              >
                <LogIn className="h-3.5 w-3.5 stroke-[2.5]" />
                Sign In with Civix
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
