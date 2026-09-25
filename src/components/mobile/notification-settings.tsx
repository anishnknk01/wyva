"use client";

import { useState, useEffect } from 'react';
import { 
  Bell, 
  BellOff, 
  MessageSquare, 
  CreditCard,
  Clock,
  Mail,
  Smartphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useNotifications } from '@/lib/notifications';
import { createClient } from '@/lib/supabase/client';
import { useErrorHandler } from '@/hooks/use-error-handler';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { toast } from 'sonner';

interface NotificationPreferences {
  task_updates: boolean;
  new_messages: boolean;
  payment_notifications: boolean;
  marketing_notifications: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
}

export function NotificationSettings() {
  const { handleAsyncError } = useErrorHandler();
  const {
    permission,
    isSupported,
    isInitialized,
    requestPermission,
    unsubscribe,
  } = useNotifications();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    task_updates: true,
    new_messages: true,
    payment_notifications: true,
    marketing_notifications: false,
    email_notifications: true,
    push_notifications: true,
    quiet_hours_start: null,
    quiet_hours_end: null,
  });

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    await handleAsyncError(async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('Not authenticated');

      // Get user preferences
      let { data: prefs, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code === 'PGRST116') {
        // No preferences found, create default ones
        const { data: newPrefs, error: createError } = await supabase
          .from('notification_preferences')
          .insert({
            user_id: user.id,
            task_updates: true,
            new_messages: true,
            payment_notifications: true,
            marketing_notifications: false,
            email_notifications: true,
            push_notifications: true,
          })
          .select()
          .single();

        if (createError) throw createError;
        prefs = newPrefs;
      } else if (error) {
        throw error;
      }

      if (prefs) {
        setPreferences({
          task_updates: prefs.task_updates,
          new_messages: prefs.new_messages,
          payment_notifications: prefs.payment_notifications,
          marketing_notifications: prefs.marketing_notifications,
          email_notifications: prefs.email_notifications,
          push_notifications: prefs.push_notifications,
          quiet_hours_start: prefs.quiet_hours_start,
          quiet_hours_end: prefs.quiet_hours_end,
        });
      }
    }, {
      title: 'Failed to load preferences',
      description: 'Please try refreshing the page'
    });
    setLoading(false);
  };

  const savePreferences = async (newPreferences: Partial<NotificationPreferences>) => {
    setSaving(true);
    await handleAsyncError(async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('notification_preferences')
        .update(newPreferences)
        .eq('user_id', user.id);

      if (error) throw error;

      setPreferences(prev => ({ ...prev, ...newPreferences }));
      toast.success('Notification preferences updated');
    }, {
      title: 'Failed to save preferences',
      description: 'Please try again'
    });
    setSaving(false);
  };

  const handleToggle = (key: keyof NotificationPreferences, value: boolean) => {
    savePreferences({ [key]: value });
  };

  const handlePushPermission = async () => {
    if (permission === 'granted') {
      // Disable push notifications
      await unsubscribe();
      await savePreferences({ push_notifications: false });
      toast.success('Push notifications disabled');
    } else {
      // Request permission and enable
      const newPermission = await requestPermission();
      if (newPermission === 'granted') {
        await savePreferences({ push_notifications: true });
        toast.success('Push notifications enabled');
      } else {
        toast.error('Push notification permission denied');
      }
    }
  };

  const getPermissionBadge = () => {
    switch (permission) {
      case 'granted':
        return <Badge className="bg-green-100 text-green-700">Enabled</Badge>;
      case 'denied':
        return <Badge className="bg-red-100 text-red-700">Blocked</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-700">Not Set</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Push Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Smartphone className="w-5 h-5 mr-2" />
            Push Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="font-medium">Browser Notifications</p>
              <p className="text-sm text-gray-600">
                {isSupported 
                  ? 'Get instant notifications on your device'
                  : 'Not supported in your browser'
                }
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {getPermissionBadge()}
              {isSupported && (
                <Button
                  onClick={handlePushPermission}
                  variant={permission === 'granted' ? 'destructive' : 'default'}
                  size="sm"
                  disabled={!isInitialized}
                >
                  {permission === 'granted' ? (
                    <>
                      <BellOff className="w-4 h-4 mr-1" />
                      Disable
                    </>
                  ) : (
                    <>
                      <Bell className="w-4 h-4 mr-1" />
                      Enable
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {!isSupported && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                Your browser doesn't support push notifications. Try using Chrome, Firefox, or Safari on mobile.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Types */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Bell className="w-5 h-5 mr-2" />
            Notification Types
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-full">
                <Clock className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">Task Updates</p>
                <p className="text-sm text-gray-600">
                  Task accepted, confirmed, completed
                </p>
              </div>
            </div>
            <Switch
              checked={preferences.task_updates}
              onCheckedChange={(checked) => handleToggle('task_updates', checked)}
              disabled={saving}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 p-2 rounded-full">
                <MessageSquare className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium">New Messages</p>
                <p className="text-sm text-gray-600">
                  Chat messages from users and Wysas
                </p>
              </div>
            </div>
            <Switch
              checked={preferences.new_messages}
              onCheckedChange={(checked) => handleToggle('new_messages', checked)}
              disabled={saving}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-purple-100 p-2 rounded-full">
                <CreditCard className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="font-medium">Payment Notifications</p>
                <p className="text-sm text-gray-600">
                  Payment received, released, refunded
                </p>
              </div>
            </div>
            <Switch
              checked={preferences.payment_notifications}
              onCheckedChange={(checked) => handleToggle('payment_notifications', checked)}
              disabled={saving}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gray-100 p-2 rounded-full">
                <Mail className="w-4 h-4 text-gray-600" />
              </div>
              <div>
                <p className="font-medium">Marketing</p>
                <p className="text-sm text-gray-600">
                  Promotions, tips, and app updates
                </p>
              </div>
            </div>
            <Switch
              checked={preferences.marketing_notifications}
              onCheckedChange={(checked) => handleToggle('marketing_notifications', checked)}
              disabled={saving}
            />
          </div>
        </CardContent>
      </Card>

      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Mail className="w-5 h-5 mr-2" />
            Email Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Email Notifications</p>
              <p className="text-sm text-gray-600">
                Receive important updates via email
              </p>
            </div>
            <Switch
              checked={preferences.email_notifications}
              onCheckedChange={(checked) => handleToggle('email_notifications', checked)}
              disabled={saving}
            />
          </div>
        </CardContent>
      </Card>

      {saving && (
        <div className="flex items-center justify-center py-4">
          <LoadingSpinner size="sm" className="mr-2" />
          <span className="text-sm text-gray-600">Saving preferences...</span>
        </div>
      )}
    </div>
  );
}