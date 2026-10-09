"use client";
import type { Conversation } from "@/types";
import { ConversationItem } from "./ConversationItem";
import { MessageSquarePlus } from "lucide-react";

interface ConversationListProps {
  conversations: Conversation[];
  activeId: number | null;
  onSelect: (id: number) => void;
  onOpenNewChat: () => void;
  isLoading?: boolean;
}

export function ConversationList({
  conversations,
  activeId,
  onSelect,
  onOpenNewChat,
  isLoading = false,
}: ConversationListProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 p-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3 p-2 rounded-xl animate-pulse">
            <div className="w-10 h-10 rounded-full bg-neutral-800" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 bg-neutral-800 rounded w-1/2" />
              <div className="h-2.5 bg-neutral-850 rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 p-6 text-center text-text-muted">
        <div className="p-3 bg-surface-card rounded-full mb-3 text-text-secondary">
          <MessageSquarePlus className="w-6 h-6" />
        </div>
        <p className="text-sm font-medium text-text-primary mb-1">No conversations found</p>
        <p className="text-xs text-text-muted mb-4 max-w-[200px]">
          Start a new encrypted chat with a friend or create a group.
        </p>
        <button
          onClick={onOpenNewChat}
          className="px-3.5 py-1.5 text-xs font-medium text-white bg-signal-blue hover:bg-signal-blue-hover rounded-lg transition-colors shadow-sm"
        >
          Start New Chat
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto space-y-1 py-1">
      {conversations.map((conv) => (
        <ConversationItem
          key={conv.id}
          conversation={conv}
          isActive={activeId === conv.id}
          onClick={() => onSelect(conv.id)}
        />
      ))}
    </div>
  );
}
