"use client";
import type { Metadata } from "next";
import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Failed to send reset email");
      setMessage(
        json.resetUrl
          ? `Reset link (dev): ${json.resetUrl}`
          : "If an account exists, a reset link has been sent."
      );
    } catch (err: any) {
      setMessage(err?.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[100dvh] flex items-center justify-center p-6">
      <section className="w-full max-w-md rounded-2xl border border-border bg-surface/70 backdrop-blur-md p-6 shadow-md">
        <Link href="/" className="mb-2 block text-center">
          <h2 className="text-xl md:text-2xl font-semibold">
            <span className="font-pacifico">Snap</span>
            <span> </span>
            <span className="font-montserrat">My Date</span>
          </h2>
        </Link>
        <p className="text-sm text-foreground/70 text-center mb-2">
          From papers to reminders.
        </p>
        <h1 className="text-2xl font-semibold mb-2">Forgot password</h1>
        <p className="text-sm text-muted-foreground mb-4">
          Enter your email to receive a reset link.
        </p>
        <form onSubmit={onSubmit} className="space-y-3">
          <input
            name="email"
            type="email"
            autoComplete="email"
            className="w-full border border-border bg-surface text-foreground p-2 rounded"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 rounded-md bg-primary text-on-primary disabled:opacity-70"
          >
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </form>
        {message && (
          <p className="mt-3 text-sm text-foreground/80 break-all">{message}</p>
        )}
      </section>
    </main>
  );
}
