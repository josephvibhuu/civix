import { NextResponse, connection } from "next/server";
import { getDb, initDb } from "@/lib/db";
import { getCurrentCitizen, logSecurityEvent } from "@/lib/auth";

export async function GET(req: Request) {
  await connection();
  try {
    await initDb();
    const db = getDb();
    const url = new URL(req.url);
    const category = url.searchParams.get("category");

    let sql = "SELECT * FROM civix_edicts";
    const args: any[] = [];

    if (category && category !== "all") {
      sql += " WHERE category = ?";
      args.push(category);
    }

    sql += " ORDER BY is_pinned DESC, created_at DESC";

    const res = await db.execute({ sql, args });

    return NextResponse.json({
      edicts: res.rows.map((r) => ({
        id: String(r.id),
        title: String(r.title),
        summary: String(r.summary),
        content: String(r.content),
        category: String(r.category),
        authorTitle: String(r.author_title),
        targetTier: String(r.target_tier || "all"),
        isPinned: Boolean(r.is_pinned),
        badgeText: r.badge_text ? String(r.badge_text) : null,
        actionUrl: r.action_url ? String(r.action_url) : null,
        createdAt: String(r.created_at),
      })),
    });
  } catch (err: any) {
    console.error("GET /api/edicts error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch edicts" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  await connection();
  try {
    await initDb();
    const db = getDb();
    const citizen = await getCurrentCitizen();

    if (!citizen || !citizen.isAdmin) {
      return NextResponse.json({ error: "Only Imperial Administrators may proclaim decrees." }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const title = String(body.title || "").trim();
    const summary = String(body.summary || "").trim();
    const content = String(body.content || "").trim();
    const category = String(body.category || "edict").trim();
    const authorTitle = String(body.authorTitle || "Imperial Senate").trim();
    const targetTier = String(body.targetTier || "all").trim();
    const isPinned = body.isPinned ? 1 : 0;
    const badgeText = body.badgeText ? String(body.badgeText).trim() : null;
    const actionUrl = body.actionUrl ? String(body.actionUrl).trim() : null;

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required." }, { status: 400 });
    }

    const id = `edict_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;

    await db.execute({
      sql: `INSERT INTO civix_edicts (id, title, summary, content, category, author_title, target_tier, is_pinned, badge_text, action_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [id, title, summary, content, category, authorTitle, targetTier, isPinned, badgeText, actionUrl],
    });

    await logSecurityEvent(
      citizen.id,
      "proclaim_edict",
      undefined,
      undefined,
      `Proclaimed edict: ${title}`
    );

    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    console.error("POST /api/edicts error:", err);
    return NextResponse.json({ error: err.message || "Failed to proclaim decree" }, { status: 500 });
  }
}
