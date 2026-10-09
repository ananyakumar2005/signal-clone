"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";
import { getToken, getUser } from "@/lib/auth";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { AddContactModal } from "@/components/modals/AddContactModal";
import { NewGroupModal } from "@/components/modals/NewGroupModal";
import { SettingsModal } from "@/components/modals/SettingsModal";
import { useWebSocket } from "@/hooks/useWebSocket";
import type { Conversation, User } from "@/types";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const currentUser = useStore((state) => state.currentUser);
  const setCurrentUser = useStore((state) => state.setCurrentUser);
  const setConversations = useStore((state) => state.setConversations);

  const [initializing, setInitializing] = useState(true);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [isNewGroupOpen, setIsNewGroupOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Initialize WebSocket connection
  useWebSocket();

  useEffect(() => {
    const token = getToken();
    const storedUser = getUser();

    if (!token) {
      router.push("/login");
      return;
    }

    if (storedUser && !currentUser) {
      setCurrentUser(storedUser);
    }

    // Refresh profile and conversations
    api
      .get<User>("/api/auth/me")
      .then((res) => {
        setCurrentUser(res.data);
      })
      .catch(() => {
        router.push("/login");
      })
      .finally(() => {
        setInitializing(false);
      });

    setConversationsLoading(true);
    api
      .get<Conversation[]>("/api/conversations")
      .then((res) => {
        setConversations(res.data);
      })
      .catch(console.error)
      .finally(() => {
        setConversationsLoading(false);
      });
  }, [router, setCurrentUser, setConversations]);

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-chat">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-signal-blue border-t-transparent animate-spin" />
          <span className="text-xs text-text-muted">Loading Signal...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-surface-chat text-text-primary">
      {/* Left Sidebar */}
      <Sidebar
        onOpenNewChat={() => setIsAddContactOpen(true)}
        onOpenNewGroup={() => setIsNewGroupOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isLoading={conversationsLoading}
      />

      {/* Right Chat Pane / Active View */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-surface-chat relative">
        {children}
      </main>

      {/* Modals */}
      <AddContactModal
        isOpen={isAddContactOpen}
        onClose={() => setIsAddContactOpen(false)}
      />
      <NewGroupModal
        isOpen={isNewGroupOpen}
        onClose={() => setIsNewGroupOpen(false)}
      />
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
