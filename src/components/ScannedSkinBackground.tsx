"use client";

import { useMemo } from "react";
import {
  type OcrSkinBackground,
  type OcrSkinBackgroundObjectKind,
  type OcrSkinCategory,
  type OcrSkinId,
  type OcrSkinPalette,
  resolveOcrSkinBackground,
} from "@/lib/ocr/skin-background";

type Palette = Partial<OcrSkinPalette> | null | undefined;

type Props = {
  category: OcrSkinCategory | string;
  title: string;
  skinId?: OcrSkinId | string | null;
  sportKind?: string | null;
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
  if (density === "high") return 44;
  if (density === "medium") return 30;
  return 18;
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

function buildPinnedFootballItems(darkMode: boolean): MotifItem[] {
  const lineOpacity = darkMode ? 0.34 : 0.28;
  const fillOpacity = darkMode ? 0.32 : 0.26;
  return [
    {
      kind: "football",
      x: 9,
      y: 27,
      size: 13.5,
      rotation: -18,
      color: "#fbbf24",
      opacity: fillOpacity,
    },
    {
      kind: "goalpost",
      x: 12,
      y: 44,
      size: 13,
      rotation: 0,
      color: "#f8fafc",
      opacity: lineOpacity,
    },
    {
      kind: "football-trophy",
      x: 11,
      y: 61,
      size: 10,
      rotation: -10,
      color: "#f8fafc",
      opacity: lineOpacity,
    },
    {
      kind: "field-line",
      x: 50,
      y: 73,
      size: 24,
      rotation: 0,
      color: "#f8fafc",
      opacity: darkMode ? 0.24 : 0.2,
    },
    {
      kind: "helmet",
      x: 88,
      y: 37,
      size: 11,
      rotation: 12,
      color: "#1d4ed8",
      opacity: fillOpacity,
    },
    {
      kind: "yard-marker",
      x: 82,
      y: 65,
      size: 8,
      rotation: 9,
      color: "#fbbf24",
      opacity: lineOpacity,
    },
    {
      kind: "foam-finger",
      x: 91,
      y: 72,
      size: 8.5,
      rotation: 14,
      color: "#1d4ed8",
      opacity: fillOpacity,
    },
  ];
}

function buildItems(spec: OcrSkinBackground, darkMode: boolean): MotifItem[] {
  const rng = createRng(spec.seed);
  const count = getItemCount(spec.density);
  const colors = spec.colors?.length ? spec.colors : ["#ffffff"];
  const baseOpacity = darkMode ? 0.26 : 0.2;
  const items = Array.from({ length: count }, (_, index) => {
    const position = pickPosition(rng, spec.placement);
    const kind = spec.objectKinds[index % spec.objectKinds.length] || "dot";
    const isLargeKind =
      kind === "balloon" ||
      kind === "cake" ||
      kind === "cupcake" ||
      kind === "gift" ||
      kind === "party-hat" ||
      kind === "candle" ||
      kind === "sparkle" ||
      kind === "crown" ||
      kind === "music-note" ||
      kind === "arcade-token" ||
      kind === "botanical-sprig" ||
      kind === "frame-corner" ||
      kind === "heart" ||
      kind === "ring-box" ||
      kind === "diamond" ||
      kind === "champagne" ||
      kind === "champagne-bubble" ||
      kind === "wine-glass" ||
      kind === "floral-arch" ||
      kind === "lace" ||
      kind === "vow-book" ||
      kind === "ribbon" ||
      kind === "bouquet" ||
      kind === "wax-seal" ||
      kind === "rose" ||
      kind === "photo-frame" ||
      kind === "baby-bottle" ||
      kind === "rattle" ||
      kind === "moon" ||
      kind === "onesie" ||
      kind === "pacifier" ||
      kind === "teddy-bear" ||
      kind === "cloud" ||
      kind === "bib" ||
      kind === "stroller" ||
      kind === "teacup" ||
      kind === "bow" ||
      kind === "house" ||
      kind === "key" ||
      kind === "front-door" ||
      kind === "welcome-mat" ||
      kind === "plant" ||
      kind === "lamp" ||
      kind === "mug" ||
      kind === "banner" ||
      kind === "basketball" ||
      kind === "football" ||
      kind === "helmet" ||
      kind === "goalpost" ||
      kind === "field-line" ||
      kind === "stadium-light" ||
      kind === "pickleball" ||
      kind === "paddle" ||
      kind === "paddle-pair" ||
      kind === "hoop" ||
      kind === "court-line" ||
      kind === "court-arc" ||
      kind === "backboard" ||
      kind === "net" ||
      kind === "shot-clock" ||
      kind === "sneaker" ||
      kind === "trophy" ||
      kind === "football-trophy" ||
      kind === "yard-marker" ||
      kind === "playbook" ||
      kind === "cleat" ||
      kind === "foam-finger" ||
      kind === "net-line" ||
      kind === "pickleball-court" ||
      kind === "serve-line" ||
      kind === "water-bottle" ||
      kind === "book" ||
      kind === "notebook" ||
      kind === "school-building" ||
      kind === "scroll" ||
      kind === "laurel" ||
      kind === "medal" ||
      kind === "dove" ||
      kind === "stained-glass" ||
      kind === "olive-branch" ||
      kind === "lantern" ||
      kind === "calendar" ||
      kind === "ticket" ||
      kind === "map-pin" ||
      kind === "announcement-card" ||
      kind === "jersey" ||
      kind === "whistle" ||
      kind === "scoreboard" ||
      kind === "pennant" ||
      kind === "megaphone";
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

  if (!spec.objectKinds.includes("football-trophy")) return items;

  return [...items, ...buildPinnedFootballItems(darkMode)];
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
    case "cake":
      return (
        <g key={index} transform={transform} {...common}>
          <rect
            x={-s * 0.7}
            y={-s * 0.04}
            width={s * 1.4}
            height={s * 0.52}
            rx={s * 0.1}
            fill={item.color}
          />
          <rect
            x={-s * 0.48}
            y={-s * 0.38}
            width={s * 0.96}
            height={s * 0.38}
            rx={s * 0.08}
            fill={item.color}
          />
          <path
            d={`M ${-s * 0.62} ${s * 0.18} H ${s * 0.62} M ${-s * 0.4} ${-s * 0.18} H ${s * 0.4}`}
            stroke="rgba(255,255,255,0.5)"
            strokeLinecap="round"
            strokeWidth={0.18}
            vectorEffect="non-scaling-stroke"
          />
          {[-0.24, 0, 0.24].map((offset) => (
            <path
              key={offset}
              d={`M ${s * offset} ${-s * 0.42} V ${-s * 0.68}`}
              stroke={item.color}
              strokeLinecap="round"
              strokeWidth={0.16}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </g>
      );
    case "gift":
      return (
        <g key={index} transform={transform} {...common}>
          <rect
            x={-s * 0.62}
            y={-s * 0.28}
            width={s * 1.24}
            height={s * 0.9}
            rx={s * 0.08}
            fill={item.color}
          />
          <path
            d={`M 0 ${-s * 0.28} V ${s * 0.62} M ${-s * 0.62} ${-s * 0.02} H ${s * 0.62}`}
            stroke="rgba(255,255,255,0.54)"
            strokeLinecap="round"
            strokeWidth={0.18}
            vectorEffect="non-scaling-stroke"
          />
          <path
            d={`M 0 ${-s * 0.3} C ${-s * 0.42} ${-s * 0.78}, ${-s * 0.72} ${-s * 0.22}, 0 ${-s * 0.2} C ${s * 0.42} ${-s * 0.78}, ${s * 0.72} ${-s * 0.22}, 0 ${-s * 0.2}`}
            fill="none"
            stroke={item.color}
            strokeLinecap="round"
            strokeWidth={0.22}
            vectorEffect="non-scaling-stroke"
          />
        </g>
      );
    case "party-hat":
      return (
        <g key={index} transform={transform} {...common}>
          <path
            d={`M ${-s * 0.55} ${s * 0.62} L 0 ${-s * 0.78} L ${s * 0.55} ${s * 0.62} Z`}
            fill={item.color}
          />
          <path
            d={`M ${-s * 0.38} ${s * 0.2} H ${s * 0.38} M ${-s * 0.2} ${-s * 0.22} H ${s * 0.2}`}
            stroke="rgba(255,255,255,0.5)"
            strokeLinecap="round"
            strokeWidth={0.16}
            vectorEffect="non-scaling-stroke"
          />
          <circle cx={0} cy={-s * 0.84} r={s * 0.14} fill={item.color} />
        </g>
      );
    case "candle":
      return (
        <g key={index} transform={transform} {...common}>
          <rect
            x={-s * 0.18}
            y={-s * 0.12}
            width={s * 0.36}
            height={s * 0.92}
            rx={s * 0.08}
            fill={item.color}
          />
          <path
            d={`M 0 ${-s * 0.82} C ${-s * 0.24} ${-s * 0.48}, ${s * 0.24} ${-s * 0.42}, 0 ${-s * 0.14} C ${s * 0.3} ${-s * 0.44}, ${s * 0.1} ${-s * 0.7}, 0 ${-s * 0.82} Z`}
            fill={item.color}
          />
          <path
            d={`M ${-s * 0.12} ${s * 0.12} H ${s * 0.12} M ${-s * 0.12} ${s * 0.38} H ${s * 0.12}`}
            stroke="rgba(255,255,255,0.45)"
            strokeLinecap="round"
            strokeWidth={0.12}
            vectorEffect="non-scaling-stroke"
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
    case "heart":
      return (
        <path
          key={index}
          d={`M ${item.x} ${item.y + s * 0.58} C ${item.x - s * 0.86} ${item.y}, ${
            item.x - s * 0.58
          } ${item.y - s * 0.72}, ${item.x} ${item.y - s * 0.28} C ${item.x + s * 0.58} ${
            item.y - s * 0.72
          }, ${item.x + s * 0.86} ${item.y}, ${item.x} ${item.y + s * 0.58} Z`}
          fill={item.color}
          opacity={item.opacity}
          transform={`rotate(${item.rotation} ${item.x} ${item.y})`}
        />
      );
    case "diamond":
      return (
        <g key={index} transform={transform} opacity={item.opacity}>
          <path
            d={`M ${-s * 0.55} ${-s * 0.18} L ${-s * 0.22} ${-s * 0.58} H ${s * 0.22} L ${s * 0.55} ${-s * 0.18} L 0 ${s * 0.68} Z`}
            fill="none"
            stroke={item.color}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={0.22}
            vectorEffect="non-scaling-stroke"
          />
          <path
            d={`M ${-s * 0.55} ${-s * 0.18} H ${s * 0.55} M ${-s * 0.22} ${-s * 0.58} L 0 ${s * 0.68} M ${s * 0.22} ${-s * 0.58} L 0 ${s * 0.68}`}
            fill="none"
            stroke={item.color}
            strokeLinecap="round"
            strokeWidth={0.14}
            vectorEffect="non-scaling-stroke"
          />
        </g>
      );
    case "champagne":
      return (
        <g key={index} transform={transform} opacity={item.opacity}>
          {[-0.2, 0.22].map((offset) => (
            <g key={offset} transform={`translate(${s * offset} 0) rotate(${offset < 0 ? -8 : 8})`}>
              <path
                d={`M ${-s * 0.18} ${-s * 0.72} C ${-s * 0.2} ${-s * 0.22}, ${s * 0.2} ${-s * 0.22}, ${s * 0.18} ${-s * 0.72} Z`}
                fill="none"
                stroke={item.color}
                strokeWidth={0.18}
                vectorEffect="non-scaling-stroke"
              />
              <path
                d={`M 0 ${-s * 0.22} V ${s * 0.48} M ${-s * 0.22} ${s * 0.48} H ${s * 0.22}`}
                stroke={item.color}
                strokeLinecap="round"
                strokeWidth={0.16}
                vectorEffect="non-scaling-stroke"
              />
            </g>
          ))}
        </g>
      );
    case "floral-arch":
      return (
        <g key={index} transform={transform} opacity={item.opacity}>
          <path
            d={`M ${-s * 0.82} ${s * 0.72} V ${-s * 0.12} C ${-s * 0.82} ${-s * 0.82}, ${s * 0.82} ${-s * 0.82}, ${s * 0.82} ${-s * 0.12} V ${s * 0.72}`}
            fill="none"
            stroke={item.color}
            strokeLinecap="round"
            strokeWidth={0.22}
            vectorEffect="non-scaling-stroke"
          />
          {[-0.68, -0.36, 0.38, 0.68].map((offset) => (
            <ellipse
              key={offset}
              cx={s * offset}
              cy={offset < 0 ? -s * 0.38 : -s * 0.18}
              rx={s * 0.14}
              ry={s * 0.24}
              fill={item.color}
              transform={`rotate(${offset < 0 ? -34 : 34} ${s * offset} ${
                offset < 0 ? -s * 0.38 : -s * 0.18
              })`}
            />
          ))}
        </g>
      );
    case "baby-bottle":
      return (
        <g key={index} transform={transform} {...common}>
          <rect
            x={-s * 0.28}
            y={-s * 0.34}
            width={s * 0.56}
            height={s * 0.98}
            rx={s * 0.22}
            fill="none"
            stroke={item.color}
            strokeWidth={0.22}
            vectorEffect="non-scaling-stroke"
          />
          <path
            d={`M ${-s * 0.18} ${-s * 0.34} V ${-s * 0.56} H ${s * 0.18} V ${-s * 0.34} M ${-s * 0.16} ${-s * 0.02} H ${s * 0.16} M ${-s * 0.16} ${s * 0.22} H ${s * 0.16}`}
            stroke={item.color}
            strokeLinecap="round"
            strokeWidth={0.14}
            vectorEffect="non-scaling-stroke"
          />
        </g>
      );
    case "rattle":
      return (
        <g key={index} transform={transform} {...common}>
          <circle
            cx={0}
            cy={-s * 0.36}
            r={s * 0.36}
            fill="none"
            stroke={item.color}
            strokeWidth={0.24}
          />
          <path
            d={`M 0 0 V ${s * 0.72} M ${-s * 0.18} ${s * 0.54} H ${s * 0.18}`}
            stroke={item.color}
            strokeLinecap="round"
            strokeWidth={0.22}
            vectorEffect="non-scaling-stroke"
          />
          <circle cx={-s * 0.12} cy={-s * 0.42} r={s * 0.05} fill={item.color} />
          <circle cx={s * 0.14} cy={-s * 0.3} r={s * 0.05} fill={item.color} />
        </g>
      );
    case "moon":
      return (
        <path
          key={index}
          d={`M ${item.x + s * 0.42} ${item.y - s * 0.6} C ${item.x - s * 0.34} ${
            item.y - s * 0.48
          }, ${item.x - s * 0.56} ${item.y + s * 0.38}, ${item.x + s * 0.22} ${
            item.y + s * 0.68
          } C ${item.x - s * 0.6} ${item.y + s * 0.72}, ${item.x - s * 0.86} ${
            item.y - s * 0.42
          }, ${item.x + s * 0.42} ${item.y - s * 0.6} Z`}
          fill={item.color}
          opacity={item.opacity}
          transform={`rotate(${item.rotation} ${item.x} ${item.y})`}
        />
      );
    case "onesie":
      return (
        <g key={index} transform={transform} {...common}>
          <path
            d={`M ${-s * 0.54} ${-s * 0.56} L ${-s * 0.84} ${-s * 0.16} L ${-s * 0.48} ${s * 0.08} V ${s * 0.62} H ${-s * 0.1} L 0 ${s * 0.34} L ${s * 0.1} ${s * 0.62} H ${s * 0.48} V ${s * 0.08} L ${s * 0.84} ${-s * 0.16} L ${s * 0.54} ${-s * 0.56} C ${s * 0.26} ${-s * 0.32}, ${-s * 0.26} ${-s * 0.32}, ${-s * 0.54} ${-s * 0.56} Z`}
            fill={item.color}
          />
          <path
            d={`M ${-s * 0.18} ${-s * 0.46} C ${-s * 0.08} ${-s * 0.28}, ${s * 0.08} ${-s * 0.28}, ${s * 0.18} ${-s * 0.46}`}
            fill="none"
            stroke="rgba(255,255,255,0.45)"
            strokeLinecap="round"
            strokeWidth={0.14}
            vectorEffect="non-scaling-stroke"
          />
        </g>
      );
    case "house":
      return (
        <g key={index} transform={transform} opacity={item.opacity}>
          <path
            d={`M ${-s * 0.72} ${-s * 0.08} L 0 ${-s * 0.72} L ${s * 0.72} ${-s * 0.08}`}
            fill="none"
            stroke={item.color}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={0.26}
            vectorEffect="non-scaling-stroke"
          />
          <path
            d={`M ${-s * 0.5} ${-s * 0.04} V ${s * 0.62} H ${s * 0.5} V ${-s * 0.04}`}
            fill="none"
            stroke={item.color}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={0.22}
            vectorEffect="non-scaling-stroke"
          />
          <path
            d={`M ${-s * 0.12} ${s * 0.62} V ${s * 0.2} H ${s * 0.12} V ${s * 0.62}`}
            fill="none"
            stroke={item.color}
            strokeLinecap="round"
            strokeWidth={0.16}
            vectorEffect="non-scaling-stroke"
          />
        </g>
      );
    case "key":
      return (
        <g key={index} transform={transform} opacity={item.opacity}>
          <circle
            cx={-s * 0.42}
            cy={0}
            r={s * 0.28}
            fill="none"
            stroke={item.color}
            strokeWidth={0.22}
          />
          <path
            d={`M ${-s * 0.12} 0 H ${s * 0.78} M ${s * 0.38} 0 V ${s * 0.22} M ${s * 0.62} 0 V ${s * 0.16}`}
            stroke={item.color}
            strokeLinecap="round"
            strokeWidth={0.22}
            vectorEffect="non-scaling-stroke"
          />
        </g>
      );
    case "basketball":
      return (
        <g key={index} transform={transform} opacity={item.opacity}>
          <circle
            cx={0}
            cy={0}
            r={s * 0.55}
            fill={item.color}
            stroke="rgba(0,0,0,0.22)"
            strokeWidth={0.12}
            vectorEffect="non-scaling-stroke"
          />
          <path
            d={`M ${-s * 0.55} 0 H ${s * 0.55} M 0 ${-s * 0.55} V ${s * 0.55}`}
            stroke="rgba(0,0,0,0.55)"
            strokeWidth={0.12}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
          <path
            d={`M ${-s * 0.35} ${-s * 0.42} C ${-s * 0.12} ${-s * 0.2}, ${-s * 0.12} ${s * 0.2}, ${-s * 0.35} ${s * 0.42} M ${s * 0.35} ${-s * 0.42} C ${s * 0.12} ${-s * 0.2}, ${s * 0.12} ${s * 0.2}, ${s * 0.35} ${s * 0.42}`}
            fill="none"
            stroke="rgba(0,0,0,0.5)"
            strokeWidth={0.1}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
          {[
            [-0.22, -0.28],
            [0.2, 0.24],
            [0.34, -0.18],
          ].map(([cx, cy]) => (
            <circle
              key={`${cx}-${cy}`}
              cx={s * cx}
              cy={s * cy}
              r={s * 0.035}
              fill="rgba(255,255,255,0.42)"
            />
          ))}
        </g>
      );
    case "football":
      return (
        <g key={index} transform={transform} opacity={item.opacity}>
          <ellipse cx={0} cy={0} rx={s * 0.72} ry={s * 0.42} fill={item.color} />
          <path
            d={`M ${-s * 0.42} 0 C ${-s * 0.14} ${-s * 0.18}, ${s * 0.14} ${-s * 0.18}, ${s * 0.42} 0`}
            fill="none"
            stroke="rgba(255,255,255,0.6)"
            strokeLinecap="round"
            strokeWidth={0.15}
            vectorEffect="non-scaling-stroke"
          />
          {[-0.16, 0, 0.16].map((offset) => (
            <path
              key={offset}
              d={`M ${s * offset} ${-s * 0.14} V ${s * 0.14}`}
              stroke="rgba(255,255,255,0.7)"
              strokeLinecap="round"
              strokeWidth={0.12}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </g>
      );
    case "helmet":
      return (
        <g key={index} transform={transform} opacity={item.opacity}>
          <path
            d={`M ${-s * 0.62} ${s * 0.16} C ${-s * 0.62} ${-s * 0.46}, ${-s * 0.14} ${-s * 0.78}, ${s * 0.36} ${-s * 0.5} C ${s * 0.72} ${-s * 0.3}, ${s * 0.64} ${s * 0.18}, ${s * 0.3} ${s * 0.32} H ${-s * 0.34} C ${-s * 0.5} ${s * 0.32}, ${-s * 0.62} ${s * 0.24}, ${-s * 0.62} ${s * 0.16} Z`}
            fill={item.color}
          />
          <path
            d={`M ${s * 0.12} ${-s * 0.02} H ${s * 0.72} M ${s * 0.28} ${s * 0.2} H ${s * 0.62}`}
            fill="none"
            stroke="rgba(255,255,255,0.52)"
            strokeLinecap="round"
            strokeWidth={0.18}
            vectorEffect="non-scaling-stroke"
          />
        </g>
      );
    case "goalpost":
      return (
        <g key={index} transform={transform} opacity={item.opacity}>
          <path
            d={`M 0 ${s * 0.88} V ${-s * 0.26} M ${-s * 0.72} ${-s * 0.26} H ${s * 0.72} M ${-s * 0.72} ${-s * 0.26} V ${-s * 0.86} M ${s * 0.72} ${-s * 0.26} V ${-s * 0.86}`}
            fill="none"
            stroke={item.color}
            strokeLinecap="round"
            strokeWidth={0.28}
            vectorEffect="non-scaling-stroke"
          />
        </g>
      );
    case "field-line":
      return (
        <g key={index} transform={transform} opacity={item.opacity}>
          <path
            d={`M ${-s} 0 H ${s} M ${-s * 0.72} ${-s * 0.28} V ${s * 0.28} M ${-s * 0.36} ${-s * 0.2} V ${s * 0.2} M 0 ${-s * 0.28} V ${s * 0.28} M ${s * 0.36} ${-s * 0.2} V ${s * 0.2} M ${s * 0.72} ${-s * 0.28} V ${s * 0.28}`}
            fill="none"
            stroke={item.color}
            strokeLinecap="round"
            strokeWidth={0.2}
            vectorEffect="non-scaling-stroke"
          />
        </g>
      );
    case "stadium-light":
      return (
        <g key={index} transform={transform} opacity={item.opacity}>
          <path
            d={`M ${-s * 0.54} ${-s * 0.34} H ${s * 0.54} V ${s * 0.22} H ${-s * 0.54} Z`}
            fill="none"
            stroke={item.color}
            strokeWidth={0.2}
            vectorEffect="non-scaling-stroke"
          />
          {[-0.3, 0, 0.3].map((offset) => (
            <circle key={offset} cx={s * offset} cy={-s * 0.06} r={s * 0.1} fill={item.color} />
          ))}
          <path
            d={`M 0 ${s * 0.22} V ${s * 0.9}`}
            stroke={item.color}
            strokeLinecap="round"
            strokeWidth={0.18}
            vectorEffect="non-scaling-stroke"
          />
        </g>
      );
    case "hoop":
      return (
        <g key={index} transform={transform} opacity={item.opacity}>
          <rect
            x={-s * 0.62}
            y={-s * 0.72}
            width={s * 1.24}
            height={s * 0.84}
            rx={s * 0.08}
            fill="none"
            stroke={item.color}
            strokeWidth={0.22}
            vectorEffect="non-scaling-stroke"
          />
          <rect
            x={-s * 0.22}
            y={-s * 0.42}
            width={s * 0.44}
            height={s * 0.28}
            rx={s * 0.04}
            fill="none"
            stroke={item.color}
            strokeWidth={0.16}
            vectorEffect="non-scaling-stroke"
          />
          <ellipse
            cx={0}
            cy={s * 0.18}
            rx={s * 0.42}
            ry={s * 0.12}
            fill="none"
            stroke={item.color}
            strokeWidth={0.24}
            vectorEffect="non-scaling-stroke"
          />
          {[-0.3, -0.1, 0.1, 0.3].map((offset) => (
            <path
              key={offset}
              d={`M ${s * offset} ${s * 0.26} L ${s * (offset * 0.58)} ${s * 0.82}`}
              fill="none"
              stroke={item.color}
              strokeLinecap="round"
              strokeWidth={0.12}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </g>
      );
    case "court-line":
      return (
        <g key={index} transform={transform} opacity={item.opacity}>
          <path
            d={`M ${-s} 0 H ${s} M 0 ${-s * 0.62} A ${s * 0.62} ${s * 0.62} 0 0 1 0 ${s * 0.62}`}
            fill="none"
            stroke={item.color}
            strokeLinecap="round"
            strokeWidth={0.22}
            vectorEffect="non-scaling-stroke"
          />
        </g>
      );
    case "sneaker":
      return (
        <g key={index} transform={transform} opacity={item.opacity}>
          <path
            d={`M ${-s * 0.78} ${s * 0.18} C ${-s * 0.4} ${s * 0.12}, ${-s * 0.1} ${-s * 0.46}, ${
              s * 0.18
            } ${-s * 0.3} C ${s * 0.34} ${-s * 0.2}, ${s * 0.28} ${s * 0.06}, ${
              s * 0.72
            } ${s * 0.12} L ${s * 0.9} ${s * 0.38} C ${s * 0.34} ${s * 0.52}, ${
              -s * 0.34
            } ${s * 0.5}, ${-s * 0.86} ${s * 0.38} Z`}
            fill={item.color}
          />
          <path
            d={`M ${-s * 0.32} ${s * 0.06} L ${s * 0.1} ${s * 0.12} M ${-s * 0.18} ${
              -s * 0.08
            } L ${s * 0.2} ${s * 0.02} M ${-s * 0.58} ${s * 0.34} H ${s * 0.78}`}
            fill="none"
            stroke="rgba(255,255,255,0.58)"
            strokeLinecap="round"
            strokeWidth={0.18}
            vectorEffect="non-scaling-stroke"
          />
        </g>
      );
    case "pickleball":
      return (
        <g key={index} transform={transform} opacity={item.opacity}>
          <circle cx={0} cy={0} r={s * 0.52} fill={item.color} />
          {[
            [-0.22, -0.16],
            [0.16, -0.24],
            [0.24, 0.12],
            [-0.16, 0.22],
            [0.02, 0.02],
          ].map(([cx, cy]) => (
            <circle
              key={`${cx}-${cy}`}
              cx={s * cx}
              cy={s * cy}
              r={s * 0.07}
              fill="rgba(0,0,0,0.42)"
            />
          ))}
        </g>
      );
    case "paddle":
      return (
        <g key={index} transform={transform} opacity={item.opacity}>
          <rect
            x={-s * 0.36}
            y={-s * 0.78}
            width={s * 0.72}
            height={s * 1.05}
            rx={s * 0.22}
            fill={item.color}
          />
          <rect
            x={-s * 0.12}
            y={s * 0.18}
            width={s * 0.24}
            height={s * 0.7}
            rx={s * 0.1}
            fill={item.color}
          />
          <path
            d={`M ${-s * 0.22} ${-s * 0.42} H ${s * 0.22} M ${-s * 0.24} ${-s * 0.12} H ${s * 0.24}`}
            stroke="rgba(255,255,255,0.34)"
            strokeLinecap="round"
            strokeWidth={0.16}
            vectorEffect="non-scaling-stroke"
          />
        </g>
      );
    case "net-line":
      return (
        <g key={index} transform={transform} opacity={item.opacity}>
          <path
            d={`M ${-s} 0 H ${s}`}
            stroke={item.color}
            strokeLinecap="round"
            strokeWidth={0.24}
            vectorEffect="non-scaling-stroke"
          />
          {[-0.72, -0.36, 0, 0.36, 0.72].map((offset) => (
            <path
              key={offset}
              d={`M ${s * offset} ${-s * 0.28} V ${s * 0.28}`}
              stroke={item.color}
              strokeLinecap="round"
              strokeWidth={0.16}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </g>
      );
    case "jersey":
      return (
        <g key={index} transform={transform} opacity={item.opacity}>
          <path
            d={`M ${-s * 0.5} ${-s * 0.72} L ${-s * 0.86} ${-s * 0.34} L ${-s * 0.58} ${-s * 0.02} L ${-s * 0.42} ${-s * 0.18} V ${s * 0.72} H ${s * 0.42} V ${-s * 0.18} L ${s * 0.58} ${-s * 0.02} L ${s * 0.86} ${-s * 0.34} L ${s * 0.5} ${-s * 0.72} C ${s * 0.28} ${-s * 0.52}, ${-s * 0.28} ${-s * 0.52}, ${-s * 0.5} ${-s * 0.72} Z`}
            fill={item.color}
          />
          <path
            d={`M ${-s * 0.2} ${-s * 0.5} C ${-s * 0.08} ${-s * 0.34}, ${s * 0.08} ${-s * 0.34}, ${s * 0.2} ${-s * 0.5} M ${-s * 0.22} ${s * 0.1} H ${s * 0.22}`}
            fill="none"
            stroke="rgba(255,255,255,0.45)"
            strokeLinecap="round"
            strokeWidth={0.16}
            vectorEffect="non-scaling-stroke"
          />
        </g>
      );
    case "whistle":
      return (
        <g key={index} transform={transform} opacity={item.opacity}>
          <path
            d={`M ${-s * 0.58} ${-s * 0.08} C ${-s * 0.58} ${-s * 0.46}, ${s * 0.18} ${-s * 0.5}, ${s * 0.54} ${-s * 0.18} L ${s * 0.82} ${s * 0.02} L ${s * 0.48} ${s * 0.2} C ${s * 0.18} ${s * 0.64}, ${-s * 0.58} ${s * 0.34}, ${-s * 0.58} ${-s * 0.08} Z`}
            fill="none"
            stroke={item.color}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={0.22}
            vectorEffect="non-scaling-stroke"
          />
          <circle cx={-s * 0.18} cy={s * 0.02} r={s * 0.14} fill={item.color} />
          <path
            d={`M ${s * 0.54} ${-s * 0.18} H ${s * 0.9}`}
            stroke={item.color}
            strokeLinecap="round"
            strokeWidth={0.18}
            vectorEffect="non-scaling-stroke"
          />
        </g>
      );
    case "scoreboard":
      return (
        <g key={index} transform={transform} opacity={item.opacity}>
          <rect
            x={-s * 0.78}
            y={-s * 0.48}
            width={s * 1.56}
            height={s * 0.96}
            rx={s * 0.08}
            fill="none"
            stroke={item.color}
            strokeWidth={0.22}
            vectorEffect="non-scaling-stroke"
          />
          <path
            d={`M 0 ${-s * 0.48} V ${s * 0.48} M ${-s * 0.52} ${-s * 0.08} H ${-s * 0.18} M ${s * 0.18} ${-s * 0.08} H ${s * 0.52} M ${-s * 0.5} ${s * 0.18} H ${s * 0.5}`}
            stroke={item.color}
            strokeLinecap="round"
            strokeWidth={0.14}
            vectorEffect="non-scaling-stroke"
          />
          <circle cx={-s * 0.48} cy={-s * 0.28} r={s * 0.06} fill={item.color} />
          <circle cx={s * 0.48} cy={-s * 0.28} r={s * 0.06} fill={item.color} />
        </g>
      );
    case "pennant":
      return (
        <g key={index} transform={transform} opacity={item.opacity}>
          <path
            d={`M ${-s * 0.72} ${-s * 0.52} L ${s * 0.78} ${-s * 0.18} L ${-s * 0.72} ${s * 0.22} Z`}
            fill={item.color}
          />
          <path
            d={`M ${-s * 0.72} ${-s * 0.52} V ${s * 0.72}`}
            stroke={item.color}
            strokeLinecap="round"
            strokeWidth={0.22}
            vectorEffect="non-scaling-stroke"
          />
        </g>
      );
    case "megaphone":
      return (
        <g key={index} transform={transform} opacity={item.opacity}>
          <path
            d={`M ${-s * 0.78} ${-s * 0.2} L ${s * 0.56} ${-s * 0.62} V ${s * 0.36} L ${-s * 0.78} ${s * 0.02} Z`}
            fill="none"
            stroke={item.color}
            strokeLinejoin="round"
            strokeWidth={0.22}
            vectorEffect="non-scaling-stroke"
          />
          <path
            d={`M ${-s * 0.42} ${s * 0.08} L ${-s * 0.18} ${s * 0.72} M ${s * 0.7} ${-s * 0.44} C ${s * 0.98} ${-s * 0.22}, ${s * 0.98} ${s * 0.04}, ${s * 0.7} ${s * 0.26}`}
            fill="none"
            stroke={item.color}
            strokeLinecap="round"
            strokeWidth={0.18}
            vectorEffect="non-scaling-stroke"
          />
        </g>
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
    case "book":
      return (
        <g key={index} transform={transform} opacity={item.opacity}>
          <path
            d={`M 0 ${-s * 0.48} C ${-s * 0.32} ${-s * 0.72}, ${-s * 0.72} ${-s * 0.58}, ${-s * 0.88} ${-s * 0.3} V ${s * 0.54} C ${-s * 0.56} ${s * 0.32}, ${-s * 0.24} ${s * 0.34}, 0 ${s * 0.58} C ${s * 0.24} ${s * 0.34}, ${s * 0.56} ${s * 0.32}, ${s * 0.88} ${s * 0.54} V ${-s * 0.3} C ${s * 0.72} ${-s * 0.58}, ${s * 0.32} ${-s * 0.72}, 0 ${-s * 0.48} Z`}
            fill="none"
            stroke={item.color}
            strokeLinejoin="round"
            strokeWidth={0.22}
            vectorEffect="non-scaling-stroke"
          />
          <path
            d={`M 0 ${-s * 0.48} V ${s * 0.58} M ${-s * 0.58} ${-s * 0.18} C ${-s * 0.34} ${-s * 0.24}, ${-s * 0.18} ${-s * 0.16}, 0 0 M ${s * 0.58} ${-s * 0.18} C ${s * 0.34} ${-s * 0.24}, ${s * 0.18} ${-s * 0.16}, 0 0`}
            fill="none"
            stroke={item.color}
            strokeLinecap="round"
            strokeWidth={0.14}
            vectorEffect="non-scaling-stroke"
          />
        </g>
      );
    case "medal":
      return (
        <g key={index} transform={transform} {...common}>
          <path
            d={`M ${-s * 0.34} ${-s * 0.76} L ${-s * 0.08} ${-s * 0.2} M ${s * 0.34} ${-s * 0.76} L ${s * 0.08} ${-s * 0.2}`}
            stroke={item.color}
            strokeLinecap="round"
            strokeWidth={0.22}
            vectorEffect="non-scaling-stroke"
          />
          <circle
            cx={0}
            cy={s * 0.12}
            r={s * 0.4}
            fill="none"
            stroke={item.color}
            strokeWidth={0.24}
          />
          <path
            d={`M ${-s * 0.14} ${s * 0.12} H ${s * 0.14}`}
            stroke={item.color}
            strokeLinecap="round"
            strokeWidth={0.16}
            vectorEffect="non-scaling-stroke"
          />
        </g>
      );
    case "dove":
      return (
        <g key={index} transform={transform} opacity={item.opacity}>
          <path
            d={`M ${-s * 0.86} ${s * 0.08} C ${-s * 0.34} ${-s * 0.2}, ${-s * 0.02} ${-s * 0.04}, ${s * 0.22} ${s * 0.16} C ${s * 0.52} ${s * 0.42}, ${s * 0.84} ${s * 0.22}, ${s * 0.92} ${-s * 0.08} C ${s * 0.58} ${s * 0.04}, ${s * 0.34} ${-s * 0.14}, ${s * 0.18} ${-s * 0.42} C ${-s * 0.12} ${-s * 0.12}, ${-s * 0.46} ${s * 0.06}, ${-s * 0.86} ${s * 0.08} Z`}
            fill={item.color}
          />
          <path
            d={`M ${-s * 0.18} ${-s * 0.02} C ${-s * 0.34} ${-s * 0.52}, ${s * 0.1} ${-s * 0.76}, ${s * 0.42} ${-s * 0.64}`}
            fill="none"
            stroke={item.color}
            strokeLinecap="round"
            strokeWidth={0.18}
            vectorEffect="non-scaling-stroke"
          />
        </g>
      );
    case "calendar":
      return (
        <g key={index} transform={transform} opacity={item.opacity}>
          <rect
            x={-s * 0.68}
            y={-s * 0.58}
            width={s * 1.36}
            height={s * 1.16}
            rx={s * 0.12}
            fill="none"
            stroke={item.color}
            strokeWidth={0.22}
            vectorEffect="non-scaling-stroke"
          />
          <path
            d={`M ${-s * 0.68} ${-s * 0.22} H ${s * 0.68} M ${-s * 0.34} ${-s * 0.78} V ${-s * 0.44} M ${s * 0.34} ${-s * 0.78} V ${-s * 0.44}`}
            stroke={item.color}
            strokeLinecap="round"
            strokeWidth={0.18}
            vectorEffect="non-scaling-stroke"
          />
          {[-0.32, 0, 0.32].map((offset) => (
            <circle key={offset} cx={s * offset} cy={s * 0.16} r={s * 0.055} fill={item.color} />
          ))}
        </g>
      );
    case "ticket":
      return (
        <g key={index} transform={transform} opacity={item.opacity}>
          <path
            d={`M ${-s * 0.82} ${-s * 0.34} H ${s * 0.82} V ${-s * 0.04} C ${s * 0.58} ${-s * 0.02}, ${s * 0.58} ${s * 0.18}, ${s * 0.82} ${s * 0.2} V ${s * 0.5} H ${-s * 0.82} V ${s * 0.2} C ${-s * 0.58} ${s * 0.18}, ${-s * 0.58} ${-s * 0.02}, ${-s * 0.82} ${-s * 0.04} Z`}
            fill="none"
            stroke={item.color}
            strokeLinejoin="round"
            strokeWidth={0.22}
            vectorEffect="non-scaling-stroke"
          />
          <path
            d={`M ${-s * 0.24} ${-s * 0.2} V ${s * 0.36}`}
            stroke={item.color}
            strokeDasharray="0.04 0.18"
            strokeLinecap="round"
            strokeWidth={0.14}
            vectorEffect="non-scaling-stroke"
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
    case "cupcake":
      return (
        <g key={index} transform={transform} {...common}>
          <path
            d={`M ${-s * 0.5} ${-s * 0.02} C ${-s * 0.58} ${-s * 0.42}, ${-s * 0.18} ${-s * 0.68}, 0 ${-s * 0.42} C ${s * 0.18} ${-s * 0.68}, ${s * 0.58} ${-s * 0.42}, ${s * 0.5} ${-s * 0.02} Z`}
            fill={item.color}
          />
          <path
            d={`M ${-s * 0.5} ${s * 0.02} H ${s * 0.5} L ${s * 0.32} ${s * 0.72} H ${-s * 0.32} Z`}
            fill="none"
            stroke={item.color}
            strokeLinejoin="round"
            strokeWidth={0.22}
            vectorEffect="non-scaling-stroke"
          />
          <circle cx={0} cy={-s * 0.7} r={s * 0.1} fill={item.color} />
        </g>
      );
    case "sparkle":
      return (
        <path
          key={index}
          d={`M ${item.x} ${item.y - s} L ${item.x + s * 0.18} ${item.y - s * 0.18} L ${
            item.x + s
          } ${item.y} L ${item.x + s * 0.18} ${item.y + s * 0.18} L ${item.x} ${
            item.y + s
          } L ${item.x - s * 0.18} ${item.y + s * 0.18} L ${item.x - s} ${item.y} L ${
            item.x - s * 0.18
          } ${item.y - s * 0.18} Z`}
          fill={item.color}
          opacity={item.opacity}
          transform={`rotate(${item.rotation} ${item.x} ${item.y})`}
        />
      );
    case "crown":
      return (
        <g key={index} transform={transform} {...common}>
          <path
            d={`M ${-s * 0.72} ${s * 0.44} L ${-s * 0.52} ${-s * 0.44} L ${-s * 0.12} ${s * 0.1} L 0 ${-s * 0.58} L ${s * 0.12} ${s * 0.1} L ${s * 0.52} ${-s * 0.44} L ${s * 0.72} ${s * 0.44} Z`}
            fill={item.color}
          />
          <path
            d={`M ${-s * 0.48} ${s * 0.5} H ${s * 0.48}`}
            stroke="rgba(255,255,255,0.5)"
            strokeLinecap="round"
            strokeWidth={0.16}
            vectorEffect="non-scaling-stroke"
          />
        </g>
      );
    case "music-note":
      return (
        <g key={index} transform={transform} opacity={item.opacity}>
          <path
            d={`M ${s * 0.22} ${-s * 0.8} V ${s * 0.28} C ${s * 0.05} ${s * 0.1}, ${-s * 0.48} ${s * 0.18}, ${-s * 0.48} ${s * 0.52} C ${-s * 0.48} ${s * 0.82}, ${s * 0.04} ${s * 0.82}, ${s * 0.22} ${s * 0.44} V ${-s * 0.48} L ${s * 0.72} ${-s * 0.62}`}
            fill="none"
            stroke={item.color}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={0.24}
            vectorEffect="non-scaling-stroke"
          />
        </g>
      );
    case "arcade-token":
      return (
        <g key={index} transform={transform} opacity={item.opacity}>
          <circle cx={0} cy={0} r={s * 0.58} fill="none" stroke={item.color} strokeWidth={0.22} />
          <circle cx={0} cy={0} r={s * 0.34} fill="none" stroke={item.color} strokeWidth={0.14} />
          <path
            d={`M ${-s * 0.16} ${-s * 0.02} H ${s * 0.16} M 0 ${-s * 0.18} V ${s * 0.18}`}
            stroke={item.color}
            strokeLinecap="round"
            strokeWidth={0.14}
            vectorEffect="non-scaling-stroke"
          />
        </g>
      );
    case "ring-box":
      return (
        <g key={index} transform={transform} opacity={item.opacity}>
          <path
            d={`M ${-s * 0.62} ${-s * 0.08} H ${s * 0.62} V ${s * 0.62} H ${-s * 0.62} Z M ${-s * 0.46} ${-s * 0.08} L 0 ${-s * 0.48} L ${s * 0.46} ${-s * 0.08}`}
            fill="none"
            stroke={item.color}
            strokeLinejoin="round"
            strokeWidth={0.22}
            vectorEffect="non-scaling-stroke"
          />
          <circle
            cx={0}
            cy={s * 0.24}
            r={s * 0.18}
            fill="none"
            stroke={item.color}
            strokeWidth={0.16}
          />
        </g>
      );
    case "champagne-bubble":
      return (
        <g key={index} transform={transform} opacity={item.opacity}>
          {[
            [-0.38, 0.18, 0.18],
            [0.02, -0.16, 0.24],
            [0.42, 0.26, 0.13],
          ].map(([cx, cy, r]) => (
            <circle
              key={`${cx}-${cy}`}
              cx={s * cx}
              cy={s * cy}
              r={s * r}
              fill="none"
              stroke={item.color}
              strokeWidth={0.16}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </g>
      );
    case "wine-glass":
      return (
        <g key={index} transform={transform} opacity={item.opacity}>
          <path
            d={`M ${-s * 0.3} ${-s * 0.7} C ${-s * 0.34} ${-s * 0.1}, ${s * 0.34} ${-s * 0.1}, ${s * 0.3} ${-s * 0.7} Z M 0 ${-s * 0.08} V ${s * 0.62} M ${-s * 0.28} ${s * 0.62} H ${s * 0.28}`}
            fill="none"
            stroke={item.color}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={0.2}
            vectorEffect="non-scaling-stroke"
          />
        </g>
      );
    case "lace":
      return (
        <g key={index} transform={transform} opacity={item.opacity}>
          <path
            d={`M ${-s} 0 H ${s}`}
            stroke={item.color}
            strokeLinecap="round"
            strokeWidth={0.18}
            vectorEffect="non-scaling-stroke"
          />
          {[-0.72, -0.36, 0, 0.36, 0.72].map((offset) => (
            <path
              key={offset}
              d={`M ${s * (offset - 0.18)} 0 A ${s * 0.18} ${s * 0.18} 0 0 0 ${s * (offset + 0.18)} 0`}
              fill="none"
              stroke={item.color}
              strokeWidth={0.12}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </g>
      );
    case "vow-book":
    case "notebook":
      return (
        <g key={index} transform={transform} opacity={item.opacity}>
          <rect
            x={-s * 0.68}
            y={-s * 0.68}
            width={s * 1.36}
            height={s * 1.22}
            rx={s * 0.08}
            fill="none"
            stroke={item.color}
            strokeWidth={0.22}
            vectorEffect="non-scaling-stroke"
          />
          <path
            d={`M ${-s * 0.36} ${-s * 0.28} H ${s * 0.36} M ${-s * 0.36} 0 H ${s * 0.28} M ${-s * 0.36} ${s * 0.26} H ${s * 0.18}`}
            stroke={item.color}
            strokeLinecap="round"
            strokeWidth={0.14}
            vectorEffect="non-scaling-stroke"
          />
        </g>
      );
    case "ribbon":
      return (
        <g key={index} transform={transform} opacity={item.opacity}>
          <path
            d={`M 0 ${-s * 0.16} C ${-s * 0.48} ${-s * 0.58}, ${-s * 0.78} ${s * 0.16}, ${-s * 0.18} ${s * 0.12} C ${-s * 0.22} ${s * 0.52}, ${-s * 0.42} ${s * 0.72}, ${-s * 0.02} ${s * 0.44} C ${s * 0.42} ${s * 0.72}, ${s * 0.22} ${s * 0.52}, ${s * 0.18} ${s * 0.12} C ${s * 0.78} ${s * 0.16}, ${s * 0.48} ${-s * 0.58}, 0 ${-s * 0.16} Z`}
            fill="none"
            stroke={item.color}
            strokeLinejoin="round"
            strokeWidth={0.2}
            vectorEffect="non-scaling-stroke"
          />
        </g>
      );
    case "bouquet":
      return (
        <g key={index} transform={transform} opacity={item.opacity}>
          {[-0.28, 0, 0.28].map((offset) => (
            <circle key={offset} cx={s * offset} cy={-s * 0.36} r={s * 0.2} fill={item.color} />
          ))}
          <path
            d={`M ${-s * 0.28} ${-s * 0.16} L 0 ${s * 0.72} M ${s * 0.28} ${-s * 0.16} L 0 ${s * 0.72} M 0 ${-s * 0.16} V ${s * 0.72}`}
            stroke={item.color}
            strokeLinecap="round"
            strokeWidth={0.14}
            vectorEffect="non-scaling-stroke"
          />
        </g>
      );
    case "wax-seal":
      return (
        <g key={index} transform={transform} opacity={item.opacity}>
          <path
            d={`M 0 ${-s * 0.68} C ${s * 0.24} ${-s * 0.54}, ${s * 0.58} ${-s * 0.64}, ${s * 0.62} ${-s * 0.28} C ${s * 0.9} ${-s * 0.08}, ${s * 0.58} ${s * 0.14}, ${s * 0.62} ${s * 0.42} C ${s * 0.28} ${s * 0.34}, ${s * 0.14} ${s * 0.78}, ${-s * 0.12} ${s * 0.58} C ${-s * 0.44} ${s * 0.74}, ${-s * 0.52} ${s * 0.32}, ${-s * 0.76} ${s * 0.22} C ${-s * 0.54} ${-s * 0.08}, ${-s * 0.82} ${-s * 0.36}, ${-s * 0.44} ${-s * 0.46} C ${-s * 0.34} ${-s * 0.78}, ${-s * 0.1} ${-s * 0.52}, 0 ${-s * 0.68} Z`}
            fill={item.color}
          />
          <circle cx={0} cy={0} r={s * 0.22} fill="rgba(255,255,255,0.28)" />
        </g>
      );
    case "rose":
      return (
        <g key={index} transform={transform} opacity={item.opacity}>
          <path
            d={`M 0 ${s * 0.78} C ${s * 0.08} ${s * 0.2}, ${-s * 0.08} ${-s * 0.14}, 0 ${-s * 0.58}`}
            fill="none"
            stroke={item.color}
            strokeLinecap="round"
            strokeWidth={0.18}
            vectorEffect="non-scaling-stroke"
          />
          <path
            d={`M 0 ${-s * 0.58} C ${-s * 0.42} ${-s * 0.62}, ${-s * 0.42} ${-s * 0.04}, 0 ${-s * 0.02} C ${s * 0.42} ${-s * 0.04}, ${s * 0.42} ${-s * 0.62}, 0 ${-s * 0.58} Z`}
            fill={item.color}
          />
          <ellipse cx={-s * 0.24} cy={s * 0.08} rx={s * 0.13} ry={s * 0.28} fill={item.color} />
        </g>
      );
    case "photo-frame":
      return (
        <g key={index} transform={transform} opacity={item.opacity}>
          <rect
            x={-s * 0.72}
            y={-s * 0.52}
            width={s * 1.44}
            height={s * 1.04}
            rx={s * 0.06}
            fill="none"
            stroke={item.color}
            strokeWidth={0.22}
            vectorEffect="non-scaling-stroke"
          />
          <path
            d={`M ${-s * 0.52} ${s * 0.28} L ${-s * 0.12} ${-s * 0.08} L ${s * 0.12} ${s * 0.14} L ${s * 0.44} ${-s * 0.16}`}
            fill="none"
            stroke={item.color}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={0.16}
            vectorEffect="non-scaling-stroke"
          />
        </g>
      );
    case "pacifier":
      return (
        <g key={index} transform={transform} opacity={item.opacity}>
          <ellipse cx={0} cy={-s * 0.16} rx={s * 0.34} ry={s * 0.24} fill={item.color} />
          <path
            d={`M ${-s * 0.58} ${s * 0.08} H ${s * 0.58} M 0 ${s * 0.08} C ${-s * 0.28} ${s * 0.5}, ${s * 0.28} ${s * 0.5}, 0 ${s * 0.08}`}
            fill="none"
            stroke={item.color}
            strokeLinecap="round"
            strokeWidth={0.22}
            vectorEffect="non-scaling-stroke"
          />
        </g>
      );
    case "teddy-bear":
      return (
        <g key={index} transform={transform} opacity={item.opacity}>
          <circle cx={-s * 0.38} cy={-s * 0.38} r={s * 0.22} fill={item.color} />
          <circle cx={s * 0.38} cy={-s * 0.38} r={s * 0.22} fill={item.color} />
          <circle cx={0} cy={0} r={s * 0.5} fill={item.color} />
          <circle cx={0} cy={s * 0.12} r={s * 0.16} fill="rgba(255,255,255,0.32)" />
        </g>
      );
    case "cloud":
      return (
        <g key={index} transform={transform} opacity={item.opacity}>
          <path
            d={`M ${-s * 0.72} ${s * 0.18} C ${-s * 0.82} ${-s * 0.2}, ${-s * 0.38} ${-s * 0.34}, ${-s * 0.18} ${-s * 0.12} C ${-s * 0.1} ${-s * 0.52}, ${s * 0.46} ${-s * 0.48}, ${s * 0.5} ${-s * 0.06} C ${s * 0.86} ${-s * 0.02}, ${s * 0.82} ${s * 0.36}, ${s * 0.48} ${s * 0.36} H ${-s * 0.5} C ${-s * 0.66} ${s * 0.36}, ${-s * 0.72} ${s * 0.28}, ${-s * 0.72} ${s * 0.18} Z`}
            fill={item.color}
          />
        </g>
      );
    case "bib":
      return (
        <g key={index} transform={transform} opacity={item.opacity}>
          <path
            d={`M ${-s * 0.46} ${-s * 0.56} C ${-s * 0.12} ${-s * 0.26}, ${s * 0.12} ${-s * 0.26}, ${s * 0.46} ${-s * 0.56} V ${s * 0.28} C ${s * 0.46} ${s * 0.72}, ${-s * 0.46} ${s * 0.72}, ${-s * 0.46} ${s * 0.28} Z`}
            fill="none"
            stroke={item.color}
            strokeWidth={0.22}
            vectorEffect="non-scaling-stroke"
          />
          <circle
            cx={0}
            cy={-s * 0.34}
            r={s * 0.18}
            fill="none"
            stroke={item.color}
            strokeWidth={0.16}
          />
        </g>
      );
    case "stroller":
      return (
        <g key={index} transform={transform} opacity={item.opacity}>
          <path
            d={`M ${-s * 0.62} ${-s * 0.12} A ${s * 0.62} ${s * 0.62} 0 0 1 ${s * 0.62} ${-s * 0.12} V ${s * 0.28} H ${-s * 0.62} Z`}
            fill="none"
            stroke={item.color}
            strokeWidth={0.22}
            vectorEffect="non-scaling-stroke"
          />
          <path
            d={`M ${s * 0.62} ${-s * 0.12} H ${s * 0.9}`}
            stroke={item.color}
            strokeLinecap="round"
            strokeWidth={0.18}
          />
          <circle cx={-s * 0.36} cy={s * 0.48} r={s * 0.12} fill={item.color} />
          <circle cx={s * 0.36} cy={s * 0.48} r={s * 0.12} fill={item.color} />
        </g>
      );
    case "teacup":
      return (
        <g key={index} transform={transform} opacity={item.opacity}>
          <path
            d={`M ${-s * 0.54} ${-s * 0.2} H ${s * 0.46} C ${s * 0.52} ${s * 0.36}, ${-s * 0.42} ${s * 0.36}, ${-s * 0.54} ${-s * 0.2} Z M ${s * 0.46} ${-s * 0.08} C ${s * 0.86} ${-s * 0.08}, ${s * 0.82} ${s * 0.28}, ${s * 0.48} ${s * 0.22} M ${-s * 0.68} ${s * 0.48} H ${s * 0.68}`}
            fill="none"
            stroke={item.color}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={0.2}
            vectorEffect="non-scaling-stroke"
          />
        </g>
      );
    case "bow":
      return (
        <g key={index} transform={transform} opacity={item.opacity}>
          <path
            d={`M 0 0 C ${-s * 0.48} ${-s * 0.42}, ${-s * 0.82} ${s * 0.18}, 0 ${s * 0.12} C ${s * 0.82} ${s * 0.18}, ${s * 0.48} ${-s * 0.42}, 0 0 Z`}
            fill="none"
            stroke={item.color}
            strokeLinejoin="round"
            strokeWidth={0.22}
            vectorEffect="non-scaling-stroke"
          />
          <circle cx={0} cy={0} r={s * 0.12} fill={item.color} />
        </g>
      );
    case "front-door":
      return (
        <g key={index} transform={transform} opacity={item.opacity}>
          <rect
            x={-s * 0.46}
            y={-s * 0.78}
            width={s * 0.92}
            height={s * 1.46}
            rx={s * 0.06}
            fill="none"
            stroke={item.color}
            strokeWidth={0.22}
          />
          <circle cx={s * 0.24} cy={0} r={s * 0.055} fill={item.color} />
          <path
            d={`M ${-s * 0.62} ${s * 0.72} H ${s * 0.62}`}
            stroke={item.color}
            strokeLinecap="round"
            strokeWidth={0.18}
          />
        </g>
      );
    case "welcome-mat":
      return (
        <g key={index} transform={transform} opacity={item.opacity}>
          <rect
            x={-s * 0.82}
            y={-s * 0.24}
            width={s * 1.64}
            height={s * 0.64}
            rx={s * 0.12}
            fill="none"
            stroke={item.color}
            strokeWidth={0.22}
          />
          <path
            d={`M ${-s * 0.42} ${s * 0.08} H ${s * 0.42}`}
            stroke={item.color}
            strokeLinecap="round"
            strokeWidth={0.14}
          />
        </g>
      );
    case "plant":
      return (
        <g key={index} transform={transform} opacity={item.opacity}>
          <path
            d={`M ${-s * 0.36} ${s * 0.24} H ${s * 0.36} L ${s * 0.22} ${s * 0.78} H ${-s * 0.22} Z`}
            fill={item.color}
          />
          {[
            [-0.32, -0.26, -34],
            [0, -0.46, 0],
            [0.32, -0.26, 34],
          ].map(([cx, cy, rot]) => (
            <ellipse
              key={`${cx}-${cy}`}
              cx={s * cx}
              cy={s * cy}
              rx={s * 0.15}
              ry={s * 0.36}
              fill={item.color}
              transform={`rotate(${rot} ${s * cx} ${s * cy})`}
            />
          ))}
        </g>
      );
    case "lamp":
      return (
        <g key={index} transform={transform} opacity={item.opacity}>
          <path
            d={`M ${-s * 0.46} ${-s * 0.58} H ${s * 0.46} L ${s * 0.28} ${-s * 0.1} H ${-s * 0.28} Z`}
            fill="none"
            stroke={item.color}
            strokeLinejoin="round"
            strokeWidth={0.2}
          />
          <path
            d={`M 0 ${-s * 0.1} V ${s * 0.62} M ${-s * 0.34} ${s * 0.62} H ${s * 0.34}`}
            stroke={item.color}
            strokeLinecap="round"
            strokeWidth={0.18}
          />
        </g>
      );
    case "mug":
      return (
        <g key={index} transform={transform} opacity={item.opacity}>
          <path
            d={`M ${-s * 0.5} ${-s * 0.36} H ${s * 0.36} V ${s * 0.46} C ${s * 0.18} ${s * 0.64}, ${-s * 0.32} ${s * 0.64}, ${-s * 0.5} ${s * 0.46} Z M ${s * 0.36} ${-s * 0.16} C ${s * 0.82} ${-s * 0.14}, ${s * 0.82} ${s * 0.32}, ${s * 0.36} ${s * 0.3}`}
            fill="none"
            stroke={item.color}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={0.2}
          />
        </g>
      );
    case "court-arc":
      return (
        <g key={index} transform={transform} opacity={item.opacity}>
          <path
            d={`M ${-s} ${s * 0.36} H ${s} M ${-s * 0.62} ${s * 0.36} A ${s * 0.62} ${s * 0.62} 0 0 1 ${s * 0.62} ${s * 0.36}`}
            fill="none"
            stroke={item.color}
            strokeLinecap="round"
            strokeWidth={0.22}
            vectorEffect="non-scaling-stroke"
          />
        </g>
      );
    case "backboard":
      return (
        <g key={index} transform={transform} opacity={item.opacity}>
          <rect
            x={-s * 0.74}
            y={-s * 0.62}
            width={s * 1.48}
            height={s * 0.9}
            rx={s * 0.06}
            fill="none"
            stroke={item.color}
            strokeWidth={0.22}
          />
          <rect
            x={-s * 0.24}
            y={-s * 0.36}
            width={s * 0.48}
            height={s * 0.28}
            rx={s * 0.03}
            fill="none"
            stroke={item.color}
            strokeWidth={0.14}
          />
          <ellipse
            cx={0}
            cy={s * 0.32}
            rx={s * 0.34}
            ry={s * 0.1}
            fill="none"
            stroke={item.color}
            strokeWidth={0.18}
          />
        </g>
      );
    case "net":
      return (
        <g key={index} transform={transform} opacity={item.opacity}>
          <path
            d={`M ${-s * 0.6} ${-s * 0.18} H ${s * 0.6} L ${s * 0.42} ${s * 0.62} H ${-s * 0.42} Z`}
            fill="none"
            stroke={item.color}
            strokeLinejoin="round"
            strokeWidth={0.2}
          />
          {[-0.36, 0, 0.36].map((offset) => (
            <path
              key={offset}
              d={`M ${s * offset} ${-s * 0.12} L ${s * (offset * 0.55)} ${s * 0.56}`}
              stroke={item.color}
              strokeWidth={0.12}
            />
          ))}
        </g>
      );
    case "shot-clock":
      return (
        <g key={index} transform={transform} opacity={item.opacity}>
          <rect
            x={-s * 0.54}
            y={-s * 0.48}
            width={s * 1.08}
            height={s * 0.78}
            rx={s * 0.08}
            fill="none"
            stroke={item.color}
            strokeWidth={0.22}
          />
          <path
            d={`M ${-s * 0.22} ${-s * 0.18} H ${s * 0.22} M ${-s * 0.22} ${s * 0.04} H ${s * 0.22} M ${-s * 0.22} ${s * 0.26} H ${s * 0.22}`}
            stroke={item.color}
            strokeLinecap="round"
            strokeWidth={0.13}
          />
        </g>
      );
    case "trophy":
      return (
        <g key={index} transform={transform} opacity={item.opacity}>
          <path
            d={`M ${-s * 0.42} ${-s * 0.54} H ${s * 0.42} V ${-s * 0.1} C ${s * 0.42} ${s * 0.28}, ${-s * 0.42} ${s * 0.28}, ${-s * 0.42} ${-s * 0.1} Z M ${-s * 0.42} ${-s * 0.38} H ${-s * 0.76} C ${-s * 0.8} ${-s * 0.08}, ${-s * 0.58} ${s * 0.08}, ${-s * 0.38} 0 M ${s * 0.42} ${-s * 0.38} H ${s * 0.76} C ${s * 0.8} ${-s * 0.08}, ${s * 0.58} ${s * 0.08}, ${s * 0.38} 0 M 0 ${s * 0.22} V ${s * 0.62} M ${-s * 0.34} ${s * 0.62} H ${s * 0.34}`}
            fill="none"
            stroke={item.color}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={0.2}
          />
        </g>
      );
    case "football-trophy":
      return (
        <g key={index} transform={transform} opacity={item.opacity}>
          <g transform={`rotate(-24 0 ${-s * 0.55})`}>
            <ellipse
              cx={0}
              cy={-s * 0.58}
              rx={s * 0.48}
              ry={s * 0.24}
              fill="none"
              stroke={item.color}
              strokeWidth={0.2}
              vectorEffect="non-scaling-stroke"
            />
            <path
              d={`M ${-s * 0.28} ${-s * 0.58} H ${s * 0.28} M 0 ${-s * 0.72} V ${-s * 0.44}`}
              stroke={item.color}
              strokeLinecap="round"
              strokeWidth={0.12}
              vectorEffect="non-scaling-stroke"
            />
          </g>
          <path
            d={`M ${-s * 0.1} ${-s * 0.32} L ${s * 0.22} ${s * 0.46} H ${-s * 0.18} L ${s * 0.06} ${-s * 0.32}`}
            fill="none"
            stroke={item.color}
            strokeLinejoin="round"
            strokeWidth={0.2}
            vectorEffect="non-scaling-stroke"
          />
          <path
            d={`M ${-s * 0.46} ${s * 0.7} H ${s * 0.5} L ${s * 0.34} ${s * 0.46} H ${-s * 0.3} Z`}
            fill="none"
            stroke={item.color}
            strokeLinejoin="round"
            strokeWidth={0.2}
            vectorEffect="non-scaling-stroke"
          />
          <path
            d={`M ${-s * 0.06} ${-s * 0.28} L ${s * 0.14} ${s * 0.4}`}
            stroke="rgba(255,255,255,0.45)"
            strokeLinecap="round"
            strokeWidth={0.12}
            vectorEffect="non-scaling-stroke"
          />
        </g>
      );
    case "yard-marker":
      return (
        <g key={index} transform={transform} opacity={item.opacity}>
          <path
            d={`M 0 ${-s * 0.72} L ${s * 0.5} ${s * 0.1} H ${s * 0.18} V ${s * 0.72} H ${-s * 0.18} V ${s * 0.1} H ${-s * 0.5} Z`}
            fill="none"
            stroke={item.color}
            strokeLinejoin="round"
            strokeWidth={0.2}
          />
          <path
            d={`M ${-s * 0.16} ${-s * 0.02} H ${s * 0.16}`}
            stroke={item.color}
            strokeLinecap="round"
            strokeWidth={0.14}
          />
        </g>
      );
    case "playbook":
      return (
        <g key={index} transform={transform} opacity={item.opacity}>
          <rect
            x={-s * 0.64}
            y={-s * 0.68}
            width={s * 1.28}
            height={s * 1.28}
            rx={s * 0.08}
            fill="none"
            stroke={item.color}
            strokeWidth={0.2}
          />
          <circle
            cx={-s * 0.28}
            cy={-s * 0.24}
            r={s * 0.08}
            fill="none"
            stroke={item.color}
            strokeWidth={0.12}
          />
          <path
            d={`M ${s * 0.16} ${-s * 0.32} L ${s * 0.38} ${-s * 0.1} M ${s * 0.38} ${-s * 0.32} L ${s * 0.16} ${-s * 0.1} M ${-s * 0.2} ${s * 0.18} C ${s * 0.06} ${s * 0.04}, ${s * 0.24} ${s * 0.18}, ${s * 0.34} ${s * 0.4}`}
            fill="none"
            stroke={item.color}
            strokeLinecap="round"
            strokeWidth={0.13}
          />
        </g>
      );
    case "cleat":
      return (
        <g key={index} transform={transform} opacity={item.opacity}>
          <path
            d={`M ${-s * 0.78} ${s * 0.12} C ${-s * 0.36} ${s * 0.06}, ${-s * 0.16} ${-s * 0.34}, ${s * 0.18} ${-s * 0.2} C ${s * 0.42} ${-s * 0.08}, ${s * 0.46} ${s * 0.12}, ${s * 0.84} ${s * 0.2} C ${s * 0.4} ${s * 0.42}, ${-s * 0.42} ${s * 0.4}, ${-s * 0.78} ${s * 0.12} Z`}
            fill={item.color}
          />
          {[-0.46, -0.12, 0.22, 0.52].map((offset) => (
            <path
              key={offset}
              d={`M ${s * offset} ${s * 0.34} V ${s * 0.52}`}
              stroke={item.color}
              strokeLinecap="round"
              strokeWidth={0.13}
            />
          ))}
        </g>
      );
    case "foam-finger":
      return (
        <g key={index} transform={transform} opacity={item.opacity}>
          <path
            d={`M ${-s * 0.28} ${s * 0.74} V ${-s * 0.22} C ${-s * 0.28} ${-s * 0.44}, ${s * 0.02} ${-s * 0.44}, ${s * 0.02} ${-s * 0.22} V ${-s * 0.82} C ${s * 0.02} ${-s * 1.02}, ${s * 0.32} ${-s * 1.02}, ${s * 0.32} ${-s * 0.82} V ${s * 0.08} L ${s * 0.58} ${-s * 0.04} C ${s * 0.76} ${-s * 0.12}, ${s * 0.9} ${s * 0.12}, ${s * 0.7} ${s * 0.24} L ${s * 0.22} ${s * 0.52} V ${s * 0.74} Z`}
            fill="none"
            stroke={item.color}
            strokeLinejoin="round"
            strokeWidth={0.2}
          />
        </g>
      );
    case "paddle-pair":
      return (
        <g key={index} transform={transform} opacity={item.opacity}>
          {[-22, 22].map((rot) => (
            <g key={rot} transform={`rotate(${rot})`}>
              <rect
                x={-s * 0.22}
                y={-s * 0.78}
                width={s * 0.44}
                height={s * 0.78}
                rx={s * 0.16}
                fill={item.color}
              />
              <rect
                x={-s * 0.08}
                y={-s * 0.08}
                width={s * 0.16}
                height={s * 0.72}
                rx={s * 0.06}
                fill={item.color}
              />
            </g>
          ))}
        </g>
      );
    case "pickleball-court":
      return (
        <g key={index} transform={transform} opacity={item.opacity}>
          <rect
            x={-s * 0.86}
            y={-s * 0.56}
            width={s * 1.72}
            height={s * 1.12}
            rx={s * 0.04}
            fill="none"
            stroke={item.color}
            strokeWidth={0.18}
          />
          <path
            d={`M 0 ${-s * 0.56} V ${s * 0.56} M ${-s * 0.86} 0 H ${s * 0.86} M ${-s * 0.32} ${-s * 0.56} V ${s * 0.56} M ${s * 0.32} ${-s * 0.56} V ${s * 0.56}`}
            stroke={item.color}
            strokeWidth={0.12}
          />
        </g>
      );
    case "serve-line":
      return (
        <g key={index} transform={transform} opacity={item.opacity}>
          <path
            d={`M ${-s} 0 H ${s}`}
            stroke={item.color}
            strokeDasharray="0.12 0.16"
            strokeLinecap="round"
            strokeWidth={0.22}
            vectorEffect="non-scaling-stroke"
          />
        </g>
      );
    case "water-bottle":
      return (
        <g key={index} transform={transform} opacity={item.opacity}>
          <path
            d={`M ${-s * 0.22} ${-s * 0.72} H ${s * 0.22} V ${-s * 0.44} L ${s * 0.36} ${-s * 0.24} V ${s * 0.62} C ${s * 0.18} ${s * 0.78}, ${-s * 0.18} ${s * 0.78}, ${-s * 0.36} ${s * 0.62} V ${-s * 0.24} L ${-s * 0.22} ${-s * 0.44} Z`}
            fill="none"
            stroke={item.color}
            strokeLinejoin="round"
            strokeWidth={0.2}
          />
          <path
            d={`M ${-s * 0.22} ${s * 0.02} H ${s * 0.22}`}
            stroke={item.color}
            strokeLinecap="round"
            strokeWidth={0.14}
          />
        </g>
      );
    case "school-building":
      return (
        <g key={index} transform={transform} opacity={item.opacity}>
          <path
            d={`M ${-s * 0.82} ${s * 0.6} H ${s * 0.82} M ${-s * 0.68} ${s * 0.6} V ${-s * 0.16} H ${s * 0.68} V ${s * 0.6} M ${-s * 0.82} ${-s * 0.16} L 0 ${-s * 0.68} L ${s * 0.82} ${-s * 0.16}`}
            fill="none"
            stroke={item.color}
            strokeLinejoin="round"
            strokeWidth={0.2}
          />
          {[-0.38, 0, 0.38].map((offset) => (
            <path
              key={offset}
              d={`M ${s * offset} ${s * 0.6} V ${s * 0.04}`}
              stroke={item.color}
              strokeWidth={0.12}
            />
          ))}
        </g>
      );
    case "scroll":
      return (
        <g key={index} transform={transform} opacity={item.opacity}>
          <path
            d={`M ${-s * 0.54} ${-s * 0.44} H ${s * 0.54} C ${s * 0.8} ${-s * 0.44}, ${s * 0.8} ${-s * 0.12}, ${s * 0.54} ${-s * 0.12} H ${-s * 0.42} V ${s * 0.44} H ${s * 0.54} C ${s * 0.8} ${s * 0.44}, ${s * 0.8} ${s * 0.76}, ${s * 0.54} ${s * 0.76} H ${-s * 0.54} C ${-s * 0.8} ${s * 0.76}, ${-s * 0.8} ${s * 0.44}, ${-s * 0.54} ${s * 0.44}`}
            fill="none"
            stroke={item.color}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={0.2}
          />
        </g>
      );
    case "laurel":
      return (
        <g key={index} transform={transform} opacity={item.opacity}>
          {[-1, 1].map((side) => (
            <g key={side} transform={`scale(${side} 1)`}>
              <path
                d={`M ${-s * 0.12} ${s * 0.72} C ${-s * 0.62} ${s * 0.14}, ${-s * 0.52} ${-s * 0.44}, ${-s * 0.08} ${-s * 0.78}`}
                fill="none"
                stroke={item.color}
                strokeLinecap="round"
                strokeWidth={0.16}
              />
              {[-0.38, -0.08, 0.22].map((offset) => (
                <ellipse
                  key={offset}
                  cx={-s * 0.36}
                  cy={s * offset}
                  rx={s * 0.11}
                  ry={s * 0.24}
                  fill={item.color}
                  transform={`rotate(-42 ${-s * 0.36} ${s * offset})`}
                />
              ))}
            </g>
          ))}
        </g>
      );
    case "stained-glass":
      return (
        <g key={index} transform={transform} opacity={item.opacity}>
          <path
            d={`M ${-s * 0.58} ${s * 0.72} V ${-s * 0.08} C ${-s * 0.58} ${-s * 0.76}, ${s * 0.58} ${-s * 0.76}, ${s * 0.58} ${-s * 0.08} V ${s * 0.72} Z`}
            fill="none"
            stroke={item.color}
            strokeWidth={0.22}
          />
          <path
            d={`M 0 ${-s * 0.58} V ${s * 0.72} M ${-s * 0.58} ${-s * 0.02} H ${s * 0.58} M ${-s * 0.58} ${s * 0.34} H ${s * 0.58}`}
            stroke={item.color}
            strokeWidth={0.12}
          />
        </g>
      );
    case "olive-branch":
      return (
        <g key={index} transform={transform} opacity={item.opacity}>
          <path
            d={`M ${-s * 0.62} ${s * 0.62} C ${-s * 0.24} ${s * 0.12}, ${s * 0.24} ${-s * 0.18}, ${s * 0.62} ${-s * 0.62}`}
            fill="none"
            stroke={item.color}
            strokeLinecap="round"
            strokeWidth={0.18}
          />
          {[-0.38, -0.1, 0.18, 0.44].map((offset, i) => (
            <ellipse
              key={offset}
              cx={s * offset}
              cy={-s * offset * 0.8}
              rx={s * 0.12}
              ry={s * 0.24}
              fill={item.color}
              transform={`rotate(${i % 2 ? 42 : -42} ${s * offset} ${-s * offset * 0.8})`}
            />
          ))}
        </g>
      );
    case "lantern":
      return (
        <g key={index} transform={transform} opacity={item.opacity}>
          <path
            d={`M ${-s * 0.38} ${-s * 0.4} C ${-s * 0.38} ${-s * 0.76}, ${s * 0.38} ${-s * 0.76}, ${s * 0.38} ${-s * 0.4} M ${-s * 0.42} ${-s * 0.34} H ${s * 0.42} V ${s * 0.52} H ${-s * 0.42} Z M ${-s * 0.24} ${s * 0.52} H ${s * 0.24}`}
            fill="none"
            stroke={item.color}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={0.2}
          />
          <path
            d={`M 0 ${-s * 0.1} C ${-s * 0.18} ${s * 0.12}, ${s * 0.18} ${s * 0.12}, 0 ${s * 0.32} C ${s * 0.22} ${s * 0.1}, ${s * 0.08} ${-s * 0.08}, 0 ${-s * 0.1} Z`}
            fill={item.color}
          />
        </g>
      );
    case "map-pin":
      return (
        <g key={index} transform={transform} opacity={item.opacity}>
          <path
            d={`M 0 ${s * 0.82} C ${-s * 0.58} ${s * 0.1}, ${-s * 0.5} ${-s * 0.68}, 0 ${-s * 0.68} C ${s * 0.5} ${-s * 0.68}, ${s * 0.58} ${s * 0.1}, 0 ${s * 0.82} Z`}
            fill="none"
            stroke={item.color}
            strokeWidth={0.22}
          />
          <circle cx={0} cy={-s * 0.16} r={s * 0.16} fill={item.color} />
        </g>
      );
    case "announcement-card":
      return (
        <g key={index} transform={transform} opacity={item.opacity}>
          <rect
            x={-s * 0.72}
            y={-s * 0.5}
            width={s * 1.44}
            height={s}
            rx={s * 0.08}
            fill="none"
            stroke={item.color}
            strokeWidth={0.22}
          />
          <path
            d={`M ${-s * 0.42} ${-s * 0.18} H ${s * 0.42} M ${-s * 0.42} ${s * 0.08} H ${s * 0.28} M ${-s * 0.42} ${s * 0.32} H ${s * 0.12}`}
            stroke={item.color}
            strokeLinecap="round"
            strokeWidth={0.14}
          />
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
  sportKind,
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
        sportKind,
        palette,
      }),
    [background, category, palette, skinId, sportKind, title],
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
        preserveAspectRatio="xMidYMid slice"
      >
        {items.map(renderMotif)}
      </svg>
    </div>
  );
}
