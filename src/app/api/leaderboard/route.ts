import { NextResponse, connection } from "next/server";
import { getDb, initDb } from "@/lib/db";

export async function GET() {
  await connection();
  try {
    await initDb();
    const db = getDb();

    // 1. Top Recruiters: Citizens ranked by count of referred citizens
    const recruitersRes = await db.execute(`
      SELECT 
        c.id,
        c.current_username,
        c.game_profile_id,
        c.verification_tier,
        c.created_at,
        COUNT(r.id) as referral_count
      FROM civix_citizens c
      LEFT JOIN civix_referrals r ON r.referrer_id = c.id
      GROUP BY c.id
      ORDER BY referral_count DESC, c.created_at ASC
      LIMIT 20
    `);

    const topRecruiters = recruitersRes.rows.map((r, idx) => ({
      rank: idx + 1,
      id: String(r.id),
      username: String(r.current_username),
      gameProfileId: String(r.game_profile_id),
      tier: String(r.verification_tier || "tier_1_citizen"),
      referralCount: Number(r.referral_count || 0),
      createdAt: String(r.created_at),
    }));

    // 2. Sovereign Citizens: Citizens ranked by number of authorized apps & seniority
    const citizensRes = await db.execute(`
      SELECT 
        c.id,
        c.current_username,
        c.game_profile_id,
        c.verification_tier,
        c.created_at,
        COUNT(a.id) as authorized_apps_count
      FROM civix_citizens c
      LEFT JOIN civix_authorizations a ON a.citizen_id = c.id AND (a.revoked = 0 OR a.revoked IS NULL)
      GROUP BY c.id
      ORDER BY 
        CASE 
          WHEN c.verification_tier = 'tier_3_sovereign' THEN 3
          WHEN c.verification_tier = 'tier_2_bank_verified' THEN 2
          ELSE 1
        END DESC,
        authorized_apps_count DESC,
        c.created_at ASC
      LIMIT 20
    `);

    const topCitizens = citizensRes.rows.map((r, idx) => ({
      rank: idx + 1,
      id: String(r.id),
      username: String(r.current_username),
      gameProfileId: String(r.game_profile_id),
      tier: String(r.verification_tier || "tier_1_citizen"),
      authorizedAppsCount: Number(r.authorized_apps_count || 0),
      createdAt: String(r.created_at),
    }));

    // 3. App Popularity Index: Apps ranked by total citizen authorizations
    const appsRes = await db.execute(`
      SELECT 
        ap.id,
        ap.name,
        ap.slug,
        ap.tagline,
        ap.category,
        ap.active_users_estimate,
        COUNT(az.id) as connected_citizens_count
      FROM civix_apps ap
      LEFT JOIN civix_authorizations az ON az.app_id = ap.id AND (az.revoked = 0 OR az.revoked IS NULL)
      WHERE ap.status = 'active'
      GROUP BY ap.id
      ORDER BY connected_citizens_count DESC, ap.active_users_estimate DESC
      LIMIT 20
    `);

    const topApps = appsRes.rows.map((r, idx) => ({
      rank: idx + 1,
      id: String(r.id),
      name: String(r.name),
      slug: String(r.slug),
      tagline: String(r.tagline),
      category: String(r.category),
      connectedCitizensCount: Number(r.connected_citizens_count || 0),
      activeUsersEstimate: Number(r.active_users_estimate || 0),
    }));

    return NextResponse.json({
      leaderboard: {
        topRecruiters,
        topCitizens,
        topApps,
      },
    });
  } catch (err: any) {
    console.error("Leaderboard error:", err);
    return NextResponse.json({ error: err.message || "Failed to load leaderboard" }, { status: 500 });
  }
}
