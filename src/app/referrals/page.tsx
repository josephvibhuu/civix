"use client";

import { useEffect, useState } from "react";
import CivixNavbar from "@/components/CivixNavbar";
import { Users, Copy, Check, Sparkles, Shield, ArrowRight, Share2, Award, ExternalLink, Zap } from "lucide-react";
import Link from "next/link";

interface ReferralData {
  referralCode: string;
  referralUrl: string;
  totalReferrals: number;
  referrals: {
    id: string;
    username: string;
    verificationTier: string;
    joinedAt: string;
  }[];
}

export default function ReferralsPage() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [customCode, setCustomCode] = useState("");
  const [updatingCode, setUpdatingCode] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/referrals")
      .then((r) => r.json())
      .then((res) => {
        if (!res.error) {
          setData(res);
          setCustomCode(res.referralCode);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleCopy = () => {
    if (!data) return;
    navigator.clipboard.writeText(data.referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUpdateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingCode(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customCode }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to update code");

      setData((prev) => prev ? { ...prev, referralCode: resData.referralCode, referralUrl: resData.referralUrl } : null);
      setMessage("Your vanity referral code is saved!");
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUpdatingCode(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#06080e] text-zinc-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      <CivixNavbar />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full">
        {/* Header */}
        <div className="max-w-3xl mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-1 text-xs font-semibold text-cyan-300 mb-4">
            <Users className="h-4 w-4" />
            <span>Universal Ecosystem Referral Protocol</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            Refer Once. Earn Across Every App.
          </h1>
          <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
            In standard platforms, you have to refer players to each website individually. 
            With <strong className="text-zinc-200">Civix Universal Referrals</strong>, when someone signs up with your link, you are permanently bound as their referrer across <strong className="text-cyan-400">every single connected app</strong> — Grow UR Gold, prediction markets, arenas, and casinos.
          </p>
        </div>

        {loading ? (
          <div className="h-64 rounded-2xl border border-zinc-800 bg-zinc-900/40 animate-pulse" />
        ) : !data ? (
          <div className="rounded-2xl border border-cyan-950/60 bg-[#0a0f1d]/80 p-8 text-center max-w-lg mx-auto">
            <Shield className="h-10 w-10 text-cyan-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white mb-1">Log In to Access Your Referral Hub</h3>
            <p className="text-xs text-zinc-400 mb-4">Create or sign into your Civix citizen passport to generate your ecosystem referral link.</p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 text-xs font-bold text-black hover:bg-cyan-400 transition-all shadow-lg shadow-cyan-500/20"
            >
              Sign In with Civix
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Referral Link & Vanity Customizer Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Card 1: Your Link */}
              <div className="lg:col-span-7 rounded-2xl border border-cyan-950/60 bg-[#0c121e]/70 p-6 backdrop-blur-md shadow-xl">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block mb-1">
                  Your Master Referral Link
                </span>
                <p className="text-xs text-zinc-400 mb-4">
                  Share this link anywhere on Discord, Telegram, or in-game chats. It covers all apps in the realm.
                </p>

                <div className="flex items-center gap-2 rounded-xl bg-black p-2.5 border border-zinc-800">
                  <span className="font-mono text-xs text-cyan-300 truncate flex-1 px-1">
                    {data.referralUrl}
                  </span>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 rounded-lg bg-zinc-800 px-3.5 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-cyan-500 hover:text-black transition-all shrink-0"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copied ? "Copied!" : "Copy"}</span>
                  </button>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-4 pt-6 border-t border-zinc-800/80">
                  <div>
                    <span className="text-[11px] text-zinc-500 block">Total Referrals</span>
                    <span className="text-2xl font-black text-white">{data.totalReferrals}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-zinc-500 block">Cross-App Coverage</span>
                    <span className="text-xs font-bold text-emerald-400 mt-2 block">100% of Apps</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-zinc-500 block">Status</span>
                    <span className="text-xs font-bold text-cyan-400 mt-2 block">Active Promoter</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Custom Vanity Code */}
              <div className="lg:col-span-5 rounded-2xl border border-cyan-950/60 bg-[#0c121e]/70 p-6 backdrop-blur-md shadow-xl">
                <span className="text-xs font-bold text-sky-400 uppercase tracking-wider block mb-1">
                  Customize Vanity Code
                </span>
                <p className="text-xs text-zinc-400 mb-4">
                  Create a memorable vanity referral handle (e.g. your guild tag or brand):
                </p>

                <form onSubmit={handleUpdateCode} className="space-y-3">
                  {error && <p className="text-red-400 text-xs">{error}</p>}
                  {message && <p className="text-emerald-400 text-xs">{message}</p>}

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      required
                      value={customCode}
                      onChange={(e) => setCustomCode(e.target.value)}
                      placeholder="e.g. EMPIRE"
                      className="w-full rounded-xl border border-zinc-800 bg-black p-2.5 text-xs font-mono uppercase text-zinc-100 outline-none focus:border-cyan-400"
                    />
                    <button
                      type="submit"
                      disabled={updatingCode}
                      className="rounded-xl bg-cyan-500 px-4 py-2.5 text-xs font-bold text-black hover:bg-cyan-400 transition-all shrink-0 disabled:opacity-50"
                    >
                      {updatingCode ? "Saving..." : "Save"}
                    </button>
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    Links update to: <code className="text-cyan-400">civix-plum.vercel.app/r/{customCode.toUpperCase()}</code>
                  </p>
                </form>
              </div>
            </div>

            {/* Referred Citizens Table */}
            <div className="rounded-2xl border border-zinc-800/80 bg-[#0c121e]/70 p-6 backdrop-blur-md shadow-xl">
              <h3 className="text-base font-bold text-white mb-4 flex items-center justify-between">
                <span>Citizens You've Brought Into the Realm</span>
                <span className="text-xs text-zinc-500 font-normal">{data.referrals.length} citizens attributed</span>
              </h3>

              {data.referrals.length === 0 ? (
                <div className="text-center py-12 rounded-xl border border-dashed border-zinc-800">
                  <Share2 className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
                  <p className="text-xs text-zinc-400">No citizens have registered using your link yet.</p>
                  <p className="text-[11px] text-zinc-500 mt-1">Share your link with citizens looking to trade stocks on GUG or play games.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-zinc-800 text-zinc-500">
                        <th className="pb-3 font-medium">Citizen Handle</th>
                        <th className="pb-3 font-medium">Verification Status</th>
                        <th className="pb-3 font-medium">Joined Realm</th>
                        <th className="pb-3 font-medium text-right">Ecosystem State</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60">
                      {data.referrals.map((c) => (
                        <tr key={c.id} className="text-zinc-300">
                          <td className="py-3 font-semibold text-zinc-100">{c.username}</td>
                          <td className="py-3">
                            <span className="rounded-full bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 text-[10px] font-semibold text-cyan-300">
                              {c.verificationTier.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="py-3 text-zinc-400">{new Date(c.joinedAt).toLocaleDateString()}</td>
                          <td className="py-3 text-right text-cyan-400 font-medium">Connected to GUG & Realm</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
