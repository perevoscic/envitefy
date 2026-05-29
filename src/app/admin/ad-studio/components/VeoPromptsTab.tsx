"use client";

import { Copy } from "lucide-react";
import type { AdStudioCampaign } from "@/lib/admin/ad-studio-types";

export function VeoPromptsTab({
  campaign,
  onCopy,
}: {
  campaign: AdStudioCampaign;
  onCopy: (value: string) => void;
}) {
  const pkg = campaign.veoPromptPackage;
  if (!pkg) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-600">
        Veo prompts are generated only after frames pass QA.
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <PromptBlock title="Master Veo prompt" value={pkg.masterPrompt} onCopy={onCopy} />
      <div className="grid gap-4 lg:grid-cols-2">
        {pkg.perScenePrompts.map((scene) => (
          <PromptBlock
            key={scene.sceneNumber}
            title={`Scene ${scene.sceneNumber}`}
            value={scene.prompt}
            onCopy={onCopy}
          />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <PromptBlock
          title="Vertical 9:16"
          value={pkg.formatSpecificPrompts.vertical}
          onCopy={onCopy}
        />
        <PromptBlock
          title="Horizontal 16:9"
          value={pkg.formatSpecificPrompts.horizontal}
          onCopy={onCopy}
        />
        <PromptBlock title="Square 1:1" value={pkg.formatSpecificPrompts.square} onCopy={onCopy} />
      </div>
    </div>
  );
}

function PromptBlock({
  title,
  value,
  onCopy,
}: {
  title: string;
  value: string;
  onCopy: (value: string) => void;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
        <button
          type="button"
          onClick={() => onCopy(value)}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          <Copy className="h-3.5 w-3.5" />
          Copy
        </button>
      </div>
      <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap rounded-md bg-slate-950 p-4 text-xs leading-5 text-slate-100">
        {value}
      </pre>
    </section>
  );
}
