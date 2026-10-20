"use client";
// Keep editor CSS in the route stylesheet when native editors are loaded on the client.
import "@/components/smart-signup-form/signup-editor.module.css";
import "@/components/smart-signup-form/signup-composer.module.css";
import "@/components/events/inline-editable-text.module.css";
import "@/components/smart-signup-form/signup-theme.module.css";
import "@/components/smart-signup-form/signup-custom-theme.module.css";
import "@/components/gym-meet-templates/gymnastics-collection.module.css";
import "@/components/gym-meet-templates/gymnastics-program.module.css";
import "@/components/gym-meet-templates/collection-fonts.css";
import "@/components/event-create/imported-event-theme.css";
import "./template-body-layout.module.css";
import "./celebration-materials.module.css";
import "@/components/EventCanvas.module.css";
import dynamic from "next/dynamic";
import type { TemplateCategory } from "@/lib/template-categories";
import TemplateEditorProvider from "./TemplateEditorContext";
import { useSearchParams } from "next/navigation";
import CreationAccessBoundary from "@/components/event-create/CreationAccessBoundary";
import { normalizeCreationCategory } from "@/lib/creation-access";

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
  const search = useSearchParams();
  const creationCategory = category === "sport-events"
    ? normalizeCreationCategory(search?.get("sport") || templateId.split("--")[0]) || category
    : category;
  return (
    <CreationAccessBoundary product={category === "signup-forms" ? "signup_form" : "event_page"} category={category === "signup-forms" ? undefined : creationCategory} eventId={search?.get("edit")}>
    <TemplateEditorProvider
      key={`${category}/${templateId}`}
      category={category}
      templateId={templateId}
    >
      <Editor />
    </TemplateEditorProvider>
    </CreationAccessBoundary>
  );
}
