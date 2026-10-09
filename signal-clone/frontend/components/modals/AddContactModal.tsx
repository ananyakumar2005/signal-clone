"use client";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useStore } from "@/store/useStore";
import { Avatar } from "@/components/ui/Avatar";
import { X, Search, UserPlus, MessageSquare, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import type { User, Conversation } from "@/types";
import { useRouter } from "next/navigation";

interface AddContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddContactModal({ isOpen, onClose }: AddContactModalProps) {
  const router = useRouter();
  const upsertConversation = useStore((state) => state.upsertConversation);
  const setActiveConvId = useStore((state) => state.setActiveConvId);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setResults([]);
      return;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get<User[]>(`/api/users/search?q=${encodeURIComponent(query)}`);
        setResults(res.data);
      } catch (err: any) {
        console.error("Failed to search users:", err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const handleStartChat = async (user: User) => {
    setActionLoading(user.id);
    try {
      const res = await api.post<Conversation>("/api/conversations/direct", {
        contact_id: user.id,
      });
      upsertConversation(res.data);
      setActiveConvId(res.data.id);
      onClose();
      router.push(`/chats/${res.data.id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to start conversation");
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddContactOnly = async (user: User) => {
    setActionLoading(user.id);
    try {
      await api.post("/api/contacts", {
        phone: user.phone,
        nickname: user.display_name,
      });
      toast.success(`${user.display_name} added to contacts!`);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Could not add contact");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-surface-card border border-border-subtle rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle bg-surface-header">
          <h3 className="text-base font-semibold text-text-primary">
            New Chat / Add Contact
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-text-muted hover:text-text-primary rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-border-subtle/50">
          <div className="relative flex items-center">
            <Search className="absolute left-3 w-4 h-4 text-text-muted" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or phone (e.g. +1...)"
              className="w-full pl-9 pr-4 py-2 bg-surface-input rounded-xl text-sm text-text-primary placeholder-text-muted border border-border-subtle focus:border-signal-blue focus:outline-none"
            />
            {loading && (
              <Loader2 className="absolute right-3 w-4 h-4 text-signal-blue animate-spin" />
            )}
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {query.trim() === "" ? (
            <div className="py-12 text-center text-text-muted text-xs">
              Type a name or phone number to find people on Signal.
            </div>
          ) : results.length === 0 && !loading ? (
            <div className="py-12 text-center text-text-muted text-xs">
              No users found matching &quot;{query}&quot;
            </div>
          ) : (
            results.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-surface-hover transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar
                    name={user.display_name}
                    avatarUrl={user.avatar_url}
                    size="md"
                    isOnline={user.is_online}
                    showOnlineStatus={true}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {user.display_name}
                    </p>
                    <p className="text-xs text-text-muted truncate">
                      {user.phone}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleAddContactOnly(user)}
                    disabled={actionLoading === user.id}
                    className="p-2 text-text-muted hover:text-signal-blue hover:bg-surface-card rounded-lg transition-colors"
                    title="Add to contacts"
                  >
                    <UserPlus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleStartChat(user)}
                    disabled={actionLoading === user.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-signal-blue hover:bg-signal-blue-hover text-white text-xs font-medium rounded-lg transition-colors shadow-sm"
                  >
                    {actionLoading === user.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Chat</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
