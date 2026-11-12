import { NextResponse, connection } from "next/server";
import { getDb, initDb } from "@/lib/db";
import { getCurrentCitizen } from "@/lib/auth";

export async function GET() {
  await connection();
  try {
    const citizen = await getCurrentCitizen();
    if (!citizen || !citizen.isAdmin) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    await initDb();
    const db = getDb();

    // 1. Stats
    const citizensCountRes = await db.execute("SELECT COUNT(*) as total FROM civix_citizens");
    const appsCountRes = await db.execute("SELECT COUNT(*) as total FROM civix_apps");
    const activeAppsRes = await db.execute("SELECT COUNT(*) as total FROM civix_apps WHERE status = 'active'");
    const authzCountRes = await db.execute("SELECT COUNT(*) as total FROM civix_authorizations WHERE revoked = 0 OR revoked IS NULL");
    const codesCountRes = await db.execute("SELECT COUNT(*) as total FROM civix_auth_codes");

    // 2. Apps list
    const appsRes = await db.execute(`
      SELECT id, name, slug, tagline, category, app_url, client_id, owner_name, 
             active_users_estimate, featured, verified, status, created_at
      FROM civix_apps
      ORDER BY created_at DESC
    `);

    // 3. Citizens list
    const citizensRes = await db.execute(`
      SELECT id, current_username, game_profile_id, email, discord_id, verification_tier, 
             is_verified, is_admin, referral_code, created_at
      FROM civix_citizens
      ORDER BY created_at DESC LIMIT 50
    `);

    // 4. Recent OAuth code logs
    const codesRes = await db.execute(`
      SELECT code, citizen_id, client_id, redirect_uri, scope, used, expires_at
      FROM civix_auth_codes
      ORDER BY expires_at DESC LIMIT 30
    `);

    // 5. Banners
    const bannersRes = await db.execute(`
      SELECT * FROM civix_featured_banners ORDER BY sort_order ASC, created_at DESC
    `);

    return NextResponse.json({
      metrics: {
        totalCitizens: Number(citizensCountRes.rows[0]?.total || 0),
        totalApps: Number(appsCountRes.rows[0]?.total || 0),
        activeApps: Number(activeAppsRes.rows[0]?.total || 0),
        totalAuthorizations: Number(authzCountRes.rows[0]?.total || 0),
        totalAuthCodesIssued: Number(codesCountRes.rows[0]?.total || 0),
      },
      apps: appsRes.rows,
      citizens: citizensRes.rows,
      recentAuthCodes: codesRes.rows,
      banners: bannersRes.rows,
    });
  } catch (error: any) {
    console.error("Admin query error:", error);
    return NextResponse.json({ error: error.message || "Failed to load admin data" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const citizen = await getCurrentCitizen();
    if (!citizen || !citizen.isAdmin) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    await initDb();
    const db = getDb();
    const body = await req.json();
    const { action } = body;

    if (action === "set_app_status") {
      const { appId, status } = body;
      await db.execute({
        sql: "UPDATE civix_apps SET status = ? WHERE id = ?",
        args: [status, appId],
      });
      return NextResponse.json({ success: true, message: `App status updated to ${status}` });
    }

    if (action === "toggle_app_feature") {
      const { appId, featured } = body;
      await db.execute({
        sql: "UPDATE civix_apps SET featured = ? WHERE id = ?",
        args: [featured ? 1 : 0, appId],
      });
      return NextResponse.json({ success: true, message: "App feature flag updated" });
    }

    if (action === "set_citizen_tier") {
      const { citizenId, tier } = body;
      await db.execute({
        sql: "UPDATE civix_citizens SET verification_tier = ? WHERE id = ?",
        args: [tier, citizenId],
      });
      return NextResponse.json({ success: true, message: `Citizen tier set to ${tier}` });
    }

    if (action === "save_banner") {
      const { id, appId, title, subtitle, badgeText, bannerUrl, ctaText, ctaUrl, sortOrder, active } = body;
      const bannerId = id || `banner_${Date.now()}`;
      await db.execute({
        sql: `INSERT OR REPLACE INTO civix_featured_banners 
              (id, app_id, title, subtitle, badge_text, banner_url, cta_text, cta_url, sort_order, active)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          bannerId,
          appId || null,
          title,
          subtitle || "",
          badgeText || "FEATURED",
          bannerUrl,
          ctaText || "Launch Application",
          ctaUrl || "/",
          Number(sortOrder || 0),
          active ? 1 : 0,
        ],
      });
      return NextResponse.json({ success: true, message: "Banner saved successfully" });
    }

    if (action === "delete_banner") {
      const { bannerId } = body;
      await db.execute({
        sql: "DELETE FROM civix_featured_banners WHERE id = ?",
        args: [bannerId],
      });
      return NextResponse.json({ success: true, message: "Banner deleted" });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    console.error("Admin action error:", error);
    return NextResponse.json({ error: error.message || "Admin action failed" }, { status: 500 });
  }
}
