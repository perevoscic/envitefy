"use client";

import { AlertTriangle, CheckCircle2, ChevronDown, Clock3, FileJson, LayoutGrid, Loader2, Sparkles } from "lucide-react";
import {
  STAGE_ORDER,
  formatRunState,
  formatStageName,
  prettyJson,
  scoreTone,
  stageLabel,
  statusLabel,
  statusTone,
  summarizeStageTime,
  type AssetType,
  type CreativeQa,
  type RunDetail,
  type RunStageRecord,
} from "@/lib/admin/marketing-hub";
import { PageCard, SecondaryButton, StatusBadge } from "./MarketingHubUi";

export function MarketingHubProduction({
  detail,
  assetType,
  qaSummary,
  preparedPostCount,
  frameCount,
  runIsActive,
  storyboardCanRegenerate,
  regeneratingStoryboard,
  onRegenerateStoryboard,
}: {
  detail: RunDetail;
  assetType: AssetType;
  qaSummary: CreativeQa | null;
  preparedPostCount: number;
  frameCount: number;
  runIsActive: boolean;
  storyboardCanRegenerate: boolean;
  regeneratingStoryboard: boolean;
  onRegenerateStoryboard: () => void;
}) {
  const isSocialImage = assetType === "social-image";
  const stageMap = detail.status?.stages || {};
  const stages = STAGE_ORDER.filter((key) =>
    isSocialImage ? key !== "video" : key !== "social-export",
  ).map((key) => {
    const record: RunStageRecord = stageMap[key] || {};
    return {
      key,
      label: stageLabel(key),
      status: record.status || "pending",
      error: record.error || null,
      updatedAt: record.updatedAt || null,
    };
  });

  return (
    <details className="group overflow-hidden rounded-[28px] border border-[#e4e0ef] bg-white shadow-[0_16px_40px_rgba(84,49,170,0.06)]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-6 py-5">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#897db6]">
            Ops
          </div>
          <h2 className="mt-1 text-lg font-semibold text-[#24193f]">Production details</h2>
          <p className="mt-1 text-sm text-[#7a7391]">
            Stages, QA, and JSON for debugging. Hidden from the default campaign journey.
          </p>
        </div>
        <ChevronDown className="h-5 w-5 text-[#8a84a1] transition group-open:rotate-180" />
      </summary>

      <div className="space-y-6 border-t border-[#f0ecf7] px-6 py-5">
        <div className="flex flex-wrap gap-3">
          <SecondaryButton
            onClick={onRegenerateStoryboard}
            disabled={!storyboardCanRegenerate || regeneratingStoryboard || runIsActive}
            icon={
              regeneratingStoryboard ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )
            }
          >
            {regeneratingStoryboard
              ? "Rewriting…"
              : isSocialImage
                ? "Regenerate concepts"
                : "Regenerate storyboard"}
          </SecondaryButton>
        </div>

        {detail.status ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "State", value: formatRunState(detail.status.state), icon: Clock3 },
              {
                label: "Current stage",
                value: formatStageName(detail.status.currentStage),
                icon: LayoutGrid,
              },
              {
                label: isSocialImage ? "Posts ready" : "Frames done",
                value: isSocialImage
                  ? `${preparedPostCount}/${frameCount}`
                  : `${detail.status.frameCounts?.done || 0}/${detail.status.frameCounts?.total || 0}`,
                icon: CheckCircle2,
              },
              {
                label: "Warnings",
                value: String(detail.status.warningMessages?.length || 0),
                icon: AlertTriangle,
              },
            ].map((item) => (
              <div key={item.label} className="rounded-[20px] border border-[#efebf6] bg-[#fbfaff] p-4">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#938ba9]">
                  <item.icon className="h-4 w-4 text-[#8a7bc4]" />
                  {item.label}
                </div>
                <div className="mt-3 text-xl font-bold tracking-[-0.04em] text-[#251b3f]">
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {stages.map((stage) => (
            <div key={stage.key} className="rounded-[20px] border border-[#efebf6] bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-[#281d44]">{stage.label}</div>
                  <div className="mt-1 text-xs text-[#8a84a1]">{summarizeStageTime(stage.updatedAt)}</div>
                </div>
                <StatusBadge tone={statusTone(stage.status)}>{statusLabel(stage.status)}</StatusBadge>
              </div>
              {stage.error ? <div className="mt-3 text-xs text-[#b64c4c]">{stage.error}</div> : null}
            </div>
          ))}
        </div>

        <PageCard
          title={<h3 className="text-base font-semibold text-[#271a45]">Creative QA</h3>}
          bodyClassName="space-y-4"
        >
          {qaSummary ? (
            <>
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-bold text-[#24193f]">
                  {qaSummary.pass ? "Approved" : "Needs rewrite"}
                </div>
                <StatusBadge tone={qaSummary.pass ? "success" : "danger"}>
                  {qaSummary.pass ? "Pass" : "Fail"}
                </StatusBadge>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ["Value clarity", qaSummary.valueClarityScore],
                  ["Visual variety", qaSummary.visualVarietyScore],
                  ["Product proof", qaSummary.productProofScore],
                ].map(([label, score]) => (
                  <div key={String(label)} className="rounded-[16px] border border-[#efebf6] p-3">
                    <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8a7bc4]">
                      {label}
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-lg font-bold">{score}/5</span>
                      <StatusBadge tone={scoreTone(Number(score))}>{score}</StatusBadge>
                    </div>
                  </div>
                ))}
              </div>
              {qaSummary.rewriteBrief ? (
                <p className="text-sm leading-6 text-[#51476b]">{qaSummary.rewriteBrief}</p>
              ) : null}
            </>
          ) : (
            <p className="text-sm text-[#8a84a1]">QA appears after storyboard planning.</p>
          )}
        </PageCard>

        <div className="space-y-3">
          {[
            ["Brief", detail.brief],
            ["Persona", detail.persona],
            ["Critique", detail.critique],
            ["Scene spec", detail.sceneSpec],
            ["Frame plan", detail.framePlan],
            ["Social copy", detail.socialCopy],
            ["Creative QA", detail.creativeQa],
          ].map(([label, value]) => (
            <details key={String(label)} className="overflow-hidden rounded-[18px] border border-[#e8e1f3]">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
                <span className="inline-flex items-center gap-2 text-sm font-bold text-[#2a1f43]">
                  <FileJson className="h-4 w-4 text-[#8a7bc4]" />
                  {label}
                </span>
                <ChevronDown className="h-4 w-4 text-[#aba5bc]" />
              </summary>
              <pre className="overflow-x-auto bg-[#171325] p-4 text-xs text-[#e8e3ff]">
                {prettyJson(value)}
              </pre>
            </details>
          ))}
        </div>
      </div>
    </details>
  );
}
