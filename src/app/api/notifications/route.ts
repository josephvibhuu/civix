import { NextResponse, connection } from "next/server";
import { getDb, initDb } from "@/lib/db";
import { getCurrentCitizen } from "@/lib/auth";

export async function GET() {
  await connection();
  try {
    await initDb();
    const db = getDb();
    const citizen = await getCurrentCitizen();

    if (!citizen) {
      return NextResponse.json({ authenticated: false, notifications: [], unreadCount: 0 });
    }

    const res = await db.execute({
      sql: `SELECT n.*, a.name as app_name, a.slug as app_slug 
            FROM civix_notifications n
            LEFT JOIN civix_apps a ON n.app_id = a.id
            WHERE n.citizen_id = ?
            ORDER BY n.created_at DESC LIMIT 50`,
      args: [citizen.id],
    });

    const unreadCountRes = await db.execute({
      sql: "SELECT COUNT(*) as count FROM civix_notifications WHERE citizen_id = ? AND is_read = 0",
      args: [citizen.id],
    });

    const unreadCount = Number(unreadCountRes.rows[0]?.count || 0);

    return NextResponse.json({
      authenticated: true,
      unreadCount,
      notifications: res.rows.map((r) => ({
        id: String(r.id),
        appId: r.app_id ? String(r.app_id) : null,
        appName: r.app_name ? String(r.app_name) : null,
        appSlug: r.app_slug ? String(r.app_slug) : null,
        title: String(r.title),
        message: String(r.message),
        type: String(r.type || "info"),
        actionUrl: r.action_url ? String(r.action_url) : null,
        isRead: Boolean(r.is_read),
        createdAt: String(r.created_at),
      })),
    });
  } catch (err: any) {
    console.error("GET /api/notifications error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch notifications" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  await connection();
  try {
    await initDb();
    const db = getDb();
    const citizen = await getCurrentCitizen();

    if (!citizen) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const title = String(body.title || "").trim();
    const message = String(body.message || "").trim();
    const type = String(body.type || "info").trim();
    const actionUrl = body.actionUrl ? String(body.actionUrl).trim() : null;
    const appId = body.appId ? String(body.appId).trim() : null;

    if (!title || !message) {
      return NextResponse.json({ error: "Title and message required" }, { status: 400 });
    }

    const id = `notif_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;

    await db.execute({
      sql: `INSERT INTO civix_notifications (id, citizen_id, app_id, title, message, type, action_url)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [id, citizen.id, appId, title, message, type, actionUrl],
    });

    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    console.error("POST /api/notifications error:", err);
    return NextResponse.json({ error: err.message || "Failed to dispatch notification" }, { status: 500 });
  }
}
