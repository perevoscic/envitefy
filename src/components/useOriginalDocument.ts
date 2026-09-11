"use client";

import { useCallback, useEffect, useState } from "react";
import type { ScanOriginalDocument } from "@/lib/ocr/scan-media";

export type LoadedOriginalDocument = { file: File; url: string };

/** Show the small viewing copy first; keep the exact original for saving and native sharing. */
export function useOriginalDocument(original: ScanOriginalDocument) {
  const [requested, setRequested] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [document, setDocument] = useState<LoadedOriginalDocument | null>(null);
  const [displayDocument, setDisplayDocument] = useState<LoadedOriginalDocument | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [originalLoadError, setOriginalLoadError] = useState(false);
  const prepare = useCallback(() => setRequested(true), []);
  const prepareForOpen = useCallback(() => {
    setRequested(true);
    if (loadError) setAttempt((value) => value + 1);
  }, [loadError]);
  const retry = useCallback(() => {
    setRequested(true);
    setAttempt((value) => value + 1);
  }, []);

  useEffect(() => {
    if (!requested) return;
    const controller = new AbortController();
    const objectUrls: string[] = [];
    setDocument(null);
    setDisplayDocument(null);
    setLoadError(false);
    setOriginalLoadError(false);
    const fetchFile = async (url: string) => {
      // Avoid newer AbortSignal static methods so older Safari can load files too.
      const requestController = new AbortController();
      const abort = () => requestController.abort();
      controller.signal.addEventListener("abort", abort, { once: true });
      if (controller.signal.aborted) abort();
      const timeout = setTimeout(abort, 30_000);
      try {
        const response = await fetch(url, {
          credentials: "same-origin",
          cache: "no-store",
          signal: requestController.signal,
        });
        if (!response.ok) throw new Error("Document unavailable");
        const blob = await response.blob();
        if (controller.signal.aborted) return null;
        const isDisplay = response.headers.get("X-Document-Variant") === "display";
        const file = new File(
          [blob],
          isDisplay ? "Document preview.webp" : original.name || "Original document",
          { type: blob.type },
        );
        const objectUrl = URL.createObjectURL(file);
        objectUrls.push(objectUrl);
        return { loaded: { file, url: objectUrl }, isDisplay };
      } finally {
        clearTimeout(timeout);
        controller.signal.removeEventListener("abort", abort);
      }
    };
    const load = async () => {
      let viewingCopy = false;
      try {
        let result: Awaited<ReturnType<typeof fetchFile>>;
        try {
          result = await fetchFile(original.displayUrl || original.viewUrl);
        } catch (error) {
          if (
            controller.signal.aborted ||
            !original.displayUrl ||
            original.displayUrl === original.viewUrl
          )
            throw error;
          // A failed optimized viewing request must not hide an available source.
          result = await fetchFile(original.viewUrl);
        }
        if (!result) return;
        setDisplayDocument(result.loaded);
        viewingCopy = result.isDisplay;
        if (!viewingCopy) {
          setDocument(result.loaded);
          return;
        }
        // Wait until the smaller image is available before spending bandwidth on the source.
        const exact = await fetchFile(original.viewUrl);
        if (exact && !exact.isDisplay) setDocument(exact.loaded);
        else if (exact) throw new Error("Original unavailable");
      } catch {
        if (!controller.signal.aborted) {
          if (viewingCopy) setOriginalLoadError(true);
          else setLoadError(true);
        }
      }
    };
    void load();
    // Closing the popup keeps this copy. Leaving the event releases it.
    return () => {
      controller.abort();
      for (const url of objectUrls) URL.revokeObjectURL(url);
    };
  }, [requested, original.name, original.viewUrl, original.displayUrl, attempt]);

  return { document, displayDocument, loadError, originalLoadError, prepare, prepareForOpen, retry };
}
