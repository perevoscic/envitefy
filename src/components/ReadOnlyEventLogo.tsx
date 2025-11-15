"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useTheme } from "@/app/providers";

const DEFAULT_THRESHOLD = 0.55;

function parseColor(color: string): [number, number, number] | null {
  const trimmed = color.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("#")) {
    const hex = trimmed.slice(1);
    if (hex.length === 3) {
      const r = parseInt(hex[0] + hex[0], 16);
      const g = parseInt(hex[1] + hex[1], 16);
      const b = parseInt(hex[2] + hex[2], 16);
      return [r, g, b];
    }
    if (hex.length === 6) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return [r, g, b];
    }
    return null;
  }
  const rgbMatch = trimmed.match(
    /rgba?\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*(0|0?\.\d+|1(\.0+)?))?\s*\)/
  );
  if (!rgbMatch) return null;
  const [, r, g, b] = rgbMatch;
  return [Number(r), Number(g), Number(b)];
}

function relativeLuminance(r: number, g: number, b: number): number {
  const normalize = (value: number) => value / 255;
  const linearize = (value: number) =>
    value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
  const [lr, lg, lb] = [r, g, b].map((component) =>
    linearize(normalize(component))
  );
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
}

export default function ReadOnlyEventLogo() {
  const { theme } = useTheme();
  const [useLightVariant, setUseLightVariant] = useState<boolean>(
    () => theme === "dark"
  );

  useEffect(() => {
    if (typeof document === "undefined") return;
    let shouldUseLight = theme === "dark";
    try {
      const root = document.documentElement;
      const background = getComputedStyle(root)
        .getPropertyValue("--background")
        .trim();
      const parsed = parseColor(background);
      if (parsed) {
        const luminance = relativeLuminance(...parsed);
        shouldUseLight = luminance < DEFAULT_THRESHOLD;
      }
    } catch {
      // ignore parsing errors and fall back to theme variant
    }
    setUseLightVariant(shouldUseLight);
  }, [theme]);

  return (
    <div className="mb-6 flex justify-center">
      <Link
        href="/"
        aria-label="Envitefy home"
        className="inline-flex items-center gap-2 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 overflow-visible"
      >
        <Image
          src="/E.png"
          alt="E"
          width={48}
          height={48}
          className="h-12 w-12"
          quality={100}
          unoptimized
        />
        <span
          className="text-3xl leading-relaxed overflow-visible"
          style={{
            fontFamily: '"Venturis ADF", "Venturis ADF Fallback", serif',
            background: "linear-gradient(180deg, #d4ae51 0%, #9a7b2f 100%)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            lineHeight: "1.2",
            display: "inline-block",
            paddingBottom: "0.1em",
          }}
        >
          nvitefy
        </span>
      </Link>
    </div>
  );
}
