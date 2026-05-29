"use client";

import { RotateCcw } from "lucide-react";
import type { AdStudioCampaign, CompositeFrame } from "@/lib/admin/ad-studio-types";

function assetUrl(campaign: AdStudioCampaign, file?: string | null): string | null {
  if (!file) return null;
  return `/api/admin/ad-studio/assets/${encodeURIComponent(campaign.runId)}?file=${encodeURIComponent(file)}`;
}

export function FrameComparisonCard({
  campaign,
  frame,
  onRetry,
}: {
  campaign: AdStudioCampaign;
  frame: CompositeFrame;
  onRetry: (frameNumber: number) => void;
}) {
  const base = campaign.baseFrames.find((item) => item.frameNumber === frame.frameNumber);
  const qa = campaign.qaResults.find((item) => item.frameNumber === frame.frameNumber);
  const invitationUrl = assetUrl(campaign, frame.invitationAssetFile);
  const phoneUiUrl = assetUrl(campaign, frame.phoneUiAssetFile);
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-950">Frame {frame.frameNumber}</h3>
          <p className="mt-1 text-xs text-slate-500">{qa?.status || "qa pending"}</p>
        </div>
        <button
          type="button"
          onClick={() => onRetry(frame.frameNumber)}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Retry frame
        </button>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Preview title="Base generated frame" src={base?.url || null} />
        <Preview title="Invitation asset" src={invitationUrl} />
        <Preview title="Phone UI asset" src={phoneUiUrl} />
        <Preview title="Final composited frame" src={frame.finalUrl} />
      </div>
      {qa ? (
        <div className="mt-4 rounded-md bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            QA result
          </p>
          <p className="mt-1 text-sm text-slate-700">
            {qa.passed ? "Passed" : qa.failureReason || "Failed"}
          </p>
        </div>
      ) : null}
    </article>
  );
}

function Preview({ title, src }: { title: string; src: string | null }) {
  return (
    <div className="min-w-0">
      <p className="mb-2 text-xs font-semibold text-slate-600">{title}</p>
      <div className="flex aspect-[9/12] items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-slate-100">
        {src ? (
          <img src={src} alt={title} className="h-full w-full object-cover" />
        ) : (
          <span className="px-3 text-center text-xs text-slate-500">Not used</span>
        )}
      </div>
    </div>
  );
}
