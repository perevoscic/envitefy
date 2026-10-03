"use client";

import type { CSSProperties, ReactElement } from "react";

/** Preserve original artwork. Legacy tint props remain compatible with saved events and renderers. */
export default function TemplateImageTone({
  children,
}: {
  color?: string;
  enabled?: boolean;
  children: ReactElement<{ style?: CSSProperties }>;
}) {
  return children;
}
