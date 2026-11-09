"use client";

import { useState } from "react";
import CivixNavbar from "@/components/CivixNavbar";
import { Code2, Key, Layers, Copy, Check, ShieldCheck, Zap, Terminal, Globe, PlusCircle } from "lucide-react";

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

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
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
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-zinc-100 flex flex-col font-sans selection:bg-amber-500 selection:text-black">
      <CivixNavbar />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full">
        {/* Header */}
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-400 mb-4">
            <Code2 className="h-4 w-4" />
            <span>Developer BaaS & Integration Suite</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            Build on the Civix Platform
          </h1>
          <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
            Register your application to access Civix Single Sign-On, synchronized player identity, shared gold escrow, and zero-config cloud storage.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT: App Registration */}
          <div className="lg:col-span-5">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur-sm">
              <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2 mb-4">
                <PlusCircle className="h-5 w-5 text-amber-400" />
                Register New App
              </h2>

              {createdApp ? (
                <div className="space-y-4">
                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
                    <span className="text-xs font-bold text-emerald-400 block mb-1">
                      App Registered Successfully!
                    </span>
                    <p className="text-[11px] text-zinc-300">
                      Store your credentials safely. The client secret will not be displayed again.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 mb-1">Client ID</label>
                    <div className="flex items-center justify-between rounded bg-zinc-950 p-2 text-xs font-mono text-amber-300 border border-zinc-800">
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
                    <div className="flex items-center justify-between rounded bg-zinc-950 p-2 text-xs font-mono text-sky-300 border border-zinc-800">
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
                    className="w-full rounded-lg bg-zinc-800 p-2 text-xs font-bold text-zinc-300 hover:bg-zinc-700"
                  >
                    Register Another Application
                  </button>
                </div>
              ) : (
                <form onSubmit={handleRegisterApp} className="space-y-3 text-xs">
                  {error && (
                    <div className="rounded border border-red-500/30 bg-red-500/10 p-2.5 text-red-300 text-[11px]">
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
                      className="w-full rounded border border-zinc-700 bg-zinc-950 p-2 text-zinc-100"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-zinc-300 mb-1">Tagline</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Turn-based weapon crafting & battles"
                      value={appTagline}
                      onChange={(e) => setAppTagline(e.target.value)}
                      className="w-full rounded border border-zinc-700 bg-zinc-950 p-2 text-zinc-100"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-zinc-300 mb-1">Category</label>
                    <select
                      value={appCategory}
                      onChange={(e) => setAppCategory(e.target.value)}
                      className="w-full rounded border border-zinc-700 bg-zinc-950 p-2 text-zinc-100"
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
                      className="w-full rounded border border-zinc-700 bg-zinc-950 p-2 text-zinc-100"
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
                      className="w-full rounded border border-zinc-700 bg-zinc-950 p-2 text-zinc-100"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-zinc-300 mb-1">Description</label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Describe what your app offers to Parlamentum citizens..."
                      value={appDesc}
                      onChange={(e) => setAppDesc(e.target.value)}
                      className="w-full rounded border border-zinc-700 bg-zinc-950 p-2 text-zinc-100"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-lg bg-amber-500 p-2.5 font-bold text-zinc-950 hover:bg-amber-400 transition-all disabled:opacity-50 mt-2"
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
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-500 text-[10px] font-black text-black">
                    1
                  </span>
                  Add Civix Login Button (Client-Side)
                </h3>
              </div>
              <p className="text-xs text-zinc-400 mb-3">
                Place this button anywhere on your frontend. It redirects users to the Civix OAuth portal:
              </p>
              <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-3.5 text-xs font-mono text-zinc-300 border border-zinc-800/80">
{`<!-- Vanilla JS or React Button -->
<a 
  href="https://civix.parlamentum/api/oauth/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=https://yourapp.com/callback&scope=identity"
  class="btn-civix"
>
  🛡️ Sign in with Civix ID
</a>`}
              </pre>
            </div>

            {/* Step 2 */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-500 text-[10px] font-black text-black">
                    2
                  </span>
                  Exchange Auth Code for Citizen Profile (Server-Side)
                </h3>
              </div>
              <p className="text-xs text-zinc-400 mb-3">
                Works in Next.js API Routes, Cloudflare Workers (Prediction Market), or Node.js:
              </p>
              <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-3.5 text-xs font-mono text-emerald-300 border border-zinc-800/80">
{`// /api/auth/callback route
export async function GET(req) {
  const code = req.nextUrl.searchParams.get("code");

  // Exchange code with Civix
  const res = await fetch("https://civix.parlamentum/api/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code,
      client_id: process.env.CIVIX_CLIENT_ID,
      client_secret: process.env.CIVIX_CLIENT_SECRET
    })
  });

  const { citizen } = await res.json();
  // citizen: { id: "civ_...", username: "CardinalSanjay", gameProfileId: "cmuoy..." }
  
  // Set your own session cookie or log user in!
}`}
              </pre>
            </div>

            {/* Step 3 */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-500 text-[10px] font-black text-black">
                    3
                  </span>
                  Zero-DB Developer Storage (Civix Cloud BaaS)
                </h3>
              </div>
              <p className="text-xs text-zinc-400 mb-3">
                Store user game stats, high scores, or preferences without hosting your own database:
              </p>
              <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-3.5 text-xs font-mono text-amber-300 border border-zinc-800/80">
{`// Save user game state in Civix Cloud KV
await fetch("https://civix.parlamentum/api/cloud/storage", {
  method: "POST",
  headers: {
    "Authorization": "Bearer " + clientSecret,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    citizenId: "civ_99812",
    key: "colosseo_stats",
    value: { wins: 14, losses: 2, rank: "Gladiator Master" }
  })
});`}
              </pre>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
