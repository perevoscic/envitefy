"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";
import type { AdStudioCampaign } from "@/lib/admin/ad-studio-types";

export function QATab({ campaign }: { campaign: AdStudioCampaign }) {
  if (!campaign.qaResults.length) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-600">
        QA runs after compositing.
      </div>
    );
  }
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {campaign.qaResults.map((result) => (
        <article
          key={result.frameNumber}
          className="rounded-lg border border-slate-200 bg-white p-4"
        >
          <div className="flex items-center gap-2">
            {result.passed ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-rose-600" />
            )}
            <h3 className="text-sm font-semibold text-slate-950">Frame {result.frameNumber}</h3>
          </div>
          {result.failureReason ? (
            <p className="mt-2 text-sm text-rose-700">{result.failureReason}</p>
          ) : null}
          <div className="mt-4 space-y-2">
            {result.checks.map((check) => (
              <div key={check.name} className="rounded-md bg-slate-50 p-3">
                <p className="text-xs font-semibold text-slate-700">{check.name}</p>
                <p className="mt-1 text-xs text-slate-600">{check.detail}</p>
              </div>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}
