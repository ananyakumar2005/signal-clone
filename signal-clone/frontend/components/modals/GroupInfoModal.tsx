"use client";
import { useState, useEffect } from "react";
import type { Conversation, ConversationMember, User, Contact } from "@/types";
import { Avatar } from "@/components/ui/Avatar";
import { useStore } from "@/store/useStore";
import { api } from "@/lib/api";
import {
  X,
  ShieldCheck,
  UserPlus,
  UserMinus,
  Crown,
  LogOut,
  Lock,
  Phone,
  FileText,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

interface GroupInfoModalProps {
  conversation: Conversation;
  isOpen: boolean;
  onClose: () => void;
}

export function GroupInfoModal({
  conversation,
  isOpen,
  onClose,
}: GroupInfoModalProps) {
  const router = useRouter();
  const currentUser = useStore((state) => state.currentUser);
  const upsertConversation = useStore((state) => state.upsertConversation);

  const [members, setMembers] = useState<ConversationMember[]>(conversation.members || []);
  const [showAddMember, setShowAddMember] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);

  const isGroup = conversation.type === "group";
  const myMember = members.find((m) => m.user_id === currentUser?.id);
  const isAdmin = myMember?.is_admin || false;

  const peerMember = !isGroup
    ? members.find((m) => m.user_id !== currentUser?.id)
    : null;
  const peer = peerMember?.user;

  useEffect(() => {
    if (!isOpen) return;

    if (isGroup) {
      api
        .get<ConversationMember[]>(`/api/groups/${conversation.id}/members`)
        .then((res) => setMembers(res.data))
        .catch(console.error);
    }
  }, [isOpen, conversation.id, isGroup]);

  if (!isOpen) return null;

  const handleAddMember = async (userId: number) => {
    try {
      const res = await api.post<ConversationMember>(
        `/api/groups/${conversation.id}/members`,
        { user_id: userId }
      );
      setMembers((prev) => [...prev, res.data]);
      toast.success("Member added to group");
      setShowAddMember(false);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to add member");
    }
  };

  const handleRemoveMember = async (userId: number) => {
    if (!confirm("Remove this member from the group?")) return;
    try {
      await api.delete(`/api/groups/${conversation.id}/members/${userId}`);
      setMembers((prev) => prev.filter((m) => m.user_id !== userId));
      toast.success("Member removed");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to remove member");
    }
  };

  const handleToggleAdmin = async (userId: number) => {
    try {
      const res = await api.patch<{ user_id: number; is_admin: boolean }>(
        `/api/groups/${conversation.id}/members/${userId}`
      );
      setMembers((prev) =>
        prev.map((m) =>
          m.user_id === userId ? { ...m, is_admin: res.data.is_admin } : m
        )
      );
      toast.success(
        res.data.is_admin ? "Promoted to admin" : "Admin privileges removed"
      );
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to change admin role");
    }
  };

  const handleLeaveGroup = async () => {
    if (!confirm("Are you sure you want to leave this group?")) return;
    try {
      if (currentUser) {
        await api.delete(
          `/api/groups/${conversation.id}/members/${currentUser.id}`
        );
      }
      toast.success("Left group");
      onClose();
      router.push("/chats");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to leave group");
    }
  };

  const openAddMemberDrawer = async () => {
    setLoading(true);
    setShowAddMember(true);
    try {
      const res = await api.get<Contact[]>("/api/contacts");
      const currentMemberIds = new Set(members.map((m) => m.user_id));
      setContacts(res.data.filter((c) => !currentMemberIds.has(c.contact.id)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in select-none">
      <div className="bg-surface-card border border-border-subtle rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle bg-surface-header">
          <h3 className="text-base font-semibold text-text-primary">
            {isGroup ? "Group Details" : "Contact Info"}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-text-muted hover:text-text-primary rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Hero Profile */}
          <div className="flex flex-col items-center text-center">
            <Avatar
              name={
                isGroup
                  ? conversation.group_name || "Group"
                  : peer?.display_name || "User"
              }
              avatarUrl={isGroup ? conversation.group_avatar : peer?.avatar_url}
              size="xl"
              className="mb-3"
            />
            <h4 className="text-lg font-bold text-text-primary">
              {isGroup
                ? conversation.group_name
                : peer?.display_name || peer?.phone}
            </h4>
            <p className="text-xs text-text-muted mt-0.5">
              {isGroup
                ? `${members.length} members`
                : peer?.about || "Hey there! I am using Signal."}
            </p>
          </div>

          {/* Contact specific info */}
          {!isGroup && peer && (
            <div className="space-y-3 bg-surface-sidebar p-3.5 rounded-xl border border-border-subtle/50 text-xs">
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-signal-blue" />
                <div>
                  <span className="text-text-muted block text-[10px]">Phone</span>
                  <span className="font-medium text-text-primary">{peer.phone}</span>
                </div>
              </div>
              {peer.username && (
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-signal-blue" />
                  <div>
                    <span className="text-text-muted block text-[10px]">Username</span>
                    <span className="font-medium text-text-primary">@{peer.username}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Safety Number / Security Verification Mockup */}
          <div className="bg-surface-sidebar p-3.5 rounded-xl border border-border-subtle/50 text-xs">
            <div className="flex items-center gap-2 font-medium text-text-primary mb-1">
              <Lock className="w-4 h-4 text-signal-blue" />
              <span>Safety Number Verification</span>
            </div>
            <p className="text-[11px] text-text-muted leading-relaxed">
              Signal end-to-end encrypted protocol verification fingerprint:
            </p>
            <div className="mt-2 font-mono text-[10px] bg-black/40 p-2 rounded text-emerald-400 tracking-wider text-center">
              49102 85910 20491 58102 39105 82910
            </div>
          </div>

          {/* Group Members Section */}
          {isGroup && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Members ({members.length})
                </span>
                {isAdmin && (
                  <button
                    onClick={openAddMemberDrawer}
                    className="flex items-center gap-1 text-xs text-signal-blue hover:text-signal-blue-hover font-medium"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Add Member</span>
                  </button>
                )}
              </div>

              {/* Add member sub-view */}
              {showAddMember && (
                <div className="mb-3 p-3 bg-surface-sidebar rounded-xl border border-signal-blue/30 animate-fade-in">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-text-primary">
                      Select Contact to Add
                    </span>
                    <button
                      onClick={() => setShowAddMember(false)}
                      className="text-text-muted hover:text-text-primary text-xs"
                    >
                      Close
                    </button>
                  </div>
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-signal-blue mx-auto py-2" />
                  ) : contacts.length === 0 ? (
                    <p className="text-[11px] text-text-muted">
                      No additional contacts available to add.
                    </p>
                  ) : (
                    <div className="max-h-36 overflow-y-auto space-y-1">
                      {contacts.map((c) => (
                        <div
                          key={c.id}
                          className="flex items-center justify-between p-1.5 hover:bg-surface-hover rounded-lg text-xs"
                        >
                          <span className="font-medium text-text-primary">
                            {c.contact.display_name}
                          </span>
                          <button
                            onClick={() => handleAddMember(c.contact.id)}
                            className="px-2 py-0.5 bg-signal-blue text-white rounded text-[10px]"
                          >
                            Add
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Members List */}
              <div className="space-y-1">
                {members.map((m) => {
                  const isMe = m.user_id === currentUser?.id;
                  return (
                    <div
                      key={m.id}
                      className="flex items-center justify-between p-2 rounded-xl hover:bg-surface-hover transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar
                          name={m.user.display_name}
                          avatarUrl={m.user.avatar_url}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-text-primary truncate flex items-center gap-1.5">
                            {m.user.display_name}
                            {isMe && (
                              <span className="text-[10px] text-text-muted">
                                (You)
                              </span>
                            )}
                          </p>
                          <p className="text-[10px] text-text-muted">
                            {m.user.phone}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {m.is_admin && (
                          <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-medium border border-amber-500/20">
                            <Crown className="w-3 h-3" />
                            Admin
                          </span>
                        )}

                        {isAdmin && !isMe && (
                          <>
                            <button
                              onClick={() => handleToggleAdmin(m.user_id)}
                              className="p-1 text-text-muted hover:text-amber-400 rounded"
                              title={
                                m.is_admin ? "Demote from Admin" : "Promote to Admin"
                              }
                            >
                              <Crown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleRemoveMember(m.user_id)}
                              className="p-1 text-text-muted hover:text-rose-400 rounded"
                              title="Remove member"
                            >
                              <UserMinus className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Leave group button */}
              <button
                onClick={handleLeaveGroup}
                className="w-full mt-4 flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Leave Group</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
