"use client";

interface TypingIndicatorProps {
  names: string[];
}

export function TypingIndicator({ names }: TypingIndicatorProps) {
  if (names.length === 0) return null;

  const text =
    names.length === 1
      ? `${names[0]} is typing...`
      : names.length === 2
      ? `${names[0]} and ${names[1]} are typing...`
      : "Several people are typing...";

  return (
    <div className="flex items-center gap-2 px-4 py-1 text-xs text-text-muted select-none animate-fade-in">
      <div className="flex items-center gap-1 bg-[#25282c] px-2.5 py-1.5 rounded-full border border-border-subtle/40">
        <span className="w-1.5 h-1.5 bg-signal-blue rounded-full animate-bounce [animation-delay:-0.3s]" />
        <span className="w-1.5 h-1.5 bg-signal-blue rounded-full animate-bounce [animation-delay:-0.15s]" />
        <span className="w-1.5 h-1.5 bg-signal-blue rounded-full animate-bounce" />
      </div>
      <span className="text-[11px] italic">{text}</span>
    </div>
  );
}
