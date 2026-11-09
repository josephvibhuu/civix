import { NextResponse, connection } from "next/server";
import { getDb, initDb } from "@/lib/db";

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

export async function GET(req: Request) {
  await connection();
  try {
    const app = await authenticateApp(req.headers.get("Authorization"));
    if (!app) {
      return NextResponse.json({ error: "Invalid app client secret" }, { status: 401 });
    }

    const url = new URL(req.url);
    const citizenId = url.searchParams.get("citizenId");
    const key = url.searchParams.get("key");

    if (!citizenId || !key) {
      return NextResponse.json({ error: "citizenId and key required" }, { status: 400 });
    }

    const db = getDb();
    const res = await db.execute({
      sql: "SELECT storage_value, updated_at FROM civix_developer_storage WHERE app_id = ? AND citizen_id = ? AND storage_key = ?",
      args: [app.id, citizenId, key],
    });

    if (res.rows.length === 0) {
      return NextResponse.json({ found: false, value: null });
    }

    let parsed = res.rows[0].storage_value;
    try {
      parsed = JSON.parse(String(parsed));
    } catch {}

    return NextResponse.json({
      found: true,
      value: parsed,
      updatedAt: res.rows[0].updated_at,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch storage" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const app = await authenticateApp(req.headers.get("Authorization"));
    if (!app) {
      return NextResponse.json({ error: "Invalid app client secret" }, { status: 401 });
    }

    const db = getDb();
    const body = await req.json();
    const { citizenId, key, value } = body;

    if (!citizenId || !key || value === undefined) {
      return NextResponse.json({ error: "citizenId, key, and value are required" }, { status: 400 });
    }

    const serialized = typeof value === "object" ? JSON.stringify(value) : String(value);

    await db.execute({
      sql: `INSERT INTO civix_developer_storage (app_id, citizen_id, storage_key, storage_value, updated_at)
            VALUES (?, ?, ?, ?, datetime('now'))
            ON CONFLICT(app_id, citizen_id, storage_key) DO UPDATE SET
              storage_value = excluded.storage_value,
              updated_at = datetime('now')`,
      args: [app.id, citizenId, key, serialized],
    });

    return NextResponse.json({ success: true, message: "Storage updated" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to save storage" }, { status: 500 });
  }
}
