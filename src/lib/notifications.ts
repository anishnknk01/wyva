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

      // Save subscription to Supabase
      await this.saveSubscription(subscription);
      
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

  private async saveSubscription(subscription: PushSubscription): Promise<void> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return;

    await supabase.from('push_subscriptions').upsert({
      user_id: user.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.getKey('p256dh') ? btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh') as ArrayBuffer))) : null,
      auth: subscription.getKey('auth') ? btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth') as ArrayBuffer))) : null,
      created_at: new Date().toISOString(),
    });
  }

  private async removeSubscription(subscription: PushSubscription): Promise<void> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return;

    await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', user.id)
      .eq('endpoint', subscription.endpoint);
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
    unsubscribe,
    showNotification: notificationService.showNotification.bind(notificationService),
    notifyTaskUpdate: notificationService.notifyTaskUpdate.bind(notificationService),
    notifyNewMessage: notificationService.notifyNewMessage.bind(notificationService),
    notifyPaymentReceived: notificationService.notifyPaymentReceived.bind(notificationService),
  };
}

// React hook import
import { useState, useEffect } from 'react';