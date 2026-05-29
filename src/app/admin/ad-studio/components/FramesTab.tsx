"use client";

import { PlayCircle } from "lucide-react";
import type { AdStudioCampaign } from "@/lib/admin/ad-studio-types";
import { FrameComparisonCard } from "./FrameComparisonCard";

export function FramesTab({
  campaign,
  isGenerating,
  onGenerateFrames,
  onRetryFrame,
}: {
  campaign: AdStudioCampaign;
  isGenerating: boolean;
  onGenerateFrames: () => void;
  onRetryFrame: (frameNumber: number) => void;
}) {
  if (!campaign.compositeFrames.length) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
        <p className="text-sm text-slate-600">
          Base frames, compositing, and QA will appear here after image generation.
        </p>
        <button
          type="button"
          onClick={onGenerateFrames}
          disabled={isGenerating}
          className="mx-auto mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-violet-600 px-4 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          <PlayCircle className="h-4 w-4" />
          {isGenerating ? "Generating frames" : "Continue from step 6"}
        </button>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {campaign.compositeFrames.map((frame) => (
        <FrameComparisonCard
          key={frame.frameNumber}
          campaign={campaign}
          frame={frame}
          onRetry={onRetryFrame}
        />
      ))}
    </div>
  );
}
