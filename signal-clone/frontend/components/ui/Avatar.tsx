"use client";
import { getInitials } from "@/lib/utils";

interface AvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  isOnline?: boolean;
  showOnlineStatus?: boolean;
  className?: string;
}

const COLOR_PALETTE = [
  "bg-blue-600",
  "bg-emerald-600",
  "bg-purple-600",
  "bg-indigo-600",
  "bg-amber-600",
  "bg-rose-600",
  "bg-teal-600",
  "bg-cyan-600",
];

function getColorForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % COLOR_PALETTE.length;
  return COLOR_PALETTE[index];
}

const SIZE_CLASSES = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
  xl: "w-16 h-16 text-xl",
};

const DOT_CLASSES = {
  sm: "w-2.5 h-2.5 bottom-0 right-0",
  md: "w-3 h-3 bottom-0 right-0",
  lg: "w-3.5 h-3.5 bottom-0.5 right-0.5",
  xl: "w-4 h-4 bottom-1 right-1",
};

export function Avatar({
  name,
  avatarUrl,
  size = "md",
  isOnline = false,
  showOnlineStatus = false,
  className = "",
}: AvatarProps) {
  const sizeClass = SIZE_CLASSES[size];
  const dotClass = DOT_CLASSES[size];
  const colorBg = getColorForName(name || "User");
  const initials = getInitials(name);

  return (
    <div className={`relative inline-block select-none flex-shrink-0 ${className}`}>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name}
          className={`${sizeClass} rounded-full object-cover ring-1 ring-border-subtle`}
        />
      ) : (
        <div
          className={`${sizeClass} rounded-full ${colorBg} text-white font-medium flex items-center justify-center shadow-inner`}
        >
          {initials}
        </div>
      )}

      {showOnlineStatus && (
        <span
          className={`absolute ${dotClass} rounded-full border-2 border-surface-sidebar ${
            isOnline ? "bg-emerald-500" : "bg-neutral-500"
          }`}
          title={isOnline ? "Online" : "Offline"}
        />
      )}
    </div>
  );
}
