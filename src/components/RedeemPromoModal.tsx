"use client";
import { useEffect, useRef, useState } from "react";
import { useSidebar } from "@/app/sidebar-context";

export type RedeemPromoModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function RedeemPromoModal({
  open,
  onClose,
}: RedeemPromoModalProps) {
  const { setIsCollapsed } = useSidebar();
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open) {
      try {
        setIsCollapsed(true);
      } catch {}
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open, setIsCollapsed]);

  if (!open) return null;

  const onSubmit = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      setResult("Please enter a promo code.");
      return;
    }
    setSubmitting(true);
    setResult(null);
    try {
      const res = await fetch("/api/promo/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed }),
        credentials: "include",
      });
      const json = await res.json();
      if (res.status === 401) {
        setResult("Please sign in to redeem.");
        return;
      }
      if (!res.ok) {
        setResult(json?.error || "Invalid code");
      } else {
        const months = Number(json?.months || 0);
        setResult(
          months > 0
            ? `Code redeemed! ${months} month(s) added.`
            : "Code redeemed! Thank you."
        );
      }
    } catch {
      setResult("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        ref={containerRef}
        className="relative w-full sm:w-[420px] max-w-[92vw] bg-surface text-foreground border border-border rounded-2xl p-5 sm:p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="Redeem a Snap"
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
        <h2 className="text-xl font-semibold text-center">Redeem a Snap</h2>
        <p className="text-sm text-muted-foreground text-center mt-1">
          Enter your promo code to redeem.
        </p>

        <input
          type="text"
          placeholder="Promo code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="mt-4 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500"
        />

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
            className="w-full px-4 py-2 rounded-lg bg-sky-500 text-white shadow hover:shadow-md active:shadow-sm transition disabled:opacity-60"
            disabled={submitting}
            onClick={onSubmit}
          >
            {submitting ? "Checking..." : "Redeem"}
          </button>
        </div>
      </div>
    </div>
  );
}
