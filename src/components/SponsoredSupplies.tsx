"use client";

import React, { useMemo } from "react";
import {
  getAffiliateLinks,
  getAffiliateImageCards,
  shouldShowSponsored,
  decorateAmazonUrl,
} from "@/utils/affiliates";

type Props = {
  placement?: "confirm" | "email";
  category?: string | null;
  viewer?: "owner" | "guest";
  title?: string | null;
  description?: string | null;
};

export default function SponsoredSupplies({
  placement = "confirm",
  category,
  viewer = "owner",
  title = null,
  description = null,
}: Props) {
  const enabled = shouldShowSponsored();
  const links = useMemo(() => {
    const key = placement === "email" ? "email" : "confirm";
    return getAffiliateLinks(`target_${key}` as any, {
      category,
      viewer,
      title,
      description,
    });
  }, [placement, category, viewer, title, description]);

  const cards = useMemo(() => {
    return getAffiliateImageCards({
      category: category || null,
      viewer,
      title,
      description,
    });
  }, [category, viewer, title, description]);

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

  const decoratedAmazonUrl = useMemo(() => {
    if (!amazonUrl) return null;
    return decorateAmazonUrl(amazonUrl, {
      category: category || null,
      viewer,
      placement: "sponsored_main",
      strictCategoryOnly: true,
    });
  }, [amazonUrl, category, viewer]);

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
        {decoratedAmazonUrl && (
          <a
            href={decoratedAmazonUrl}
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
      {cards.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {cards.slice(0, 6).map((c, idx) => (
            <a
              key={`${c.href}-${idx}`}
              href={c.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group overflow-hidden rounded-lg border border-border bg-background"
            >
              <img
                src={c.src}
                alt={c.alt || ""}
                className="aspect-square w-full object-cover transition-transform group-hover:scale-[1.02]"
                loading="lazy"
                decoding="async"
              />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
