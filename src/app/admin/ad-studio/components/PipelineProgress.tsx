"use client";

import { AlertTriangle, CheckCircle2, Clock, Loader2, PlayCircle, RotateCcw } from "lucide-react";
import type { PipelineStepStatus } from "@/lib/admin/ad-studio-types";

function statusIcon(status: PipelineStepStatus["status"]) {
  if (status === "passed") return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
  if (status === "failed") return <AlertTriangle className="h-4 w-4 text-rose-600" />;
  if (status === "running") return <Loader2 className="h-4 w-4 animate-spin text-violet-600" />;
  return <Clock className="h-4 w-4 text-slate-400" />;
}

function statusClass(status: PipelineStepStatus["status"]) {
  if (status === "passed") return "border-emerald-200 bg-emerald-50";
  if (status === "failed") return "border-rose-200 bg-rose-50";
  if (status === "running") return "border-violet-200 bg-violet-50";
  return "border-slate-200 bg-white";
}

export function PipelineProgress({
  steps,
  isGenerating = false,
  onContinueImages,
  onRetryFailed,
  onViewDetails,
}: {
  steps: PipelineStepStatus[];
  isGenerating?: boolean;
  onContinueImages?: () => void;
  onRetryFailed?: () => void;
  onViewDetails?: (stepId: PipelineStepStatus["id"]) => void;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-base font-semibold text-slate-950">Production Pipeline</h2>
        <p className="mt-1 text-sm text-slate-600">Agent stages from strategy through export.</p>
      </div>
      <div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-5">
        {steps.map((step, index) => (
          <article key={step.id} className={`rounded-lg border p-3 ${statusClass(step.status)}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                {statusIcon(step.status)}
                <p className="truncate text-sm font-semibold text-slate-950">
                  {index + 1}. {step.label}
                </p>
              </div>
              {step.status === "failed" && onRetryFailed ? (
                <button
                  type="button"
                  onClick={onRetryFailed}
                  className="rounded-md border border-rose-200 bg-white p-1.5 text-rose-700 hover:bg-rose-50"
                  title="Retry failed stage"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>
            <p className="mt-2 min-h-10 text-wrap break-words text-xs leading-5 text-slate-600">
              {step.error || step.summary}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {onViewDetails ? (
                <button
                  type="button"
                  onClick={() => onViewDetails(step.id)}
                  className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  View details
                </button>
              ) : null}
              {step.id === "base-image-generation" &&
              step.status === "pending" &&
              onContinueImages ? (
                <button
                  type="button"
                  onClick={onContinueImages}
                  disabled={isGenerating}
                  className="inline-flex items-center gap-1.5 rounded-md bg-violet-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  <PlayCircle className="h-3.5 w-3.5" />
                  Start step 6
                </button>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
