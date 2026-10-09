import { format, isToday, isYesterday, formatDistanceToNow } from "date-fns";
import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/**
 * Format a message timestamp for the conversation list.
 * Today → "2:35 PM", Yesterday → "Yesterday", Older → "Mon" or "Jan 5"
 */
export function formatConvTime(dateStr: string): string {
  const date = new Date(dateStr);
  if (isToday(date)) return format(date, "h:mm a");
  if (isYesterday(date)) return "Yesterday";
  // Same week
  const daysDiff = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
  if (daysDiff < 7) return format(date, "EEE");
  return format(date, "MMM d");
}
export const formatConversationTime = formatConvTime;

/**
 * Format a message timestamp shown inside the chat pane.
 */
export function formatMsgTime(dateStr: string): string {
  return format(new Date(dateStr), "h:mm a");
}
export const formatMessageTime = formatMsgTime;

export function formatDateSeparator(dateStr: string): string {
  const date = new Date(dateStr);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMMM d, yyyy");
}

/**
 * Format last-seen for chat header.
 */
export function formatLastSeen(dateStr: string | null): string {
  if (!dateStr) return "last seen recently";
  return `last seen ${formatDistanceToNow(new Date(dateStr), { addSuffix: true })}`;
}

/**
 * Truncate text to a max length.
 */
export function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + "…";
}

/**
 * Get initials from a display name (for avatar fallback).
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * Group messages by date for date separator rendering.
 */
export function groupByDate<T extends { created_at: string }>(
  messages: T[]
): { date: string; messages: T[] }[] {
  const groups: { date: string; messages: T[] }[] = [];
  for (const msg of messages) {
    const dateLabel = isToday(new Date(msg.created_at))
      ? "Today"
      : isYesterday(new Date(msg.created_at))
      ? "Yesterday"
      : format(new Date(msg.created_at), "MMMM d, yyyy");

    const last = groups[groups.length - 1];
    if (last?.date === dateLabel) {
      last.messages.push(msg);
    } else {
      groups.push({ date: dateLabel, messages: [msg] });
    }
  }
  return groups;
}
