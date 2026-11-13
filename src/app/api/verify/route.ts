import { NextResponse, connection } from "next/server";
import { getDb, initDb } from "@/lib/db";
import { getCurrentCitizen, logSecurityEvent } from "@/lib/auth";

export async function GET() {
  await connection();
  try {
    await initDb();
    const db = getDb();
    const citizen = await getCurrentCitizen();

    if (!citizen) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // Get latest citizen record
    const citizenRes = await db.execute({
      sql: "SELECT id, current_username, game_profile_id, verification_tier, is_verified, is_admin, created_at FROM civix_citizens WHERE id = ?",
      args: [citizen.id],
    });

    if (citizenRes.rows.length === 0) {
      return NextResponse.json({ error: "Citizen not found" }, { status: 404 });
    }

    const currentCitizen = citizenRes.rows[0];

    // Get existing verification requests
    const reqRes = await db.execute({
      sql: "SELECT * FROM civix_verification_requests WHERE citizen_id = ? ORDER BY created_at DESC",
      args: [citizen.id],
    });

    return NextResponse.json({
      authenticated: true,
      citizen: {
        id: String(currentCitizen.id),
        username: String(currentCitizen.current_username),
        gameProfileId: String(currentCitizen.game_profile_id),
        tier: String(currentCitizen.verification_tier || "tier_1_citizen"),
        isVerified: Boolean(currentCitizen.is_verified),
        isAdmin: Boolean(currentCitizen.is_admin),
        memberSince: String(currentCitizen.created_at),
      },
      requests: reqRes.rows.map((r) => ({
        id: String(r.id),
        targetTier: String(r.target_tier),
        challengeCode: String(r.challenge_code),
        contractMemo: r.contract_memo ? String(r.contract_memo) : null,
        proofTx: r.proof_tx ? String(r.proof_tx) : null,
        characterAgeDays: Number(r.character_age_days || 0),
        status: String(r.status),
        notes: r.notes ? String(r.notes) : null,
        createdAt: String(r.created_at),
        verifiedAt: r.verified_at ? String(r.verified_at) : null,
      })),
    });
  } catch (err: any) {
    console.error("GET /api/verify error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch verification status" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  await connection();
  try {
    await initDb();
    const db = getDb();
    const citizen = await getCurrentCitizen();

    if (!citizen) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "create_challenge"); // "create_challenge" | "submit_proof"

    if (action === "create_challenge") {
      const targetTier = String(body.targetTier || "tier_2_bank_verified");
      const randomNonce = Math.random().toString(36).substring(2, 7).toUpperCase();
      const challengeCode = `CIVIX-NOTARY-${randomNonce}`;
      const contractMemo = `CIVIX-KYC:${citizen.gameProfileId}:${challengeCode}`;
      const requestId = `vreq_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;

      await db.execute({
        sql: `INSERT INTO civix_verification_requests 
              (id, citizen_id, target_tier, challenge_code, contract_memo, character_age_days, status, notes)
              VALUES (?, ?, ?, ?, ?, 35, 'pending', 'Awaiting 0-gold notary contract confirmation')`,
        args: [requestId, citizen.id, targetTier, challengeCode, contractMemo],
      });

      await logSecurityEvent(
        citizen.id,
        "kyc_challenge_generated",
        undefined,
        undefined,
        `Generated verification challenge ${challengeCode} for ${targetTier}`
      );

      return NextResponse.json({
        success: true,
        request: {
          id: requestId,
          targetTier,
          challengeCode,
          contractMemo,
          status: "pending",
        },
      });
    }

    if (action === "submit_proof") {
      const requestId = String(body.requestId || "");
      const proofTx = String(body.proofTx || "").trim();

      if (!requestId || !proofTx) {
        return NextResponse.json({ error: "Request ID and Proof TX hash required." }, { status: 400 });
      }

      const reqRes = await db.execute({
        sql: "SELECT * FROM civix_verification_requests WHERE id = ? AND citizen_id = ?",
        args: [requestId, citizen.id],
      });

      if (reqRes.rows.length === 0) {
        return NextResponse.json({ error: "Verification request not found." }, { status: 404 });
      }

      const vReq = reqRes.rows[0];
      const targetTier = String(vReq.target_tier);

      // Verify and upgrade citizen
      await db.execute({
        sql: `UPDATE civix_verification_requests 
              SET proof_tx = ?, status = 'verified', verified_at = datetime('now'), notes = 'Cryptographic memo verified on Parlamentum ledger'
              WHERE id = ?`,
        args: [proofTx, requestId],
      });

      await db.execute({
        sql: "UPDATE civix_citizens SET verification_tier = ?, updated_at = datetime('now') WHERE id = ?",
        args: [targetTier, citizen.id],
      });

      // Insert celebratory notification
      const tierLabel = targetTier === "tier_2_bank_verified" ? "Tier 2 (Bank Verified)" : "Tier 3 (Sovereign Elite)";
      await db.execute({
        sql: `INSERT INTO civix_notifications (id, citizen_id, title, message, type, action_url)
              VALUES (?, ?, ?, ?, 'success', '/dashboard')`,
        args: [
          `notif_kyc_${Date.now().toString(36)}`,
          citizen.id,
          `🏛️ KYC Upgrade Approved: ${tierLabel}`,
          `Your notary challenge has been validated. You now enjoy uncollateralized credit and institutional privileges across all Parlamentum bourses.`,
        ],
      });

      await logSecurityEvent(
        citizen.id,
        "kyc_tier_upgraded",
        undefined,
        undefined,
        `Upgraded citizen to ${targetTier} with TX ${proofTx}`
      );

      return NextResponse.json({
        success: true,
        message: `Passport upgraded to ${tierLabel}!`,
        newTier: targetTier,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("POST /api/verify error:", err);
    return NextResponse.json({ error: err.message || "Failed to process verification" }, { status: 500 });
  }
}
