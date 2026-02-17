"use client";
import type { Metadata } from "next";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function ResetPasswordPage() {
  const params = useSearchParams();
  const router = useRouter();
  const [token, setToken] = useState("");
  const [supabaseAccessToken, setSupabaseAccessToken] = useState("");
  const [provider, setProvider] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const t = params.get("token") || "";
    const p = (params.get("provider") || "").trim().toLowerCase();
    setToken(t);
    setProvider(p);

    if (typeof window !== "undefined") {
      const hash = window.location.hash.startsWith("#")
        ? window.location.hash.slice(1)
        : window.location.hash;
      const hashParams = new URLSearchParams(hash);
      const at = hashParams.get("access_token") || "";
      if (at) setSupabaseAccessToken(at);
    }
  }, [params]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (provider === "supabase" && !supabaseAccessToken) {
      setMessage("Supabase reset session is missing or expired. Please request a new reset link.");
      return;
    }
    if (provider !== "supabase" && !token) {
      setMessage("Reset token is missing");
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: provider === "supabase" ? "" : token,
          supabaseAccessToken: provider === "supabase" ? supabaseAccessToken : "",
          newPassword,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Failed to reset password");
      setMessage("Password updated. Redirecting...");
      setTimeout(() => router.replace("/"), 1200);
    } catch (err: any) {
      setMessage(err?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[100dvh] flex items-center justify-center p-6 bg-[#F8F5FF]">
      <section className="w-full max-w-md rounded-2xl bg-white/80 backdrop-blur-lg border border-white/60 p-8 shadow-xl">
        <Link href="/" className="mb-6 block text-center">
          <Image
            src="/navElogo.png"
            alt="Envitefy logo"
            width={156}
            height={64}
            priority
            className="mx-auto"
          />
        </Link>
        <p className="text-sm text-muted-foreground text-center mb-6">
          From papers to reminders.
        </p>
        <h1 className="text-2xl font-semibold mb-2 text-foreground">
          Reset password
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          Enter your new password.
        </p>
        <form onSubmit={onSubmit} className="space-y-4">
          <input
            name="newPassword"
            type="password"
            autoComplete="new-password"
            className="w-full rounded-xl border border-border/80 bg-white/80 px-4 py-3 text-sm text-foreground/90 shadow-inner focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)] transition"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <input
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            className="w-full rounded-xl border border-border/80 bg-white/80 px-4 py-3 text-sm text-foreground/90 shadow-inner focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)] transition"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full justify-center"
          >
            {loading ? "Resetting..." : "Reset password"}
          </button>
        </form>
        {message && (
          <p className="mt-4 text-sm text-muted-foreground">{message}</p>
        )}
      </section>
    </main>
  );
}
