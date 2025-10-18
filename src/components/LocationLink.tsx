"use client";

import { useEffect, useMemo, useState } from "react";

type LocationLinkProps = {
  location?: string | null;
  className?: string;
};

const buildGoogleHref = (location: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;

const buildAppleHref = (location: string) =>
  `https://maps.apple.com/?q=${encodeURIComponent(location)}`;

export default function LocationLink({
  location,
  className,
}: LocationLinkProps) {
  const trimmed = useMemo(() => location?.trim() ?? "", [location]);
  const [href, setHref] = useState<string | null>(() =>
    trimmed ? buildGoogleHref(trimmed) : null
  );

  useEffect(() => {
    if (!trimmed) {
      setHref(null);
      return;
    }
    if (typeof window === "undefined") {
      setHref(buildGoogleHref(trimmed));
      return;
    }
    const ua = window.navigator.userAgent || "";
    if (/iP(hone|ad|od)|Macintosh/.test(ua) && !/Android/.test(ua)) {
      setHref(buildAppleHref(trimmed));
      return;
    }
    setHref(buildGoogleHref(trimmed));
  }, [trimmed]);

  if (!trimmed) {
    return <span className={className}>—</span>;
  }

  if (!href) {
    return <span className={className}>{trimmed}</span>;
  }

  const combinedClassName = [className, "underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none"]
    .filter(Boolean)
    .join(" ");

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={combinedClassName}>
      {trimmed}
    </a>
  );
}

