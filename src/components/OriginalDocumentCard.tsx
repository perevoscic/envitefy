"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Download, Eye, FileText } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ScanOriginalDocument } from "@/lib/ocr/scan-media";
import OriginalDocumentViewer from "./OriginalDocumentViewer";
import { useOriginalDocument } from "./useOriginalDocument";

export default function OriginalDocumentCard({
  original,
  className = "relative mx-auto w-full max-w-md px-6 pb-10",
}: {
  original: ScanOriginalDocument;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const tile = useRef<HTMLDivElement>(null);
  const { document, displayDocument, loadError, originalLoadError, prepare, prepareForOpen, retry } =
    useOriginalDocument(original);
  useEffect(() => {
    if (!tile.current || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        prepare();
        observer.disconnect();
      },
      { rootMargin: "400px" },
    );
    observer.observe(tile.current);
    return () => observer.disconnect();
  }, [prepare]);
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) prepareForOpen();
        setOpen(nextOpen);
      }}
    >
      <div ref={tile} className={className}>
        <section
          aria-label="Original document"
          className="h-full min-h-[8.5rem] rounded-[2rem] border border-white/60 bg-white p-4 text-slate-800 shadow-sm sm:p-7"
        >
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-2 gap-y-3 sm:flex sm:justify-between sm:gap-4">
            <div className="contents sm:block sm:min-w-0">
              <div className="self-center text-[10px] font-bold uppercase tracking-widest text-black/35 sm:mb-4">
                Original document
              </div>
              <div className="col-span-2 row-start-2 flex flex-wrap gap-2 sm:gap-3">
                <Dialog.Trigger asChild>
                  <button
                    type="button"
                    aria-label="View original document"
                    onPointerEnter={prepare}
                    onFocus={prepare}
                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-300 text-slate-800 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-700"
                  >
                    <Eye className="h-5 w-5" aria-hidden="true" />
                  </button>
                </Dialog.Trigger>
                <a
                  href={document?.url || original.downloadUrl}
                  download={document?.file.name || true}
                  aria-label="Save original document"
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-300 text-slate-800 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-700"
                >
                  <Download className="h-5 w-5" aria-hidden="true" />
                </a>
              </div>
            </div>
            <div
              className="col-start-2 row-start-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-lg sm:h-12 sm:w-12"
              style={{ color: "var(--theme-primary, #f43f75)" }}
              aria-hidden="true"
            >
              <FileText className="h-5 w-5" />
            </div>
          </div>
        </section>
      </div>
      <OriginalDocumentViewer
        original={original}
        open={open}
        document={document}
        displayDocument={displayDocument}
        loadError={loadError}
        originalLoadError={originalLoadError}
        onRetry={retry}
      />
    </Dialog.Root>
  );
}
