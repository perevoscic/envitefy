"use client";

import React, { useEffect, useMemo, useState } from "react";
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
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);
  const enabled = shouldShowSponsored();
  const links = useMemo(() => {
    const key = placement === "email" ? "email" : "confirm";
    return getAffiliateLinks(`amazon_${key}` as any, {
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

  // Selectively show Oriental Trading for team/classroom cues
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

  const amazonUrl = links.amazon || null;
  const orientalUrl = showOriental ? links.oriental || null : null;

  const decoratedAmazonUrl = useMemo(() => {
    if (!amazonUrl) return null;
    return decorateAmazonUrl(amazonUrl, {
      category: category || null,
      viewer,
      placement: "sponsored_main",
      // Allow default/global tag fallback if no category-specific link is configured
      strictCategoryOnly: false,
    });
  }, [amazonUrl, category, viewer]);

  // Defer rendering until after mount to avoid SSR/CSR mismatches from env-dependent flags
  if (!isMounted || !enabled) return null;

  if (!amazonUrl && !orientalUrl) return null;

  return (
    <div className="mt-6 rounded-xl border border-border bg-surface px-4 py-3 text-sm">
      <div className="flex items-center justify-between">
        <p className="text-foreground/90 font-medium">Need supplies?</p>
        <span className="text-xs text-foreground/50">Sponsored</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-3">
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
