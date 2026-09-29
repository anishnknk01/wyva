// Push notification service for Wyva mobile app
import { createClient } from "@/lib/supabase/client";

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

class NotificationService {
  private registration: ServiceWorkerRegistration | null = null;
  private permission: NotificationPermission = 'default';

  async initialize(): Promise<boolean> {
    if (!('serviceWorker' in navigator) || !('Notification' in window)) {
      console.warn('Push notifications not supported');
      return false;
    }

    try {
      // Register service worker
      this.registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', this.registration);

      // Check current permission
      this.permission = Notification.permission;
      
      return true;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return false;
    }
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return 'denied';
    }

    if (this.permission === 'granted') {
      return 'granted';
    }

    if (this.permission === 'denied') {
      return 'denied';
    }

    // Request permission
    const permission = await Notification.requestPermission();
    this.permission = permission;
    
    if (permission === 'granted') {
      await this.subscribeToPush();
    }
    
    return permission;
  }

  async subscribeToPush(): Promise<PushSubscription | null> {
    if (!this.registration || this.permission !== 'granted') {
      return null;
    }

    try {
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
        ) as BufferSource,
      });

      // Save subscription to Supabase — if persistence fails (e.g. the
      // push_subscriptions table doesn't exist yet), the subscription isn't
      // usable server-side, so treat this as a failure rather than
      // reporting success back to the caller.
      const saved = await this.saveSubscription(subscription);
      if (!saved) {
        await subscription.unsubscribe().catch(() => {});
        return null;
      }

      return subscription;
    } catch (error) {
      console.error('Push subscription failed:', error);
      return null;
    }
  }

  async unsubscribe(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      const subscription = await this.registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        // Best-effort — the browser-side unsubscribe already happened, so
        // don't fail the whole operation if the DB row can't be removed
        // (e.g. table doesn't exist), just log it.
        await this.removeSubscription(subscription);
      }
      return true;
    } catch (error) {
      console.error('Unsubscribe failed:', error);
      return false;
    }
  }

  async showNotification(payload: NotificationPayload): Promise<void> {
    if (!this.registration || this.permission !== 'granted') {
      return;
    }

    const options: NotificationOptions = {
      body: payload.body,
      icon: payload.icon || '/wysa-logo.png',
      badge: payload.badge || '/wysa-logo.png',
      tag: payload.tag,
      data: payload.data,
      requireInteraction: true,
    };

    await this.registration.showNotification(payload.title, options);
  }

  // Task-specific notification helpers
  async notifyTaskUpdate(taskId: string, title: string, message: string, type: 'accepted' | 'confirmed' | 'completed' | 'message') {
    const payload: NotificationPayload = {
      title,
      body: message,
      tag: `task-${taskId}-${type}`,
      data: {
        taskId,
        type,
        url: `/mobile/my-tasks/${taskId}`,
      },
      actions: [
        {
          action: 'view',
          title: 'View Task',
        },
        {
          action: 'message',
          title: 'Send Message',
        },
      ],
    };

    await this.showNotification(payload);
  }

  async notifyNewMessage(taskId: string, senderName: string, message: string) {
    const payload: NotificationPayload = {
      title: `Message from ${senderName}`,
      body: message,
      tag: `message-${taskId}`,
      data: {
        taskId,
        type: 'message',
        url: `/mobile/messages/${taskId}`,
      },
      actions: [
        {
          action: 'reply',
          title: 'Reply',
        },
        {
          action: 'view',
          title: 'View Chat',
        },
      ],
    };

    await this.showNotification(payload);
  }

  async notifyPaymentReceived(taskId: string, amount: number) {
    const payload: NotificationPayload = {
      title: 'Payment Received!',
      body: `You've received ₹${amount} for your task completion.`,
      tag: `payment-${taskId}`,
      data: {
        taskId,
        type: 'payment',
        url: `/mobile/my-tasks/${taskId}`,
      },
    };

    await this.showNotification(payload);
  }

  private async saveSubscription(subscription: PushSubscription): Promise<boolean> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return false;

    const { error } = await supabase.from('push_subscriptions').upsert({
      user_id: user.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.getKey('p256dh') ? btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh') as ArrayBuffer))) : null,
      auth: subscription.getKey('auth') ? btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth') as ArrayBuffer))) : null,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Failed to save push subscription:', error);
      return false;
    }
    return true;
  }

  private async removeSubscription(subscription: PushSubscription): Promise<boolean> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return false;

    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', user.id)
      .eq('endpoint', subscription.endpoint);

    if (error) {
      console.error('Failed to remove push subscription:', error);
      return false;
    }
    return true;
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  getPermissionStatus(): NotificationPermission {
    return this.permission;
  }

  isSupported(): boolean {
    return 'serviceWorker' in navigator && 'Notification' in window && 'PushManager' in window;
  }
}

// Singleton instance
export const notificationService = new NotificationService();

// Helper hook for React components
export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const init = async () => {
      const supported = notificationService.isSupported();
      setIsSupported(supported);
      
      if (supported) {
        const initialized = await notificationService.initialize();
        setIsInitialized(initialized);
        setPermission(notificationService.getPermissionStatus());
      }
    };

    init();
  }, []);

  const requestPermission = async () => {
    const newPermission = await notificationService.requestPermission();
    setPermission(newPermission);
    return newPermission;
  };

  /**
   * Requests OS notification permission AND confirms the push subscription
   * was actually persisted server-side. Returns whether push notifications
   * are genuinely usable end-to-end, not just whether the OS granted
   * permission (those are different things — see notificationService.subscribeToPush).
   */
  const enablePushNotifications = async (): Promise<{ enabled: boolean; permission: NotificationPermission }> => {
    const newPermission = await notificationService.requestPermission();
    setPermission(newPermission);

    if (newPermission !== 'granted') {
      return { enabled: false, permission: newPermission };
    }

    // requestPermission() already calls subscribeToPush() internally when
    // permission is granted — check whether a live subscription exists now.
    const existing = notificationService.isSupported()
      ? await navigator.serviceWorker.ready
          .then((reg) => reg.pushManager.getSubscription())
          .catch(() => null)
      : null;

    return { enabled: !!existing, permission: newPermission };
  };

  const unsubscribe = async () => {
    const success = await notificationService.unsubscribe();
    if (success) {
      setPermission('default');
    }
    return success;
  };

  return {
    permission,
    isSupported,
    isInitialized,
    requestPermission,
    enablePushNotifications,
    unsubscribe,
    showNotification: notificationService.showNotification.bind(notificationService),
    notifyTaskUpdate: notificationService.notifyTaskUpdate.bind(notificationService),
    notifyNewMessage: notificationService.notifyNewMessage.bind(notificationService),
    notifyPaymentReceived: notificationService.notifyPaymentReceived.bind(notificationService),
  };
}

// React hook import
import { useState, useEffect } from 'react';