"use client";
import type { Metadata } from "next";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

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
        <h1 className="text-2xl font-semibold mb-2 text-foreground">
          Forgot password
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          Enter your email to receive a reset link.
        </p>
        <form onSubmit={onSubmit} className="space-y-4">
          <input
            name="email"
            type="email"
            autoComplete="email"
            className="w-full rounded-xl border border-border/80 bg-white/80 px-4 py-3 text-sm text-foreground/90 shadow-inner focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)] transition"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary justify-center"
          >
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </form>
        {message && (
          <p className="mt-4 text-sm text-muted-foreground break-all">
            {message}
          </p>
        )}
      </section>
    </main>
  );
}
