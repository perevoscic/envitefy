"use client";
import { useEffect, useRef, useState } from "react";

export type GiftSnapModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function GiftSnapModal({ open, onClose }: GiftSnapModalProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [quantity, setQuantity] = useState<number>(3);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const onSubmit = async () => {
    const fullName =
      `${firstName}`.trim() + (lastName.trim() ? ` ${lastName.trim()}` : "");
    if (!firstName.trim() || !lastName.trim()) {
      setResult("Please enter first and last name.");
      return;
    }
    const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim());
    if (!emailOk) {
      setResult("Please enter a valid email.");
      return;
    }
    if (!Number.isFinite(quantity) || quantity <= 0) {
      setResult("Please enter a valid quantity.");
      return;
    }
    if (!message.trim()) {
      setResult("Please enter a message.");
      return;
    }
    setSubmitting(true);
    setResult(null);
    try {
      const res = await fetch("/api/promo/gift", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantity: Math.round(quantity),
          period: "months",
          recipientName: fullName,
          recipientEmail: email.trim(),
          message,
        }),
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok) {
        setResult(json?.error || "Failed to create gift");
      } else {
        setResult(`Gift created. Code: ${json?.promo?.code || "-"}`);
      }
    } catch (err: any) {
      setResult("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // months only now

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        ref={containerRef}
        className="relative w-full sm:w-[560px] max-w-[92vw] bg-surface text-foreground border border-border rounded-2xl p-5 sm:p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="Gift a Snap"
      >
        <button
          aria-label="Close"
          onClick={onClose}
          className="!absolute top-2 right-2 sm:top-3 sm:right-3 inline-flex items-center justify-center h-8 w-8 rounded-2xl border border-border text-foreground/80 hover:text-foreground hover:bg-surface/70 z-10"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <h2 className="text-xl font-semibold text-center">Gift a Snap</h2>
        <p className="text-sm text-muted-foreground text-center mt-1">
          Enter recipient details and choose how many months to gift. We'll
          generate a redeemable promo code.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500"
            />
            <input
              type="text"
              placeholder="Last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
          <input
            type="email"
            placeholder="Recipient email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500"
          />
          <div className="grid grid-cols-1 gap-3 items-center">
            <select
              value={quantity}
              onChange={(e) =>
                setQuantity(Math.floor(Number(e.target.value) || 3))
              }
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500"
            >
              {[3, 6, 12, 24].map((m) => (
                <option key={m} value={m}>
                  {m} months
                </option>
              ))}
            </select>
          </div>
          <textarea
            placeholder="Add a message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        {result && (
          <div className="mt-3 text-center text-xs text-muted-foreground">
            {result}
          </div>
        )}

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            className="w-full px-4 py-2 rounded-lg bg-surface text-foreground border border-border hover:bg-surface/80"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="w-full px-4 py-2 rounded-lg bg-emerald-500 text-white shadow hover:shadow-md active:shadow-sm transition disabled:opacity-60"
            disabled={submitting}
            onClick={onSubmit}
          >
            {submitting ? "Snapping..." : "Snap the Gift"}
          </button>
        </div>
      </div>
    </div>
  );
}
