import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// NOTE: there is no stored/cached "average_rating" column anywhere in the
// real schema (profiles.average_rating only ever existed in the dead
// CREATE_RATINGS_SYSTEM.sql file, never migrated). Rather than adding a
// new aggregate column + trigger (a second rating system), this computes
// the average directly from the real `ratings` table every time — the
// same source of truth task-store.ts's attachRatings() already reads
// from, just aggregated across all of a user's received ratings instead
// of one task's.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const supabase = await createClient();
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // All ratings this user has received, newest first — used both for
    // the "recent reviews" list and to compute the average/distribution.
    const { data: ratings, error: ratingsError } = await supabase
      .from('ratings')
      .select(`
        *,
        rater:profiles!ratings_rater_id_fkey(id, full_name, avatar_url),
        task:tasks(id, title, category)
      `)
      .eq('ratee_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (ratingsError) {
      console.error('Get user ratings error:', ratingsError);
      return NextResponse.json(
        { error: 'Failed to fetch user ratings' },
        { status: 500 }
      );
    }

    const allRatings = ratings || [];
    const totalRatings = allRatings.length;
    const averageRating = totalRatings > 0
      ? allRatings.reduce((sum, r) => sum + r.stars, 0) / totalRatings
      : 0;

    // How many of this user's own tasks (as customer) have been paid out,
    // and how many tasks they've completed as the assigned worker — real
    // counts from the tasks table, not a cached/stale column.
    const [{ count: tasksPosted }, { count: tasksCompletedAsWorker }] = await Promise.all([
      supabase
        .from('tasks')
        .select('id', { count: 'exact', head: true })
        .eq('customer_id', userId)
        .in('status', ['completed', 'payment_released']),
      supabase
        .from('tasks')
        .select('id', { count: 'exact', head: true })
        .or(`accepted_wysa_id.eq.${userId},confirmed_wysa_id.eq.${userId}`)
        .in('status', ['completed', 'payment_released']),
    ]);

    const ratingDistribution = [1, 2, 3, 4, 5].map(star => {
      const count = allRatings.filter(r => r.stars === star).length;
      return {
        star,
        count,
        percentage: totalRatings ? Math.round((count / totalRatings) * 100) : 0,
      };
    });

    let ratingBadge = 'New';
    if (totalRatings > 0) {
      if (averageRating >= 4.5) ratingBadge = 'Excellent';
      else if (averageRating >= 4.0) ratingBadge = 'Very Good';
      else if (averageRating >= 3.5) ratingBadge = 'Good';
      else if (averageRating >= 3.0) ratingBadge = 'Average';
      else ratingBadge = 'Below Average';
    }

    return NextResponse.json({
      profile: {
        ...profile,
        average_rating: averageRating,
        total_ratings: totalRatings,
        total_tasks_completed: tasksCompletedAsWorker ?? 0,
        total_tasks_posted: tasksPosted ?? 0,
        ratingBadge,
      },
      ratings: allRatings,
      ratingDistribution,
    });

  } catch (error) {
    console.error('Get user ratings API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}