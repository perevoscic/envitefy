"use client";
import { useProgressNavigation } from "@/components/UnsavedProgressProvider";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import SmartSignupWizard from "@/components/smart-signup-form/Wizard";
import LegacyTemplateDraftButton from "@/components/templates/LegacyTemplateDraftButton";
import { useTemplateEditor, useTemplateState } from "@/components/templates/TemplateEditorContext";
import { getPublicTemplate } from "@/lib/public-template-catalog";
import { createEmptySignupTemplateForm } from "@/lib/signup-starters";
import { resolveSignupThemeStyle } from "@/lib/signup-themes";
import { buildTemplateDraftPayload } from "@/lib/template-draft-payload";
import type { SignupForm } from "@/types/signup";
import { sanitizeSignupForm } from "@/utils/signup";
import { validateSignupPublish } from "@/lib/signup-validation";

export default function SignupTemplatesPage() {
  const router = useRouter();
  const { allowNavigation } = useProgressNavigation();
  const templateEditor = useTemplateEditor();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useTemplateState<SignupForm>("form", () => {
    const template = templateEditor
      ? getPublicTemplate("signup-forms", templateEditor.templateId)
      : null;
    return createEmptySignupTemplateForm(template || undefined);
  });

  useEffect(() => {
    if (!templateEditor) setForm(createEmptySignupTemplateForm());
  }, []);

  const publishForm = async () => {
    if (templateEditor && !templateEditor.authenticated) {
      await templateEditor.requestPublish();
      return;
    }
    try {
      setSubmitting(true);
      const sanitized = sanitizeSignupForm({
        ...form,
        timezone: form.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        enabled: form.enabled,
      });
      const issues = validateSignupPublish(sanitized);
      if (issues.length) throw new Error(issues.map((issue) => issue.message).join(" "));
      const payload = buildTemplateDraftPayload(
        { form: JSON.parse(JSON.stringify(sanitized)) },
        "signup-forms",
        form.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      );
      if (templateEditor) {
        await templateEditor.persist(payload, "published", { navigate: !templateEditor.published });
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
      if (id) allowNavigation(() => router.push(`/smart-signup-form/${id}?published=1`));
    } catch (err) {
      throw err instanceof Error ? err : new Error("Failed to create signup");
    } finally {
      setSubmitting(false);
    }
  };
  const currentPublisher = useRef(publishForm);
  currentPublisher.current = publishForm;
  const registerPublisher = templateEditor?.registerPublisher;
  useEffect(() => registerPublisher?.(() => currentPublisher.current()), [registerPublisher]);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await publishForm();
  };

  if (templateEditor) return <SmartSignupWizard form={form} onChange={setForm} onSubmit={submit} submitting={submitting} />;

  return (
    <main
      className="mx-auto w-full max-w-[1536px] px-4 py-6 space-y-4 sm:px-6"
      style={resolveSignupThemeStyle(form)}
    >
      <header className="flex items-center justify-between">
        <h1
          className="text-sm font-semibold uppercase tracking-widest"
          style={{ color: "var(--app-foreground, var(--foreground))" }}
        >
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
