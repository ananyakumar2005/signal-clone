"use client";
import { useState } from "react";
import { useStore } from "@/store/useStore";
import { api } from "@/lib/api";
import { clearAuth } from "@/lib/auth";
import { Avatar } from "@/components/ui/Avatar";
import {
  X,
  User,
  Shield,
  Bell,
  Smartphone,
  Sparkles,
  LogOut,
  Save,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const router = useRouter();
  const currentUser = useStore((state) => state.currentUser);
  const setCurrentUser = useStore((state) => state.setCurrentUser);

  const [activeTab, setActiveTab] = useState<"profile" | "privacy" | "notifications" | "devices">("profile");
  const [displayName, setDisplayName] = useState(currentUser?.display_name || "");
  const [about, setAbout] = useState(currentUser?.about || "");
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSaveProfile = async () => {
    if (!displayName.trim()) {
      toast.error("Display name cannot be empty");
      return;
    }
    setSaving(true);
    try {
      const res = await api.patch("/api/users/me", {
        display_name: displayName.trim(),
        about: about.trim(),
      });
      setCurrentUser(res.data);
      toast.success("Profile updated");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    clearAuth();
    setCurrentUser(null);
    toast.success("Logged out");
    onClose();
    router.push("/login");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in select-none">
      <div className="bg-surface-card border border-border-subtle rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle bg-surface-header">
          <h3 className="text-base font-semibold text-text-primary">Settings</h3>
          <button
            onClick={onClose}
            className="p-1.5 text-text-muted hover:text-text-primary rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Sidebar tabs + Main area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Tabs Sidebar */}
          <div className="w-44 border-r border-border-subtle/50 bg-surface-sidebar p-2 space-y-1">
            <button
              onClick={() => setActiveTab("profile")}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                activeTab === "profile"
                  ? "bg-signal-blue text-white"
                  : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
              }`}
            >
              <User className="w-4 h-4" />
              <span>Profile</span>
            </button>
            <button
              onClick={() => setActiveTab("privacy")}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                activeTab === "privacy"
                  ? "bg-signal-blue text-white"
                  : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Privacy</span>
            </button>
            <button
              onClick={() => setActiveTab("notifications")}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                activeTab === "notifications"
                  ? "bg-signal-blue text-white"
                  : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>Notifications</span>
            </button>
            <button
              onClick={() => setActiveTab("devices")}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                activeTab === "devices"
                  ? "bg-signal-blue text-white"
                  : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Linked Devices</span>
            </button>

            <div className="pt-4 mt-4 border-t border-border-subtle/40">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </div>
          </div>

          {/* Main settings panel */}
          <div className="flex-1 overflow-y-auto p-5 text-text-primary">
            {activeTab === "profile" && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar
                    name={displayName || "User"}
                    avatarUrl={currentUser?.avatar_url}
                    size="lg"
                  />
                  <div>
                    <span className="text-xs text-text-muted block">Phone number</span>
                    <span className="text-sm font-semibold">{currentUser?.phone}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-input rounded-xl text-sm border border-border-subtle focus:border-signal-blue focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">
                    About / Bio
                  </label>
                  <input
                    type="text"
                    value={about}
                    onChange={(e) => setAbout(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-input rounded-xl text-sm border border-border-subtle focus:border-signal-blue focus:outline-none"
                  />
                </div>

                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-signal-blue hover:bg-signal-blue-hover text-white text-xs font-semibold rounded-xl shadow-md transition-colors"
                >
                  {saving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>Save Changes</span>
                </button>
              </div>
            )}

            {activeTab === "privacy" && (
              <div className="space-y-3 text-xs text-text-muted">
                <div className="p-3 bg-surface-sidebar rounded-xl border border-border-subtle/50">
                  <span className="text-text-primary font-medium block mb-1">
                    Read Receipts
                  </span>
                  <p>
                    If turned off, you won&apos;t see read receipts from others or share yours.
                  </p>
                  <span className="inline-block mt-2 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-mono">
                    ENABLED (Default)
                  </span>
                </div>

                <div className="p-3 bg-surface-sidebar rounded-xl border border-border-subtle/50">
                  <span className="text-text-primary font-medium block mb-1">
                    End-to-End Encryption
                  </span>
                  <p>
                    All messages are cryptographically sealed with the Signal Protocol.
                  </p>
                  <span className="inline-block mt-2 text-[10px] text-signal-blue bg-signal-blue/10 px-2 py-0.5 rounded font-mono">
                    SECURED
                  </span>
                </div>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="space-y-3 text-xs text-text-muted">
                <div className="p-4 bg-surface-sidebar rounded-xl border border-border-subtle/50 text-center">
                  <Bell className="w-6 h-6 text-signal-blue mx-auto mb-2" />
                  <span className="text-text-primary font-medium block mb-1">
                    In-App Audio & Banner Alerts
                  </span>
                  <p>
                    Notifications are enabled for all incoming direct and group messages.
                  </p>
                </div>
              </div>
            )}

            {activeTab === "devices" && (
              <div className="space-y-3 text-xs text-text-muted">
                <div className="p-6 bg-surface-sidebar rounded-xl border border-border-subtle/50 text-center">
                  <Sparkles className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                  <span className="text-text-primary font-semibold block text-sm mb-1">
                    Linked Devices (Coming Soon)
                  </span>
                  <p className="max-w-xs mx-auto">
                    Link Signal Desktop, iPad, or another companion device by scanning a QR code.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
