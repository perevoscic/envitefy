"use client";

import { Check, ServerCog } from "lucide-react";
import { useMemo, useState } from "react";
import type {
  AdStudioCampaign,
  AdStudioGenerateResponse,
  AdStudioImagesResponse,
  AdStudioProviderStatus,
  AdStudioRequest,
  PipelineStepStatus,
} from "@/lib/admin/ad-studio-types";
import { AdStudioInput } from "./components/AdStudioInput";
import { CampaignBriefTab } from "./components/CampaignBriefTab";
import { ExportTab } from "./components/ExportTab";
import { FramesTab } from "./components/FramesTab";
import { InvitationTab } from "./components/InvitationTab";
import { PipelineProgress } from "./components/PipelineProgress";
import { ProductUITab } from "./components/ProductUITab";
import { QATab } from "./components/QATab";
import { ScriptTab } from "./components/ScriptTab";
import { VeoPromptsTab } from "./components/VeoPromptsTab";
import { VideoPreviewTab } from "./components/VideoPreviewTab";

type AdStudioClientProps = {
  providerStatuses: AdStudioProviderStatus[];
};

type TabId =
  | "brief"
  | "script"
  | "invitation"
  | "product-ui"
  | "frames"
  | "preview"
  | "qa"
  | "veo"
  | "exports";

const DEFAULT_REQUEST: AdStudioRequest = {
  instruction:
    "Create a vertical promo video where a busy mom has a baby shower flyer on the fridge, she is overwhelmed with texts asking for RSVP and registry details, then Envitefy turns the invite into a polished live event page.",
  videoLength: 15,
  format: "vertical",
  eventType: "baby-shower",
  tone: "family-friendly",
  visualStyle: "cinematic-realistic",
  cta: "snap-share-celebrate",
  customCta: null,
};

const TABS: Array<{ id: TabId; label: string }> = [
  { id: "brief", label: "Campaign Brief" },
  { id: "script", label: "Script" },
  { id: "invitation", label: "Invitation" },
  { id: "product-ui", label: "Product UI" },
  { id: "frames", label: "Frames" },
  { id: "preview", label: "Preview" },
  { id: "qa", label: "QA" },
  { id: "veo", label: "Veo Prompts" },
  { id: "exports", label: "Exports" },
];

function pendingSteps(): PipelineStepStatus[] {
  return [
    ["creative-concept", "Creative concept"],
    ["script", "Script"],
    ["invitation-design", "Invitation design"],
    ["product-ui", "Product UI"],
    ["frame-plan", "Frame plan"],
    ["base-image-generation", "Base image generation"],
    ["compositing", "Compositing"],
    ["qa", "QA"],
    ["veo-prompt-package", "Veo prompt package"],
    ["export", "Export"],
  ].map(([id, label]) => ({
    id: id as PipelineStepStatus["id"],
    label,
    status: "pending",
    summary: "Waiting to run.",
    error: null,
    updatedAt: null,
  }));
}

function parseError(
  data: AdStudioGenerateResponse | AdStudioImagesResponse | null,
  status: number,
) {
  if (data && !data.ok) return data.error.message;
  return `Ad Hub request failed with status ${status}.`;
}

function tabForStep(stepId: PipelineStepStatus["id"]): TabId {
  if (stepId === "script") return "script";
  if (stepId === "invitation-design") return "invitation";
  if (stepId === "product-ui") return "product-ui";
  if (stepId === "base-image-generation" || stepId === "compositing") return "frames";
  if (stepId === "qa") return "qa";
  if (stepId === "veo-prompt-package") return "veo";
  if (stepId === "export") return "exports";
  return "brief";
}

function updatePipelineStep(
  steps: PipelineStepStatus[],
  id: PipelineStepStatus["id"],
  status: PipelineStepStatus["status"],
  summary: string,
  error: string | null = null,
): PipelineStepStatus[] {
  return steps.map((step) =>
    step.id === id
      ? {
          ...step,
          status,
          summary,
          error,
          updatedAt: new Date().toISOString(),
        }
      : step,
  );
}

export default function AdStudioClient({ providerStatuses }: AdStudioClientProps) {
  const [request, setRequest] = useState<AdStudioRequest>(DEFAULT_REQUEST);
  const [campaign, setCampaign] = useState<AdStudioCampaign | null>(null);
  const [steps, setSteps] = useState<PipelineStepStatus[]>(() => pendingSteps());
  const [activeTab, setActiveTab] = useState<TabId>("brief");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const hasFailedStep = useMemo(
    () => (campaign?.steps || steps).some((step) => step.status === "failed"),
    [campaign?.steps, steps],
  );

  function updateRequest(patch: Partial<AdStudioRequest>) {
    setRequest((current) => ({ ...current, ...patch }));
  }

  async function copyText(value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  function markImageGenerationFailed(nextCampaign: AdStudioCampaign, message: string) {
    const failedSteps = updatePipelineStep(
      nextCampaign.steps,
      "base-image-generation",
      "failed",
      "Base image generation stopped before frames were accepted.",
      message,
    );
    const failedCampaign = { ...nextCampaign, steps: failedSteps };
    setCampaign(failedCampaign);
    setSteps(failedSteps);
    setActiveTab("frames");
  }

  async function generateFrames(nextCampaign: AdStudioCampaign, frameNumber?: number) {
    const optimisticSteps = updatePipelineStep(
      nextCampaign.steps,
      "base-image-generation",
      "running",
      frameNumber
        ? `Image Generation Agent is regenerating base frame ${frameNumber}.`
        : "Image Generation Agent is creating realistic base scenes only.",
    );
    const optimisticCampaign = { ...nextCampaign, steps: optimisticSteps };
    setCampaign(optimisticCampaign);
    setSteps(optimisticSteps);
    setActiveTab("frames");

    let usedServerCampaign = false;
    try {
      const response = await fetch("/api/admin/ad-studio/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          runId: optimisticCampaign.runId,
          campaign: optimisticCampaign,
          frameNumber: frameNumber || null,
        }),
      });
      const data = (await response.json().catch(() => null)) as
        | (AdStudioImagesResponse & { campaign?: AdStudioCampaign })
        | null;
      if (!response.ok || !data?.ok) {
        const message = parseError(data, response.status);
        if (data && "campaign" in data && data.campaign) {
          usedServerCampaign = true;
          setCampaign(data.campaign);
          setSteps(data.campaign.steps);
        } else {
          markImageGenerationFailed(optimisticCampaign, message);
        }
        throw new Error(message);
      }
      setCampaign(data.campaign);
      setSteps(data.campaign.steps);
      setActiveTab(frameNumber ? "frames" : "preview");
      return data.campaign;
    } catch (frameError) {
      const message =
        frameError instanceof Error ? frameError.message : "Base image generation failed.";
      if (!usedServerCampaign) {
        markImageGenerationFailed(optimisticCampaign, message);
      }
      throw frameError;
    }
  }

  async function handleGenerate() {
    setIsGenerating(true);
    setError(null);
    setSteps(
      pendingSteps().map((step, index) => (index === 0 ? { ...step, status: "running" } : step)),
    );
    try {
      const response = await fetch("/api/admin/ad-studio/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      const data = (await response.json().catch(() => null)) as AdStudioGenerateResponse | null;
      if (!response.ok || !data?.ok) throw new Error(parseError(data, response.status));
      setCampaign(data.campaign);
      setSteps(data.campaign.steps);
      await generateFrames(data.campaign);
    } catch (generationError) {
      setError(
        generationError instanceof Error ? generationError.message : "Ad Hub generation failed.",
      );
    } finally {
      setIsGenerating(false);
    }
  }

  async function retryFailedOrFrame(frameNumber?: number) {
    if (!campaign) return;
    setIsGenerating(true);
    setError(null);
    try {
      await generateFrames(campaign, frameNumber);
    } catch (retryError) {
      setError(retryError instanceof Error ? retryError.message : "Retry failed.");
    } finally {
      setIsGenerating(false);
    }
  }

  const visibleSteps = campaign?.steps || steps;

  return (
    <div className="space-y-6">
      <ProviderStrip providers={providerStatuses} />
      <AdStudioInput
        request={request}
        isGenerating={isGenerating}
        onChange={updateRequest}
        onGenerate={handleGenerate}
      />
      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
          {error}
        </div>
      ) : null}
      {copied ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          Copied to clipboard.
        </div>
      ) : null}
      <PipelineProgress
        steps={visibleSteps}
        isGenerating={isGenerating}
        onContinueImages={campaign ? () => retryFailedOrFrame() : undefined}
        onRetryFailed={hasFailedStep ? () => retryFailedOrFrame() : undefined}
        onViewDetails={(stepId) => setActiveTab(tabForStep(stepId))}
      />
      {campaign ? (
        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex gap-1 overflow-x-auto border-b border-slate-200 px-3 py-3">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`min-h-9 rounded-md px-3 text-sm font-semibold transition ${
                  activeTab === tab.id
                    ? "bg-violet-600 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="bg-slate-50 p-4">
            {activeTab === "brief" ? <CampaignBriefTab campaign={campaign} /> : null}
            {activeTab === "script" ? <ScriptTab campaign={campaign} /> : null}
            {activeTab === "invitation" ? <InvitationTab campaign={campaign} /> : null}
            {activeTab === "product-ui" ? <ProductUITab campaign={campaign} /> : null}
            {activeTab === "frames" ? (
              <FramesTab
                campaign={campaign}
                isGenerating={isGenerating}
                onGenerateFrames={() => retryFailedOrFrame()}
                onRetryFrame={(frameNumber) => retryFailedOrFrame(frameNumber)}
              />
            ) : null}
            {activeTab === "qa" ? <QATab campaign={campaign} /> : null}
            {activeTab === "preview" ? <VideoPreviewTab campaign={campaign} /> : null}
            {activeTab === "veo" ? <VeoPromptsTab campaign={campaign} onCopy={copyText} /> : null}
            {activeTab === "exports" ? <ExportTab campaign={campaign} onCopy={copyText} /> : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function ProviderStrip({ providers }: { providers: AdStudioProviderStatus[] }) {
  return (
    <section className="grid gap-3 md:grid-cols-3">
      {providers.map((provider) => (
        <div
          key={provider.id}
          className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="flex items-center gap-2">
            {provider.configured ? (
              <Check className="h-4 w-4 text-emerald-600" />
            ) : (
              <ServerCog className="h-4 w-4 text-amber-600" />
            )}
            <p className="text-sm font-semibold text-slate-950">{provider.label}</p>
          </div>
          <p className="mt-2 text-xs text-slate-600">
            {provider.provider} · {provider.model}
          </p>
        </div>
      ))}
    </section>
  );
}
