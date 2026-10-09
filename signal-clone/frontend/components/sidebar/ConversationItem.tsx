"use client";
import type { Conversation } from "@/types";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { formatConversationTime } from "@/lib/utils";
import { useStore } from "@/store/useStore";
import { Check, CheckCheck } from "lucide-react";

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}

export function ConversationItem({
  conversation,
  isActive,
  onClick,
}: ConversationItemProps) {
  const currentUser = useStore((state) => state.currentUser);
  const typing = useStore((state) => state.typing[conversation.id]);
  const presence = useStore((state) => state.presence);

  const isGroup = conversation.type === "group";

  // Peer for direct messages
  const peerMember = !isGroup
    ? conversation.members?.find((m) => m.user_id !== currentUser?.id)
    : null;
  const peer = peerMember?.user;

  const displayName = isGroup
    ? conversation.group_name || "Group Chat"
    : peer?.display_name || peer?.phone || "Direct Chat";

  const avatarUrl = isGroup ? conversation.group_avatar : peer?.avatar_url;

  // Online status: check store's live presence map first, fallback to peer.is_online
  const isOnline =
    !isGroup && peer
      ? (presence[peer.id]?.is_online ?? peer.is_online ?? false)
      : false;

  // Typing state
  const isTyping = typing && typing.size > 0;

  // Last message info
  const lastMsg = conversation.last_message;
  const isOutgoing = lastMsg && lastMsg.sender_id === currentUser?.id;
  const timeStr = lastMsg?.created_at || conversation.created_at;

  return (
    <div
      onClick={onClick}
      className={`group relative flex items-center gap-3 px-3 py-2.5 mx-2 rounded-xl cursor-pointer transition-all duration-150 select-none ${
        isActive
          ? "bg-surface-active text-text-primary shadow-sm"
          : "hover:bg-surface-hover text-text-secondary"
      }`}
    >
      <Avatar
        name={displayName}
        avatarUrl={avatarUrl}
        size="md"
        isOnline={isOnline}
        showOnlineStatus={!isGroup}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span
            className={`text-sm font-medium truncate ${
              isActive ? "text-text-primary" : "text-text-primary group-hover:text-white"
            }`}
          >
            {displayName}
          </span>
          <span className="text-[11px] text-text-muted flex-shrink-0 ml-2">
            {formatConversationTime(timeStr)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 min-w-0 pr-2">
            {isTyping ? (
              <span className="text-xs text-signal-blue font-medium animate-pulse">
                typing...
              </span>
            ) : (
              <>
                {isOutgoing && lastMsg && (
                  <span className="flex-shrink-0 text-text-muted">
                    {lastMsg.status === "read" ? (
                      <CheckCheck className="w-3.5 h-3.5 text-signal-blue" />
                    ) : lastMsg.status === "delivered" ? (
                      <CheckCheck className="w-3.5 h-3.5 text-text-muted" />
                    ) : (
                      <Check className="w-3.5 h-3.5 text-text-muted" />
                    )}
                  </span>
                )}
                <span className="text-xs text-text-muted truncate">
                  {lastMsg?.content || "No messages yet"}
                </span>
              </>
            )}
          </div>

          <Badge count={conversation.unread_count} />
        </div>
      </div>
    </div>
  );
}
