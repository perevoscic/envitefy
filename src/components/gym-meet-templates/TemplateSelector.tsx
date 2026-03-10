/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
"use client";

import React from "react";
import { Check, ChevronRight } from "lucide-react";
import {
  GYM_MEET_TEMPLATE_LIBRARY,
  getGymMeetTemplateMeta,
} from "./registry";
import { GymMeetTemplateGroup, GymMeetTemplateId } from "./types";

const GROUP_ORDER: GymMeetTemplateGroup[] = [
  "current",
  "showcase",
  "bold",
  "classic",
  "editorial",
  "dashboard",
];

export default function TemplateSelector({
  value,
  onChange,
}: {
  value: GymMeetTemplateId;
  onChange: (value: GymMeetTemplateId) => void;
}) {
  const active = getGymMeetTemplateMeta(value);
  const templates = GROUP_ORDER.flatMap((group) =>
    GYM_MEET_TEMPLATE_LIBRARY.filter((template) => template.group === group)
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
        <div className="grid grid-cols-1 gap-3">
          {templates.map((template) => {
            const selected = template.id === value;
            return (
              <button
                key={template.id}
                type="button"
                onClick={() => onChange(template.id)}
                style={{ touchAction: "pan-y" }}
                className={`group w-full overflow-hidden rounded-2xl border text-left transition-all ${
                  selected
                    ? "border-slate-900 bg-slate-900 text-white shadow-lg"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
                }`}
              >
                <div className="relative px-3 pb-1.5 pt-3">
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
                    <div className="relative flex h-full items-end px-4 pb-2 pt-4 pr-12">
                      <div
                        className={`text-base font-black leading-tight ${
                          template.previewTitleClassName || "tracking-tight"
                        }`}
                      >
                        {template.name}
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
