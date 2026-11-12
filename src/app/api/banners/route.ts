import { NextResponse, connection } from "next/server";
import { getDb, initDb } from "@/lib/db";

export async function GET() {
  await connection();
  try {
    await initDb();
    const db = getDb();

    const res = await db.execute({
      sql: `SELECT b.*, a.name as app_name, a.slug as app_slug, a.category as app_category, a.app_url as app_direct_url
            FROM civix_featured_banners b
            LEFT JOIN civix_apps a ON b.app_id = a.id
            WHERE b.active = 1
            ORDER BY b.sort_order ASC, b.created_at DESC`,
    });

    const banners = res.rows.map((r) => ({
      id: String(r.id),
      appId: r.app_id ? String(r.app_id) : null,
      title: String(r.title),
      subtitle: r.subtitle ? String(r.subtitle) : "",
      badgeText: r.badge_text ? String(r.badge_text) : "FEATURED",
      bannerUrl: String(r.banner_url),
      ctaText: r.cta_text ? String(r.cta_text) : "Launch Application",
      ctaUrl: r.cta_url ? String(r.cta_url) : (r.app_slug ? `/api/oauth/launch/${r.app_slug}` : "/"),
      appName: r.app_name ? String(r.app_name) : null,
      appSlug: r.app_slug ? String(r.app_slug) : null,
      appCategory: r.app_category ? String(r.app_category) : null,
    }));

    return NextResponse.json({ banners });
  } catch (error: any) {
    console.error("Banners query error:", error);
    return NextResponse.json({ error: error.message || "Failed to load banners" }, { status: 500 });
  }
}
