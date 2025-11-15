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
  const outer = `${id}-scan-outer`;
  const middle = `${id}-scan-middle`;
  const inner = `${id}-scan-inner`;
  const accent = `${id}-scan-accent`;
  const lens = `${id}-scan-lens`;
  const glow = `${id}-scan-glow`;
  const shadow = `${id}-scan-shadow`;

  return (
    <svg
      viewBox="0 0 160 160"
      role="img"
      aria-labelledby={`${id}-title`}
      className={cx("h-auto w-full max-w-[180px]", className)}
    >
      <title id={`${id}-title`}>{title}</title>
      <defs>
        <linearGradient id={outer} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#B9E6FF" />
          <stop offset="100%" stopColor="#83D7F2" />
        </linearGradient>
        <linearGradient id={middle} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F2FBFF" />
          <stop offset="100%" stopColor="#D8F3FF" />
        </linearGradient>
        <linearGradient id={inner} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#EBF6FF" />
        </linearGradient>
        <linearGradient id={accent} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#41B9FF" />
          <stop offset="100%" stopColor="#545CE5" />
        </linearGradient>
        <linearGradient id={lens} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E9FBFF" />
          <stop offset="100%" stopColor="#C5E2FF" />
        </linearGradient>
        <radialGradient id={glow} cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="rgba(111,186,255,0.55)" />
          <stop offset="100%" stopColor="rgba(111,186,255,0)" />
        </radialGradient>
        <filter id={shadow} x="-25%" y="-25%" width="150%" height="160%">
          <feDropShadow dx="0" dy="20" stdDeviation="18" floodColor="#4C7EA8" floodOpacity="0.22" />
        </filter>
      </defs>
      <g filter={`url(#${shadow})`}>
        <rect x="14" y="14" width="132" height="132" rx="36" fill={`url(#${outer})`} />
        <rect x="26" y="26" width="108" height="108" rx="30" fill={`url(#${middle})`} />
        <rect
          x="40"
          y="40"
          width="80"
          height="80"
          rx="24"
          fill={`url(#${inner})`}
          stroke="rgba(255,255,255,0.85)"
          strokeWidth="1.2"
        />
      </g>
      <circle cx="80" cy="80" r="36" fill={`url(#${glow})`} />
      <rect
        x="48"
        y="60"
        width="64"
        height="44"
        rx="16"
        fill="rgba(255,255,255,0.88)"
        stroke="rgba(123,159,208,0.4)"
        strokeWidth="1.5"
      />
      <rect
        x="60"
        y="50"
        width="40"
        height="14"
        rx="7"
        fill="rgba(255,255,255,0.9)"
        stroke="rgba(167,205,244,0.65)"
        strokeWidth="1"
      />
      <circle cx="106" cy="56" r="4" fill="#FF8DA1" />
      <circle
        cx="80"
        cy="80"
        r="15"
        fill={`url(#${lens})`}
        stroke="rgba(104,139,210,0.45)"
        strokeWidth="2"
      />
      <circle cx="80" cy="80" r="7" fill={`url(#${accent})`} />
      <circle cx="80" cy="80" r="3.5" fill="rgba(255,255,255,0.9)" />
      <path
        d="M56 78h8m36 0h8"
        stroke="rgba(86,122,177,0.35)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M62 94h36"
        stroke="rgba(125,156,196,0.35)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M52 64l-6-4M108 64l6-4M108 100l6 4M52 100l-6 4"
        stroke="rgba(255,255,255,0.45)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="52" cy="118" r="4" fill="rgba(255,255,255,0.7)" />
      <circle cx="108" cy="118" r="4" fill="rgba(255,255,255,0.55)" />
    </svg>
  );
}

export function UploadIllustration({
  className,
  title = "Upload an invite image",
}: IllustrationProps) {
  const id = useId();
  const outer = `${id}-upload-outer`;
  const middle = `${id}-upload-middle`;
  const inner = `${id}-upload-inner`;
  const accent = `${id}-upload-accent`;
  const arrow = `${id}-upload-arrow`;
  const spark = `${id}-upload-spark`;
  const shadow = `${id}-upload-shadow`;

  return (
    <svg
      viewBox="0 0 160 160"
      role="img"
      aria-labelledby={`${id}-title`}
      className={cx("h-auto w-full max-w-[180px]", className)}
    >
      <title id={`${id}-title`}>{title}</title>
      <defs>
        <linearGradient id={outer} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E3DEFF" />
          <stop offset="100%" stopColor="#C2CBFF" />
        </linearGradient>
        <linearGradient id={middle} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F7F4FF" />
          <stop offset="100%" stopColor="#E4DEFF" />
        </linearGradient>
        <linearGradient id={inner} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F0EDFF" />
        </linearGradient>
        <linearGradient id={accent} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#B5B2FF" />
          <stop offset="100%" stopColor="#8B90F7" />
        </linearGradient>
        <linearGradient id={arrow} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#CBB6FF" />
          <stop offset="100%" stopColor="#8C84FF" />
        </linearGradient>
        <radialGradient id={spark} cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="rgba(178,170,255,0.35)" />
          <stop offset="100%" stopColor="rgba(178,170,255,0)" />
        </radialGradient>
        <filter id={shadow} x="-25%" y="-25%" width="150%" height="160%">
          <feDropShadow dx="0" dy="20" stdDeviation="18" floodColor="#7E7CC2" floodOpacity="0.2" />
        </filter>
      </defs>
      <g filter={`url(#${shadow})`}>
        <rect x="14" y="14" width="132" height="132" rx="36" fill={`url(#${outer})`} />
        <rect x="26" y="26" width="108" height="108" rx="30" fill={`url(#${middle})`} />
        <rect
          x="40"
          y="40"
          width="80"
          height="80"
          rx="24"
          fill={`url(#${inner})`}
          stroke="rgba(255,255,255,0.85)"
          strokeWidth="1.2"
        />
      </g>
      <rect x="50" y="90" width="60" height="22" rx="11" fill={`url(#${accent})`} opacity="0.8" />
      <rect
        x="54"
        y="62"
        width="52"
        height="8"
        rx="4"
        fill="rgba(138,132,230,0.26)"
      />
      <rect x="54" y="76" width="60" height="8" rx="4" fill="rgba(138,132,230,0.18)" />
      <rect x="54" y="104" width="52" height="6" rx="3" fill="rgba(255,255,255,0.45)" />
      <path
        d="M80 46l-16 18h10v26h12V64h10z"
        fill={`url(#${arrow})`}
        opacity="0.95"
      />
      <circle cx="80" cy="54" r="6" fill="rgba(255,255,255,0.65)" />
      <circle cx="108" cy="60" r="12" fill={`url(#${spark})`} />
      <circle cx="108" cy="60" r="5" fill="rgba(255,255,255,0.85)" />
      <circle cx="56" cy="56" r="4" fill="rgba(255,255,255,0.7)" />
      <circle cx="120" cy="108" r="5" fill="rgba(146,140,233,0.4)" />
    </svg>
  );
}

export function CreateEventIllustration({
  className,
  title = "Create an event manually",
}: IllustrationProps) {
  const id = useId();
  const outer = `${id}-create-outer`;
  const middle = `${id}-create-middle`;
  const inner = `${id}-create-inner`;
  const accent = `${id}-create-accent`;
  const pencil = `${id}-create-pencil`;
  const glow = `${id}-create-glow`;
  const shadow = `${id}-create-shadow`;

  return (
    <svg
      viewBox="0 0 160 160"
      role="img"
      aria-labelledby={`${id}-title`}
      className={cx("h-auto w-full max-w-[180px]", className)}
    >
      <title id={`${id}-title`}>{title}</title>
      <defs>
        <linearGradient id={outer} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFE3E3" />
          <stop offset="100%" stopColor="#F8C2C7" />
        </linearGradient>
        <linearGradient id={middle} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF6F5" />
          <stop offset="100%" stopColor="#FFE2E5" />
        </linearGradient>
        <linearGradient id={inner} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#FFECEF" />
        </linearGradient>
        <linearGradient id={accent} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFB5C0" />
          <stop offset="100%" stopColor="#FF7E97" />
        </linearGradient>
        <linearGradient id={pencil} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFD0B2" />
          <stop offset="100%" stopColor="#FFA07A" />
        </linearGradient>
        <radialGradient id={glow} cx="60%" cy="30%" r="70%">
          <stop offset="0%" stopColor="rgba(255,182,193,0.45)" />
          <stop offset="100%" stopColor="rgba(255,182,193,0)" />
        </radialGradient>
        <filter id={shadow} x="-25%" y="-25%" width="150%" height="160%">
          <feDropShadow dx="0" dy="20" stdDeviation="18" floodColor="#D87B84" floodOpacity="0.22" />
        </filter>
      </defs>
      <g filter={`url(#${shadow})`}>
        <rect x="14" y="14" width="132" height="132" rx="36" fill={`url(#${outer})`} />
        <rect x="26" y="26" width="108" height="108" rx="30" fill={`url(#${middle})`} />
        <rect
          x="40"
          y="40"
          width="80"
          height="80"
          rx="24"
          fill={`url(#${inner})`}
          stroke="rgba(255,255,255,0.85)"
          strokeWidth="1.2"
        />
      </g>
      <circle cx="95" cy="50" r="18" fill={`url(#${glow})`} />
      <rect x="50" y="62" width="60" height="10" rx="5" fill="rgba(255,170,180,0.35)" />
      <rect x="50" y="80" width="50" height="8" rx="4" fill="rgba(0,0,0,0.05)" />
      <rect x="50" y="94" width="58" height="8" rx="4" fill="rgba(0,0,0,0.04)" />
      <rect x="50" y="108" width="48" height="8" rx="4" fill="rgba(0,0,0,0.03)" />
      <path
        d="M92 56l24 24-32 32-18 4 4-18z"
        fill={`url(#${pencil})`}
      />
      <path d="M80 108l6 6" stroke="#E36E6E" strokeWidth="2.5" strokeLinecap="round" />
      <path
        d="M110 76l6 6"
        stroke="#FFD7CB"
        strokeWidth="6"
        strokeLinecap="round"
        opacity="0.7"
      />
      <circle cx="116" cy="52" r="5" fill="rgba(255,255,255,0.8)" />
      <circle cx="56" cy="52" r="5" fill="rgba(255,255,255,0.65)" />
    </svg>
  );
}

export function SignUpIllustration({
  className,
  title = "Create a sign-up form",
}: IllustrationProps) {
  const id = useId();
  const outer = `${id}-signup-outer`;
  const middle = `${id}-signup-middle`;
  const inner = `${id}-signup-inner`;
  const accent = `${id}-signup-accent`;
  const check = `${id}-signup-check`;
  const shadow = `${id}-signup-shadow`;

  return (
    <svg
      viewBox="0 0 160 160"
      role="img"
      aria-labelledby={`${id}-title`}
      className={cx("h-auto w-full max-w-[180px]", className)}
    >
      <title id={`${id}-title`}>{title}</title>
      <defs>
        <linearGradient id={outer} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#D4FBF0" />
          <stop offset="100%" stopColor="#AEECD9" />
        </linearGradient>
        <linearGradient id={middle} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F5FFFB" />
          <stop offset="100%" stopColor="#E2F9F1" />
        </linearGradient>
        <linearGradient id={inner} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#E9FBF4" />
        </linearGradient>
        <linearGradient id={accent} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8CE7CA" />
          <stop offset="100%" stopColor="#44C49D" />
        </linearGradient>
        <linearGradient id={check} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4EC6A7" />
          <stop offset="100%" stopColor="#2AA883" />
        </linearGradient>
        <filter id={shadow} x="-25%" y="-25%" width="150%" height="160%">
          <feDropShadow dx="0" dy="20" stdDeviation="18" floodColor="#5EB296" floodOpacity="0.2" />
        </filter>
      </defs>
      <g filter={`url(#${shadow})`}>
        <rect x="14" y="14" width="132" height="132" rx="36" fill={`url(#${outer})`} />
        <rect x="26" y="26" width="108" height="108" rx="30" fill={`url(#${middle})`} />
        <rect
          x="40"
          y="40"
          width="80"
          height="80"
          rx="24"
          fill={`url(#${inner})`}
          stroke="rgba(255,255,255,0.85)"
          strokeWidth="1.2"
        />
      </g>
      <rect x="48" y="56" width="50" height="10" rx="5" fill="rgba(0,0,0,0.05)" />
      <rect x="48" y="72" width="46" height="8" rx="4" fill="rgba(0,0,0,0.045)" />
      <rect x="48" y="86" width="52" height="8" rx="4" fill="rgba(0,0,0,0.03)" />
      <rect x="48" y="100" width="42" height="8" rx="4" fill="rgba(0,0,0,0.02)" />
      <circle cx="104" cy="62" r="16" fill={`url(#${accent})`} opacity="0.25" />
      <circle cx="104" cy="62" r="11" fill={`url(#${accent})`} />
      <path d="M98 62l4 4 8-10" fill="none" stroke={`url(#${check})`} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="60" cy="118" r="6" fill={`url(#${accent})`} opacity="0.6" />
      <circle cx="120" cy="104" r="5" fill={`url(#${accent})`} opacity="0.45" />
      <rect x="56" y="44" width="48" height="6" rx="3" fill="rgba(68,196,157,0.35)" />
    </svg>
  );
}
