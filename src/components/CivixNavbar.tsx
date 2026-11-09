"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Shield, Sparkles, LogIn, LogOut, Code2, Compass, KeyRound, ExternalLink, Coins } from "lucide-react";

interface Citizen {
  id: string;
  currentUsername: string;
  gameProfileId: string;
  vaultGold: number;
}

export default function CivixNavbar() {
  const [citizen, setCitizen] = useState<Citizen | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.authenticated) setCitizen(d.citizen);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setCitizen(null);
    window.location.reload();
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
              href="/developers"
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors"
            >
              <Code2 className="h-4 w-4 text-sky-400" />
              Developer BaaS & SDK
            </Link>
            <a
              href="https://parlamentum.org"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Parlamentum Main Game
              <ExternalLink className="h-3 w-3" />
            </a>
          </nav>
        </div>

        {/* User Account / Login */}
        <div className="flex items-center gap-3">
          {loading ? (
            <div className="h-8 w-24 animate-pulse rounded bg-zinc-800" />
          ) : citizen ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-1.5 rounded-md border border-amber-500/20 bg-amber-500/5 px-2.5 py-1 text-xs">
                <Coins className="h-3.5 w-3.5 text-amber-400" />
                <span className="font-semibold text-amber-300">{citizen.vaultGold.toFixed(2)}</span>
                <span className="text-[10px] text-zinc-400">Vault Gold</span>
              </div>
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
