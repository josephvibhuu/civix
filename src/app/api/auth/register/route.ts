import { NextResponse } from "next/server";
import { getDb, initDb } from "@/lib/db";
import { hashPassword, createSessionToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    await initDb();
    const db = getDb();
    const body = await req.json();

    const { username, gameProfileId, password, email, discordId } = body;

    if (!username || !gameProfileId || !password) {
      return NextResponse.json(
        { error: "Username, Parlamentum Game Profile ID, and Password are required." },
        { status: 400 }
      );
    }

    // Clean up game profile ID (e.g. if pasted as URL https://parlamentum.org/profile/cmuoy... -> cmuoy...)
    const cleanProfileId = gameProfileId.trim().replace(/^https?:\/\/.*\/profile\//i, "").replace(/\/$/, "");

    // Check if citizen already exists
    const existing = await db.execute({
      sql: "SELECT id FROM civix_citizens WHERE game_profile_id = ? OR LOWER(current_username) = LOWER(?)",
      args: [cleanProfileId, username.trim()],
    });

    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: "A citizen with this Parlamentum Game Profile ID or Username already exists." },
        { status: 409 }
      );
    }

    const citizenId = `civ_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
    const passwordHash = await hashPassword(password);

    await db.execute({
      sql: `INSERT INTO civix_citizens (
        id, game_profile_id, current_username, password_hash, email, discord_id
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      args: [
        citizenId,
        cleanProfileId,
        username.trim(),
        passwordHash,
        email ? email.trim() : null,
        discordId ? discordId.trim() : null,
      ],
    });

    const token = await createSessionToken({
      id: citizenId,
      username: username.trim(),
      gameProfileId: cleanProfileId,
    });

    const response = NextResponse.json({
      success: true,
      citizen: {
        id: citizenId,
        username: username.trim(),
        gameProfileId: cleanProfileId,
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
    console.error("Register error:", error);
    return NextResponse.json({ error: error.message || "Failed to create account" }, { status: 500 });
  }
}
