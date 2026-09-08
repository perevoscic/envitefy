"use client";
// Keep signup CSS in the route stylesheet, including when the editor is loaded on the client.
import "@/components/smart-signup-form/signup-editor.module.css";
import "@/components/smart-signup-form/signup-theme.module.css";
import dynamic from "next/dynamic";
import type { TemplateCategory } from "@/lib/template-categories";
import TemplateEditorProvider from "./TemplateEditorContext";

const loading = () => (
  <p role="status" className="p-10 text-center">
    Loading your editor…
  </p>
);
const WeddingEditor = dynamic(() => import("@/app/event/weddings/customize/page"), {
  loading,
  ssr: false,
});
const BirthdayEditor = dynamic(() => import("@/app/event/birthdays/customize/page"), {
  loading,
  ssr: false,
});
const ShowerEditor = dynamic(() => import("@/app/event/baby-showers/customize/page"), {
  loading,
  ssr: false,
});
const RevealEditor = dynamic(() => import("@/app/event/gender-reveal/customize/page"), {
  loading,
  ssr: false,
});
const GymnasticsEditor = dynamic(() => import("@/app/event/gymnastics/customize/page"), {
  loading,
  ssr: false,
});
const SportsEditor = dynamic(() => import("@/app/event/sport-events/customize/page"), {
  loading,
  ssr: false,
});
const SignupEditor = dynamic(() => import("@/app/templates/signup/page"), { loading, ssr: false });
const editors = {
  weddings: WeddingEditor,
  birthdays: BirthdayEditor,
  anniversaries: BirthdayEditor,
  "baby-showers": ShowerEditor,
  "bridal-showers": ShowerEditor,
  "gender-reveal": RevealEditor,
  gymnastics: GymnasticsEditor,
  "sport-events": SportsEditor,
  "signup-forms": SignupEditor,
};
export default function PublicTemplateEditor({
  category,
  templateId,
}: {
  category: TemplateCategory;
  templateId: string;
}) {
  const Editor = editors[category];
  return (
    <TemplateEditorProvider
      key={`${category}/${templateId}`}
      category={category}
      templateId={templateId}
    >
      <Editor />
    </TemplateEditorProvider>
  );
}
