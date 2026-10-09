"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";
import { Avatar } from "@/components/ui/Avatar";
import { SearchBar } from "./SearchBar";
import { ConversationList } from "./ConversationList";
import {
  MessageSquarePlus,
  Users,
  Settings,
  LogOut,
  Filter,
} from "lucide-react";
import { clearAuth } from "@/lib/auth";
import toast from "react-hot-toast";

interface SidebarProps {
  onOpenNewChat: () => void;
  onOpenNewGroup: () => void;
  onOpenSettings: () => void;
  isLoading?: boolean;
}

export function Sidebar({
  onOpenNewChat,
  onOpenNewGroup,
  onOpenSettings,
  isLoading = false,
}: SidebarProps) {
  const router = useRouter();
  const currentUser = useStore((state) => state.currentUser);
  const setCurrentUser = useStore((state) => state.setCurrentUser);
  const conversations = useStore((state) => state.conversations);
  const activeConvId = useStore((state) => state.activeConvId);
  const setActiveConvId = useStore((state) => state.setActiveConvId);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "groups">("all");

  const filteredConversations = useMemo(() => {
    return conversations.filter((conv) => {
      // Tab filter
      if (activeTab === "unread" && conv.unread_count === 0) return false;
      if (activeTab === "groups" && conv.type !== "group") return false;

      // Search filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();

      if (conv.type === "group") {
        return conv.group_name?.toLowerCase().includes(q);
      } else {
        const peer = conv.members?.find((m) => m.user_id !== currentUser?.id)?.user;
        return (
          peer?.display_name.toLowerCase().includes(q) ||
          peer?.phone.toLowerCase().includes(q) ||
          peer?.username?.toLowerCase().includes(q)
        );
      }
    });
  }, [conversations, activeTab, searchQuery, currentUser]);

  const handleSelectConversation = (id: number) => {
    setActiveConvId(id);
    router.push(`/chats/${id}`);
  };

  const handleLogout = () => {
    clearAuth();
    setCurrentUser(null);
    toast.success("Logged out successfully");
    router.push("/login");
  };

  return (
    <aside className="w-80 sm:w-96 flex flex-col h-full bg-surface-sidebar border-r border-border-subtle select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle bg-surface-sidebar">
        <div
          onClick={onOpenSettings}
          className="flex items-center gap-3 cursor-pointer group hover:opacity-90 transition-opacity"
        >
          <Avatar
            name={currentUser?.display_name || "User"}
            avatarUrl={currentUser?.avatar_url}
            size="md"
            isOnline={true}
            showOnlineStatus={true}
          />
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold text-text-primary truncate">
              {currentUser?.display_name || "Signal User"}
            </span>
            <span className="text-xs text-text-muted truncate">
              {currentUser?.phone || "Private & Encrypted"}
            </span>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1">
          <button
            onClick={onOpenNewChat}
            className="p-2 text-text-muted hover:text-text-primary hover:bg-surface-hover rounded-lg transition-colors"
            title="New Chat"
          >
            <MessageSquarePlus className="w-5 h-5" />
          </button>
          <button
            onClick={onOpenNewGroup}
            className="p-2 text-text-muted hover:text-text-primary hover:bg-surface-hover rounded-lg transition-colors"
            title="New Group"
          >
            <Users className="w-5 h-5" />
          </button>
          <button
            onClick={onOpenSettings}
            className="p-2 text-text-muted hover:text-text-primary hover:bg-surface-hover rounded-lg transition-colors"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            onClick={handleLogout}
            className="p-2 text-text-muted hover:text-rose-400 hover:bg-surface-hover rounded-lg transition-colors"
            title="Log Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="pt-2">
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
      </div>

      {/* Tabs Filter */}
      <div className="flex items-center gap-1 px-4 py-1.5 border-b border-border-subtle/60 text-xs">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-3 py-1 rounded-full font-medium transition-colors ${
            activeTab === "all"
              ? "bg-signal-blue text-white"
              : "text-text-muted hover:text-text-primary hover:bg-surface-hover"
          }`}
        >
          All
        </button>
        <button
          onClick={() => setActiveTab("unread")}
          className={`px-3 py-1 rounded-full font-medium transition-colors ${
            activeTab === "unread"
              ? "bg-signal-blue text-white"
              : "text-text-muted hover:text-text-primary hover:bg-surface-hover"
          }`}
        >
          Unread
        </button>
        <button
          onClick={() => setActiveTab("groups")}
          className={`px-3 py-1 rounded-full font-medium transition-colors ${
            activeTab === "groups"
              ? "bg-signal-blue text-white"
              : "text-text-muted hover:text-text-primary hover:bg-surface-hover"
          }`}
        >
          Groups
        </button>
      </div>

      {/* Conversations List */}
      <ConversationList
        conversations={filteredConversations}
        activeId={activeConvId}
        onSelect={handleSelectConversation}
        onOpenNewChat={onOpenNewChat}
        isLoading={isLoading}
      />
    </aside>
  );
}
