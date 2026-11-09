import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { getDb, initDb } from "./db";

const JWT_SECRET = new TextEncoder().encode(
  process.env.CIVIX_JWT_SECRET || "civix-super-secure-parlamentum-secret-key-998811"
);

export interface CivixCitizen {
  id: string;
  gameProfileId: string;
  currentUsername: string;
  email?: string;
  discordId?: string;
  avatarUrl?: string;
  verificationTier: "tier_1_citizen" | "tier_2_bank_verified" | "tier_3_sovereign";
  isVerified: boolean;
  isAdmin: boolean;
  createdAt: string;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plain, hashed);
}

export async function createSessionToken(citizen: { id: string; username: string; gameProfileId: string }): Promise<string> {
  return new SignJWT({
    sub: citizen.id,
    username: citizen.username,
    gameProfileId: citizen.gameProfileId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(JWT_SECRET);
}

export async function verifySessionToken(token: string): Promise<{ sub: string; username: string; gameProfileId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      sub: payload.sub as string,
      username: payload.username as string,
      gameProfileId: payload.gameProfileId as string,
    };
  } catch {
    return null;
  }
}

export async function getCurrentCitizen(): Promise<CivixCitizen | null> {
  try {
    await initDb();
    const cookieStore = await cookies();
    const token = cookieStore.get("civix_session")?.value;
    if (!token) return null;

    const payload = await verifySessionToken(token);
    if (!payload) return null;

    const db = getDb();
    const res = await db.execute({
      sql: "SELECT * FROM civix_citizens WHERE id = ?",
      args: [payload.sub],
    });

    if (res.rows.length === 0) return null;
    const r = res.rows[0];

    return {
      id: String(r.id),
      gameProfileId: String(r.game_profile_id),
      currentUsername: String(r.current_username),
      email: r.email ? String(r.email) : undefined,
      discordId: r.discord_id ? String(r.discord_id) : undefined,
      avatarUrl: r.avatar_url ? String(r.avatar_url) : undefined,
      verificationTier: (r.verification_tier as any) || "tier_1_citizen",
      isVerified: Boolean(r.is_verified),
      isAdmin: Boolean(r.is_admin),
      createdAt: String(r.created_at),
    };
  } catch {
    return null;
  }
}

export async function logSecurityEvent(
  citizenId: string,
  eventType: string,
  appId?: string,
  ipHint?: string,
  details?: string
): Promise<void> {
  try {
    const db = getDb();
    const logId = `sec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    await db.execute({
      sql: `INSERT INTO civix_security_logs (id, citizen_id, event_type, app_id, ip_hint, details)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [logId, citizenId, eventType, appId || null, ipHint || null, details || null],
    });
  } catch (e) {
    console.error("Security log error:", e);
  }
}

/**
 * Handle in-game username updates safely without breaking accounts.
 * If a citizen renames themselves in Parlamentum, this function records
 * the old name in history and updates the current display handle.
 */
export async function syncInGameUsername(gameProfileId: string, newInGameUsername: string): Promise<boolean> {
  await initDb();
  const db = getDb();

  const citizenRes = await db.execute({
    sql: "SELECT id, current_username FROM civix_citizens WHERE game_profile_id = ?",
    args: [gameProfileId],
  });

  if (citizenRes.rows.length === 0) return false;

  const current = String(citizenRes.rows[0].current_username);
  const citizenId = String(citizenRes.rows[0].id);

  if (current.toLowerCase() !== newInGameUsername.toLowerCase()) {
    // Record rename history
    const historyId = `ren_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    await db.execute({
      sql: "INSERT INTO civix_username_history (id, citizen_id, previous_name, updated_name) VALUES (?, ?, ?, ?)",
      args: [historyId, citizenId, current, newInGameUsername],
    });

    // Update active handle
    await db.execute({
      sql: "UPDATE civix_citizens SET current_username = ?, updated_at = datetime('now') WHERE id = ?",
      args: [newInGameUsername, citizenId],
    });

    return true;
  }

  return false;
}
