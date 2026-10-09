"use client";
import type { Conversation } from "@/types";
import { Avatar } from "@/components/ui/Avatar";
import { useStore } from "@/store/useStore";
import { formatLastSeen } from "@/lib/utils";
import { Phone, Video, Search, MoreVertical, ArrowLeft, Users } from "lucide-react";
import { useRouter } from "next/navigation";

interface ChatHeaderProps {
  conversation: Conversation;
  onOpenInfo: () => void;
  onOpenCall: (type: "voice" | "video") => void;
}

export function ChatHeader({
  conversation,
  onOpenInfo,
  onOpenCall,
}: ChatHeaderProps) {
  const router = useRouter();
  const currentUser = useStore((state) => state.currentUser);
  const presence = useStore((state) => state.presence);

  const isGroup = conversation.type === "group";

  const peerMember = !isGroup
    ? conversation.members?.find((m) => m.user_id !== currentUser?.id)
    : null;
  const peer = peerMember?.user;

  const displayName = isGroup
    ? conversation.group_name || "Group Chat"
    : peer?.display_name || peer?.phone || "Chat";

  const avatarUrl = isGroup ? conversation.group_avatar : peer?.avatar_url;

  // Live presence check
  const isOnline =
    !isGroup && peer
      ? (presence[peer.id]?.is_online ?? peer.is_online ?? false)
      : false;
  const lastSeen =
    !isGroup && peer
      ? (presence[peer.id]?.last_seen ?? peer.last_seen)
      : null;

  const statusSubtitle = isGroup
    ? `${conversation.members?.length || 0} members`
    : isOnline
    ? "Online"
    : formatLastSeen(lastSeen);

  return (
    <header className="flex items-center justify-between px-4 py-3 bg-surface-header border-b border-border-subtle h-16 select-none z-10">
      <div className="flex items-center gap-3 min-w-0 cursor-pointer" onClick={onOpenInfo}>
        {/* Mobile back button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            router.push("/chats");
          }}
          className="md:hidden p-1.5 -ml-1 text-text-muted hover:text-text-primary rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <Avatar
          name={displayName}
          avatarUrl={avatarUrl}
          size="md"
          isOnline={isOnline}
          showOnlineStatus={!isGroup}
        />

        <div className="flex flex-col min-w-0">
          <h2 className="text-sm font-semibold text-text-primary truncate flex items-center gap-1.5">
            {displayName}
            {isGroup && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-card text-text-muted font-normal">
                Group
              </span>
            )}
          </h2>
          <span
            className={`text-xs truncate ${
              isOnline ? "text-emerald-400 font-medium" : "text-text-muted"
            }`}
          >
            {statusSubtitle}
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onOpenCall("voice")}
          className="p-2 text-text-muted hover:text-text-primary hover:bg-surface-hover rounded-lg transition-colors"
          title="Voice Call"
        >
          <Phone className="w-4 h-4" />
        </button>
        <button
          onClick={() => onOpenCall("video")}
          className="p-2 text-text-muted hover:text-text-primary hover:bg-surface-hover rounded-lg transition-colors"
          title="Video Call"
        >
          <Video className="w-4 h-4" />
        </button>
        <button
          onClick={onOpenInfo}
          className="p-2 text-text-muted hover:text-text-primary hover:bg-surface-hover rounded-lg transition-colors"
          title="Conversation details"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
