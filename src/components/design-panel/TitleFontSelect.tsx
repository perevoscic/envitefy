"use client";

import React from "react";
import { TitleFontOption } from "./types";

type TitleFontSelectProps = {
  options: TitleFontOption[];
  value: string;
  onChange: (fontStack: string) => void;
};

export function TitleFontSelect({ options, value, onChange }: TitleFontSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
    >
      {options.map((option) => (
        <option key={option.id} value={option.stack}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
