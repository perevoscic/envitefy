import type { CSSProperties } from "react";
import { X } from "lucide-react";

export type DiscoveryProgressTheme = {
  badgeBackground: string;
  badgeBorder: string;
  baseBackground: string;
  borderColor: string;
  cancelBorderColor: string;
  cancelHoverBackground: string;
  cancelTextColor: string;
  fillEnd: string;
  fillMiddle: string;
  fillStart: string;
  textColor: string;
};

type DiscoveryProgressPanelProps = {
  cancelLabel: string;
  indeterminate?: boolean;
  label: string;
  onCancel: () => void;
  progress: number;
  theme: DiscoveryProgressTheme;
};

const MINIMUM_VISIBLE_PROGRESS = 14;

export default function DiscoveryProgressPanel({
  cancelLabel,
  indeterminate = false,
  label,
  onCancel,
  progress,
  theme,
}: DiscoveryProgressPanelProps) {
  const clampedProgress = Math.max(0, Math.min(100, Math.round(progress)));
  const visibleProgress = indeterminate
    ? 100
    : clampedProgress > 0
      ? Math.max(MINIMUM_VISIBLE_PROGRESS, clampedProgress)
      : MINIMUM_VISIBLE_PROGRESS;

  return (
    <div className="space-y-3">
      <div
        className="relative overflow-hidden rounded-2xl border shadow-[0_14px_30px_rgba(15,25,53,0.12)]"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        style={{
          backgroundColor: theme.baseBackground,
          borderColor: theme.borderColor,
        }}
      >
        <div
          className="absolute inset-0 opacity-50"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.02) 100%)",
          }}
        />
        <div
          className={`absolute inset-y-0 left-0 overflow-hidden ${
            indeterminate ? "" : "transition-[width] duration-500 ease-out"
          }`}
          style={{ width: `${visibleProgress}%` }}
        >
          <div
            className={`h-full w-full ${
              indeterminate ? "launcher-progress-indeterminate" : "launcher-progress-shimmer"
            }`}
            style={{
              backgroundImage: `linear-gradient(90deg, ${theme.fillStart} 0%, ${theme.fillMiddle} 58%, ${theme.fillEnd} 100%)`,
              backgroundSize: "200% 100%",
            }}
          />
        </div>
        <div className="relative flex items-center justify-between gap-3 px-4 py-3.5">
          <p className="min-w-0 truncate text-sm font-semibold" style={{ color: theme.textColor }}>
            {label}
          </p>
          <span
            className="shrink-0 rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em]"
            style={{
              backgroundColor: theme.badgeBackground,
              borderColor: theme.badgeBorder,
              color: theme.textColor,
            }}
          >
            {indeterminate ? "Live" : `${clampedProgress}%`}
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={onCancel}
        className="discovery-progress-cancel inline-flex w-full items-center justify-center gap-2 rounded-xl border bg-white px-4 py-2.5 text-xs font-semibold transition"
        style={{
          "--cancel-hover-background": theme.cancelHoverBackground,
          borderColor: theme.cancelBorderColor,
          color: theme.cancelTextColor,
        } as CSSProperties}
      >
        <X className="h-3.5 w-3.5" />
        {cancelLabel}
      </button>
      <style jsx>{`
        @keyframes launcher-progress-shimmer {
          0% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        @keyframes launcher-progress-indeterminate {
          0% {
            background-position: 0% 50%;
          }
          100% {
            background-position: 200% 50%;
          }
        }
        .launcher-progress-shimmer {
          animation: launcher-progress-shimmer 2.2s ease-in-out infinite;
        }
        .launcher-progress-indeterminate {
          animation: launcher-progress-indeterminate 1.2s linear infinite;
        }
        .discovery-progress-cancel:hover {
          background-color: var(--cancel-hover-background);
        }
      `}</style>
    </div>
  );
}
