"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { buildMarketingCopyDesk } from "@/lib/admin/marketing-copy-desk";
import {
  INITIAL_FORM,
  SOCIAL_PLACEMENTS,
  clampDuration,
  isActiveRunState,
  normalizeAssetType,
  normalizeCreativeQa,
  type AssetType,
  type BrandAssetId,
  type CampaignFilter,
  type Caption,
  type Frame,
  type MarketingChannel,
  type MarketingHubForm,
  type MarketingHubView,
  type MarketingPromptIdea,
  type RunDetail,
  type RunSummary,
} from "@/lib/admin/marketing-hub";
import { MarketingHubLibrary } from "./MarketingHubLibrary";
import { MarketingHubLightbox } from "./MarketingHubLightbox";
import { MarketingHubNewCampaign } from "./MarketingHubNewCampaign";
import { MarketingHubWorkspace } from "./MarketingHubWorkspace";

export function MarketingHubPage() {
  const { data: session, status } = useSession();
  const isAdmin = Boolean((session?.user as { isAdmin?: boolean } | undefined)?.isAdmin);
  const [hubView, setHubView] = useState<MarketingHubView>("library");
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [campaignFilter, setCampaignFilter] = useState<CampaignFilter>("all");
  const [selectedRunId, setSelectedRunId] = useState("");
  const [detail, setDetail] = useState<RunDetail | null>(null);
  const [loadingRuns, setLoadingRuns] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [generatingPrompt, setGeneratingPrompt] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [savingCaptions, setSavingCaptions] = useState(false);
  const [regeneratingCaptions, setRegeneratingCaptions] = useState(false);
  const [regeneratingStoryboard, setRegeneratingStoryboard] = useState(false);
  const [renderingSocialImages, setRenderingSocialImages] = useState(false);
  const [renderingVideo, setRenderingVideo] = useState(false);
  const [lightboxFrame, setLightboxFrame] = useState<Frame | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [form, setForm] = useState<MarketingHubForm>(INITIAL_FORM);
  const [promptIdea, setPromptIdea] = useState<MarketingPromptIdea | null>(null);
  const [referenceImageFiles, setReferenceImageFiles] = useState<File[]>([]);

  async function loadRuns() {
    setLoadingRuns(true);
    try {
      const response = await fetch("/api/admin/marketing-campaigns", { cache: "no-store" });
      const json = await response.json();
      if (!response.ok) throw new Error(json?.error || "Failed to load runs");
      setRuns(Array.isArray(json.runs) ? json.runs : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load runs");
    } finally {
      setLoadingRuns(false);
    }
  }

  async function loadDetail(runId: string, preserveFrames = false) {
    if (!runId) return;
    setLoadingDetail(true);
    try {
      const response = await fetch(`/api/admin/marketing-campaigns/${encodeURIComponent(runId)}`, {
        cache: "no-store",
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json?.error || "Failed to load run detail");
      setDetail((current) => {
        if (!preserveFrames || !current?.frames?.frames?.length || !json?.frames?.frames?.length) {
          return json;
        }
        const currentFrames = new Map(
          current.frames.frames.map((frame) => [frame.frameNumber, frame]),
        );
        json.frames.frames = json.frames.frames.map((frame: Frame) => {
          const existing = currentFrames.get(frame.frameNumber);
          if (!existing?.caption?.dirty) return frame;
          return {
            ...frame,
            caption: existing.caption,
          };
        });
        return json;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load run detail");
    } finally {
      setLoadingDetail(false);
    }
  }

  useEffect(() => {
    if (status !== "authenticated" || !isAdmin) {
      setLoadingRuns(false);
      return;
    }
    loadRuns();
  }, [status, isAdmin]);

  useEffect(() => {
    if (!selectedRunId || hubView !== "workspace" || status !== "authenticated" || !isAdmin) {
      return;
    }
    loadDetail(selectedRunId);
  }, [selectedRunId, hubView, status, isAdmin]);

  useEffect(() => {
    if (!detail?.status?.state || hubView !== "workspace") return;
    if (!isActiveRunState(detail.status.state)) return;
    const intervalId = window.setInterval(() => {
      loadDetail(detail.runId, true);
      loadRuns();
    }, 2000);
    return () => window.clearInterval(intervalId);
  }, [detail?.runId, detail?.status?.state, hubView]);

  const detailAssetType = normalizeAssetType(
    detail?.request?.input?.assetType || detail?.status?.request?.assetType,
  );
  const copyDesk = useMemo(
    () =>
      buildMarketingCopyDesk({
        channels: Array.isArray(detail?.request?.input?.channels)
          ? detail.request.input.channels
          : Array.isArray(detail?.status?.request?.channels)
            ? detail.status.request.channels
            : null,
        socialCopy: detail?.socialCopy,
        request: detail?.request,
        brief: detail?.brief,
        frames: detail?.frames,
        preferStoredPacks: false,
      }),
    [detail],
  );
  const qaSummary = useMemo(() => normalizeCreativeQa(detail?.creativeQa), [detail?.creativeQa]);
  const runIsActive = isActiveRunState(detail?.status?.state);
  const storyboardCanRegenerate =
    Boolean(qaSummary) ||
    Boolean(
      detail?.status?.state === "awaiting_storyboard_review" &&
        detail?.status?.stages?.coordinator?.error,
    );
  const cameraFormat =
    detail?.sceneSpec?.cameraFormat?.value || detail?.frames?.sceneSpec?.cameraFormat || "vertical";

  function handleAssetTypeChange(assetType: AssetType) {
    setForm((current) => ({
      ...current,
      assetType,
      socialPlacement: assetType === "social-image" ? "feed-square" : current.socialPlacement,
      cameraFormat: assetType === "social-image" ? "square" : "vertical",
      frameCount: assetType === "social-image" ? "3" : "5",
    }));
  }

  function handleSocialPlacementChange(value: string) {
    const placement = SOCIAL_PLACEMENTS.find((item) => item.value === value);
    if (!placement) return;
    setForm((current) => ({
      ...current,
      socialPlacement: placement.value,
      cameraFormat: placement.cameraFormat,
    }));
  }

  function toggleMarketingChannel(channel: MarketingChannel) {
    setForm((current) => {
      const selected = current.channels.includes(channel);
      if (selected && current.channels.length === 1) return current;
      return {
        ...current,
        channels: selected
          ? current.channels.filter((value) => value !== channel)
          : [...current.channels, channel],
      };
    });
  }

  function toggleBrandAsset(asset: BrandAssetId) {
    setForm((current) => ({
      ...current,
      brandAssets: current.brandAssets.includes(asset)
        ? current.brandAssets.filter((value) => value !== asset)
        : [...current.brandAssets, asset],
    }));
  }

  function openLibrary() {
    setHubView("library");
    setSelectedRunId("");
    setDetail(null);
    setLightboxFrame(null);
    setError(null);
  }

  function openNewCampaign() {
    setError(null);
    setShowAdvanced(false);
    setLightboxFrame(null);
    setDetail(null);
    setSelectedRunId("");
    setForm(INITIAL_FORM);
    setPromptIdea(null);
    setReferenceImageFiles([]);
    setHubView("new");
  }

  function openCampaign(runId: string) {
    setError(null);
    setSelectedRunId(runId);
    setHubView("workspace");
  }

  async function handleGeneratePromptIdea() {
    setGeneratingPrompt(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/marketing-campaigns/prompt-ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idea: form.idea,
          campaignName: form.campaignName,
          audience: form.audience,
          objective: form.objective,
          channels: form.channels,
          assetType: form.assetType,
          targetVertical: form.targetVertical || "General",
          tone: form.tone,
          callToAction: form.callToAction,
        }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json?.error || "Failed to generate a prompt idea");
      const idea = json.idea as MarketingPromptIdea;
      setPromptIdea(idea);
      setForm((current) => ({
        ...current,
        campaignName: idea.campaignName || current.campaignName,
        criteria: idea.generatedPrompt,
        audience: idea.audience || current.audience,
        tone: idea.tone || current.tone,
        callToAction: idea.callToAction || current.callToAction,
        visualStyle: idea.visualStyle || current.visualStyle,
        composition: idea.composition || current.composition,
        mood: idea.mood || current.mood,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate a prompt idea");
    } finally {
      setGeneratingPrompt(false);
    }
  }

  async function handleGenerate(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const parsedFrameCount = Number.parseInt(`${form.frameCount}`.trim(), 10);
      const frameCount =
        Number.isFinite(parsedFrameCount) && parsedFrameCount >= 1
          ? Math.min(24, parsedFrameCount)
          : 5;
      const criteria = form.criteria.trim() || form.idea.trim();
      const payload = {
        assetType: form.assetType,
        campaignName: form.campaignName,
        jobLabel: form.campaignName,
        idea: form.idea,
        channels: form.channels,
        brandAssets: form.brandAssets,
        audience: form.audience,
        objective: form.objective,
        socialPlacement: form.assetType === "social-image" ? form.socialPlacement : "",
        criteria,
        productName: form.productName,
        targetVertical: form.targetVertical || "General",
        tone: form.tone,
        callToAction: form.callToAction,
        frameCount,
        notes: form.notes,
        overrides: {
          characterLock: form.characterLock,
          outfitLock: form.outfitLock,
          phoneLock: form.phoneLock,
          flyerLock: form.flyerLock,
          locationLock: form.locationLock,
          backgroundAnchors: form.backgroundAnchors,
          screenLock: form.screenLock,
          cameraFormat: form.cameraFormat,
          visualStyle: form.visualStyle,
          composition: form.composition,
          mood: form.mood,
        },
      };
      const requestInit: RequestInit =
        referenceImageFiles.length > 0
          ? (() => {
              const formData = new FormData();
              formData.append("payload", JSON.stringify(payload));
              for (const file of referenceImageFiles) {
                formData.append("referenceImages", file);
              }
              return {
                method: "POST",
                body: formData,
              };
            })()
          : {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            };
      const response = await fetch("/api/admin/marketing-campaigns", requestInit);
      const json = await response.json();
      if (!response.ok) throw new Error(json?.error || "Failed to start run");
      await loadRuns();
      setSelectedRunId(json.runId);
      setHubView("workspace");
      await loadDetail(json.runId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start run");
    } finally {
      setSubmitting(false);
    }
  }

  function updateFrameCaption(frameNumber: number, field: keyof Caption, value: string | number) {
    setDetail((current) => {
      if (!current?.frames) return current;
      return {
        ...current,
        frames: {
          ...current.frames,
          frames: current.frames.frames.map((frame) => {
            if (frame.frameNumber !== frameNumber) return frame;
            return {
              ...frame,
              caption: {
                ...frame.caption,
                [field]: field === "durationSec" ? clampDuration(Number(value)) : value,
                dirty: true,
              },
            };
          }),
        },
      };
    });
  }

  async function persistCaptions() {
    if (!detail?.runId || !detail?.frames?.frames?.length) return;
    const payload = {
      captions: detail.frames.frames.map((frame) => ({
        frameNumber: frame.frameNumber,
        text: frame.caption.text,
        emphasisWord: frame.caption.emphasisWord,
        voiceover: frame.caption.voiceover,
        durationSec: clampDuration(frame.caption.durationSec),
        transition: frame.caption.transition || "cut",
        kineticStyle: frame.caption.kineticStyle || "static",
      })),
    };
    const response = await fetch(
      `/api/admin/marketing-campaigns/${encodeURIComponent(detail.runId)}/captions`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    const json = await response.json();
    if (!response.ok) throw new Error(json?.error || "Failed to save captions");
    await loadDetail(detail.runId);
  }

  async function handleSaveCaptions() {
    if (!detail?.runId || !detail?.frames?.frames?.length) return;
    setSavingCaptions(true);
    setError(null);
    try {
      await persistCaptions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save captions");
    } finally {
      setSavingCaptions(false);
    }
  }

  async function handleRegenerateCaptions() {
    if (!detail?.runId) return;
    setRegeneratingCaptions(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/admin/marketing-campaigns/${encodeURIComponent(detail.runId)}/captions/regenerate`,
        { method: "POST" },
      );
      const json = await response.json();
      if (!response.ok) throw new Error(json?.error || "Failed to regenerate captions");
      await loadDetail(detail.runId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to regenerate captions");
    } finally {
      setRegeneratingCaptions(false);
    }
  }

  async function handleRegenerateStoryboard() {
    if (!detail?.runId) return;
    setRegeneratingStoryboard(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/admin/marketing-campaigns/${encodeURIComponent(detail.runId)}/storyboard/regenerate`,
        { method: "POST" },
      );
      const json = await response.json();
      if (!response.ok) throw new Error(json?.error || "Failed to regenerate storyboard");
      await loadRuns();
      await loadDetail(detail.runId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to regenerate storyboard");
    } finally {
      setRegeneratingStoryboard(false);
    }
  }

  async function handleRenderVideo() {
    if (!detail?.runId) return;
    setRenderingVideo(true);
    setError(null);
    try {
      await persistCaptions();
      const response = await fetch(
        `/api/admin/marketing-campaigns/${encodeURIComponent(detail.runId)}/video`,
        { method: "POST" },
      );
      const json = await response.json();
      if (!response.ok) throw new Error(json?.error || "Failed to start video render");
      await loadDetail(detail.runId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start video render");
    } finally {
      setRenderingVideo(false);
    }
  }

  async function handlePrepareSocialImages() {
    if (!detail?.runId) return;
    setRenderingSocialImages(true);
    setError(null);
    try {
      await persistCaptions();
      const response = await fetch(
        `/api/admin/marketing-campaigns/${encodeURIComponent(detail.runId)}/social-images`,
        { method: "POST" },
      );
      const json = await response.json();
      if (!response.ok) throw new Error(json?.error || "Failed to prepare social posts");
      await loadRuns();
      await loadDetail(detail.runId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to prepare social posts");
    } finally {
      setRenderingSocialImages(false);
    }
  }

  if (status === "loading") {
    return <div className="p-6">Loading…</div>;
  }

  if (status !== "authenticated") {
    return (
      <div className="p-6">
        <p className="mb-3">You must sign in to view this page.</p>
        <Link href="/">Go home</Link>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-6">
        <p className="mb-3">Forbidden: Admins only.</p>
        <Link href="/">Go home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-[70dvh]">
      {error ? (
        <div className="mb-6 rounded-[22px] border border-[#efbbbb] bg-[#fff4f4] px-4 py-3 text-sm text-[#a73e3e]">
          {error}
        </div>
      ) : null}

      {hubView === "library" ? (
        <MarketingHubLibrary
          runs={runs}
          loadingRuns={loadingRuns}
          campaignFilter={campaignFilter}
          onFilterChange={setCampaignFilter}
          onOpenCampaign={openCampaign}
          onNewCampaign={openNewCampaign}
        />
      ) : null}

      {hubView === "new" ? (
        <MarketingHubNewCampaign
          form={form}
          setForm={setForm}
          submitting={submitting}
          generatingPrompt={generatingPrompt}
          showAdvanced={showAdvanced}
          setShowAdvanced={setShowAdvanced}
          promptIdea={promptIdea}
          referenceImageFiles={referenceImageFiles}
          setReferenceImageFiles={setReferenceImageFiles}
          onBack={openLibrary}
          onGenerate={handleGenerate}
          onGeneratePromptIdea={handleGeneratePromptIdea}
          onAssetTypeChange={handleAssetTypeChange}
          onToggleChannel={toggleMarketingChannel}
          onToggleBrandAsset={toggleBrandAsset}
          onSocialPlacementChange={handleSocialPlacementChange}
        />
      ) : null}

      {hubView === "workspace" && detail ? (
        <MarketingHubWorkspace
          detail={detail}
          loadingDetail={loadingDetail}
          assetType={detailAssetType}
          copyDesk={copyDesk}
          qaSummary={qaSummary}
          cameraFormat={cameraFormat}
          runIsActive={runIsActive}
          storyboardCanRegenerate={storyboardCanRegenerate}
          savingCaptions={savingCaptions}
          regeneratingCaptions={regeneratingCaptions}
          regeneratingStoryboard={regeneratingStoryboard}
          renderingSocialImages={renderingSocialImages}
          renderingVideo={renderingVideo}
          onBack={openLibrary}
          onCopyError={setError}
          onPrepareSocialImages={handlePrepareSocialImages}
          onRenderVideo={handleRenderVideo}
          onSaveCaptions={handleSaveCaptions}
          onRegenerateCaptions={handleRegenerateCaptions}
          onRegenerateStoryboard={handleRegenerateStoryboard}
          onUpdateCaption={updateFrameCaption}
          onOpenFrame={setLightboxFrame}
        />
      ) : null}

      {hubView === "workspace" && !detail ? (
        <div className="rounded-[24px] border border-dashed border-[#ddd8e9] bg-white px-5 py-16 text-center text-sm text-[#8a84a1]">
          {loadingDetail ? "Loading campaign…" : "Select a campaign from the library."}
        </div>
      ) : null}

      <MarketingHubLightbox frame={lightboxFrame} onClose={() => setLightboxFrame(null)} />
    </div>
  );
}
