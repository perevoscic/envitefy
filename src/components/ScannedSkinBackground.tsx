"use client";

import { useMemo } from "react";
import {
  resolveOcrSkinBackground,
  type OcrSkinBackground,
  type OcrSkinBackgroundObjectKind,
  type OcrSkinCategory,
  type OcrSkinId,
  type OcrSkinPalette,
} from "@/lib/ocr/skin-background";

type Palette = Partial<OcrSkinPalette> | null | undefined;

type Props = {
  category: OcrSkinCategory | string;
  title: string;
  skinId?: OcrSkinId | string | null;
  palette?: Palette;
  background?: OcrSkinBackground | null;
  darkMode?: boolean;
};

type MotifItem = {
  kind: OcrSkinBackgroundObjectKind;
  x: number;
  y: number;
  size: number;
  rotation: number;
  color: string;
  opacity: number;
};

function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createRng(seed: string) {
  let state = hashString(seed) || 1;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function getItemCount(density: OcrSkinBackground["density"]) {
  if (density === "high") return 34;
  if (density === "medium") return 24;
  return 15;
}

function pickPosition(
  rng: () => number,
  placement: OcrSkinBackground["placement"],
): { x: number; y: number } {
  if (placement === "corners") {
    const left = rng() < 0.5;
    const top = rng() < 0.5;
    return {
      x: left ? 4 + rng() * 22 : 74 + rng() * 22,
      y: top ? 4 + rng() * 22 : 74 + rng() * 22,
    };
  }

  if (placement === "edges") {
    const side = Math.floor(rng() * 4);
    if (side === 0) return { x: rng() * 100, y: 3 + rng() * 20 };
    if (side === 1) return { x: 77 + rng() * 20, y: rng() * 100 };
    if (side === 2) return { x: rng() * 100, y: 77 + rng() * 20 };
    return { x: 3 + rng() * 20, y: rng() * 100 };
  }

  const x = rng() * 100;
  const y = rng() * 100;
  if (x > 34 && x < 66 && y > 28 && y < 72) {
    return {
      x: x < 50 ? x - 22 : x + 22,
      y: y < 50 ? y - 18 : y + 18,
    };
  }
  return { x, y };
}

function buildItems(spec: OcrSkinBackground, darkMode: boolean): MotifItem[] {
  const rng = createRng(spec.seed);
  const count = getItemCount(spec.density);
  const colors = spec.colors?.length ? spec.colors : ["#ffffff"];
  const baseOpacity = darkMode ? 0.26 : 0.2;
  return Array.from({ length: count }, (_, index) => {
    const position = pickPosition(rng, spec.placement);
    const kind = spec.objectKinds[index % spec.objectKinds.length] || "dot";
    const isLargeKind =
      kind === "balloon" ||
      kind === "botanical-sprig" ||
      kind === "frame-corner" ||
      kind === "banner";
    return {
      kind,
      x: position.x,
      y: position.y,
      size: (isLargeKind ? 3.8 : 1.9) + rng() * (isLargeKind ? 4.8 : 3.1),
      rotation: -35 + rng() * 70,
      color: colors[Math.floor(rng() * colors.length)] || colors[0],
      opacity: Math.max(0.1, baseOpacity - rng() * 0.08),
    };
  });
}

function getTextureStyle(texture: OcrSkinBackground["texture"], darkMode: boolean) {
  if (texture === "paper") {
    return {
      backgroundImage:
        "radial-gradient(circle at 20% 20%, currentColor 0 0.5px, transparent 0.8px), radial-gradient(circle at 70% 45%, currentColor 0 0.4px, transparent 0.7px)",
      backgroundSize: "34px 34px, 47px 47px",
      opacity: darkMode ? 0.08 : 0.12,
    };
  }
  if (texture === "linen") {
    return {
      backgroundImage:
        "linear-gradient(90deg, currentColor 1px, transparent 1px), linear-gradient(0deg, currentColor 1px, transparent 1px)",
      backgroundSize: "28px 28px",
      opacity: darkMode ? 0.045 : 0.065,
    };
  }
  if (texture === "grain") {
    return {
      backgroundImage:
        "radial-gradient(circle, currentColor 0 0.6px, transparent 0.9px), radial-gradient(circle, currentColor 0 0.35px, transparent 0.7px)",
      backgroundPosition: "0 0, 11px 15px",
      backgroundSize: "23px 23px, 31px 31px",
      opacity: darkMode ? 0.075 : 0.1,
    };
  }
  return { opacity: 0 };
}

function renderMotif(item: MotifItem, index: number) {
  const transform = `translate(${item.x} ${item.y}) rotate(${item.rotation})`;
  const common = {
    opacity: item.opacity,
    vectorEffect: "non-scaling-stroke" as const,
  };
  const s = item.size;

  switch (item.kind) {
    case "confetti":
      return (
        <g key={index} transform={transform} {...common}>
          <rect x={-s / 2} y={-s / 7} width={s} height={s / 3} rx={s / 12} fill={item.color} />
        </g>
      );
    case "streamer":
      return (
        <path
          key={index}
          d={`M ${item.x - s} ${item.y} C ${item.x - s / 2} ${item.y - s}, ${
            item.x + s / 2
          } ${item.y + s}, ${item.x + s} ${item.y}`}
          fill="none"
          stroke={item.color}
          strokeLinecap="round"
          strokeWidth={0.35}
          opacity={item.opacity}
          transform={`rotate(${item.rotation} ${item.x} ${item.y})`}
          vectorEffect="non-scaling-stroke"
        />
      );
    case "dot":
      return (
        <circle
          key={index}
          cx={item.x}
          cy={item.y}
          r={s / 2.8}
          fill={item.color}
          opacity={item.opacity}
        />
      );
    case "star":
      return (
        <path
          key={index}
          d={`M ${item.x} ${item.y - s} L ${item.x + s * 0.24} ${item.y - s * 0.24} L ${
            item.x + s
          } ${item.y} L ${item.x + s * 0.24} ${item.y + s * 0.24} L ${item.x} ${
            item.y + s
          } L ${item.x - s * 0.24} ${item.y + s * 0.24} L ${item.x - s} ${item.y} L ${
            item.x - s * 0.24
          } ${item.y - s * 0.24} Z`}
          fill={item.color}
          opacity={item.opacity}
          transform={`rotate(${item.rotation} ${item.x} ${item.y})`}
        />
      );
    case "balloon":
      return (
        <g key={index} transform={transform} {...common}>
          <ellipse cx={0} cy={-s * 0.18} rx={s * 0.42} ry={s * 0.55} fill={item.color} />
          <path
            d={`M 0 ${s * 0.36} C ${-s * 0.2} ${s * 0.8}, ${s * 0.22} ${s}, 0 ${s * 1.25}`}
            fill="none"
            stroke={item.color}
            strokeWidth={0.26}
            strokeLinecap="round"
          />
        </g>
      );
    case "botanical-sprig":
      return (
        <g key={index} transform={transform} {...common}>
          <path
            d={`M 0 ${s * 0.9} C ${s * 0.08} ${s * 0.35}, ${-s * 0.08} ${-s * 0.35}, 0 ${-s * 0.9}`}
            fill="none"
            stroke={item.color}
            strokeWidth={0.28}
            strokeLinecap="round"
          />
          {[-0.55, -0.18, 0.22, 0.58].map((offset, leafIndex) => (
            <ellipse
              key={offset}
              cx={leafIndex % 2 === 0 ? -s * 0.22 : s * 0.22}
              cy={s * offset}
              rx={s * 0.16}
              ry={s * 0.34}
              fill={item.color}
              transform={`rotate(${leafIndex % 2 === 0 ? -42 : 42} ${
                leafIndex % 2 === 0 ? -s * 0.22 : s * 0.22
              } ${s * offset})`}
            />
          ))}
        </g>
      );
    case "leaf":
      return (
        <g key={index} transform={transform} {...common}>
          <ellipse cx={0} cy={0} rx={s * 0.32} ry={s * 0.78} fill={item.color} />
          <path
            d={`M 0 ${-s * 0.62} L 0 ${s * 0.62}`}
            stroke="rgba(255,255,255,0.45)"
            strokeWidth={0.18}
          />
        </g>
      );
    case "frame-corner":
      return (
        <g key={index} transform={transform} opacity={item.opacity}>
          <path
            d={`M ${-s} ${-s * 0.2} L ${-s} ${-s} L ${-s * 0.2} ${-s}`}
            fill="none"
            stroke={item.color}
            strokeLinecap="round"
            strokeWidth={0.32}
            vectorEffect="non-scaling-stroke"
          />
        </g>
      );
    case "ring":
      return (
        <circle
          key={index}
          cx={item.x}
          cy={item.y}
          r={s / 2}
          fill="none"
          stroke={item.color}
          strokeWidth={0.36}
          opacity={item.opacity}
          vectorEffect="non-scaling-stroke"
        />
      );
    case "pearl":
      return (
        <circle
          key={index}
          cx={item.x}
          cy={item.y}
          r={s / 3}
          fill={item.color}
          opacity={item.opacity * 0.82}
        />
      );
    case "cap":
      return (
        <g key={index} transform={transform} {...common}>
          <path
            d={`M ${-s * 0.75} 0 L 0 ${-s * 0.42} L ${s * 0.75} 0 L 0 ${s * 0.42} Z`}
            fill={item.color}
          />
          <path
            d={`M ${-s * 0.34} ${s * 0.18} L ${s * 0.34} ${s * 0.18} L ${s * 0.24} ${s * 0.52} L ${-s * 0.24} ${s * 0.52} Z`}
            fill={item.color}
          />
          <path
            d={`M ${s * 0.34} ${s * 0.08} L ${s * 0.7} ${s * 0.54}`}
            stroke={item.color}
            strokeWidth={0.24}
            strokeLinecap="round"
          />
        </g>
      );
    case "tassel":
      return (
        <g key={index} transform={transform} opacity={item.opacity}>
          <path
            d={`M 0 ${-s * 0.85} L 0 ${s * 0.5}`}
            stroke={item.color}
            strokeWidth={0.28}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
          <path
            d={`M ${-s * 0.28} ${s * 0.48} L 0 ${s * 0.9} L ${s * 0.28} ${s * 0.48}`}
            fill="none"
            stroke={item.color}
            strokeWidth={0.22}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </g>
      );
    case "diploma":
      return (
        <g key={index} transform={transform} {...common}>
          <rect
            x={-s * 0.72}
            y={-s * 0.2}
            width={s * 1.44}
            height={s * 0.4}
            rx={s * 0.2}
            fill="none"
            stroke={item.color}
            strokeWidth={0.32}
          />
          <path
            d={`M ${-s * 0.12} ${-s * 0.3} L ${s * 0.12} ${s * 0.3} M ${s * 0.12} ${-s * 0.3} L ${-s * 0.12} ${s * 0.3}`}
            stroke={item.color}
            strokeWidth={0.22}
            strokeLinecap="round"
          />
        </g>
      );
    case "banner":
      return (
        <g key={index} transform={transform} opacity={item.opacity}>
          <path
            d={`M ${-s} ${-s * 0.38} L ${s} ${-s * 0.38}`}
            stroke={item.color}
            strokeWidth={0.25}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
          {[-0.6, 0, 0.6].map((offset) => (
            <path
              key={offset}
              d={`M ${s * offset} ${-s * 0.32} L ${s * (offset + 0.18)} ${s * 0.2} L ${s * (offset - 0.18)} ${s * 0.2} Z`}
              fill={item.color}
            />
          ))}
        </g>
      );
    default:
      return null;
  }
}

export default function ScannedSkinBackground({
  category,
  title,
  skinId,
  palette,
  background,
  darkMode = false,
}: Props) {
  const spec = useMemo(
    () =>
      resolveOcrSkinBackground(background, {
        category,
        title,
        skinId,
        palette,
      }),
    [background, category, palette, skinId, title],
  );
  const items = useMemo(() => buildItems(spec, darkMode), [darkMode, spec]);
  const textureStyle = getTextureStyle(spec.texture, darkMode);
  const textureColor = darkMode ? "#ffffff" : palette?.text || "#111827";

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0" style={{ ...textureStyle, color: textureColor }} />
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {items.map(renderMotif)}
      </svg>
    </div>
  );
}
