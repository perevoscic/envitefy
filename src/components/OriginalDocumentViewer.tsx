"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Download, LoaderCircle, Share2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ScanOriginalDocument } from "@/lib/ocr/scan-media";
import { shareOriginalDocument } from "@/utils/original-document-share";
import type { LoadedOriginalDocument } from "./useOriginalDocument";

const toolbarAction = [
  "inline-flex min-h-11 min-w-11 appearance-none items-center justify-center gap-2 rounded-full border border-white/25 px-3 text-sm font-semibold text-white sm:px-4",
  // Explicit alpha and WebKit blur keep the image visible through mobile Safari controls.
  "bg-[rgba(18,15,12,0.18)] backdrop-blur-[6px] [-webkit-backdrop-filter:blur(6px)] shadow-[0_2px_10px_rgba(0,0,0,0.12)] [text-shadow:0_1px_3px_rgba(0,0,0,0.7)]",
  "sm:bg-[rgba(0,0,0,0.35)] sm:backdrop-blur-md sm:[-webkit-backdrop-filter:blur(12px)] sm:shadow-lg",
  "transition hover:bg-[rgba(18,15,12,0.28)] sm:hover:bg-[rgba(0,0,0,0.5)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-wait disabled:opacity-45",
].join(" ");

export default function OriginalDocumentViewer({
  original,
  open,
  document,
  displayDocument,
  loadError,
  originalLoadError,
  onRetry,
  onCloseAutoFocus,
}: {
  original: ScanOriginalDocument;
  open: boolean;
  document: LoadedOriginalDocument | null;
  displayDocument: LoadedOriginalDocument | null;
  loadError: boolean;
  originalLoadError: boolean;
  onRetry: () => void;
  onCloseAutoFocus?: (event: Event) => void;
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
        onCloseAutoFocus={onCloseAutoFocus}
        className="fixed left-1/2 top-1/2 z-[13101] h-auto w-max max-w-[calc(100vw-var(--document-margin))] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-xl bg-[#242321] text-white shadow-[0_32px_120px_rgba(0,0,0,0.45)] [--document-margin:1rem] sm:[--document-margin:3rem]"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          closeButton.current?.focus();
        }}
      >
        <Dialog.Title className="sr-only">Original document</Dialog.Title>
        <Dialog.Description className="sr-only">
          View the original document, share a copy, or download it to your device.
        </Dialog.Description>
        <div className="pointer-events-none absolute inset-x-3 top-3 z-10 flex justify-end">
          <div className="pointer-events-auto ml-auto flex max-w-full flex-wrap items-center justify-end gap-2">
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
        {(shareMessage || originalLoadError) && (
          <div className="absolute inset-x-3 bottom-3 z-10 max-h-[50%] space-y-3 overflow-auto rounded-xl bg-black/80 p-4 text-sm text-white/90 shadow-lg backdrop-blur-md">
            {shareMessage && <p role="status">{shareMessage}</p>}
            {originalLoadError && (
              <div role="status" className="flex flex-wrap items-center justify-end gap-3">
                <span>Couldn’t prepare the original for sharing.</span>
                <button type="button" className={toolbarAction} onClick={onRetry}>
                  Try again
                </button>
              </div>
            )}
          </div>
        )}
        <div>
          {loadError || displayError ? (
            <div
              role="status"
              className="flex min-h-64 w-[min(24rem,calc(100vw-var(--document-margin)))] flex-col items-center justify-center gap-4 px-6 pb-8 pt-28 text-center text-sm text-white/90"
            >
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
            <div
              role="status"
              className="flex min-h-64 w-[min(24rem,calc(100vw-var(--document-margin)))] items-center justify-center gap-3 px-6 pb-8 pt-28 text-sm text-white/80"
            >
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
              className="block h-auto max-h-[calc(100dvh-var(--document-margin))] w-auto max-w-[calc(100vw-var(--document-margin))] object-contain"
              onError={() => setDisplayError(true)}
            />
          ) : displayDocument.file.type === "application/pdf" ? (
            <iframe
              src={displayDocument.url}
              title="Original PDF document"
              className="block h-[calc(100dvh-var(--document-margin))] w-[min(56rem,calc(100vw-var(--document-margin)))] border-0 bg-white"
            />
          ) : (
            <p className="flex min-h-64 w-[min(24rem,calc(100vw-var(--document-margin)))] items-center justify-center px-6 pb-8 pt-28 text-center text-sm text-white/90">
              Download this document to view it on your device.
            </p>
          )}
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  );
}
