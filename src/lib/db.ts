import { createClient, type Client } from "@libsql/client";
import path from "path";

let dbInstance: Client | null = null;

export function getDb(): Client {
  if (dbInstance) return dbInstance;

  const url = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (url && url.startsWith("libsql://")) {
    dbInstance = createClient({
      url,
      authToken,
    });
  } else {
    // Local SQLite fallback in project root
    const localDbPath = path.join(process.cwd(), "civix.db");
    dbInstance = createClient({
      url: `file:${localDbPath.replace(/\\/g, "/")}`,
    });
  }

  return dbInstance;
}

export async function initDb(): Promise<void> {
  const db = getDb();

  await db.execute(`
    CREATE TABLE IF NOT EXISTS civix_citizens (
      id TEXT PRIMARY KEY,
      game_profile_id TEXT UNIQUE NOT NULL,
      current_username TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      email TEXT,
      discord_id TEXT,
      avatar_url TEXT,
      verification_tier TEXT DEFAULT 'tier_1_citizen',
      referral_code TEXT UNIQUE,
      referred_by_id TEXT,
      is_verified INTEGER DEFAULT 1,
      is_admin INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Ensure columns exist for existing databases
  try {
    await db.execute("ALTER TABLE civix_citizens ADD COLUMN verification_tier TEXT DEFAULT 'tier_1_citizen'");
  } catch {}
  try {
    await db.execute("ALTER TABLE civix_citizens ADD COLUMN referral_code TEXT");
  } catch {}
  try {
    await db.execute("ALTER TABLE civix_citizens ADD COLUMN referred_by_id TEXT");
  } catch {}

  await db.execute(`
    CREATE TABLE IF NOT EXISTS civix_referrals (
      id TEXT PRIMARY KEY,
      referrer_id TEXT NOT NULL REFERENCES civix_citizens(id),
      referred_id TEXT NOT NULL REFERENCES civix_citizens(id),
      referral_code TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(referrer_id, referred_id)
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS civix_notifications (
      id TEXT PRIMARY KEY,
      citizen_id TEXT NOT NULL REFERENCES civix_citizens(id),
      app_id TEXT,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'info',
      action_url TEXT,
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS civix_security_logs (
      id TEXT PRIMARY KEY,
      citizen_id TEXT NOT NULL REFERENCES civix_citizens(id),
      event_type TEXT NOT NULL,
      app_id TEXT,
      ip_hint TEXT,
      details TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS civix_username_history (
      id TEXT PRIMARY KEY,
      citizen_id TEXT NOT NULL REFERENCES civix_citizens(id),
      previous_name TEXT NOT NULL,
      updated_name TEXT NOT NULL,
      synced_at TEXT DEFAULT (datetime('now'))
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS civix_apps (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      tagline TEXT NOT NULL,
      description TEXT NOT NULL,
      icon_url TEXT,
      banner_url TEXT,
      category TEXT NOT NULL,
      app_url TEXT NOT NULL,
      client_id TEXT UNIQUE NOT NULL,
      client_secret_hash TEXT NOT NULL,
      redirect_uris TEXT NOT NULL,
      webhook_url TEXT,
      owner_name TEXT NOT NULL,
      active_users_estimate INTEGER DEFAULT 0,
      featured INTEGER DEFAULT 0,
      verified INTEGER DEFAULT 1,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS civix_authorizations (
      id TEXT PRIMARY KEY,
      citizen_id TEXT NOT NULL REFERENCES civix_citizens(id),
      app_id TEXT NOT NULL REFERENCES civix_apps(id),
      scopes TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(citizen_id, app_id)
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS civix_auth_codes (
      code TEXT PRIMARY KEY,
      citizen_id TEXT NOT NULL,
      client_id TEXT NOT NULL,
      redirect_uri TEXT NOT NULL,
      scope TEXT DEFAULT 'identity',
      expires_at INTEGER NOT NULL,
      used INTEGER DEFAULT 0
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS civix_recovery_requests (
      id TEXT PRIMARY KEY,
      citizen_id TEXT NOT NULL,
      code TEXT NOT NULL,
      contract_memo TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      expires_at INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS civix_developer_storage (
      app_id TEXT NOT NULL REFERENCES civix_apps(id),
      citizen_id TEXT NOT NULL REFERENCES civix_citizens(id),
      storage_key TEXT NOT NULL,
      storage_value TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (app_id, citizen_id, storage_key)
    );
  `);

  // Seed default 5 ecosystem apps if not present
  const existingApps = await db.execute("SELECT COUNT(*) as count FROM civix_apps");
  const count = Number(existingApps.rows[0]?.count || 0);

  if (count === 0) {
    const defaultApps = [
      {
        id: "app_gug",
        name: "Grow UR Gold",
        slug: "grow-ur-gold",
        tagline: "The Sovereign Stock & Equity Exchange of Parlamentum",
        description: "Trade equities, earn weekly company dividends, bid on sovereign NFT license auctions, and grow your net worth on the official order-book bourse.",
        category: "finance",
        app_url: "https://growurgold.vercel.app",
        client_id: "civ_client_gug_live",
        client_secret_hash: "secret_gug_preview",
        redirect_uris: JSON.stringify(["https://growurgold.vercel.app/api/auth/callback/civix"]),
        owner_name: "JosephArora",
        active_users_estimate: 320,
        featured: 1,
        verified: 1,
        status: "active",
      },
      {
        id: "app_prediction",
        name: "Prediction Market",
        slug: "prediction-market",
        tagline: "High-Stakes Political, War & Macro Betting",
        description: "Speculate on geopolitical events, election outcomes, and world war casualties with peer-to-peer prediction markets running on Cloudflare Workers.",
        category: "finance",
        app_url: "https://prediction-market.stakkiesstaks.workers.dev",
        client_id: "civ_client_prediction_live",
        client_secret_hash: "secret_pred_preview",
        redirect_uris: JSON.stringify(["https://prediction-market.stakkiesstaks.workers.dev/auth/civix"]),
        owner_name: "Stakkie",
        active_users_estimate: 240,
        featured: 0,
        verified: 0,
        status: "pending",
      },
      {
        id: "app_colosseo",
        name: "Colosseo",
        slug: "colosseo",
        tagline: "Gladiator PVP Arena, Tournaments & Live Spectator Bets",
        description: "Step into the blood-soaked sand. Challenge rival citizens to rated 1v1 duels, enter weekly grand tournaments, or wager gold in the spectator stands.",
        category: "gaming",
        app_url: "https://colosseo-tau.vercel.app",
        client_id: "civ_client_colosseo_live",
        client_secret_hash: "secret_colosseo_preview",
        redirect_uris: JSON.stringify(["https://colosseo-tau.vercel.app/api/auth/civix"]),
        owner_name: "GladiatorGuild",
        active_users_estimate: 185,
        featured: 0,
        verified: 0,
        status: "pending",
      },
      {
        id: "app_casino",
        name: "The Back Room Casino",
        slug: "the-back-room",
        tagline: "A High-Roller Underground Parlamentum Casino",
        description: "Roulette, Blackjack, Coin Flips, and Provably Fair Dice. Pull up a chair in the smoke-filled back parlor and test your luck against the house.",
        category: "casino",
        app_url: "https://back-room-casino.vercel.app",
        client_id: "civ_client_backroom_live",
        client_secret_hash: "secret_casino_preview",
        redirect_uris: JSON.stringify(["https://back-room-casino.vercel.app/auth/civix"]),
        owner_name: "Syndicate",
        active_users_estimate: 210,
        featured: 0,
        verified: 0,
        status: "pending",
      },
      {
        id: "app_bank_europe",
        name: "Bank of Europe",
        slug: "bank-of-europe",
        tagline: "Official Sovereign Banking, Term Deposits & Fractional Lending",
        description: "The primary banking & liquidity institution of the realm. Earn passive yield on gold reserves, issue sovereign debt bonds, and access institutional credit backed by Milanese vaults.",
        category: "finance",
        app_url: "https://bankofmilan.pages.dev",
        client_id: "civ_client_bankeurope_live",
        client_secret_hash: "secret_bank_preview",
        redirect_uris: JSON.stringify(["https://bankofmilan.pages.dev/civix/callback"]),
        owner_name: "BankerMilan",
        active_users_estimate: 280,
        featured: 0,
        verified: 0,
        status: "pending",
      },
    ];

    for (const app of defaultApps) {
      await db.execute({
        sql: `INSERT INTO civix_apps (
          id, name, slug, tagline, description, category, app_url, client_id, 
          client_secret_hash, redirect_uris, owner_name, active_users_estimate, featured, verified, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          app.id,
          app.name,
          app.slug,
          app.tagline,
          app.description,
          app.category,
          app.app_url,
          app.client_id,
          app.client_secret_hash,
          app.redirect_uris,
          app.owner_name,
          app.active_users_estimate,
          app.featured,
          app.verified,
          app.status,
        ],
      });
    }
  }
}
