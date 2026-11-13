import { NextResponse, connection } from "next/server";
import { getDb, initDb } from "@/lib/db";
import { getCurrentCitizen, logSecurityEvent } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  await connection();
  try {
    await initDb();
    const db = getDb();
    const { slug } = await params;

    // 1. Check if app exists
    const appRes = await db.execute({
      sql: "SELECT * FROM civix_apps WHERE slug = ? OR id = ?",
      args: [slug, slug],
    });

    if (appRes.rows.length === 0) {
      return NextResponse.redirect(new URL("/?error=app_not_found", req.url));
    }

    const app = appRes.rows[0];
    const appId = String(app.id);
    const clientId = String(app.client_id);
    const appUrl = String(app.app_url);

    // Parse redirect URIs
    let redirectUris: string[] = [];
    try {
      redirectUris = JSON.parse(String(app.redirect_uris || "[]"));
    } catch {
      redirectUris = [];
    }
    const primaryRedirectUri = redirectUris[0] || null;

    // 2. Check if citizen is logged in
    const citizen = await getCurrentCitizen();
    if (!citizen) {
      // Citizen must log in first, then resume 1-click launch
      const returnUrl = encodeURIComponent(`/api/oauth/launch/${slug}`);
      return NextResponse.redirect(new URL(`/login?return_to=${returnUrl}`, req.url));
    }

    // 3. For partner apps that require internal anti-CSRF state cookie initiation (e.g. The Labour Exchange)
    const APP_INIT_ROUTES: Record<string, string> = {
      "the-labour-exchange": "https://jobparlamentum-app.vercel.app/api/auth/civix",
      "colosseo": "https://colosseo-tau.vercel.app/api/auth/civix",
      "the-back-room": "https://back-room-casino.vercel.app/auth/civix",
    };

    if (APP_INIT_ROUTES[slug]) {
      // Auto-record authorization relation so citizen status is tracked
      await db.execute({
        sql: `INSERT OR IGNORE INTO civix_authorizations (id, citizen_id, app_id, scopes, revoked)
              VALUES (?, ?, ?, 'identity', 0)`,
        args: [`authz_${citizen.id}_${appId}`, citizen.id, appId],
      });
      return NextResponse.redirect(APP_INIT_ROUTES[slug]);
    }

    // 4. Check if app has OAuth credentials & redirect URIs configured
    if (!primaryRedirectUri) {
      // App doesn't have an active OAuth callback configured (e.g. external link or pending app)
      return NextResponse.redirect(appUrl);
    }

    // 5. Check if citizen already authorized this app
    const authzRes = await db.execute({
      sql: "SELECT * FROM civix_authorizations WHERE citizen_id = ? AND app_id = ? AND (revoked = 0 OR revoked IS NULL)",
      args: [citizen.id, appId],
    });

    if (authzRes.rows.length > 0) {
      // INSTANT 1-CLICK LAUNCH: Already authorized!
      const existingScope = String(authzRes.rows[0].scopes || "identity");
      const authCode = `auth_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
      const expiresAt = Date.now() + 1000 * 60 * 5; // 5 mins

      await db.execute({
        sql: `INSERT INTO civix_auth_codes (code, citizen_id, client_id, redirect_uri, scope, expires_at)
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: [authCode, citizen.id, clientId, primaryRedirectUri, existingScope, expiresAt],
      });

      await logSecurityEvent(
        citizen.id,
        "one_click_launch",
        appId,
        undefined,
        `1-Click SSO launch to ${app.name}`
      );

      const targetUrl = new URL(primaryRedirectUri);
      targetUrl.searchParams.set("code", authCode);
      targetUrl.searchParams.set("state", "civix_one_click");

      return NextResponse.redirect(targetUrl.toString());
    }

    // 5. First time launching this app: Auto-authorize or redirect through OAuth consent
    // For verified ecosystem apps, we can auto-grant identity scope with seamless onboarding
    const defaultScope = "identity";
    const authCode = `auth_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
    const expiresAt = Date.now() + 1000 * 60 * 5;

    await db.execute({
      sql: `INSERT INTO civix_auth_codes (code, citizen_id, client_id, redirect_uri, scope, expires_at)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [authCode, citizen.id, clientId, primaryRedirectUri, defaultScope, expiresAt],
    });

    // Save authorization
    await db.execute({
      sql: `INSERT OR REPLACE INTO civix_authorizations (id, citizen_id, app_id, scopes, revoked)
            VALUES (?, ?, ?, ?, 0)`,
      args: [`authz_${citizen.id}_${appId}`, citizen.id, appId, defaultScope],
    });

    await logSecurityEvent(
      citizen.id,
      "one_click_first_auth",
      appId,
      undefined,
      `First-time 1-Click authorization granted to ${app.name}`
    );

    const targetUrl = new URL(primaryRedirectUri);
    targetUrl.searchParams.set("code", authCode);
    targetUrl.searchParams.set("state", "civix_one_click");

    return NextResponse.redirect(targetUrl.toString());
  } catch (error: any) {
    console.error("1-Click Launch error:", error);
    return NextResponse.redirect(new URL("/?error=launch_failed", req.url));
  }
}
