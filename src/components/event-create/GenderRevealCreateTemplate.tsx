"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Baloo_2, Poppins } from "next/font/google";
import {
  ArrowRight,
  CalendarDays,
  Check,
  Filter,
  Palette,
  Wand2,
  Gift,
  Share2,
  Lock,
  Users,
} from "lucide-react";
import {
  genderRevealTemplateCatalog,
  type GenderRevealTemplateDefinition,
} from "@/components/event-create/GenderRevealTemplateGallery";

type Props = { defaultDate?: Date };

type TemplateFormat = "card" | "page";
type InviteTone = "Sweet & Soft" | "Chic & Modern" | "Fun & Casual";

type FilterState = {
  occasion: string;
  style: string;
  colorPalette: string;
  tone: InviteTone | "all";
  layout: string;
};

const baloo = Baloo_2({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-baloo",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});

const OCCASION_FILTERS = [
  { value: "all", label: "All occasions" },
  { value: "Gender Reveal", label: "Gender Reveal" },
  { value: "Team Pink/Blue", label: "Team Pink/Blue" },
  { value: "Neutral", label: "Neutral" },
];

const STYLE_FILTERS = [
  { value: "all", label: "All styles" },
  { value: "Minimal", label: "Minimal" },
  { value: "Elegant", label: "Elegant" },
  { value: "Cute & Playful", label: "Cute & Playful" },
  { value: "Boho", label: "Boho" },
  { value: "Modern", label: "Modern" },
  { value: "Illustrated", label: "Illustrated" },
];

const COLOR_PALETTE_FILTERS = [
  { value: "all", label: "All palettes" },
  { value: "Pink & Blue", label: "Pink & Blue" },
  { value: "Neutral", label: "Neutral" },
  { value: "Blush / Pink tones", label: "Blush / Pink" },
  { value: "Blue tones", label: "Blue tones" },
  { value: "Sage / Green", label: "Sage / Green" },
  { value: "Terracotta / Earthy", label: "Terracotta / Earthy" },
];

const TONE_FILTERS: Array<{ value: InviteTone | "all"; label: string }> = [
  { value: "all", label: "All tones" },
  { value: "Sweet & Soft", label: "Sweet & Soft" },
  { value: "Chic & Modern", label: "Chic & Modern" },
  { value: "Fun & Casual", label: "Fun & Casual" },
];

const LAYOUT_FILTERS = [
  { value: "all", label: "All layouts" },
  { value: "Centered card layout", label: "Centered card" },
  { value: "Full-width hero image", label: "Full-width hero" },
  { value: "Photo at top, text below", label: "Photo top" },
];

const HOW_IT_WORKS = [
  {
    title: "Choose a gender reveal template",
    copy: "Pick a style that matches your vibe—pink & blue, neutral, or something unique.",
  },
  {
    title: "Add the details",
    copy: "Enter parents' names, date, time, location, and how you'll be revealing the big news.",
  },
  {
    title: "Share one smart invite link",
    copy: "Send via text, WhatsApp, email, or group chat. Guests see everything and can RSVP in one tap.",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "The 'Team Pink or Team Blue' poll feature was a huge hit with our guests!",
    author: "Jessica & Mike",
  },
  {
    quote:
      "I loved how easy it was to customize the colors. We went with a neutral gold theme and it looked perfect.",
    author: "Sarah, expecting mom",
  },
  {
    quote:
      "Sending the link via text was so much easier than mailing cards. Everyone RSVP'd quickly.",
    author: "Emily, host",
  },
];

const LOVE_REASONS = [
  "Keep all details in one link",
  "Fun polling features for guests",
  "Easy for co-hosts to share",
  "Update time or address instantly",
  "Guests can't lose the invite",
];

export default function GenderRevealCreateTemplate({ defaultDate }: Props) {
  const router = useRouter();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null
  );
  const [filters, setFilters] = useState<FilterState>({
    occasion: "all",
    style: "all",
    colorPalette: "all",
    tone: "all",
    layout: "all",
  });

  const defaultDateIso = useMemo(() => {
    if (!defaultDate) return undefined;
    try {
      return defaultDate.toISOString();
    } catch {
      return undefined;
    }
  }, [defaultDate]);

  const templateVariationMap = useMemo(() => {
    const map = new Map<string, string>();
    genderRevealTemplateCatalog.forEach(
      (template: GenderRevealTemplateDefinition) => {
        const variation = template.variations?.[0];
        if (variation) map.set(template.id, variation.id);
      }
    );
    return map;
  }, []);

  const filteredTemplates = useMemo(() => {
    return genderRevealTemplateCatalog.filter((template) => {
      // Note: We are using the catalog directly, which might not have all the metadata
      // if it was stripped in the gallery file. But looking at GenderRevealTemplateGallery.tsx,
      // it seems to export the full definition including occasionTypes etc.
      // Wait, GenderRevealTemplateDefinition extends TemplateGalleryTemplate which has occasionTypes.
      // So we should be good.

      // However, in BabyShowersCreateTemplate, BABY_SHOWER_TEMPLATES was defined locally with MORE fields
      // than the gallery definition (like description, bestFor, recommendedUse).
      // I added those to GenderRevealTemplateGallery.tsx's baseGenderRevealTemplateCatalog,
      // so I should be able to use it directly.

      // Let's cast to any to access properties if TS complains, or ensure the type is correct.
      const t = template as any;

      if (
        filters.occasion !== "all" &&
        t.occasionTypes &&
        !t.occasionTypes.includes(filters.occasion)
      ) {
        return false;
      }
      if (
        filters.style !== "all" &&
        t.styles &&
        !t.styles.some(
          (style: string) => style.toLowerCase() === filters.style.toLowerCase()
        )
      ) {
        return false;
      }
      if (
        filters.colorPalette !== "all" &&
        t.colorPalette &&
        !t.colorPalette.some(
          (palette: string) =>
            palette.toLowerCase() === filters.colorPalette.toLowerCase()
        )
      ) {
        return false;
      }
      if (filters.tone !== "all" && t.tone !== filters.tone) {
        return false;
      }
      if (
        filters.layout !== "all" &&
        t.format &&
        !t.format.includes(filters.layout.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [filters]);

  const handleFilterChange = (
    key: keyof FilterState,
    value: string | InviteTone | "all"
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleUseTemplate = (template: GenderRevealTemplateDefinition) => {
    const params = new URLSearchParams();
    params.set("templateId", template.id); // Note: template.id vs template.templateId. In gallery it is id.
    const variationId = templateVariationMap.get(template.id);
    if (variationId) params.set("variationId", variationId);
    if (defaultDateIso) params.set("d", defaultDateIso);
    router.push(`/event/gender-reveal/customize?${params.toString()}`);
  };

  const selectedTemplate = selectedTemplateId
    ? genderRevealTemplateCatalog.find(
        (template) => template.id === selectedTemplateId
      ) ?? null
    : null;

  return (
    <main className={`${poppins.className} ${baloo.variable} bg-[#FAFAFA]`}>
      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 py-10 sm:px-6 lg:px-10">
        <HeroSection
          onBrowse={() =>
            document
              .getElementById("gender-reveal-templates")
              ?.scrollIntoView({ behavior: "smooth" })
          }
        />

        <TrustBar />

        <FilterBar filters={filters} onChange={handleFilterChange} />

        <section id="gender-reveal-templates" className="space-y-6">
          <div className="flex flex-col gap-2 text-[#2F2F2F]">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#9B7ED9]">
              Choose a gender reveal invite template
            </p>
            <h2
              style={{ fontFamily: "var(--font-baloo)" }}
              className="text-3xl text-[#2F2F2F]"
            >
              Browse Gender Reveal Invite Templates
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {filteredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onPreview={() => setSelectedTemplateId(template.id)}
                onUse={() => handleUseTemplate(template)}
              />
            ))}
          </div>
        </section>

        <HowItWorks />
        <Testimonials />
        <ParentsLove />

        <footer className="rounded-t-3xl bg-[#181625] p-8 text-white">
          <div className="grid gap-6 lg:grid-cols-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#9B7ED9]">
                Envitefy
              </p>
              <p className="mt-3 text-sm text-white/70">
                Shareable gender reveal invites with one smart link and
                add-to-calendar buttons your guests will actually use.
              </p>
            </div>
            <FooterList
              title="Product"
              items={["How It Works", "Gender Reveal Templates", "Help Center"]}
            />
            <FooterList
              title="Company"
              items={["About", "Blog", "Privacy & Security"]}
            />
            <FooterList
              title="Follow"
              items={["Instagram", "Facebook", "YouTube"]}
            />
          </div>
        </footer>
      </div>

      {selectedTemplate && (
        <TemplatePreviewModal
          template={selectedTemplate}
          onClose={() => setSelectedTemplateId(null)}
          onUse={() => {
            handleUseTemplate(selectedTemplate);
            setSelectedTemplateId(null);
          }}
        />
      )}
    </main>
  );
}

function HeroSection({ onBrowse }: { onBrowse: () => void }) {
  return (
    <section className="rounded-[40px] bg-gradient-to-br from-[#F5E8FF] via-[#E8F5F0] to-[#FFE8F5] p-8 shadow-2xl">
      <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
        <div className="space-y-6 text-[#2F2F2F]">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#9B7ED9]">
            Gender Reveal Invites
          </p>
          <h1
            style={{ fontFamily: "var(--font-baloo)" }}
            className="text-4xl leading-tight sm:text-5xl"
          >
            Create a Beautiful Gender Reveal Invite in Just a Few Clicks.
          </h1>
          <p className="text-lg text-[#4A403C]">
            Share the excitement with a stunning event page, simple RSVPs, and
            one smart link for all your guests.
          </p>
          <p className="text-sm font-semibold text-[#4A403C]">
            No apps needed. Guests get one link with date, time, location, and
            "Add to Calendar."
          </p>
          <div className="flex flex-wrap gap-4">
            <button
              type="button"
              onClick={onBrowse}
              className="inline-flex items-center gap-2 rounded-full bg-[#9B7ED9] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#9B7ED9]/40 transition hover:scale-[1.01]"
            >
              Browse Templates <ArrowRight className="h-4 w-4" />
            </button>
            <a
              href="#how-envitefy-works"
              className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/60 px-6 py-3 text-sm font-semibold text-[#2F2F2F]"
            >
              See How It Works
            </a>
          </div>
        </div>
        <HeroMockup />
      </div>
    </section>
  );
}

function HeroMockup() {
  return (
    <div className="relative rounded-[32px] bg-white/90 p-6 shadow-xl">
      <div className="space-y-4">
        <div className="rounded-2xl bg-[#F5E8FF] p-4 text-sm text-[#7B5FA3]">
          Gender Reveal for [Name]
        </div>
        <div className="rounded-3xl border border-[#E8D5FF] bg-white/95 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-[#9B7ED9]">
                Date · Time · Location
              </p>
              <h3 className="text-2xl font-semibold text-[#2F2F2F]">
                He or She?
              </h3>
            </div>
            <div className="rounded-full bg-[#F5E8FF] px-4 py-2 text-xs font-semibold text-[#7B5FA3]">
              Add to Calendar
            </div>
          </div>
          <div className="mt-4 space-y-2 text-sm text-[#4A403C]">
            <p>
              Saturday · 2:00 PM
              <br />
              123 Main Street, City
            </p>
            <div className="rounded-2xl border border-[#E8D5FF] bg-[#FBF6FF] px-4 py-3 text-xs text-[#643C8F]">
              Wear Pink or Blue!
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button className="flex-1 rounded-full bg-[#9B7ED9] px-4 py-2 text-xs font-semibold text-white">
              RSVP
            </button>
            <button className="flex-1 rounded-full border border-[#E8D5FF] px-4 py-2 text-xs font-semibold text-[#7B5FA3]">
              Add to Calendar
            </button>
          </div>
        </div>
      </div>
      <div className="pointer-events-none absolute -top-6 right-6 h-20 w-20 rounded-full bg-[#9B7ED9]/40 blur-3xl" />
    </div>
  );
}

function TrustBar() {
  const trustItems = [
    {
      icon: <Share2 className="h-5 w-5" />,
      label: "Easy to share by text, email, or chat",
    },
    {
      icon: <CalendarDays className="h-5 w-5" />,
      label: "1-click Add to Calendar",
    },
    {
      icon: <Lock className="h-5 w-5" />,
      label: "Private, unlisted event links",
    },
    {
      icon: <Gift className="h-5 w-5" />,
      label: "Registry links in one place",
    },
    {
      icon: <Users className="h-5 w-5" />,
      label: "Works for in-person and virtual",
    },
  ];
  return (
    <section className="rounded-[32px] border border-[#F4E7FF] bg-white/90 p-4 shadow-sm">
      <div className="grid gap-3 text-sm font-semibold text-[#2F2F2F] sm:grid-cols-3 lg:grid-cols-5">
        {trustItems.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-2 rounded-full bg-[#FAF5FF] px-4 py-2"
          >
            <span aria-hidden className="text-[#9B7ED9]">
              {item.icon}
            </span>
            {item.label}
          </div>
        ))}
      </div>
    </section>
  );
}

function FilterBar({
  filters,
  onChange,
}: {
  filters: FilterState;
  onChange: (key: keyof FilterState, value: any) => void;
}) {
  return (
    <section className="sticky top-4 z-20 rounded-[32px] border border-[#F1E5FF] bg-white/95 p-4 shadow-md backdrop-blur">
      <div className="flex items-center gap-2 text-sm font-semibold text-[#7A6C68]">
        <Filter className="h-4 w-4 text-[#9B7ED9]" /> Filter templates
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-3 lg:grid-cols-5">
        <FilterSelect
          label="Occasion Type"
          value={filters.occasion}
          options={OCCASION_FILTERS}
          onChange={(value) => onChange("occasion", value)}
        />
        <FilterSelect
          label="Style"
          value={filters.style}
          options={STYLE_FILTERS}
          onChange={(value) => onChange("style", value)}
        />
        <FilterSelect
          label="Color Palette"
          value={filters.colorPalette}
          options={COLOR_PALETTE_FILTERS}
          onChange={(value) => onChange("colorPalette", value)}
        />
        <FilterSelect
          label="Tone"
          value={filters.tone}
          options={TONE_FILTERS}
          onChange={(value) => onChange("tone", value)}
        />
        <FilterSelect
          label="Layout"
          value={filters.layout}
          options={LAYOUT_FILTERS}
          onChange={(value) => onChange("layout", value)}
        />
      </div>
    </section>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm text-[#4A3E39]">
      <span className="font-semibold">{label}</span>
      <div className="flex items-center gap-2 rounded-2xl border border-[#F1E2FA] bg-white px-3 py-2">
        <Palette className="h-4 w-4 text-[#9B7ED9]" />
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full bg-transparent text-sm focus:outline-none"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </label>
  );
}

function TemplateCard({
  template,
  onPreview,
  onUse,
}: {
  template: GenderRevealTemplateDefinition;
  onPreview: () => void;
  onUse: () => void;
}) {
  // Cast to any to access optional properties that might not be in the base type but are in our data
  const t = template as any;

  return (
    <div className="flex flex-col rounded-[32px] border border-[#F5EAF9] bg-white shadow-sm">
      <div className="relative h-48 rounded-t-[32px] overflow-hidden">
        <Image
          src={
            t.previewImage ||
            "/templates/baby-showers/soft-neutrals-shower.webp"
          } // Fallback
          alt={template.name}
          fill
          className="object-cover"
        />
      </div>
      <div className="flex flex-1 flex-col gap-4 p-5 text-[#2F2F2F]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#9B7ED9]">
            Template
          </p>
          <h3 className="text-lg font-semibold">{template.name}</h3>
          <p className="text-sm text-[#6F6460]">{t.tagline}</p>
        </div>
        <div className="rounded-2xl border border-[#F2E6FF] bg-white/90 px-4 py-3 text-sm text-[#4A403C]">
          <p>Occasion: {t.occasionTypes?.slice(0, 2).join(" / ")}</p>
          <p>Style: {t.styles?.join(" · ")}</p>
          <p>Palette: {t.colorPalette?.join(", ")}</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold text-[#7B6D68]">
          {t.recommendedUse?.slice(0, 2).map((text: string) => (
            <span
              key={text}
              className="rounded-full bg-[#FFF2FB] px-3 py-1 text-[#9B7ED9]"
            >
              {text}
            </span>
          ))}
        </div>
        <div className="mt-auto flex gap-3 pt-2">
          <button
            type="button"
            onClick={onUse}
            className="flex-1 rounded-full bg-[#9B7ED9] px-4 py-2 text-sm font-semibold text-white"
          >
            Use This Template
          </button>
          <button
            type="button"
            onClick={onPreview}
            className="flex-1 rounded-full border border-[#E0D4FF] px-4 py-2 text-sm font-semibold text-[#6C5E5A]"
          >
            Preview
          </button>
        </div>
      </div>
    </div>
  );
}

function TemplatePreviewModal({
  template,
  onClose,
  onUse,
}: {
  template: GenderRevealTemplateDefinition;
  onClose: () => void;
  onUse: () => void;
}) {
  const t = template as any;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-4xl overflow-hidden rounded-[40px] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#F2E6FF] px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#9B7ED9]">
              Template preview
            </p>
            <p className="text-2xl font-semibold text-[#2F2F2F]">
              {template.name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-semibold text-[#7B6C68]"
          >
            Close
          </button>
        </div>
        <div className="grid gap-6 px-6 py-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[32px] border border-[#F2E6FF] bg-[#FAF7FF] p-4">
            <Image
              src={
                t.previewImage ||
                "/templates/baby-showers/soft-neutrals-shower.webp"
              }
              alt={`${template.name} preview`}
              width={1200}
              height={700}
              className="rounded-3xl"
            />
          </div>
          <div className="space-y-5 text-[#2F2F2F]">
            <div>
              <p className="text-sm font-semibold text-[#9B7ED9]">
                Description
              </p>
              <p className="text-base text-[#4A403C]">{t.description}</p>
            </div>
            <div className="space-y-2 text-sm text-[#4A403C]">
              <p className="font-semibold">Best for:</p>
              <ul className="space-y-1">
                {t.bestFor?.map((item: string) => (
                  <li key={item}>
                    <Check className="mr-2 inline h-4 w-4 text-[#7ED9B0]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-2 text-sm text-[#4A403C]">
              <p className="font-semibold">Recommended use:</p>
              <ul className="space-y-1">
                {t.recommendedUse?.map((item: string) => (
                  <li key={item}>
                    <Check className="mr-2 inline h-4 w-4 text-[#7ED9B0]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-wrap gap-2">
              {t.recommendedUse?.map((item: string) => (
                <span
                  key={item}
                  className="rounded-full bg-[#FFF4F9] px-3 py-1 text-xs font-semibold text-[#9B7ED9]"
                >
                  {item}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onUse}
                className="flex-1 rounded-full bg-[#9B7ED9] px-4 py-2 text-sm font-semibold text-white"
              >
                Start with This Template
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-full border border-[#E0D4FF] px-4 py-2 text-sm font-semibold text-[#6C5E5A]"
              >
                Keep browsing
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HowItWorks() {
  return (
    <section id="how-envitefy-works" className="space-y-6">
      <div className="text-[#2F2F2F]">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#9B7ED9]">
          How Envitefy works
        </p>
        <h2
          style={{ fontFamily: "var(--font-baloo)" }}
          className="text-3xl text-[#2F2F2F]"
        >
          How Envitefy Works for Gender Reveals
        </h2>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {HOW_IT_WORKS.map((step, index) => (
          <div
            key={step.title}
            className="rounded-[28px] border border-[#F2E6FF] bg-white/95 p-6 shadow-sm"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F5E8FF] text-lg font-semibold text-[#9B7ED9]">
              {index + 1}
            </div>
            <h3
              style={{ fontFamily: "var(--font-baloo)" }}
              className="mt-4 text-2xl text-[#2F2F2F]"
            >
              {step.title}
            </h3>
            <p className="text-sm text-[#6F6460]">{step.copy}</p>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-[#E7F6FF] bg-[#F5FBFF] p-4 text-sm text-[#115575]">
        Works just as well for baby showers, sprinkles, and sip & see events.
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section className="space-y-4">
      <div className="text-[#2F2F2F]">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#9B7ED9]">
          Parent-to-be testimonials
        </p>
        <h2
          style={{ fontFamily: "var(--font-baloo)" }}
          className="text-3xl text-[#2F2F2F]"
        >
          Real parents, zero invite stress
        </h2>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {TESTIMONIALS.map((testimonial) => (
          <div
            key={testimonial.quote}
            className="min-w-[260px] flex-1 rounded-[28px] border border-[#F7E5FF] bg-white p-6 text-[#4A403C]"
          >
            <p className="text-base font-medium">"{testimonial.quote}"</p>
            <p className="mt-2 text-sm text-[#85736D]">
              — {testimonial.author}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ParentsLove() {
  return (
    <section className="rounded-[36px] border border-[#F1E5FF] bg-white/95 p-6 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-semibold text-[#7B6D68]">
        <Wand2 className="h-4 w-4 text-[#9B7ED9]" /> Why hosts love Envitefy for
        gender reveals
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {LOVE_REASONS.map((reason) => (
          <div
            key={reason}
            className="flex items-center gap-2 rounded-2xl border border-[#F7E5FF] bg-[#FFFAFE] px-4 py-3 text-sm text-[#4A403C]"
          >
            <Check className="h-4 w-4 text-[#7ED9B0]" />
            {reason}
          </div>
        ))}
      </div>
    </section>
  );
}

function FooterList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="text-sm font-semibold text-white">{title}</p>
      <ul className="mt-3 space-y-2 text-sm text-white/70">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
