"use client";

import React from "react";
import { MAX_REGISTRY_LINKS } from "@/utils/registry-links";

export type RegistryFormEntry = {
  key: string;
  label: string;
  url: string;
  error: string | null;
  detectedLabel: string | null;
};

type Props = {
  entries: RegistryFormEntry[];
  onAdd: () => void;
  onRemove: (key: string) => void;
  onChange: (key: string, field: "label" | "url", value: string) => void;
  maxLinks?: number;
};

export default function RegistryLinksEditor({
  entries,
  onAdd,
  onRemove,
  onChange,
  maxLinks = MAX_REGISTRY_LINKS,
}: Props) {
  return (
    <div className="rounded-md border border-dashed border-border/60 bg-background/60 p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <p className="text-sm font-medium">Registry links</p>
        <button
          type="button"
          onClick={onAdd}
          disabled={entries.length >= maxLinks}
          className="inline-flex items-center justify-center rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:text-foreground hover:bg-surface hover:border-foreground/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Add link
        </button>
      </div>
      {entries.length === 0 ? (
        <p className="mt-3 text-xs text-foreground/60">
          No registry links yet. Use "Add link" to include up to {maxLinks} retailers.
        </p>
      ) : (
        <div className="mt-3 space-y-3">
          {entries.map((entry) => (
            <div key={entry.key} className="relative rounded-md border border-border bg-background/80 p-3">
              <button
                type="button"
                onClick={() => onRemove(entry.key)}
                className="absolute right-2 top-2 text-xs text-foreground transition-colors hover:text-foreground/80"
              >
                Remove
              </button>
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-foreground/60">
                    Label
                  </label>
                  <input
                    type="text"
                    value={entry.label}
                    onChange={(event) => onChange(entry.key, "label", event.target.value)}
                    placeholder={entry.detectedLabel || "Amazon"}
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-foreground/60">
                    Shareable link
                  </label>
                  <input
                    type="url"
                    value={entry.url}
                    onChange={(event) => onChange(entry.key, "url", event.target.value)}
                    placeholder="https://www.amazon.com/..."
                    className={`mt-1 w-full rounded-md border px-3 py-2 text-sm ${
                      entry.error ? "border-red-500 focus:border-red-500" : "border-border"
                    } bg-background`}
                    inputMode="url"
                  />
                  {entry.error ? (
                    <p className="mt-1 text-xs text-red-600">{entry.error}</p>
                  ) : entry.detectedLabel ? (
                    <p className="mt-1 text-xs text-foreground/60">
                      We'll show the {entry.detectedLabel} badge automatically.
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
