// ─── Auth ──────────────────────────────────────────────────────────────────
export interface TokenResponse {
  access_token: string;
  token_type: string;
  user_id: number;
}

// ─── User ──────────────────────────────────────────────────────────────────
export interface User {
  id: number;
  phone: string;
  username: string | null;
  display_name: string;
  avatar_url: string | null;
  about: string;
  is_online: boolean;
  last_seen: string | null;
  created_at: string;
}

// ─── Contact ───────────────────────────────────────────────────────────────
export interface Contact {
  id: number;
  contact: User;
  nickname: string | null;
  added_at: string;
}

// ─── Conversation ──────────────────────────────────────────────────────────
export type ConversationType = "direct" | "group";

export interface ConversationMember {
  id: number;
  user_id: number;
  user: User;
  is_admin: boolean;
  joined_at: string;
}

export interface Conversation {
  id: number;
  type: ConversationType;
  group_name: string | null;
  group_avatar: string | null;
  created_by: number | null;
  created_at: string;
  members: ConversationMember[];
  last_message: Message | null;
  unread_count: number;
}

// ─── Message ───────────────────────────────────────────────────────────────
export type MessageStatus = "sending" | "sent" | "delivered" | "read";
export type MessageType = "text" | "image" | "file" | "system";

export interface MessageReplyPreview {
  id: number;
  content: string;
  sender_id: number;
  sender_name: string;
}

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  sender: User;
  content: string;
  message_type: MessageType;
  status: MessageStatus;
  reply_to_id: number | null;
  reply_to: MessageReplyPreview | null;
  is_deleted: boolean;
  created_at: string;
  // optimistic-only field
  _optimistic?: boolean;
}

// ─── WebSocket Events ──────────────────────────────────────────────────────
export type WSEvent =
  | { type: "message.new"; message: Message }
  | { type: "message.status"; message_id: number; status: MessageStatus }
  | { type: "typing.start"; conversation_id: number; user_id: number }
  | { type: "typing.stop"; conversation_id: number; user_id: number }
  | { type: "presence.update"; user_id: number; is_online: boolean; last_seen: string | null };
