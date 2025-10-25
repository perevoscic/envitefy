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
  const beam = `${id}-beam`;
  const lens = `${id}-lens`;

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
          <stop offset="0%" stopColor="#D3E4FF" />
          <stop offset="100%" stopColor="#F3F6FF" />
        </linearGradient>
        <linearGradient id={beam} x1="0%" y1="30%" x2="100%" y2="70%">
          <stop offset="0%" stopColor="rgba(34,116,255,0.0)" />
          <stop offset="35%" stopColor="rgba(34,116,255,0.3)" />
          <stop offset="100%" stopColor="rgba(34,116,255,0.0)" />
        </linearGradient>
        <radialGradient id={lens} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#4D7CFF" />
          <stop offset="60%" stopColor="#2859E6" />
          <stop offset="100%" stopColor="#0E2A80" />
        </radialGradient>
      </defs>

      <rect x="8" y="10" width="164" height="120" rx="26" fill={`url(#${bg})`} />
      <rect
        x="28"
        y="34"
        width="124"
        height="76"
        rx="18"
        fill="#0E1C3B"
        opacity="0.12"
      />
      <rect
        x="40"
        y="42"
        width="100"
        height="60"
        rx="14"
        fill="#FFFFFF"
        stroke="#E1E8FF"
        strokeWidth="2"
      />
      <rect
        x="40"
        y="67"
        width="100"
        height="10"
        fill={`url(#${beam})`}
        opacity="0.9"
      />
      <path
        d="M78 52h24"
        stroke="#1C46FF"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.7"
      />
      <rect
        x="58"
        y="30"
        width="64"
        height="12"
        rx="6"
        fill="#244DFF"
        opacity="0.25"
      />
      <circle cx="52" cy="72" r="12" fill="#E8EEFF" />
      <path
        d="M46 72h12"
        stroke="#1F3DE6"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.7"
      />
      <path
        d="M58 68v8"
        stroke="#1F3DE6"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.7"
      />
      <circle cx="128" cy="72" r="18" fill="#132B70" />
      <circle cx="128" cy="72" r="12" fill={`url(#${lens})`} />
      <circle
        cx="124"
        cy="68"
        r="4"
        fill="#C7D8FF"
        opacity="0.6"
      />
      <circle
        cx="134"
        cy="78"
        r="3"
        fill="#FFFFFF"
        opacity="0.3"
      />
      <rect
        x="20"
        y="100"
        width="140"
        height="10"
        rx="5"
        fill="#1F3DE6"
        opacity="0.08"
      />
    </svg>
  );
}

export function UploadIllustration({
  className,
  title = "Upload to the cloud",
}: IllustrationProps) {
  const id = useId();
  const bg = `${id}-bg`;
  const cloud = `${id}-cloud`;
  const arrow = `${id}-arrow`;

  return (
    <svg
      viewBox="0 0 180 140"
      role="img"
      aria-labelledby={`${id}-title`}
      className={cx("h-auto w-full max-w-[180px]", className)}
    >
      <title id={`${id}-title`}>{title}</title>
      <defs>
        <linearGradient id={bg} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#F7F4FF" />
          <stop offset="100%" stopColor="#ECE6FF" />
        </linearGradient>
        <radialGradient id={cloud} cx="50%" cy="40%" r="70%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="90%" stopColor="#E5DFFF" />
          <stop offset="100%" stopColor="#DBD3FF" />
        </radialGradient>
        <linearGradient id={arrow} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#6F55FF" />
          <stop offset="100%" stopColor="#4B2FE3" />
        </linearGradient>
      </defs>

      <rect x="10" y="12" width="160" height="116" rx="24" fill={`url(#${bg})`} />
      <path
        d="M48 90c-10 0-18-8.28-18-18 0-8.54 5.88-15.72 13.82-17.49C47.94 43.8 60.6 36 74.5 36c12.7 0 23.7 6.74 29.5 16.72 1.8-0.48 3.67-0.72 5.58-0.72 13.36 0 24.2 10.84 24.2 24.2S122.94 100.4 109.6 100.4H48z"
        fill={`url(#${cloud})`}
      />
      <path
        d="M90 58l0 46"
        stroke="rgba(105,86,255,0.35)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="6 10"
      />
      <rect
        x="70"
        y="66"
        width="40"
        height="36"
        rx="12"
        fill="#EFE8FF"
        stroke="#D4C9FF"
        strokeWidth="2"
      />
      <path
        d="M90 54l-16 18h10v20h12V72h10L90 54z"
        fill={`url(#${arrow})`}
      />
      <circle cx="60" cy="92" r="6" fill="#C6B6FF" opacity="0.6" />
      <circle cx="120" cy="84" r="10" fill="#D6CBFF" opacity="0.4" />
      <rect
        x="38"
        y="102"
        width="104"
        height="8"
        rx="4"
        fill="#6F55FF"
        opacity="0.12"
      />
    </svg>
  );
}

export function CreateEventIllustration({
  className,
  title = "Create a calendar event",
}: IllustrationProps) {
  const id = useId();
  const bg = `${id}-bg`;
  const header = `${id}-header`;
  const plus = `${id}-plus`;

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
          <stop offset="0%" stopColor="#FFE8F0" />
          <stop offset="100%" stopColor="#FDF2FF" />
        </linearGradient>
        <linearGradient id={header} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FF7AB5" />
          <stop offset="100%" stopColor="#FF4D8D" />
        </linearGradient>
        <linearGradient id={plus} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FF4F93" />
          <stop offset="100%" stopColor="#D72670" />
        </linearGradient>
      </defs>

      <rect x="8" y="12" width="164" height="116" rx="22" fill={`url(#${bg})`} />
      <rect
        x="30"
        y="34"
        width="120"
        height="84"
        rx="18"
        fill="#FFFFFF"
        stroke="#FFD0DF"
        strokeWidth="2"
      />
      <rect
        x="30"
        y="34"
        width="120"
        height="28"
        rx="14"
        fill={`url(#${header})`}
      />
      <circle cx="54" cy="48" r="6" fill="#FFFFFF" opacity="0.9" />
      <circle cx="72" cy="48" r="6" fill="#FFFFFF" opacity="0.75" />
      <circle cx="90" cy="48" r="6" fill="#FFFFFF" opacity="0.5" />
      <rect x="44" y="70" width="92" height="8" rx="4" fill="#FFC0D4" />
      <rect x="44" y="84" width="72" height="8" rx="4" fill="#FFE0EC" />
      <rect
        x="44"
        y="98"
        width="48"
        height="8"
        rx="4"
        fill="#FFE6F1"
      />
      <circle cx="122" cy="92" r="18" fill="#FFE0EC" />
      <path
        d="M122 82v20"
        stroke={`url(#${plus})`}
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M112 92h20"
        stroke={`url(#${plus})`}
        strokeWidth="6"
        strokeLinecap="round"
      />
      <rect
        x="24"
        y="110"
        width="132"
        height="10"
        rx="5"
        fill="#FF4F93"
        opacity="0.08"
      />
    </svg>
  );
}

export function SignUpIllustration({
  className,
  title = "Smart sign-up form",
}: IllustrationProps) {
  const id = useId();
  const bg = `${id}-bg`;
  const sheet = `${id}-sheet`;
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
          <stop offset="0%" stopColor="#E5FFF3" />
          <stop offset="100%" stopColor="#F2FFF9" />
        </linearGradient>
        <linearGradient id={sheet} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#E2F9ED" />
        </linearGradient>
        <linearGradient id={check} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#28C98A" />
          <stop offset="100%" stopColor="#11A66B" />
        </linearGradient>
      </defs>

      <rect x="8" y="12" width="164" height="116" rx="22" fill={`url(#${bg})`} />
      <rect
        x="42"
        y="30"
        width="96"
        height="96"
        rx="18"
        fill={`url(#${sheet})`}
        stroke="#CDEEDC"
        strokeWidth="2"
      />
      <rect
        x="54"
        y="38"
        width="72"
        height="8"
        rx="4"
        fill="#C6F0DE"
        opacity="0.8"
      />
      <rect x="54" y="54" width="56" height="8" rx="4" fill="#DDF7EA" />
      <rect x="54" y="70" width="60" height="8" rx="4" fill="#D4F4E5" />
      <rect x="54" y="86" width="48" height="8" rx="4" fill="#E9FBF3" />
      <rect x="54" y="102" width="64" height="8" rx="4" fill="#DDF7EA" />
      <rect
        x="36"
        y="24"
        width="108"
        height="16"
        rx="8"
        fill="#B9EFD7"
        opacity="0.6"
      />
      <path
        d="M120 48l24 16-10 38-32-20z"
        fill="#12B577"
        opacity="0.12"
      />
      <circle cx="120" cy="92" r="20" fill="#D4F7E7" />
      <circle cx="120" cy="92" r="14" fill="#FFFFFF" />
      <path
        d="M114 92l4 4 8-10"
        fill="none"
        stroke={`url(#${check})`}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x="26"
        y="110"
        width="128"
        height="8"
        rx="4"
        fill="#28C98A"
        opacity="0.1"
      />
    </svg>
  );
}
