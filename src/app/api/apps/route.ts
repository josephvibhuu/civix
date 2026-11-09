import { NextResponse, connection } from "next/server";
import { getDb, initDb } from "@/lib/db";
import { getCurrentCitizen } from "@/lib/auth";

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

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const appId = `app_${slug}_${Math.random().toString(36).substring(2, 6)}`;
    const clientId = `civ_client_${slug}_${Math.random().toString(36).substring(2, 8)}`;
    const clientSecret = `civ_sec_${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`;

    await db.execute({
      sql: `INSERT INTO civix_apps (
        id, name, slug, tagline, description, category, app_url, client_id,
        client_secret_hash, redirect_uris, owner_name, active_users_estimate, featured, verified, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, 1, 'active')`,
      args: [
        appId,
        name.trim(),
        slug,
        tagline.trim(),
        description.trim(),
        category || "utility",
        appUrl.trim(),
        clientId,
        clientSecret,
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
      message: "App registered successfully! Save your client secret securely.",
    });
  } catch (error: any) {
    console.error("Register app error:", error);
    return NextResponse.json({ error: error.message || "Failed to register app" }, { status: 500 });
  }
}
