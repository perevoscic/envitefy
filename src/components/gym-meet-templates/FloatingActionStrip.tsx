/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-explicit-any */
// @ts-nocheck
"use client";

import React from "react";
import { Calendar, Share2 } from "lucide-react";

export default function FloatingActionStrip({
  buttonClass,
  onShare,
  onCalendar,
}: {
  buttonClass: string;
  onShare: () => void;
  onCalendar: () => void;
}) {
  return (
    <div className="flex w-full flex-wrap justify-end gap-2">
      <button onClick={onShare} className={buttonClass}>
        <Share2 size={14} /> Share
      </button>
      <button onClick={onCalendar} className={buttonClass}>
        <Calendar size={14} /> Calendar
      </button>
    </div>
  );
}
