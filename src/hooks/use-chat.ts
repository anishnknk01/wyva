import { useState, useEffect, useCallback } from 'react';
import { 
  getTaskMessages, 
  getUserConversations, 
  sendMessage, 
  markMessagesAsRead,
  subscribeToMessages,
  getUnreadMessageCount,
  type Message, 
  type Conversation 
} from '@/lib/message-store';
import { useErrorHandler } from './use-error-handler';

export function useChat(taskId?: string, otherUserId?: string) {
  const { handleAsyncError } = useErrorHandler();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const loadMessages = useCallback(async () => {
    if (!taskId || !otherUserId) return;
    
    await handleAsyncError(async () => {
      const chatMessages = await getTaskMessages(taskId, otherUserId);
      setMessages(chatMessages);
      await markMessagesAsRead(taskId, otherUserId);
    }, {
      title: 'Failed to load messages',
      description: 'Please try again'
    });
    setLoading(false);
  }, [taskId, otherUserId, handleAsyncError]);

  const sendChatMessage = useCallback(async (messageText: string) => {
    if (!taskId || !otherUserId || !messageText.trim() || sending) return;

    setSending(true);
    await handleAsyncError(async () => {
      const sentMessage = await sendMessage(taskId, otherUserId, messageText);
      if (!sentMessage) {
        throw new Error('Failed to send message');
      }
    }, {
      title: 'Failed to send message',
      description: 'Please try again'
    });
    setSending(false);
  }, [taskId, otherUserId, sending, handleAsyncError]);

  useEffect(() => {
    if (taskId && otherUserId) {
      loadMessages();
    }
  }, [loadMessages, taskId, otherUserId]);

  useEffect(() => {
    if (!taskId) return;

    const subscription = subscribeToMessages(taskId, (newMessage) => {
      setMessages(prev => [...prev, newMessage]);
      if (newMessage.sender_id === otherUserId) {
        markMessagesAsRead(taskId, otherUserId);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [taskId, otherUserId]);

  return {
    messages,
    loading,
    sending,
    sendMessage: sendChatMessage,
    refreshMessages: loadMessages,
  };
}

export function useConversations() {
  const { handleAsyncError } = useErrorHandler();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadConversations = useCallback(async () => {
    await handleAsyncError(async () => {
      const userConversations = await getUserConversations();
      setConversations(userConversations);
      
      const totalUnread = await getUnreadMessageCount();
      setUnreadCount(totalUnread);
    }, {
      title: 'Failed to load conversations',
      description: 'Please try again'
    });
    setLoading(false);
  }, [handleAsyncError]);

  useEffect(() => {
    loadConversations();

    // Refresh conversations every 30 seconds — but only while the tab is
    // actually visible, so backgrounded tabs don't keep polling the DB
    // indefinitely, and refresh immediately when the tab becomes visible
    // again rather than waiting for the next tick.
    let interval: ReturnType<typeof setInterval> | null = null;

    const startPolling = () => {
      if (interval) return;
      interval = setInterval(loadConversations, 30000);
    };
    const stopPolling = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadConversations();
        startPolling();
      } else {
        stopPolling();
      }
    };

    if (document.visibilityState === 'visible') startPolling();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadConversations]);

  return {
    conversations,
    loading,
    unreadCount,
    refreshConversations: loadConversations,
  };
}

export function useUnreadMessages() {
  const [unreadCount, setUnreadCount] = useState(0);

  const updateUnreadCount = useCallback(async () => {
    try {
      const count = await getUnreadMessageCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to update unread count:', error);
    }
  }, []);

  useEffect(() => {
    updateUnreadCount();

    // This hook is mounted persistently in the worker sidebar (present on
    // every worker page), so pause the poll while the tab is hidden instead
    // of hitting the DB every minute regardless of whether anyone's looking.
    let interval: ReturnType<typeof setInterval> | null = null;

    const startPolling = () => {
      if (interval) return;
      interval = setInterval(updateUnreadCount, 60000);
    };
    const stopPolling = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateUnreadCount();
        startPolling();
      } else {
        stopPolling();
      }
    };

    if (document.visibilityState === 'visible') startPolling();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [updateUnreadCount]);

  return {
    unreadCount,
    refreshUnreadCount: updateUnreadCount,
  };
}