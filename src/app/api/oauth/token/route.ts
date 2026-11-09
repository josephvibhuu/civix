import { NextResponse } from "next/server";
import { getDb, initDb } from "@/lib/db";
import { logSecurityEvent } from "@/lib/auth";
import { SignJWT } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.CIVIX_JWT_SECRET || "civix-super-secure-parlamentum-secret-key-998811"
);

export async function POST(req: Request) {
  try {
    await initDb();
    const db = getDb();
    const body = await req.json();

    const { code, client_id, client_secret } = body;

    if (!code || !client_id) {
      return NextResponse.json({ error: "Missing authorization code or client_id" }, { status: 400 });
    }

    // Verify app client credentials
    const appRes = await db.execute({
      sql: "SELECT * FROM civix_apps WHERE client_id = ?",
      args: [client_id],
    });

    if (appRes.rows.length === 0) {
      return NextResponse.json({ error: "Invalid client_id" }, { status: 401 });
    }

    const app = appRes.rows[0];

    // Optional: client_secret verification for non-public clients
    if (client_secret && client_secret !== String(app.client_secret_hash)) {
      return NextResponse.json({ error: "Invalid client_secret" }, { status: 401 });
    }

    // Verify auth code
    const codeRes = await db.execute({
      sql: "SELECT * FROM civix_auth_codes WHERE code = ? AND client_id = ? AND used = 0 AND expires_at > ?",
      args: [code, client_id, Date.now()],
    });

    if (codeRes.rows.length === 0) {
      return NextResponse.json({ error: "Invalid or expired authorization code" }, { status: 400 });
    }

    const authRecord = codeRes.rows[0];
    const scopes = String(authRecord.scope || "identity").split(/[\s,]+/);

    // Mark code as used
    await db.execute({
      sql: "UPDATE civix_auth_codes SET used = 1 WHERE code = ?",
      args: [code],
    });

    // Fetch full citizen record
    const citizenRes = await db.execute({
      sql: "SELECT * FROM civix_citizens WHERE id = ?",
      args: [authRecord.citizen_id],
    });

    if (citizenRes.rows.length === 0) {
      return NextResponse.json({ error: "Citizen record not found" }, { status: 404 });
    }

    const citizen = citizenRes.rows[0];
    const citizenId = String(citizen.id);

    // Banking-Grade KYC & Audit Data (for Bank of Europe and bourses)
    let kycPayload: any = {};
    if (scopes.some((s) => s.includes("banking") || s.includes("kyc"))) {
      const historyRes = await db.execute({
        sql: "SELECT previous_name, updated_name, synced_at FROM civix_username_history WHERE citizen_id = ? ORDER BY synced_at DESC LIMIT 5",
        args: [citizenId],
      });

      const createdAtMs = new Date(String(citizen.created_at || Date.now())).getTime();
      const accountAgeDays = Math.floor((Date.now() - createdAtMs) / (1000 * 60 * 60 * 24));

      kycPayload = {
        verificationTier: String(citizen.verification_tier || "tier_1_citizen"),
        accountAgeDays,
        nameHistory: historyRes.rows.map((r) => ({
          previous: String(r.previous_name),
          updated: String(r.updated_name),
          syncedAt: String(r.synced_at),
        })),
        isSanctioned: false,
      };
    }

    // Log the token exchange event for security audits
    await logSecurityEvent(
      citizenId,
      "oauth_token_issued",
      String(app.id),
      undefined,
      `Token issued to ${app.name} with scopes: ${scopes.join(", ")}`
    );

    // Mint ID Token
    const idToken = await new SignJWT({
      iss: "https://civix.parlamentum",
      sub: citizenId,
      aud: client_id,
      citizenId,
      username: String(citizen.current_username),
      gameProfileId: String(citizen.game_profile_id),
      verificationTier: String(citizen.verification_tier || "tier_1_citizen"),
      isVerified: Boolean(citizen.is_verified),
      scopes,
      ...kycPayload,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h")
      .sign(JWT_SECRET);

    return NextResponse.json({
      access_token: idToken,
      token_type: "Bearer",
      expires_in: 86400,
      citizen: {
        id: citizenId,
        username: String(citizen.current_username),
        gameProfileId: String(citizen.game_profile_id),
        verificationTier: String(citizen.verification_tier || "tier_1_citizen"),
        isVerified: Boolean(citizen.is_verified),
        ...(scopes.some((s) => s.includes("banking") || s.includes("kyc")) ? kycPayload : {}),
      },
    });
  } catch (error: any) {
    console.error("Token exchange error:", error);
    return NextResponse.json({ error: error.message || "Failed to exchange token" }, { status: 500 });
  }
}
