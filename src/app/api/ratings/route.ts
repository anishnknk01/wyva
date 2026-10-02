import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// NOTE: this route previously targeted a different, never-migrated
// ratings schema (columns `rated_id`/`rating`/`rating_type`, plus
// `tasks.user_id`/`tasks.wysa_id`) left over from CREATE_RATINGS_SYSTEM.sql
// (explicitly marked "DEAD / DO NOT RUN" in that file). The real `ratings`
// table — created in supabase/migrations/0001_init.sql and already read
// correctly by task-store.ts's attachRatings() — uses `rater_id`,
// `ratee_id`, `stars`, `review`, with a `unique (task_id, rater_id)`
// constraint and no "rating type" column at all (one rating per rater per
// task, full stop). This route is rewritten to match that real schema.
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { taskId, rateeId, stars, review } = body;

    // Validate input
    if (!taskId || !rateeId || !stars) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (stars < 1 || stars > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Verify task exists and has reached the point where either party can
    // leave a review — same gating both Task Details pages already use
    // ("Rate customer" / "Rate {wysa}" only appear once status is
    // payment_released, not merely "completed").
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('id, customer_id, accepted_wysa_id, confirmed_wysa_id, status')
      .eq('id', taskId)
      .single();

    if (taskError || !task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    if (task.status !== 'payment_released') {
      return NextResponse.json(
        { error: 'Can only rate after payment has been released' },
        { status: 400 }
      );
    }

    // Only the two people actually involved in this task can rate each
    // other — the customer who posted it, or the worker who was
    // confirmed/accepted for it. A random third party must be rejected,
    // and the rater must be rating the OTHER party in the task, not
    // themselves and not someone uninvolved.
    const userId = session.user.id;
    const assignedWysaId = task.confirmed_wysa_id || task.accepted_wysa_id;
    const isCustomer = task.customer_id === userId;
    const isAssignedWysa = !!assignedWysaId && assignedWysaId === userId;

    if (!isCustomer && !isAssignedWysa) {
      return NextResponse.json(
        { error: 'Not authorized to rate this task' },
        { status: 403 }
      );
    }

    const expectedRateeId = isCustomer ? assignedWysaId : task.customer_id;
    if (!expectedRateeId || rateeId !== expectedRateeId) {
      return NextResponse.json(
        { error: 'Can only rate the other party on this task' },
        { status: 403 }
      );
    }

    // Insert or update rating — the real table's unique (task_id, rater_id)
    // constraint means a second submission from the same rater for the
    // same task updates their existing review instead of creating a
    // duplicate, which matches "don't allow duplicate reviews" while still
    // allowing an edit if the product ever wants that.
    const { data: ratingRow, error: ratingError } = await supabase
      .from('ratings')
      .upsert({
        task_id: taskId,
        rater_id: userId,
        ratee_id: rateeId,
        stars,
        review: review || '',
      }, {
        onConflict: 'task_id,rater_id',
      })
      .select()
      .single();

    if (ratingError) {
      console.error('Rating error:', ratingError);
      return NextResponse.json(
        { error: 'Failed to save rating' },
        { status: 500 }
      );
    }

    // Notify the rated person — same push-notification mechanism every
    // other task event already uses, not a new system. This call has no
    // browser session to forward (it's server-to-server, same as the
    // /applications route's accept notification), so it authenticates via
    // the internal secret header instead. Best-effort: a failed
    // notification should never fail the rating submission itself.
    try {
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/api/notifications/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-secret': process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
        },
        body: JSON.stringify({
          userId: rateeId,
          title: 'New review received',
          body: `You received a ${stars}-star review.`,
          tag: `task-${taskId}-rating`,
          data: { taskId, type: 'rating', url: `/mobile/tasks/${taskId}` },
        }),
      });
    } catch (notifyError) {
      console.error('Failed to send rating notification:', notifyError);
    }

    return NextResponse.json({
      success: true,
      rating: ratingRow,
    });

  } catch (error) {
    console.error('Rating API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const userId = searchParams.get('userId');
    const taskId = searchParams.get('taskId');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('ratings')
      .select(`
        *,
        rater:profiles!ratings_rater_id_fkey(id, full_name, avatar_url),
        ratee:profiles!ratings_ratee_id_fkey(id, full_name, avatar_url),
        task:tasks(id, title, category)
      `)
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('ratee_id', userId);
    }

    if (taskId) {
      query = query.eq('task_id', taskId);
    }

    query = query.range(offset, offset + limit - 1);

    const { data: ratings, error } = await query;

    if (error) {
      console.error('Get ratings error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch ratings' },
        { status: 500 }
      );
    }

    return NextResponse.json({ ratings });

  } catch (error) {
    console.error('Get ratings API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}