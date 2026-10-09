"use client";
import { useEffect, useRef } from "react";
import type { Message, Conversation } from "@/types";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { formatDateSeparator } from "@/lib/utils";
import { ShieldCheck } from "lucide-react";
import { useStore } from "@/store/useStore";

interface MessageListProps {
  conversation: Conversation;
  messages: Message[];
  typingUserNames: string[];
  onReply: (message: Message) => void;
  onMarkRead: (messageIds: number[]) => void;
  isLoading?: boolean;
}

export function MessageList({
  conversation,
  messages,
  typingUserNames,
  onReply,
  onMarkRead,
  isLoading = false,
}: MessageListProps) {
  const currentUser = useStore((state) => state.currentUser);
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUserNames]);

  // Mark unread messages as read
  useEffect(() => {
    if (!currentUser || messages.length === 0) return;

    const unreadIds = messages
      .filter((m) => m.sender_id !== currentUser.id && m.status !== "read" && !m._optimistic)
      .map((m) => m.id);

    if (unreadIds.length > 0) {
      onMarkRead(unreadIds);
    }
  }, [messages, currentUser, onMarkRead]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-signal-blue border-t-transparent animate-spin" />
      </div>
    );
  }

  // Group messages by date
  let lastDateHeader = "";

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-surface-chat"
    >
      {/* Privacy & Encryption Signal Banner */}
      <div className="flex flex-col items-center justify-center my-4 select-none">
        <div className="flex items-center gap-2 px-4 py-2 bg-surface-card/80 border border-border-subtle rounded-xl text-center max-w-md shadow-sm">
          <ShieldCheck className="w-5 h-5 text-signal-blue flex-shrink-0" />
          <p className="text-[11px] text-text-muted leading-tight">
            Messages and calls are end-to-end encrypted. No one outside of this chat, not even Signal, can read or listen to them.
          </p>
        </div>
      </div>

      {/* Render messages with Date Dividers */}
      {messages.map((msg, index) => {
        const isOutgoing = msg.sender_id === currentUser?.id;
        const dateHeader = formatDateSeparator(msg.created_at);
        const showDateSeparator = dateHeader !== lastDateHeader;
        if (showDateSeparator) {
          lastDateHeader = dateHeader;
        }

        return (
          <div key={msg.id || `opt-${index}`} className="flex flex-col">
            {showDateSeparator && (
              <div className="flex items-center justify-center my-3 select-none">
                <span className="px-3 py-1 bg-surface-card text-[11px] font-medium text-text-muted rounded-full border border-border-subtle/40">
                  {dateHeader}
                </span>
              </div>
            )}

            <MessageBubble
              message={msg}
              isOutgoing={isOutgoing}
              showSenderName={conversation.type === "group"}
              onReply={onReply}
            />
          </div>
        );
      })}

      {/* Typing indicator */}
      <TypingIndicator names={typingUserNames} />

      <div ref={bottomRef} className="h-2" />
    </div>
  );
}
