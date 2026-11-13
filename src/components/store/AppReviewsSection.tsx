"use client";

import { useState, useEffect } from "react";
import { Star, ShieldCheck, MessageSquare, ThumbsUp, Plus, X, Sparkles, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface ReviewItem {
  id: string;
  rating: number;
  title: string;
  comment: string;
  isVerified: boolean;
  createdAt: string;
  citizen: {
    username: string;
    tier: string;
    gameProfileId: string;
  };
}

interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  distribution: Record<number, number>;
}

export default function AppReviewsSection({ slug, appName }: { slug: string; appName: string }) {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [stats, setStats] = useState<ReviewStats>({
    totalReviews: 0,
    averageRating: 5.0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  });
  const [loading, setLoading] = useState(true);

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formRating, setFormRating] = useState(5);
  const [formTitle, setFormTitle] = useState("");
  const [formComment, setFormComment] = useState("");

  const loadReviews = () => {
    fetch(`/api/apps/${slug}/reviews`)
      .then((r) => r.json())
      .then((data) => {
        if (data.reviews) {
          setReviews(data.reviews);
          setStats(data.stats);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (slug) {
      loadReviews();
    }
  }, [slug]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formComment.trim()) {
      toast.error("Please provide both a title and review feedback.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/apps/${slug}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: formRating,
          title: formTitle,
          comment: formComment,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit review");
      }

      toast.success("Review posted successfully!", {
        description: "Thank you for supporting community trust in Parlamentum.",
        icon: <Sparkles className="h-4 w-4 text-cyan-400" />,
      });

      setIsModalOpen(false);
      setFormTitle("");
      setFormComment("");
      setFormRating(5);
      loadReviews();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Stats Bar */}
      <div className="rounded-2xl border border-zinc-800 bg-[#0a0f1c] p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              Verified Citizen Reviews
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Authentic feedback and ratings from verified Parlamentum citizens.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 px-4 py-2 text-xs font-bold text-black shadow-md shadow-cyan-500/20 hover:from-cyan-400 hover:to-sky-400 transition-all self-start sm:self-auto"
          >
            <Plus className="h-3.5 w-3.5 stroke-[3]" />
            <span>Write a Review</span>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          {/* Average Rating Big Box */}
          <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-black/40 border border-zinc-800/80 text-center">
            <span className="text-4xl font-black text-white tracking-tight">
              {stats.averageRating.toFixed(1)}
            </span>
            <div className="flex items-center gap-1 my-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${
                    star <= Math.round(stats.averageRating)
                      ? "fill-amber-400 text-amber-400"
                      : "text-zinc-700"
                  }`}
                />
              ))}
            </div>
            <span className="text-[11px] text-zinc-400">
              Based on {stats.totalReviews} verified review{stats.totalReviews !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Rating Breakdown Bars */}
          <div className="md:col-span-2 space-y-2 flex flex-col justify-center">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = stats.distribution[stars] || 0;
              const percent = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
              return (
                <div key={stars} className="flex items-center gap-3 text-xs">
                  <span className="w-8 text-zinc-400 font-mono flex items-center gap-0.5">
                    {stars} <Star className="h-3 w-3 fill-amber-400 text-amber-400 inline" />
                  </span>
                  <div className="flex-1 h-2 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-zinc-500 text-[10px] font-mono">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-12 text-center text-xs text-zinc-500">
            Loading verified reviews...
          </div>
        ) : reviews.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-800 bg-[#0a0f1c]/50 p-8 text-center space-y-3">
            <MessageSquare className="h-8 w-8 text-zinc-600 mx-auto" />
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-zinc-300">No reviews yet for {appName}</h4>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                Be the first citizen to test this application and submit an authentic review.
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Leave First Review</span>
            </button>
          </div>
        ) : (
          reviews.map((r) => (
            <div
              key={r.id}
              className="rounded-2xl border border-zinc-800/80 bg-[#0a0f1c] p-5 space-y-3 hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-900 to-sky-950 border border-cyan-800 text-xs font-bold text-cyan-300">
                    {r.citizen.username[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-white">
                        {r.citizen.username}
                      </span>
                      {r.isVerified && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.2 text-[9px] font-semibold text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" /> Verified Citizen
                        </span>
                      )}
                      <span className="rounded bg-zinc-900 border border-zinc-800 px-1.5 py-0.2 text-[9px] font-mono text-zinc-400">
                        {r.citizen.tier === "tier_3_sovereign"
                          ? "Sovereign"
                          : r.citizen.tier === "tier_2_bank_verified"
                          ? "Bank Verified"
                          : "Citizen"}
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-500">
                      {new Date(r.createdAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-3.5 w-3.5 ${
                        star <= r.rating ? "fill-amber-400 text-amber-400" : "text-zinc-700"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-zinc-100">{r.title}</h4>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{r.comment}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Review Submission Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div
            className="fixed inset-0"
            onClick={() => setIsModalOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-cyan-500/40 bg-[#0a0f1d] shadow-2xl shadow-cyan-950/60 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Review {appName}</h3>
                <p className="text-xs text-zinc-400">Share your experience with the Parlamentum realm</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-white/5 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              {/* Star Rating Picker */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Your Rating</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`h-6 w-6 ${
                          star <= formRating
                            ? "fill-amber-400 text-amber-400"
                            : "text-zinc-700 hover:text-zinc-500"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-mono font-bold text-amber-400 ml-2">
                    {formRating} of 5 Stars
                  </span>
                </div>
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Headline</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g., Best dividend yield and instant settlement"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-3.5 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-cyan-500"
                />
              </div>

              {/* Comment */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Detailed Review</label>
                <textarea
                  required
                  rows={4}
                  value={formComment}
                  onChange={(e) => setFormComment(e.target.value)}
                  placeholder="Share details on performance, UI responsiveness, payout reliability, or game integration..."
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 p-3.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-cyan-500 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 px-5 py-2 text-xs font-bold text-black shadow-md shadow-cyan-500/20 hover:from-cyan-400 hover:to-sky-400 transition-all disabled:opacity-50"
                >
                  {submitting ? "Publishing..." : "Publish Review"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
