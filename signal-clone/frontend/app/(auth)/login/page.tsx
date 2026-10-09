"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { saveAuth } from "@/lib/auth";
import { useStore } from "@/store/useStore";
import { MessageSquare, ShieldCheck, ArrowRight, Loader2, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";
import type { TokenResponse, User } from "@/types";

export default function LoginPage() {
  const router = useRouter();
  const setCurrentUser = useStore((state) => state.setCurrentUser);

  const [phone, setPhone] = useState("+1-555-0101");
  const [otp, setOtp] = useState("123456");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!phone.trim()) {
      toast.error("Enter a valid phone number");
      return;
    }
    setLoading(true);
    try {
      await api.post("/api/auth/send-otp", { phone: phone.trim() });
      toast.success("Verification code sent! (Use 123456)");
      setStep("otp");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to send code");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!otp.trim()) {
      toast.error("Please enter the 6-digit OTP");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post<TokenResponse>("/api/auth/login", {
        phone: phone.trim(),
        otp: otp.trim(),
      });

      // Get user profile
      const userRes = await api.get<User>("/api/auth/me", {
        headers: { Authorization: `Bearer ${res.data.access_token}` },
      });

      saveAuth(res.data.access_token, userRes.data);
      setCurrentUser(userRes.data);
      toast.success(`Welcome back, ${userRes.data.display_name}!`);
      router.push("/chats");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Invalid code or user not found");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (demoPhone: string) => {
    setLoading(true);
    try {
      await api.post("/api/auth/send-otp", { phone: demoPhone });
      const res = await api.post<TokenResponse>("/api/auth/login", {
        phone: demoPhone,
        otp: "123456",
      });
      const userRes = await api.get<User>("/api/auth/me", {
        headers: { Authorization: `Bearer ${res.data.access_token}` },
      });

      saveAuth(res.data.access_token, userRes.data);
      setCurrentUser(userRes.data);
      toast.success(`Signed in as ${userRes.data.display_name}!`);
      router.push("/chats");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed demo login");
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
          <h1 className="text-2xl font-bold tracking-tight">Signal Messenger</h1>
          <p className="text-xs text-text-muted mt-1.5 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Say &quot;hello&quot; to a privacy-first messaging experience</span>
          </p>
        </div>

        {/* Auth Steps */}
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
                placeholder="+1 555-0101"
                className="w-full px-4 py-3 bg-surface-input rounded-xl text-base border border-border-subtle focus:border-signal-blue focus:outline-none transition-all"
              />
              <span className="block text-[11px] text-text-muted mt-1.5">
                Include country code. Real phone verification is simulated.
              </span>
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
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                Enter 6-digit Code for {phone}
              </label>
              <input
                type="text"
                autoFocus
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                className="w-full px-4 py-3 bg-surface-input rounded-xl text-center tracking-[0.5em] text-xl font-mono border border-border-subtle focus:border-signal-blue focus:outline-none transition-all"
              />
              <div className="flex items-center justify-between text-[11px] text-text-muted mt-2">
                <span>Mock fixed OTP is 123456</span>
                <button
                  type="button"
                  onClick={() => setStep("phone")}
                  className="text-signal-blue hover:underline"
                >
                  Edit number
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-signal-blue hover:bg-signal-blue-hover text-white font-semibold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <span>Verify &amp; Sign In</span>
              )}
            </button>
          </form>
        )}

        {/* 1-Click Quick Demo Sign In */}
        <div className="mt-6 pt-6 border-t border-border-subtle">
          <p className="text-xs font-semibold text-text-muted text-center mb-3 uppercase tracking-wider flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>1-Click Demo Profiles</span>
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickDemo("+1-555-0101")}
              className="px-3 py-2 bg-surface-sidebar hover:bg-surface-hover border border-border-subtle rounded-xl text-xs font-medium text-text-primary text-center transition-colors"
            >
              Alice (+1-555-0101)
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickDemo("+1-555-0102")}
              className="px-3 py-2 bg-surface-sidebar hover:bg-surface-hover border border-border-subtle rounded-xl text-xs font-medium text-text-primary text-center transition-colors"
            >
              Bob (+1-555-0102)
            </button>
          </div>
        </div>

        {/* Switch to Register */}
        <div className="mt-6 text-center text-xs text-text-muted">
          New to Signal?{" "}
          <Link href="/register" className="text-signal-blue hover:underline font-semibold">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
