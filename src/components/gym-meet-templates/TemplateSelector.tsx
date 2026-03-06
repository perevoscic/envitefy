/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
"use client";

import React from "react";
import { Check, ChevronRight } from "lucide-react";
import {
  GYM_MEET_TEMPLATE_LIBRARY,
  getGymMeetTemplateMeta,
} from "./registry";
import { GymMeetTemplateId } from "./types";

export default function TemplateSelector({
  value,
  onChange,
}: {
  value: GymMeetTemplateId;
  onChange: (value: GymMeetTemplateId) => void;
}) {
  const active = getGymMeetTemplateMeta(value);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
          Meet Page Templates
        </p>
        <p className="mt-2 text-sm text-slate-600">
          Choose a complete page design. Content fields stay the same; only the
          layout, typography, and styling change.
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
        {GYM_MEET_TEMPLATE_LIBRARY.map((template) => {
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
              <div className="grid grid-cols-[120px_1fr] gap-4 p-3">
                <div
                  className={`relative min-h-[96px] overflow-hidden rounded-2xl border ${
                    selected ? "border-white/15" : "border-slate-200"
                  } ${template.previewClassName}`}
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.24),transparent_42%)]" />
                  <div className="relative flex h-full flex-col justify-between p-3">
                    <div
                      className={`text-[9px] font-black uppercase tracking-[0.24em] ${template.previewAccentClassName}`}
                    >
                      {template.previewKicker}
                    </div>
                    <div className="text-sm font-black leading-tight">
                      {template.previewTitle}
                    </div>
                  </div>
                </div>

                <div className="min-w-0 py-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{template.name}</p>
                      <p
                        className={`mt-1 text-[10px] font-bold uppercase tracking-[0.2em] ${
                          selected ? "text-white/65" : "text-slate-400"
                        }`}
                      >
                        {template.style}
                      </p>
                    </div>
                    <div
                      className={`mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
                        selected
                          ? "border-white/20 bg-white/10"
                          : "border-slate-200 bg-slate-50 text-slate-400"
                      }`}
                    >
                      {selected ? <Check size={14} /> : <ChevronRight size={14} />}
                    </div>
                  </div>
                  <p
                    className={`mt-3 text-xs leading-relaxed ${
                      selected ? "text-white/80" : "text-slate-600"
                    }`}
                  >
                    {template.description}
                  </p>
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
