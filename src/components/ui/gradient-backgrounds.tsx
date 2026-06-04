"use client";

import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type AppBackground = "aurora" | "mesh" | "grid" | "noir";

const backgroundClassByKey: Record<AppBackground, string> = {
  aurora: "bg-aurora",
  mesh: "bg-mesh",
  grid: "bg-grid",
  noir: "bg-noir",
};

const appBackgroundTokens = {
  "--background": "#fbfdff",
  "--brand": "#c65de9",
  "--brand-glow": "#08aeea",
} as CSSProperties;

type GradientBackgroundsProps = {
  background?: AppBackground;
  className?: string;
  style?: CSSProperties;
};

export function GradientBackgroundLayer({
  background = "aurora",
  className,
  style,
}: GradientBackgroundsProps) {
  const [bg, setBg] = useState<AppBackground>(background);

  useEffect(() => {
    setBg(background);
  }, [background]);

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none fixed inset-y-0 left-0 right-0 z-0 overflow-hidden",
        backgroundClassByKey[bg],
        className,
      )}
      data-project-gradient-background="true"
      data-project-background={bg}
      style={{ ...appBackgroundTokens, ...style }}
    >
      <div className="app-background-orb app-background-orb-primary animate-float-slow" />
      <div className="app-background-orb app-background-orb-glow animate-float-slower" />
    </div>
  );
}

export const Component = ({ className }: GradientBackgroundsProps = {}) => {
  const [bg] = useState<AppBackground>("aurora");

  return (
    <div
      className={cn("relative min-h-screen w-full", backgroundClassByKey[bg], className)}
      data-background-state={bg}
      style={appBackgroundTokens}
    >
      <div className="app-background-orb app-background-orb-primary animate-float-slow" />
      <div className="app-background-orb app-background-orb-glow animate-float-slower" />
    </div>
  );
};
