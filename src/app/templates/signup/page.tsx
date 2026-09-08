"use client";
import { useTemplateEditor, useTemplateState } from "@/components/templates/TemplateEditorContext";
import { getPublicTemplate } from "@/lib/public-template-catalog";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SmartSignupWizard from "@/components/smart-signup-form/Wizard";
import type { SignupForm } from "@/types/signup";
import { createDefaultSignupForm, sanitizeSignupForm } from "@/utils/signup";

export default function SignupTemplatesPage() {
  const router = useRouter();
  const templateEditor = useTemplateEditor();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useTemplateState<SignupForm>("form", () => { const form = createDefaultSignupForm(); const template = templateEditor ? getPublicTemplate("signup-forms", templateEditor.templateId) : null; if (template) { form.title = template.name; form.header = { ...form.header, templateId: "header-1", backgroundImage: { name: template.name, type: "image/webp", dataUrl: template.heroImage } }; } return form; });

  useEffect(() => {
    if (!templateEditor) setForm(createDefaultSignupForm());
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (templateEditor && !templateEditor.authenticated) { await templateEditor.requestSave(); return; }
    try {
      setSubmitting(true);
      const sanitized = sanitizeSignupForm({ ...form, enabled: true });
      const payload = {
        title: form.title?.trim() || "Smart sign-up",
        data: { signupForm: sanitized },
      } as any;
      if (templateEditor) { await templateEditor.persist(payload, "published"); return; }
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
        <h1 className="text-lg font-semibold">Signup templates</h1>
      </header>
      <SmartSignupWizard
        form={form}
        onChange={setForm}
        onSubmit={submit}
        submitting={submitting}
      />
    </main>
  );
}
