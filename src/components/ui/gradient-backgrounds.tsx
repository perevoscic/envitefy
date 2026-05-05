"use client";

import type { CSSProperties } from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const gradientBackgroundStyle = {
  background: "radial-gradient(125% 125% at 50% 10%, #fff 40%, #6366f1 100%)",
};

type GradientBackgroundsProps = {
  className?: string;
  style?: CSSProperties;
};

export function GradientBackgroundLayer({ className, style }: GradientBackgroundsProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none fixed inset-y-0 left-0 right-0 z-0", className)}
      data-project-gradient-background="true"
      style={{ ...gradientBackgroundStyle, ...style }}
    />
  );
}

export const Component = ({ className }: GradientBackgroundsProps = {}) => {
  const [count] = useState(0);

  return (
    <div className={cn("min-h-screen w-full relative", className)} data-background-state={count}>
      <div className="absolute inset-0 z-0" style={gradientBackgroundStyle} />
    </div>
  );
};
