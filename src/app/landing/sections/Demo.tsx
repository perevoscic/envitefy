"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  SnapProcessingCard,
  type SnapPreviewKind,
  type SnapProcessingStatus,
} from "@/components/snap/SnapProcessingCard";

type DemoEvent = {
  title: string;
  start: string | null;
  end: string | null;
  location: string;
  description: string;
  timezone: string;
};

export default function Demo() {
  const [event, setEvent] = useState<DemoEvent | null>(null);
  const [ocrText, setOcrText] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanStatus, setScanStatus] = useState<SnapProcessingStatus>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewKind, setPreviewKind] = useState<SnapPreviewKind>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const uploadIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeAbortRef = useRef<AbortController | null>(null);
  const cancelledByUserRef = useRef(false);
  const currentPreviewUrlRef = useRef<string | null>(null);
  const scanStartedAtRef = useRef<number | null>(null);
  const scanStatusRef = useRef<SnapProcessingStatus>("idle");

  useEffect(() => {
    scanStatusRef.current = scanStatus;
  }, [scanStatus]);

  const clearTimers = useCallback(() => {
    if (uploadIntervalRef.current) {
      clearInterval(uploadIntervalRef.current);
      uploadIntervalRef.current = null;
    }
  }, []);

  const resetProcessing = useCallback(
    (clearPreview = true) => {
      clearTimers();
      setScanStatus("idle");
      setUploadProgress(0);
      scanStartedAtRef.current = null;
      if (clearPreview) {
        if (currentPreviewUrlRef.current) {
          URL.revokeObjectURL(currentPreviewUrlRef.current);
        }
        currentPreviewUrlRef.current = null;
        setPreviewUrl(null);
        setPreviewKind(null);
      }
    },
    [clearTimers]
  );

  const startProcessing = useCallback(
    (selected: File) => {
      clearTimers();
      scanStartedAtRef.current = null;
      if (currentPreviewUrlRef.current) {
        URL.revokeObjectURL(currentPreviewUrlRef.current);
      }
      currentPreviewUrlRef.current = null;

      const nextPreviewKind: SnapPreviewKind = selected.type.startsWith("image/")
        ? "image"
        : selected.type === "application/pdf"
          ? "pdf"
          : "file";
      setPreviewKind(nextPreviewKind);
      if (nextPreviewKind === "image") {
        const nextPreviewUrl = URL.createObjectURL(selected);
        currentPreviewUrlRef.current = nextPreviewUrl;
        setPreviewUrl(nextPreviewUrl);
      } else {
        setPreviewUrl(null);
      }

      setUploadProgress(0);
      setScanStatus("uploading");
      uploadIntervalRef.current = setInterval(() => {
        setUploadProgress((prev) => {
          const next = Math.min(100, prev + 6);
          if (next >= 100) {
            if (uploadIntervalRef.current) {
              clearInterval(uploadIntervalRef.current);
              uploadIntervalRef.current = null;
            }
            setScanStatus("scanning");
            scanStartedAtRef.current = Date.now();
          }
          return next;
        });
      }, 100);
    },
    [clearTimers]
  );

  const finishProcessing = useCallback(async () => {
    if (uploadIntervalRef.current) {
      clearInterval(uploadIntervalRef.current);
      uploadIntervalRef.current = null;
    }
    setUploadProgress(100);
    if (scanStatusRef.current !== "scanning") {
      setScanStatus("scanning");
      scanStartedAtRef.current = Date.now();
    }

    const minScanRevealMs = 1200;
    const elapsed = scanStartedAtRef.current
      ? Date.now() - scanStartedAtRef.current
      : 0;
    if (elapsed < minScanRevealMs) {
      await new Promise<void>((resolve) => {
        setTimeout(resolve, minScanRevealMs - elapsed);
      });
    }
    resetProcessing();
  }, [resetProcessing]);

  const cancelProcessing = useCallback(() => {
    cancelledByUserRef.current = true;
    activeAbortRef.current?.abort();
    activeAbortRef.current = null;
    setLoading(false);
    setError(null);
    resetProcessing();
  }, [resetProcessing]);

  useEffect(
    () => () => {
      activeAbortRef.current?.abort();
      activeAbortRef.current = null;
      clearTimers();
      if (currentPreviewUrlRef.current) {
        URL.revokeObjectURL(currentPreviewUrlRef.current);
      }
      currentPreviewUrlRef.current = null;
    },
    [clearTimers]
  );

  const onPick = () => fileInputRef.current?.click();

  const ingest = async (file: File) => {
    setLoading(true);
    setError(null);
    setEvent(null);
    cancelledByUserRef.current = false;

    // On Android, file objects from file inputs can become invalid during async upload.
    // Read the file into memory first to capture the data before it becomes stale.
    let fileToUpload: File = file;
    try {
      // Read file into ArrayBuffer, then create a new File from it
      // This ensures the data is captured in memory before the original file reference becomes stale
      const arrayBuffer = await file.arrayBuffer();
      fileToUpload = new File([arrayBuffer], file.name, {
        type: file.type || "application/octet-stream",
        lastModified: file.lastModified,
      });
    } catch (readErr) {
      // If reading fails, fall back to using the original file object
      // (works on most platforms but may fail on Android)
      console.warn(
        "Failed to read file into memory, using original file object:",
        readErr
      );
    }

    const form = new FormData();
    form.append("file", fileToUpload);
    let res: Response;
    try {
      const controller = new AbortController();
      activeAbortRef.current = controller;
      const timeoutId = setTimeout(() => controller.abort(), 45000);
      res = await fetch("/api/ocr", {
        method: "POST",
        body: form,
        signal: controller.signal,
        mode: "cors",
        credentials: "include",
      });
      clearTimeout(timeoutId);
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError" && cancelledByUserRef.current) {
        setLoading(false);
        return;
      }
      resetProcessing();
      setError("Upload failed. Please try a different image.");
      setLoading(false);
      return;
    }
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      resetProcessing();
      setError((j as any).error || "Failed to scan file");
      setLoading(false);
      return;
    }
    const data = await res.json();
    const e: DemoEvent = {
      title: data?.fieldsGuess?.title || "Event",
      start: data?.fieldsGuess?.start || null,
      end: data?.fieldsGuess?.end || null,
      location: data?.fieldsGuess?.location || "",
      description: data?.fieldsGuess?.description || "",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    };
    await finishProcessing();
    setEvent(e);
    setOcrText(data?.ocrText || "");
    activeAbortRef.current = null;
    cancelledByUserRef.current = false;
    setLoading(false);
  };

  return (
    <section id="demo" aria-labelledby="live-demo" className="w-full">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <h2
          id="live-demo"
          className="text-2xl sm:text-3xl font-bold text-center"
        >
          Live demo
        </h2>
        <p className="mt-2 text-center text-foreground/70 max-w-2xl mx-auto">
          Upload an image from your device. We only use uploads to extract
          details.
        </p>

        <div className="mt-6 flex flex-col items-center gap-4">
          <div className="flex flex-wrap gap-3">
            <button
              className="rounded-xl border border-border px-4 py-2 bg-surface/70 hover:bg-surface"
              onClick={onPick}
            >
              Upload from device
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                startProcessing(f);
                ingest(f);
              }
            }}
          />
        </div>

        {scanStatus !== "idle" && (
          <div role="status" aria-live="polite" className="mt-8 flex justify-center">
            <SnapProcessingCard
              status={scanStatus}
              progress={uploadProgress}
              previewUrl={previewUrl}
              previewKind={previewKind}
              onCancel={cancelProcessing}
            />
          </div>
        )}
        {error && (
          <div className="mt-3 p-3 rounded border border-error/40 bg-error/10 text-error text-center">
            {error}
          </div>
        )}

        {event && (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl bg-surface/70 border border-border p-6">
              <h3 className="text-lg font-semibold">Detected details</h3>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex gap-2">
                  <dt className="text-foreground/60 w-24">Title</dt>
                  <dd className="flex-1">{event.title}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-foreground/60 w-24">Start</dt>
                  <dd className="flex-1">{event.start || "—"}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-foreground/60 w-24">End</dt>
                  <dd className="flex-1">{event.end || "—"}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-foreground/60 w-24">Location</dt>
                  <dd className="flex-1">{event.location || "—"}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-foreground/60 w-24">Timezone</dt>
                  <dd className="flex-1">{event.timezone}</dd>
                </div>
              </dl>
            </div>
            <div className="rounded-2xl bg-surface/70 border border-border p-6">
              <h3 className="text-lg font-semibold">Extracted text</h3>
              <pre className="mt-3 text-sm whitespace-pre-wrap text-foreground/70 max-h-80 overflow-auto">
                {ocrText || "(No text)"}
              </pre>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
