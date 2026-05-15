"use client";

import { Camera, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { type DragEvent, type KeyboardEvent, useCallback, useRef, useState } from "react";
import { savePendingSnapUpload } from "@/lib/pending-snap-upload";
import { cn } from "@/lib/utils";
import { createClientAttemptId, reportClientLog } from "@/utils/client-log";
import { getUploadAcceptAttribute, validateClientUploadFile } from "@/utils/media-upload-client";

const snapLaunchTileClass =
  "group relative flex h-28 w-28 flex-col items-center justify-center rounded-3xl bg-[#eff1f8] transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a8b0bc] focus-visible:ring-offset-4 focus-visible:ring-offset-[#eff1f8] disabled:cursor-not-allowed disabled:opacity-55 sm:h-40 sm:w-40 sm:rounded-[2.5rem] max-md:h-[clamp(6rem,17dvh,8rem)] max-md:w-[clamp(6rem,17dvh,8rem)]";

const snapLaunchIconClass =
  "h-8 w-8 transition-transform duration-300 sm:h-10 sm:w-10 max-h-[620px]:max-md:h-7 max-h-[620px]:max-md:w-7";

const snapLaunchLabelClass =
  "text-center text-[10px] font-bold uppercase leading-[1.35] tracking-widest transition-colors sm:text-xs";

type SnapLaunchCardsProps = {
  processInPage?: boolean;
  uploadActionHref?: string;
};

export default function SnapLaunchCards({
  processInPage = false,
  uploadActionHref = "/?action=upload",
}: SnapLaunchCardsProps) {
  const router = useRouter();
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getSnapProcessorWindow = useCallback(() => {
    if (!processInPage || typeof window === "undefined") return null;
    return window as Window & {
      __openSnapCamera?: () => void;
      __openSnapUpload?: () => void;
      __processSnapUploadFile?: (file: File) => void;
    };
  }, [processInPage]);

  const routeSelectedFile = useCallback(
    async (file: File | null) => {
      if (!file) return;
      const validationError = validateClientUploadFile(file, "attachment");
      if (validationError) {
        setError(validationError);
        return;
      }

      setError(null);
      const processorWindow = getSnapProcessorWindow();
      if (processorWindow?.__processSnapUploadFile) {
        processorWindow.__processSnapUploadFile(file);
        return;
      }
      if (processInPage) {
        setError("Upload is still getting ready. Please try again.");
        return;
      }

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

      router.push(uploadActionHref);
    },
    [getSnapProcessorWindow, processInPage, router, uploadActionHref],
  );

  const openCameraPicker = useCallback(() => {
    setError(null);
    const processorWindow = getSnapProcessorWindow();
    if (processorWindow?.__openSnapCamera) {
      processorWindow.__openSnapCamera();
      return;
    }
    if (processInPage) {
      setError("Camera is still getting ready. Please try again.");
      return;
    }
    try {
      cameraInputRef.current?.click();
    } catch (err) {
      console.error("Failed to open camera picker:", err);
      setError("Unable to open the camera. Please try again.");
    }
  }, [getSnapProcessorWindow, processInPage]);

  const openUploadPicker = useCallback(() => {
    setError(null);
    const processorWindow = getSnapProcessorWindow();
    if (processorWindow?.__openSnapUpload) {
      processorWindow.__openSnapUpload();
      return;
    }
    if (processInPage) {
      setError("Upload is still getting ready. Please try again.");
      return;
    }
    try {
      uploadInputRef.current?.click();
    } catch (err) {
      console.error("Failed to open file picker:", err);
      setError("Unable to open the file picker. Please try again.");
    }
  }, [getSnapProcessorWindow, processInPage]);

  const handleUploadDrop = useCallback(
    (event: DragEvent<HTMLButtonElement>) => {
      event.preventDefault();
      setIsDragging(false);
      void routeSelectedFile(event.dataTransfer.files?.[0] ?? null);
    },
    [routeSelectedFile],
  );

  const handleUploadDragOver = useCallback(
    (event: DragEvent<HTMLButtonElement>) => {
      event.preventDefault();
      if (!isDragging) setIsDragging(true);
    },
    [isDragging],
  );

  const handleUploadDragLeave = useCallback((event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setIsDragging(false);
    }
  }, []);

  const handleUploadKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openUploadPicker();
      }
    },
    [openUploadPicker],
  );

  return (
    <>
      <div
        className="mx-auto mt-10 grid w-full max-w-[22rem] grid-cols-2 content-center justify-items-center gap-8 pb-10 text-center sm:max-w-[25rem] sm:gap-12 max-md:mt-8 max-md:gap-[clamp(0.9rem,2.2dvh,1.4rem)]"
        role="group"
        aria-label="Choose snap or upload"
      >
        <button
          type="button"
          onClick={openCameraPicker}
          className={cn(
            snapLaunchTileClass,
            "text-[#9a9daa] shadow-[10px_10px_20px_#d1d9e6,-10px_-10px_20px_#ffffff] hover:text-[#7f8290] active:scale-95",
          )}
          aria-label="Snap flyer"
        >
          <Camera
            className={cn(snapLaunchIconClass, "group-hover:scale-105")}
            strokeWidth={2}
            aria-hidden="true"
          />
          <span className="relative mt-2 flex max-w-[6.75rem] justify-center sm:mt-4 sm:max-w-[8.5rem] max-h-[620px]:max-md:mt-1.5">
            <span className={snapLaunchLabelClass}>
              Snap flyer
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={openUploadPicker}
          onKeyDown={handleUploadKeyDown}
          onDrop={handleUploadDrop}
          onDragOver={handleUploadDragOver}
          onDragLeave={handleUploadDragLeave}
          className={cn(
            snapLaunchTileClass,
            isDragging
              ? "scale-95 text-[#5c5be5] shadow-[inset_6px_6px_12px_#d1d9e6,inset_-6px_-6px_12px_#ffffff]"
              : "text-[#9a9daa] shadow-[10px_10px_20px_#d1d9e6,-10px_-10px_20px_#ffffff] hover:text-[#7f8290] active:scale-95",
          )}
          aria-label="Upload file"
        >
          <Upload
            className={cn(
              snapLaunchIconClass,
              isDragging ? "scale-110" : "group-hover:scale-105",
            )}
            strokeWidth={2}
            aria-hidden="true"
          />
          <span className="relative mt-2 flex max-w-[6.75rem] justify-center sm:mt-4 sm:max-w-[8.5rem] max-h-[620px]:max-md:mt-1.5">
            <span className={snapLaunchLabelClass}>
              Upload file
            </span>
            {isDragging ? (
              <span className="absolute -bottom-1 left-0 right-0 h-[2px] rounded-full bg-current" />
            ) : null}
          </span>
        </button>
      </div>
      {error ? (
        <p className="mx-auto -mt-4 mb-8 max-w-md text-center text-sm font-medium text-red-600">
          {error}
        </p>
      ) : null}

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
