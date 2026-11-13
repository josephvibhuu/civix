"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import CivixNavbar from "@/components/CivixNavbar";
import { 
  Bell, CheckCheck, Sparkles, TrendingUp, ShieldCheck, 
  AlertCircle, ArrowRight, ExternalLink, RefreshCw, Filter, Layers, Clock
} from "lucide-react";
import { toast } from "sonner";

interface NotificationItem {
  id: string;
  appId: string | null;
  appName: string | null;
  appSlug: string | null;
  title: string;
  message: string;
  type: string;
  actionUrl: string | null;
  isRead: boolean;
  createdAt: string;
}

const TYPE_ICONS: Record<string, any> = {
  success: ShieldCheck,
  info: Sparkles,
  warning: AlertCircle,
  market: TrendingUp,
};

export default function UniversalInboxPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [authenticated, setAuthenticated] = useState(true);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const fetchInbox = () => {
    setLoading(true);
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((d) => {
        if (d.authenticated === false) {
          setAuthenticated(false);
        } else {
          setAuthenticated(true);
          setNotifications(d.notifications || []);
          setUnreadCount(d.unreadCount || 0);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchInbox();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch("/api/notifications/read", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error("Failed to mark notifications");

      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Failed to update notifications");
    }
  };

  const handleMarkSingleRead = async (id: string) => {
    try {
      await fetch("/api/notifications/read", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {}
  };

  const displayedNotifications = useMemo(() => {
    if (filter === "unread") {
      return notifications.filter((n) => !n.isRead);
    }
    return notifications;
  }, [notifications, filter]);

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#06080e] text-zinc-100 flex flex-col font-sans">
        <CivixNavbar />
        <main className="mx-auto max-w-lg px-4 py-24 text-center">
          <div className="rounded-3xl border border-zinc-800 bg-[#0a0f1d] p-8 shadow-2xl space-y-4">
            <Bell className="h-12 w-12 text-cyan-400 mx-auto" />
            <h2 className="text-xl font-bold text-white">Citizen Authentication Required</h2>
            <p className="text-xs text-zinc-400">
              Log into your Sovereign Passport to view cross-app alerts, dividends, and notary edicts.
            </p>
            <Link
              href="/login?return_to=/inbox"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 px-6 py-2.5 text-xs font-bold text-black"
            >
              <span>1-Click Quick Login</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#06080e] text-zinc-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      <CivixNavbar />

      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10 flex-1 w-full space-y-6">
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                <Bell className="h-5 w-5" />
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight">
                Universal Notification Hub
              </h1>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Cross-application dividends, margin warnings, contract milestones, and imperial edicts.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-900/80 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:text-white hover:border-zinc-500 transition-colors"
              >
                <CheckCheck className="h-3.5 w-3.5 text-cyan-400" />
                <span>Mark All Read</span>
              </button>
            )}

            <button
              onClick={fetchInbox}
              className="p-2 rounded-xl border border-zinc-800 bg-[#0a0f1d] text-zinc-400 hover:text-white transition-colors"
              title="Refresh inbox"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
              filter === "all"
                ? "bg-cyan-500 text-black shadow-md shadow-cyan-500/20"
                : "bg-[#0b101c] border border-zinc-800 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            All Notifications ({notifications.length})
          </button>

          <button
            onClick={() => setFilter("unread")}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all flex items-center gap-1.5 ${
              filter === "unread"
                ? "bg-cyan-500 text-black shadow-md shadow-cyan-500/20"
                : "bg-[#0b101c] border border-zinc-800 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <span>Unread</span>
            {unreadCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                filter === "unread" ? "bg-black text-cyan-300" : "bg-cyan-500/20 text-cyan-300"
              }`}>
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Notifications Feed */}
        {loading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-20 bg-zinc-900 rounded-2xl" />
            <div className="h-20 bg-zinc-900 rounded-2xl" />
            <div className="h-20 bg-zinc-900 rounded-2xl" />
          </div>
        ) : displayedNotifications.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-800 bg-[#080d19] p-12 text-center space-y-3">
            <Bell className="h-10 w-10 text-zinc-600 mx-auto" />
            <h3 className="text-sm font-bold text-white">Your Inbox is Clear</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              No pending alerts or notifications from your connected Parlamentum apps.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {displayedNotifications.map((n) => {
              const IconComp = TYPE_ICONS[n.type] || Sparkles;

              return (
                <div
                  key={n.id}
                  onClick={() => !n.isRead && handleMarkSingleRead(n.id)}
                  className={`group relative rounded-2xl border p-4 sm:p-5 transition-all cursor-pointer ${
                    !n.isRead
                      ? "border-cyan-500/40 bg-gradient-to-r from-cyan-950/20 via-[#0a1122] to-[#0c1428] shadow-md shadow-cyan-950/30"
                      : "border-zinc-800/80 bg-[#090d18] hover:border-zinc-700 opacity-80 hover:opacity-100"
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
                      !n.isRead
                        ? "bg-cyan-950 border-cyan-500/50 text-cyan-300"
                        : "bg-zinc-900 border-zinc-800 text-zinc-400"
                    }`}>
                      <IconComp className="h-4 w-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs sm:text-sm">
                            {n.title}
                          </span>
                          {!n.isRead && (
                            <span className="h-2 w-2 rounded-full bg-cyan-400 shrink-0" />
                          )}
                          {n.appName && (
                            <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] font-mono text-zinc-300">
                              {n.appName}
                            </span>
                          )}
                        </div>

                        <span className="text-[10px] text-zinc-500 font-mono flex items-center gap-1 shrink-0">
                          <Clock className="h-3 w-3" />
                          {new Date(n.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <p className="text-xs text-zinc-300 leading-relaxed">
                        {n.message}
                      </p>

                      {n.actionUrl && (
                        <div className="mt-2.5">
                          <Link
                            href={n.actionUrl}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
                          >
                            <span>Open Connected Resource</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
