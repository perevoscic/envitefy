"use client";

import { Clapperboard, Images, Loader2, Plus, Sparkles } from "lucide-react";
import {
  MARKETING_CHANNELS,
  assetTypeLabel,
  campaignChannels,
  campaignTitle,
  channelLabel,
  hubStatusLabel,
  runAssetType,
  statusTone,
  type CampaignFilter,
  type RunSummary,
} from "@/lib/admin/marketing-hub";
import { PageCard, PrimaryButton, StatusBadge } from "./MarketingHubUi";
import { cn } from "@/lib/utils";

export function MarketingHubLibrary({
  runs,
  loadingRuns,
  campaignFilter,
  onFilterChange,
  onOpenCampaign,
  onNewCampaign,
}: {
  runs: RunSummary[];
  loadingRuns: boolean;
  campaignFilter: CampaignFilter;
  onFilterChange: (filter: CampaignFilter) => void;
  onOpenCampaign: (runId: string) => void;
  onNewCampaign: () => void;
}) {
  const filteredRuns =
    campaignFilter === "all"
      ? runs
      : runs.filter((run) => campaignChannels(run).includes(campaignFilter));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7c67c5]">
            Marketing Hub
          </p>
          <h1 className="mt-1 font-[var(--font-playfair)] text-4xl font-semibold tracking-[-0.04em] text-[#23183d]">
            Library
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#7a7391]">
            Open a campaign for downloads and paste-ready copy, or start a new one. Envitefy does
            not connect accounts, publish, or schedule.
          </p>
        </div>
        <PrimaryButton onClick={onNewCampaign} icon={<Plus className="h-4 w-4" />}>
          New campaign
        </PrimaryButton>
      </div>

      <PageCard bodyClassName="px-4 py-4 sm:px-6">
        <div
          className="mb-4 flex gap-2 overflow-x-auto pb-1"
          role="group"
          aria-label="Filter campaigns by channel"
        >
          {[
            { value: "all" as const, label: "All" },
            ...MARKETING_CHANNELS.map((channel) => ({
              value: channel.value,
              label: channel.label,
            })),
          ].map((filter) => {
            const selected = campaignFilter === filter.value;
            return (
              <button
                key={filter.value}
                type="button"
                onClick={() => onFilterChange(filter.value)}
                aria-pressed={selected}
                className={cn(
                  "min-h-11 shrink-0 cursor-pointer rounded-full border px-3 text-[10px] font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c67c5]",
                  selected
                    ? "border-[#7c67c5] bg-[#7c67c5] text-white"
                    : "border-[#e1dbea] bg-white text-[#726889] hover:bg-[#f8f5fc]",
                )}
              >
                {filter.label}
              </button>
            );
          })}
        </div>

        {loadingRuns ? (
          <div className="flex items-center gap-2 px-2 py-10 text-sm text-[#8a84a1]">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading campaigns…
          </div>
        ) : filteredRuns.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {filteredRuns.map((run) => {
              const runState = run.status?.state || "unknown";
              const runAssetTypeValue = runAssetType(run);
              const thumbUrl = run.thumbnailUrl || null;
              const status = hubStatusLabel(runState);
              return (
                <button
                  type="button"
                  key={run.runId}
                  onClick={() => onOpenCampaign(run.runId)}
                  className="max-w-[220px] cursor-pointer overflow-hidden rounded-[20px] border border-[#efeaf7] bg-[#fcfbfd] text-left transition hover:border-[#d9d0ef] hover:shadow-[0_10px_24px_rgba(84,49,170,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c67c5]"
                >
                  <div className="relative aspect-square bg-[#f1ecfb]">
                    {thumbUrl ? (
                      <img
                        src={thumbUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[#b7add2]">
                        {runAssetTypeValue === "social-image" ? (
                          <Images className="h-8 w-8" aria-hidden="true" />
                        ) : (
                          <Clapperboard className="h-8 w-8" aria-hidden="true" />
                        )}
                      </div>
                    )}
                    <div className="absolute left-2 top-2">
                      <StatusBadge tone={statusTone(status)}>{status}</StatusBadge>
                    </div>
                    {status === "Generating" ? (
                      <Loader2 className="absolute right-2 top-2 h-4 w-4 animate-spin text-white drop-shadow" />
                    ) : null}
                  </div>
                  <div className="space-y-1 px-3 py-2.5">
                    <div className="line-clamp-2 text-sm font-bold leading-5 text-[#24193f]">
                      {campaignTitle(run)}
                    </div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8a84a1]">
                      {assetTypeLabel(runAssetTypeValue)}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="rounded-[22px] border border-dashed border-[#ddd8e9] px-4 py-12 text-center">
            <Sparkles className="mx-auto h-6 w-6 text-[#7c67c5]" aria-hidden="true" />
            <p className="mt-3 text-sm font-semibold text-[#46375f]">
              {campaignFilter === "all"
                ? "No campaigns yet"
                : `No ${channelLabel(campaignFilter)} campaigns yet`}
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#8a84a1]">
              Start with a short idea and the platforms you need. You will get downloads and
              copy-paste packs for each network.
            </p>
            <div className="mt-5">
              <PrimaryButton onClick={onNewCampaign} icon={<Plus className="h-4 w-4" />}>
                New campaign
              </PrimaryButton>
            </div>
          </div>
        )}
      </PageCard>
    </div>
  );
}
