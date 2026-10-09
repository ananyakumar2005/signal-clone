"use client";
import { create } from "zustand";
import type { User, Conversation, Message, WSEvent } from "@/types";

interface TypingState {
  [convId: number]: Set<number>; // convId → set of user_ids currently typing
}

interface AppState {
  // Auth
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;

  // Conversations
  conversations: Conversation[];
  setConversations: (convs: Conversation[]) => void;
  upsertConversation: (conv: Conversation) => void;
  activeConvId: number | null;
  setActiveConvId: (id: number | null) => void;

  // Messages: keyed by conversation_id
  messages: Record<number, Message[]>;
  setMessages: (convId: number, msgs: Message[]) => void;
  appendMessage: (convId: number, msg: Message) => void;
  updateMessageStatus: (convId: number, msgId: number, status: Message["status"]) => void;
  replaceOptimistic: (convId: number, tempId: number, real: Message) => void;

  // Presence: user_id → is_online
  presence: Record<number, { is_online: boolean; last_seen: string | null }>;
  updatePresence: (userId: number, isOnline: boolean, lastSeen: string | null) => void;

  // Typing
  typing: TypingState;
  setTyping: (convId: number, userId: number, isTyping: boolean) => void;

  // Unread counters
  incrementUnread: (convId: number) => void;
  clearUnread: (convId: number) => void;

  // Handle incoming WS events
  handleWSEvent: (event: WSEvent) => void;
}

export const useStore = create<AppState>((set, get) => ({
  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),

  conversations: [],
  setConversations: (convs) => set({ conversations: convs }),
  upsertConversation: (conv) =>
    set((state) => {
      const existing = state.conversations.find((c) => c.id === conv.id);
      if (existing) {
        return {
          conversations: state.conversations
            .map((c) => (c.id === conv.id ? conv : c))
            .sort((a, b) => {
              const at = a.last_message?.created_at ?? a.created_at;
              const bt = b.last_message?.created_at ?? b.created_at;
              return new Date(bt).getTime() - new Date(at).getTime();
            }),
        };
      }
      return { conversations: [conv, ...state.conversations] };
    }),
  activeConvId: null,
  setActiveConvId: (id) => set({ activeConvId: id }),

  messages: {},
  setMessages: (convId, msgs) =>
    set((state) => ({ messages: { ...state.messages, [convId]: msgs } })),
  appendMessage: (convId, msg) =>
    set((state) => {
      const current = state.messages[convId] ?? [];
      // Avoid duplicates
      if (current.find((m) => m.id === msg.id && !m._optimistic)) return state;
      return { messages: { ...state.messages, [convId]: [...current, msg] } };
    }),
  updateMessageStatus: (convId, msgId, status) =>
    set((state) => {
      const msgs = state.messages[convId] ?? [];
      return {
        messages: {
          ...state.messages,
          [convId]: msgs.map((m) => (m.id === msgId ? { ...m, status } : m)),
        },
      };
    }),
  replaceOptimistic: (convId, tempId, real) =>
    set((state) => {
      const msgs = state.messages[convId] ?? [];
      const idx = msgs.findIndex((m) => m.id === tempId && m._optimistic);
      if (idx === -1) return state;
      const updated = [...msgs];
      updated[idx] = real;
      return { messages: { ...state.messages, [convId]: updated } };
    }),

  presence: {},
  updatePresence: (userId, isOnline, lastSeen) =>
    set((state) => ({
      presence: { ...state.presence, [userId]: { is_online: isOnline, last_seen: lastSeen } },
    })),

  typing: {},
  setTyping: (convId, userId, isTyping) =>
    set((state) => {
      const current = new Set(state.typing[convId] ?? []);
      isTyping ? current.add(userId) : current.delete(userId);
      return { typing: { ...state.typing, [convId]: current } };
    }),

  incrementUnread: (convId) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === convId ? { ...c, unread_count: c.unread_count + 1 } : c
      ),
    })),
  clearUnread: (convId) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === convId ? { ...c, unread_count: 0 } : c
      ),
    })),

  handleWSEvent: (event) => {
    const state = get();
    switch (event.type) {
      case "message.new": {
        const msg = event.message;
        get().appendMessage(msg.conversation_id, msg);
        // Update conversation last_message
        const conv = state.conversations.find((c) => c.id === msg.conversation_id);
        if (conv) {
          get().upsertConversation({ ...conv, last_message: msg });
        }
        // Increment unread if not the active conversation
        if (state.activeConvId !== msg.conversation_id && msg.sender_id !== state.currentUser?.id) {
          get().incrementUnread(msg.conversation_id);
        }
        break;
      }
      case "message.status": {
        // Update status across all conversations (we don't know which one)
        for (const [convId, msgs] of Object.entries(state.messages)) {
          const found = msgs.find((m) => m.id === event.message_id);
          if (found) {
            get().updateMessageStatus(Number(convId), event.message_id, event.status);
            break;
          }
        }
        break;
      }
      case "typing.start":
        get().setTyping(event.conversation_id, event.user_id, true);
        break;
      case "typing.stop":
        get().setTyping(event.conversation_id, event.user_id, false);
        break;
      case "presence.update":
        get().updatePresence(event.user_id, event.is_online, event.last_seen);
        break;
    }
  },
}));
