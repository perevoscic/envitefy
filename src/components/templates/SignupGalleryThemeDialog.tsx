"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SignupCustomThemeDialog from "@/components/smart-signup-form/SignupCustomThemeDialog";
import { createEmptySignupTemplateForm } from "@/lib/signup-starters";
import { restoreSignupTheme } from "@/lib/signup-custom-theme";
import { applySignupThemeDetails } from "@/lib/signup-theme-brief";
import { stageSignupTheme } from "@/lib/signup-theme-handoff";
import { templateEditorHref } from "@/lib/template-categories";

export default function SignupGalleryThemeDialog({ initialMessage, onClose, onUsed }: { initialMessage?: string; onClose: () => void; onUsed: () => void }) {
  const router = useRouter();
  const [form] = useState(createEmptySignupTemplateForm);
  return <SignupCustomThemeDialog form={form} isNew initialMessage={initialMessage} onClose={onClose} onUseTheme={(theme) => {
    const token = stageSignupTheme(applySignupThemeDetails(restoreSignupTheme(form, theme), theme.details));
    onUsed();
    router.push(`${templateEditorHref("signup-forms", "editorial--clean-clear")}?themePreview=${encodeURIComponent(token)}`);
  }} />;
}
