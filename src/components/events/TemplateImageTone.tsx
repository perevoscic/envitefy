"use client";

import { cloneElement, type CSSProperties, type ReactElement, useId } from "react";
import { resolveTemplateImageColor } from "@/lib/template-image-tone";

/** Color only the marked hero artwork, including CSS background-image layers. */
export default function TemplateImageTone({
  color,
  enabled = true,
  children,
}: {
  color?: string;
  enabled?: boolean;
  children: ReactElement<{ style?: CSSProperties }>;
}) {
  const id = `template-image-tone-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const tint = resolveTemplateImageColor(color);
  return (
    <>
      <svg
        width="0"
        height="0"
        aria-hidden="true"
        focusable="false"
        style={{ position: "absolute", pointerEvents: "none" }}
      >
        <defs>
          <filter id={id} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
            <feFlood floodColor={tint} floodOpacity="0.55" result="tint" />
            <feBlend in="tint" in2="SourceGraphic" mode="color" />
            <feComposite in2="SourceGraphic" operator="in" />
          </filter>
        </defs>
      </svg>
      {cloneElement(children, {
        style: {
          ...children.props.style,
          "--template-image-filter": enabled ? `url("#${id}")` : "opacity(1)",
        } as CSSProperties,
      })}
    </>
  );
}
