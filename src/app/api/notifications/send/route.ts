import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { createClient } from '@/lib/supabase/client';

// Configure web-push
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidEmail = process.env.VAPID_EMAIL || 'admin@wysa.com';

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    'mailto:' + vapidEmail,
    vapidPublicKey,
    vapidPrivateKey
  );
}

export async function POST(request: NextRequest) {
  try {
    // Check if VAPID keys are configured
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
      return NextResponse.json(
        { error: 'Push notifications not configured' },
        { status: 503 }
      );
    }

    const { userId, title, body, data, tag } = await request.json();

    if (!userId || !title || !body) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, title, body' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Get user's push subscriptions
    const { data: subscriptions, error: subsError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId);

    if (subsError) {
      console.error('Error fetching subscriptions:', subsError);
      return NextResponse.json(
        { error: 'Failed to fetch subscriptions' },
        { status: 500 }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json(
        { message: 'No active subscriptions found for user' },
        { status: 200 }
      );
    }

    // Check user's notification preferences
    const { data: preferences } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (preferences && !preferences.push_notifications) {
      return NextResponse.json(
        { message: 'User has disabled push notifications' },
        { status: 200 }
      );
    }

    // Check quiet hours if set
    if (preferences?.quiet_hours_start && preferences?.quiet_hours_end) {
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
      
      const isQuietTime = (
        currentTime >= preferences.quiet_hours_start &&
        currentTime <= preferences.quiet_hours_end
      );

      if (isQuietTime) {
        console.log('Notification skipped due to quiet hours');
        return NextResponse.json(
          { message: 'Notification skipped due to quiet hours' },
          { status: 200 }
        );
      }
    }

    const payload = JSON.stringify({
      title,
      body,
      icon: '/wysa-logo.png',
      badge: '/wysa-logo.png',
      tag: tag || 'default',
      data: data || {},
      actions: [
        {
          action: 'view',
          title: 'View',
        },
      ],
    });

    // Send notifications to all user's devices
    const results = await Promise.allSettled(
      subscriptions.map(async (subscription: any) => {
        try {
          const pushSubscription = {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh || '',
              auth: subscription.auth || '',
            },
          };

          await webpush.sendNotification(pushSubscription, payload);

          // Update last_used_at
          await supabase
            .from('push_subscriptions')
            .update({ last_used_at: new Date().toISOString() })
            .eq('id', subscription.id);

          return { success: true, subscriptionId: subscription.id };
        } catch (error: any) {
          console.error('Push notification failed:', error);

          // Handle invalid subscriptions
          if (error.statusCode === 410 || error.statusCode === 404) {
            // Remove invalid subscription
            await supabase
              .from('push_subscriptions')
              .delete()
              .eq('id', subscription.id);
            
            console.log('Removed invalid subscription:', subscription.id);
          }

          return { success: false, error: error.message, subscriptionId: subscription.id };
        }
      })
    );

    const successful = results.filter((result: any) => 
      result.status === 'fulfilled' && result.value.success
    ).length;

    const failed = results.length - successful;

    return NextResponse.json({
      message: `Notifications sent successfully`,
      successful,
      failed,
      total: results.length,
    });

  } catch (error) {
    console.error('Send notification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}