"use client";

import { useEffect, useState } from "react";

const BACKGROUND_IMAGE =
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1964&auto=format&fit=crop";

type SceneShape = {
  className: string;
};

export type ScenicScene = {
  shellClassName?: string;
  veilClassName?: string;
  shapes: SceneShape[];
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function useActiveScene(
  sectionIds: readonly string[],
  fallbackScene: string,
) {
  const [activeScene, setActiveScene] = useState(fallbackScene);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let frame = 0;

    const updateScene = () => {
      frame = 0;
      const probeLine = window.innerHeight * 0.42;
      let nextScene = fallbackScene;

      for (const id of sectionIds) {
        const node = document.getElementById(id);
        if (!node) continue;
        const { top } = node.getBoundingClientRect();
        if (top <= probeLine) {
          nextScene = id;
        }
      }

      setActiveScene((current) =>
        current === nextScene ? current : nextScene,
      );
    };

    const requestUpdate = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(updateScene);
    };

    requestUpdate();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);

    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
    };
  }, [fallbackScene, sectionIds]);

  return activeScene;
}

export default function ScenicBackground({
  scene,
  scenes,
}: {
  scene: string;
  scenes: Record<string, ScenicScene>;
}) {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#382456]">
      <img
        src={BACKGROUND_IMAGE}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full scale-[1.04] object-cover opacity-[0.78] brightness-[0.92] md:scale-[1.08] md:opacity-[0.86]"
      />
      <div className="absolute inset-0 bg-[rgba(255,255,255,0.08)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,252,255,0.58),transparent_48%),linear-gradient(180deg,rgba(255,255,255,0.18)_0%,rgba(240,229,255,0.14)_48%,rgba(110,72,177,0.1)_100%)]" />

      {Object.entries(scenes).map(([key, config]) => {
        const isActive = scene === key;

        return (
          <div
            key={key}
            className={cx(
              "absolute inset-0 transition-all duration-[1200ms] ease-out",
              isActive
                ? "scale-100 opacity-100"
                : "scale-[1.06] opacity-0 blur-[2px]",
              config.shellClassName,
            )}
          >
            {config.veilClassName ? (
              <div className={cx("absolute inset-0", config.veilClassName)} />
            ) : null}

            {config.shapes.map((shape) => (
              <div
                key={shape.className}
                className={cx("scenic-blob", shape.className)}
              />
            ))}
          </div>
        );
      })}

      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(71,41,124,0.08))]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.26),transparent_18%),radial-gradient(circle_at_80%_12%,rgba(255,255,255,0.18),transparent_16%),radial-gradient(circle_at_50%_80%,rgba(255,255,255,0.12),transparent_22%)] opacity-100" />
      <div className="absolute inset-0 bg-black/12" />

      <style jsx>{`
        .scenic-blob {
          animation:
            scenicBlobPulse 10s ease-in-out infinite,
            scenicBlobDrift 18s ease-in-out infinite;
          will-change: transform, opacity;
        }

        @keyframes scenicBlobPulse {
          0%,
          100% {
            opacity: 0.9;
            transform: scale(1);
          }

          50% {
            opacity: 1;
            transform: scale(1.08);
          }
        }

        @keyframes scenicBlobDrift {
          0%,
          100% {
            translate: 0 0;
          }

          50% {
            translate: 0.75rem -0.9rem;
          }
        }
      `}</style>
    </div>
  );
}
