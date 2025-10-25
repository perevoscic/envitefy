"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import SignupBuilder from "@/components/smart-signup-form/SignupBuilder";
import SmartSignupWizard from "@/components/smart-signup-form/Wizard";
import type { SignupForm } from "@/types/signup";
import { createDefaultSignupForm, sanitizeSignupForm } from "@/utils/signup";

export default function SmartSignupFormPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<SignupForm>(() => createDefaultSignupForm());
  const [duplicateInfo, setDuplicateInfo] = useState<{
    originalTitle: string;
  } | null>(null);

  useEffect(() => {
    const isDuplicate = searchParams?.get("duplicate") === "1";
    if (!isDuplicate) {
      setForm(createDefaultSignupForm());
      return;
    }
    try {
      const raw = sessionStorage.getItem("snapmydate:signup-duplicate");
      if (!raw) {
        setForm(createDefaultSignupForm());
        return;
      }
      const parsed = JSON.parse(raw) as {
        originalTitle?: string;
        dataCopy?: any;
      };
      const signup = parsed?.dataCopy?.signupForm as SignupForm | undefined;
      if (signup && typeof signup === "object") {
        setForm(sanitizeSignupForm({ ...(signup as any), enabled: true }));
        setDuplicateInfo({
          originalTitle: parsed?.originalTitle || "this form",
        });
      } else {
        setForm(createDefaultSignupForm());
      }
    } catch {
      setForm(createDefaultSignupForm());
    }
  }, [searchParams]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      if (id) router.push(`/smart-signup-form/${id}?created=1`);
    } catch (err: any) {
      alert(String(err?.message || err || "Failed to create sign-up"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Create a Smart sign-up</h1>
      </header>
      {duplicateInfo && (
        <div className="rounded-md border border-border bg-surface px-3 py-2 text-sm">
          This is a duplicate of "{duplicateInfo.originalTitle}".
        </div>
      )}
      <SmartSignupWizard
        form={form}
        onChange={setForm}
        onSubmit={submit}
        submitting={submitting}
      />
    </main>
  );
}
