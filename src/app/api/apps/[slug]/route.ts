import { NextResponse, connection } from "next/server";
import { getDb, initDb } from "@/lib/db";
import { getCurrentCitizen } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  await connection();
  try {
    await initDb();
    const db = getDb();
    const { slug } = await params;
    const citizen = await getCurrentCitizen();

    // 1. Fetch app
    const appRes = await db.execute({
      sql: "SELECT * FROM civix_apps WHERE slug = ? OR id = ?",
      args: [slug, slug],
    });

    if (appRes.rows.length === 0) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const r = appRes.rows[0];
    const appId = String(r.id);
    const category = String(r.category);

    // 2. Fetch screenshots
    const shotsRes = await db.execute({
      sql: "SELECT * FROM civix_app_screenshots WHERE app_id = ? ORDER BY sort_order ASC, created_at ASC",
      args: [appId],
    });

    const screenshots = shotsRes.rows.map((s) => ({
      id: String(s.id),
      url: String(s.url),
      caption: s.caption ? String(s.caption) : null,
    }));

    // 3. Check authorization status for current user
    let isAuthorized = false;
    let authorizedScopes: string[] = [];
    if (citizen) {
      const authzRes = await db.execute({
        sql: "SELECT scopes, revoked FROM civix_authorizations WHERE citizen_id = ? AND app_id = ?",
        args: [citizen.id, appId],
      });
      if (authzRes.rows.length > 0 && Number(authzRes.rows[0].revoked || 0) === 0) {
        isAuthorized = true;
        authorizedScopes = String(authzRes.rows[0].scopes || "identity").split(/[\s,]+/);
      }
    }

    // 4. Fetch similar apps in same category
    const similarRes = await db.execute({
      sql: "SELECT id, name, slug, tagline, category, app_url, owner_name, active_users_estimate, featured, verified FROM civix_apps WHERE category = ? AND id != ? AND status = 'active' LIMIT 3",
      args: [category, appId],
    });

    const similarApps = similarRes.rows.map((sim) => ({
      id: String(sim.id),
      name: String(sim.name),
      slug: String(sim.slug),
      tagline: String(sim.tagline),
      category: String(sim.category),
      appUrl: String(sim.app_url),
      ownerName: String(sim.owner_name),
      activeUsers: Number(sim.active_users_estimate || 0),
      featured: Boolean(sim.featured),
      verified: Boolean(sim.verified),
    }));

    // 5. Count total citizens authorized
    const countRes = await db.execute({
      sql: "SELECT COUNT(DISTINCT citizen_id) as total FROM civix_authorizations WHERE app_id = ? AND (revoked = 0 OR revoked IS NULL)",
      args: [appId],
    });
    const connectedCitizensCount = Number(countRes.rows[0]?.total || 0);

    const app = {
      id: appId,
      name: String(r.name),
      slug: String(r.slug),
      tagline: String(r.tagline),
      description: String(r.description),
      iconUrl: r.icon_url ? String(r.icon_url) : null,
      bannerUrl: r.banner_url ? String(r.banner_url) : null,
      category,
      appUrl: String(r.app_url),
      clientId: String(r.client_id),
      ownerName: String(r.owner_name),
      activeUsers: Math.max(Number(r.active_users_estimate || 0), connectedCitizensCount),
      connectedCitizensCount,
      featured: Boolean(r.featured),
      verified: Boolean(r.verified),
      status: String(r.status),
      createdAt: String(r.created_at),
      screenshots,
      isAuthorized,
      authorizedScopes,
      similarApps,
    };

    return NextResponse.json({ app });
  } catch (error: any) {
    console.error("Single app query error:", error);
    return NextResponse.json({ error: error.message || "Failed to load application" }, { status: 500 });
  }
}
