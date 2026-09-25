"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Send, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  getTaskMessages,
  sendMessage,
  markMessagesAsRead,
  subscribeToMessages,
  type Message,
} from "@/lib/message-store";
import { loadTask, type Task } from "@/lib/task-store";
import { createClient } from "@/lib/supabase/client";
import { useErrorHandler } from "@/hooks/use-error-handler";

interface DashboardChatProps {
  taskId: string;
}

function formatMessageTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatMessageDate(dateStr: string) {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getTaskStatusColor(status: string) {
  switch (status) {
    case "waiting_for_wysa":
      return "bg-yellow-100 text-yellow-800";
    case "wysa_accepted":
      return "bg-blue-100 text-blue-800";
    case "confirmed":
      return "bg-green-100 text-green-800";
    case "in_progress":
      return "bg-purple-100 text-purple-800";
    case "completed":
      return "bg-teal-100 text-teal-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export function DashboardChat({ taskId }: DashboardChatProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { handleAsyncError } = useErrorHandler();

  const [messages, setMessages] = useState<Message[]>([]);
  const [task, setTask] = useState<Task | null>(null);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageText, setMessageText] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const otherUserId = searchParams.get("user");

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!otherUserId) {
      router.push("/messages");
      return;
    }

    const loadChatData = async () => {
      await handleAsyncError(
        async () => {
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error("Not authenticated");
          setCurrentUser(user);

          const taskData = await loadTask(taskId);
          if (!taskData) throw new Error("Task not found");
          setTask(taskData);

          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", otherUserId)
            .single();

          if (profileError) throw profileError;
          setOtherUser(profile);

          const chatMessages = await getTaskMessages(taskId, otherUserId);
          setMessages(chatMessages);

          await markMessagesAsRead(taskId, otherUserId);
        },
        {
          title: "Failed to load chat",
          description: "Please try again",
          action: { label: "Go back", onClick: () => router.push("/messages") },
        }
      );
      setLoading(false);
    };

    loadChatData();

    const subscription = subscribeToMessages(taskId, (newMessage) => {
      setMessages((prev) => [...prev, newMessage]);
      if (newMessage.sender_id === otherUserId) {
        markMessagesAsRead(taskId, otherUserId);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [taskId, otherUserId, router, handleAsyncError]);

  async function handleSendMessage() {
    if (!messageText.trim() || !otherUserId || sending) return;

    const text = messageText.trim();
    setMessageText("");
    setSending(true);

    await handleAsyncError(
      async () => {
        const sentMessage = await sendMessage(taskId, otherUserId, text);
        if (!sentMessage) throw new Error("Failed to send message");
      },
      { title: "Failed to send message", description: "Please try again" }
    );

    setSending(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
      </div>
    );
  }

  if (!task || !otherUser) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Chat not available</p>
          <Button onClick={() => router.push("/messages")}>Go back</Button>
        </div>
      </div>
    );
  }

  const groupedMessages = messages.reduce((groups, message) => {
    const date = new Date(message.created_at).toDateString();
    if (!groups[date]) groups[date] = [];
    groups[date].push(message);
    return groups;
  }, {} as Record<string, Message[]>);

  return (
    <div className="flex flex-col h-full bg-white max-w-3xl mx-auto w-full border-x border-gray-100">
      {/* Header */}
      <div className="border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="icon" onClick={() => router.push("/messages")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>

            <Avatar className="w-10 h-10">
              <AvatarImage src={otherUser.avatar_url || undefined} />
              <AvatarFallback className="bg-teal-100 text-teal-600 font-semibold">
                {otherUser.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <h2 className="text-base font-semibold text-gray-900 truncate">
                {otherUser.full_name}
              </h2>
              <p className="text-sm text-gray-600 truncate">{task.title}</p>
            </div>
          </div>

          <Badge className={getTaskStatusColor(task.status)}>
            {task.status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
          </Badge>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {Object.entries(groupedMessages).map(([date, dayMessages]) => (
          <div key={date}>
            <div className="flex justify-center mb-4">
              <span className="bg-white px-3 py-1 rounded-full text-xs text-gray-500 border">
                {formatMessageDate(dayMessages[0].created_at)}
              </span>
            </div>

            {dayMessages.map((message, index) => {
              const isOwnMessage = message.sender_id === currentUser?.id;
              const showAvatar =
                !isOwnMessage &&
                (index === 0 || dayMessages[index - 1].sender_id !== message.sender_id);

              return (
                <div key={message.id} className={`flex mb-3 ${isOwnMessage ? "justify-end" : "justify-start"}`}>
                  <div className={`flex items-end space-x-2 max-w-[75%] ${isOwnMessage ? "flex-row-reverse space-x-reverse" : ""}`}>
                    {showAvatar && !isOwnMessage && (
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={otherUser.avatar_url || undefined} />
                        <AvatarFallback className="bg-teal-100 text-teal-600 text-xs">
                          {otherUser.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    {!showAvatar && !isOwnMessage && <div className="w-8" />}

                    <div
                      className={`rounded-2xl px-4 py-2 ${
                        message.message_type === "system"
                          ? "bg-yellow-100 text-yellow-800 text-center text-sm"
                          : isOwnMessage
                          ? "bg-teal-600 text-white"
                          : "bg-white border"
                      }`}
                    >
                      <p className="text-sm">{message.message_text}</p>
                      <p
                        className={`text-xs mt-1 ${
                          message.message_type === "system"
                            ? "text-yellow-600"
                            : isOwnMessage
                            ? "text-teal-100"
                            : "text-gray-500"
                        }`}
                      >
                        {formatMessageTime(message.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center space-x-3">
          <Input
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Type a message..."
            disabled={sending}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!messageText.trim() || sending}
            size="icon"
            className="bg-teal-600 hover:bg-teal-700 text-white shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
