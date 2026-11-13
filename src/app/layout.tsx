import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://civix-plum.vercel.app"),
  title: {
    default: "CIVIX NEXUS — Sovereign WebOS & Universal Identity",
    template: "%s | CIVIX NEXUS",
  },
  description: "The universal application marketplace, Sovereign WebOS workspace, Single Sign-On nexus, and cryptographic citizen passport for the Parlamentum realm.",
  keywords: [
    "CIVIX",
    "Parlamentum",
    "Sovereign WebOS",
    "OAuth 2.0",
    "Single Sign-On",
    "Grow UR Gold",
    "The Labour Exchange",
    "Bank of Europe",
    "KYC Verification",
    "Citizen Passport",
  ],
  authors: [{ name: "CIVIX Cryptographic Council" }],
  creator: "CIVIX Foundation",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://civix-plum.vercel.app",
    siteName: "CIVIX NEXUS",
    title: "CIVIX NEXUS — Sovereign WebOS & Universal Identity",
    description: "Run, multitask, and split-screen all Parlamentum bourses, order books, and guild hubs with persistent state and 1-click single sign-on.",
  },
  twitter: {
    card: "summary_large_image",
    title: "CIVIX NEXUS — Sovereign WebOS & Universal Identity",
    description: "The universal application marketplace and WebOS command deck for Parlamentum citizens.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#06080e] text-zinc-100 font-sans selection:bg-cyan-500 selection:text-black">
        {children}
        <Toaster theme="dark" richColors position="top-right" />
      </body>
    </html>
  );
}
