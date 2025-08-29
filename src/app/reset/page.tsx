"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function ResetPasswordPage() {
  const params = useSearchParams();
  const router = useRouter();
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const t = params.get("token") || "";
    setToken(t);
  }, [params]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
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
        body: JSON.stringify({ token, newPassword }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Failed to reset password");
      setMessage("Password updated. Redirecting...");
      setTimeout(() => router.replace("/landing"), 1200);
    } catch (err: any) {
      setMessage(err?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[100dvh] flex items-center justify-center p-6">
      <section className="w-full max-w-md rounded-2xl border border-border bg-surface/70 backdrop-blur-md p-6 shadow-md">
        <h1 className="text-2xl font-semibold mb-2">Reset password</h1>
        <p className="text-sm text-muted-foreground mb-4">
          Enter your new password.
        </p>
        <form onSubmit={onSubmit} className="space-y-3">
          <input
            type="password"
            className="w-full border border-border bg-surface text-foreground p-2 rounded"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <input
            type="password"
            className="w-full border border-border bg-surface text-foreground p-2 rounded"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 rounded-md bg-primary text-on-primary disabled:opacity-70"
          >
            {loading ? "Resetting..." : "Reset password"}
          </button>
        </form>
        {message && (
          <p className="mt-3 text-sm text-foreground/80">{message}</p>
        )}
      </section>
    </main>
  );
}
