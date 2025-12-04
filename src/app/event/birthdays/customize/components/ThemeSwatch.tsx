import React from "react";
import { ProfessionalTheme } from "../constants";
import { getPreviewStyle } from "../utils";

type ThemeSwatchProps = {
  theme: ProfessionalTheme;
  active: boolean;
  onClick: () => void;
};

export default function ThemeSwatch({ theme, active, onClick }: ThemeSwatchProps) {
  return (
    <button
      onClick={onClick}
      className={`relative overflow-hidden rounded-lg border text-left transition-all ${
        active
          ? "border-indigo-600 ring-1 ring-indigo-600 shadow-md"
          : "border-slate-200 hover:border-slate-400 hover:shadow-sm"
      }`}
    >
      <div
        className="h-12 w-full border-b border-black/5"
        style={getPreviewStyle(theme.recommendedColorPalette)}
      />
      <div className="p-3">
        <div className="text-sm font-semibold text-slate-700">
          {theme.themeName}
        </div>
        <div className="text-xs text-slate-400">Palette preset</div>
      </div>
    </button>
  );
}
