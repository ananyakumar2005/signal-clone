"use client";

interface BadgeProps {
  count: number;
  className?: string;
}

export function Badge({ count, className = "" }: BadgeProps) {
  if (count <= 0) return null;

  return (
    <span
      className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-semibold text-white bg-signal-blue rounded-full shadow-sm animate-pulse-once ${className}`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
