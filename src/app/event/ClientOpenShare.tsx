"use client";

import React from "react";

export default function ClientOpenShare({
  historyId,
  className,
}: {
  historyId: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        try {
          const btn = document.querySelector(
            `[data-history-id='${historyId}'] [data-action='share']`
          ) as HTMLButtonElement | null;
          btn?.click();
        } catch {}
      }}
      className={
        className ||
        "text-xs rounded border border-border bg-surface px-2 py-1 hover:bg-foreground/5"
      }
      title="Add recipient"
    >
      + Add
    </button>
  );
}
