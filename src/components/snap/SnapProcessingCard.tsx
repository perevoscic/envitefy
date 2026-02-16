"use client";
import { Calendar, Clock, MapPin, Sparkles, Upload, User, X } from "lucide-react";
import type { ReactNode } from "react";

export type SnapProcessingStatus = "idle" | "uploading" | "scanning";
export type SnapPreviewKind = "image" | "pdf" | "file" | null;

type SnapProcessingCardProps = {
  status: SnapProcessingStatus;
  progress: number;
  previewUrl: string | null;
  previewKind: SnapPreviewKind;
  onCancel: () => void;
};

export function SnapProcessingCard({
  status,
  progress,
  previewUrl,
  previewKind,
  onCancel,
}: SnapProcessingCardProps) {
  if (status === "idle") return null;

  return (
    <div className="w-full max-w-md">
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 p-6 text-slate-100 shadow-2xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-2 inline-flex items-center justify-center rounded-2xl bg-white/5 px-4 py-2">
            <img
              src="/navElogo.png"
              alt="Envitefy"
              className="h-auto w-[190px] object-contain"
            />
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Upload your flyer, we&apos;ll extract the details.
          </p>
        </div>

        <div className="relative flex flex-col items-center">
          <div className="relative mb-5 aspect-[3/4] w-full overflow-hidden rounded-xl border border-slate-700 bg-black shadow-inner">
            {previewKind === "image" && previewUrl ? (
              <img
                src={previewUrl}
                alt="Flyer preview"
                className={`h-full w-full object-cover transition-all duration-700 ${
                  status === "scanning" ? "brightness-50 grayscale-[0.5]" : ""
                }`}
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-slate-900 text-slate-300">
                <Upload className="h-10 w-10 text-blue-400" />
                <p className="text-sm font-medium">
                  {previewKind === "pdf" ? "PDF ready to scan" : "File ready to scan"}
                </p>
              </div>
            )}

            {status === "scanning" && (
              <>
                <div className="animate-scan-line absolute left-0 top-0 z-20 h-1 w-full bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_15px_rgba(96,165,250,0.8)]" />
                <DataNode
                  label="Event Date"
                  icon={<Calendar size={12} />}
                  delay="0s"
                  top="20%"
                  left="30%"
                />
                <DataNode
                  label="Location"
                  icon={<MapPin size={12} />}
                  delay="1.1s"
                  top="55%"
                  left="58%"
                />
                <DataNode
                  label="Host"
                  icon={<User size={12} />}
                  delay="0.4s"
                  top="40%"
                  left="16%"
                />
                <DataNode
                  label="Time"
                  icon={<Clock size={12} />}
                  delay="1.8s"
                  top="74%"
                  left="42%"
                />
                <div
                  className="pointer-events-none absolute inset-0 opacity-20"
                  style={{
                    backgroundImage: "radial-gradient(circle, #3b82f6 1px, transparent 1px)",
                    backgroundSize: "20px 20px",
                  }}
                />
              </>
            )}

            {status === "uploading" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-sm">
                <ProgressRing radius={52} stroke={6} progress={progress} />
                <p className="mt-4 font-mono text-lg font-bold text-blue-400">
                  {Math.max(0, Math.min(100, Math.round(progress)))}%
                </p>
                <p className="mt-1 text-xs uppercase tracking-widest text-slate-300">
                  Uploading...
                </p>
              </div>
            )}

          </div>

          <div className="w-full">
            <div className="mb-2 flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-400">
                {status === "scanning" ? (
                  <>
                    <Sparkles className="h-4 w-4 animate-pulse text-blue-400" />
                    AI Analysis in Progress
                  </>
                ) : (
                  "Uploading Flyer"
                )}
              </span>
              <button
                type="button"
                onClick={onCancel}
                className="rounded-full p-1 text-slate-500 transition-colors hover:bg-slate-800 hover:text-red-400"
                aria-label="Cancel upload"
              >
                <X size={18} />
              </button>
            </div>

            {status === "scanning" && (
              <div className="h-1 w-full overflow-hidden rounded-full bg-slate-800">
                <div className="animate-scanning-bar h-full bg-blue-500" />
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes scan-line {
          0% {
            top: 0;
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            top: 100%;
            opacity: 0;
          }
        }
        .animate-scan-line {
          animation: scan-line 2s infinite linear;
        }
        @keyframes float-node {
          0%,
          100% {
            transform: translateY(0) scale(1);
            opacity: 0.8;
          }
          50% {
            transform: translateY(-10px) scale(1.05);
            opacity: 1;
          }
        }
        .animate-float-node {
          animation: float-node 3s infinite ease-in-out;
        }
        @keyframes scanning-bar {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-scanning-bar {
          animation: scanning-bar 1.5s infinite linear;
        }
      `}</style>
    </div>
  );
}

function ProgressRing({
  radius,
  stroke,
  progress,
}: {
  radius: number;
  stroke: number;
  progress: number;
}) {
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset =
    circumference - (Math.max(0, Math.min(100, progress)) / 100) * circumference;

  return (
    <svg
      height={radius * 2}
      width={radius * 2}
      className="-rotate-90 transform"
      aria-hidden="true"
    >
      <circle
        stroke="rgba(255,255,255,0.1)"
        fill="transparent"
        strokeWidth={stroke}
        r={normalizedRadius}
        cx={radius}
        cy={radius}
      />
      <circle
        stroke="#3b82f6"
        fill="transparent"
        strokeWidth={stroke}
        strokeDasharray={`${circumference} ${circumference}`}
        style={{ strokeDashoffset, transition: "stroke-dashoffset 0.1s linear" }}
        strokeLinecap="round"
        r={normalizedRadius}
        cx={radius}
        cy={radius}
      />
    </svg>
  );
}

function DataNode({
  label,
  icon,
  delay,
  top,
  left,
}: {
  label: string;
  icon: ReactNode;
  delay: string;
  top: string;
  left: string;
}) {
  return (
    <div
      className="animate-float-node absolute z-30 flex items-center gap-2 rounded-full border border-blue-300/30 bg-blue-500/80 px-2 py-1 text-[10px] font-bold text-white shadow-xl backdrop-blur-md"
      style={{ top, left, animationDelay: delay }}
    >
      {icon}
      {label}
    </div>
  );
}
