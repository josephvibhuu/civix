import { Metadata } from "next";
import SovereignWorkspace from "@/components/workspace/SovereignWorkspace";

export const metadata: Metadata = {
  title: "CIVIX Workspace — Sovereign WebOS & Multi-App Desktop",
  description: "The persistent multitasking desktop environment for Parlamentum citizens: launch and run bourses, order books, and guild hubs in parallel tabs with 1-Click SSO.",
};

export default function WorkspacePage() {
  return <SovereignWorkspace />;
}
