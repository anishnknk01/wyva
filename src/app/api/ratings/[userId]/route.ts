import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';
import type { Database } from '@/lib/supabase/database.types';

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

    // Get user rating summary
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, average_rating, total_ratings, total_tasks_completed, total_tasks_posted')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get recent ratings
    const { data: ratings, error: ratingsError } = await supabase
      .from('ratings')
      .select(`
        *,
        rater:profiles!ratings_rater_id_fkey(id, full_name, avatar_url),
        task:tasks(id, title, category)
      `)
      .eq('rated_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (ratingsError) {
      console.error('Get user ratings error:', ratingsError);
      return NextResponse.json(
        { error: 'Failed to fetch user ratings' },
        { status: 500 }
      );
    }

    // Calculate rating distribution
    const ratingDistribution = [1, 2, 3, 4, 5].map(star => {
      const count = ratings?.filter(r => r.rating === star).length || 0;
      return {
        star,
        count,
        percentage: ratings?.length ? Math.round((count / ratings.length) * 100) : 0
      };
    });

    // Calculate rating badge
    const averageRating = profile.average_rating || 0;
    let ratingBadge = 'New';
    if (profile.total_ratings > 0) {
      if (averageRating >= 4.5) ratingBadge = 'Excellent';
      else if (averageRating >= 4.0) ratingBadge = 'Very Good';
      else if (averageRating >= 3.5) ratingBadge = 'Good';
      else if (averageRating >= 3.0) ratingBadge = 'Average';
      else ratingBadge = 'Below Average';
    }

    return NextResponse.json({
      profile: {
        ...profile,
        ratingBadge
      },
      ratings: ratings || [],
      ratingDistribution
    });

  } catch (error) {
    console.error('Get user ratings API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}