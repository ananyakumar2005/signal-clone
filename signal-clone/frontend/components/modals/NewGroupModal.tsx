"use client";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useStore } from "@/store/useStore";
import { Avatar } from "@/components/ui/Avatar";
import { X, Users, Check, Loader2, Search } from "lucide-react";
import toast from "react-hot-toast";
import type { Contact, Conversation } from "@/types";
import { useRouter } from "next/navigation";

interface NewGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewGroupModal({ isOpen, onClose }: NewGroupModalProps) {
  const router = useRouter();
  const upsertConversation = useStore((state) => state.upsertConversation);
  const setActiveConvId = useStore((state) => state.setActiveConvId);

  const [groupName, setGroupName] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setGroupName("");
      setSelectedUserIds([]);
      setFilter("");
      return;
    }

    const fetchContacts = async () => {
      setLoading(true);
      try {
        const res = await api.get<Contact[]>("/api/contacts");
        setContacts(res.data);
      } catch (err) {
        console.error("Failed to load contacts:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleMember = (userId: number) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleCreateGroup = async () => {
    const trimmed = groupName.trim();
    if (!trimmed) {
      toast.error("Please enter a group name");
      return;
    }
    if (selectedUserIds.length === 0) {
      toast.error("Please select at least 1 member");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post<Conversation>("/api/groups", {
        group_name: trimmed,
        member_ids: selectedUserIds,
      });

      upsertConversation(res.data);
      setActiveConvId(res.data.id);
      toast.success(`Group "${trimmed}" created!`);
      onClose();
      router.push(`/chats/${res.data.id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to create group");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredContacts = contacts.filter((c) => {
    const q = filter.toLowerCase();
    return (
      c.contact.display_name.toLowerCase().includes(q) ||
      c.contact.phone.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-surface-card border border-border-subtle rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle bg-surface-header">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-signal-blue" />
            <h3 className="text-base font-semibold text-text-primary">
              Create New Group
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-text-muted hover:text-text-primary rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Group Name Field */}
        <div className="p-4 border-b border-border-subtle space-y-3">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              Group Name
            </label>
            <input
              type="text"
              autoFocus
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g. Project Scaler Team"
              className="w-full px-3 py-2 bg-surface-input rounded-xl text-sm text-text-primary placeholder-text-muted border border-border-subtle focus:border-signal-blue focus:outline-none"
            />
          </div>

          {/* Member Search filter */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-text-muted" />
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Search contacts to add..."
              className="w-full pl-9 pr-3 py-1.5 bg-surface-input rounded-lg text-xs text-text-primary placeholder-text-muted border border-border-subtle focus:border-signal-blue focus:outline-none"
            />
          </div>
        </div>

        {/* Contacts list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <p className="text-[11px] font-medium text-text-muted px-2 py-1 uppercase tracking-wider">
            Select Members ({selectedUserIds.length} selected)
          </p>

          {loading ? (
            <div className="py-8 text-center">
              <Loader2 className="w-5 h-5 text-signal-blue animate-spin mx-auto" />
            </div>
          ) : contacts.length === 0 ? (
            <div className="py-8 text-center text-xs text-text-muted">
              You haven&apos;t added any contacts yet. Use &quot;New Chat&quot; to add contacts first!
            </div>
          ) : (
            filteredContacts.map((c) => {
              const isSelected = selectedUserIds.includes(c.contact.id);
              return (
                <div
                  key={c.id}
                  onClick={() => toggleMember(c.contact.id)}
                  className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-signal-blue/15 border border-signal-blue/40"
                      : "hover:bg-surface-hover"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar
                      name={c.contact.display_name}
                      avatarUrl={c.contact.avatar_url}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {c.nickname || c.contact.display_name}
                      </p>
                      <p className="text-xs text-text-muted truncate">
                        {c.contact.phone}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                      isSelected
                        ? "bg-signal-blue border-signal-blue text-white"
                        : "border-border-subtle"
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border-subtle bg-surface-header flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-text-muted hover:text-text-primary rounded-xl"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateGroup}
            disabled={submitting || !groupName.trim() || selectedUserIds.length === 0}
            className="flex items-center gap-2 px-5 py-2 bg-signal-blue hover:bg-signal-blue-hover disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-md transition-all"
          >
            {submitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Creating...</span>
              </>
            ) : (
              <span>Create Group</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
