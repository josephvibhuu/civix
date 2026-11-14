import { NextResponse, connection } from "next/server";
import { getDb, initDb } from "@/lib/db";
import { logSecurityEvent } from "@/lib/auth";
import { checkClientSecret } from "@/lib/security";

/**
 * RFC 7009 OAuth 2.0 Token Revocation Endpoint
 * Allows partner apps to invalidate tokens and authorization relations upon user logout.
 */
export async function POST(req: Request) {
  await connection();
  try {
    await initDb();
    const db = getDb();

    let body: any = {};
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      body = Object.fromEntries(formData.entries());
    } else {
      body = await req.json().catch(() => ({}));
    }

    const token = String(body.token || "").trim();
    const tokenTypeHint = String(body.token_type_hint || "auth_code").trim();
    const clientId = String(body.client_id || "").trim();
    const clientSecret = String(body.client_secret || "").trim();

    if (!token) {
      // RFC 7009: Missing token returns invalid_request 400
      return NextResponse.json({ error: "invalid_request", error_description: "Missing token parameter" }, { status: 400 });
    }

    // SECURITY: RFC 7009 requires the client to authenticate. Before, anyone could
    // revoke any citizen's app access just by sending their citizen_id.
    if (!clientId || !clientSecret) {
      return NextResponse.json({ error: "invalid_client", error_description: "client_id and client_secret required" }, { status: 401 });
    }
    const appRes = await db.execute({
      sql: "SELECT id, client_secret_hash FROM civix_apps WHERE client_id = ?",
      args: [clientId],
    });
    if (appRes.rows.length === 0 || !checkClientSecret(clientSecret, String(appRes.rows[0].client_secret_hash || "")).ok) {
      return NextResponse.json({ error: "invalid_client" }, { status: 401 });
    }
    const appId = String(appRes.rows[0].id);

    // 1. Try to revoke an authorization code — only one issued to THIS client
    const codeRes = await db.execute({
      sql: "SELECT * FROM civix_auth_codes WHERE code = ? AND client_id = ?",
      args: [token, clientId],
    });

    if (codeRes.rows.length > 0) {
      const codeRow = codeRes.rows[0];
      await db.execute({
        sql: "UPDATE civix_auth_codes SET used = 1 WHERE code = ?",
        args: [token],
      });

      if (codeRow.citizen_id) {
        await logSecurityEvent(
          String(codeRow.citizen_id),
          "oauth_token_revoked",
          appId,
          undefined,
          `RFC 7009 Token revocation executed for client ${clientId}`
        );
      }

      return NextResponse.json({ revoked: true });
    }

    // 2. Revoke this app's own authorization for a citizen (client is authenticated above)
    if (body.citizen_id) {
      await db.execute({
        sql: "UPDATE civix_authorizations SET revoked = 1 WHERE citizen_id = ? AND app_id = ?",
        args: [String(body.citizen_id), appId],
      });
    }

    // RFC 7009 Section 2.2: The authorization server responds with HTTP status code 200
    // if the token has been revoked successfully or if the client submitted an invalid token.
    return NextResponse.json({ revoked: true });
  } catch (err: any) {
    console.error("POST /api/oauth/revoke error:", err);
    return NextResponse.json({ error: "server_error", error_description: err.message }, { status: 500 });
  }
}
