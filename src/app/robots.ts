import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: [
        "/",
        "/workspace",
        "/leaderboard",
        "/verify",
        "/edicts",
        "/inbox",
        "/developers",
        "/app/",
        "/citizen/",
        "/referrals",
      ],
      disallow: [
        "/admin",
        "/api/",
        "/r/",
      ],
    },
    sitemap: "https://civix-plum.vercel.app/sitemap.xml",
  };
}
