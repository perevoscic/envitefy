"use client";

import React, { useMemo } from "react";
import { getAffiliateLinks, shouldShowSponsored } from "@/utils/affiliates";

type Props = {
  placement?: "confirm" | "email";
  category?: string | null;
  viewer?: "owner" | "guest";
};

export default function SponsoredSupplies({
  placement = "confirm",
  category,
  viewer = "owner",
}: Props) {
  const enabled = shouldShowSponsored();
  const links = useMemo(() => {
    const key = placement === "email" ? "email" : "confirm";
    return getAffiliateLinks(`target_${key}` as any, { category, viewer });
  }, [placement, category, viewer]);

  if (!enabled) return null;

  // Always prefer Target; add Amazon fallback; selectively show Oriental Trading for team/classroom cues
  const showOriental = (() => {
    const c = (category || "").toLowerCase();
    return (
      c.includes("team") ||
      c.includes("practice") ||
      c.includes("school") ||
      c.includes("class") ||
      c.includes("coach")
    );
  })();

  const targetUrl = links.target || null;
  const amazonUrl = links.amazon || null;
  const orientalUrl = showOriental ? links.oriental || null : null;

  if (!targetUrl && !amazonUrl && !orientalUrl) return null;

  return (
    <div className="mt-6 rounded-xl border border-border bg-surface px-4 py-3 text-sm">
      <div className="flex items-center justify-between">
        <p className="text-foreground/90 font-medium">Need supplies?</p>
        <span className="text-xs text-foreground/50">Sponsored</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-3">
        {targetUrl && (
          <a
            href={targetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 hover:bg-foreground/5"
          >
            <span>🎉 Party checklist at Target</span>
          </a>
        )}
        {amazonUrl && (
          <a
            href={amazonUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 hover:bg-foreground/5"
          >
            <span>🛒 More options on Amazon</span>
          </a>
        )}
        {orientalUrl && (
          <a
            href={orientalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 hover:bg-foreground/5"
          >
            <span>📦 Coach/Team supplies</span>
          </a>
        )}
      </div>
    </div>
  );
}
