"use client";
import { Phone, Video, PhoneOff, X } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";

interface CallPlaceholderModalProps {
  isOpen: boolean;
  type: "voice" | "video";
  name: string;
  avatarUrl?: string | null;
  onClose: () => void;
}

export function CallPlaceholderModal({
  isOpen,
  type,
  name,
  avatarUrl,
  onClose,
}: CallPlaceholderModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in select-none">
      <div className="bg-surface-card border border-border-subtle rounded-3xl w-full max-w-sm shadow-2xl p-6 flex flex-col items-center text-center">
        <button
          onClick={onClose}
          className="self-end p-1.5 text-text-muted hover:text-text-primary rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="my-6">
          <Avatar name={name} avatarUrl={avatarUrl} size="xl" className="ring-4 ring-signal-blue/20" />
        </div>

        <h3 className="text-lg font-bold text-text-primary">{name}</h3>
        <p className="text-xs text-signal-blue font-medium mt-1 animate-pulse">
          Signal {type === "video" ? "Video" : "Voice"} Call (Simulated)...
        </p>

        <p className="text-[11px] text-text-muted mt-4 bg-surface-sidebar p-3 rounded-xl border border-border-subtle/40">
          🔒 End-to-end encrypted WebRTC audio/video call simulation. Full calling support is currently in development.
        </p>

        <div className="mt-8 flex items-center gap-6">
          <button
            onClick={onClose}
            className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-105"
            title="End Call"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
