import { NextResponse, connection } from "next/server";
import { getDb, initDb } from "@/lib/db";
import { getCurrentCitizen } from "@/lib/auth";

// Helper to authenticate app by Bearer client_secret
async function authenticateApp(authHeader: string | null) {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const secret = authHeader.replace("Bearer ", "").trim();

  await initDb();
  const db = getDb();
  const res = await db.execute({
    sql: "SELECT id, name FROM civix_apps WHERE client_secret_hash = ?",
    args: [secret],
  });

  if (res.rows.length === 0) return null;
  return res.rows[0];
}

export async function GET() {
  await connection();
  try {
    const citizen = await getCurrentCitizen();
    if (!citizen) {
      return NextResponse.json({ authenticated: false, notifications: [] });
    }

    await initDb();
    const db = getDb();
    const res = await db.execute({
      sql: `SELECT id, app_id, title, message, type, action_url, is_read, created_at
            FROM civix_notifications
            WHERE citizen_id = ?
            ORDER BY created_at DESC LIMIT 20`,
      args: [citizen.id],
    });

    const unreadCount = res.rows.filter((r) => Number(r.is_read) === 0).length;

    return NextResponse.json({
      authenticated: true,
      unreadCount,
      notifications: res.rows.map((r) => ({
        id: String(r.id),
        appId: r.app_id ? String(r.app_id) : null,
        title: String(r.title),
        message: String(r.message),
        type: String(r.type || "info"),
        actionUrl: r.action_url ? String(r.action_url) : null,
        isRead: Boolean(r.is_read),
        createdAt: String(r.created_at),
      })),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    const body = await req.json();

    // CASE 1: Partner App dispatching a cross-app notification to a citizen
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const app = await authenticateApp(authHeader);
      if (!app) {
        return NextResponse.json({ error: "Invalid app secret" }, { status: 401 });
      }

      const { citizenId, title, message, type, actionUrl } = body;
      if (!citizenId || !title || !message) {
        return NextResponse.json({ error: "citizenId, title, and message are required" }, { status: 400 });
      }

      const notifId = `notif_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
      const db = getDb();

      await db.execute({
        sql: `INSERT INTO civix_notifications (id, citizen_id, app_id, title, message, type, action_url)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [notifId, citizenId, String(app.id), title, message, type || "info", actionUrl || null],
      });

      return NextResponse.json({ success: true, notificationId: notifId });
    }

    // CASE 2: Citizen marking a notification as read
    const citizen = await getCurrentCitizen();
    if (!citizen) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action, notificationId } = body;
    const db = getDb();

    if (action === "mark_all_read") {
      await db.execute({
        sql: "UPDATE civix_notifications SET is_read = 1 WHERE citizen_id = ?",
        args: [citizen.id],
      });
      return NextResponse.json({ success: true });
    }

    if (action === "mark_read" && notificationId) {
      await db.execute({
        sql: "UPDATE civix_notifications SET is_read = 1 WHERE id = ? AND citizen_id = ?",
        args: [notificationId, citizen.id],
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
