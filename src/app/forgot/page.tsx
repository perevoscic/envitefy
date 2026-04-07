"use client";
import { useState } from "react";
import Link from "next/link";
import EnvitefyWordmark from "@/components/branding/EnvitefyWordmark";

type ForgotPasswordResult = {
  kind: "success" | "warning" | "error";
  text: string;
  hint?: string | null;
  resetUrl?: string | null;
};

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ForgotPasswordResult | null>(null);
  const isNonProd = process.env.NODE_ENV !== "production";

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const contentType = res.headers.get("content-type") || "";
      const isJson = contentType.toLowerCase().includes("application/json");
      const json = isJson ? await res.json().catch(() => ({})) : {};
      const text = isJson ? "" : await res.text().catch(() => "");
      if (!res.ok) {
        throw new Error(
          (typeof json.error === "string" && json.error) ||
            (text || "").trim() ||
            "Failed to send reset email"
        );
      }

      if (json.emailSent === false) {
        const resetUrl =
          typeof json.resetUrl === "string" ? json.resetUrl : null;
        const hint = isNonProd
          ? typeof json.reason === "string" && json.reason.trim().length > 0
            ? `Diagnostic: ${json.reason}`
            : "Diagnostic: reset email was not delivered. Check local email provider configuration and server logs."
          : null;

        setResult({
          kind: "warning",
          text: resetUrl
            ? "Reset email was not delivered, but a development reset link is available below."
            : "No reset email was sent for this request.",
          hint,
          resetUrl,
        });
        return;
      }

      setResult({
        kind: "success",
        text: "If an account exists, a reset link has been sent.",
      });
    } catch (err: any) {
      setResult({
        kind: "error",
        text: err?.message || "Failed to send reset email",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="font-vars min-h-[100dvh] flex items-center justify-center p-6 bg-[#F3F0FA]">
      <section className="w-full max-w-md rounded-2xl border border-[#E8E0EF] bg-white p-8 shadow-[0_20px_50px_rgba(87,67,157,0.08)]">
        <Link
          href="/landing"
          className="mb-8 flex justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6b3cff]/40 focus-visible:ring-offset-2 rounded-lg"
        >
          <EnvitefyWordmark
            scaled={false}
            className="text-[4.35rem] sm:text-[4.65rem]"
          />
        </Link>
        <h1
          className="mb-2 text-center text-[1.65rem] font-bold tracking-tight text-[#1a1a1a] sm:text-[1.75rem]"
          style={{
            fontFamily:
              'var(--font-playfair), Georgia, "Times New Roman", serif',
          }}
        >
          Forgot password
        </h1>
        <p className="mb-6 text-center text-sm leading-relaxed text-[#6A5549]">
          Enter your email to receive a reset link.
        </p>
        <form onSubmit={onSubmit} className="space-y-4">
          <input
            name="email"
            type="email"
            autoComplete="email"
            className="w-full rounded-xl border border-[#D9C5B8] bg-[#FBF7F2] px-4 py-3 text-sm text-[#2B1B16] placeholder:text-[#6A5549]/70 focus:border-[#6b3cff]/45 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6b3cff]/25 transition"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-[#6b3cff] px-6 py-3 text-sm font-bold uppercase tracking-wide text-white shadow-[0_10px_28px_rgba(107,60,255,0.38)] transition hover:bg-[#5b32e0] hover:shadow-[0_12px_32px_rgba(107,60,255,0.42)] disabled:pointer-events-none disabled:opacity-60"
          >
            {loading ? "Sending…" : "Send reset link"}
          </button>
        </form>
        {result && (
          <div
            className={`mt-4 rounded-xl border p-3 text-sm ${
              result.kind === "error"
                ? "border-red-300 bg-red-50 text-red-800"
                : result.kind === "warning"
                ? "border-amber-300 bg-amber-50 text-amber-800"
                : "border-emerald-300 bg-emerald-50 text-emerald-800"
            }`}
          >
            <p className="break-all">{result.text}</p>
            {result.resetUrl && (
              <p className="mt-2 break-all">
                <span className="font-medium">Reset link (dev): </span>
                <a
                  href={result.resetUrl}
                  className="underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  {result.resetUrl}
                </a>
              </p>
            )}
            {result.hint && (
              <p className="mt-2 text-xs opacity-90">{result.hint}</p>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
