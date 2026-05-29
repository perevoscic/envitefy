"use client";

import type { AdStudioCampaign } from "@/lib/admin/ad-studio-types";

export function CampaignBriefTab({ campaign }: { campaign: AdStudioCampaign }) {
  const brief = campaign.campaignBrief;
  const rows = [
    ["Target audience", brief.targetAudience],
    ["Pain point", brief.painPoint],
    ["Emotional trigger", brief.emotionalTrigger],
    ["Benefit", brief.benefit],
    ["CTA", brief.cta],
    ["Platform", brief.suggestedPlatform],
    ["Length", `${brief.suggestedVideoLength} seconds`],
  ];
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-700">
          Creative Director Agent
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-normal text-slate-950">
          {brief.campaignTitle}
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-700">{brief.adSummary}</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {rows.map(([label, value]) => (
            <div key={label} className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                {label}
              </p>
              <p className="mt-1 text-sm font-medium text-slate-900">{value}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-slate-950">Creative Logic</h3>
        <dl className="mt-4 space-y-4 text-sm">
          <div>
            <dt className="font-semibold text-slate-700">Ad angle</dt>
            <dd className="mt-1 text-slate-600">{brief.adAngle}</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-700">Core problem</dt>
            <dd className="mt-1 text-slate-600">{brief.coreProblem}</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-700">Envitefy solution</dt>
            <dd className="mt-1 text-slate-600">{brief.envitefySolution}</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-700">Structure</dt>
            <dd className="mt-1 text-slate-600">{brief.videoStructure}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
