import { NextResponse, connection } from "next/server";
import { getDb, initDb } from "@/lib/db";
import { getCurrentCitizen } from "@/lib/auth";

export async function GET() {
  await connection();
  try {
    const citizen = await getCurrentCitizen();
    if (!citizen) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await initDb();
    const db = getDb();

    // Fetch referral code (or generate if null)
    let refCode = citizen.referralCode;
    if (!refCode) {
      refCode = citizen.currentUsername.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 14) || "CITIZEN";
      await db.execute({
        sql: "UPDATE civix_citizens SET referral_code = ? WHERE id = ?",
        args: [refCode, citizen.id],
      });
    }

    // Fetch referred citizens
    const referralsRes = await db.execute({
      sql: `SELECT c.id, c.current_username, c.verification_tier, r.created_at
            FROM civix_referrals r
            JOIN civix_citizens c ON r.referred_id = c.id
            WHERE r.referrer_id = ?
            ORDER BY r.created_at DESC`,
      args: [citizen.id],
    });

    const referrals = referralsRes.rows.map((r) => ({
      id: String(r.id),
      username: String(r.current_username),
      verificationTier: String(r.verification_tier || "tier_1_citizen"),
      joinedAt: String(r.created_at),
    }));

    return NextResponse.json({
      referralCode: refCode,
      referralUrl: `https://civix-plum.vercel.app?ref=${refCode}`,
      totalReferrals: referrals.length,
      referrals,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load referrals" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const citizen = await getCurrentCitizen();
    if (!citizen) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await initDb();
    const db = getDb();
    const body = await req.json();
    const newCode = (body.customCode || "").trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");

    if (newCode.length < 3 || newCode.length > 20) {
      return NextResponse.json({ error: "Referral code must be 3 to 20 letters or numbers" }, { status: 400 });
    }

    // Check availability
    const check = await db.execute({
      sql: "SELECT id FROM civix_citizens WHERE referral_code = ? AND id != ?",
      args: [newCode, citizen.id],
    });

    if (check.rows.length > 0) {
      return NextResponse.json({ error: "This referral code is already in use by another citizen" }, { status: 409 });
    }

    await db.execute({
      sql: "UPDATE civix_citizens SET referral_code = ? WHERE id = ?",
      args: [newCode, citizen.id],
    });

    return NextResponse.json({
      success: true,
      referralCode: newCode,
      referralUrl: `https://civix-plum.vercel.app?ref=${newCode}`,
      message: "Custom vanity referral code updated!",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update referral code" }, { status: 500 });
  }
}
