import { NextResponse, connection } from "next/server";
import { getDb, initDb } from "@/lib/db";
import { getCurrentCitizen } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  await connection();
  try {
    await initDb();
    const db = getDb();
    const { slug } = await params;

    const appRes = await db.execute({
      sql: "SELECT id, name FROM civix_apps WHERE slug = ? OR id = ?",
      args: [slug, slug],
    });

    if (appRes.rows.length === 0) {
      return NextResponse.json({ error: "App not found" }, { status: 404 });
    }

    const appId = String(appRes.rows[0].id);

    const reviewsRes = await db.execute({
      sql: `
        SELECT 
          r.id,
          r.rating,
          r.title,
          r.comment,
          r.is_verified,
          r.created_at,
          c.current_username,
          c.verification_tier,
          c.game_profile_id
        FROM civix_reviews r
        JOIN civix_citizens c ON r.citizen_id = c.id
        WHERE r.app_id = ?
        ORDER BY r.created_at DESC
      `,
      args: [appId],
    });

    const reviews = reviewsRes.rows.map((r) => ({
      id: String(r.id),
      rating: Number(r.rating),
      title: String(r.title),
      comment: String(r.comment),
      isVerified: Boolean(r.is_verified),
      createdAt: String(r.created_at),
      citizen: {
        username: String(r.current_username),
        tier: String(r.verification_tier || "tier_1_citizen"),
        gameProfileId: String(r.game_profile_id),
      },
    }));

    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
      ? Number((reviews.reduce((acc, cur) => acc + cur.rating, 0) / totalReviews).toFixed(1))
      : 5.0;

    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((r) => {
      if (distribution[r.rating] !== undefined) {
        distribution[r.rating] += 1;
      }
    });

    return NextResponse.json({
      reviews,
      stats: {
        totalReviews,
        averageRating,
        distribution,
      },
    });
  } catch (err: any) {
    console.error("Reviews GET error:", err);
    return NextResponse.json({ error: err.message || "Failed to load reviews" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  await connection();
  try {
    await initDb();
    const db = getDb();
    const { slug } = await params;

    const citizen = await getCurrentCitizen();
    if (!citizen) {
      return NextResponse.json({ error: "Unauthorized. Please sign into CIVIX to write a review." }, { status: 401 });
    }

    const appRes = await db.execute({
      sql: "SELECT id, name FROM civix_apps WHERE slug = ? OR id = ?",
      args: [slug, slug],
    });

    if (appRes.rows.length === 0) {
      return NextResponse.json({ error: "App not found" }, { status: 404 });
    }

    const appId = String(appRes.rows[0].id);
    const body = await req.json();
    const rating = Math.min(5, Math.max(1, parseInt(body.rating, 10) || 5));
    const title = String(body.title || "").trim();
    const comment = String(body.comment || "").trim();

    if (!title || !comment) {
      return NextResponse.json({ error: "Title and review comment are required." }, { status: 400 });
    }

    // Check if citizen has authorized this app for verified badge
    const authzRes = await db.execute({
      sql: "SELECT id FROM civix_authorizations WHERE citizen_id = ? AND app_id = ?",
      args: [citizen.id, appId],
    });
    const isVerified = authzRes.rows.length > 0 ? 1 : 0;

    const reviewId = `rev_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;

    await db.execute({
      sql: `
        INSERT INTO civix_reviews (id, app_id, citizen_id, rating, title, comment, is_verified, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        ON CONFLICT(app_id, citizen_id) DO UPDATE SET
          rating = excluded.rating,
          title = excluded.title,
          comment = excluded.comment,
          is_verified = excluded.is_verified,
          updated_at = datetime('now')
      `,
      args: [reviewId, appId, citizen.id, rating, title, comment, isVerified],
    });

    return NextResponse.json({
      success: true,
      message: "Review submitted successfully.",
    });
  } catch (err: any) {
    console.error("Reviews POST error:", err);
    return NextResponse.json({ error: err.message || "Failed to submit review" }, { status: 500 });
  }
}
