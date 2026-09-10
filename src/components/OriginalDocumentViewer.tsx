"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Download, LoaderCircle, Share2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ScanOriginalDocument } from "@/lib/ocr/scan-media";
import { shareOriginalDocument } from "@/utils/original-document-share";
import type { LoadedOriginalDocument } from "./useOriginalDocument";

const toolbarAction =
  "inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 text-sm font-semibold text-white transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-wait disabled:opacity-45 sm:px-4";

export default function OriginalDocumentViewer({
  original,
  open,
  document,
  displayDocument,
  loadError,
  originalLoadError,
  onRetry,
}: {
  original: ScanOriginalDocument;
  open: boolean;
  document: LoadedOriginalDocument | null;
  displayDocument: LoadedOriginalDocument | null;
  loadError: boolean;
  originalLoadError: boolean;
  onRetry: () => void;
}) {
  const [displayError, setDisplayError] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shareMessage, setShareMessage] = useState("");
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    setShareMessage("");
  }, [open]);

  useEffect(() => setDisplayError(false), [displayDocument]);

  async function share() {
    if (!document || sharing) return;
    setSharing(true);
    setShareMessage("");
    const result = await shareOriginalDocument(document.file, navigator);
    if (result === "unsupported") {
      setShareMessage(
        "File sharing is unavailable in this browser. Download a copy to share from your device.",
      );
    } else if (result === "failed") {
      setShareMessage("Couldn’t open sharing. Try again or download a copy to share.");
    }
    setSharing(false);
  }

  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-[13100] bg-[rgba(18,15,12,0.78)] backdrop-blur-md" />
      <Dialog.Content
        className="fixed left-1/2 top-1/2 z-[13101] flex h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-6xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[1.75rem] border border-white/20 bg-[#242321] text-white shadow-[0_32px_120px_rgba(0,0,0,0.45)] sm:h-[calc(100dvh-3rem)] sm:w-[calc(100vw-3rem)]"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          closeButton.current?.focus();
        }}
      >
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-white/15 px-4 py-3 sm:px-5">
          <Dialog.Title asChild>
            <div className="text-sm font-semibold text-white sm:text-base">Original document</div>
          </Dialog.Title>
          <Dialog.Description className="sr-only">
            View the original document, share a copy, or download it to your device.
          </Dialog.Description>
          <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={share}
              disabled={!document || loadError || sharing}
              className={toolbarAction}
              aria-label="Share original document"
            >
              <Share2 className="h-4 w-4" aria-hidden="true" />
              {sharing ? "Sharing…" : "Share"}
            </button>
            <a
              href={document?.url || original.downloadUrl}
              download={document?.file.name || true}
              className={toolbarAction}
              aria-label="Download original document"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Download
            </a>
            <Dialog.Close asChild>
              <button
                ref={closeButton}
                type="button"
                className={toolbarAction}
                aria-label="Close document viewer"
              >
                <X className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Close</span>
              </button>
            </Dialog.Close>
          </div>
        </div>
        {shareMessage && (
          <p
            role="status"
            className="shrink-0 border-b border-white/15 px-5 py-3 text-sm text-white/90"
          >
            {shareMessage}
          </p>
        )}
        {originalLoadError && (
          <div
            role="status"
            className="flex shrink-0 flex-wrap items-center justify-end gap-3 border-b border-white/15 px-5 py-3 text-sm text-white/90"
          >
            <span>Couldn’t prepare the original for sharing.</span>
            <button type="button" className={toolbarAction} onClick={onRetry}>
              Try again
            </button>
          </div>
        )}
        <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-2 sm:p-4">
          {loadError || displayError ? (
            <div role="status" className="max-w-sm space-y-4 p-6 text-center text-sm text-white/90">
              <p>Couldn’t open the document. Try again or download a copy.</p>
              <button
                type="button"
                className={toolbarAction}
                onClick={() => {
                  setDisplayError(false);
                  onRetry();
                }}
              >
                Try again
              </button>
            </div>
          ) : !displayDocument ? (
            <div role="status" className="flex items-center gap-3 text-sm text-white/80">
              <LoaderCircle
                className="h-5 w-5 animate-spin motion-reduce:animate-none"
                aria-hidden="true"
              />
              Loading document…
            </div>
          ) : displayDocument.file.type.startsWith("image/") ? (
            <img
              src={displayDocument.url}
              alt="Original document"
              className="h-full w-full object-contain"
              onError={() => setDisplayError(true)}
            />
          ) : displayDocument.file.type === "application/pdf" ? (
            <iframe
              src={displayDocument.url}
              title="Original PDF document"
              className="h-full w-full rounded-xl border-0 bg-white"
            />
          ) : (
            <p className="max-w-sm p-6 text-center text-sm text-white/90">
              Download this document to view it on your device.
            </p>
          )}
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  );
}
