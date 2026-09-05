"use client";

import { ArrowRight, Clapperboard, FileText, Layers2, Loader2, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  STUDIO_PLATFORMS,
  STUDIO_STATUS_LABELS,
  studioAssetUrl,
  type StudioConversationSummary,
  type StudioOutput,
  type StudioPlatform,
} from "@/lib/admin/marketing-studio/types";
import {
  buttonClass,
  fieldClass,
  OutputGlyph,
  outputNames,
  platformNames,
  primaryClass,
} from "./studio-components";
import type { ContentStudio, LegacyRun } from "./use-content-studio";

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Recently"
    : date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function ConversationTile({
  item,
  onOpen,
}: {
  item: StudioConversationSummary;
  onOpen: (id: string) => void;
}) {
  const version = item.latestVersion;
  const asset = version?.result?.assetId;
  return (
    <button
      type="button"
      onClick={() => onOpen(item.id)}
      className="group min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white text-left transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 motion-reduce:transform-none"
    >
      <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-slate-100">
        {asset && version?.output === "image" ? (
          <img
            src={studioAssetUrl(asset)}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : asset && version?.output === "video" ? (
          <>
            <video
              src={studioAssetUrl(asset)}
              preload="metadata"
              muted
              playsInline
              className="h-full w-full object-cover"
            >
              <track kind="captions" />
            </video>
            <span className="absolute flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-violet-600 shadow">
              <Clapperboard className="h-5 w-5" />
            </span>
          </>
        ) : (
          <div className="w-full p-6">
            <OutputGlyph
              output={version?.output || item.settings.output}
              className="mb-4 h-6 w-6 text-violet-400"
            />
            <p className="line-clamp-4 text-sm leading-6 text-slate-500">
              {version?.result?.prompt || item.draft || "An idea in progress"}
            </p>
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-lg bg-white/95 px-2 py-1 text-xs font-medium text-slate-700 shadow-sm">
          {outputNames[version?.output || item.settings.output]}
        </span>
      </div>
      <div className="p-4">
        <h3 className="font-sans truncate text-sm font-semibold text-slate-900">
          {item.title || "Untitled creation"}
        </h3>
        <div className="mt-2 flex items-center justify-between gap-2 text-xs text-slate-500">
          <span>
            {platformNames[item.settings.platform]} · {formatDate(item.updatedAt)}
          </span>
          <span className={version?.status === "failed" ? "text-amber-700" : "text-slate-500"}>
            {version ? STUDIO_STATUS_LABELS[version.status] : "Draft"}
          </span>
        </div>
      </div>
    </button>
  );
}

function LegacyTile({ run }: { run: LegacyRun }) {
  const name =
    run.request?.input?.campaignName ||
    run.request?.input?.jobLabel ||
    run.request?.input?.productName ||
    "Earlier campaign";
  return (
    <Link
      href={`/admin/marketing-images/legacy?run=${encodeURIComponent(run.runId)}`}
      className="flex min-h-24 items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-violet-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
          <Layers2 className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h3 className="font-sans truncate text-sm font-medium text-slate-800">{name}</h3>
          <p className="mt-1 truncate text-xs text-slate-500">
            {run.request?.input?.channels?.join(", ") || "Campaign"} · Original editor
          </p>
        </div>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />
    </Link>
  );
}

export function StudioLibrary({
  studio,
  onOpen,
  onNew,
}: {
  studio: ContentStudio;
  onOpen: (id: string) => void;
  onNew: () => void;
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | StudioOutput>("all");
  const [platform, setPlatform] = useState<"all" | StudioPlatform>("all");
  const filtered = studio.conversations.filter(
    (item) =>
      (filter === "all" || (item.latestVersion?.output || item.settings.output) === filter) &&
      (platform === "all" || item.settings.platform === platform) &&
      `${item.title} ${item.draft}`.toLowerCase().includes(search.toLowerCase()),
  );
  const legacy = studio.legacyRuns.filter((run) => {
    const input = run.request?.input;
    return (
      (filter === "all" ||
        (filter === "image" && input?.assetType === "social-image") ||
        (filter === "video" && input?.assetType !== "social-image")) &&
      (platform === "all" || input?.channels?.includes(platform)) &&
      `${input?.campaignName || ""} ${input?.jobLabel || ""} ${input?.productName || ""}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  });
  return (
    <section className="px-1 py-7 sm:py-9" aria-label="Content library">
      <div className="mb-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <h2 className="font-sans text-2xl font-semibold tracking-tight text-slate-950">
            Your ideas, kept together.
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Pick up a draft, revisit a version, or start something new.
          </p>
        </div>
        <button
          type="button"
          className={buttonClass}
          onClick={() => {
            void studio.loadLibrary();
          }}
        >
          Refresh library
        </button>
      </div>
      <div className="mb-7 flex flex-col gap-3 lg:flex-row">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Search your creations</span>
          <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search your creations"
            className={`${fieldClass} pl-10`}
          />
        </label>
        <div className="flex gap-3">
          <label className="min-w-0 flex-1">
            <span className="sr-only">Filter by output</span>
            <select
              className={fieldClass}
              value={filter}
              onChange={(event) => setFilter(event.target.value as typeof filter)}
            >
              <option value="all">All content</option>
              <option value="image">Images</option>
              <option value="video">Videos</option>
              <option value="prompt">Prompts</option>
            </select>
          </label>
          <label className="min-w-0 flex-1">
            <span className="sr-only">Filter by platform</span>
            <select
              className={fieldClass}
              value={platform}
              onChange={(event) => setPlatform(event.target.value as typeof platform)}
            >
              <option value="all">All platforms</option>
              {STUDIO_PLATFORMS.map((value) => (
                <option key={value} value={value}>
                  {platformNames[value]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
      {studio.libraryError && (
        <p
          role="alert"
          className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
        >
          {studio.libraryError}
        </p>
      )}
      {studio.libraryLoading && !studio.conversations.length ? (
        <div className="flex items-center justify-center gap-2 py-20 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading your creations…
        </div>
      ) : filtered.length ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((item) => (
            <ConversationTile key={item.id} item={item} onOpen={onOpen} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <FileText className="mx-auto mb-4 h-7 w-7 text-violet-300" />
          <h3 className="font-sans font-semibold text-slate-800">
            {search || filter !== "all" || platform !== "all"
              ? "No matching creations"
              : "A place for your next idea"}
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            {search
              ? "Try a different search or filter."
              : "Prompts, images, and videos you create will be saved here."}
          </p>
          <button type="button" className={`${primaryClass} mt-5`} onClick={onNew}>
            Create something
          </button>
        </div>
      )}
      {legacy.length > 0 && (
        <div className="mt-10">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="font-sans text-sm font-semibold text-slate-700">Earlier campaigns</h2>
            <Link
              className="text-xs font-medium text-violet-700 hover:underline"
              href="/admin/marketing-images/legacy"
            >
              Open original editor
            </Link>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {legacy.map((run) => (
              <LegacyTile key={run.runId} run={run} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
