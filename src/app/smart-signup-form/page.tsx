"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { readStoredSignup } from "@/lib/signup-mutations";
import {
  type EditorSnapshot,
  retainDraftMedia,
  type TemplateDraft,
  writeTemplateDraft,
} from "@/lib/template-draft-storage";

/** Every entry point uses the editor with browser drafts and authentication handoff. */
export default function SmartSignupFormPage() {
  const router = useRouter();
  const params = useSearchParams();
  const started = useRef(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    async function openEditor() {
      const base = "/signup-forms/templates/editorial--clean-clear/customize";
      if (params?.get("duplicate") !== "1") {
        router.replace(base);
        return;
      }
      const raw = sessionStorage.getItem("snapmydate:signup-duplicate");
      if (!raw)
        throw new Error(
          "This copy is no longer available. Open the original signup and choose Duplicate again.",
        );
      const parsed = JSON.parse(raw);
      const original = readStoredSignup(parsed?.dataCopy?.signupForm);
      const form = {
        ...original,
        title: `${original.title} (copy)`,
        responses: [],
        availability: undefined,
        revision: 0,
        enabled: true,
        settings: { ...original.settings, signupOpensAt: null, signupClosesAt: null },
      };
      const templateId = `editorial--${form.appearance?.themeId || "clean-clear"}`;
      const draft: TemplateDraft = {
        version: 1,
        id: crypto.randomUUID(),
        category: "signup-forms",
        templateId,
        updatedAt: Date.now(),
        snapshot: {
          form: JSON.parse(JSON.stringify(form)),
          signupWizardStep: "design",
        } as EditorSnapshot,
        assets: {},
      };
      await retainDraftMedia(draft.snapshot, draft.assets);
      await writeTemplateDraft(draft);
      sessionStorage.removeItem("snapmydate:signup-duplicate");
      router.replace(`/signup-forms/templates/${templateId}/customize?draft=${draft.id}`);
    }
    openEditor().catch((failure) =>
      setError(failure instanceof Error ? failure.message : "Unable to restore this signup."),
    );
  }, [params, router]);
  return (
    <main className="mx-auto max-w-xl p-8">
      <p role={error ? "alert" : "status"}>{error || "Opening your signup editor…"}</p>
      {error && (
        <a href="/signup-forms/templates" className="mt-4 inline-block underline">
          Browse signup templates
        </a>
      )}
    </main>
  );
}
