"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

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
        const resetUrl = typeof json.resetUrl === "string" ? json.resetUrl : null;
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
        <form
          onSubmit={onSubmit}
          className="space-y-4 flex flex-col items-center"
        >
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
            className="btn btn-primary px-8"
          >
            {loading ? "Sending..." : "Send reset link"}
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
