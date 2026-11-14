import crypto from "crypto";

/**
 * Shared security helpers. Server-only.
 */

function requireSecret(name: string, value: string | undefined): Uint8Array {
  if (!value || value.length < 32) {
    throw new Error(
      `${name} is missing or shorter than 32 characters. Set it in your environment variables before starting Civix.`
    );
  }
  return new TextEncoder().encode(value);
}

/** Secret used to sign Civix login session cookies. No hardcoded fallback. */
export function getSessionSecret(): Uint8Array {
  return requireSecret("CIVIX_JWT_SECRET", process.env.CIVIX_JWT_SECRET);
}

/**
 * Secret used to sign OAuth access tokens handed to partner apps.
 * Uses CIVIX_OAUTH_JWT_SECRET if set, otherwise CIVIX_JWT_SECRET.
 */
export function getOAuthSecret(): Uint8Array {
  const value = process.env.CIVIX_OAUTH_JWT_SECRET || process.env.CIVIX_JWT_SECRET;
  return requireSecret("CIVIX_OAUTH_JWT_SECRET / CIVIX_JWT_SECRET", value);
}

/** Cryptographically secure random string (URL-safe). */
export function randomToken(bytes = 24): string {
  return crypto.randomBytes(bytes).toString("base64url");
}

/** Cryptographically secure 6-digit code. */
export function randomDigits(length = 6): string {
  let out = "";
  for (let i = 0; i < length; i++) out += crypto.randomInt(0, 10).toString();
  return out;
}

/** Constant-time string comparison. */
export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

const HASH_PREFIX = "sha256:";

/** Hash an OAuth client secret for storage. */
export function hashClientSecret(secret: string): string {
  return HASH_PREFIX + crypto.createHash("sha256").update(secret).digest("hex");
}

/**
 * Check a client secret against the stored value.
 * Supports old plain-text rows so existing partner apps keep working;
 * `needsUpgrade` tells the caller to re-save it hashed.
 */
export function checkClientSecret(provided: string, stored: string): { ok: boolean; needsUpgrade: boolean } {
  if (!provided || !stored) return { ok: false, needsUpgrade: false };
  if (stored.startsWith(HASH_PREFIX)) {
    return { ok: safeEqual(hashClientSecret(provided), stored), needsUpgrade: false };
  }
  const ok = safeEqual(provided, stored);
  return { ok, needsUpgrade: ok };
}

/** Parse an app's registered redirect URIs. */
export function parseRedirectUris(raw: unknown): string[] {
  try {
    const list = JSON.parse(String(raw || "[]"));
    return Array.isArray(list) ? list.map(String) : [];
  } catch {
    return [];
  }
}

/** Exact-match check of a redirect URI against the app's registered list. */
export function isAllowedRedirect(redirectUri: string, registered: string[]): boolean {
  return registered.some((r) => r === redirectUri);
}

/** 30 days, matching the session JWT lifetime. */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
