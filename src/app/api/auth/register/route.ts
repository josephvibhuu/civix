import { NextResponse } from "next/server";
import { getDb, initDb } from "@/lib/db";
import { hashPassword, createSessionToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    await initDb();
    const db = getDb();
    const body = await req.json();

    const { username, gameProfileId, password, email, discordId, referralCode: bodyRef } = body;

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

    // Determine referral code to assign to this citizen
    const baseCode = username.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 14) || "CITIZEN";
    let myReferralCode = baseCode;
    const codeCheck = await db.execute({
      sql: "SELECT id FROM civix_citizens WHERE referral_code = ?",
      args: [myReferralCode],
    });
    if (codeCheck.rows.length > 0) {
      myReferralCode = `${baseCode}${Math.floor(100 + Math.random() * 900)}`;
    }

    // Check if invited by an existing citizen
    const cookieStore = await cookies();
    const activeRefCode = (bodyRef || cookieStore.get("civix_ref")?.value || "").trim().toUpperCase();
    let referrerId: string | null = null;
    let referrerName: string | null = null;

    if (activeRefCode) {
      const refRes = await db.execute({
        sql: "SELECT id, current_username FROM civix_citizens WHERE referral_code = ? OR UPPER(current_username) = ?",
        args: [activeRefCode, activeRefCode],
      });
      if (refRes.rows.length > 0) {
        referrerId = String(refRes.rows[0].id);
        referrerName = String(refRes.rows[0].current_username);
      }
    }

    await db.execute({
      sql: `INSERT INTO civix_citizens (
        id, game_profile_id, current_username, password_hash, email, discord_id, referral_code, referred_by_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        citizenId,
        cleanProfileId,
        username.trim(),
        passwordHash,
        email ? email.trim() : null,
        discordId ? discordId.trim() : null,
        myReferralCode,
        referrerId,
      ],
    });

    // Record referral event
    if (referrerId) {
      const refId = `ref_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
      await db.execute({
        sql: "INSERT OR IGNORE INTO civix_referrals (id, referrer_id, referred_id, referral_code) VALUES (?, ?, ?, ?)",
        args: [refId, referrerId, citizenId, activeRefCode],
      });

      // Send notification to referrer
      const notifId = `notif_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
      await db.execute({
        sql: `INSERT INTO civix_notifications (id, citizen_id, title, message, type, action_url)
              VALUES (?, ?, ?, ?, 'reward', '/referrals')`,
        args: [
          notifId,
          referrerId,
          "New Citizen Referral!",
          `${username.trim()} just joined Parlamentum using your referral link! You'll receive credit across all ecosystem apps.`,
        ],
      });
    }

    // Send welcome notification to new citizen
    const welcomeNotifId = `notif_${Date.now().toString(36)}_w`;
    await db.execute({
      sql: `INSERT INTO civix_notifications (id, citizen_id, title, message, type, action_url)
            VALUES (?, ?, ?, ?, 'info', '/')`,
      args: [
        welcomeNotifId,
        citizenId,
        "Welcome to the Realm!",
        "Your sovereign Civix Passport has been minted. You can now access Grow UR Gold and all connected apps with one master identity.",
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
        referralCode: myReferralCode,
        referredBy: referrerName,
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

    // Clear ref cookie
    response.cookies.set("civix_ref", "", { path: "/", maxAge: 0 });

    return response;
  } catch (error: any) {
    console.error("Register error:", error);
    return NextResponse.json({ error: error.message || "Failed to create account" }, { status: 500 });
  }
}
