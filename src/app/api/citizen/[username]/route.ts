import { NextResponse, connection } from "next/server";
import { getDb, initDb } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  await connection();
  try {
    await initDb();
    const db = getDb();
    const { username } = await params;
    const cleanUsername = decodeURIComponent(username).trim();

    // 1. Find citizen
    const citizenRes = await db.execute({
      sql: "SELECT id, current_username, game_profile_id, verification_tier, is_verified, referral_code, created_at FROM civix_citizens WHERE LOWER(current_username) = LOWER(?) OR game_profile_id = ? LIMIT 1",
      args: [cleanUsername, cleanUsername],
    });

    if (citizenRes.rows.length === 0) {
      return NextResponse.json({ error: "Citizen passport not found in the realm register." }, { status: 404 });
    }

    const c = citizenRes.rows[0];
    const citizenId = String(c.id);

    // 2. Count connected applications
    const appsRes = await db.execute({
      sql: `SELECT a.name, a.slug, a.category, a.icon_url 
            FROM civix_authorizations auth
            JOIN civix_apps a ON auth.app_id = a.id
            WHERE auth.citizen_id = ? AND (auth.revoked = 0 OR auth.revoked IS NULL)`,
      args: [citizenId],
    });

    // 3. Get reviews written by this citizen
    const reviewsRes = await db.execute({
      sql: `SELECT r.rating, r.title, r.comment, r.created_at, a.name as app_name, a.slug as app_slug
            FROM civix_reviews r
            JOIN civix_apps a ON r.app_id = a.id
            WHERE r.citizen_id = ?
            ORDER BY r.created_at DESC`,
      args: [citizenId],
    });

    // 4. Referral count
    const refCountRes = await db.execute({
      sql: "SELECT COUNT(*) as count FROM civix_referrals WHERE referrer_id = ?",
      args: [citizenId],
    });
    const referralCount = Number(refCountRes.rows[0]?.count || 0);

    return NextResponse.json({
      citizen: {
        id: citizenId,
        username: String(c.current_username),
        gameProfileId: String(c.game_profile_id),
        tier: String(c.verification_tier || "tier_1_citizen"),
        isVerified: Boolean(c.is_verified),
        referralCode: c.referral_code ? String(c.referral_code) : null,
        memberSince: String(c.created_at),
        referralCount,
        connectedApps: appsRes.rows.map((a) => ({
          name: String(a.name),
          slug: String(a.slug),
          category: String(a.category),
          iconUrl: a.icon_url ? String(a.icon_url) : null,
        })),
        reviews: reviewsRes.rows.map((r) => ({
          rating: Number(r.rating),
          title: String(r.title),
          comment: String(r.comment),
          appName: String(r.app_name),
          appSlug: String(r.app_slug),
          createdAt: String(r.created_at),
        })),
      },
    });
  } catch (err: any) {
    console.error("GET /api/citizen/[username] error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch citizen profile" }, { status: 500 });
  }
}
