"use client";

import type { AdStudioCampaign } from "@/lib/admin/ad-studio-types";

export function ScriptTab({ campaign }: { campaign: AdStudioCampaign }) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-base font-semibold text-slate-950">Voiceover Script</h2>
        <p className="mt-2 text-sm leading-6 text-slate-700">{campaign.script.voiceoverScript}</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-5">
        {campaign.script.scenes.map((scene) => (
          <article
            key={scene.sceneNumber}
            className="rounded-lg border border-slate-200 bg-white p-4"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-violet-700">
              Scene {scene.sceneNumber} · {scene.timestamp}
            </p>
            <h3 className="mt-2 text-sm font-semibold capitalize text-slate-950">
              {scene.purpose.replace("-", " ")}
            </h3>
            <p className="mt-3 text-xs font-semibold text-slate-500">Visual</p>
            <p className="mt-1 text-sm leading-5 text-slate-700">{scene.visual}</p>
            <p className="mt-3 text-xs font-semibold text-slate-500">Overlay</p>
            <p className="mt-1 text-sm font-semibold text-slate-950">{scene.onScreenText}</p>
            {scene.chatBubbles.length ? (
              <div className="mt-3 space-y-1">
                {scene.chatBubbles.map((bubble) => (
                  <p
                    key={bubble}
                    className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700"
                  >
                    {bubble}
                  </p>
                ))}
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}
