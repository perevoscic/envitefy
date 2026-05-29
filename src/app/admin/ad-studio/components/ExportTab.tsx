"use client";

import { Copy, Download } from "lucide-react";
import type { AdStudioCampaign } from "@/lib/admin/ad-studio-types";

function assetUrl(campaign: AdStudioCampaign, file: string): string {
  return `/api/admin/ad-studio/assets/${encodeURIComponent(campaign.runId)}?file=${encodeURIComponent(file)}`;
}

export function ExportTab({
  campaign,
  onCopy,
}: {
  campaign: AdStudioCampaign;
  onCopy: (value: string) => void;
}) {
  const exp = campaign.exportPackage;
  if (!exp) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-600">
        Exports are packaged after QA and Veo prompts pass.
      </div>
    );
  }
  const rows = [
    ["Full campaign JSON", exp.campaignJson, exp.campaignJsonFile],
    ["Markdown campaign brief", exp.markdownBrief, exp.markdownFile],
    ["Veo prompt package", exp.veoPromptText, exp.veoPromptFile],
    ["Voiceover script", exp.voiceoverScript, exp.voiceoverFile],
    ["Caption file", exp.captionsSrt, exp.captionFile],
    ["CTA copy", exp.ctaCopy, ""],
  ] as const;
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {rows.map(([label, value, file]) => (
        <article key={label} className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-slate-950">{label}</h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onCopy(value)}
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Copy className="h-3.5 w-3.5" />
                Copy
              </button>
              {file ? (
                <a
                  href={assetUrl(campaign, file)}
                  download
                  className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </a>
              ) : null}
            </div>
          </div>
          <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap rounded-md bg-slate-950 p-4 text-xs leading-5 text-slate-100">
            {value}
          </pre>
        </article>
      ))}
    </div>
  );
}
