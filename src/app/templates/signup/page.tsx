"use client";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import SmartSignupWizard from "@/components/smart-signup-form/Wizard";
import LegacyTemplateDraftButton from "@/components/templates/LegacyTemplateDraftButton";
import { useTemplateEditor, useTemplateState } from "@/components/templates/TemplateEditorContext";
import { getPublicTemplate } from "@/lib/public-template-catalog";
import { createSignupTemplateForm } from "@/lib/signup-starters";
import { buildTemplateDraftPayload } from "@/lib/template-draft-payload";
import type { SignupForm } from "@/types/signup";
import { createDefaultSignupForm, sanitizeSignupForm } from "@/utils/signup";

export default function SignupTemplatesPage() {
  const router = useRouter();
  const templateEditor = useTemplateEditor();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useTemplateState<SignupForm>("form", () => {
    const template = templateEditor
      ? getPublicTemplate("signup-forms", templateEditor.templateId)
      : null;
    return template ? createSignupTemplateForm(template) : createDefaultSignupForm();
  });

  useEffect(() => {
    if (!templateEditor) setForm(createDefaultSignupForm());
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (templateEditor && !templateEditor.authenticated) {
      await templateEditor.requestSave();
      return;
    }
    try {
      setSubmitting(true);
      const sanitized = sanitizeSignupForm({
        ...form,
        timezone: form.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        enabled: form.enabled,
      });
      const payload = buildTemplateDraftPayload(
        { form: JSON.parse(JSON.stringify(sanitized)) },
        "signup-forms",
        form.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      );
      if (templateEditor) {
        await templateEditor.persist(payload, "published");
        return;
      }
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
    } catch (err) {
      throw err instanceof Error ? err : new Error("Failed to create signup");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-sm font-semibold uppercase tracking-widest text-stone-500">
          Your signup page
        </h1>
      </header>
      {!templateEditor && (
        <LegacyTemplateDraftButton
          category="signup-forms"
          snapshot={{ form }}
          disabled={submitting}
        />
      )}
      <SmartSignupWizard form={form} onChange={setForm} onSubmit={submit} submitting={submitting} />
    </main>
  );
}
