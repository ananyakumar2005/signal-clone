"use client";
import { useState, useRef, useEffect, KeyboardEvent } from "react";
import type { Message } from "@/types";
import { Send, Smile, Paperclip, X } from "lucide-react";

interface MessageInputProps {
  onSendMessage: (content: string, replyToId?: number) => void;
  onTypingStart: () => void;
  onTypingStop: () => void;
  replyingTo: Message | null;
  onCancelReply: () => void;
  disabled?: boolean;
}

const QUICK_EMOJIS = ["👍", "❤️", "😂", "🔥", "🙏", "🎉"];

export function MessageInput({
  onSendMessage,
  onTypingStart,
  onTypingStop,
  replyingTo,
  onCancelReply,
  disabled = false,
}: MessageInputProps) {
  const [content, setContent] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (replyingTo && inputRef.current) {
      inputRef.current.focus();
    }
  }, [replyingTo]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);

    // Typing start
    onTypingStart();

    // Debounce typing stop
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      onTypingStop();
    }, 2000);
  };

  const handleSend = () => {
    const trimmed = content.trim();
    if (!trimmed || disabled) return;

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    onTypingStop();

    onSendMessage(trimmed, replyingTo?.id);
    setContent("");
    setShowEmojiPicker(false);
    onCancelReply();

    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const addEmoji = (emoji: string) => {
    setContent((prev) => prev + emoji);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="relative border-t border-border-subtle bg-surface-header p-3">
      {/* Reply Preview Bar */}
      {replyingTo && (
        <div className="flex items-center justify-between px-3 py-1.5 mb-2 bg-[#23272b] rounded-lg border-l-4 border-signal-blue text-xs">
          <div className="min-w-0 pr-2">
            <span className="font-semibold text-signal-blue block text-[11px]">
              Replying to {replyingTo.sender?.display_name || "User"}
            </span>
            <span className="text-text-muted truncate block">
              {replyingTo.content}
            </span>
          </div>
          <button
            onClick={onCancelReply}
            className="p-1 text-text-muted hover:text-text-primary rounded-full"
            title="Cancel reply"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Quick Emoji Bar Popup */}
      {showEmojiPicker && (
        <div className="absolute bottom-16 left-4 flex items-center gap-1.5 p-2 bg-surface-card border border-border-subtle rounded-xl shadow-xl z-20 animate-fade-in">
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => addEmoji(emoji)}
              className="text-lg p-1 hover:scale-125 transition-transform"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Input Row */}
      <div className="flex items-end gap-2">
        {/* Emoji Toggle */}
        <button
          type="button"
          onClick={() => setShowEmojiPicker((prev) => !prev)}
          className={`p-2 rounded-lg transition-colors ${
            showEmojiPicker
              ? "text-signal-blue bg-surface-hover"
              : "text-text-muted hover:text-text-primary hover:bg-surface-hover"
          }`}
          title="Emojis"
        >
          <Smile className="w-5 h-5" />
        </button>

        {/* Text Area */}
        <div className="flex-1 min-h-[40px] max-h-32 bg-surface-input rounded-2xl border border-transparent focus-within:border-signal-blue/50 px-3 py-2 flex items-center transition-colors">
          <textarea
            ref={inputRef}
            value={content}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder="Signal message"
            rows={1}
            disabled={disabled}
            className="w-full bg-transparent resize-none text-sm text-text-primary placeholder-text-muted focus:outline-none max-h-28 overflow-y-auto"
          />
        </div>

        {/* Send Button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!content.trim() || disabled}
          className={`p-2.5 rounded-full transition-all flex items-center justify-center flex-shrink-0 ${
            content.trim() && !disabled
              ? "bg-signal-blue text-white hover:bg-signal-blue-hover shadow-md cursor-pointer scale-100"
              : "bg-neutral-800 text-neutral-600 cursor-not-allowed scale-95"
          }`}
          title="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
