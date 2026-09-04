"use client";

import { useState } from "react";
import { CheckCircle2, Copy } from "lucide-react";
import type {
  CopyDeskField,
  CopyDeskPack,
  MarketingCopyDesk as MarketingCopyDeskData,
} from "@/lib/admin/marketing-copy-desk";

async function copyText(value: string) {
  await navigator.clipboard.writeText(value);
}

function CopyFieldButton({
  label,
  copied,
  onClick,
}: {
  label: string;
  copied: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-[16px] border border-[#ddd8e9] bg-white px-3 py-2 text-xs font-semibold text-[#5f5678] transition hover:bg-[#faf8fd] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c67c5] focus-visible:ring-offset-2"
    >
      {copied ? (
        <CheckCircle2 className="h-4 w-4 text-[#3f9a67]" aria-hidden="true" />
      ) : (
        <Copy className="h-4 w-4" aria-hidden="true" />
      )}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function PackField({
  pack,
  field,
  copiedKey,
  onCopy,
}: {
  pack: CopyDeskPack;
  field: CopyDeskField;
  copiedKey: string;
  onCopy: (key: string, value: string) => void;
}) {
  const fieldKey = `${pack.channel}:${field.key}`;
  return (
    <div className="rounded-[20px] border border-[#efebf6] bg-[#fbfafc] p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#8a7bc4]">
          {field.label}
        </div>
        <CopyFieldButton
          label={`Copy ${pack.label} ${field.label.toLowerCase()}`}
          copied={copiedKey === fieldKey}
          onClick={() => onCopy(fieldKey, field.value)}
        />
      </div>
      <pre className="mt-3 whitespace-pre-wrap break-words font-sans text-sm leading-6 text-[#2a1f43]">
        {field.value}
      </pre>
    </div>
  );
}

export function MarketingCopyDesk({
  desk,
  onCopyError,
}: {
  desk: MarketingCopyDeskData;
  onCopyError?: (message: string) => void;
}) {
  const [copiedKey, setCopiedKey] = useState("");

  if (!desk.available || !desk.packs.length) return null;

  async function handleCopy(key: string, value: string) {
    try {
      await copyText(value);
      setCopiedKey(key);
      window.setTimeout(() => {
        setCopiedKey((current) => (current === key ? "" : current));
      }, 2_000);
    } catch {
      onCopyError?.(
        "The copy desk text could not be copied. Select the text and copy it manually.",
      );
    }
  }

  return (
    <section
      aria-labelledby="marketing-copy-desk-heading"
      className="overflow-hidden rounded-[28px] border border-[#e4e0ef] bg-white shadow-[0_22px_60px_rgba(84,49,170,0.08)]"
    >
      <div className="flex flex-col gap-4 border-b border-[#f0ecf7] px-6 py-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#897db6]">
            Paste-ready social copy
          </div>
          <h3
            id="marketing-copy-desk-heading"
            className="mt-1 font-[var(--font-playfair)] text-3xl font-semibold tracking-[-0.04em] text-[#23183d]"
          >
            Copy desk
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#7a7391]">
            One-click captions, hashtags, titles, and descriptions for the native apps. Download the
            PNG, MP4, or SRT as usual. Envitefy does not connect accounts, publish, or schedule.
          </p>
        </div>
        <div className="text-xs font-semibold text-[#8a84a1]">
          {desk.source === "adapted"
            ? "Adapted from this run's shared caption"
            : "Saved platform packs"}
        </div>
      </div>

      <div className="grid gap-4 p-6 xl:grid-cols-2">
        {desk.packs.map((pack) => {
          const copyAllKey = `${pack.channel}:all`;
          return (
            <article
              key={pack.channel}
              className="rounded-[24px] border border-[#efeaf7] bg-[#fcfbfd] p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#8a7bc4]">
                    {pack.shortLabel}
                  </div>
                  <h4 className="mt-1 text-xl font-semibold text-[#271a45]">{pack.label}</h4>
                </div>
                <CopyFieldButton
                  label={`Copy all ${pack.label} copy`}
                  copied={copiedKey === copyAllKey}
                  onClick={() => handleCopy(copyAllKey, pack.copyAll)}
                />
              </div>
              <div className="mt-4 space-y-3">
                {pack.fields.map((field) => (
                  <PackField
                    key={field.key}
                    pack={pack}
                    field={field}
                    copiedKey={copiedKey}
                    onCopy={handleCopy}
                  />
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
