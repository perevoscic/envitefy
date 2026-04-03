/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
"use client";

import { Check, ChevronRight } from "lucide-react";
import {
  GYM_MEET_TEMPLATE_LIBRARY,
  getGymMeetTemplateMeta,
} from "./registry";
import { getGymMeetTitleTypography } from "./titleTypography";
import { GymMeetTemplateGroup, GymMeetTemplateId } from "./types";

const FEATURED_TEMPLATE_IDS: GymMeetTemplateId[] = [
  "meet-app-shell",
  "launchpad-editorial",
  "glitch-sport",
  "organic-flow",
  "pixel-arena",
  "architect-clean",
  "noir-silhouette",
];

const HIDDEN_TEMPLATE_IDS: GymMeetTemplateId[] = ["elite-athlete"];

const GROUP_ORDER: GymMeetTemplateGroup[] = [
  "current",
  "showcase",
  "bold",
  "classic",
  "editorial",
  "dashboard",
];

const TemplateCard = ({
  template,
  selected,
  onSelect,
  featured = false,
}: {
  template: (typeof GYM_MEET_TEMPLATE_LIBRARY)[number];
  selected: boolean;
  onSelect: (value: GymMeetTemplateId) => void;
  featured?: boolean;
}) => {
  const titleTypography = getGymMeetTitleTypography(template.id);

  return (
    <button
      type="button"
      onClick={() => onSelect(template.id)}
      style={{ touchAction: "pan-y" }}
      className={`group w-full overflow-hidden rounded-2xl border text-left transition-all ${
        selected
          ? "border-slate-900 bg-slate-900 text-white shadow-lg"
          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
      }`}
    >
      <div className="relative px-3 pb-1.5 pt-3">
        {featured ? (
          <div className="absolute left-3 top-3 z-10 rounded-full bg-amber-400 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-950">
            New
          </div>
        ) : null}
        <div
          className={`absolute right-3 top-3 z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
            selected
              ? "border-white/20 bg-white/10"
              : "border-slate-200 bg-white/85 text-slate-400"
          }`}
        >
          {selected ? <Check size={14} /> : <ChevronRight size={14} />}
        </div>
        <div
          className={`relative min-h-[100px] overflow-hidden rounded-2xl border ${
            selected ? "border-white/15" : "border-slate-200"
          } ${template.previewClassName}`}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.24),transparent_42%)]" />
          <div className={`relative flex h-full items-end px-4 pb-2 pt-4 pr-12 ${featured ? "pl-20" : ""}`}>
            <div
              className={`${titleTypography.cardClassName} text-base font-black leading-tight ${
                template.previewTitleClassName || "tracking-tight"
              }`}
              style={titleTypography.fontStyle}
            >
              {template.name}
            </div>
          </div>
        </div>
      </div>
    </button>
  );
};

export default function TemplateSelector({
  value,
  onChange,
}: {
  value: GymMeetTemplateId;
  onChange: (value: GymMeetTemplateId) => void;
}) {
  const active = getGymMeetTemplateMeta(value);
  const templates = GROUP_ORDER.flatMap((group) =>
    GYM_MEET_TEMPLATE_LIBRARY.filter(
      (template) =>
        template.group === group && !HIDDEN_TEMPLATE_IDS.includes(template.id)
    )
  );
  const featuredTemplates = FEATURED_TEMPLATE_IDS.map((id) =>
    GYM_MEET_TEMPLATE_LIBRARY.find((template) => template.id === id)
  ).filter((template): template is (typeof GYM_MEET_TEMPLATE_LIBRARY)[number] =>
    Boolean(template) && !HIDDEN_TEMPLATE_IDS.includes(template.id)
  );
  const remainingTemplates = templates.filter(
    (template) => !FEATURED_TEMPLATE_IDS.includes(template.id)
  );

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
          Meet Page Templates
        </p>
        <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm">
          <Check size={14} className="text-emerald-600" />
          Selected: {active.name}
        </div>
      </div>

      <div
        className="max-h-[calc(100dvh-17rem)] overflow-y-auto overscroll-contain pr-1 touch-pan-y"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <div className="space-y-6">
          <section className="space-y-3">
            <div className="px-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
                New Showcase Templates
              </p>
              <p className="mt-1 text-sm text-slate-500">
                The new mobile-native app shell is pinned first for new events.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {featuredTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  selected={template.id === value}
                  onSelect={onChange}
                  featured
                />
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <div className="px-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
                All Templates
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {remainingTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  selected={template.id === value}
                  onSelect={onChange}
                />
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
