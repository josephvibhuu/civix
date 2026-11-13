"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { Search, Compass, Users, Code2, Shield, ExternalLink, Zap, ArrowRight, LayoutGrid } from "lucide-react";
import { AppItem } from "./AppCard";

interface Props {
  apps?: AppItem[];
  isOpen: boolean;
  onClose: () => void;
}

export default function CommandPalette({ apps = [], isOpen, onClose }: Props) {
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onClose();
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-28 p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-cyan-500/30 bg-[#0a0f1d] shadow-2xl shadow-cyan-950/50">
        <Command
          className="flex flex-col w-full text-zinc-100"
          filter={(value, search) => {
            if (value.toLowerCase().includes(search.toLowerCase())) return 1;
            return 0;
          }}
        >
          {/* Search Input Bar */}
          <div className="flex items-center border-b border-zinc-800/80 px-4 py-3">
            <Search className="h-4 w-4 shrink-0 text-cyan-400 mr-3" />
            <Command.Input
              autoFocus
              placeholder="Search apps, bourses, guilds, or actions..."
              className="w-full bg-transparent text-sm text-zinc-100 placeholder-zinc-500 outline-none"
            />
            <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-mono text-zinc-400">
              ESC
            </span>
          </div>

          <Command.List className="max-h-80 overflow-y-auto p-2 scrollbar-none">
            <Command.Empty className="py-8 text-center text-xs text-zinc-500">
              No results found in the Realm.
            </Command.Empty>

            {/* Applications Group */}
            {apps.length > 0 && (
              <Command.Group heading={<span className="text-[10px] font-bold text-zinc-500 uppercase px-2 py-1 block tracking-wider">Applications</span>}>
                {apps.map((app) => (
                  <Command.Item
                    key={app.id}
                    value={`${app.name} ${app.tagline} ${app.category}`}
                    onSelect={() => {
                      onClose();
                      router.push(`/app/${app.slug}`);
                    }}
                    className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-xs text-zinc-200 cursor-pointer hover:bg-cyan-500/10 hover:text-cyan-300 transition-colors aria-selected:bg-cyan-500/10 aria-selected:text-cyan-300"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cyan-950 border border-cyan-800 text-[10px] font-bold text-cyan-300 uppercase">
                        {app.name.slice(0, 2)}
                      </div>
                      <div className="truncate">
                        <span className="font-semibold block truncate">{app.name}</span>
                        <span className="text-[11px] text-zinc-500 block truncate">{app.tagline}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="rounded px-1.5 py-0.5 text-[10px] font-mono bg-zinc-900 border border-zinc-800 text-zinc-400">
                        {app.category}
                      </span>
                      <ArrowRight className="h-3 w-3 text-zinc-500" />
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Quick Actions */}
            <Command.Group heading={<span className="text-[10px] font-bold text-zinc-500 uppercase px-2 py-1 block tracking-wider mt-2">Navigation & Tools</span>}>
              <Command.Item
                value="Sovereign WebOS Workspace Multi App Desktop Split Screen Tabs"
                onSelect={() => {
                  onClose();
                  router.push("/workspace");
                }}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs text-zinc-300 cursor-pointer hover:bg-cyan-500/10 hover:text-cyan-300 transition-colors aria-selected:bg-cyan-500/10 aria-selected:text-cyan-300"
              >
                <LayoutGrid className="h-4 w-4 text-cyan-400" />
                <span className="font-semibold text-cyan-300">Open Sovereign WebOS Workspace</span>
                <span className="ml-auto text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300">Desktop WebOS</span>
              </Command.Item>

              <Command.Item
                value="App Store Explore"
                onSelect={() => {
                  onClose();
                  router.push("/");
                }}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs text-zinc-300 cursor-pointer hover:bg-white/5 hover:text-white transition-colors aria-selected:bg-white/5"
              >
                <Compass className="h-4 w-4 text-cyan-400" />
                <span>Explore App Store</span>
              </Command.Item>

              <Command.Item
                value="Citizen Dashboard My Passport"
                onSelect={() => {
                  onClose();
                  router.push("/dashboard");
                }}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs text-zinc-300 cursor-pointer hover:bg-white/5 hover:text-white transition-colors aria-selected:bg-white/5"
              >
                <Shield className="h-4 w-4 text-emerald-400" />
                <span>Citizen Passport & Dashboard</span>
              </Command.Item>

              <Command.Item
                value="Universal Referrals Commission"
                onSelect={() => {
                  onClose();
                  router.push("/referrals");
                }}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs text-zinc-300 cursor-pointer hover:bg-white/5 hover:text-white transition-colors aria-selected:bg-white/5"
              >
                <Users className="h-4 w-4 text-sky-400" />
                <span>Universal Referrals</span>
              </Command.Item>

              <Command.Item
                value="Developer Console Register App SDK"
                onSelect={() => {
                  onClose();
                  router.push("/developers");
                }}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs text-zinc-300 cursor-pointer hover:bg-white/5 hover:text-white transition-colors aria-selected:bg-white/5"
              >
                <Code2 className="h-4 w-4 text-indigo-400" />
                <span>Developer Console & SDK</span>
              </Command.Item>
            </Command.Group>
          </Command.List>

          <div className="flex items-center justify-between border-t border-zinc-800/80 px-4 py-2 text-[10px] text-zinc-500 bg-black/40">
            <span>Use ↑↓ to navigate, Enter to select</span>
            <span className="flex items-center gap-1 text-cyan-400">
              <Zap className="h-3 w-3" /> 1-Click SSO Enabled
            </span>
          </div>
        </Command>
      </div>
    </div>
  );
}
