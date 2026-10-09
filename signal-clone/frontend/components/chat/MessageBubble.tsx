"use client";
import type { Message } from "@/types";
import { formatMessageTime } from "@/lib/utils";
import { Check, CheckCheck, Clock, Reply } from "lucide-react";

interface MessageBubbleProps {
  message: Message;
  isOutgoing: boolean;
  showSenderName?: boolean;
  onReply?: (message: Message) => void;
}

export function MessageBubble({
  message,
  isOutgoing,
  showSenderName = false,
  onReply,
}: MessageBubbleProps) {
  const isPending = message._optimistic || message.status === "sending";

  return (
    <div
      className={`group relative flex flex-col max-w-[85%] sm:max-w-[70%] mb-1 ${
        isOutgoing ? "ml-auto items-end" : "mr-auto items-start"
      }`}
    >
      {/* Sender name for incoming group messages */}
      {!isOutgoing && showSenderName && (
        <span className="text-[11px] font-semibold text-signal-blue-light mb-0.5 px-2">
          {message.sender?.display_name || "User"}
        </span>
      )}

      {/* Bubble Container */}
      <div
        className={`relative px-3.5 py-2 transition-shadow shadow-sm ${
          isOutgoing
            ? "bg-signal-blue text-white rounded-2xl rounded-br-sm"
            : "bg-[#25282c] text-text-primary rounded-2xl rounded-bl-sm border border-border-subtle/50"
        }`}
      >
        {/* Reply preview */}
        {message.reply_to && (
          <div
            className={`mb-1.5 px-2.5 py-1 text-xs rounded-md border-l-2 bg-black/20 ${
              isOutgoing
                ? "border-white/80 text-white/90"
                : "border-signal-blue text-text-secondary"
            }`}
          >
            <span className="font-semibold block text-[10px]">
              {message.reply_to.sender_name}
            </span>
            <span className="line-clamp-1 opacity-80">
              {message.reply_to.content}
            </span>
          </div>
        )}

        {/* Message Content */}
        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
          {message.content}
        </p>

        {/* Timestamp & Status */}
        <div
          className={`flex items-center gap-1 mt-1 text-[10px] select-none ${
            isOutgoing ? "text-white/70 justify-end" : "text-text-muted justify-end"
          }`}
        >
          <span>{formatMessageTime(message.created_at)}</span>

          {isOutgoing && (
            <span className="flex items-center">
              {isPending ? (
                <Clock className="w-3 h-3 text-white/60 animate-spin" />
              ) : message.status === "read" ? (
                <CheckCheck className="w-3.5 h-3.5 text-white" />
              ) : message.status === "delivered" ? (
                <CheckCheck className="w-3.5 h-3.5 text-white/70" />
              ) : (
                <Check className="w-3.5 h-3.5 text-white/70" />
              )}
            </span>
          )}
        </div>
      </div>

      {/* Quick Reply Button on Hover */}
      {onReply && (
        <button
          onClick={() => onReply(message)}
          className={`absolute top-1/2 -translate-y-1/2 p-1 bg-surface-card hover:bg-surface-hover border border-border-subtle rounded-full text-text-muted hover:text-text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-150 ${
            isOutgoing ? "-left-8" : "-right-8"
          }`}
          title="Reply"
        >
          <Reply className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
