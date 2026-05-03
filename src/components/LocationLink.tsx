"use client";

import { useEffect, useMemo, useState } from "react";
import { buildPreferredDirectionsHref } from "@/lib/directions";

type LocationLinkProps = {
  location?: string | null;
  query?: string | null;
  className?: string;
};


export default function LocationLink({
  location,
  query,
  className,
}: LocationLinkProps) {
  const displayText = useMemo(() => (location ?? "").trim(), [location]);
  const resolvedQuery = useMemo(() => {
    const fromQuery = (query ?? "").toString().trim();
    if (fromQuery) return fromQuery;
    return displayText;
  }, [displayText, query]);
  const [href, setHref] = useState<string | null>(() =>
    resolvedQuery ? buildPreferredDirectionsHref(resolvedQuery) : null
  );

  useEffect(() => {
    if (!resolvedQuery) {
      setHref((prev) => (prev === null ? prev : null));
      return;
    }
    const nextHref =
      buildPreferredDirectionsHref(
        resolvedQuery,
        typeof window === "undefined" ? undefined : window.navigator.userAgent || "",
      );
    setHref((prev) => (prev === nextHref ? prev : nextHref));
  }, [resolvedQuery]);

  if (!displayText) {
    return <span className={className}>—</span>;
  }

  if (!href) {
    return <span className={className}>{displayText}</span>;
  }

  const combinedClassName = [className, "underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none"]
    .filter(Boolean)
    .join(" ");

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={combinedClassName}>
      {displayText}
    </a>
  );
}
