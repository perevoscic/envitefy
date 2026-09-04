"use client";

import { MarketingCopyDesk } from "@/components/admin/MarketingCopyDesk";
import type { MarketingCopyDesk as MarketingCopyDeskData } from "@/lib/admin/marketing-copy-desk";
import {
  campaignChannels,
  campaignTitle,
  channelLabel,
  hubStatusLabel,
  statusTone,
  type AssetType,
  type Caption,
  type CreativeQa,
  type Frame,
  type RunDetail,
} from "@/lib/admin/marketing-hub";
import { ChannelChip, GhostButton, StatusBadge } from "./MarketingHubUi";
import { MarketingHubCreatives } from "./MarketingHubCreatives";
import { MarketingHubEdit } from "./MarketingHubEdit";
import { MarketingHubProduction } from "./MarketingHubProduction";

export function MarketingHubWorkspace({
  detail,
  loadingDetail,
  assetType,
  copyDesk,
  qaSummary,
  cameraFormat,
  runIsActive,
  storyboardCanRegenerate,
  savingCaptions,
  regeneratingCaptions,
  regeneratingStoryboard,
  renderingSocialImages,
  renderingVideo,
  onBack,
  onCopyError,
  onPrepareSocialImages,
  onRenderVideo,
  onSaveCaptions,
  onRegenerateCaptions,
  onRegenerateStoryboard,
  onUpdateCaption,
  onOpenFrame,
}: {
  detail: RunDetail;
  loadingDetail: boolean;
  assetType: AssetType;
  copyDesk: MarketingCopyDeskData;
  qaSummary: CreativeQa | null;
  cameraFormat: string;
  runIsActive: boolean;
  storyboardCanRegenerate: boolean;
  savingCaptions: boolean;
  regeneratingCaptions: boolean;
  regeneratingStoryboard: boolean;
  renderingSocialImages: boolean;
  renderingVideo: boolean;
  onBack: () => void;
  onCopyError: (message: string) => void;
  onPrepareSocialImages: () => void;
  onRenderVideo: () => void;
  onSaveCaptions: () => void;
  onRegenerateCaptions: () => void;
  onRegenerateStoryboard: () => void;
  onUpdateCaption: (frameNumber: number, field: keyof Caption, value: string | number) => void;
  onOpenFrame: (frame: Frame) => void;
}) {
  const frameRows = detail.frames?.frames || [];
  const preparedPostCount = frameRows.filter((frame) => Boolean(frame.captionedImageUrl)).length;
  const channels = campaignChannels(detail);
  const runState = hubStatusLabel(detail.status?.state);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <GhostButton onClick={onBack}>← Library</GhostButton>
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#7c67c5]">
            Campaign workspace
          </p>
          <h1 className="mt-1 font-[var(--font-playfair)] text-4xl font-semibold tracking-[-0.04em] text-[#23183d]">
            {campaignTitle(detail)}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <StatusBadge tone={statusTone(runState)}>{runState}</StatusBadge>
            {channels.map((channel) => (
              <ChannelChip key={channel} label={channelLabel(channel)} />
            ))}
            {loadingDetail ? (
              <span className="text-xs font-medium text-[#8a84a1]">Refreshing…</span>
            ) : null}
          </div>
          {detail.status?.message ? (
            <p className="mt-2 text-sm text-[#7a7391]">{detail.status.message}</p>
          ) : null}
        </div>
      </div>

      <MarketingHubCreatives
        assetType={assetType}
        frameRows={frameRows}
        videoUrl={detail.videoUrl}
        captionsUrl={detail.captionsUrl}
        cameraFormat={cameraFormat}
        runIsActive={runIsActive}
        statusMessage={detail.status?.message || ""}
        preparedPostCount={preparedPostCount}
        renderingSocialImages={renderingSocialImages}
        renderingVideo={renderingVideo}
        onPrepareSocialImages={onPrepareSocialImages}
        onRenderVideo={onRenderVideo}
        onOpenFrame={onOpenFrame}
      />

      {copyDesk.available ? (
        <MarketingCopyDesk desk={copyDesk} onCopyError={onCopyError} />
      ) : (
        <section
          aria-labelledby="marketing-copy-desk-heading"
          className="rounded-[28px] border border-dashed border-[#ddd8e9] bg-white px-6 py-10 text-center"
        >
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#897db6]">
            Paste-ready social copy
          </div>
          <h2
            id="marketing-copy-desk-heading"
            className="mt-2 font-[var(--font-playfair)] text-3xl font-semibold tracking-[-0.04em] text-[#23183d]"
          >
            Copy desk
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#7a7391]">
            Per-platform packs for Instagram, Facebook, TikTok, and YouTube will appear here as
            soon as captions are ready.
          </p>
        </section>
      )}

      <MarketingHubEdit
        assetType={assetType}
        frameRows={frameRows}
        runIsActive={runIsActive}
        savingCaptions={savingCaptions}
        regeneratingCaptions={regeneratingCaptions}
        onSaveCaptions={onSaveCaptions}
        onRegenerateCaptions={onRegenerateCaptions}
        onUpdateCaption={onUpdateCaption}
      />

      <MarketingHubProduction
        detail={detail}
        assetType={assetType}
        qaSummary={qaSummary}
        preparedPostCount={preparedPostCount}
        frameCount={frameRows.length}
        runIsActive={runIsActive}
        storyboardCanRegenerate={storyboardCanRegenerate}
        regeneratingStoryboard={regeneratingStoryboard}
        onRegenerateStoryboard={onRegenerateStoryboard}
      />
    </div>
  );
}
