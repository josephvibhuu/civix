import { NextResponse } from "next/server";
import { getDb, initDb } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

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
      const codeDigits = Math.floor(100000 + Math.random() * 900000).toString();
      const requestId = `rec_${Date.now().toString(36)}_${codeDigits}`;
      const memo = `CIVIX-KEY-${codeDigits}`;
      const expiresAt = Date.now() + 1000 * 60 * 30; // 30 minutes

      await db.execute({
        sql: `INSERT INTO civix_recovery_requests (id, citizen_id, code, contract_memo, expires_at)
              VALUES (?, ?, ?, ?, ?)`,
        args: [requestId, citizenId, codeDigits, memo, expiresAt],
      });

      return NextResponse.json({
        success: true,
        requestId,
        code: codeDigits,
        contractMemo: memo,
        citizenName: String(citizen.current_username),
        instructions: `Send 1 Raw Iron (or 1 Gold) in-game via notary contract to our verification account with memo: "${memo}", or enter the code if verified via Discord bot.`,
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

      // Verify active code
      const reqRes = await db.execute({
        sql: `SELECT id FROM civix_recovery_requests 
              WHERE citizen_id = ? AND code = ? AND expires_at > ? AND status = 'pending'
              ORDER BY created_at DESC LIMIT 1`,
        args: [citizenId, code.trim(), Date.now()],
      });

      if (reqRes.rows.length === 0) {
        return NextResponse.json({ error: "Invalid or expired recovery code." }, { status: 400 });
      }

      const activeReqId = String(reqRes.rows[0].id);
      const newHash = await hashPassword(newPassword);

      // Update password
      await db.execute({
        sql: "UPDATE civix_citizens SET password_hash = ?, updated_at = datetime('now') WHERE id = ?",
        args: [newHash, citizenId],
      });

      // Mark request as used
      await db.execute({
        sql: "UPDATE civix_recovery_requests SET status = 'completed' WHERE id = ?",
        args: [activeReqId],
      });

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
