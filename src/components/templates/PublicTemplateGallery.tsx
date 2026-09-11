"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import TemplateAutoLoader from "@/components/events/TemplateAutoLoader";
import { TemplateMasonryCard, TemplateMasonryGrid } from "@/components/events/TemplateMasonryGallery";
import { getPublicTemplates } from "@/lib/public-template-catalog";
import {
  getTemplateCategory,
  type TemplateCategory,
  templateEditorHref,
} from "@/lib/template-categories";
import { readTemplateDraft, type TemplateDraft } from "@/lib/template-draft-storage";
import PublicTemplatePreview from "./CategoryTemplateThumbnail";
import { trackTemplateEvent } from "./TemplateEditorContext";

export { default as PublicTemplatePreview } from "./CategoryTemplateThumbnail";

export default function PublicTemplateGallery({
  category,
  featured = false,
}: {
  category: TemplateCategory;
  featured?: boolean;
}) {
  const info = getTemplateCategory(category)!;
  const templates = getPublicTemplates(category);
  const [query, setQuery] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string>>({});
  const [resume, setResume] = useState<TemplateDraft | null>(null);
  const Heading = featured ? "h2" : "h1";
  const [visible, setVisible] = useState(12);
  const filters = (
    [
      { key: "style", label: "Style" },
      { key: "color", label: "Color" },
      { key: "season", label: "Season" },
      { key: "audience", label: "Audience" },
      { key: "milestone", label: "Milestone" },
      { key: "sport", label: "Sport" },
    ] as const
  )
    .map((filter) => ({
      ...filter,
      values: [
        ...new Set(templates.map((template) => String(template[filter.key] || "")).filter(Boolean)),
      ],
    }))
    .filter((filter) => filter.values.length > 1);
  const filtered = templates.filter(
    (template) =>
      filters.every(
        (filter) =>
          !selectedFilters[filter.key] ||
          String(template[filter.key]) === selectedFilters[filter.key],
      ) &&
      `${template.name} ${template.description} ${template.style}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const shown = featured ? templates.slice(0, 6) : filtered.slice(0, visible);
  useEffect(() => {
    trackTemplateEvent("template_gallery_view", category);
    let active = true;
    void readTemplateDraft(category)
      .then((draft) => {
        if (active) setResume(draft);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [category]);
  return (
    <section
      id="templates"
      aria-label={`${info.name} templates`}
      className="scroll-mt-24 bg-[#fbf8f5] px-5 py-14 text-[#342d38] sm:px-8 lg:px-12"
    >
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#886488]">
              {info.name}
            </p>
            <Heading className="mt-3 font-serif text-4xl sm:text-5xl">
              {featured ? "Make it yours" : `${info.name} templates`}
            </Heading>
            <p className="mt-4 text-sm text-[#746775]">
              Customize freely. An account is required to save and share.
              {category === "signup-forms" && " Choose a design, then make it yours in the editor."}
            </p>
          </div>
          {featured && (
            <Link
              href={`/${category}/templates`}
              className="rounded-full border border-[#dcd0dc] bg-white px-6 py-3 text-sm font-semibold"
            >
              Browse all templates →
            </Link>
          )}
        </div>
        {resume && (
          <Link
            href={`${templateEditorHref(category, resume.templateId)}?draft=${resume.id}`}
            className="mb-6 inline-flex rounded-full border border-[#dcd0dc] bg-white px-5 py-3 text-sm font-semibold"
          >
            Continue your browser draft →
          </Link>
        )}
        {!featured && (
          <div className="mb-8 flex flex-wrap items-center gap-3">
            <label>
              <span className="sr-only">Search templates</span>
              <input
                type="search"
                value={query}
                placeholder="Search templates"
                onChange={(event) => {
                  setQuery(event.target.value);
                  setVisible(12);
                }}
                className="h-12 rounded-full border border-[#dcd0dc] bg-white px-5"
              />
            </label>
            {filters.map((filter) => (
              <label key={filter.key} className="max-w-full">
                <span className="sr-only">{filter.label}</span>
                <select
                  value={selectedFilters[filter.key] || ""}
                  onChange={(event) => {
                    setSelectedFilters((previous) => ({
                      ...previous,
                      [filter.key]: event.target.value,
                    }));
                    setVisible(12);
                  }}
                  className="h-12 max-w-full rounded-full border border-[#dcd0dc] bg-white px-5"
                >
                  <option value="">All {filter.label.toLowerCase()}s</option>
                  {filter.values.map((name) => (
                    <option key={name}>{name}</option>
                  ))}
                </select>
              </label>
            ))}
            <p aria-live="polite" className="text-sm text-[#746775]">
              {filtered.length} {filtered.length === 1 ? "template" : "templates"}
            </p>
          </div>
        )}
        <TemplateMasonryGrid>
          {shown.map((template) => (
            <TemplateMasonryCard
              key={template.id}
              designId={template.id}
              name={template.name}
              href={templateEditorHref(category, template.id)}
              onClick={() => trackTemplateEvent("template_selected", category, template.id)}
            >
              <PublicTemplatePreview category={category} template={template} />
            </TemplateMasonryCard>
          ))}
        </TemplateMasonryGrid>
        {!shown.length && (
          <p className="py-12 text-center">No templates match. Try another style or search.</p>
        )}
        {!featured && (
          <TemplateAutoLoader visibleCount={visible} totalCount={filtered.length} setVisibleCount={setVisible} itemLabel="templates" />
        )}
      </div>
    </section>
  );
}
