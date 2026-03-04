"use client";

import React from "react";
import { TitleFontOption } from "./types";

type TitleFontSelectProps = {
  options: TitleFontOption[];
  value: string;
  onChange: (fontStack: string) => void;
};

export function TitleFontSelect({ options, value, onChange }: TitleFontSelectProps) {
  const selectedOption =
    options.find((option) => option.stack === value) || options[0] || null;

  return (
    <div className="space-y-2">
      {selectedOption ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Selected</p>
          <p className="truncate text-base text-slate-900" style={{ fontFamily: selectedOption.stack }}>
            {selectedOption.label}
          </p>
        </div>
      ) : null}

      <div
        role="radiogroup"
        aria-label="Title font options"
        className="grid max-h-60 grid-cols-2 gap-2 overflow-auto pr-1"
      >
        {options.map((option) => {
          const active = option.stack === value;
          return (
            <button
              type="button"
              key={option.id}
              role="radio"
              aria-checked={active}
              onClick={() => onChange(option.stack)}
              className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${
                active
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Preview</p>
              <p className="truncate text-lg leading-tight text-slate-900" style={{ fontFamily: option.stack }}>
                {option.label}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
