"use client";

import { useRouter } from "next/navigation";
import { type DragEvent, type KeyboardEvent, useCallback, useRef, useState } from "react";
import { savePendingSnapUpload } from "@/lib/pending-snap-upload";
import { createClientAttemptId, reportClientLog } from "@/utils/client-log";
import { getUploadAcceptAttribute, validateClientUploadFile } from "@/utils/media-upload-client";

export default function SnapLaunchCards() {
  const router = useRouter();
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const routeSelectedFile = useCallback(
    async (file: File | null) => {
      if (!file) return;
      const validationError = validateClientUploadFile(file, "attachment");
      if (validationError) {
        setError(validationError);
        return;
      }

      setError(null);
      const scanAttemptId = createClientAttemptId("scan");
      try {
        await savePendingSnapUpload({ file, scanAttemptId });
      } catch (err) {
        reportClientLog({
          area: "snap-upload",
          stage: "pending-save",
          scanAttemptId,
          error: err,
          details: {
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
          },
        });
        setError("Unable to prepare this upload. Please try again.");
        return;
      }

      router.push("/?action=upload");
    },
    [router],
  );

  const openCameraPicker = useCallback(() => {
    setError(null);
    try {
      cameraInputRef.current?.click();
    } catch (err) {
      console.error("Failed to open camera picker:", err);
      setError("Unable to open the camera. Please try again.");
    }
  }, []);

  const openUploadPicker = useCallback(() => {
    setError(null);
    try {
      uploadInputRef.current?.click();
    } catch (err) {
      console.error("Failed to open file picker:", err);
      setError("Unable to open the file picker. Please try again.");
    }
  }, []);

  const handleUploadDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(false);
      void routeSelectedFile(event.dataTransfer.files?.[0] ?? null);
    },
    [routeSelectedFile],
  );

  const handleUploadDragOver = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      if (!isDragging) setIsDragging(true);
    },
    [isDragging],
  );

  const handleUploadDragLeave = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setIsDragging(false);
    }
  }, []);

  const handleUploadKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openUploadPicker();
      }
    },
    [openUploadPicker],
  );

  return (
    <>
      <div className="mt-10 grid grid-cols-1 gap-3 pb-10 sm:grid-cols-2 sm:gap-6">
        <button
          type="button"
          onClick={openCameraPicker}
          className="group relative min-w-0 overflow-hidden rounded-[1.5rem] border border-white/50 bg-[#221b38] p-4 text-left shadow-[0_18px_48px_rgba(99,102,241,0.18)] transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-[0_24px_56px_rgba(99,102,241,0.24)] sm:rounded-[2rem] sm:p-8"
        >
          <div className="absolute inset-0">
            <img
              src="/images/snap.webp"
              alt=""
              aria-hidden="true"
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(24,14,42,0.08),rgba(21,15,36,0.2)_34%,rgba(14,12,28,0.56))]" />
          </div>

          <div className="relative flex min-h-[180px] flex-col justify-end sm:min-h-[235px]">
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/78">
              Camera
            </span>
            <span className="mt-2 text-base font-bold text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.3)] sm:text-xl">
              Snap flyer
            </span>
            <span className="mt-2 hidden text-sm text-white/80 sm:block">
              Open the camera and capture the invitation in one shot.
            </span>
          </div>
        </button>

        <div
          role="button"
          tabIndex={0}
          onClick={openUploadPicker}
          onKeyDown={handleUploadKeyDown}
          onDrop={handleUploadDrop}
          onDragOver={handleUploadDragOver}
          onDragLeave={handleUploadDragLeave}
          className={`group relative min-w-0 cursor-pointer overflow-hidden rounded-[1.5rem] border bg-[#221b38] p-4 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 sm:rounded-[2rem] sm:p-8 ${
            isDragging
              ? "border-indigo-300 shadow-[0_24px_56px_rgba(99,102,241,0.22)]"
              : "border-white/50 hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-[0_18px_48px_rgba(99,102,241,0.18)]"
          }`}
        >
          <div className="absolute inset-0">
            <img
              src="/images/upload.webp"
              alt=""
              aria-hidden="true"
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div
              className={`absolute inset-0 ${
                isDragging
                  ? "bg-[linear-gradient(180deg,rgba(49,46,129,0.12),rgba(49,46,129,0.2)_34%,rgba(30,27,75,0.44))]"
                  : "bg-[linear-gradient(180deg,rgba(24,14,42,0.08),rgba(21,15,36,0.18)_34%,rgba(14,12,28,0.48))]"
              }`}
            />
          </div>

          <div className="relative flex min-h-[180px] flex-col justify-end sm:min-h-[235px]">
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/78">
              From device
            </span>
            <span className="mt-2 text-base font-bold text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.3)] sm:text-xl">
              Upload file
            </span>
            <span className="mt-2 hidden text-sm text-white/80 sm:block">
              {isDragging
                ? "Drop it here to start scanning."
                : "A photo, screenshot, or PDF from your phone or computer."}
            </span>
            {error ? <span className="mt-3 text-sm font-medium text-rose-200">{error}</span> : null}
          </div>
        </div>
      </div>

      <input
        ref={cameraInputRef}
        type="file"
        accept={getUploadAcceptAttribute("header")}
        capture="environment"
        className="hidden"
        onChange={(event) => {
          void routeSelectedFile(event.target.files?.[0] ?? null);
          event.target.value = "";
        }}
      />
      <input
        ref={uploadInputRef}
        type="file"
        accept={getUploadAcceptAttribute("attachment")}
        className="hidden"
        onChange={(event) => {
          void routeSelectedFile(event.target.files?.[0] ?? null);
          event.target.value = "";
        }}
      />
    </>
  );
}
