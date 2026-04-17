"use client";

import { motion } from "framer-motion";
import type { CSSProperties } from "react";
import type { StudioCategoryTileDefinition } from "../studio-workspace-types";

type StudioCategoryTileProps = {
  category: StudioCategoryTileDefinition;
  index: number;
  active: boolean;
  onSelect: (categoryName: StudioCategoryTileDefinition["name"]) => void;
};

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");
  const sanitized =
    normalized.length === 3
      ? normalized
          .split("")
          .map((part) => `${part}${part}`)
          .join("")
      : normalized;
  const value = Number.parseInt(sanitized, 16);
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

const overlayClassByStrength = {
  light: "bg-gradient-to-t from-black/72 via-black/24 to-transparent",
  medium: "bg-gradient-to-t from-black/80 via-black/34 to-transparent",
  dark: "bg-gradient-to-t from-black/88 via-black/54 to-black/18",
} as const;

function buildTileStyle(category: StudioCategoryTileDefinition, active: boolean): CSSProperties {
  const accent = category.themeColor;
  if (active) {
    return {
      borderColor: hexToRgba(accent, 0.8),
      boxShadow: `0 26px 58px -30px ${hexToRgba(accent, 0.62)}, 0 0 0 1px ${hexToRgba(
        accent,
        0.3,
      )}, inset 0 1px 0 rgba(255,255,255,0.82)`,
    };
  }

  return {
    boxShadow:
      category.surfaceVariant === "dark"
        ? "0 20px 48px -30px rgba(19,14,32,0.58), inset 0 1px 0 rgba(255,255,255,0.08)"
        : "0 18px 42px -28px rgba(84,61,140,0.22), inset 0 1px 0 rgba(255,255,255,0.92)",
  };
}

export function StudioCategoryTile({
  category,
  index,
  active,
  onSelect,
}: StudioCategoryTileProps) {
  const descriptionId = `studio-category-${category.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-description`;

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 + 0.2 }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={() => onSelect(category.name)}
      aria-pressed={active}
      aria-describedby={descriptionId}
      aria-label={`Select ${category.name}`}
      style={buildTileStyle(category, active)}
      className={`group relative isolate h-full w-full cursor-pointer overflow-hidden rounded-[2rem] border text-left transition-all duration-500 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#cbb7ff]/55 ${
        category.surfaceVariant === "dark"
          ? "border-white/12 bg-[#20192d]"
          : "border-white/70 bg-white/88"
      } ${
        active
          ? "ring-2 ring-[#8B5CF6] ring-offset-4 ring-offset-[#faf7ff]"
          : "hover:shadow-2xl hover:shadow-purple-500/10"
      }`}
    >
      <div className="absolute inset-0">
        <img
          src={category.imagePath}
          alt=""
          aria-hidden="true"
          className={`h-full w-full object-cover transition-transform duration-700 group-hover:scale-110 ${
            category.imagePositionClassName || "object-center"
          }`}
        />
        <div className={`absolute inset-0 ${overlayClassByStrength[category.overlayStrength]}`} />
      </div>

      <div className="absolute inset-0 flex flex-col justify-between p-8">
        <div />

        <div className="flex items-end justify-between gap-4">
          <div className="max-w-[280px] space-y-2">
            <p
              className="font-[var(--font-josefin-sans)] text-[1rem] font-bold uppercase tracking-[0.13em] leading-none !text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.3)] sm:text-[1.08rem] lg:text-[1.16rem]"
            >
              {category.name}
            </p>
            <p
              id={descriptionId}
              className="hidden max-w-[280px] text-sm leading-relaxed text-white/80 sm:block"
            >
              {category.description}
            </p>
          </div>
        </div>
      </div>

      {active ? (
        <div className="pointer-events-none absolute inset-0 rounded-[2rem] border-4 border-[#8B5CF6]/30" />
      ) : null}
    </motion.button>
  );
}
