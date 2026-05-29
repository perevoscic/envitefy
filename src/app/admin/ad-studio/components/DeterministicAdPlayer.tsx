"use client";

import {
  Calendar,
  Check,
  Copy,
  MapPin,
  MessageCircle,
  Pause,
  Play,
  RefreshCw,
  Share2,
  Upload,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type {
  AdStudioCampaign,
  AdStudioRenderableFormat,
  VideoScene,
} from "@/lib/admin/ad-studio-types";

type TimedScene = VideoScene & {
  startSecond: number;
  endSecond: number;
};

const FRAME_CLASS: Record<AdStudioRenderableFormat, string> = {
  vertical: "mx-auto aspect-[9/16] w-full max-w-[390px]",
  horizontal: "mx-auto aspect-video w-full max-w-[920px]",
  square: "mx-auto aspect-square w-full max-w-[620px]",
};

function fallbackScene(campaign: AdStudioCampaign): VideoScene {
  return {
    sceneNumber: 1,
    timestamp: "0:00",
    durationSeconds: campaign.request.videoLength,
    purpose: "hook",
    visual: campaign.campaignBrief.adSummary,
    voiceover: campaign.script.voiceoverScript,
    onScreenText: campaign.campaignBrief.painPoint,
    captionOverlay: campaign.campaignBrief.benefit,
    chatBubbles: [],
  };
}

function buildTimedScenes(campaign: AdStudioCampaign): TimedScene[] {
  const scenes = campaign.script.scenes.length ? campaign.script.scenes : [fallbackScene(campaign)];
  const total = campaign.script.totalSeconds || campaign.request.videoLength;
  let cursor = 0;
  return scenes.map((scene, index) => {
    const remainingScenes = Math.max(1, scenes.length - index);
    const fallbackDuration = Math.max(1, (total - cursor) / remainingScenes);
    const duration = scene.durationSeconds || fallbackDuration;
    const startSecond = cursor;
    const endSecond = index === scenes.length - 1 ? total : Math.min(total, cursor + duration);
    cursor = endSecond;
    return { ...scene, startSecond, endSecond };
  });
}

function backgroundFor(campaign: AdStudioCampaign, sceneNumber: number): string | null {
  const baseFrame = campaign.baseFrames.find((frame) => frame.frameNumber === sceneNumber);
  if (baseFrame?.url) return baseFrame.url;
  const compositeFrame = campaign.compositeFrames.find(
    (frame) => frame.frameNumber === sceneNumber,
  );
  return compositeFrame?.finalUrl || null;
}

function ctaText(campaign: AdStudioCampaign): string {
  return campaign.request.cta === "custom" && campaign.request.customCta
    ? campaign.request.customCta
    : campaign.campaignBrief.cta;
}

export function DeterministicAdPlayer({
  campaign,
  format,
}: {
  campaign: AdStudioCampaign;
  format: AdStudioRenderableFormat;
}) {
  const timedScenes = useMemo(() => buildTimedScenes(campaign), [campaign]);
  const totalSeconds = campaign.script.totalSeconds || campaign.request.videoLength;
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    setCurrentTime(0);
    setIsPlaying(false);
  }, [campaign.runId, format]);

  useEffect(() => {
    if (!isPlaying) return;
    let animationFrame = 0;
    let previous = performance.now();
    const tick = (now: number) => {
      const delta = (now - previous) / 1000;
      previous = now;
      setCurrentTime((time) => {
        const next = Math.min(totalSeconds, time + delta);
        if (next >= totalSeconds) setIsPlaying(false);
        return next;
      });
      animationFrame = requestAnimationFrame(tick);
    };
    animationFrame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrame);
  }, [isPlaying, totalSeconds]);

  const activeScene =
    timedScenes.find(
      (scene) => currentTime >= scene.startSecond && currentTime < scene.endSecond,
    ) || timedScenes[timedScenes.length - 1];
  const background = backgroundFor(campaign, activeScene.sceneNumber);
  const isHorizontal = format === "horizontal";
  const isSquare = format === "square";

  function restart() {
    setCurrentTime(0);
    setIsPlaying(true);
  }

  return (
    <div className="space-y-3">
      <div
        className={`relative overflow-hidden rounded-lg bg-slate-950 shadow-2xl ${FRAME_CLASS[format]}`}
      >
        {background ? (
          <img
            key={`${activeScene.sceneNumber}-${background}`}
            src={background}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-80"
            draggable={false}
          />
        ) : (
          <div className="absolute inset-0 bg-slate-950" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/35 to-slate-950/65" />
        <div
          className={`relative z-10 flex h-full min-h-0 ${
            isHorizontal ? "items-center gap-7 p-7" : "flex-col justify-between gap-3 p-4 sm:p-5"
          }`}
        >
          <div className={isHorizontal ? "flex min-w-0 flex-1 flex-col gap-4" : "space-y-3"}>
            <BrandStrip compact={!isHorizontal && !isSquare} />
            <SceneCopy scene={activeScene} campaign={campaign} format={format} />
          </div>
          <div
            className={`min-w-0 ${
              isHorizontal
                ? "flex w-[320px] justify-end"
                : "flex flex-1 items-center justify-center"
            }`}
          >
            <SceneVisual campaign={campaign} scene={activeScene} format={format} />
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 z-20 h-1.5 bg-slate-950">
          <div
            className="h-full bg-violet-500 transition-[width] duration-100"
            style={{ width: `${(currentTime / totalSeconds) * 100}%` }}
          />
        </div>
        <div className="absolute right-3 top-3 z-20 rounded-full border border-white/10 bg-slate-950/75 px-2.5 py-1 font-mono text-[10px] font-semibold text-slate-200 backdrop-blur">
          {currentTime.toFixed(1)}s / {totalSeconds}s
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPlaying((value) => !value)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-violet-600 text-white hover:bg-violet-700"
            title={isPlaying ? "Pause preview" : "Play preview"}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={restart}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50"
            title="Restart preview"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
        <input
          type="range"
          min={0}
          max={totalSeconds}
          step={0.05}
          value={currentTime}
          onChange={(event) => {
            setIsPlaying(false);
            setCurrentTime(Number(event.target.value));
          }}
          className="min-w-[180px] flex-1 accent-violet-600"
          aria-label="Preview timeline"
        />
      </div>
    </div>
  );
}

function BrandStrip({ compact }: { compact: boolean }) {
  return (
    <div className="inline-flex max-w-full items-center gap-2 self-start rounded-full border border-white/10 bg-slate-950/75 px-3 py-2 text-white shadow-lg backdrop-blur">
      <img
        src="/favicon.png"
        alt=""
        className={compact ? "h-5 w-5 rounded-md" : "h-6 w-6 rounded-md"}
      />
      <img
        src="/email/envitefy-wordmark-email.png"
        alt="Envitefy"
        className={compact ? "h-3.5 w-auto" : "h-4 w-auto"}
      />
    </div>
  );
}

function SceneCopy({
  scene,
  campaign,
  format,
}: {
  scene: TimedScene;
  campaign: AdStudioCampaign;
  format: AdStudioRenderableFormat;
}) {
  const headline =
    scene.onScreenText ||
    scene.captionOverlay ||
    campaign.campaignBrief.painPoint ||
    "Make event planning simple.";
  const detail =
    scene.captionOverlay && scene.captionOverlay !== headline
      ? scene.captionOverlay
      : scene.voiceover || campaign.campaignBrief.benefit;
  return (
    <div
      className={`max-w-full rounded-lg border border-white/10 bg-slate-950/80 text-white shadow-xl backdrop-blur ${
        format === "horizontal" ? "p-5" : "p-3.5"
      }`}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-200">
        {scene.purpose.replace("-", " ")}
      </p>
      <h3
        className={`mt-2 break-words font-black leading-tight ${
          format === "horizontal" ? "text-3xl" : "text-xl sm:text-2xl"
        }`}
      >
        {headline}
      </h3>
      <p className="mt-2 max-w-[42rem] break-words text-sm font-medium leading-5 text-slate-200">
        {detail}
      </p>
    </div>
  );
}

function SceneVisual({
  campaign,
  scene,
  format,
}: {
  campaign: AdStudioCampaign;
  scene: TimedScene;
  format: AdStudioRenderableFormat;
}) {
  if (scene.purpose === "problem") return <ChatStack scene={scene} format={format} />;
  if (scene.purpose === "reveal") return <BrandReveal campaign={campaign} format={format} />;
  if (scene.purpose === "product-demo") return <PhoneHero campaign={campaign} format={format} />;
  if (scene.purpose === "cta") return <FinalCta campaign={campaign} format={format} />;
  return <PlanningStack campaign={campaign} scene={scene} format={format} />;
}

function PlanningStack({
  campaign,
  scene,
  format,
}: {
  campaign: AdStudioCampaign;
  scene: TimedScene;
  format: AdStudioRenderableFormat;
}) {
  const chips = scene.chatBubbles.length
    ? scene.chatBubbles.slice(0, 3)
    : ["What time is it?", "Where do we RSVP?", "Can you send the registry?"];
  return (
    <div
      className={`relative grid gap-3 ${format === "horizontal" ? "w-[300px]" : "w-full max-w-[290px]"}`}
    >
      <InviteSourceCard campaign={campaign} compact={format === "vertical"} />
      <div className="grid gap-2">
        {chips.map((chip, index) => (
          <div
            key={`${chip}-${index}`}
            className={`rounded-lg border border-white/10 bg-white/90 px-3 py-2 text-sm font-extrabold break-words text-slate-900 shadow-lg ${
              index === 1 ? "ml-8" : index === 2 ? "mr-8" : ""
            }`}
          >
            {chip}
          </div>
        ))}
      </div>
    </div>
  );
}

function ChatStack({ scene, format }: { scene: TimedScene; format: AdStudioRenderableFormat }) {
  const bubbles = scene.chatBubbles.length
    ? scene.chatBubbles.slice(0, 4)
    : [
        "What time is it?",
        "Where do we RSVP?",
        "Can you send the registry?",
        "What is the address?",
      ];
  return (
    <div className={`grid gap-2 ${format === "horizontal" ? "w-[300px]" : "w-full max-w-[300px]"}`}>
      <div className="inline-flex w-max items-center gap-2 rounded-full border border-rose-300/30 bg-rose-950/70 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-rose-100 backdrop-blur">
        <MessageCircle className="h-3.5 w-3.5" />
        Incoming questions
      </div>
      {bubbles.map((bubble, index) => (
        <div
          key={`${bubble}-${index}`}
          className={`max-w-[88%] rounded-2xl border border-white/10 bg-slate-950/90 px-3 py-2 text-left text-sm font-semibold leading-5 break-words text-white shadow-lg backdrop-blur ${
            index % 2 === 1 ? "justify-self-end rounded-tr-sm bg-violet-950/90" : "rounded-tl-sm"
          }`}
        >
          {bubble}
        </div>
      ))}
    </div>
  );
}

function BrandReveal({
  campaign,
  format,
}: {
  campaign: AdStudioCampaign;
  format: AdStudioRenderableFormat;
}) {
  return (
    <div
      className={`grid place-items-center gap-3 text-center ${format === "horizontal" ? "w-[300px]" : "w-full max-w-[300px]"}`}
    >
      <div className="grid h-20 w-20 place-items-center rounded-2xl bg-white shadow-2xl ring-4 ring-white/15">
        <img src="/favicon.png" alt="" className="h-14 w-14 rounded-xl" />
      </div>
      <div className="rounded-lg border border-white/10 bg-slate-950/80 p-4 text-white shadow-xl backdrop-blur">
        <img
          src="/email/envitefy-wordmark-email.png"
          alt="Envitefy"
          className="mx-auto h-8 w-auto"
        />
        <p className="mt-3 text-sm font-semibold leading-5 text-slate-200">
          {campaign.campaignBrief.envitefySolution}
        </p>
      </div>
      <div className="flex items-center gap-2 rounded-full bg-violet-600 px-4 py-2 text-sm font-black text-white shadow-xl">
        <Upload className="h-4 w-4" />
        Snap or upload
      </div>
    </div>
  );
}

function FinalCta({
  campaign,
  format,
}: {
  campaign: AdStudioCampaign;
  format: AdStudioRenderableFormat;
}) {
  return (
    <div className={`grid gap-3 ${format === "horizontal" ? "w-[320px]" : "w-full max-w-[300px]"}`}>
      <PhoneHero campaign={campaign} format={format} compact />
      <div className="rounded-lg border border-white/10 bg-white p-4 text-center text-slate-950 shadow-2xl">
        <img
          src="/email/envitefy-wordmark-email.png"
          alt="Envitefy"
          className="mx-auto h-6 w-auto"
        />
        <p className="mt-3 text-lg font-black leading-tight">{ctaText(campaign)}</p>
        <p className="mt-1 text-xs font-semibold text-slate-500">
          One live page for every event detail.
        </p>
      </div>
    </div>
  );
}

function InviteSourceCard({
  campaign,
  compact,
}: {
  campaign: AdStudioCampaign;
  compact?: boolean;
}) {
  const invitation = campaign.deterministicAssets?.invitation;
  return (
    <div className="rounded-lg border border-white/15 bg-white p-2 shadow-2xl">
      {invitation ? (
        <img
          src={invitation.url}
          alt="Deterministic invitation"
          className={`mx-auto h-auto w-full rounded-md object-contain ${compact ? "max-h-[190px]" : "max-h-[230px]"}`}
          draggable={false}
        />
      ) : (
        <div className="grid min-h-[160px] place-items-center rounded-md bg-violet-50 p-4 text-center text-sm font-bold text-slate-900">
          {campaign.invitationDesign.fields.title}
        </div>
      )}
    </div>
  );
}

function PhoneHero({
  campaign,
  format,
  compact = false,
}: {
  campaign: AdStudioCampaign;
  format: AdStudioRenderableFormat;
  compact?: boolean;
}) {
  const design = campaign.phoneUiDesign;
  const tokens = design.themeTokens;
  const widthClass = compact
    ? "w-[190px]"
    : format === "horizontal"
      ? "w-[260px]"
      : format === "square"
        ? "w-[230px]"
        : "w-[220px]";
  return (
    <div
      className={`${widthClass} rounded-[2rem] bg-slate-950 p-2 shadow-2xl ring-1 ring-white/20`}
    >
      <div
        className="overflow-hidden rounded-[1.55rem] p-3"
        style={{ background: `linear-gradient(145deg, ${tokens.background}, #f8fafc)` }}
      >
        <div className="mx-auto mb-3 h-3 w-20 rounded-full bg-slate-950/85" />
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <img src="/favicon.png" alt="" className="h-5 w-5 rounded-md" />
            <span className="text-xs font-black" style={{ color: tokens.primary }}>
              Envitefy
            </span>
          </div>
          <Check className="h-4 w-4 text-emerald-500" />
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <p
            className="text-[10px] font-black uppercase tracking-[0.12em]"
            style={{ color: tokens.primary }}
          >
            {design.eventPageCard.subtitle}
          </p>
          <h4 className="mt-1 break-words text-lg font-black leading-tight text-slate-950">
            {design.eventPageCard.title}
          </h4>
          <div className="mt-2 grid gap-1 text-[11px] font-bold text-slate-700">
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3 text-violet-600" />
              {design.eventPageCard.date} · {design.eventPageCard.time}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3 text-violet-600" />
              {design.eventPageCard.location}
            </span>
          </div>
        </div>
        <button
          type="button"
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-black text-white"
          style={{ backgroundColor: tokens.primary }}
        >
          <Share2 className="h-3.5 w-3.5" />
          {design.ctaButtonText}
        </button>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-slate-200 bg-white p-2">
            <p className="text-[10px] font-bold text-slate-500">{design.rsvpModule.label}</p>
            <p className="mt-1 text-xl font-black text-slate-950">
              {design.rsvpModule.yesCount}
              <span className="ml-1 text-[10px] font-bold text-slate-500">yes</span>
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-2">
            <p className="text-[10px] font-bold text-slate-500">{design.shareModule.label}</p>
            <p className="mt-2 inline-flex items-center gap-1 text-xs font-black text-slate-950">
              <Copy className="h-3 w-3" />
              {design.shareModule.shareText}
            </p>
          </div>
        </div>
        {!compact ? (
          <div className="mt-2 rounded-xl border border-slate-200 bg-white p-2">
            <p className="text-[10px] font-bold" style={{ color: tokens.primary }}>
              {design.locationCard.label}
            </p>
            <p className="mt-1 text-xs font-black text-slate-950">{design.locationCard.address}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
