"use client";

import { Download, Images, Loader2, Video } from "lucide-react";
import {
  assetTypeLabel,
  mediaAspectClass,
  type AssetType,
  type Frame,
} from "@/lib/admin/marketing-hub";
import { PageCard, PrimaryButton, StatusBadge } from "./MarketingHubUi";
import { cn } from "@/lib/utils";

export function MarketingHubCreatives({
  assetType,
  frameRows,
  videoUrl,
  captionsUrl,
  cameraFormat,
  runIsActive,
  statusMessage,
  preparedPostCount,
  renderingSocialImages,
  renderingVideo,
  onPrepareSocialImages,
  onRenderVideo,
  onOpenFrame,
}: {
  assetType: AssetType;
  frameRows: Frame[];
  videoUrl: string | null;
  captionsUrl: string | null;
  cameraFormat: string;
  runIsActive: boolean;
  statusMessage: string;
  preparedPostCount: number;
  renderingSocialImages: boolean;
  renderingVideo: boolean;
  onPrepareSocialImages: () => void;
  onRenderVideo: () => void;
  onOpenFrame: (frame: Frame) => void;
}) {
  const thumbAspectClass = mediaAspectClass(cameraFormat);
  const isSocialImage = assetType === "social-image";

  return (
    <PageCard
      title={
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#897db6]">
            Downloads
          </div>
          <h2 className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-[#24193f]">
            Creatives
          </h2>
          <p className="mt-1 text-sm text-[#7a7391]">
            {isSocialImage
              ? "Download PNG posts for the native apps."
              : "Open the MP4 and SRT when the video is ready."}
          </p>
        </div>
      }
      action={
        isSocialImage ? (
          <PrimaryButton
            onClick={onPrepareSocialImages}
            disabled={!frameRows.length || renderingSocialImages || runIsActive}
            icon={
              renderingSocialImages ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Images className="h-4 w-4" />
              )
            }
          >
            {renderingSocialImages
              ? "Preparing…"
              : preparedPostCount
                ? "Update PNGs"
                : "Prepare PNG downloads"}
          </PrimaryButton>
        ) : (
          <PrimaryButton
            onClick={onRenderVideo}
            disabled={renderingVideo || runIsActive}
            icon={
              renderingVideo ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Video className="h-4 w-4" />
              )
            }
          >
            {renderingVideo ? "Rendering…" : videoUrl ? "Re-render video" : "Render video"}
          </PrimaryButton>
        )
      }
    >
      {runIsActive ? (
        <div className="mb-5 flex items-center gap-3 rounded-[20px] border border-[#e8e1f4] bg-[#faf8fd] px-4 py-3 text-sm text-[#5f5678]">
          <Loader2 className="h-4 w-4 animate-spin text-[#7c67c5]" />
          {statusMessage || `Generating ${assetTypeLabel(assetType).toLowerCase()}…`}
        </div>
      ) : null}

      {!isSocialImage && videoUrl ? (
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start">
          <div className="flex flex-wrap gap-3">
            <a
              href={videoUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center rounded-[18px] bg-[#7c67c5] px-4 py-2.5 text-sm font-semibold text-white"
            >
              Open MP4
            </a>
            {captionsUrl ? (
              <a
                href={captionsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center rounded-[18px] border border-[#ddd8e9] px-4 py-2.5 text-sm font-semibold text-[#5f5678]"
              >
                Open SRT
              </a>
            ) : null}
          </div>
          <video
            src={videoUrl}
            controls
            className="max-h-[240px] w-full max-w-[400px] rounded-[20px] border border-[#e4e0ef] bg-black object-contain"
          >
            <track
              kind="captions"
              src={captionsUrl || ""}
              srcLang="en"
              label="Generated captions"
              default
            />
          </video>
        </div>
      ) : null}

      {frameRows.length ? (
        <div
          className={
            isSocialImage
              ? "flex flex-wrap gap-4"
              : "flex gap-3 overflow-x-auto pb-1"
          }
        >
          {frameRows.map((frame) => {
            const previewImageUrl =
              isSocialImage && frame.captionedImageUrl ? frame.captionedImageUrl : frame.imageUrl;
            const downloadUrl = frame.captionedImageUrl || frame.imageUrl;
            return (
              <article
                key={frame.frameNumber}
                className={cn(
                  "overflow-hidden rounded-[20px] border border-[#efebf6] bg-[#fcfbfd]",
                  isSocialImage ? "w-full max-w-[280px]" : "w-[160px] shrink-0",
                )}
              >
                <div className="relative bg-[#f1ecfb]">
                  {previewImageUrl ? (
                    <button
                      type="button"
                      onClick={() => onOpenFrame({ ...frame, imageUrl: previewImageUrl })}
                      className="group block w-full text-left"
                      aria-label={`Open ${isSocialImage ? "social post" : "frame"} ${frame.frameNumber} image`}
                    >
                      <img
                        src={previewImageUrl}
                        alt={`${isSocialImage ? "Social post" : "Frame"} ${frame.frameNumber}: ${frame.title}`}
                        className={cn(
                          isSocialImage ? thumbAspectClass : "aspect-[9/16]",
                          "w-full object-cover",
                        )}
                      />
                    </button>
                  ) : (
                    <div
                      className={cn(
                        isSocialImage ? thumbAspectClass : "aspect-[9/16]",
                        "flex items-center justify-center text-sm font-medium text-[#8a84a1]",
                      )}
                    >
                      {frame.status === "pending" ? "Pending" : "Rendering…"}
                    </div>
                  )}
                  <div className="absolute left-2 top-2">
                    <StatusBadge tone="info">
                      {isSocialImage ? "Post" : "Frame"} {frame.frameNumber}
                    </StatusBadge>
                  </div>
                </div>
                <div className="space-y-2 p-3">
                  <div className="line-clamp-2 text-xs font-semibold text-[#24193f]">{frame.title}</div>
                  {downloadUrl ? (
                    <a
                      href={downloadUrl}
                      download
                      className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-[14px] bg-[#24193f] px-3 py-2 text-[11px] font-bold text-white transition hover:bg-[#352656]"
                    >
                      <Download className="h-3.5 w-3.5" aria-hidden="true" />
                      {frame.captionedImageUrl ? "Download PNG" : "Download artwork"}
                    </a>
                  ) : null}
                  {isSocialImage && frame.imageUrl && frame.captionedImageUrl ? (
                    <a
                      href={frame.imageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-9 w-full items-center justify-center rounded-[12px] border border-[#e3ddec] px-3 py-1.5 text-[11px] font-semibold text-[#675d7f]"
                    >
                      Open original artwork
                    </a>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-[22px] border border-dashed border-[#ddd8e9] px-5 py-12 text-center text-sm text-[#8a84a1]">
          {runIsActive
            ? "Creatives will appear here as they finish."
            : isSocialImage
              ? "Post images will appear here after generation."
              : "Video frames will appear here after generation."}
        </div>
      )}
    </PageCard>
  );
}
