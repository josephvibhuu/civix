import { NextResponse } from "next/server";
import { SESSION_MAX_AGE_SECONDS } from "@/lib/security";
import { getDb, initDb } from "@/lib/db";
import { verifyPassword, createSessionToken, logSecurityEvent } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    await initDb();
    const db = getDb();
    const body = await req.json();

    const { identifier, password } = body;

    if (!identifier || !password) {
      return NextResponse.json({ error: "Identifier and password are required." }, { status: 400 });
    }

    const cleanId = identifier.trim().replace(/^https?:\/\/.*\/profile\//i, "").replace(/\/$/, "");

    // Search by gameProfileId OR currentUsername
    const res = await db.execute({
      sql: `SELECT * FROM civix_citizens 
            WHERE game_profile_id = ? OR LOWER(current_username) = LOWER(?) LIMIT 1`,
      args: [cleanId, cleanId],
    });

    if (res.rows.length === 0) {
      return NextResponse.json({ error: "Invalid credentials. Citizen account not found." }, { status: 401 });
    }

    const citizen = res.rows[0];
    const passwordValid = await verifyPassword(password, String(citizen.password_hash));

    if (!passwordValid) {
      return NextResponse.json({ error: "Invalid credentials. Password incorrect." }, { status: 401 });
    }

    const token = await createSessionToken({
      id: String(citizen.id),
      username: String(citizen.current_username),
      gameProfileId: String(citizen.game_profile_id),
    });

    await logSecurityEvent(String(citizen.id), "login", undefined, undefined, "Citizen logged in");

    const response = NextResponse.json({
      success: true,
      citizen: {
        id: String(citizen.id),
        username: String(citizen.current_username),
        gameProfileId: String(citizen.game_profile_id),
        verificationTier: String(citizen.verification_tier || "tier_1_citizen"),
        isAdmin: Boolean(citizen.is_admin),
      },
    });

    const isProd = process.env.NODE_ENV === "production";
    response.cookies.set("civix_session", token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      maxAge: SESSION_MAX_AGE_SECONDS, // 30 days, matches JWT expiry
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json({ error: error.message || "Failed to log in" }, { status: 500 });
  }
}
