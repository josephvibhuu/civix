import { NextResponse, connection } from "next/server";
import { getDb, initDb } from "@/lib/db";
import { getCurrentCitizen } from "@/lib/auth";

export async function PATCH(req: Request) {
  await connection();
  try {
    await initDb();
    const db = getDb();
    const citizen = await getCurrentCitizen();

    if (!citizen) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const id = body.id ? String(body.id) : null;

    if (id) {
      // Mark specific notification as read
      await db.execute({
        sql: "UPDATE civix_notifications SET is_read = 1 WHERE id = ? AND citizen_id = ?",
        args: [id, citizen.id],
      });
    } else {
      // Mark all notifications as read
      await db.execute({
        sql: "UPDATE civix_notifications SET is_read = 1 WHERE citizen_id = ?",
        args: [citizen.id],
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("PATCH /api/notifications/read error:", err);
    return NextResponse.json({ error: err.message || "Failed to mark notifications as read" }, { status: 500 });
  }
}
