"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SignupBuilder from "@/components/signup/SignupBuilder";
import type { SignupForm } from "@/types/signup";
import { createDefaultSignupForm, sanitizeSignupForm } from "@/utils/signup";

export default function SmartSignupModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [enabled, setEnabled] = useState<boolean>(true);
  const [form, setForm] = useState<SignupForm>(() => createDefaultSignupForm());

  useEffect(() => {
    if (open) {
      setEnabled(true);
      setForm(createDefaultSignupForm());
    }
  }, [open]);

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enabled) {
      alert("Enable the Smart sign-up form to continue.");
      return;
    }
    try {
      setSubmitting(true);
      const sanitized = sanitizeSignupForm({ ...form, enabled: true });
      const payload = {
        title: form.title?.trim() || "Smart sign-up",
        data: {
          signupForm: sanitized,
        },
      } as any;
      const res = await fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to create sign-up");
      const row = (await res.json().catch(() => ({}))) as { id?: string };
      const id = row?.id;
      if (id) router.push(`/event/${id}?created=1`);
      onClose();
    } catch (err: any) {
      alert(String(err?.message || err || "Failed to create sign-up"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={() => !submitting && onClose()}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative z-50 w-full sm:max-w-2xl sm:rounded-xl bg-surface border border-border shadow-xl sm:mx-auto max-h-[calc(100vh-2rem)] flex flex-col min-h-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 sm:px-5 pt-4 sm:pt-5 pb-3 sm:pb-4">
          <h3 className="text-base sm:text-lg font-semibold">
            New Smart sign-up
          </h3>
          <button
            type="button"
            onClick={() => !submitting && onClose()}
            className="text-foreground/70 hover:text-foreground"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <form
          className="flex-1 px-4 sm:px-5 pb-4 sm:pb-5 pt-1 space-y-3 overflow-y-auto min-h-0"
          onSubmit={submit}
        >
          <SignupBuilder
            enabled={enabled}
            form={form}
            onEnabledChange={(next) => setEnabled(next)}
            onChange={setForm}
          />

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => !submitting && onClose()}
              className="px-3 py-2 rounded-md border border-border bg-background text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-3 py-2 rounded-md bg-primary text-white text-sm disabled:opacity-70"
            >
              {submitting ? "Creating…" : "Create sign-up"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
