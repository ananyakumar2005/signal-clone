"use client";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";
import { api } from "@/lib/api";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { MessageList } from "@/components/chat/MessageList";
import { MessageInput } from "@/components/chat/MessageInput";
import { GroupInfoModal } from "@/components/modals/GroupInfoModal";
import { CallPlaceholderModal } from "@/components/modals/CallPlaceholderModal";
import { useWebSocket } from "@/hooks/useWebSocket";
import type { Message, Conversation } from "@/types";
import toast from "react-hot-toast";

export default function ActiveChatPage() {
  const params = useParams();
  const router = useRouter();
  const convId = Number(params?.id);

  const currentUser = useStore((state) => state.currentUser);
  const conversations = useStore((state) => state.conversations);
  const upsertConversation = useStore((state) => state.upsertConversation);
  const setActiveConvId = useStore((state) => state.setActiveConvId);
  const messagesMap = useStore((state) => state.messages);
  const setMessages = useStore((state) => state.setMessages);
  const appendMessage = useStore((state) => state.appendMessage);
  const replaceOptimistic = useStore((state) => state.replaceOptimistic);
  const clearUnread = useStore((state) => state.clearUnread);
  const typingState = useStore((state) => state.typing[convId]);

  const { sendTypingStart, sendTypingStop, sendReadReceipt } = useWebSocket();

  const [loading, setLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [callModal, setCallModal] = useState<{ open: boolean; type: "voice" | "video" }>({
    open: false,
    type: "voice",
  });

  // Current conversation object
  const conversation = useMemo(() => {
    return conversations.find((c) => c.id === convId);
  }, [conversations, convId]);

  // Load conversation & messages
  useEffect(() => {
    if (!convId || isNaN(convId)) {
      router.push("/chats");
      return;
    }

    setActiveConvId(convId);
    clearUnread(convId);

    // If conversation not in list yet, fetch it
    if (!conversation) {
      api
        .get<Conversation>(`/api/conversations/${convId}`)
        .then((res) => {
          upsertConversation(res.data);
        })
        .catch(() => {
          toast.error("Conversation not found");
          router.push("/chats");
        });
    }

    // Fetch messages
    setLoading(true);
    api
      .get<Message[]>(`/api/conversations/${convId}/messages?limit=100`)
      .then((res) => {
        setMessages(convId, res.data);
      })
      .catch((err) => {
        console.error("Failed to fetch messages:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [convId, router, setActiveConvId, clearUnread, setMessages, upsertConversation, conversation]);

  const messages = messagesMap[convId] || [];

  // Names of users typing in this conversation
  const typingNames = useMemo(() => {
    if (!typingState || typingState.size === 0 || !conversation) return [];
    const names: string[] = [];
    typingState.forEach((userId) => {
      if (userId !== currentUser?.id) {
        const member = conversation.members?.find((m) => m.user_id === userId);
        if (member) names.push(member.user.display_name);
      }
    });
    return names;
  }, [typingState, conversation, currentUser]);

  const handleSendMessage = async (content: string, replyToId?: number) => {
    if (!currentUser || !conversation) return;

    const tempId = -Date.now();
    const optimisticMsg: Message = {
      id: tempId,
      conversation_id: convId,
      sender_id: currentUser.id,
      sender: currentUser,
      content,
      message_type: "text",
      status: "sending",
      reply_to_id: replyToId || null,
      reply_to: replyingTo
        ? {
            id: replyingTo.id,
            content: replyingTo.content,
            sender_id: replyingTo.sender_id,
            sender_name: replyingTo.sender.display_name,
          }
        : null,
      is_deleted: false,
      created_at: new Date().toISOString(),
      _optimistic: true,
    };

    appendMessage(convId, optimisticMsg);

    try {
      const res = await api.post<Message>(
        `/api/conversations/${convId}/messages`,
        {
          content,
          message_type: "text",
          reply_to_id: replyToId || null,
        }
      );
      replaceOptimistic(convId, tempId, res.data);
      upsertConversation({ ...conversation, last_message: res.data });
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to send message");
    }
  };

  const handleMarkRead = useCallback(
    (messageIds: number[]) => {
      sendReadReceipt(messageIds);
    },
    [sendReadReceipt]
  );

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-signal-blue border-t-transparent animate-spin" />
      </div>
    );
  }

  const isGroup = conversation.type === "group";
  const peer = !isGroup
    ? conversation.members?.find((m) => m.user_id !== currentUser?.id)?.user
    : null;
  const targetName = isGroup
    ? conversation.group_name || "Group"
    : peer?.display_name || "Contact";

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-surface-chat">
      {/* Header */}
      <ChatHeader
        conversation={conversation}
        onOpenInfo={() => setIsInfoModalOpen(true)}
        onOpenCall={(type) => setCallModal({ open: true, type })}
      />

      {/* Messages */}
      <MessageList
        conversation={conversation}
        messages={messages}
        typingUserNames={typingNames}
        onReply={(msg) => setReplyingTo(msg)}
        onMarkRead={handleMarkRead}
        isLoading={loading}
      />

      {/* Message Input */}
      <MessageInput
        onSendMessage={handleSendMessage}
        onTypingStart={() => sendTypingStart(convId)}
        onTypingStop={() => sendTypingStop(convId)}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
      />

      {/* Info Modal */}
      <GroupInfoModal
        conversation={conversation}
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
      />

      {/* Simulated Call Modal */}
      <CallPlaceholderModal
        isOpen={callModal.open}
        type={callModal.type}
        name={targetName}
        avatarUrl={isGroup ? conversation.group_avatar : peer?.avatar_url}
        onClose={() => setCallModal({ open: false, type: "voice" })}
      />
    </div>
  );
}
