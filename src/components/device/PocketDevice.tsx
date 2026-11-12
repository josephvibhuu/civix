"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Zap, Smartphone, Tablet, Monitor, Bell, ExternalLink, 
  ArrowLeft, RotateCw, Maximize2, Minimize2, Shield, ShieldCheck, 
  Users, TrendingUp, Swords, Dices, Landmark, Sparkles, ChevronRight, 
  Volume2, VolumeX, Wifi, Battery, Search, Layers, CheckCircle2, Clock, 
  Compass, Settings, X, ChevronDown, Check, LogIn
} from "lucide-react";
import { toast } from "sonner";
import { AppItem } from "../AppCard";

export interface EventEdict {
  id: string;
  appSlug: string;
  appName: string;
  appCategory: string;
  title: string;
  description: string;
  primaryActionLabel: string;
  primaryActionUrl: string;
  secondaryActionLabel?: string;
  timeAgo: string;
  urgent?: boolean;
}

const DEFAULT_EDICTS: EventEdict[] = [
  {
    id: "edict-gug-1",
    appSlug: "grow-ur-gold",
    appName: "Grow UR Gold",
    appCategory: "finance",
    title: "60% Corporate Dividend Distribution Live",
    description: "Audited 60% profit-sharing payout is distributing to verified shareholders. Quorum endorsed by proxy vote.",
    primaryActionLabel: "Open Exchange",
    primaryActionUrl: "https://growurgold.vercel.app",
    secondaryActionLabel: "View Motion",
    timeAgo: "2m ago",
    urgent: true,
  },
  {
    id: "edict-labour-2",
    appSlug: "the-labour-exchange",
    appName: "The Labour Exchange",
    appCategory: "utility",
    title: "New Mining Guild Contract Available",
    description: "Senate Quarry has posted a 500-ton Raw Iron contract with guaranteed gold escrow payment upon notary sign-off.",
    primaryActionLabel: "Inspect Contract",
    primaryActionUrl: "https://jobparlamentum-app.vercel.app",
    secondaryActionLabel: "Dismiss",
    timeAgo: "14m ago",
  },
  {
    id: "edict-bank-3",
    appSlug: "bank-of-europe",
    appName: "Bank of Europe",
    appCategory: "finance",
    title: "Term Deposit Vault Yield: 4.8% APR",
    description: "Milanese gold vaults have opened institutional term debt deposits with bi-weekly coupon settlements.",
    primaryActionLabel: "Access Vaults",
    primaryActionUrl: "https://bankofmilan.pages.dev",
    timeAgo: "1h ago",
  },
];

interface Props {
  initialApps?: AppItem[];
}

export default function PocketDevice({ initialApps = [] }: Props) {
  // Device viewport modes
  const [deviceMode, setDeviceMode] = useState<"phone" | "tablet" | "fullscreen">("phone");
  const [soundEnabled, setSoundEnabled] = useState(true);

  // System time
  const [currentTime, setCurrentTime] = useState("");
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  // Citizen auth
  const [citizen, setCitizen] = useState<any>(null);
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.authenticated) setCitizen(d.citizen);
      })
      .catch(() => {});
  }, []);

  // Apps list
  const [apps, setApps] = useState<AppItem[]>(initialApps);
  useEffect(() => {
    if (initialApps.length === 0) {
      fetch("/api/apps")
        .then((r) => r.json())
        .then((d) => {
          if (d.apps) setApps(d.apps);
        })
        .catch(() => {});
    }
  }, [initialApps]);

  // Active running app inside device viewport
  const [activeApp, setActiveApp] = useState<AppItem | null>(null);
  const [iframeKey, setIframeKey] = useState(0);

  // Edicts / Notifications state
  const [edicts, setEdicts] = useState<EventEdict[]>(DEFAULT_EDICTS);
  const [activeEdictIndex, setActiveEdictIndex] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Bottom dock tab
  const [dockTab, setDockTab] = useState<"home" | "inbox" | "store" | "passport">("home");

  // App Categories icons
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "finance": return TrendingUp;
      case "gaming": return Swords;
      case "casino": return Dices;
      default: return Landmark;
    }
  };

  const handleLaunchApp = (app: AppItem) => {
    setActiveApp(app);
    setDrawerOpen(false);
    toast.success(`Launched ${app.name} in Sandbox`);
  };

  const handleCloseActiveApp = () => {
    setActiveApp(null);
  };

  const handleEdictAction = (edict: EventEdict, isPrimary: boolean) => {
    if (!isPrimary) {
      // Dismiss or secondary
      setEdicts((prev) => prev.filter((e) => e.id !== edict.id));
      toast.info("Edict notice archived");
      return;
    }
    // Find matching app
    const target = apps.find((a) => a.slug === edict.appSlug);
    if (target) {
      handleLaunchApp(target);
    } else {
      window.open(edict.primaryActionUrl, "_blank");
    }
  };

  // Listen for device bridge events from running apps
  useEffect(() => {
    const handleBridgeMessage = (e: MessageEvent) => {
      if (e.data?.type === "CIVIX_DEVICE_ACTION") {
        if (e.data.action === "RESIZE_REQUEST") {
          setDeviceMode(e.data.mode || "tablet");
          toast.info(`App requested ${e.data.mode} viewport`);
        } else if (e.data.action === "NOTIFICATION") {
          toast.success(e.data.data?.title || "New notification from app");
        } else if (e.data.action === "CLOSE_APP") {
          setActiveApp(null);
        }
      }
    };
    window.addEventListener("message", handleBridgeMessage);
    return () => window.removeEventListener("message", handleBridgeMessage);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[90vh] w-full p-2 sm:p-6 lg:p-8 select-none">
      {/* Top Device Hardware Controls Bar (Desktop View Only) */}
      <div className="hidden sm:flex items-center justify-between w-full max-w-4xl mb-4 px-4 py-2 rounded-2xl border border-zinc-800 bg-[#0a0f1d]/80 backdrop-blur-md text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          <span className="font-mono text-cyan-400 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
            CIVIX Sovereign Pocket Device
          </span>
          <span className="text-zinc-600">|</span>
          <span className="text-[11px]">Hardware Simulator v2.4</span>
        </div>

        {/* Viewport Aspect Modes */}
        <div className="flex items-center gap-1 rounded-xl bg-black/60 p-1 border border-zinc-800">
          <button
            onClick={() => setDeviceMode("phone")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold transition-all ${
              deviceMode === "phone"
                ? "bg-cyan-500 text-black shadow-md shadow-cyan-500/25"
                : "text-zinc-400 hover:text-white"
            }`}
            title="Compact Phone Mode (390px)"
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span>Phone</span>
          </button>

          <button
            onClick={() => setDeviceMode("tablet")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold transition-all ${
              deviceMode === "tablet"
                ? "bg-cyan-500 text-black shadow-md shadow-cyan-500/25"
                : "text-zinc-400 hover:text-white"
            }`}
            title="Expanded Tablet Mode (780px) - Best for Order Books & Charts"
          >
            <Tablet className="h-3.5 w-3.5" />
            <span>Expand Mode</span>
          </button>

          <button
            onClick={() => setDeviceMode("fullscreen")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold transition-all ${
              deviceMode === "fullscreen"
                ? "bg-cyan-500 text-black shadow-md shadow-cyan-500/25"
                : "text-zinc-400 hover:text-white"
            }`}
            title="Full Window Workspace Mode"
          >
            <Monitor className="h-3.5 w-3.5" />
            <span>Desktop</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setSoundEnabled((v) => !v)}
            className="text-zinc-400 hover:text-white transition-colors"
            title={soundEnabled ? "Mute audio" : "Enable audio"}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4 text-cyan-400" /> : <VolumeX className="h-4 w-4" />}
          </button>
          <Link
            href="/"
            className="flex items-center gap-1 text-[11px] font-semibold text-zinc-300 hover:text-cyan-400 transition-colors"
          >
            <span>Exit to Store</span>
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* THE PHYSICAL CHASSIS CONTAINER */}
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={`relative overflow-hidden transition-all duration-300 bg-[#05070d] text-zinc-100 flex flex-col shadow-2xl shadow-cyan-950/40 border-[3px] border-zinc-700/80 rounded-[44px] ${
          deviceMode === "phone"
            ? "w-full max-w-[400px] h-[820px]"
            : deviceMode === "tablet"
            ? "w-full max-w-[800px] h-[820px]"
            : "w-full max-w-5xl h-[840px]"
        }`}
        style={{
          boxShadow: "0 25px 60px -15px rgba(6, 182, 212, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.08)",
        }}
      >
        {/* Physical Chamfered Titanium Ring Highlight */}
        <div className="absolute inset-0 rounded-[42px] pointer-events-none ring-1 ring-inset ring-white/10 z-50" />

        {/* TOP STATUS BAR & DYNAMIC ISLAND */}
        <div className="relative z-40 flex items-center justify-between px-6 pt-3.5 pb-2 border-b border-white/5 bg-[#06080e]/95 backdrop-blur-md shrink-0">
          {/* Left: Live Clock & Network */}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-xs tracking-tight text-white font-mono">
              {currentTime || "12:00"}
            </span>
            <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-mono">
              <Wifi className="h-3 w-3 text-cyan-400" />
              <span className="hidden sm:inline">REALM-NET</span>
            </div>
          </div>

          {/* Center: Dynamic Island / Pill */}
          <div 
            onClick={() => setDrawerOpen((v) => !v)}
            className="cursor-pointer group flex items-center gap-2 px-3 py-1 rounded-full bg-black border border-cyan-500/30 text-[10px] font-bold text-cyan-300 hover:border-cyan-400 transition-all shadow-md shadow-cyan-950/60"
            title="Click to toggle Notification Center"
          >
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="tracking-wider uppercase">
              {activeApp ? activeApp.name : "SOVEREIGN POCKET"}
            </span>
            <ChevronDown className={`h-3 w-3 transition-transform ${drawerOpen ? "rotate-180" : ""}`} />
          </div>

          {/* Right: Citizen / Battery */}
          <div className="flex items-center gap-2.5">
            {citizen ? (
              <div className="flex items-center gap-1.5 rounded-full bg-cyan-950/70 border border-cyan-500/30 px-2 py-0.5 text-[10px] font-bold text-cyan-300">
                <ShieldCheck className="h-3 w-3 text-cyan-400" />
                <span className="max-w-[70px] truncate">{citizen.currentUsername}</span>
              </div>
            ) : (
              <Link
                href="/login?return_to=/device"
                className="flex items-center gap-1 text-[10px] font-bold text-zinc-400 hover:text-cyan-300"
              >
                <LogIn className="h-3 w-3" />
                <span>Sign In</span>
              </Link>
            )}
            <div className="flex items-center gap-1 text-zinc-400 text-[10px]">
              <span className="font-mono text-[9px]">98%</span>
              <Battery className="h-3.5 w-3.5 text-emerald-400" />
            </div>
          </div>
        </div>

        {/* PULL-DOWN NOTIFICATION CENTER DRAWER */}
        <AnimatePresence>
          {drawerOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="relative z-30 border-b border-cyan-900/40 bg-[#080d19]/95 backdrop-blur-xl p-4 overflow-hidden shadow-2xl"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Bell className="h-3.5 w-3.5 text-cyan-400" />
                  Ecosystem Edicts & Dispatches ({edicts.length})
                </span>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="text-zinc-500 hover:text-white text-xs"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {edicts.map((edict) => (
                  <div
                    key={edict.id}
                    className="rounded-xl border border-zinc-800/80 bg-black/60 p-3 text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-cyan-300">{edict.appName}</span>
                      <span className="text-[10px] text-zinc-500 font-mono">{edict.timeAgo}</span>
                    </div>
                    <p className="text-[11px] text-zinc-300 leading-snug">{edict.title}</p>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleEdictAction(edict, true)}
                        className="rounded-lg bg-cyan-500 px-2.5 py-1 text-[10px] font-bold text-black hover:bg-cyan-400"
                      >
                        {edict.primaryActionLabel}
                      </button>
                      {edict.secondaryActionLabel && (
                        <button
                          onClick={() => handleEdictAction(edict, false)}
                          className="rounded-lg border border-zinc-700 px-2.5 py-1 text-[10px] text-zinc-400 hover:text-white"
                        >
                          {edict.secondaryActionLabel}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* DEVICE MAIN SCREEN BODY */}
        <div className="relative flex-1 overflow-hidden bg-gradient-to-b from-[#070b14] via-[#050810] to-[#04060c] flex flex-col">
          {/* CASE A: ACTIVE RUNNING APPLICATION VIEWPORT */}
          {activeApp ? (
            <div className="relative flex-1 flex flex-col h-full bg-[#030508]">
              {/* App Internal Navigation Bar */}
              <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800 bg-[#090d18] text-xs">
                <button
                  onClick={handleCloseActiveApp}
                  className="flex items-center gap-1 rounded-lg px-2.5 py-1 font-bold text-zinc-300 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Home</span>
                </button>

                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black border border-zinc-800 text-[11px] font-mono text-zinc-300 max-w-[220px] truncate">
                  <ShieldCheck className="h-3 w-3 text-cyan-400 shrink-0" />
                  <span className="truncate">{activeApp.appUrl.replace(/^https?:\/\//, "")}</span>
                </div>

                <div className="flex items-center gap-1">
                  {/* Expand toggle */}
                  <button
                    onClick={() => setDeviceMode((m) => (m === "phone" ? "tablet" : "phone"))}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5"
                    title={deviceMode === "phone" ? "Expand Viewport" : "Contract Viewport"}
                  >
                    {deviceMode === "phone" ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
                  </button>

                  {/* Reload iframe */}
                  <button
                    onClick={() => setIframeKey((k) => k + 1)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5"
                    title="Reload Application"
                  >
                    <RotateCw className="h-3.5 w-3.5" />
                  </button>

                  {/* Open in external tab with 1-Click Launch */}
                  <a
                    href={`/api/oauth/launch/${activeApp.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg text-cyan-400 hover:bg-cyan-500/10"
                    title="Open in Dedicated Tab with 1-Click SSO"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>

              {/* Sandbox Viewport iframe */}
              <div className="relative flex-1 w-full h-full bg-[#06080e] overflow-hidden">
                <iframe
                  key={iframeKey}
                  src={activeApp.appUrl}
                  title={activeApp.name}
                  className="w-full h-full border-0 bg-transparent"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                />

                {/* Framing Helper Floating Pill */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full border border-cyan-500/40 bg-black/85 px-4 py-1.5 text-[11px] font-semibold text-zinc-300 backdrop-blur-md shadow-2xl">
                  <span>Running in Sovereign Sandbox</span>
                  <a
                    href={`/api/oauth/launch/${activeApp.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-400 font-bold hover:underline flex items-center gap-1"
                  >
                    <span>Full Tab 1-Click</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>
          ) : (
            /* CASE B: HOME SCREEN DESKTOP & WIDGETS */
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 scrollbar-none">
              {/* HERO WIDGET: CITIZEN SOVEREIGN PASSPORT */}
              <div className="relative overflow-hidden rounded-3xl border border-cyan-900/50 bg-gradient-to-br from-[#0c1324] via-[#09101d] to-[#070b14] p-4 sm:p-5 shadow-xl">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-sky-600 text-sm font-black text-black shadow-md shadow-cyan-500/25">
                      {citizen ? citizen.currentUsername[0]?.toUpperCase() : "C"}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-sm text-white">
                          {citizen ? citizen.currentUsername : "Parlamentum Citizen"}
                        </span>
                        <span className="rounded-full bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.2 text-[8px] font-black text-cyan-300 uppercase tracking-widest">
                          {citizen?.verificationTier === "tier_3_sovereign"
                            ? "Sovereign"
                            : citizen?.verificationTier === "tier_2_bank_verified"
                            ? "Bank Verified"
                            : "Verified"}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-400">
                        {citizen ? citizen.gameProfileId.slice(0, 16) + "..." : "Civix Universal SSO Ready"}
                      </span>
                    </div>
                  </div>

                  <Link
                    href="/dashboard"
                    className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-[10px] font-bold text-cyan-300 hover:bg-cyan-500 hover:text-black transition-all"
                  >
                    Passport →
                  </Link>
                </div>

                <div className="flex items-center justify-between text-[10px] text-zinc-400 border-t border-zinc-800/80 pt-2 font-mono">
                  <span>Sybil Anchor: ACTIVE</span>
                  <span className="text-emerald-400">0% Cut · 1-Click SSO</span>
                </div>
              </div>

              {/* INTERACTIVE EVENT CARDS (EDICTS DISPATCH CAROUSEL) */}
              {edicts.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-cyan-400" />
                      Active Realm Edicts ({edicts.length})
                    </span>
                    <span className="text-[9px] text-zinc-500 font-mono">Swipe / Act</span>
                  </div>

                  {/* The Current Interactive Edict Card */}
                  <div className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-[#0c162c] to-[#091122] p-4 shadow-xl">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/20 px-2 py-0.5 text-[9px] font-bold text-cyan-300 uppercase">
                        {edicts[activeEdictIndex]?.appName}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {edicts[activeEdictIndex]?.timeAgo}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-white mb-1 leading-snug">
                      {edicts[activeEdictIndex]?.title}
                    </h4>

                    <p className="text-[11px] text-zinc-300 leading-relaxed line-clamp-2 mb-3">
                      {edicts[activeEdictIndex]?.description}
                    </p>

                    {/* Dual Action Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdictAction(edicts[activeEdictIndex], true)}
                        className="flex-1 rounded-xl bg-gradient-to-r from-cyan-400 to-sky-400 py-1.5 px-3 text-[11px] font-extrabold text-black shadow-md hover:brightness-110 transition-all flex items-center justify-center gap-1"
                      >
                        <Zap className="h-3 w-3 fill-black stroke-black" />
                        <span>{edicts[activeEdictIndex]?.primaryActionLabel}</span>
                      </button>

                      {edicts[activeEdictIndex]?.secondaryActionLabel && (
                        <button
                          onClick={() => handleEdictAction(edicts[activeEdictIndex], false)}
                          className="rounded-xl border border-zinc-700 bg-black/40 py-1.5 px-3 text-[11px] font-semibold text-zinc-300 hover:text-white"
                        >
                          {edicts[activeEdictIndex]?.secondaryActionLabel}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* APPS GRID */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    Sovereign Applications
                  </span>
                  <span className="text-[10px] text-zinc-500">
                    {apps.length} Verified Apps
                  </span>
                </div>

                <div className={`grid gap-3 ${deviceMode === "phone" ? "grid-cols-4" : "grid-cols-4 sm:grid-cols-6"}`}>
                  {apps.map((app) => {
                    const CategoryIcon = getCategoryIcon(app.category);
                    return (
                      <button
                        key={app.id}
                        onClick={() => handleLaunchApp(app)}
                        className="group flex flex-col items-center gap-1.5 p-2 rounded-2xl border border-transparent hover:border-cyan-500/40 hover:bg-white/5 transition-all cursor-pointer"
                        title={app.tagline}
                      >
                        {/* App Icon Tile */}
                        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0c162b] to-[#142340] border border-cyan-800/60 shadow-lg group-hover:scale-105 group-hover:border-cyan-400 transition-all">
                          <CategoryIcon className="h-6 w-6 text-cyan-300 group-hover:text-cyan-200 transition-colors" />
                          {app.featured && (
                            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-cyan-400 text-[8px] font-black text-black">
                              ★
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <span className="text-[10px] font-semibold text-zinc-200 text-center leading-tight truncate max-w-[68px] group-hover:text-cyan-300">
                          {app.name}
                        </span>
                      </button>
                    );
                  })}

                  {/* Nexus Store Tile */}
                  <Link
                    href="/"
                    className="group flex flex-col items-center gap-1.5 p-2 rounded-2xl border border-transparent hover:border-cyan-500/40 hover:bg-white/5 transition-all cursor-pointer"
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-950 to-purple-950 border border-indigo-700/60 shadow-lg group-hover:scale-105 transition-all">
                      <Compass className="h-6 w-6 text-indigo-300" />
                    </div>
                    <span className="text-[10px] font-semibold text-zinc-200 text-center leading-tight">
                      Store
                    </span>
                  </Link>

                  {/* Passport / Settings Tile */}
                  <Link
                    href="/dashboard"
                    className="group flex flex-col items-center gap-1.5 p-2 rounded-2xl border border-transparent hover:border-cyan-500/40 hover:bg-white/5 transition-all cursor-pointer"
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-700 shadow-lg group-hover:scale-105 transition-all">
                      <Shield className="h-6 w-6 text-emerald-400" />
                    </div>
                    <span className="text-[10px] font-semibold text-zinc-200 text-center leading-tight">
                      Passport
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* PERSISTENT BOTTOM DOCK */}
          <div className="relative z-30 flex items-center justify-around px-4 py-2.5 border-t border-white/5 bg-[#070b14]/90 backdrop-blur-xl shrink-0">
            <button
              onClick={() => {
                setActiveApp(null);
                setDockTab("home");
              }}
              className={`flex flex-col items-center gap-1 text-[9px] font-bold transition-colors ${
                dockTab === "home" && !activeApp ? "text-cyan-400" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Smartphone className="h-4 w-4" />
              <span>Device</span>
            </button>

            <button
              onClick={() => setDrawerOpen((v) => !v)}
              className={`relative flex flex-col items-center gap-1 text-[9px] font-bold transition-colors ${
                drawerOpen ? "text-cyan-400" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Bell className="h-4 w-4" />
              <span>Edicts</span>
              {edicts.length > 0 && (
                <span className="absolute -top-1 right-2 flex h-3 w-3 items-center justify-center rounded-full bg-cyan-400 text-[8px] font-black text-black">
                  {edicts.length}
                </span>
              )}
            </button>

            <Link
              href="/"
              className="flex flex-col items-center gap-1 text-[9px] font-bold text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <Compass className="h-4 w-4" />
              <span>Store</span>
            </Link>

            <Link
              href="/dashboard"
              className="flex flex-col items-center gap-1 text-[9px] font-bold text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <Shield className="h-4 w-4" />
              <span>Citizen ID</span>
            </Link>
          </div>

          {/* iOS / ANDROID HOME GESTURE PILL BAR */}
          <div 
            onClick={handleCloseActiveApp}
            className="flex justify-center items-center py-1.5 bg-[#05070d] cursor-pointer hover:bg-white/5 transition-colors"
            title="Click to return to Device Home"
          >
            <div className="h-1 w-28 rounded-full bg-zinc-600/60 hover:bg-cyan-400 transition-colors" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
