"use client";

import { useId } from "react";

type IllustrationProps = {
  className?: string;
  title?: string;
};

function cx(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(" ");
}

export function ScanIllustration({
  className,
  title = "Camera scanning an invite",
}: IllustrationProps) {
  const id = useId();
  const bg = `${id}-bg`;
  const tile = `${id}-tile`;
  const accent = `${id}-accent`;
  const ring = `${id}-ring`;
  const glyph = `${id}-glyph`;

  return (
    <svg
      viewBox="0 0 180 140"
      role="img"
      aria-labelledby={`${id}-title`}
      className={cx("h-auto w-full max-w-[180px]", className)}
    >
      <title id={`${id}-title`}>{title}</title>
      <defs>
        <linearGradient id={bg} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F9F1EC" />
          <stop offset="100%" stopColor="#ECE3DE" />
        </linearGradient>
        <linearGradient id={tile} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#A6BCCD" />
          <stop offset="100%" stopColor="#D1DCE5" />
        </linearGradient>
        <linearGradient id={accent} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#B6C7D7" stopOpacity="0.35" />
        </linearGradient>
        <radialGradient id={ring} cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
        <linearGradient id={glyph} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(32,32,32,0.68)" />
          <stop offset="100%" stopColor="rgba(32,32,32,0.35)" />
        </linearGradient>
      </defs>

      <rect x="6" y="8" width="168" height="124" rx="32" fill={`url(#${bg})`} />
      <rect
        x="22"
        y="20"
        width="136"
        height="100"
        rx="28"
        fill={`url(#${tile})`}
        stroke="rgba(255,255,255,0.65)"
        strokeWidth="2"
      />
      <circle cx="90" cy="70" r="58" fill={`url(#${ring})`} opacity="0.35" />
      <circle
        cx="90"
        cy="70"
        r="42"
        fill="none"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="1.5"
        strokeDasharray="6 8"
      />
      <rect
        x="48"
        y="48"
        width="84"
        height="48"
        rx="18"
        fill="rgba(255,255,255,0.15)"
        stroke="rgba(255,255,255,0.65)"
        strokeWidth="2"
      />
      <rect
        x="60"
        y="36"
        width="60"
        height="10"
        rx="5"
        fill="rgba(255,255,255,0.25)"
      />
      <rect x="70" y="58" width="40" height="4" rx="2" fill="rgba(255,255,255,0.7)" />
      <rect x="64" y="66" width="52" height="4" rx="2" fill="rgba(255,255,255,0.55)" />
      <circle
        cx="90"
        cy="72"
        r="19"
        fill="rgba(255,255,255,0.12)"
        stroke="rgba(255,255,255,0.7)"
        strokeWidth="2"
      />
      <circle cx="90" cy="72" r="12" fill={`url(#${accent})`} />
      <path
        d="M90 62c5 0 9 4.1 9 9.2a1 1 0 01-1 1H82a1 1 0 01-1-1c0-5.1 4.1-9.2 9-9.2z"
        fill="none"
        stroke={`url(#${glyph})`}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="90" cy="73" r="6" fill={`url(#${glyph})`} opacity="0.3" />
      <rect x="44" y="78" width="20" height="12" rx="6" fill="rgba(255,255,255,0.5)" />
      <rect x="116" y="78" width="20" height="12" rx="6" fill="rgba(255,255,255,0.5)" />
    </svg>
  );
}


export function UploadIllustration({
  className,
  title = "Upload invite screenshot",
}: IllustrationProps) {
  const id = useId();
  const bg = `${id}-bg`;
  const tile = `${id}-tile`;
  const cloud = `${id}-cloud`;
  const accents = `${id}-accents`;

  return (
    <svg
      viewBox="0 0 180 140"
      role="img"
      aria-labelledby={`${id}-title`}
      className={cx("h-auto w-full max-w-[180px]", className)}
    >
      <title id={`${id}-title`}>{title}</title>
      <defs>
        <linearGradient id={bg} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FBF4FF" />
          <stop offset="100%" stopColor="#F3F5FF" />
        </linearGradient>
        <linearGradient id={tile} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#CCBFF4" />
          <stop offset="100%" stopColor="#E4DAFF" />
        </linearGradient>
        <linearGradient id={cloud} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F0E9FF" />
          <stop offset="100%" stopColor="#C9B9F3" />
        </linearGradient>
        <linearGradient id={accents} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#D7CBFF" />
        </linearGradient>
      </defs>

      <rect x="6" y="8" width="168" height="124" rx="32" fill={`url(#${bg})`} />
      <rect
        x="22"
        y="20"
        width="136"
        height="100"
        rx="28"
        fill={`url(#${tile})`}
        stroke="rgba(255,255,255,0.65)"
        strokeWidth="2"
      />
      <circle
        cx="90"
        cy="70"
        r="40"
        fill="none"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="1.5"
        strokeDasharray="4 10"
      />
      <path
        d="M54 84c0-12 9.5-20 22-20 3.8 0 7.4 0.7 10.6 2 4.7-7.4 12.7-12 22.4-12 14 0 25 11 25 25s-11 25-25 25H70c-8.8 0-16-8-16-20z"
        fill={`url(#${cloud})`}
        opacity="0.9"
      />
      <path d="M90 93V69" stroke={`url(#${accents})`} strokeWidth="5" strokeLinecap="round" />
      <path
        d="M78 80l12-12 12 12"
        stroke={`url(#${accents})`}
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="38" y="40" width="104" height="16" rx="8" fill="rgba(255,255,255,0.22)" />
      <rect x="38" y="58" width="70" height="10" rx="5" fill="rgba(255,255,255,0.18)" />
    </svg>
  );
}


export function CreateEventIllustration({
  className,
  title = "Create Event UI",
}: IllustrationProps) {
  const id = useId();
  const bg = `${id}-bg`;
  const tile = `${id}-tile`;
  const accent = `${id}-accent`;
  const stroke = `${id}-stroke`;

  return (
    <svg
      viewBox="0 0 180 140"
      role="img"
      aria-labelledby={`${id}-title`}
      className={cx("h-auto w-full max-w-[180px]", className)}
    >
      <title id={`${id}-title`}>{title}</title>
      <defs>
        <linearGradient id={bg} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF5F8" />
          <stop offset="100%" stopColor="#FFF0F4" />
        </linearGradient>
        <linearGradient id={tile} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F5C0D3" />
          <stop offset="100%" stopColor="#FFDDE8" />
        </linearGradient>
        <linearGradient id={accent} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#FFE4EE" />
        </linearGradient>
        <linearGradient id={stroke} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#FFC3D7" />
        </linearGradient>
      </defs>

      <rect x="6" y="8" width="168" height="124" rx="32" fill={`url(#${bg})`} />
      <rect
        x="22"
        y="20"
        width="136"
        height="100"
        rx="28"
        fill={`url(#${tile})`}
        stroke="rgba(255,255,255,0.65)"
        strokeWidth="2"
      />
      <path d="M40 44h100" stroke="rgba(255,255,255,0.5)" strokeLinecap="round" />
      <rect x="40" y="52" width="52" height="12" rx="6" fill="rgba(255,255,255,0.25)" />
      <rect x="40" y="70" width="84" height="8" rx="4" fill="rgba(255,255,255,0.35)" />
      <rect x="40" y="86" width="68" height="8" rx="4" fill="rgba(255,255,255,0.3)" />
      <rect x="40" y="102" width="54" height="8" rx="4" fill="rgba(255,255,255,0.25)" />
      <rect
        x="108"
        y="64"
        width="30"
        height="30"
        rx="12"
        fill="rgba(255,255,255,0.18)"
        stroke="rgba(255,255,255,0.65)"
        strokeWidth="2"
      />
      <path d="M101 58l-8 8" stroke={`url(#${stroke})`} strokeWidth="3" strokeLinecap="round" />
      <path d="M68 96c18-10 32-26 42-46" stroke={`url(#${stroke})`} strokeWidth="2.5" strokeLinecap="round" />
      <rect x="120" y="90" width="28" height="12" rx="6" fill="rgba(255,255,255,0.28)" />
    </svg>
  );
}


export function SignUpIllustration({
  className,
  title = "Smart sign-up form",
}: IllustrationProps) {
  const id = useId();
  const bg = `${id}-bg`;
  const tile = `${id}-tile`;
  const accent = `${id}-accent`;
  const check = `${id}-check`;

  return (
    <svg
      viewBox="0 0 180 140"
      role="img"
      aria-labelledby={`${id}-title`}
      className={cx("h-auto w-full max-w-[180px]", className)}
    >
      <title id={`${id}-title`}>{title}</title>
      <defs>
        <linearGradient id={bg} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F5FFF8" />
          <stop offset="100%" stopColor="#F0FBF3" />
        </linearGradient>
        <linearGradient id={tile} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C7EEDB" />
          <stop offset="100%" stopColor="#E3F8EF" />
        </linearGradient>
        <linearGradient id={accent} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#D9F6E6" />
        </linearGradient>
        <linearGradient id={check} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#43D69F" />
          <stop offset="100%" stopColor="#1AA46F" />
        </linearGradient>
      </defs>

      <rect x="6" y="8" width="168" height="124" rx="32" fill={`url(#${bg})`} />
      <rect
        x="22"
        y="20"
        width="136"
        height="100"
        rx="28"
        fill={`url(#${tile})`}
        stroke="rgba(255,255,255,0.65)"
        strokeWidth="2"
      />
      <rect
        x="38"
        y="36"
        width="104"
        height="68"
        rx="16"
        fill="rgba(255,255,255,0.75)"
        stroke="rgba(255,255,255,0.5)"
        strokeWidth="1.5"
      />
      <rect x="50" y="46" width="64" height="8" rx="4" fill="rgba(0,0,0,0.05)" />
      <rect x="50" y="60" width="72" height="8" rx="4" fill="rgba(0,0,0,0.04)" />
      <rect x="50" y="74" width="58" height="8" rx="4" fill="rgba(0,0,0,0.03)" />
      <rect x="50" y="88" width="70" height="8" rx="4" fill="rgba(0,0,0,0.03)" />
      <circle
        cx="122"
        cy="92"
        r="20"
        fill="rgba(255,255,255,0.35)"
        stroke="rgba(255,255,255,0.7)"
        strokeWidth="2"
      />
      <circle cx="122" cy="92" r="13" fill={`url(#${accent})`} />
      <path
        d="M116 92l4 4 8-10"
        fill="none"
        stroke={`url(#${check})`}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="40" y="110" width="100" height="10" rx="5" fill="rgba(255,255,255,0.3)" />
    </svg>
  );
}
