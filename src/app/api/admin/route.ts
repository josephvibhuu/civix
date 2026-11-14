import { NextResponse, connection } from "next/server";
import { getDb, initDb } from "@/lib/db";
import { getCurrentCitizen, logSecurityEvent } from "@/lib/auth";
import { hashClientSecret, randomToken } from "@/lib/security";

const ALLOWED_TIERS = ["tier_1_citizen", "tier_2_bank_verified", "tier_3_sovereign"];

export async function GET() {
  await connection();
  try {
    const citizen = await getCurrentCitizen();
    if (!citizen || !citizen.isAdmin) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    await initDb();
    const db = getDb();

    // 1. Stats
    const citizensCountRes = await db.execute("SELECT COUNT(*) as total FROM civix_citizens");
    const appsCountRes = await db.execute("SELECT COUNT(*) as total FROM civix_apps");
    const activeAppsRes = await db.execute("SELECT COUNT(*) as total FROM civix_apps WHERE status = 'active'");
    const authzCountRes = await db.execute("SELECT COUNT(*) as total FROM civix_authorizations WHERE revoked = 0 OR revoked IS NULL");
    const codesCountRes = await db.execute("SELECT COUNT(*) as total FROM civix_auth_codes");

    // 2. Apps list
    const appsRes = await db.execute(`
      SELECT id, name, slug, tagline, category, app_url, client_id, owner_name, 
             active_users_estimate, featured, verified, status, created_at
      FROM civix_apps
      ORDER BY created_at DESC
    `);

    // 3. Citizens list
    const citizensRes = await db.execute(`
      SELECT id, current_username, game_profile_id, email, discord_id, verification_tier, 
             is_verified, is_admin, referral_code, created_at
      FROM civix_citizens
      ORDER BY created_at DESC LIMIT 50
    `);

    // 4. Recent OAuth code logs
    const codesRes = await db.execute(`
      SELECT code, citizen_id, client_id, redirect_uri, scope, used, expires_at
      FROM civix_auth_codes
      ORDER BY expires_at DESC LIMIT 30
    `);

    // 4b. Verification requests waiting for an admin to check the in-game proof
    const pendingVerifsRes = await db.execute(`
      SELECT v.id, v.citizen_id, v.target_tier, v.challenge_code, v.contract_memo, v.proof_tx, v.status, v.created_at,
             c.current_username, c.game_profile_id
      FROM civix_verification_requests v
      JOIN civix_citizens c ON c.id = v.citizen_id
      WHERE v.status = 'submitted'
      ORDER BY v.created_at ASC LIMIT 50
    `);

    // 5. Banners
    const bannersRes = await db.execute(`
      SELECT * FROM civix_featured_banners ORDER BY sort_order ASC, created_at DESC
    `);

    return NextResponse.json({
      metrics: {
        totalCitizens: Number(citizensCountRes.rows[0]?.total || 0),
        totalApps: Number(appsCountRes.rows[0]?.total || 0),
        activeApps: Number(activeAppsRes.rows[0]?.total || 0),
        totalAuthorizations: Number(authzCountRes.rows[0]?.total || 0),
        totalAuthCodesIssued: Number(codesCountRes.rows[0]?.total || 0),
      },
      apps: appsRes.rows,
      citizens: citizensRes.rows,
      // Never send live auth codes to the browser (even to admins): they can be exchanged for tokens.
      recentAuthCodes: codesRes.rows.map((r) => ({ ...r, code: `${String(r.code).slice(0, 12)}…` })),
      pendingVerifications: pendingVerifsRes.rows,
      banners: bannersRes.rows,
    });
  } catch (error: any) {
    console.error("Admin query error:", error);
    return NextResponse.json({ error: error.message || "Failed to load admin data" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const citizen = await getCurrentCitizen();
    if (!citizen || !citizen.isAdmin) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    await initDb();
    const db = getDb();
    const body = await req.json();
    const { action } = body;

    if (action === "toggle_app_feature") {
      const { appId, featured } = body;
      await db.execute({
        sql: "UPDATE civix_apps SET featured = ? WHERE id = ?",
        args: [featured ? 1 : 0, appId],
      });
      return NextResponse.json({ success: true, message: "App feature flag updated" });
    }

    if (action === "set_citizen_tier") {
      const { citizenId, tier } = body;
      if (!ALLOWED_TIERS.includes(String(tier))) {
        return NextResponse.json({ error: "Unknown tier" }, { status: 400 });
      }
      await db.execute({
        sql: "UPDATE civix_citizens SET verification_tier = ? WHERE id = ?",
        args: [tier, citizenId],
      });
      return NextResponse.json({ success: true, message: `Citizen tier set to ${tier}` });
    }

    if (action === "rotate_client_secret") {
      const appId = String(body.appId || "");
      const newSecret = `civ_sec_${randomToken(32)}`;
      const r = await db.execute({
        sql: "UPDATE civix_apps SET client_secret_hash = ? WHERE id = ?",
        args: [hashClientSecret(newSecret), appId],
      });
      if (r.rowsAffected === 0) return NextResponse.json({ error: "App not found" }, { status: 404 });
      await logSecurityEvent(citizen.id, "client_secret_rotated", appId, undefined, `Rotated client secret for ${appId}`);
      // Returned once; only the hash is stored
      return NextResponse.json({ success: true, clientSecret: newSecret });
    }

    if (action === "set_app_status") {
      const { appId, status } = body;
      if (!["active", "pending", "suspended"].includes(String(status))) {
        return NextResponse.json({ error: "Unknown status" }, { status: 400 });
      }
      await db.execute({
        sql: "UPDATE civix_apps SET status = ? WHERE id = ?",
        args: [status, appId],
      });
      return NextResponse.json({ success: true, message: `App status updated to ${status}` });
    }

    if (action === "lookup_recovery") {
      // Admin/Discord bot checks the in-game notary contract (sender + memo), then
      // looks up the code here and sends it privately to the citizen.
      const memo = String(body.memo || "").trim();
      if (!memo) return NextResponse.json({ error: "Memo required" }, { status: 400 });
      const recRes = await db.execute({
        sql: `SELECT r.code, r.status, r.expires_at, r.attempts, c.current_username, c.game_profile_id, c.discord_id
              FROM civix_recovery_requests r JOIN civix_citizens c ON c.id = r.citizen_id
              WHERE r.contract_memo = ? ORDER BY r.created_at DESC LIMIT 1`,
        args: [memo],
      });
      if (recRes.rows.length === 0) {
        return NextResponse.json({ error: "No recovery request with that memo" }, { status: 404 });
      }
      const r = recRes.rows[0];
      const live = String(r.status) === "pending" && Number(r.expires_at) > Date.now();
      await logSecurityEvent(citizen.id, "admin_recovery_lookup", undefined, undefined, `Looked up recovery memo ${memo}`);
      return NextResponse.json({
        success: true,
        recovery: {
          username: String(r.current_username),
          gameProfileId: String(r.game_profile_id),
          discordId: r.discord_id ? String(r.discord_id) : null,
          status: live ? "pending" : String(r.status) === "pending" ? "expired" : String(r.status),
          attempts: Number(r.attempts || 0),
          expiresAt: Number(r.expires_at),
          // Only reveal the code while the request is still usable
          code: live ? String(r.code) : null,
        },
      });
    }

    if (action === "review_verification") {
      const { requestId, approve } = body;
      const vRes = await db.execute({
        sql: "SELECT id, citizen_id, target_tier FROM civix_verification_requests WHERE id = ? AND status = 'submitted'",
        args: [String(requestId || "")],
      });
      if (vRes.rows.length === 0) {
        return NextResponse.json({ error: "Request not found or already reviewed" }, { status: 404 });
      }
      const v = vRes.rows[0];
      const targetTier = String(v.target_tier);
      if (approve) {
        if (!ALLOWED_TIERS.includes(targetTier)) {
          return NextResponse.json({ error: "Request has an invalid tier" }, { status: 400 });
        }
        await db.execute({
          sql: `UPDATE civix_verification_requests SET status = 'verified', verified_at = datetime('now'),
                notes = ? WHERE id = ?`,
          args: [`Approved by ${citizen.currentUsername}`, String(v.id)],
        });
        await db.execute({
          sql: "UPDATE civix_citizens SET verification_tier = ?, updated_at = datetime('now') WHERE id = ?",
          args: [targetTier, String(v.citizen_id)],
        });
        const tierLabel = targetTier === "tier_2_bank_verified" ? "Tier 2 (Bank Verified)" : "Tier 3 (Sovereign Elite)";
        await db.execute({
          sql: `INSERT INTO civix_notifications (id, citizen_id, title, message, type, action_url)
                VALUES (?, ?, ?, ?, 'success', '/dashboard')`,
          args: [
            `notif_kyc_${Date.now().toString(36)}_${String(v.id).slice(-4)}`,
            String(v.citizen_id),
            `🏛️ KYC Upgrade Approved: ${tierLabel}`,
            "Your notary challenge has been validated by an administrator.",
          ],
        });
      } else {
        await db.execute({
          sql: "UPDATE civix_verification_requests SET status = 'rejected', notes = ? WHERE id = ?",
          args: [`Rejected by ${citizen.currentUsername}`, String(v.id)],
        });
      }
      await logSecurityEvent(
        String(v.citizen_id),
        approve ? "kyc_tier_upgraded" : "kyc_rejected",
        undefined,
        undefined,
        `${approve ? "Approved" : "Rejected"} ${targetTier} by admin ${citizen.currentUsername}`
      );
      return NextResponse.json({ success: true, message: approve ? "Verification approved" : "Verification rejected" });
    }

    if (action === "save_banner") {
      const { id, appId, title, subtitle, badgeText, bannerUrl, ctaText, ctaUrl, sortOrder, active } = body;
      const bannerId = id || `banner_${Date.now()}`;
      await db.execute({
        sql: `INSERT OR REPLACE INTO civix_featured_banners 
              (id, app_id, title, subtitle, badge_text, banner_url, cta_text, cta_url, sort_order, active)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          bannerId,
          appId || null,
          title,
          subtitle || "",
          badgeText || "FEATURED",
          bannerUrl,
          ctaText || "Launch Application",
          ctaUrl || "/",
          Number(sortOrder || 0),
          active ? 1 : 0,
        ],
      });
      return NextResponse.json({ success: true, message: "Banner saved successfully" });
    }

    if (action === "delete_banner") {
      const { bannerId } = body;
      await db.execute({
        sql: "DELETE FROM civix_featured_banners WHERE id = ?",
        args: [bannerId],
      });
      return NextResponse.json({ success: true, message: "Banner deleted" });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    console.error("Admin action error:", error);
    return NextResponse.json({ error: error.message || "Admin action failed" }, { status: 500 });
  }
}
