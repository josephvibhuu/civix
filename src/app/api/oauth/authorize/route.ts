import { NextResponse, connection } from "next/server";
import { getDb, initDb } from "@/lib/db";
import { getCurrentCitizen } from "@/lib/auth";

export async function GET(req: Request) {
  await connection();
  try {
    await initDb();
    const db = getDb();
    const url = new URL(req.url);

    const clientId = url.searchParams.get("client_id");
    const redirectUri = url.searchParams.get("redirect_uri");
    const scope = url.searchParams.get("scope") || "identity";
    const state = url.searchParams.get("state") || "";

    if (!clientId || !redirectUri) {
      return NextResponse.json({ error: "Missing client_id or redirect_uri" }, { status: 400 });
    }

    // Verify app exists
    const appRes = await db.execute({
      sql: "SELECT * FROM civix_apps WHERE client_id = ?",
      args: [clientId],
    });

    if (appRes.rows.length === 0) {
      return NextResponse.json({ error: "Unauthorized client_id" }, { status: 401 });
    }

    const app = appRes.rows[0];

    // Check if citizen is currently logged in
    const citizen = await getCurrentCitizen();
    if (!citizen) {
      // Redirect to Civix Login with return URL
      const returnUrl = encodeURIComponent(req.url);
      return NextResponse.redirect(new URL(`/login?return_to=${returnUrl}`, req.url));
    }

    // Citizen is logged in -> Issue authorization code
    const authCode = `auth_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
    const expiresAt = Date.now() + 1000 * 60 * 5; // 5 minutes

    await db.execute({
      sql: `INSERT INTO civix_auth_codes (code, citizen_id, client_id, redirect_uri, scope, expires_at)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [authCode, citizen.id, clientId, redirectUri, scope, expiresAt],
    });

    // Record authorization relation
    await db.execute({
      sql: `INSERT OR IGNORE INTO civix_authorizations (id, citizen_id, app_id, scopes)
            VALUES (?, ?, ?, ?)`,
      args: [`authz_${citizen.id}_${app.id}`, citizen.id, app.id, scope],
    });

    const targetUrl = new URL(redirectUri);
    targetUrl.searchParams.set("code", authCode);
    if (state) targetUrl.searchParams.set("state", state);

    return NextResponse.redirect(targetUrl.toString());
  } catch (error: any) {
    console.error("OAuth Authorize error:", error);
    return NextResponse.json({ error: error.message || "Authorization failed" }, { status: 500 });
  }
}
