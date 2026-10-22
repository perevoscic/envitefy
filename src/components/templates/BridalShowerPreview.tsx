
import TemplateImageTone from "@/components/events/TemplateImageTone";
import { BRIDAL_PRESETS } from "@/lib/public-template-catalog";
import type { CSSProperties } from "react";
import { getThemedEventDesign } from "@/lib/event-page-themed-designs";
import ThemedEventHeader from "./ThemedEventHeader";

export type BridalPreviewData = {
  heroImageFilterEnabled?: boolean;
  momName?: string;
  eventTitle?: string;
  date?: string;
  time?: string;
  location?: string;
  venue?: string;
  images?: { hero?: string };
  fontFamily?: string;
  theme?: { bg?: string; text?: string; accent?: string; bgStyle?: CSSProperties; fontFamily?: string };
  babyDetails?: { notes?: string; dressCode?: string };
  hosts?: { name: string; role?: string }[];
  registries?: { label: string; url: string }[];
};
export default function BridalShowerPreview({
  templateId,
  data,
  headerOnly = false,
}: {
  templateId: string;
  data: BridalPreviewData;
  headerOnly?: boolean;
}) {
  const design = getThemedEventDesign(templateId);
  const preset = BRIDAL_PRESETS.find((item) => item.id === templateId) || BRIDAL_PRESETS[0];
  const theme = data.theme;
  const fontFamily = data.fontFamily || theme?.fontFamily || design?.font;
  if (design) return (
    <ThemedEventHeader design={design} fontFamily={fontFamily}>
      <div className="relative aspect-[4/3] w-full">
        <img src={data.images?.hero || design.artwork} alt="Bridal shower celebration" className="template-hero-image h-full w-full object-cover" />
      </div>
      <div className="px-6 py-10 sm:px-10 sm:py-14" style={{ fontFamily }}>
        <p className="text-xs uppercase tracking-[.25em]">You’re invited · Bridal shower</p>
        <h1 className="mt-5 text-4xl leading-tight sm:text-5xl">{data.eventTitle || "A toast to the bride"}</h1>
        <p className="mt-4 text-2xl">Celebrating {data.momName || "Sophia"}</p>
        <p className="mt-7">{data.date} {data.time && `· ${data.time}`}</p>
        <p className="mt-2">{data.venue || data.location}</p>
        {!headerOnly && <p className="mt-6 leading-8">{data.babyDetails?.notes}</p>}
      </div>
    </ThemedEventHeader>
  );
  return (
    <TemplateImageTone color={theme?.accent || preset.accent} enabled={data.heroImageFilterEnabled !== false}>
<div
      className={`p-6 sm:p-14 ${theme?.bg || ""} ${theme?.text || ""}`}
      style={{
        ...(theme?.bgStyle || (theme?.bg ? {} : { background: preset.background })),
        ...(theme?.text ? {} : { color: preset.accent }),
        fontFamily,
      }}
    >
      <div className="mx-auto max-w-3xl overflow-hidden rounded-t-[12rem] border border-current bg-white/70 text-center">
        <img
          src={data.images?.hero || preset.heroImage}
          alt="Bridal shower celebration"
          className="template-hero-image h-80 w-full object-cover"
        />
        <div className="px-8 py-12">
          <p className="text-xs uppercase tracking-[0.3em]">You’re invited · Bridal shower</p>
          <h1 style={{ fontFamily }} className="mt-6 font-serif text-5xl">
            {data.eventTitle || "A toast to the bride"}
          </h1>
          <p style={{ fontFamily }} className="mt-5 font-serif text-4xl italic">
            Celebrating {data.momName || "Sophia"}
          </p>
          <p className="mt-8 text-lg">
            {data.date} {data.time && `· ${data.time}`}
          </p>
          <p className="mt-3">{data.venue || data.location}</p>
          {!headerOnly && (
            <>
              <p className="mx-auto mt-8 max-w-lg leading-8">
                {data.babyDetails?.notes ||
                  "Join us for an afternoon of love, laughter, and a toast to the bride."}
              </p>
              {data.babyDetails?.dressCode && (
                <p className="mt-6">Dress code: {data.babyDetails.dressCode}</p>
              )}
              {!!data.hosts?.length && (
                <p className="mt-6">Hosted by {data.hosts.map((host) => host.name).join(" & ")}</p>
              )}
              {!!data.registries?.length && (
                <div className="mt-8 flex flex-wrap justify-center gap-4">
                  {data.registries.map((registry) => (
                    <a
                      key={registry.url}
                      href={registry.url}
                      rel="noreferrer"
                      target="_blank"
                      className="rounded-full border border-current px-5 py-3"
                    >
                      {registry.label || "Registry"}
                    </a>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
</TemplateImageTone>
  );
}
