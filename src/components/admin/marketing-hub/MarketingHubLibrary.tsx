"use client";

import { Clapperboard, Images, Loader2, Plus, Sparkles } from "lucide-react";
import {
  MARKETING_CHANNELS,
  assetTypeLabel,
  campaignChannels,
  campaignTitle,
  channelLabel,
  formatTimestamp,
  hubStatusLabel,
  runAssetType,
  statusTone,
  type CampaignFilter,
  type RunSummary,
} from "@/lib/admin/marketing-hub";
import { ChannelChip, PageCard, PrimaryButton, StatusBadge } from "./MarketingHubUi";
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
          <div className="space-y-2">
            {filteredRuns.map((run) => {
              const runState = run.status?.state || "unknown";
              const runAssetTypeValue = runAssetType(run);
              const runChannels = campaignChannels(run);
              return (
                <button
                  type="button"
                  key={run.runId}
                  onClick={() => onOpenCampaign(run.runId)}
                  className="w-full cursor-pointer rounded-[22px] border border-transparent px-4 py-4 text-left transition hover:border-[#e8e1f4] hover:bg-[#faf8fd] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c67c5]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-bold text-[#24193f]">
                        {campaignTitle(run)}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <StatusBadge tone={statusTone(hubStatusLabel(runState))}>
                          {hubStatusLabel(runState)}
                        </StatusBadge>
                        <StatusBadge
                          tone={runAssetTypeValue === "social-image" ? "info" : "default"}
                        >
                          {assetTypeLabel(runAssetTypeValue)}
                        </StatusBadge>
                        <span className="text-xs font-medium text-[#7b7394]">
                          {formatTimestamp(run.status?.generatedAt || run.request?.generatedAt)}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {runChannels.length ? (
                          runChannels.map((channel) => (
                            <ChannelChip key={channel} label={channelLabel(channel)} />
                          ))
                        ) : (
                          <span className="text-[10px] font-medium text-[#9890a8]">
                            Channel not recorded
                          </span>
                        )}
                      </div>
                    </div>
                    {hubStatusLabel(runState) === "Generating" ? (
                      <Loader2 className="mt-0.5 h-4 w-4 animate-spin text-[#7c67c5]" />
                    ) : runAssetTypeValue === "social-image" ? (
                      <Images className="mt-0.5 h-4 w-4 text-[#b7add2]" aria-hidden="true" />
                    ) : (
                      <Clapperboard className="mt-0.5 h-4 w-4 text-[#b7add2]" aria-hidden="true" />
                    )}
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
