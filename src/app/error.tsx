"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw, Compass } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("CIVIX Runtime Error Boundary caught:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#06080e] text-zinc-100 flex flex-col items-center justify-center p-6 text-center font-sans selection:bg-cyan-500 selection:text-black">
      <div className="max-w-md w-full space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-400 shadow-xl shadow-rose-950/60">
          <AlertCircle className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-rose-400">
            Nexus Protocol Exception
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Sector Signal Interrupted
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-sm mx-auto">
            An unexpected error interrupted your session. Your credentials and ledger state remain cryptographically secure.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-xl bg-cyan-400 px-5 py-2.5 text-xs font-bold text-black shadow-lg shadow-cyan-500/20 hover:brightness-110 active:scale-95 transition-all"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Retry Connection</span>
          </button>

          <Link
            href="/"
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-xl border border-zinc-800 bg-[#0a0f1d] px-5 py-2.5 text-xs font-semibold text-zinc-300 hover:text-white transition-colors"
          >
            <Compass className="h-3.5 w-3.5 text-cyan-400" />
            <span>Store Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
