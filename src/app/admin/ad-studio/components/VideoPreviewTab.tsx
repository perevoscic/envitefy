"use client";

import { useEffect, useMemo, useState } from "react";
import type { AdStudioCampaign, AdStudioRenderableFormat } from "@/lib/admin/ad-studio-types";
import { DeterministicAdPlayer } from "./DeterministicAdPlayer";

const FORMAT_OPTIONS: Array<{
  value: AdStudioRenderableFormat;
  label: string;
  ratio: "9:16" | "16:9" | "1:1";
}> = [
  { value: "vertical", label: "Vertical", ratio: "9:16" },
  { value: "horizontal", label: "Horizontal", ratio: "16:9" },
  { value: "square", label: "Square", ratio: "1:1" },
];

function defaultFormat(campaign: AdStudioCampaign): AdStudioRenderableFormat {
  return campaign.request.format === "horizontal" || campaign.request.format === "square"
    ? campaign.request.format
    : "vertical";
}

export function VideoPreviewTab({ campaign }: { campaign: AdStudioCampaign }) {
  const [format, setFormat] = useState<AdStudioRenderableFormat>(() => defaultFormat(campaign));

  useEffect(() => {
    setFormat(defaultFormat(campaign));
  }, [campaign.runId, campaign.request.format]);

  const timedScenes = useMemo(() => {
    let cursor = 0;
    return campaign.script.scenes.map((scene) => {
      const start = cursor;
      cursor += scene.durationSeconds;
      return {
        scene,
        start,
        end: cursor,
      };
    });
  }, [campaign.script.scenes]);

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-950">Final Ad Preview</h3>
            <p className="mt-1 text-xs text-slate-500">
              Generated image plates with deterministic ad overlays.
            </p>
          </div>
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
            {FORMAT_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFormat(option.value)}
                className={`min-h-9 rounded-md px-3 text-xs font-bold transition ${
                  format === option.value
                    ? "bg-violet-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-white hover:text-slate-950"
                }`}
              >
                {option.label} {option.ratio}
              </button>
            ))}
          </div>
        </div>
        <DeterministicAdPlayer campaign={campaign} format={format} />
      </section>

      <aside className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-950">Timed Story Beats</h3>
        <div className="mt-4 space-y-3">
          {timedScenes.map(({ scene, start, end }) => (
            <article key={scene.sceneNumber} className="rounded-lg border border-slate-200 p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-violet-600">
                  Scene {scene.sceneNumber}
                </p>
                <p className="font-mono text-xs text-slate-500">
                  {start.toFixed(1)}s-{end.toFixed(1)}s
                </p>
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-950">{scene.onScreenText}</p>
              <p className="mt-1 text-xs leading-5 text-slate-600">{scene.voiceover}</p>
            </article>
          ))}
        </div>
      </aside>
    </div>
  );
}
