"use client";

import { useCallback, useRef, useState, type DragEvent, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { readFileAsDataUrl } from "@/utils/thumbnail";

type SnapUploadWindow = Window & {
  __pendingSnapUpload?: {
    file: File;
    previewUrl: string | null;
  } | null;
};

function isSupportedUpload(file: File) {
  return file.type.startsWith("image/") || file.type === "application/pdf";
}

export default function UploadDropCard() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const queueUpload = useCallback(
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
      (window as SnapUploadWindow).__pendingSnapUpload = { file, previewUrl };
      router.push("/?action=upload");
    },
    [router]
  );

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(false);
      void queueUpload(event.dataTransfer.files?.[0] ?? null);
    },
    [queueUpload]
  );

  const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!isDragging) setIsDragging(true);
  }, [isDragging]);

  const handleDragLeave = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setIsDragging(false);
    }
  }, []);

  const openPicker = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openPicker();
      }
    },
    [openPicker]
  );

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={openPicker}
        onKeyDown={handleKeyDown}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`group flex cursor-pointer flex-col rounded-[2rem] border bg-white p-8 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 ${
          isDragging
            ? "border-indigo-400 bg-indigo-50/40 shadow-[0_24px_56px_rgba(99,102,241,0.16)]"
            : "border-[#e5e6ef] hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-[0_18px_48px_rgba(99,102,241,0.1)]"
        }`}
      >
        <span className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 ring-1 ring-slate-200 transition group-hover:bg-indigo-50 group-hover:text-indigo-600">
          <Upload className="h-7 w-7" strokeWidth={2} aria-hidden />
        </span>
        <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400 group-hover:text-indigo-500">
          From device
        </span>
        <span className="mt-2 text-xl font-bold text-[#0f1935]">
          Upload file
        </span>
        <span className="mt-2 text-sm text-[#66677f]">
          {isDragging
            ? "Drop it here to start scanning."
            : "Click or drag and drop a photo, screenshot, or PDF from your phone or computer."}
        </span>
        {error ? (
          <span className="mt-3 text-sm font-medium text-rose-600">{error}</span>
        ) : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(event) => {
          void queueUpload(event.target.files?.[0] ?? null);
          event.target.value = "";
        }}
      />
    </>
  );
}
