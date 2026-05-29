"use client";

import type { AdStudioCampaign } from "@/lib/admin/ad-studio-types";

export function InvitationTab({ campaign }: { campaign: AdStudioCampaign }) {
  const asset = campaign.deterministicAssets?.invitation;
  return (
    <div className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-950">Deterministic 5x7 Invitation</h2>
        <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
          {asset ? (
            <img src={asset.url} alt="Deterministic invitation asset" className="w-full" />
          ) : (
            <div className="p-8 text-center text-sm text-slate-500">Invitation asset pending.</div>
          )}
        </div>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-950">Invitation JSON</h2>
        <pre className="mt-4 max-h-[620px] overflow-auto rounded-md bg-slate-950 p-4 text-xs leading-5 text-slate-100">
          {JSON.stringify(campaign.invitationDesign, null, 2)}
        </pre>
      </div>
    </div>
  );
}
