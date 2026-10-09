"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { saveAuth } from "@/lib/auth";
import { useStore } from "@/store/useStore";
import { MessageSquare, ShieldCheck, ArrowRight, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";
import type { TokenResponse, User } from "@/types";

export default function RegisterPage() {
  const router = useRouter();
  const setCurrentUser = useStore((state) => state.setCurrentUser);

  const [phone, setPhone] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [otp, setOtp] = useState("123456");
  const [about, setAbout] = useState("Hey there! I am using Signal.");
  const [step, setStep] = useState<"phone" | "profile">("phone");
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      toast.error("Please enter a phone number");
      return;
    }
    setLoading(true);
    try {
      await api.post("/api/auth/send-otp", { phone: phone.trim() });
      toast.success("Verification code sent! (Use 123456)");
      setStep("profile");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to send code");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      toast.error("Please enter your display name");
      return;
    }
    if (!otp.trim()) {
      toast.error("Please enter the 6-digit OTP");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post<TokenResponse>("/api/auth/register", {
        phone: phone.trim(),
        otp: otp.trim(),
        display_name: displayName.trim(),
        about: about.trim(),
      });

      const userRes = await api.get<User>("/api/auth/me", {
        headers: { Authorization: `Bearer ${res.data.access_token}` },
      });

      saveAuth(res.data.access_token, userRes.data);
      setCurrentUser(userRes.data);
      toast.success("Account created successfully!");
      router.push("/chats");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#121416] text-text-primary selection:bg-signal-blue selection:text-white">
      <div className="w-full max-w-md bg-surface-card border border-border-subtle rounded-3xl p-8 shadow-2xl">
        {/* Signal Branding */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-signal-blue flex items-center justify-center shadow-lg shadow-signal-blue/25 mb-4">
            <MessageSquare className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Create your Profile</h1>
          <p className="text-xs text-text-muted mt-1.5 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Signal is private. Your profile is encrypted.</span>
          </p>
        </div>

        {step === "phone" ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                Phone Number
              </label>
              <input
                type="text"
                autoFocus
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 555-0199"
                className="w-full px-4 py-3 bg-surface-input text-white placeholder-text-muted rounded-xl text-base border border-border-subtle focus:border-signal-blue focus:ring-1 focus:ring-signal-blue focus:outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-signal-blue hover:bg-signal-blue-hover text-white font-semibold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Next</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleCompleteRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                Display Name
              </label>
              <input
                type="text"
                autoFocus
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your Name"
                className="w-full px-4 py-2.5 bg-surface-input text-white placeholder-text-muted rounded-xl text-sm border border-border-subtle focus:border-signal-blue focus:ring-1 focus:ring-signal-blue focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                Verification Code
              </label>
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                className="w-full px-4 py-2.5 bg-surface-input text-white placeholder-text-muted rounded-xl text-sm font-mono tracking-widest border border-border-subtle focus:border-signal-blue focus:ring-1 focus:ring-signal-blue focus:outline-none"
              />
              <span className="block text-[11px] text-text-muted mt-1">Mock OTP is 123456</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                About (optional)
              </label>
              <input
                type="text"
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                placeholder="About status"
                className="w-full px-4 py-2.5 bg-surface-input text-white placeholder-text-muted rounded-xl text-sm border border-border-subtle focus:border-signal-blue focus:ring-1 focus:ring-signal-blue focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-signal-blue hover:bg-signal-blue-hover text-white font-semibold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <span>Complete Registration</span>
              )}
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-xs text-text-muted">
          Already registered?{" "}
          <Link href="/login" className="text-signal-blue hover:underline font-semibold">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
