"use client";
import React, { useEffect, useState } from "react";
import { useSidebar } from "@/app/sidebar-context";

export default function ThumbnailModal({
  src,
  alt,
  className,
}: {
  src: string;
  alt?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const { setIsCollapsed } = useSidebar();
  useEffect(() => {
    if (open) {
      try {
        setIsCollapsed(true);
      } catch {}
    }
  }, [open, setIsCollapsed]);
  if (!src) return null;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ||
          "absolute bottom-2 right-2 rounded border border-border bg-background/70 hover:bg-background shadow"
        }
        aria-label="Open flyer preview"
      >
        <img
          src={src}
          alt={alt || "Flyer thumbnail"}
          className="h-38 w-auto  object-cover rounded"
        />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Flyer preview"
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="relative z-[81] max-w-4xl max-h-[85vh]">
            <img
              src={src}
              alt={alt || "Flyer"}
              className="w-auto h-auto max-w-full max-h-[85vh] rounded shadow-2xl border border-border"
            />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute -top-3 -right-3 bg-background text-foreground border border-border rounded-full h-8 w-8 shadow"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
}
