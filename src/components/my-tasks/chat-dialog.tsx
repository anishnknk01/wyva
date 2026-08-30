"use client";

import { useState } from "react";
import { MessageCircle, Send } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ChatMessage = {
  id: number;
  from: "me" | "other";
  text: string;
};

export function ChatDialog({
  otherName,
  open,
  onOpenChange,
}: {
  otherName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      from: "other",
      text: `Hi! This is a simulated chat with ${otherName}. Ask anything about the task.`,
    },
  ]);
  const [draft, setDraft] = useState("");

  function sendMessage() {
    if (!draft.trim()) return;
    const newMessage: ChatMessage = { id: Date.now(), from: "me", text: draft.trim() };
    setMessages((prev) => [
      ...prev,
      newMessage,
      {
        id: Date.now() + 1,
        from: "other",
        text: "Thanks for the message! This is prototype chat, real replies aren't available yet.",
      },
    ]);
    setDraft("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm gap-0 p-0 sm:max-w-md">
        <DialogHeader className="border-b border-border p-4">
          <DialogTitle className="flex items-center gap-1.5">
            <MessageCircle className="size-4 text-coral" />
            Chat with {otherName}
          </DialogTitle>
          <DialogDescription>
            Simulated chat for this prototype. No real messages are sent.
          </DialogDescription>
        </DialogHeader>

        <div className="flex max-h-72 flex-col gap-2 overflow-y-auto p-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                message.from === "me"
                  ? "self-end bg-coral text-coral-foreground"
                  : "self-start bg-muted text-foreground"
              }`}
            >
              {message.text}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 border-t border-border p-4">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Type a message..."
            className="h-9"
          />
          <Button size="icon" onClick={sendMessage} aria-label="Send message">
            <Send className="size-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
