import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient as createServerClient } from '@/lib/supabase/server';

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

    // Require either a real logged-in session (browser-originated calls,
    // e.g. from message-store.ts after the user sends a message) or a
    // trusted internal server-to-server call (e.g. the applications route
    // notifying an accepted Wysa). Without this, anyone who found this
    // endpoint could spam an arbitrary `userId` with fabricated notifications.
    const internalSecret = request.headers.get('x-internal-secret');
    const isTrustedInternalCall =
      !!process.env.SUPABASE_SERVICE_ROLE_KEY && internalSecret === process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!isTrustedInternalCall) {
      const sessionClient = await createServerClient();
      const { data: { user: caller } } = await sessionClient.auth.getUser();
      if (!caller) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const { userId, title, body, data, tag } = await request.json();

    if (!userId || !title || !body) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, title, body' },
        { status: 400 }
      );
    }

    // Service-role client: this route looks up another user's subscriptions
    // by id on behalf of internal server/client code (not the target user's
    // own session), so it must bypass RLS deliberately rather than using
    // the anon browser client (which — with no session here — would have
    // auth.uid() = null and silently match zero rows under the
    // "user_id = auth.uid()" policies on these tables).
    const supabase = createAdminClient();

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