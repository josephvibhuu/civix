import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CIVIX NEXUS — Sovereign WebOS & App Store",
    short_name: "CIVIX WebOS",
    description: "The Sovereign WebOS workspace, multi-bourse command deck, and application shell for the Parlamentum Realm",
    start_url: "/workspace",
    display: "standalone",
    background_color: "#06080e",
    theme_color: "#06b6d4",
    orientation: "any",
    categories: ["productivity", "finance", "games", "utilities"],
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
