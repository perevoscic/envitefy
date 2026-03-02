"use client";

import React from "react";

type MoreOptionsProps = {
  open: boolean;
  buttonStyle: "solid" | "outline";
  darkModeEnabled: boolean;
  darkModeSupported: boolean;
  onToggleOpen: () => void;
  onButtonStyleChange: (style: "solid" | "outline") => void;
  onDarkModeToggle: (next: boolean) => void;
  onReset: () => void;
  onExport: () => void;
};

export function MoreOptions({
  open,
  buttonStyle,
  darkModeEnabled,
  darkModeSupported,
  onToggleOpen,
  onButtonStyleChange,
  onDarkModeToggle,
  onReset,
  onExport,
}: MoreOptionsProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white">
      <button
        type="button"
        onClick={onToggleOpen}
        className="flex w-full items-center justify-between px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500"
      >
        <span>Optional</span>
        <span>{open ? "−" : "+"}</span>
      </button>
      {open ? (
        <div className="space-y-3 px-4 pb-4">
          {darkModeSupported ? (
            <label className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
              <span className="text-sm text-slate-700">Dark mode</span>
              <button
                type="button"
                onClick={() => onDarkModeToggle(!darkModeEnabled)}
                className={`relative h-6 w-11 rounded-full ${
                  darkModeEnabled ? "bg-slate-900" : "bg-slate-300"
                }`}
              >
                <span
                  className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${
                    darkModeEnabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </label>
          ) : null}

          <div className="rounded-lg border border-slate-200 p-2">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Button style</p>
            <div className="grid grid-cols-2 gap-2">
              {(["solid", "outline"] as const).map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => onButtonStyleChange(style)}
                  className={`rounded-md border px-3 py-2 text-sm font-semibold capitalize ${
                    buttonStyle === style
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-slate-200 text-slate-700"
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={onReset}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"
          >
            Reset to default
          </button>

          <button
            type="button"
            onClick={onExport}
            className="w-full rounded-lg px-3 py-2 text-xs font-semibold text-indigo-700 underline underline-offset-2"
          >
            Export Theme (JSON)
          </button>
        </div>
      ) : null}
    </section>
  );
}
