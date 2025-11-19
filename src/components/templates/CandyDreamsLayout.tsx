"use client";

import type { ReactNode, CSSProperties } from "react";
import styles from "./CandyDreamsLayout.module.css";

type CandyDreamsPalette = {
  bgGradientFrom: string;
  bgGradientTo: string;
  cardBg: string;
  primary: string;
  accent: string;
  sprinkleColors: string[];
};

type Props = {
  palette: CandyDreamsPalette;
  children: ReactNode;
};

const hexToRgba = (hex: string, alpha: number) => {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) return hex;
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export function CandyDreamsLayout({ palette, children }: Props) {
  const sprinkleBackground = palette.sprinkleColors
    .map((color) => `radial-gradient(circle, ${color} 2px, transparent 2px)`)
    .join(", ");

  const borderStyle: CSSProperties = {
    backgroundImage: sprinkleBackground,
    WebkitMask:
      "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
    mask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
    WebkitMaskComposite: "xor",
    maskComposite: "exclude",
    borderColor: hexToRgba(palette.primary, 0.35),
  };

  return (
    <main
      className="min-h-screen bg-gradient-to-br from-transparent to-transparent flex items-center justify-center px-4 py-10"
      style={{
        backgroundImage: `linear-gradient(135deg, ${palette.bgGradientFrom}, ${palette.bgGradientTo})`,
      }}
    >
      <div
        className="relative max-w-3xl w-full rounded-[32px] shadow-[0_20px_40px_rgba(0,0,0,0.06)] p-[3rem] overflow-hidden"
        style={{
          backgroundColor: palette.cardBg,
          boxShadow: `0 20px 40px ${hexToRgba(palette.accent, 0.22)}`,
          border: `1px solid ${hexToRgba(palette.primary, 0.18)}`,
        }}
      >
        <div className={styles.wrapper}>
          <div
            className={styles.border}
            style={{
              ...borderStyle,
            }}
          />
        </div>
        <div className="relative z-10">{children}</div>
      </div>
    </main>
  );
}

