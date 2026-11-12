import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CIVIX Pocket Device",
    short_name: "CIVIX Device",
    description: "The Sovereign Pocket Device & Application Shell for the Parlamentum Realm",
    start_url: "/device",
    display: "standalone",
    background_color: "#06080e",
    theme_color: "#06b6d4",
    orientation: "portrait",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
