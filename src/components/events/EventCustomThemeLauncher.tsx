"use client";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import DesignGenerationProgress from "@/app/live-cards/DesignGenerationProgress";
import { creationIntakeOwner } from "@/lib/create/creation-intake";
import {
  createEventPageFromInformation,
  customEventEditorHref,
  EventInformationSignInRequired,
  eventInformationFilesError,
  readEventInformation,
} from "@/lib/create/event-information-import";
import { UNIFIED_CREATION_ENABLED } from "@/lib/create/release";
import {
  type CustomEventInformation,
  customEventCategory,
  stageCustomEventPage,
} from "@/lib/event-custom-design";
import CreateWithEnvitefyCallout from "./CreateWithEnvitefyCallout";

const EventCustomThemeDialog = dynamic(() => import("./custom/EventCustomThemeDialog"), {
  ssr: false,
});
const AuthModal = dynamic(() => import("@/components/auth/AuthModal"), { ssr: false });

export default function EventCustomThemeLauncher({
  category,
  contained = false,
  compact = false,
  presentation,
}: {
  category: string;
  contained?: boolean;
  /** Render only the Create with Envitefy toolbar button, without the information upload. */
  compact?: boolean;
  presentation?: "hero";
}) {
  const router = useRouter();
  const search = useSearchParams();
  const { data: session, status, update } = useSession();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const pendingFiles = useRef<File[]>([]);
  const resumeUpload = useRef(false);
  const [open, setOpen] = useState(search?.get("customTheme") === "1");
  const picker = useRef<HTMLInputElement>(null);
  const request = useRef<AbortController | null>(null);
  const imported = useRef<CustomEventInformation | null>(null);
  const [importing, setImporting] = useState(false);
  const [stage, setStage] = useState("");
  const [error, setError] = useState("");
  useEffect(() => () => request.current?.abort(), []);
  const key = customEventCategory(category);
  const importInformation = async (files: File[]) => {
    if (!key || (!files.length && !imported.current) || request.current) return;
    pendingFiles.current = files;
    if (status !== "authenticated") {
      setAuthOpen(true);
      return;
    }
    setError("");
    if (UNIFIED_CREATION_ENABLED) {
      setImporting(true);
      try {
        const { stageGalleryInformation } = await import("@/lib/create/gallery-intake");
        router.push(
          await stageGalleryInformation(
            creationIntakeOwner(session?.user),
            key,
            files,
            search?.get("d"),
          ),
        );
      } catch (failure) {
        setError(
          failure instanceof Error
            ? failure.message
            : "Your files could not be retained. Please retry.",
        );
      } finally {
        setImporting(false);
      }
      return;
    }
    if (files.length) {
      const invalid = eventInformationFilesError(files);
      if (invalid) {
        setError(invalid);
        return;
      }
    }
    const controller = new AbortController();
    request.current = controller;
    setImporting(true);
    try {
      if (files.length) {
        imported.current = null;
        setStage("Reading your event information…");
        const page = await readEventInformation(files, key, controller.signal);
        if (controller.signal.aborted) return;
        imported.current = page;
      }
      const extracted = imported.current;
      if (!extracted || controller.signal.aborted) return;
      setStage("Creating your event page and theme…");
      const token = await createEventPageFromInformation(
        extracted,
        controller.signal,
        search?.get("d"),
      );
      if (!controller.signal.aborted) router.push(customEventEditorHref(key, token));
    } catch (failure) {
      if (!controller.signal.aborted) {
        if (failure instanceof EventInformationSignInRequired) {
          pendingFiles.current = imported.current ? [] : files;
          setAuthOpen(true);
        } else setError(failure instanceof Error ? failure.message : "Please retry the upload.");
      }
    } finally {
      if (request.current === controller) {
        request.current = null;
        setImporting(false);
      }
    }
  };
  useEffect(() => {
    if (status === "authenticated" && resumeUpload.current && !authOpen) {
      resumeUpload.current = false;
      void importInformation(pendingFiles.current);
    }
  }, [status, authOpen]);
  if (!key) return null;
  return (
    <div
      className={
        compact || presentation === "hero"
          ? "min-w-0"
          : contained
            ? "my-4 sm:my-8"
            : "mx-auto max-w-[1500px] px-5 py-4 sm:px-8 sm:py-8 lg:px-12"
      }
    >
      {!importing && (
        <CreateWithEnvitefyCallout
          category={key}
          compact={compact}
          presentation={presentation}
          onClick={() => setOpen(true)}
          onImport={compact ? undefined : () => picker.current?.click()}
        />
      )}
      <input
        ref={picker}
        type="file"
        accept={
          UNIFIED_CREATION_ENABLED
            ? "image/jpeg,image/png,image/webp,application/pdf"
            : "image/jpeg,image/png,image/webp"
        }
        multiple
        className="hidden"
        aria-label={
          UNIFIED_CREATION_ENABLED ? "Upload event information" : "Upload event information images"
        }
        onChange={(event) => {
          const files = Array.from(event.target.files || []);
          event.target.value = "";
          void importInformation(files);
        }}
      />
      {importing &&
        (UNIFIED_CREATION_ENABLED ? (
          <p className="mt-4 text-sm" role="status">
            Keeping your files ready…
          </p>
        ) : (
          <div className="mt-4" aria-busy="true">
            <DesignGenerationProgress
              stage="generating"
              title="Creating your event page"
              description="Your event details, theme and artwork are coming together."
              statusText={stage}
            />
            <button
              type="button"
              className="mt-3 min-h-11 rounded-full border px-4 text-sm"
              onClick={() => request.current?.abort()}
            >
              Cancel
            </button>
          </div>
        ))}
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {authOpen && (
        <AuthModal
          open
          mode={authMode}
          onModeChange={setAuthMode}
          onClose={() => setAuthOpen(false)}
          allowGoogleAuth={false}
          description="Sign in to continue. Your uploaded event information is kept here."
          onAuthenticated={async () => {
            await update();
            resumeUpload.current = true;
            setAuthOpen(false);
          }}
        />
      )}
      {imported.current && !importing && (
        <button
          type="button"
          className="mt-2 min-h-11 rounded-full border px-4 text-sm"
          onClick={() => void importInformation([])}
        >
          {error ? "Retry creating event page" : "Continue creating event page"}
        </button>
      )}
      {open && status === "authenticated" && (
        <EventCustomThemeDialog
          category={key}
          initialMessage={
            search?.get("themeExpired") === "1"
              ? "That preview is no longer available. Create a new design to continue."
              : undefined
          }
          onClose={() => setOpen(false)}
          onUseDesign={async (page) => {
            const selectedDate = search?.get("d");
            const details =
              selectedDate && !page.details.date && /^\d{4}-\d{2}-\d{2}$/.test(selectedDate)
                ? { ...page.details, date: selectedDate }
                : page.details;
            if (UNIFIED_CREATION_ENABLED) {
              const { prepareGalleryCustomEditor } = await import("@/lib/create/gallery-intake");
              const href = await prepareGalleryCustomEditor(creationIntakeOwner(session?.user), {
                ...page,
                details,
              });
              setOpen(false);
              router.push(href);
              return;
            }
            const token = stageCustomEventPage({ ...page, details });
            setOpen(false);
            router.push(
              `/event/design/customize?category=${key}&themePreview=${encodeURIComponent(token)}`,
            );
          }}
        />
      )}
    </div>
  );
}
