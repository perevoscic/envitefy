"use client";
import { Calendar, Clock, MapPin, Upload, User, WandSparkles, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

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
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [previewUrl]);

  if (status === "idle") return null;

  return (
    <div className="w-full max-w-md">
      <div className="relative overflow-hidden rounded-3xl border border-[#dfd6fb] bg-gradient-to-br from-[#ffffff] via-[#f8f4ff] to-[#f2ecff] p-6 text-[#2f2550] shadow-[0_24px_60px_rgba(84,61,140,0.24)]">
        <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-[#b7a5ff]/20 blur-2xl" />
        <div className="pointer-events-none absolute -left-14 -bottom-14 h-36 w-36 rounded-full bg-[#88d2ff]/15 blur-3xl" />
        <div className="mb-4 text-center">
          <p className="text-sm font-medium text-[#625089]">
            Upload your flyer, we&apos;ll extract the details.
          </p>
        </div>

        <div className="relative flex flex-col items-center">
          <div className="relative mb-5 aspect-[3/4] w-full overflow-hidden rounded-2xl border border-[#d8cff5] bg-[#f9f5ff] shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
            {previewKind === "image" && previewUrl && !imageFailed ? (
              <img
                src={previewUrl}
                alt="Flyer preview"
                className={`h-full w-full object-cover transition-all duration-700 ${
                  status === "scanning"
                    ? "brightness-[0.65] saturate-[0.9]"
                    : ""
                }`}
                onError={() => setImageFailed(true)}
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-[#fbf9ff] via-[#f5eeff] to-[#eef5ff] text-[#5c4c83]">
                <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#8e74df] to-[#7392ff] text-white shadow-[0_12px_30px_rgba(99,73,175,0.35)]">
                  <Upload className="h-7 w-7" />
                </span>
                <p className="text-sm font-semibold">
                  {previewKind === "pdf" ? "PDF ready to scan" : "File ready to scan"}
                </p>
              </div>
            )}

            {status === "scanning" && (
              <>
                <div className="animate-scan-line absolute left-0 top-0 z-20 h-1 w-full bg-gradient-to-r from-transparent via-[#8f75de] to-transparent shadow-[0_0_14px_rgba(143,117,222,0.85)]" />
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
                  className="pointer-events-none absolute inset-0 opacity-25"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle, rgba(134,105,221,0.65) 1px, transparent 1px)",
                    backgroundSize: "20px 20px",
                  }}
                />
              </>
            )}

            {status === "uploading" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#f8f2ff]/75 backdrop-blur-sm">
                <ProgressRing radius={52} stroke={6} progress={progress} />
                <p className="mt-4 font-mono text-lg font-bold text-[#6f57c7]">
                  {Math.max(0, Math.min(100, Math.round(progress)))}%
                </p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-[#6c5a97]">
                  Uploading...
                </p>
              </div>
            )}
          </div>

          <div className="w-full">
            <div className="mb-2 flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-[#685691]">
                {status === "scanning" ? (
                  <>
                    <WandSparkles className="h-4 w-4 animate-pulse text-[#7f64d4]" />
                    Analysing
                  </>
                ) : (
                  "Uploading Flyer"
                )}
              </span>
              <button
                type="button"
                onClick={onCancel}
                className="rounded-full border border-[#ddd2fa] bg-white/85 p-1.5 text-[#7d6aa9] transition-colors hover:border-[#cbbcf2] hover:bg-white hover:text-[#5b4a88]"
                aria-label="Cancel upload"
              >
                <X size={18} />
              </button>
            </div>

            {status === "scanning" && (
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#e9e1ff]">
                <div className="animate-scanning-bar h-full bg-gradient-to-r from-[#8f75de] via-[#7a63d8] to-[#6e8eff]" />
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes scan-line {
          0% {
            transform: translate3d(0, 0%, 0);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translate3d(0, calc(100% - 4px), 0);
            opacity: 0;
          }
        }
        .animate-scan-line {
          animation: scan-line 2s infinite linear;
          will-change: transform, opacity;
          transform: translateZ(0);
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
          will-change: transform, opacity;
          transform: translateZ(0);
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
          will-change: transform;
          transform: translateZ(0);
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
        stroke="rgba(110, 92, 164, 0.18)"
        fill="transparent"
        strokeWidth={stroke}
        r={normalizedRadius}
        cx={radius}
        cy={radius}
      />
      <circle
        stroke="#7f66d5"
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
      className="animate-float-node absolute z-30 flex items-center gap-2 rounded-full border border-[#dccffc] bg-white/95 px-2.5 py-1 text-[10px] font-bold text-[#5c4a8e] shadow-[0_10px_24px_rgba(102,77,171,0.2)]"
      style={{ top, left, animationDelay: delay }}
    >
      {icon}
      {label}
    </div>
  );
}
