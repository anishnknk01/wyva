import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";

export type Message = Database["public"]["Tables"]["messages"]["Row"];
export type MessageInsert = Database["public"]["Tables"]["messages"]["Insert"];

export type Conversation = {
  conversation_id: string;
  task_id: string;
  other_user_id: string;
  other_user_name: string;
  other_user_avatar: string | null;
  task_title: string;
  task_status: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
};

// Send a message
export async function sendMessage(
  taskId: string,
  receiverId: string,
  messageText: string,
  messageType: string = 'text',
  imageUrl?: string
): Promise<Message | null> {
  const supabase = createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    console.error("sendMessage failed - not authenticated", authError);
    return null;
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({
      task_id: taskId,
      sender_id: user.id,
      receiver_id: receiverId,
      message_text: messageText,
      message_type: messageType,
      image_url: imageUrl,
    })
    .select()
    .single();

  if (error) {
    console.error("sendMessage failed", error);
    return null;
  }

  // Send push notification for new message
  if (data && messageType === 'text') {
    try {
      // Get sender profile for notification
      const { data: senderProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      const senderName = senderProfile?.full_name || 'Someone';

      // Send push notification
      await fetch('/api/notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: receiverId,
          title: `Message from ${senderName}`,
          body: messageText.length > 100 ? messageText.substring(0, 97) + '...' : messageText,
          tag: `message-${taskId}`,
          data: {
            taskId,
            type: 'message',
            senderId: user.id,
            url: `/mobile/messages/${taskId}?user=${user.id}`,
          },
        }),
      });
    } catch (error) {
      console.error('Failed to send push notification:', error);
      // Don't fail the message send if push notification fails
    }
  }

  return data;
}

// Get messages for a specific task between two users
export async function getTaskMessages(taskId: string, otherUserId: string): Promise<Message[]> {
  const supabase = createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    console.error("getTaskMessages failed - not authenticated", authError);
    return [];
  }

  const { data, error } = await supabase
    .from("messages")
    .select(`
      *,
      sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url),
      receiver:profiles!messages_receiver_id_fkey(id, full_name, avatar_url)
    `)
    .eq("task_id", taskId)
    .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("getTaskMessages failed", error);
    return [];
  }

  return data || [];
}

// Get all conversations for the current user
export async function getUserConversations(): Promise<Conversation[]> {
  const supabase = createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    console.error("getUserConversations failed - not authenticated", authError);
    return [];
  }

  // Get all unique conversations for this user
  const { data, error } = await supabase
    .rpc('get_user_conversations', { user_id: user.id });

  if (error) {
    // RPC not yet created — fallback query handles this silently
    return await getUserConversationsFallback();
  }

  return data || [];
}

// Fallback method for getting conversations
async function getUserConversationsFallback(): Promise<Conversation[]> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: messages, error } = await supabase
    .from("messages")
    .select(`
      task_id,
      sender_id,
      receiver_id,
      message_text,
      created_at,
      task:tasks(id, title, status),
      sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url),
      receiver:profiles!messages_receiver_id_fkey(id, full_name, avatar_url)
    `)
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getUserConversationsFallback failed", error);
    return [];
  }

  if (!messages) return [];

  // Group by task and other user
  const conversationMap = new Map<string, Conversation>();

  for (const message of messages) {
    const otherUserId = message.sender_id === user.id ? message.receiver_id : message.sender_id;
    const otherUser = message.sender_id === user.id ? message.receiver : message.sender;
    const conversationKey = `${message.task_id}_${otherUserId}`;

    if (!conversationMap.has(conversationKey)) {
      conversationMap.set(conversationKey, {
        conversation_id: conversationKey,
        task_id: message.task_id,
        other_user_id: otherUserId,
        other_user_name: (otherUser as any)?.full_name || 'Unknown User',
        other_user_avatar: (otherUser as any)?.avatar_url || null,
        task_title: (message.task as any)?.title || 'Task',
        task_status: (message.task as any)?.status || 'active',
        last_message: message.message_text,
        last_message_at: message.created_at,
        unread_count: 0, // We'll calculate this separately if needed
      });
    }
  }

  return Array.from(conversationMap.values())
    .sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());
}

// Mark messages as read
export async function markMessagesAsRead(taskId: string, senderId: string): Promise<boolean> {
  const supabase = createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    console.error("markMessagesAsRead failed - not authenticated", authError);
    return false;
  }

  const { error } = await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("task_id", taskId)
    .eq("sender_id", senderId)
    .eq("receiver_id", user.id)
    .is("read_at", null);

  if (error) {
    console.error("markMessagesAsRead failed", error);
    return false;
  }

  return true;
}

// Get unread message count for a user
export async function getUnreadMessageCount(): Promise<number> {
  const supabase = createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return 0;
  }

  const { count, error } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("receiver_id", user.id)
    .is("read_at", null);

  if (error) {
    console.error("getUnreadMessageCount failed", error);
    return 0;
  }

  return count || 0;
}

// Subscribe to real-time message updates
export function subscribeToMessages(
  taskId: string,
  callback: (message: Message) => void
) {
  const supabase = createClient();

  return supabase
    .channel(`messages:${taskId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `task_id=eq.${taskId}`,
      },
      (payload) => {
        callback(payload.new as Message);
      }
    )
    .subscribe();
}

// Send system message (e.g., "Wysa accepted the task")
export async function sendSystemMessage(
  taskId: string,
  receiverId: string,
  messageText: string
): Promise<Message | null> {
  const supabase = createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    console.error("sendSystemMessage failed - not authenticated", authError);
    return null;
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({
      task_id: taskId,
      sender_id: user.id,
      receiver_id: receiverId,
      message_text: messageText,
      message_type: 'system',
    })
    .select()
    .single();

  if (error) {
    console.error("sendSystemMessage failed", error);
    return null;
  }

  return data;
}