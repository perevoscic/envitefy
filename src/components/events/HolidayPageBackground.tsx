"use client";

import { type CSSProperties, type HTMLAttributes, useId } from "react";
import { holidayBackgroundStyle } from "@/lib/holiday-background-style";
import {
  getHolidayBackground,
  getHolidayBackgroundChoice,
  getHolidayBackgrounds,
  type HolidayBackgroundChoice,
  type HolidayBackgroundPreset,
} from "@/lib/holiday-backgrounds";
import styles from "./holiday-page-background.module.css";

const symbols: Record<string, string> = {
  stars: "✦", community: "◯", ribbons: "⋈", poppies: "✿", bunting: "▾",
  wheat: "❧", evergreen: "", confetti: "✧", hearts: "♡", clovers: "♧",
  flowers: "❀", leaves: "❧", ghosts: "", pumpkins: "", lanterns: "",
  candles: "", geometric: "◇", crescent: "☾", rangoli: "✺", sun: "☀",
  corn: "", books: "", graduation: "",
  bats: "", webs: "", cats: "", "witch-hat": "", skulls: "", candy: "",
  branches: "", keys: "", bottles: "", windows: "", snowflakes: "❄",
  ornaments: "", gifts: "", bells: "", berries: "", eggs: "", butterflies: "",
  fireworks: "✺", balloons: "", kites: "", waves: "", fruit: "",
};

/** Inert decoration stays at the page edges, beneath the original artwork and copy. */
export function HolidayBackgroundDecoration({
  background,
  compact = false,
}: {
  background: HolidayBackgroundPreset;
  compact?: boolean;
}) {
  const hasMotifs = background.motif !== "none" && background.treatment !== "plain";
  const hasMaterial = background.material && background.material !== "plain";
  // New quiet papers can frame the page without adding symbols or texture.
  // Legacy recipes without a material field retain their original appearance.
  const hasComposition = background.material !== undefined && background.treatment !== "plain";
  if (!hasMotifs && !hasMaterial && !hasComposition) return null;
  return (
    <div
      className={styles.decoration}
      data-holiday-treatment={background.treatment}
      data-holiday-material={background.material}
      data-holiday-motif={background.motif}
      data-holiday-compact={compact || undefined}
      aria-hidden="true"
      style={holidayBackgroundStyle(background)}
    >
      {hasMaterial && <span className={styles.material} />}
      {hasMotifs && ["start", "end", "lowerStart", "lowerEnd"].map((position) => (
        <span key={position} className={styles.cluster} data-position={position}>
          {[0, 1, 2].map((index) => (
            <span key={index} className={styles.mark} data-motif={background.motif}
              style={{ "--mark-index": index } as CSSProperties}>
              {symbols[background.motif] || ""}
            </span>
          ))}
        </span>
      ))}
    </div>
  );
}

export default function HolidayPageBackground({
  background,
  children,
  className = "",
  style,
  ...props
}: HTMLAttributes<HTMLDivElement> & { background?: HolidayBackgroundPreset }) {
  if (!background && !className && !style && Object.keys(props).length === 0) return <>{children}</>;
  return (
    <div {...props} className={`${background ? styles.page : ""} ${className}`}
      data-holiday-background={background?.id}
      style={{ ...(background ? holidayBackgroundStyle(background) : {}), ...style }}>
      {background && <HolidayBackgroundDecoration background={background} />}
      {background ? <div className={styles.content}>{children}</div> : children}
    </div>
  );
}

export function HolidayBackgroundPicker({
  designId,
  value,
  onChange,
}: {
  designId: string;
  value?: HolidayBackgroundChoice;
  onChange: (value?: HolidayBackgroundChoice) => void;
}) {
  const id = useId();
  const recommended = getHolidayBackground(designId);
  const options = getHolidayBackgrounds(recommended?.occasion);
  if (!recommended || !options.length) return null;
  return (
    <fieldset className={styles.picker}>
      <legend className={styles.legend}>Choose a background</legend>
      <p className={styles.help}>{options.length} backgrounds with coordinated colors, textures and details.</p>
      {!value && <p className={styles.help}>Your saved background stays until you choose an option.</p>}
      <div className={styles.options}>
        {options.map((background) => (
          <label key={background.id} className={styles.option}>
            <input type="radio" name={`${id}-background`} aria-label={background.name} value={background.id}
              checked={value?.presetId === background.id}
              onChange={() => onChange(getHolidayBackgroundChoice(background.id, background.id === recommended.id ? "template" : "custom"))} />
            <span className={styles.tile} style={holidayBackgroundStyle(background)}>
              <HolidayBackgroundDecoration background={background} compact />
              <span className={styles.sample} style={{ backgroundColor: background.page, color: background.ink }}>
                <span style={{ color: background.accent }}>Aa</span>
                <span className={styles.sampleLine} />
                <span className={styles.sampleLine} />
              </span>
              <span className={styles.selected} aria-hidden="true">✓</span>
            </span>
            <span className={styles.name}>{background.name}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
