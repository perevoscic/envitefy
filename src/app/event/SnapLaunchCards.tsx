"use client";

import { Camera, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { type DragEvent, type KeyboardEvent, useCallback, useRef, useState } from "react";
import { savePendingSnapUpload } from "@/lib/pending-snap-upload";
import { readFileAsDataUrl } from "@/utils/thumbnail";

function isSupportedUpload(file: File) {
  return file.type.startsWith("image/") || file.type === "application/pdf";
}

export default function SnapLaunchCards() {
  const router = useRouter();
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const routeSelectedFile = useCallback(
    async (file: File | null) => {
      if (!file) return;
      if (!isSupportedUpload(file)) {
        setError("Please use an image or PDF file.");
        return;
      }

      setError(null);
      let previewUrl: string | null = null;
      if (file.type.startsWith("image/")) {
        try {
          previewUrl = await readFileAsDataUrl(file);
        } catch {
          previewUrl = null;
        }
      }

      await savePendingSnapUpload({ file, previewUrl });
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
      <div className="mt-10 grid grid-cols-2 gap-3 pb-10 sm:gap-6">
        <button
          type="button"
          onClick={openCameraPicker}
          className="group flex min-w-0 flex-col rounded-[1.5rem] border-2 border-indigo-200 bg-white p-4 text-left shadow-[0_18px_48px_rgba(99,102,241,0.12)] transition hover:-translate-y-0.5 hover:border-indigo-400 hover:shadow-[0_24px_56px_rgba(99,102,241,0.18)] sm:rounded-[2rem] sm:p-8"
        >
          <span className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100 transition group-hover:bg-indigo-100 sm:mb-4 sm:h-14 sm:w-14">
            <Camera className="h-5 w-5 sm:h-7 sm:w-7" strokeWidth={2} aria-hidden />
          </span>
          <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-indigo-500">
            Camera
          </span>
          <span className="mt-2 text-base font-bold text-[#0f1935] sm:text-xl">Snap flyer</span>
          <span className="mt-2 hidden text-sm text-[#66677f] sm:block">
            Open the camera and capture the invitation in one shot.
          </span>
        </button>

        <div
          role="button"
          tabIndex={0}
          onClick={openUploadPicker}
          onKeyDown={handleUploadKeyDown}
          onDrop={handleUploadDrop}
          onDragOver={handleUploadDragOver}
          onDragLeave={handleUploadDragLeave}
          className={`group flex min-w-0 cursor-pointer flex-col rounded-[1.5rem] border bg-white p-4 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 sm:rounded-[2rem] sm:p-8 ${
            isDragging
              ? "border-indigo-400 bg-indigo-50/40 shadow-[0_24px_56px_rgba(99,102,241,0.16)]"
              : "border-[#e5e6ef] hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-[0_18px_48px_rgba(99,102,241,0.1)]"
          }`}
        >
          <span className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 ring-1 ring-slate-200 transition group-hover:bg-indigo-50 group-hover:text-indigo-600 sm:mb-4 sm:h-14 sm:w-14">
            <Upload className="h-5 w-5 sm:h-7 sm:w-7" strokeWidth={2} aria-hidden />
          </span>
          <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400 group-hover:text-indigo-500">
            From device
          </span>
          <span className="mt-2 text-base font-bold text-[#0f1935] sm:text-xl">Upload file</span>
          <span className="mt-2 hidden text-sm text-[#66677f] sm:block">
            {isDragging
              ? "Drop it here to start scanning."
              : "Click or drag and drop a photo, screenshot, or PDF from your phone or computer."}
          </span>
          {error ? <span className="mt-3 text-sm font-medium text-rose-600">{error}</span> : null}
        </div>
      </div>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
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
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(event) => {
          void routeSelectedFile(event.target.files?.[0] ?? null);
          event.target.value = "";
        }}
      />
    </>
  );
}
