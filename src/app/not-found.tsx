import Link from "next/link";
import CivixNavbar from "@/components/CivixNavbar";
import { Compass, LayoutGrid, ShieldAlert, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#06080e] text-zinc-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      <CivixNavbar />

      <main className="flex-1 flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-400 shadow-xl shadow-cyan-950/60">
            <ShieldAlert className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-cyan-400">
              Sector 404 · Uncharted Domain
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Sovereign Sector Not Found
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-sm mx-auto">
              The coordinates you requested do not exist in the Parlamentum registry or have been relocated by the Imperial Senate.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
            <Link
              href="/"
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-sky-500 px-5 py-2.5 text-xs font-bold text-black shadow-lg shadow-cyan-500/20 hover:brightness-110 active:scale-95 transition-all"
            >
              <Compass className="h-3.5 w-3.5" />
              <span>Return to Store</span>
            </Link>

            <Link
              href="/workspace"
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-xl border border-zinc-800 bg-[#0a0f1d] px-5 py-2.5 text-xs font-semibold text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors"
            >
              <LayoutGrid className="h-3.5 w-3.5 text-cyan-400" />
              <span>Open WebOS Workspace</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
