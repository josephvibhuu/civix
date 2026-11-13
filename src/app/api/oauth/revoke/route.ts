import { NextResponse, connection } from "next/server";
import { getDb, initDb } from "@/lib/db";
import { logSecurityEvent } from "@/lib/auth";

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

    if (!token) {
      // RFC 7009: Missing token returns invalid_request 400
      return NextResponse.json({ error: "invalid_request", error_description: "Missing token parameter" }, { status: 400 });
    }

    // 1. Try to revoke authorization code
    const codeRes = await db.execute({
      sql: "SELECT * FROM civix_auth_codes WHERE code = ?",
      args: [token],
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
          undefined,
          undefined,
          `RFC 7009 Token revocation executed for client ${clientId || "unknown"}`
        );
      }

      // Per RFC 7009, successful revocation returns 200 OK with empty body or status
      return NextResponse.json({ revoked: true });
    }

    // 2. Try to revoke app authorization relation if clientId & citizenId are provided
    if (clientId && body.citizen_id) {
      const appRes = await db.execute({
        sql: "SELECT id FROM civix_apps WHERE client_id = ?",
        args: [clientId],
      });

      if (appRes.rows.length > 0) {
        const appId = String(appRes.rows[0].id);
        await db.execute({
          sql: "UPDATE civix_authorizations SET revoked = 1 WHERE citizen_id = ? AND app_id = ?",
          args: [String(body.citizen_id), appId],
        });
      }
    }

    // RFC 7009 Section 2.2: The authorization server responds with HTTP status code 200
    // if the token has been revoked successfully or if the client submitted an invalid token.
    return NextResponse.json({ revoked: true });
  } catch (err: any) {
    console.error("POST /api/oauth/revoke error:", err);
    return NextResponse.json({ error: "server_error", error_description: err.message }, { status: 500 });
  }
}
