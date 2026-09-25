"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { SectionCard } from "./profile-ui";

type Review = { id: string; stars: number; review: string; created_at: string };

type Props = { data: any };

export function SectionRatings({ data }: Props) {
  const { profile } = data;
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) { setLoading(false); return; }
    fetch(`/api/ratings/${profile.id}`)
      .then(r => r.json())
      .then(d => { setReviews(d.ratings ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [profile?.id]);

  const avg    = profile?.average_rating ?? 0;
  const total  = profile?.total_ratings ?? 0;
  const onTime = profile?.on_time_rate ?? null;
  const cancel = profile?.cancellation_rate ?? null;

  return (
    <SectionCard title="Ratings & Reviews">
      {/* Summary row */}
      <div className="mb-6 flex flex-wrap gap-6 border-b border-gray-100 pb-4">
        <div className="text-center">
          <div className="flex items-center gap-1 text-2xl font-bold text-gray-900">
            <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            {avg > 0 ? avg.toFixed(1) : "—"}
          </div>
          <div className="text-xs text-gray-500">Overall rating</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{profile?.total_tasks_completed ?? 0}</div>
          <div className="text-xs text-gray-500">Tasks completed</div>
        </div>
        {onTime != null && (
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{onTime}%</div>
            <div className="text-xs text-gray-500">On-time rate</div>
          </div>
        )}
        {cancel != null && (
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{cancel}%</div>
            <div className="text-xs text-gray-500">Cancellation rate</div>
          </div>
        )}
      </div>

      {/* Stars breakdown */}
      {total > 0 && (
        <div className="mb-5 space-y-1.5">
          {[5,4,3,2,1].map(star => {
            const count = reviews.filter(r => r.stars === star).length;
            const pct   = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <div key={star} className="flex items-center gap-2 text-xs">
                <span className="w-4 text-right text-gray-600">{star}</span>
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-6 text-gray-400">{count}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Review list */}
      {loading ? (
        <p className="text-sm text-gray-500">Loading reviews…</p>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-gray-500">No reviews yet. Complete tasks to receive ratings.</p>
      ) : (
        <div className="space-y-3">
          {reviews.slice(0, 10).map(r => (
            <div key={r.id} className="rounded-lg border border-gray-100 p-3">
              <div className="mb-1 flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-3.5 w-3.5 ${i < r.stars ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`} />
                ))}
                <span className="ml-auto text-xs text-gray-400">
                  {new Date(r.created_at).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                </span>
              </div>
              {r.review && <p className="text-sm text-gray-700">{r.review}</p>}
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
