/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-explicit-any */
// @ts-nocheck
"use client";

import React from "react";
import { Calendar, ExternalLink, Share2 } from "lucide-react";

export default function FloatingActionStrip({
  buttonClass,
  onShare,
  onCalendar,
  resourcesHref,
}: {
  buttonClass: string;
  onShare: () => void;
  onCalendar: () => void;
  resourcesHref?: string;
}) {
  const resolvedButtonClass = `${buttonClass} bg-current/10 backdrop-blur-sm hover:bg-current/15`;

  return (
    <div className="flex w-full flex-wrap justify-end gap-2">
      <button onClick={onShare} className={resolvedButtonClass}>
        <Share2 size={14} /> Share
      </button>
      <button onClick={onCalendar} className={resolvedButtonClass}>
        <Calendar size={14} /> Calendar
      </button>
      {resourcesHref ? (
        <a href={resourcesHref} className={resolvedButtonClass}>
          Resources
          <ExternalLink size={14} />
        </a>
      ) : null}
    </div>
  );
}
