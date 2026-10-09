"use client";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export function SearchBar({
  value,
  onChange,
  placeholder = "Search chats or contacts",
}: SearchBarProps) {
  return (
    <div className="relative flex items-center w-full px-3 py-2">
      <Search className="absolute left-6 w-4 h-4 text-text-muted pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-8 py-1.5 bg-surface-input hover:bg-neutral-800/80 focus:bg-surface-input text-sm text-text-primary placeholder-text-muted rounded-lg border border-transparent focus:border-signal-blue/50 focus:outline-none transition-all duration-150"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-5 p-1 text-text-muted hover:text-text-primary rounded-full"
          title="Clear search"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
