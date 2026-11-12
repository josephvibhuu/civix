import { NextResponse, connection } from "next/server";
import { getDb, initDb } from "@/lib/db";
import { getCurrentCitizen, logSecurityEvent } from "@/lib/auth";

export async function GET() {
  await connection();
  try {
    const citizen = await getCurrentCitizen();
    if (!citizen) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await initDb();
    const db = getDb();

    // 1. Fetch authorized apps
    const authzRes = await db.execute({
      sql: `SELECT a.id, a.name, a.slug, a.tagline, a.category, a.app_url, a.owner_name, 
                   z.scopes, z.revoked, z.created_at as connected_at
            FROM civix_authorizations z
            JOIN civix_apps a ON z.app_id = a.id
            WHERE z.citizen_id = ?
            ORDER BY z.created_at DESC`,
      args: [citizen.id],
    });

    const authorizedApps = authzRes.rows.map((r) => ({
      id: String(r.id),
      name: String(r.name),
      slug: String(r.slug),
      tagline: String(r.tagline),
      category: String(r.category),
      appUrl: String(r.app_url),
      ownerName: String(r.owner_name),
      scopes: String(r.scopes || "identity").split(/[\s,]+/),
      revoked: Boolean(Number(r.revoked || 0) === 1),
      connectedAt: String(r.connected_at),
    }));

    // 2. Fetch name history
    const historyRes = await db.execute({
      sql: "SELECT previous_name, updated_name, synced_at FROM civix_username_history WHERE citizen_id = ? ORDER BY synced_at DESC LIMIT 10",
      args: [citizen.id],
    });

    const nameHistory = historyRes.rows.map((h) => ({
      previousName: String(h.previous_name),
      updatedName: String(h.updated_name),
      syncedAt: String(h.synced_at),
    }));

    // 3. Fetch security logs
    const logsRes = await db.execute({
      sql: `SELECT l.id, l.event_type, l.details, l.created_at, a.name as app_name
            FROM civix_security_logs l
            LEFT JOIN civix_apps a ON l.app_id = a.id
            WHERE l.citizen_id = ?
            ORDER BY l.created_at DESC LIMIT 15`,
      args: [citizen.id],
    });

    const securityLogs = logsRes.rows.map((l) => ({
      id: String(l.id),
      eventType: String(l.event_type),
      details: l.details ? String(l.details) : null,
      appName: l.app_name ? String(l.app_name) : null,
      createdAt: String(l.created_at),
    }));

    // 4. Fetch referrals count & list
    const refRes = await db.execute({
      sql: `SELECT c.current_username, c.created_at
            FROM civix_referrals r
            JOIN civix_citizens c ON r.referred_id = c.id
            WHERE r.referrer_id = ?
            ORDER BY r.created_at DESC`,
      args: [citizen.id],
    });

    const referrals = refRes.rows.map((rf) => ({
      username: String(rf.current_username),
      joinedAt: String(rf.created_at),
    }));

    return NextResponse.json({
      citizen,
      authorizedApps,
      nameHistory,
      securityLogs,
      referrals,
    });
  } catch (error: any) {
    console.error("Dashboard query error:", error);
    return NextResponse.json({ error: error.message || "Failed to load dashboard" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const citizen = await getCurrentCitizen();
    if (!citizen) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await initDb();
    const db = getDb();
    const body = await req.json();
    const { action, appId } = body;

    if (!appId) {
      return NextResponse.json({ error: "Missing appId" }, { status: 400 });
    }

    if (action === "revoke") {
      await db.execute({
        sql: "UPDATE civix_authorizations SET revoked = 1 WHERE citizen_id = ? AND app_id = ?",
        args: [citizen.id, appId],
      });
      await logSecurityEvent(citizen.id, "auth_revoked", appId, undefined, `Revoked access for app ${appId}`);
      return NextResponse.json({ success: true, message: "Application access revoked." });
    }

    if (action === "restore") {
      await db.execute({
        sql: "UPDATE civix_authorizations SET revoked = 0 WHERE citizen_id = ? AND app_id = ?",
        args: [citizen.id, appId],
      });
      await logSecurityEvent(citizen.id, "auth_restored", appId, undefined, `Restored access for app ${appId}`);
      return NextResponse.json({ success: true, message: "Application access restored." });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    console.error("Dashboard action error:", error);
    return NextResponse.json({ error: error.message || "Action failed" }, { status: 500 });
  }
}
