import { Metadata } from "next";
import PocketDevice from "@/components/device/PocketDevice";
import CivixNavbar from "@/components/CivixNavbar";

export const metadata: Metadata = {
  title: "CIVIX Pocket Device — The Sovereign Mobile Shell",
  description: "The universal interactive pocket device, application sandbox, and notification edict center for Parlamentum citizens.",
};

export default function DevicePage() {
  return (
    <div className="min-h-screen bg-[#04060b] text-zinc-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      <CivixNavbar />
      <main className="flex-1 flex flex-col items-center justify-center w-full py-4 sm:py-6">
        <PocketDevice />
      </main>
    </div>
  );
}
