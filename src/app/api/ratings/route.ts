import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';
import type { Database } from '@/lib/supabase/database.types';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { taskId, ratedId, rating, review, ratingType } = body;

    // Validate input
    if (!taskId || !ratedId || !rating || !ratingType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    if (!['task_completion', 'task_posting'].includes(ratingType)) {
      return NextResponse.json(
        { error: 'Invalid rating type' },
        { status: 400 }
      );
    }

    // Verify task exists and is completed
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('id, user_id, wysa_id, status')
      .eq('id', taskId)
      .single();

    if (taskError || !task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    if (task.status !== 'completed') {
      return NextResponse.json(
        { error: 'Can only rate completed tasks' },
        { status: 400 }
      );
    }

    // Verify user is authorized to rate this task
    const userId = session.user.id;
    const canRate = (
      (ratingType === 'task_completion' && task.user_id === userId) ||
      (ratingType === 'task_posting' && task.wysa_id === userId)
    );

    if (!canRate) {
      return NextResponse.json(
        { error: 'Not authorized to rate this task' },
        { status: 403 }
      );
    }

    // Insert or update rating
    const { data: rating_data, error: ratingError } = await supabase
      .from('ratings')
      .upsert({
        task_id: taskId,
        rater_id: userId,
        rated_id: ratedId,
        rating: rating,
        review: review || null,
        rating_type: ratingType,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'task_id,rater_id,rating_type'
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

    return NextResponse.json({ 
      success: true, 
      rating: rating_data 
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
        rated:profiles!ratings_rated_id_fkey(id, full_name, avatar_url),
        task:tasks(id, title, category)
      `)
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('rated_id', userId);
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