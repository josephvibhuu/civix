"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import CivixNavbar from "@/components/CivixNavbar";
import { 
  Code2, Key, Layers, Copy, Check, ShieldCheck, Zap, 
  Terminal, Globe, PlusCircle, Sparkles, ExternalLink, ArrowRight, Shield 
} from "lucide-react";
import { toast } from "sonner";

export default function DevelopersPage() {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // App registration form
  const [appName, setAppName] = useState("");
  const [appTagline, setAppTagline] = useState("");
  const [appDesc, setAppDesc] = useState("");
  const [appCategory, setAppCategory] = useState("gaming");
  const [appUrl, setAppUrl] = useState("");
  const [redirectUri, setRedirectUri] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdApp, setCreatedApp] = useState<{
    id: string;
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  } | null>(null);

  const [myApps, setMyApps] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.authenticated && d.citizen) {
          fetch("/api/apps")
            .then((ar) => ar.json())
            .then((ad) => {
              if (ad.apps) {
                const mine = ad.apps.filter((a: any) => a.ownerName === d.citizen.currentUsername);
                setMyApps(mine);
              }
            })
            .catch(() => {});
        }
      })
      .catch(() => {});
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const handleRegisterApp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/apps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: appName,
          tagline: appTagline,
          description: appDesc,
          category: appCategory,
          appUrl,
          redirectUri,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to register app");

      setCreatedApp(data.app);
      toast.success("Application registered in the Nexus!");
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#06080e] text-zinc-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      <CivixNavbar />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex-1 w-full space-y-10">
        {/* Header */}
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-1 text-xs font-semibold text-cyan-300">
            <Code2 className="h-4 w-4" />
            <span>Developer Protocol & Integration Suite</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            Build on the Civix Nexus
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
            Register your application to access Civix Single Sign-On, synchronized player identity, banking-grade KYC verification, and cross-app referral attribution. 100% free with 0% platform fee.
          </p>
        </div>

        {/* My Registered Apps Banner if any */}
        {myApps.length > 0 && (
          <div className="rounded-2xl border border-cyan-950/60 bg-[#0c121e]/80 p-5 space-y-3">
            <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              Your Registered Applications ({myApps.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {myApps.map((a) => (
                <div key={a.id} className="rounded-xl border border-zinc-800 bg-black/40 p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">{a.name}</span>
                    <span className="text-[10px] text-cyan-400 font-mono">Client ID: {a.clientId?.slice(0, 12)}...</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 line-clamp-1">{a.tagline}</p>
                  <div className="pt-2 flex justify-between items-center text-[10px]">
                    <span className="text-zinc-500">~{a.activeUsers} citizens</span>
                    <Link href={`/app/${a.slug}`} className="text-cyan-400 hover:underline">
                      Store Page →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT: App Registration */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-cyan-950/60 bg-[#0c121e]/70 p-6 backdrop-blur-md shadow-xl">
              <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                <PlusCircle className="h-5 w-5 text-cyan-400" />
                Register New Application
              </h2>

              {createdApp ? (
                <div className="space-y-4">
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                    <span className="text-xs font-bold text-emerald-400 block mb-1">
                      App Registered Successfully!
                    </span>
                    <p className="text-[11px] text-zinc-300">
                      Store your credentials safely. The client secret will not be displayed again.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 mb-1">Client ID</label>
                    <div className="flex items-center justify-between rounded-lg bg-black p-2.5 text-xs font-mono text-cyan-300 border border-zinc-800">
                      <span className="truncate">{createdApp.clientId}</span>
                      <button
                        onClick={() => copyToClipboard(createdApp.clientId, "cid")}
                        className="text-zinc-500 hover:text-white"
                      >
                        {copiedSection === "cid" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 mb-1">Client Secret</label>
                    <div className="flex items-center justify-between rounded-lg bg-black p-2.5 text-xs font-mono text-sky-300 border border-zinc-800">
                      <span className="truncate">{createdApp.clientSecret}</span>
                      <button
                        onClick={() => copyToClipboard(createdApp.clientSecret, "sec")}
                        className="text-zinc-500 hover:text-white"
                      >
                        {copiedSection === "sec" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => setCreatedApp(null)}
                    className="w-full rounded-xl bg-zinc-800 p-2.5 text-xs font-bold text-zinc-300 hover:bg-zinc-700 transition-all"
                  >
                    Register Another Application
                  </button>
                </div>
              ) : (
                <form onSubmit={handleRegisterApp} className="space-y-3.5 text-xs">
                  {error && (
                    <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-2.5 text-red-300 text-[11px]">
                      {error}
                    </div>
                  )}

                  <div>
                    <label className="block font-medium text-zinc-300 mb-1">Application Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Iron Forge Arena"
                      value={appName}
                      onChange={(e) => setAppName(e.target.value)}
                      className="w-full rounded-lg border border-zinc-800 bg-[#080d17] p-2.5 text-zinc-100 outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-zinc-300 mb-1">Tagline</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Turn-based gladiator crafting & duels"
                      value={appTagline}
                      onChange={(e) => setAppTagline(e.target.value)}
                      className="w-full rounded-lg border border-zinc-800 bg-[#080d17] p-2.5 text-zinc-100 outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-zinc-300 mb-1">Category</label>
                    <select
                      value={appCategory}
                      onChange={(e) => setAppCategory(e.target.value)}
                      className="w-full rounded-lg border border-zinc-800 bg-[#080d17] p-2.5 text-zinc-100 outline-none focus:border-cyan-400"
                    >
                      <option value="gaming">Gladiator & PVP Gaming</option>
                      <option value="finance">Finance & Stock Exchange</option>
                      <option value="casino">Casino & Dice Parlor</option>
                      <option value="utility">Banking & Utility</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-medium text-zinc-300 mb-1">Application URL</label>
                    <input
                      type="url"
                      required
                      placeholder="https://yourapp.vercel.app"
                      value={appUrl}
                      onChange={(e) => setAppUrl(e.target.value)}
                      className="w-full rounded-lg border border-zinc-800 bg-[#080d17] p-2.5 text-zinc-100 outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-zinc-300 mb-1">OAuth Redirect URI</label>
                    <input
                      type="url"
                      required
                      placeholder="https://yourapp.vercel.app/api/auth/callback"
                      value={redirectUri}
                      onChange={(e) => setRedirectUri(e.target.value)}
                      className="w-full rounded-lg border border-zinc-800 bg-[#080d17] p-2.5 text-zinc-100 outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-zinc-300 mb-1">Description</label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Describe what your app offers to citizens..."
                      value={appDesc}
                      onChange={(e) => setAppDesc(e.target.value)}
                      className="w-full rounded-lg border border-zinc-800 bg-[#080d17] p-2.5 text-zinc-100 outline-none focus:border-cyan-400"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 p-2.5 font-bold text-black hover:from-cyan-400 hover:to-sky-400 transition-all disabled:opacity-50 mt-2"
                  >
                    {loading ? "Generating Credentials..." : "Register App & Get API Keys"}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* RIGHT: SDK Documentation & Code Snippets */}
          <div className="lg:col-span-7 space-y-6" id="sdk">
            {/* Step 1 */}
            <div className="rounded-2xl border border-zinc-800 bg-[#0c121e]/70 p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-400 text-[10px] font-black text-black">
                    1
                  </span>
                  Add Civix Login Button (Client-Side)
                </h3>
                <button
                  onClick={() => copyToClipboard(`<a href="https://civix-plum.vercel.app/api/oauth/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=https://yourapp.com/callback&scope=identity" class="btn-civix">⚡ Sign in with Civix ID</a>`, "step1")}
                  className="text-xs text-zinc-400 hover:text-cyan-300 flex items-center gap-1"
                >
                  <Copy className="h-3 w-3" /> Copy
                </button>
              </div>
              <p className="text-xs text-zinc-400 mb-3">
                Place this link on your frontend. It initiates the standard OAuth 2.0 flow:
              </p>
              <pre className="overflow-x-auto rounded-xl bg-black p-4 text-xs font-mono text-zinc-300 border border-zinc-800/80">
{`<!-- Vanilla JS or React Button -->
<a 
  href="https://civix-plum.vercel.app/api/oauth/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=https://yourapp.com/callback&scope=identity"
  class="btn-civix"
>
  ⚡ Sign in with Civix ID
</a>`}
              </pre>
            </div>

            {/* Step 2 */}
            <div className="rounded-2xl border border-zinc-800 bg-[#0c121e]/70 p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-400 text-[10px] font-black text-black">
                    2
                  </span>
                  Exchange Auth Code for Citizen Profile (Server-Side)
                </h3>
                <button
                  onClick={() => copyToClipboard(`export async function GET(req) {\n  const code = req.nextUrl.searchParams.get("code");\n  const res = await fetch("https://civix-plum.vercel.app/api/oauth/token", {\n    method: "POST",\n    headers: { "Content-Type": "application/json" },\n    body: JSON.stringify({\n      code,\n      client_id: process.env.CIVIX_CLIENT_ID,\n      client_secret: process.env.CIVIX_CLIENT_SECRET\n    })\n  });\n  const { citizen } = await res.json();\n}`, "step2")}
                  className="text-xs text-zinc-400 hover:text-cyan-300 flex items-center gap-1"
                >
                  <Copy className="h-3 w-3" /> Copy
                </button>
              </div>
              <p className="text-xs text-zinc-400 mb-3">
                Works in Next.js API Routes, Cloudflare Workers, Express, or Node.js:
              </p>
              <pre className="overflow-x-auto rounded-xl bg-black p-4 text-xs font-mono text-cyan-300 border border-zinc-800/80">
{`// /api/auth/callback route
export async function GET(req) {
  const code = req.nextUrl.searchParams.get("code");

  // Exchange code with Civix
  const res = await fetch("https://civix-plum.vercel.app/api/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code,
      client_id: process.env.CIVIX_CLIENT_ID,
      client_secret: process.env.CIVIX_CLIENT_SECRET
    })
  });

  const { citizen } = await res.json();
  // citizen: { 
  //   id: "civ_...", 
  //   username: "CardinalSanjay", 
  //   gameProfileId: "cmuoy...",
  //   referralCode: "SANJAY",
  //   referredBy: "JosephArora"
  // }
  
  // Set your own session cookie or log user in!
}`}
              </pre>
            </div>

            {/* Step 3: Banking & Underwriting Scope */}
            <div className="rounded-2xl border border-zinc-800 bg-[#0c121e]/70 p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400 text-[10px] font-black text-black">
                    3
                  </span>
                  Banking & Financial Underwriting Scope (<code className="text-emerald-300">banking:kyc</code>)
                </h3>
              </div>
              <p className="text-xs text-zinc-400 mb-3">
                Built specifically for financial institutions (like Bank of Europe) and high-stakes exchanges to eliminate loan fraud:
              </p>
              <pre className="overflow-x-auto rounded-xl bg-black p-4 text-xs font-mono text-emerald-300 border border-zinc-800/80">
{`// Request scope: "identity banking:kyc"
// Token exchange returns anti-sybil & credit data:
{
  "verificationTier": "tier_2_bank_verified",
  "accountAgeDays": 45,
  "nameHistory": [
    { "previous": "Sanjay_V1", "updated": "CardinalSanjay", "syncedAt": "2026-10-18" }
  ],
  "isSanctioned": false
}`}
              </pre>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
