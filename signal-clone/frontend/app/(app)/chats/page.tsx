"use client";
import { MessageSquare, ShieldCheck } from "lucide-react";

export default function ChatsPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none bg-surface-chat">
      <div className="flex flex-col items-center max-w-sm">
        <div className="w-20 h-20 rounded-3xl bg-surface-card border border-border-subtle flex items-center justify-center shadow-inner mb-6 text-signal-blue">
          <MessageSquare className="w-10 h-10" />
        </div>

        <h2 className="text-xl font-bold text-text-primary mb-2">
          Signal Messenger
        </h2>

        <p className="text-xs text-text-muted leading-relaxed mb-6">
          Select a chat from the left sidebar to start messaging, or click the compose button to start a new encrypted conversation.
        </p>

        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-card border border-border-subtle text-[11px] text-text-muted">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>End-to-End Encrypted</span>
        </div>
      </div>
    </div>
  );
}
