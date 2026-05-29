"use client";

import { Loader2, WandSparkles } from "lucide-react";
import type { AdStudioRequest } from "@/lib/admin/ad-studio-types";

type Option<T extends string | number> = {
  value: T;
  label: string;
};

const VIDEO_LENGTHS: Option<AdStudioRequest["videoLength"]>[] = [
  { value: 10, label: "10 seconds" },
  { value: 15, label: "15 seconds" },
  { value: 20, label: "20 seconds" },
];

const FORMATS: Option<AdStudioRequest["format"]>[] = [
  { value: "vertical", label: "Vertical 9:16" },
  { value: "horizontal", label: "Horizontal 16:9" },
  { value: "square", label: "Square 1:1" },
  { value: "all", label: "Generate all formats" },
];

const EVENT_TYPES: Option<AdStudioRequest["eventType"]>[] = [
  { value: "baby-shower", label: "Baby shower" },
  { value: "wedding", label: "Wedding" },
  { value: "birthday", label: "Birthday" },
  { value: "graduation", label: "Graduation" },
  { value: "gymnastics-meet", label: "Gymnastics meet" },
  { value: "sports-event", label: "Sports event" },
  { value: "school-event", label: "School event" },
  { value: "open-house", label: "Open house" },
  { value: "local-business-event", label: "Local business event" },
  { value: "general-event", label: "General event" },
];

const TONES: Option<AdStudioRequest["tone"]>[] = [
  { value: "premium", label: "Premium" },
  { value: "emotional", label: "Emotional" },
  { value: "funny", label: "Funny" },
  { value: "family-friendly", label: "Family-friendly" },
  { value: "direct-response", label: "Direct-response" },
  { value: "modern-saas", label: "Modern SaaS" },
];

const VISUAL_STYLES: Option<AdStudioRequest["visualStyle"]>[] = [
  { value: "cinematic-realistic", label: "Cinematic realistic" },
  { value: "ugc-style", label: "UGC style" },
  { value: "premium-saas", label: "Premium SaaS" },
  { value: "social-media-ad", label: "Social media ad" },
  { value: "app-demo-hybrid", label: "App demo hybrid" },
];

const CTAS: Option<AdStudioRequest["cta"]>[] = [
  { value: "create-your-event-page", label: "Create your event page" },
  { value: "snap-share-celebrate", label: "Snap. Share. Celebrate." },
  { value: "turn-your-invite-into-a-live-page", label: "Turn your invite into a live page" },
  { value: "try-envitefy", label: "Try Envitefy" },
  { value: "custom", label: "Custom CTA" },
];

function SelectControl<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
}) {
  return (
    <label className="min-w-0 text-sm">
      <span className="mb-1.5 block font-semibold text-slate-700">{label}</span>
      <select
        value={String(value)}
        onChange={(event) => {
          const next = options.find((option) => String(option.value) === event.target.value);
          if (next) onChange(next.value);
        }}
        className="h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 shadow-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
      >
        {options.map((option) => (
          <option key={String(option.value)} value={String(option.value)}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function AdStudioInput({
  request,
  isGenerating,
  onChange,
  onGenerate,
}: {
  request: AdStudioRequest;
  isGenerating: boolean;
  onChange: (patch: Partial<AdStudioRequest>) => void;
  onGenerate: () => void;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-base font-semibold text-slate-950">Production Instruction</h2>
        <p className="mt-1 text-sm text-slate-600">
          Describe the ad. The hub will build concept, script, deterministic assets, frames, QA, and
          Veo prompts.
        </p>
      </div>
      <div className="space-y-4 p-5">
        <textarea
          value={request.instruction}
          onChange={(event) => onChange({ instruction: event.target.value })}
          placeholder="Describe the promo video you want to create. Example: A busy mom finds a baby shower flyer on the fridge, snaps it with Envitefy, and instantly gets a beautiful RSVP page to share."
          className="min-h-40 w-full resize-y rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-100"
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <SelectControl
            label="Video length"
            value={request.videoLength}
            options={VIDEO_LENGTHS}
            onChange={(value) => onChange({ videoLength: value })}
          />
          <SelectControl
            label="Format"
            value={request.format}
            options={FORMATS}
            onChange={(value) => onChange({ format: value })}
          />
          <SelectControl
            label="Event type"
            value={request.eventType}
            options={EVENT_TYPES}
            onChange={(value) => onChange({ eventType: value })}
          />
          <SelectControl
            label="Tone"
            value={request.tone}
            options={TONES}
            onChange={(value) => onChange({ tone: value })}
          />
          <SelectControl
            label="Visual style"
            value={request.visualStyle}
            options={VISUAL_STYLES}
            onChange={(value) => onChange({ visualStyle: value })}
          />
          <SelectControl
            label="CTA"
            value={request.cta}
            options={CTAS}
            onChange={(value) => onChange({ cta: value })}
          />
        </div>
        {request.cta === "custom" ? (
          <input
            value={request.customCta || ""}
            onChange={(event) => onChange({ customCta: event.target.value })}
            placeholder="Custom CTA"
            className="h-11 w-full rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
          />
        ) : null}
        <button
          type="button"
          onClick={onGenerate}
          disabled={isGenerating || !request.instruction.trim()}
          className="inline-flex min-h-11 items-center gap-2 rounded-md bg-violet-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <WandSparkles className="h-4 w-4" />
          )}
          Generate Promo Video
        </button>
      </div>
    </section>
  );
}
