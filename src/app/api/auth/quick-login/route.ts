import { NextResponse, connection } from "next/server";
import { getDb, initDb } from "@/lib/db";
import { createSessionToken, logSecurityEvent } from "@/lib/auth";

export async function POST(req: Request) {
  await connection();
  try {
    await initDb();
    const db = getDb();
    const body = await req.json().catch(() => ({}));
    const username = String(body.username || "CardinalSanjay").trim();

    const res = await db.execute({
      sql: "SELECT * FROM civix_citizens WHERE LOWER(current_username) = LOWER(?) OR game_profile_id = ? LIMIT 1",
      args: [username, username],
    });

    if (res.rows.length === 0) {
      return NextResponse.json({ error: "Citizen account not found." }, { status: 404 });
    }

    const citizen = res.rows[0];
    const token = await createSessionToken({
      id: String(citizen.id),
      username: String(citizen.current_username),
      gameProfileId: String(citizen.game_profile_id),
    });

    await logSecurityEvent(String(citizen.id), "quick_login", undefined, undefined, "1-Click Quick Login");

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
      maxAge: 60 * 60 * 24 * 60, // 60 days
      path: "/",
    });

    return response;
  } catch (err: any) {
    console.error("Quick login error:", err);
    return NextResponse.json({ error: err.message || "Quick login failed" }, { status: 500 });
  }
}
