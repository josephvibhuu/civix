import { NextResponse } from "next/server";
import { getDb, initDb } from "@/lib/db";
import { verifyPassword, createSessionToken, syncInGameUsername } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    await initDb();
    const db = getDb();
    const body = await req.json();

    const { identifier, password, currentInGameName } = body;

    if (!identifier || !password) {
      return NextResponse.json({ error: "Identifier and password are required." }, { status: 400 });
    }

    const cleanId = identifier.trim().replace(/^https?:\/\/.*\/profile\//i, "").replace(/\/$/, "");

    // Search by gameProfileId OR currentUsername
    const res = await db.execute({
      sql: `SELECT * FROM civix_citizens 
            WHERE game_profile_id = ? OR LOWER(current_username) = LOWER(?)`,
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

    // Auto-detect and sync if user provided an updated in-game name
    if (currentInGameName && currentInGameName.trim()) {
      await syncInGameUsername(String(citizen.game_profile_id), currentInGameName.trim());
    }

    const token = await createSessionToken({
      id: String(citizen.id),
      username: currentInGameName ? currentInGameName.trim() : String(citizen.current_username),
      gameProfileId: String(citizen.game_profile_id),
    });

    const response = NextResponse.json({
      success: true,
      citizen: {
        id: String(citizen.id),
        username: String(citizen.current_username),
        gameProfileId: String(citizen.game_profile_id),
        vaultGold: Number(citizen.vault_gold || 0),
        isAdmin: Boolean(citizen.is_admin),
      },
    });

    response.cookies.set("civix_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json({ error: error.message || "Failed to log in" }, { status: 500 });
  }
}
