"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import BabyShowerDesignPreview from "@/components/baby-showers/BabyShowerDesignPreview";
import BirthdayDesignPreview from "@/components/birthdays/BirthdayDesignPreview";
import { config as sportsConfig } from "@/components/event-templates/SportEventsTemplate";
import {
  TemplateThumbnailFrame,
  TemplateThumbnailPreview,
} from "@/components/events/TemplateThumbnail";
import GenderRevealTemplateView from "@/components/GenderRevealTemplateView";
import GymnasticsPreview from "@/components/gym-meet-templates/GymnasticsPreview";
import { GYM_MEET_TEMPLATE_LIBRARY } from "@/components/gym-meet-templates/registry";
import SimpleTemplateView from "@/components/SimpleTemplateView";
import SignupTemplatePreview from "@/components/smart-signup-form/SignupTemplatePreview";
import WeddingDesignPreview from "@/components/weddings/WeddingDesignPreview";
import { BIRTHDAY_DESIGN_BY_ID } from "@/data/birthday-design-catalog";
import { getFamilyTemplateDesign } from "@/lib/family-template-designs";
import { getPublicTemplates, type PublicTemplate } from "@/lib/public-template-catalog";
import { getSportEventPreset, getSportStyleThemeIds } from "@/lib/sport-event-presets";
import {
  getTemplateCategory,
  type TemplateCategory,
  templateEditorHref,
} from "@/lib/template-categories";
import { readTemplateDraft, type TemplateDraft } from "@/lib/template-draft-storage";
import { weddingDesignCatalog } from "@/lib/wedding-designs";
import BridalShowerPreview from "./BridalShowerPreview";
import { trackTemplateEvent } from "./TemplateEditorContext";

export function PublicTemplatePreview({
  category,
  template,
}: {
  category: TemplateCategory;
  template: PublicTemplate;
}) {
  if (category === "weddings") {
    const design = weddingDesignCatalog.find((item) => item.id === template.id)!;
    return <WeddingDesignPreview design={design} />;
  }
  if (category === "birthdays" || category === "anniversaries")
    return <BirthdayDesignPreview design={BIRTHDAY_DESIGN_BY_ID.get(template.id)!} />;
  if (category === "bridal-showers")
    return (
      <TemplateThumbnailPreview>
        <BridalShowerPreview
          templateId={template.id}
          data={{
            momName: "Sophia",
            eventTitle: "A toast to the bride",
            date: "2028-09-21",
            time: "14:00",
            location: "The Garden House",
            images: { hero: template.heroImage },
          }}
        />
      </TemplateThumbnailPreview>
    );
  if (category === "baby-showers")
    return (
      <TemplateThumbnailPreview>
        <BabyShowerDesignPreview designId={template.id} />
      </TemplateThumbnailPreview>
    );
  if (category === "gender-reveal") {
    const defaults = getFamilyTemplateDesign(category, template.id);
    const eventData = {
      templateId: template.id,
      babyName: "Emma",
      momName: "Sarah",
      parentsName: "Sarah & Michael",
      eventTitle: "Our little surprise",
      date: "2028-09-21",
      time: "14:00",
      city: "Chicago",
      state: "IL",
      location: "The Garden House",
      heroImage: template.heroImage,
      themeId: defaults.themeId,
      theme: { themeId: defaults.themeId, fontFamily: `var(--font-${defaults.font})` },
      rsvpEnabled: false,
      hosts: [{ name: "Family & friends", role: "Your hosts" }],
    };
    const props = {
      eventId: "preview",
      eventTitle: template.name,
      eventData,
      shareUrl: "",
      isOwner: false,
      isReadOnly: true,
      editHref: "",
    };
    return (
      <TemplateThumbnailPreview>
        <GenderRevealTemplateView {...props} preview />
      </TemplateThumbnailPreview>
    );
  }
  if (category === "signup-forms") return <SignupTemplatePreview template={template} />;
  if (category === "gymnastics")
    return (
      <TemplateThumbnailPreview>
        <GymnasticsPreview
          design={GYM_MEET_TEMPLATE_LIBRARY.find((design) => design.id === template.id)!}
        />
      </TemplateThumbnailPreview>
    );
  const sport = getSportEventPreset(template.id.split("--")[0]);
  const themeId = getSportStyleThemeIds(sport, template.id.split("--")[1])[0];
  const eventData = {
    category: "sport_event",
    templateId: `sport-event-${sport.key}`,
    title: sport.defaultTitle,
    date: "2028-09-21",
    time: "14:00",
    timezone: "America/Chicago",
    venue: sport.venuePlaceholder,
    location: "Chicago, IL",
    heroImage: sportsConfig.defaultHero,
    theme: sportsConfig.themes.find((theme) => theme.id === themeId),
    themeId,
    fontId: "anton",
    rsvpEnabled: false,
    description: sport.defaultDetails,
    startISO: "2028-09-21T14:00:00-05:00",
    details: sport.defaultDetails,
  };

  return (
    <TemplateThumbnailPreview>
      <SimpleTemplateView
        eventId="preview"
        eventTitle={sport.defaultTitle}
        eventData={eventData}
        isOwner={false}
        isReadOnly
        viewerKind="readonly"
        shareUrl=""
        sessionEmail={null}
        hideOwnerActions
        suppressActionStrip
      />
    </TemplateThumbnailPreview>
  );
}

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
              {category === "signup-forms" && " Each preview includes sample details you can edit."}
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
        <div className="grid grid-cols-1 gap-x-7 gap-y-10 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((template) => (
            <article key={template.id} className="group relative">
              <Link
                prefetch={false}
                href={templateEditorHref(category, template.id)}
                onClick={() => trackTemplateEvent("template_selected", category, template.id)}
                aria-label={`Make ${template.name} yours`}
                className="absolute inset-0 z-20 rounded-[1.35rem] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#59405c]"
              >
                <span className="sr-only">Make {template.name} yours</span>
              </Link>
              <TemplateThumbnailFrame>
                <PublicTemplatePreview category={category} template={template} />
              </TemplateThumbnailFrame>
              <div className="px-2 pt-5">
                <p className="text-xs text-[#886488]">{template.style}</p>
                <h3 className="mt-2 font-serif text-2xl">{template.name}</h3>
                <p className="mt-2 text-sm leading-6 text-[#746775]">{template.description}</p>
                <p className="mt-3 text-sm font-semibold text-[#59405c]">Make it yours →</p>
              </div>
            </article>
          ))}
        </div>
        {!shown.length && (
          <p className="py-12 text-center">No templates match. Try another style or search.</p>
        )}
        {!featured && visible < filtered.length && (
          <div className="mt-10 text-center">
            <button
              type="button"
              onClick={() => setVisible((count) => count + 12)}
              className="rounded-full border border-[#dcd0dc] bg-white px-7 py-3 font-semibold"
            >
              Load more templates
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
