"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import CategoryGalleryBackdrop from "@/components/events/CategoryGalleryBackdrop";
import CreateWithEnvitefyCallout from "@/components/events/CreateWithEnvitefyCallout";
import { categoryGalleryPageClassName } from "@/components/events/category-gallery-page";
import EventCustomThemeLauncher from "@/components/events/EventCustomThemeLauncher";
import SeasonalGalleryControls from "@/components/events/SeasonalGalleryControls";
import TemplateAutoLoader from "@/components/events/TemplateAutoLoader";
import {
  TemplateMasonryCard,
  TemplateMasonryGrid,
} from "@/components/events/TemplateMasonryGallery";
import { useSeasonalTemplates } from "@/hooks/useSeasonalTemplates";
import { matchesPublicTemplateSearch, type PublicTemplate } from "@/lib/public-template-shared";
import {
  getTemplateCategory,
  type TemplateCategory,
  templateEditorHref,
} from "@/lib/template-categories";
import { readTemplateDraft, type TemplateDraft } from "@/lib/template-draft-storage";
import { trackTemplateEvent } from "@/lib/template-tracking";
import PublicTemplatePreview from "./CategoryTemplateThumbnail";
import styles from "./public-gallery.module.css";

const SignupGalleryThemeDialog = dynamic(() => import("./SignupGalleryThemeDialog"), {
  ssr: false,
});

export default function PublicTemplateGalleryContents({
  templates,
  category,
  featured = false,
  customThemeRequested = false,
  customThemeExpired = false,
}: {
  templates: PublicTemplate[];
  category: TemplateCategory;
  featured?: boolean;
  customThemeRequested?: boolean;
  customThemeExpired?: boolean;
}) {
  const [customThemeOpen, setCustomThemeOpen] = useState(customThemeRequested);
  const { status } = useSession();
  const info = getTemplateCategory(category)!;
  const seasonal = useSeasonalTemplates(templates);
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
    .filter(
      (filter) =>
        filter.values.length > 1 ||
        (category === "signup-forms" && filter.key === "audience" && filter.values.length > 0),
    );
  const filtered = seasonal.apply(
    templates.filter(
      (template) =>
        filters.every(
          (filter) =>
            !selectedFilters[filter.key] ||
            String(template[filter.key]) === selectedFilters[filter.key],
        ) && matchesPublicTemplateSearch(template, query),
    ),
  );
  const alignBottoms = featured && category === "signup-forms";
  const shown = featured ? templates.slice(0, alignBottoms ? 10 : 6) : filtered.slice(0, visible);
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
      aria-label={`${info.name === "Signup forms" ? "Sign-up form" : info.name} templates`}
      className={`${featured ? styles.featured : `${categoryGalleryPageClassName(category)} ${styles.publicSection}`} scroll-mt-24 px-5 py-14 text-[#342d38] sm:px-8 lg:px-12`}
    >
      <div className="mx-auto max-w-[1500px]">
        <div
          data-public-gallery-header
          className={
            featured
              ? "mb-8 flex flex-wrap items-end justify-between gap-5"
              : "relative isolate -mx-5 -mt-14 mb-8 overflow-hidden px-5 pt-14 sm:-mx-8 sm:px-8 lg:-mx-12 lg:px-12"
          }
        >
          {!featured && <CategoryGalleryBackdrop category={category} />}
          <div className="relative z-10">
            <p className={styles.eyebrow}>{featured ? info.name : "Templates"}</p>
            <Heading className={`${styles.heading} mt-3 text-4xl sm:text-5xl`}>
              {featured ? "Make it yours" : `${info.name === "Signup forms" ? "Sign-up form" : info.name} templates`}
            </Heading>
            {!featured && (
              <p className={`${styles.note} mt-4 max-w-2xl`}>
                Choose a design to customize. {status === "authenticated"
                  ? "Save a draft when you’re ready, then publish and share."
                  : "Customize it, then sign in to save and share."}
              </p>
            )}
            {featured && (
              <p className={`${styles.note} mt-4`}>
                {status === "authenticated"
                  ? "Save a private draft, then publish when ready."
                  : "Customize freely. An account is required to save and share."}
                {category === "signup-forms" &&
                  " Choose a design, then make it yours in the editor."}
              </p>
            )}
          </div>
          {featured && (
            <Link href={`/${category}/templates`} className={styles.browse}>
              Browse all templates →
            </Link>
          )}
        </div>
        {!featured &&
          (category === "signup-forms" ? (
            <div className="mb-8">
              <CreateWithEnvitefyCallout
                category="signup-forms"
                onClick={() => setCustomThemeOpen(true)}
              />
            </div>
          ) : (
            <EventCustomThemeLauncher category={category} contained />
          ))}
        {category === "signup-forms" &&
          !featured &&
          customThemeOpen &&
          status === "authenticated" && (
            <SignupGalleryThemeDialog
              onUsed={() => setCustomThemeOpen(false)}
              initialMessage={
                customThemeExpired
                  ? "That preview is no longer available. Describe your idea to create a new one."
                  : undefined
              }
              onClose={() => {
                setCustomThemeOpen(false);
                if (customThemeRequested)
                  window.history.replaceState(null, "", "/signup-forms/templates");
              }}
            />
          )}
        {resume && (
          <Link
            href={`${templateEditorHref(category, resume.templateId)}?draft=${resume.id}`}
            className="mb-6 inline-flex rounded-full border border-[#dcd0dc] bg-white px-5 py-3 text-sm font-semibold"
          >
            Continue your browser draft →
          </Link>
        )}
        {!featured && (
          <div className="mb-8 flex flex-wrap items-center gap-3" data-public-gallery-controls>
            <label className="max-w-full">
              <span className="sr-only">Search templates</span>
              <input
                type="search"
                value={query}
                placeholder="Search templates"
                onChange={(event) => {
                  setQuery(event.target.value);
                  setVisible(12);
                }}
                className="h-12 w-full max-w-full rounded-full border border-[#dcd0dc] bg-white px-5"
              />
            </label>
            <SeasonalGalleryControls {...seasonal} onChange={() => setVisible(12)} />
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
          </div>
        )}
        <TemplateMasonryGrid alignBottoms={alignBottoms} desktopColumns={alignBottoms ? 5 : 4}>
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
          <TemplateAutoLoader
            visibleCount={visible}
            totalCount={filtered.length}
            setVisibleCount={setVisible}
            itemLabel="templates"
          />
        )}
      </div>
    </section>
  );
}
