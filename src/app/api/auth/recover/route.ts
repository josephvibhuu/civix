import { NextResponse } from "next/server";
import { getDb, initDb } from "@/lib/db";
import { hashPassword, logSecurityEvent } from "@/lib/auth";
import { randomDigits, randomToken, safeEqual } from "@/lib/security";

const MAX_CODE_ATTEMPTS = 5;
const RECOVERY_TTL_MS = 1000 * 60 * 30; // 30 minutes

export async function POST(req: Request) {
  try {
    await initDb();
    const db = getDb();
    const body = await req.json();

    const { action, identifier, code, newPassword } = body;

    // STEP 1: Request recovery instructions
    if (action === "request") {
      if (!identifier) {
        return NextResponse.json({ error: "Citizen username or Game Profile ID required." }, { status: 400 });
      }

      const cleanId = identifier.trim().replace(/^https?:\/\/.*\/profile\//i, "").replace(/\/$/, "");

      const citizenRes = await db.execute({
        sql: "SELECT id, current_username, game_profile_id FROM civix_citizens WHERE game_profile_id = ? OR LOWER(current_username) = LOWER(?)",
        args: [cleanId, cleanId],
      });

      if (citizenRes.rows.length === 0) {
        return NextResponse.json({ error: "No citizen found with this username or Game ID." }, { status: 404 });
      }

      const citizen = citizenRes.rows[0];
      const citizenId = String(citizen.id);

      // Reuse an existing live request instead of piling up new codes.
      const liveRes = await db.execute({
        sql: `SELECT contract_memo FROM civix_recovery_requests
              WHERE citizen_id = ? AND status = 'pending' AND expires_at > ?
              ORDER BY created_at DESC LIMIT 1`,
        args: [citizenId, Date.now()],
      });

      let memo: string;
      if (liveRes.rows.length > 0) {
        memo = String(liveRes.rows[0].contract_memo);
      } else {
        // SECURITY: the code is NEVER sent back to the browser. It is only handed
        // to the real owner by an admin/Discord bot after they prove ownership
        // in-game. The memo is a separate random reference, not the code.
        const codeDigits = randomDigits(6);
        const requestId = `rec_${randomToken(12)}`;
        memo = `CIVIX-REC-${randomToken(6).toUpperCase()}`;
        const expiresAt = Date.now() + RECOVERY_TTL_MS;

        await db.execute({
          sql: `INSERT INTO civix_recovery_requests (id, citizen_id, code, contract_memo, expires_at, attempts)
                VALUES (?, ?, ?, ?, ?, 0)`,
          args: [requestId, citizenId, codeDigits, memo, expiresAt],
        });

        await logSecurityEvent(citizenId, "recovery_requested", undefined, undefined, `Recovery memo ${memo} issued`);
      }

      return NextResponse.json({
        success: true,
        contractMemo: memo,
        citizenName: String(citizen.current_username),
        instructions: `Send 1 Raw Iron (or 1 Gold) in-game via notary contract to our verification account with memo: "${memo}". Once it's confirmed from your game profile, you'll be sent a 6-digit code (Discord DM) to enter here.`,
      });
    }

    // STEP 2: Complete password reset with code
    if (action === "complete") {
      if (!identifier || !code || !newPassword) {
        return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
      }

      const cleanId = identifier.trim().replace(/^https?:\/\/.*\/profile\//i, "").replace(/\/$/, "");

      const citizenRes = await db.execute({
        sql: "SELECT id FROM civix_citizens WHERE game_profile_id = ? OR LOWER(current_username) = LOWER(?)",
        args: [cleanId, cleanId],
      });

      if (citizenRes.rows.length === 0) {
        return NextResponse.json({ error: "Citizen not found." }, { status: 404 });
      }

      const citizenId = String(citizenRes.rows[0].id);

      if (String(newPassword).length < 8) {
        return NextResponse.json({ error: "New password must be at least 8 characters." }, { status: 400 });
      }

      // Load the live request (don't match on code in SQL, so we can count wrong guesses)
      const reqRes = await db.execute({
        sql: `SELECT id, code, attempts FROM civix_recovery_requests
              WHERE citizen_id = ? AND expires_at > ? AND status = 'pending'
              ORDER BY created_at DESC LIMIT 1`,
        args: [citizenId, Date.now()],
      });

      if (reqRes.rows.length === 0) {
        return NextResponse.json({ error: "Invalid or expired recovery code." }, { status: 400 });
      }

      const activeReq = reqRes.rows[0];
      const activeReqId = String(activeReq.id);
      const attempts = Number(activeReq.attempts || 0);

      if (attempts >= MAX_CODE_ATTEMPTS) {
        await db.execute({
          sql: "UPDATE civix_recovery_requests SET status = 'locked' WHERE id = ?",
          args: [activeReqId],
        });
        return NextResponse.json({ error: "Too many wrong codes. Start a new recovery request." }, { status: 429 });
      }

      if (!safeEqual(String(code).trim(), String(activeReq.code))) {
        const next = attempts + 1;
        await db.execute({
          sql: `UPDATE civix_recovery_requests SET attempts = ?, status = CASE WHEN ? >= ? THEN 'locked' ELSE status END WHERE id = ?`,
          args: [next, next, MAX_CODE_ATTEMPTS, activeReqId],
        });
        await logSecurityEvent(citizenId, "recovery_code_failed", undefined, undefined, `Wrong recovery code (attempt ${next})`);
        return NextResponse.json({ error: "Invalid or expired recovery code." }, { status: 400 });
      }

      const newHash = await hashPassword(String(newPassword));

      // Update password
      await db.execute({
        sql: "UPDATE civix_citizens SET password_hash = ?, updated_at = datetime('now') WHERE id = ?",
        args: [newHash, citizenId],
      });

      // Mark this request used and kill any other pending ones for this account
      await db.execute({
        sql: "UPDATE civix_recovery_requests SET status = 'completed' WHERE id = ?",
        args: [activeReqId],
      });
      await db.execute({
        sql: "UPDATE civix_recovery_requests SET status = 'cancelled' WHERE citizen_id = ? AND status = 'pending'",
        args: [citizenId],
      });

      await logSecurityEvent(citizenId, "password_reset", undefined, undefined, "Password reset via recovery code");

      return NextResponse.json({
        success: true,
        message: "Password reset successfully. You can now log into all Civix apps with your new password.",
      });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (error: any) {
    console.error("Recovery error:", error);
    return NextResponse.json({ error: error.message || "Password recovery failed" }, { status: 500 });
  }
}
