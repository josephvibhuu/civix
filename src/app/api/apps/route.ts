import { NextResponse, connection } from "next/server";
import { getDb, initDb } from "@/lib/db";
import { getCurrentCitizen } from "@/lib/auth";
import { hashClientSecret, randomToken } from "@/lib/security";

export async function GET(req: Request) {
  await connection();
  try {
    await initDb();
    const db = getDb();
    const url = new URL(req.url);
    const category = url.searchParams.get("category");
    const query = url.searchParams.get("q");

    let sql = "SELECT * FROM civix_apps WHERE status = 'active'";
    const args: any[] = [];

    if (category && category !== "all") {
      sql += " AND category = ?";
      args.push(category);
    }

    if (query && query.trim()) {
      sql += " AND (LOWER(name) LIKE ? OR LOWER(tagline) LIKE ? OR LOWER(description) LIKE ?)";
      const wild = `%${query.trim().toLowerCase()}%`;
      args.push(wild, wild, wild);
    }

    sql += " ORDER BY featured DESC, active_users_estimate DESC";

    const res = await db.execute({ sql, args });

    const apps = res.rows.map((r) => ({
      id: String(r.id),
      name: String(r.name),
      slug: String(r.slug),
      tagline: String(r.tagline),
      description: String(r.description),
      iconUrl: r.icon_url ? String(r.icon_url) : null,
      bannerUrl: r.banner_url ? String(r.banner_url) : null,
      category: String(r.category),
      appUrl: String(r.app_url),
      clientId: String(r.client_id),
      ownerName: String(r.owner_name),
      activeUsers: Number(r.active_users_estimate || 0),
      featured: Boolean(r.featured),
      verified: Boolean(r.verified),
    }));

    return NextResponse.json({ apps });
  } catch (error: any) {
    console.error("Apps query error:", error);
    return NextResponse.json({ error: error.message || "Failed to load apps" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const citizen = await getCurrentCitizen();
    if (!citizen) {
      return NextResponse.json({ error: "Unauthorized. Please log into Civix to register an app." }, { status: 401 });
    }

    await initDb();
    const db = getDb();
    const body = await req.json();

    const { name, tagline, description, category, appUrl, redirectUri } = body;

    if (!name || !tagline || !description || !appUrl || !redirectUri) {
      return NextResponse.json({ error: "Missing required app details" }, { status: 400 });
    }

    // Redirect URI must be a real https URL (http only allowed for localhost testing)
    try {
      const u = new URL(String(redirectUri).trim());
      const isLocal = u.hostname === "localhost" || u.hostname === "127.0.0.1";
      if (u.protocol !== "https:" && !(isLocal && u.protocol === "http:")) throw new Error();
    } catch {
      return NextResponse.json({ error: "Redirect URI must be a full https:// URL" }, { status: 400 });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const appId = `app_${slug}_${randomToken(4)}`;
    const clientId = `civ_client_${slug}_${randomToken(6)}`;
    const clientSecret = `civ_sec_${randomToken(32)}`;

    await db.execute({
      sql: `INSERT INTO civix_apps (
        id, name, slug, tagline, description, category, app_url, client_id,
        client_secret_hash, redirect_uris, owner_name, active_users_estimate, featured, verified, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, 0, 'pending')`,
      args: [
        appId,
        name.trim(),
        slug,
        tagline.trim(),
        description.trim(),
        category || "utility",
        appUrl.trim(),
        clientId,
        hashClientSecret(clientSecret), // store only the hash
        JSON.stringify([redirectUri.trim()]),
        citizen.currentUsername,
      ],
    });

    return NextResponse.json({
      success: true,
      app: {
        id: appId,
        name: name.trim(),
        clientId,
        clientSecret, // Returned once upon creation
        redirectUri: redirectUri.trim(),
      },
      message: "App registered! It will go live once an admin approves it. Save your client secret now; it won't be shown again.",
    });
  } catch (error: any) {
    console.error("Register app error:", error);
    return NextResponse.json({ error: error.message || "Failed to register app" }, { status: 500 });
  }
}
