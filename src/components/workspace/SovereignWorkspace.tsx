"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import Link from "next/link";
import { 
  Layers, Compass, Shield, Users, Code2, Plus, X, Maximize2, Minimize2, 
  RefreshCw, ExternalLink, Columns2, Square, ChevronLeft, ChevronRight, 
  Search, Zap, TrendingUp, Swords, Dices, Landmark, ShieldCheck, 
  AlertCircle, Lock, Sparkles, Check, ArrowUpRight, Laptop, LogIn, Scroll, Trophy, Award, Bell
} from "lucide-react";
import { toast } from "sonner";
import { AppItem } from "../AppCard";

export interface WorkspaceTab {
  id: string; // unique tab instance ID
  appId: string;
  slug: string;
  name: string;
  tagline: string;
  category: string;
  appUrl: string;
  launchUrl: string;
  iconUrl?: string | null;
  loaded: boolean;
}

interface Citizen {
  id: string;
  currentUsername: string;
  gameProfileId: string;
  verificationTier?: string;
  isVerified: boolean;
  isAdmin?: boolean;
}

const CATEGORY_ICONS: Record<string, any> = {
  finance: TrendingUp,
  gaming: Swords,
  casino: Dices,
  utility: Landmark,
};

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  finance: { bg: "bg-cyan-950/60", text: "text-cyan-400", border: "border-cyan-500/30" },
  gaming: { bg: "bg-purple-950/60", text: "text-purple-400", border: "border-purple-500/30" },
  casino: { bg: "bg-rose-950/60", text: "text-rose-400", border: "border-rose-500/30" },
  utility: { bg: "bg-sky-950/60", text: "text-sky-400", border: "border-sky-500/30" },
};

export default function SovereignWorkspace() {
  const [apps, setApps] = useState<AppItem[]>([]);
  const [citizen, setCitizen] = useState<Citizen | null>(null);
  const [loading, setLoading] = useState(true);

  // Tabs & Layout
  const [tabs, setTabs] = useState<WorkspaceTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [splitView, setSplitView] = useState(false);
  const [secondaryTabId, setSecondaryTabId] = useState<string | null>(null);

  // UI state
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [isAppPickerOpen, setIsAppPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pinnedSlugs, setPinnedSlugs] = useState<string[]>(["grow-ur-gold", "the-labour-exchange"]);
  const [forceIframeTabs, setForceIframeTabs] = useState<Record<string, boolean>>({});

  // Apps requiring top-level window launch to prevent cross-origin third-party iframe SameSite=Lax cookie drops
  const APPS_REQUIRING_TOP_LEVEL = useMemo(() => new Set(["the-labour-exchange"]), []);

  // Fetch initial citizen & apps
  useEffect(() => {
    Promise.all([
      fetch("/api/auth/me").then((r) => r.json()).catch(() => ({ authenticated: false })),
      fetch("/api/apps").then((r) => r.json()).catch(() => ({ apps: [] })),
    ]).then(([authData, appsData]) => {
      if (authData?.authenticated && authData.citizen) {
        setCitizen(authData.citizen);
      }
      if (appsData?.apps) {
        setApps(appsData.apps);
      }
      setLoading(false);
    });

    // Load pinned apps from localStorage
    try {
      const savedPins = localStorage.getItem("civix_workspace_pins");
      if (savedPins) {
        setPinnedSlugs(JSON.parse(savedPins));
      }
    } catch {}
  }, []);

  // PostMessage bridge listener for apps sending notifications / events
  useEffect(() => {
    const handleBridgeMessage = (event: MessageEvent) => {
      if (!event.data || typeof event.data !== "object") return;
      if (event.data.type === "CIVIX_DEVICE_ACTION" && event.data.action === "NOTIFICATION") {
        const notif = event.data.data;
        if (notif?.title) {
          toast(notif.title, {
            description: notif.message,
            icon: <Sparkles className="h-4 w-4 text-cyan-400" />,
          });
        }
      }
    };

    window.addEventListener("message", handleBridgeMessage);
    return () => window.removeEventListener("message", handleBridgeMessage);
  }, []);

  // Keyboard shortcuts: Alt+1..9 switch tabs, Alt+W close tab, Alt+S toggle split, Alt+T open picker
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt + number
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        const digit = parseInt(e.key, 10);
        if (!isNaN(digit) && digit >= 1 && digit <= tabs.length) {
          e.preventDefault();
          setActiveTabId(tabs[digit - 1].id);
        } else if (e.key.toLowerCase() === "w" && activeTabId) {
          e.preventDefault();
          closeTab(activeTabId);
        } else if (e.key.toLowerCase() === "s" && tabs.length > 1) {
          e.preventDefault();
          toggleSplitView();
        } else if (e.key.toLowerCase() === "t") {
          e.preventDefault();
          setIsAppPickerOpen(true);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [tabs, activeTabId, splitView]);

  // Launch or switch to an app
  const launchApp = (app: AppItem) => {
    // Check if app is already open
    const existing = tabs.find((t) => t.slug === app.slug);
    if (existing) {
      setActiveTabId(existing.id);
      setIsAppPickerOpen(false);
      toast.success(`Switched to ${app.name}`);
      return;
    }

    const newTab: WorkspaceTab = {
      id: `tab_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      appId: app.id,
      slug: app.slug,
      name: app.name,
      tagline: app.tagline,
      category: app.category,
      appUrl: app.appUrl,
      launchUrl: `/api/oauth/launch/${app.slug}`,
      iconUrl: (app as any).iconUrl || null,
      loaded: false,
    };

    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newTab.id);
    setIsAppPickerOpen(false);

    // If split view is enabled but secondary tab is empty or invalid, pick a secondary
    if (splitView && !secondaryTabId) {
      setSecondaryTabId(newTab.id);
    }

    toast.success(`Launched ${app.name} in Workspace`, {
      description: "1-Click SSO auto-authentication active",
      icon: <Zap className="h-4 w-4 text-cyan-400" />,
    });
  };

  const closeTab = (tabIdToClose: string) => {
    const tabIndex = tabs.findIndex((t) => t.id === tabIdToClose);
    const remaining = tabs.filter((t) => t.id !== tabIdToClose);
    setTabs(remaining);

    // Update active tab if closing the active one
    if (activeTabId === tabIdToClose) {
      if (remaining.length > 0) {
        const nextIndex = Math.min(tabIndex, remaining.length - 1);
        setActiveTabId(remaining[nextIndex].id);
      } else {
        setActiveTabId(null);
        setSplitView(false);
      }
    }

    // Update secondary tab if closing it
    if (secondaryTabId === tabIdToClose) {
      const other = remaining.find((t) => t.id !== activeTabId);
      setSecondaryTabId(other ? other.id : null);
      if (!other) setSplitView(false);
    }
  };

  const toggleSplitView = () => {
    if (splitView) {
      setSplitView(false);
    } else {
      if (tabs.length < 2) {
        toast.info("Open at least 2 apps to use Split-Screen view");
        return;
      }
      setSplitView(true);
      if (!secondaryTabId || secondaryTabId === activeTabId) {
        const other = tabs.find((t) => t.id !== activeTabId);
        if (other) setSecondaryTabId(other.id);
      }
    }
  };

  const togglePin = (slug: string) => {
    setPinnedSlugs((prev) => {
      const next = prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug];
      try {
        localStorage.setItem("civix_workspace_pins", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const reloadTab = (tabId: string) => {
    const iframe = document.getElementById(`iframe-${tabId}`) as HTMLIFrameElement | null;
    if (iframe) {
      iframe.src = iframe.src;
      toast.info("Reloading viewport...");
    }
  };

  const openInNewWindow = (launchUrl: string) => {
    window.open(launchUrl, "_blank", "noopener,noreferrer");
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const activeTab = tabs.find((t) => t.id === activeTabId);
  const secondaryTab = tabs.find((t) => t.id === secondaryTabId);

  const filteredPickerApps = useMemo(() => {
    return apps.filter((app) => {
      const q = pickerSearch.toLowerCase().trim();
      if (!q) return true;
      return (
        app.name.toLowerCase().includes(q) ||
        app.tagline.toLowerCase().includes(q) ||
        app.category.toLowerCase().includes(q)
      );
    });
  }, [apps, pickerSearch]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#05070d] text-zinc-100 font-sans selection:bg-cyan-500 selection:text-black">
      {/* 1. LEFT RAIL DOCK (COLLAPSIBLE) */}
      <aside
        className={`flex flex-col border-r border-cyan-950/40 bg-[#070b14]/95 backdrop-blur-xl transition-all duration-300 z-30 shrink-0 ${
          dockCollapsed ? "w-16" : "w-64"
        }`}
      >
        {/* Dock Header & Logo */}
        <div className="flex h-14 items-center justify-between border-b border-zinc-800/80 px-3.5">
          <Link href="/" className="flex items-center gap-2.5 overflow-hidden group">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-sky-600 text-zinc-950 shadow-md shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <Layers className="h-4 w-4 stroke-[2.5]" />
            </div>
            {!dockCollapsed && (
              <div className="flex flex-col leading-none truncate">
                <span className="text-sm font-black tracking-tight text-white flex items-center gap-1">
                  CIVIX <span className="text-[9px] font-mono font-bold text-cyan-400">WebOS</span>
                </span>
                <span className="text-[8px] font-semibold text-zinc-400 tracking-wider uppercase mt-0.5">
                  Workspace
                </span>
              </div>
            )}
          </Link>

          <button
            onClick={() => setDockCollapsed((c) => !c)}
            className="hidden sm:flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-white/5 hover:text-white transition-colors"
            title={dockCollapsed ? "Expand Dock" : "Collapse Dock"}
          >
            {dockCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Action Button: Add App */}
        <div className="p-2 border-b border-zinc-800/60">
          <button
            onClick={() => setIsAppPickerOpen(true)}
            className={`w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 text-black font-bold text-xs shadow-md shadow-cyan-500/20 hover:from-cyan-400 hover:to-sky-400 transition-all py-2 ${
              dockCollapsed ? "px-0" : "px-3"
            }`}
            title="Open App in Workspace"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            {!dockCollapsed && <span>Open App</span>}
          </button>
        </div>

        {/* Dock Scrollable Apps List */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4 scrollbar-none">
          {/* Currently Running Tabs Section */}
          {tabs.length > 0 && (
            <div>
              {!dockCollapsed && (
                <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center justify-between">
                  <span>Running ({tabs.length})</span>
                  <span className="text-cyan-400 text-[9px] font-mono">Alt+1..{tabs.length}</span>
                </div>
              )}
              <div className="space-y-1">
                {tabs.map((tab, idx) => {
                  const isActive = tab.id === activeTabId;
                  const isSec = splitView && tab.id === secondaryTabId;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        if (splitView && tab.id !== activeTabId && tab.id !== secondaryTabId) {
                          setSecondaryTabId(tab.id);
                        } else {
                          setActiveTabId(tab.id);
                        }
                      }}
                      className={`w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs transition-all relative group text-left ${
                        isActive
                          ? "bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 shadow-sm shadow-cyan-500/10"
                          : isSec
                          ? "bg-sky-950/40 text-sky-200 border border-sky-500/30"
                          : "text-zinc-300 hover:bg-white/5 hover:text-white"
                      }`}
                      title={`${tab.name} (Alt+${idx + 1})`}
                    >
                      <div className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-700/80 font-bold text-[10px] uppercase text-cyan-400">
                        {tab.name.slice(0, 2)}
                        <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                        </span>
                      </div>

                      {!dockCollapsed && (
                        <div className="flex-1 min-w-0">
                          <span className="font-semibold block truncate leading-tight">{tab.name}</span>
                          <span className="text-[10px] text-zinc-500 block truncate">{tab.category}</span>
                        </div>
                      )}

                      {!dockCollapsed && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            closeTab(tab.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-400 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Verified Apps Directory */}
          <div>
            {!dockCollapsed && (
              <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                <span>Verified Bourses & Apps</span>
              </div>
            )}
            <div className="space-y-1">
              {apps.map((app) => {
                const isRunning = tabs.some((t) => t.slug === app.slug);
                const IconComponent = CATEGORY_ICONS[app.category] || Landmark;
                return (
                  <button
                    key={app.id}
                    onClick={() => launchApp(app)}
                    className={`w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs transition-colors group text-left ${
                      isRunning
                        ? "text-cyan-300 bg-cyan-950/20 hover:bg-cyan-950/40"
                        : "text-zinc-400 hover:bg-white/5 hover:text-white"
                    }`}
                    title={app.name}
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 group-hover:border-cyan-500/50 group-hover:text-cyan-400 transition-colors">
                      <IconComponent className="h-3.5 w-3.5" />
                    </div>

                    {!dockCollapsed && (
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-zinc-200 group-hover:text-white truncate">
                            {app.name}
                          </span>
                          {isRunning && (
                            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shrink-0" />
                          )}
                        </div>
                        <span className="text-[10px] text-zinc-500 block truncate">{app.tagline}</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Dock Footer Navigation */}
        <div className="border-t border-zinc-800/80 p-2 space-y-1">
          <Link
            href="/"
            className={`w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs text-zinc-400 hover:bg-white/5 hover:text-white transition-colors ${
              dockCollapsed ? "justify-center" : ""
            }`}
            title="CIVIX App Store"
          >
            <Compass className="h-4 w-4 text-cyan-400 shrink-0" />
            {!dockCollapsed && <span>Store Catalog</span>}
          </Link>

          <Link
            href="/edicts"
            className={`w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs text-zinc-400 hover:bg-white/5 hover:text-white transition-colors ${
              dockCollapsed ? "justify-center" : ""
            }`}
            title="Imperial Gazette & Decrees"
          >
            <Scroll className="h-4 w-4 text-amber-400 shrink-0" />
            {!dockCollapsed && <span>Imperial Edicts</span>}
          </Link>

          <Link
            href="/leaderboard"
            className={`w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs text-zinc-400 hover:bg-white/5 hover:text-white transition-colors ${
              dockCollapsed ? "justify-center" : ""
            }`}
            title="Realm Leaderboard"
          >
            <Trophy className="h-4 w-4 text-amber-400 shrink-0" />
            {!dockCollapsed && <span>Leaderboard</span>}
          </Link>

          <Link
            href="/verify"
            className={`w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs text-zinc-400 hover:bg-white/5 hover:text-white transition-colors ${
              dockCollapsed ? "justify-center" : ""
            }`}
            title="KYC Verification Chamber"
          >
            <Award className="h-4 w-4 text-emerald-400 shrink-0" />
            {!dockCollapsed && <span>KYC Chamber</span>}
          </Link>

          <Link
            href="/inbox"
            className={`w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs text-zinc-400 hover:bg-white/5 hover:text-white transition-colors ${
              dockCollapsed ? "justify-center" : ""
            }`}
            title="Universal Notification Hub"
          >
            <Bell className="h-4 w-4 text-sky-400 shrink-0" />
            {!dockCollapsed && <span>Universal Inbox</span>}
          </Link>

          <Link
            href="/dashboard"
            className={`w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs text-zinc-400 hover:bg-white/5 hover:text-white transition-colors ${
              dockCollapsed ? "justify-center" : ""
            }`}
            title="Citizen Passport"
          >
            <Shield className="h-4 w-4 text-cyan-400 shrink-0" />
            {!dockCollapsed && <span>Citizen Passport</span>}
          </Link>
        </div>
      </aside>

      {/* 2. MAIN WORKSPACE CANVAS */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#04060b]">
        {/* TOP TAB STRIP & TOOLBAR */}
        <header className="h-14 border-b border-zinc-800/80 bg-[#070b14]/90 backdrop-blur-md flex items-center justify-between px-3 gap-2 shrink-0 z-20">
          {/* Active Tabs Strip */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none max-w-3xl flex-1 pr-2">
            {tabs.map((tab, idx) => {
              const isActive = tab.id === activeTabId;
              const isSec = splitView && tab.id === secondaryTabId;
              return (
                <div
                  key={tab.id}
                  onClick={() => setActiveTabId(tab.id)}
                  className={`group flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold cursor-pointer transition-all border shrink-0 select-none ${
                    isActive
                      ? "bg-cyan-950/50 border-cyan-500/50 text-cyan-200 shadow-md shadow-cyan-950/50"
                      : isSec
                      ? "bg-sky-950/30 border-sky-500/30 text-sky-300"
                      : "bg-[#0b101c] border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                  }`}
                >
                  <span className="font-mono text-[10px] text-zinc-500">#{idx + 1}</span>
                  <span className="truncate max-w-[120px] sm:max-w-[160px]">{tab.name}</span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTab(tab.id);
                    }}
                    className="p-0.5 rounded hover:bg-white/10 hover:text-rose-400 transition-colors"
                    title="Close tab (Alt+W)"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              );
            })}

            {/* + New Tab Button */}
            <button
              onClick={() => setIsAppPickerOpen(true)}
              className="flex items-center gap-1 rounded-xl border border-dashed border-zinc-700/80 px-2.5 py-1.5 text-xs font-medium text-zinc-400 hover:border-cyan-500/50 hover:text-cyan-300 hover:bg-cyan-500/5 transition-all shrink-0"
              title="Add app tab (Alt+T)"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">New Tab</span>
            </button>
          </div>

          {/* Workspace Toolbar Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Split Screen Toggle */}
            <button
              onClick={toggleSplitView}
              className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold border transition-all ${
                splitView
                  ? "bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-sm shadow-cyan-500/20"
                  : "bg-[#0b101c] border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
              }`}
              title="Toggle Dual Viewport Split-Screen (Alt+S)"
            >
              <Columns2 className="h-3.5 w-3.5 text-cyan-400" />
              <span className="hidden md:inline">{splitView ? "Split Active" : "Split View"}</span>
            </button>

            {/* Active Tab Actions (Reload & Popout) */}
            {activeTab && (
              <>
                <button
                  onClick={() => reloadTab(activeTab.id)}
                  className="rounded-xl border border-zinc-800 bg-[#0b101c] p-2 text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors"
                  title="Reload current app"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>

                <button
                  onClick={() => openInNewWindow(activeTab.launchUrl)}
                  className="rounded-xl border border-zinc-800 bg-[#0b101c] p-2 text-zinc-400 hover:text-cyan-300 hover:border-cyan-500/40 transition-colors"
                  title="Open app in external window"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </button>
              </>
            )}

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="rounded-xl border border-zinc-800 bg-[#0b101c] p-2 text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors"
              title="Fullscreen Workspace"
            >
              {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </button>

            {/* Citizen Status Badge */}
            {citizen ? (
              <div className="hidden lg:flex items-center gap-2 rounded-xl border border-zinc-800 bg-[#0b101c] px-2.5 py-1 text-xs">
                <div className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br from-cyan-400 to-sky-600 text-[10px] font-black text-black">
                  {citizen.currentUsername[0]?.toUpperCase()}
                </div>
                <div className="flex flex-col text-left leading-none">
                  <span className="font-semibold text-zinc-200">{citizen.currentUsername}</span>
                  <span className="text-[9px] text-cyan-400 font-mono">1-Click SSO</span>
                </div>
              </div>
            ) : (
              <Link
                href="/login?return_to=/workspace"
                className="hidden sm:flex items-center gap-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 transition-colors"
              >
                <LogIn className="h-3 w-3" />
                <span>Log In</span>
              </Link>
            )}
          </div>
        </header>

        {/* VIEWPORT AREA: Multi-App Sandbox */}
        <div className="flex-1 relative w-full h-[calc(100vh-3.5rem)] overflow-hidden bg-black">
          {tabs.length === 0 ? (
            /* EMPTY WORKSPACE: Command Deck Welcome */
            <div className="h-full w-full flex flex-col items-center justify-center p-6 text-center overflow-y-auto">
              <div className="max-w-2xl w-full space-y-8 animate-in fade-in duration-300">
                {/* Hero Icon */}
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 via-sky-500 to-indigo-600 shadow-xl shadow-cyan-500/25">
                  <Laptop className="h-8 w-8 text-black stroke-[2.2]" />
                </div>

                <div className="space-y-2">
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    Sovereign WebOS Workspace
                  </h1>
                  <p className="text-sm text-zinc-400 max-w-lg mx-auto">
                    Run, multitask, and split-screen all Parlamentum bourses, order books, and guild hubs with persistent state and 1-click single sign-on.
                  </p>
                </div>

                {/* Quick Launch Recommendations */}
                <div className="space-y-3 text-left">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                      Quick Launch verified Bourses
                    </span>
                    <span className="text-[11px] text-cyan-400 flex items-center gap-1">
                      <Zap className="h-3 w-3" /> Auto SSO Handshake
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {apps.slice(0, 4).map((app) => {
                      const IconComponent = CATEGORY_ICONS[app.category] || Landmark;
                      return (
                        <div
                          key={app.id}
                          onClick={() => launchApp(app)}
                          className="group flex items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-[#0b101c]/90 p-3.5 hover:border-cyan-500/50 hover:bg-[#0f172a] hover:shadow-lg hover:shadow-cyan-500/10 cursor-pointer transition-all"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-300 group-hover:scale-105 transition-transform">
                              <IconComponent className="h-5 w-5" />
                            </div>
                            <div className="truncate">
                              <span className="font-bold text-white block text-sm group-hover:text-cyan-300 transition-colors">
                                {app.name}
                              </span>
                              <span className="text-xs text-zinc-500 block truncate">
                                {app.tagline}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 text-xs font-bold text-cyan-400 shrink-0">
                            <span>Launch</span>
                            <ArrowUpRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Keyboard Shortcuts Hint Bar */}
                <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-zinc-500 pt-4 border-t border-zinc-900">
                  <span className="flex items-center gap-1.5">
                    <kbd className="rounded bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400">Alt + 1..9</kbd>
                    <span>Switch Tabs</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <kbd className="rounded bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400">Alt + S</kbd>
                    <span>Split Screen</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <kbd className="rounded bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400">Alt + W</kbd>
                    <span>Close Active Tab</span>
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* ACTIVE VIEWPORTS CONTAINER */
            <div className="h-full w-full flex">
              {/* PRIMARY VIEWPORT (Full or Left Split) */}
              <div
                className={`h-full relative overflow-hidden transition-all duration-200 ${
                  splitView ? "w-1/2 border-r border-cyan-950/60" : "w-full"
                }`}
              >
                {/* Secondary pane header tag in split view */}
                {splitView && activeTab && (
                  <div className="h-7 bg-[#090e18] border-b border-zinc-800 px-3 flex items-center justify-between text-[11px] font-semibold text-zinc-300">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-cyan-400"></span>
                      <span>Primary: {activeTab.name}</span>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500">Left Pane</span>
                  </div>
                )}

                {/* Render all opened tabs persistent in DOM to maintain state */}
                {tabs.map((tab) => {
                  const isVisible = tab.id === activeTabId;
                  const isTopLevelRequired = APPS_REQUIRING_TOP_LEVEL.has(tab.slug) && !forceIframeTabs[tab.id];

                  return (
                    <div
                      key={tab.id}
                      className={`w-full h-full relative ${isVisible ? "block" : "hidden"}`}
                    >
                      {isTopLevelRequired ? (
                        /* SOVEREIGN CONNECTED PORTAL (Zero Cookie Drop) */
                        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-[#080d1a] to-[#04060b]">
                          <div className="max-w-md w-full space-y-6 animate-in fade-in duration-200">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-950 via-sky-950 to-indigo-950 border border-cyan-500/40 shadow-xl shadow-cyan-950/60">
                              <Landmark className="h-8 w-8 text-cyan-300" />
                            </div>

                            <div>
                              <div className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 px-3 py-0.5 text-[10px] font-bold text-cyan-300 uppercase tracking-wider mb-2">
                                <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />
                                Sovereign Protected Session
                              </div>
                              <h2 className="text-xl font-bold text-white">{tab.name}</h2>
                              <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">{tab.tagline}</p>
                            </div>

                            <div className="rounded-xl border border-zinc-800 bg-[#090f1d] p-3.5 text-left space-y-1.5">
                              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
                                <Zap className="h-3.5 w-3.5 text-cyan-400" />
                                <span>1-Click Sovereign SSO Auto-Login</span>
                              </div>
                              <p className="text-[11px] text-zinc-400 leading-relaxed">
                                To prevent browser third-party cookie isolation and guarantee contract escrow integrity, this bourse connects via the high-speed top-level sovereign bridge.
                              </p>
                            </div>

                            <div className="space-y-2 pt-2">
                              <button
                                onClick={() => openInNewWindow(tab.launchUrl)}
                                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-sky-500 py-3 px-4 text-xs font-extrabold text-black shadow-lg shadow-cyan-500/25 hover:brightness-110 active:scale-95 transition-all"
                              >
                                <Zap className="h-4 w-4 fill-black stroke-black" />
                                <span>Launch {tab.name} (1-Click SSO)</span>
                                <ExternalLink className="h-3.5 w-3.5" />
                              </button>

                              <button
                                onClick={() => setForceIframeTabs((prev) => ({ ...prev, [tab.id]: true }))}
                                className="w-full text-center text-[11px] text-zinc-500 hover:text-zinc-300 py-1 transition-colors"
                              >
                                Attempt In-Frame View (Experimental)
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Sandboxed iframe */
                        <>
                          <iframe
                            id={`iframe-${tab.id}`}
                            src={tab.launchUrl}
                            title={tab.name}
                            allow="clipboard-write; clipboard-read; camera; microphone; geolocation"
                            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
                            className="w-full h-full border-0 bg-[#07090e]"
                          />

                          {/* Fallback bar if app cannot be embedded due to external X-Frame restrictions */}
                          <div className="absolute bottom-2 right-2 flex items-center gap-2 rounded-xl bg-black/80 backdrop-blur-md border border-zinc-800 px-3 py-1.5 text-[11px] text-zinc-400 shadow-xl opacity-40 hover:opacity-100 transition-opacity">
                            <span>External security blocking frame?</span>
                            <button
                              onClick={() => openInNewWindow(tab.launchUrl)}
                              className="font-bold text-cyan-400 hover:underline flex items-center gap-1"
                            >
                              Pop-Out <ExternalLink className="h-3 w-3" />
                            </button>
                            {APPS_REQUIRING_TOP_LEVEL.has(tab.slug) && (
                              <button
                                onClick={() => setForceIframeTabs((prev) => ({ ...prev, [tab.id]: false }))}
                                className="text-zinc-400 hover:text-white underline ml-1"
                              >
                                Return to Portal
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* SECONDARY VIEWPORT (Right Split Pane) */}
              {splitView && (
                <div className="w-1/2 h-full relative overflow-hidden bg-[#06080e] flex flex-col">
                  {/* Secondary Header with Switcher */}
                  <div className="h-7 bg-[#090e18] border-b border-zinc-800 px-3 flex items-center justify-between text-[11px] font-semibold text-zinc-300 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-sky-400"></span>
                      <span>Secondary: {secondaryTab?.name || "Select Tab"}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      {tabs.length > 2 && (
                        <select
                          value={secondaryTabId || ""}
                          onChange={(e) => setSecondaryTabId(e.target.value)}
                          className="bg-zinc-900 border border-zinc-700 rounded px-1.5 py-0.5 text-[10px] text-zinc-300 outline-none"
                        >
                          {tabs.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                      )}
                      <button
                        onClick={() => setSplitView(false)}
                        className="p-1 hover:text-rose-400"
                        title="Close Split Screen"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  {/* Secondary Viewport Frame */}
                  <div className="flex-1 relative w-full h-full overflow-hidden">
                    {secondaryTab ? (
                      APPS_REQUIRING_TOP_LEVEL.has(secondaryTab.slug) && !forceIframeTabs[secondaryTab.id] ? (
                        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-[#080d1a] to-[#04060b]">
                          <div className="max-w-xs space-y-4">
                            <h3 className="text-sm font-bold text-white">{secondaryTab.name}</h3>
                            <p className="text-[11px] text-zinc-400">{secondaryTab.tagline}</p>
                            <button
                              onClick={() => openInNewWindow(secondaryTab.launchUrl)}
                              className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-cyan-400 py-2.5 px-3 text-xs font-bold text-black shadow-md hover:brightness-110 transition-all"
                            >
                              <Zap className="h-3.5 w-3.5 fill-black stroke-black" />
                              <span>Open in Sovereign Tab</span>
                              <ExternalLink className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => setForceIframeTabs((prev) => ({ ...prev, [secondaryTab.id]: true }))}
                              className="text-[10px] text-zinc-500 hover:text-zinc-300 underline"
                            >
                              Attempt In-Frame View
                            </button>
                          </div>
                        </div>
                      ) : (
                        <iframe
                          id={`iframe-sec-${secondaryTab.id}`}
                          src={secondaryTab.launchUrl}
                          title={secondaryTab.name}
                          allow="clipboard-write; clipboard-read; camera; microphone; geolocation"
                          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
                          className="w-full h-full border-0 bg-[#07090e]"
                        />
                      )
                    ) : (
                      <div className="h-full w-full flex flex-col items-center justify-center p-4 text-center text-zinc-500 text-xs">
                        <span>Select an app to dock in this pane</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* 3. MODAL: APP PICKER (ALT+T) */}
      {isAppPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div
            className="fixed inset-0"
            onClick={() => setIsAppPickerOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-cyan-500/40 bg-[#0a0f1d] shadow-2xl shadow-cyan-950/60 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Plus className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Open App in Workspace</h3>
                  <p className="text-[11px] text-zinc-400">Launch into a new state-preserving tab</p>
                </div>
              </div>
              <button
                onClick={() => setIsAppPickerOpen(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-white/5 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                value={pickerSearch}
                onChange={(e) => setPickerSearch(e.target.value)}
                placeholder="Search verified bourses, casinos, tools..."
                autoFocus
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-cyan-500"
              />
            </div>

            {/* List */}
            <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1 scrollbar-none">
              {filteredPickerApps.length === 0 ? (
                <div className="py-8 text-center text-xs text-zinc-500">
                  No matching apps found in catalog.
                </div>
              ) : (
                filteredPickerApps.map((app) => {
                  const IconComponent = CATEGORY_ICONS[app.category] || Landmark;
                  const isRunning = tabs.some((t) => t.slug === app.slug);
                  return (
                    <div
                      key={app.id}
                      onClick={() => launchApp(app)}
                      className="group flex items-center justify-between gap-3 rounded-xl border border-zinc-800/80 bg-[#0d1222] p-2.5 hover:border-cyan-500/50 hover:bg-cyan-950/20 cursor-pointer transition-all"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 text-cyan-400 group-hover:scale-105 transition-transform">
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <div className="truncate">
                          <span className="font-semibold text-xs text-white group-hover:text-cyan-300 block truncate">
                            {app.name}
                          </span>
                          <span className="text-[11px] text-zinc-400 block truncate">
                            {app.tagline}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {isRunning ? (
                          <span className="rounded bg-cyan-500/20 border border-cyan-500/40 px-2 py-0.5 text-[10px] font-mono text-cyan-300">
                            Switch
                          </span>
                        ) : (
                          <span className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] font-mono text-zinc-300 group-hover:bg-cyan-500 group-hover:text-black font-bold transition-colors">
                            Launch
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
