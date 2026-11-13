import { MetadataRoute } from "next";
import { getDb, initDb } from "@/lib/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://civix-plum.vercel.app";

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/workspace`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.95,
    },
    {
      url: `${baseUrl}/leaderboard`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/edicts`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/verify`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/developers`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.75,
    },
    {
      url: `${baseUrl}/inbox`,
      lastModified: new Date(),
      changeFrequency: "always",
      priority: 0.7,
    },
  ];

  try {
    await initDb();
    const db = getDb();
    const appsRes = await db.execute("SELECT slug, created_at FROM civix_apps WHERE status = 'active'");
    
    const appRoutes: MetadataRoute.Sitemap = appsRes.rows.map((row) => ({
      url: `${baseUrl}/app/${row.slug}`,
      lastModified: row.created_at ? new Date(String(row.created_at)) : new Date(),
      changeFrequency: "daily",
      priority: 0.85,
    }));

    return [...staticRoutes, ...appRoutes];
  } catch {
    return staticRoutes;
  }
}
