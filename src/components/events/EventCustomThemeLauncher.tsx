"use client";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { type CustomEventPage, EVENT_DESIGN_REFERENCE_LIMIT, normalizeCustomEventPage, customEventCategory, stageCustomEventPage } from "@/lib/event-custom-design";
import CreateWithEnvitefyCallout from "./CreateWithEnvitefyCallout";
import DesignGenerationProgress from "@/app/live-cards/DesignGenerationProgress";

const EventCustomThemeDialog = dynamic(() => import("./custom/EventCustomThemeDialog"), {
  ssr: false,
});
const AuthModal = dynamic(() => import("@/components/auth/AuthModal"), { ssr: false });
class UploadSignInRequired extends Error {}

export default function EventCustomThemeLauncher({
  category,
  contained = false,
}: {
  category: string;
  contained?: boolean;
}) {
  const router = useRouter();
  const search = useSearchParams();
  const { status, update } = useSession();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const pendingFiles = useRef<File[]>([]);
  const resumeUpload = useRef(false);
  const [open, setOpen] = useState(search?.get("customTheme") === "1");
  const picker = useRef<HTMLInputElement>(null);
  const request = useRef<AbortController | null>(null);
  const imported = useRef<CustomEventPage | null>(null);
  const [importing, setImporting] = useState(false);
  const [stage, setStage] = useState("");
  const [error, setError] = useState("");
  useEffect(() => () => request.current?.abort(), []);
  const key = customEventCategory(category);
  const importInformation = async (files: File[]) => {
    if (!key || (!files.length && !imported.current) || request.current) return;
    pendingFiles.current = files;
    if (status !== "authenticated") { setAuthOpen(true); return; }
    setError("");
    if (files.length > 3 || files.some((file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > EVENT_DESIGN_REFERENCE_LIMIT)) {
      setError("Choose up to three JPG, PNG or WebP images, up to 2 MB each.");
      return;
    }
    const controller = new AbortController();
    request.current = controller;
    setImporting(true);
    const generate = async (body: object) => {
      const deadline = Date.now() + 270_000;
      while (true) {
        const response = await fetch("/api/event-themes/generate", {
          method: "POST", credentials: "include", signal: controller.signal,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const result = await response.json();
        if (response.status === 401) throw new UploadSignInRequired();
        if (response.status !== 429 || result.code !== "THEME_IN_PROGRESS") return { response, result };
        if (Date.now() >= deadline) throw new Error("The previous creation is taking longer than expected. Your uploaded details are kept here. Please retry shortly.");
        await new Promise<void>((resolve, reject) => {
          const abort = () => { clearTimeout(timer); reject(controller.signal.reason); };
          const timer = setTimeout(() => { controller.signal.removeEventListener("abort", abort); resolve(); }, 2000);
          controller.signal.addEventListener("abort", abort, { once: true });
          if (controller.signal.aborted) abort();
        });
      }
    };
    try {
      if (files.length) {
      imported.current = null;
      setStage("Reading your event information…");
      const images = await Promise.all(files.map((file) => new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("That image could not be read."));
        reader.onerror = () => reject(new Error("That image could not be read."));
        reader.readAsDataURL(file);
      })));
      if (controller.signal.aborted) return;
      const { response, result } = await generate({ mode: "information", category: key, prompt: "Read the uploaded event information and populate every supplied event field and section.", informationImages: images });
      if (!response.ok) throw new Error(result.error || "The event information could not be read. Please retry.");
      const page = normalizeCustomEventPage(result);
      if (!page || page.category !== key) throw new Error("The event information could not be read. Please retry.");
      if (controller.signal.aborted) return;
      imported.current = page;
      }
      const extracted = imported.current;
      if (!extracted || controller.signal.aborted) return;
      setStage("Creating your event page and theme…");
      const { response, result } = await generate({
          mode: "design", category: key,
          prompt: "Create a complete, polished event page with a distinctive theme and artwork based on the supplied event title, description, activities and sections. Choose the layout, typography and palette automatically to suit this event. Preserve every supplied fact and section; do not invent missing event information.",
          currentDesign: extracted.design, currentDetails: extracted.details,
      });
      if (!response.ok) throw new Error(result.error || "Your event theme could not be created. Retry to continue with your uploaded details.");
      const generated = normalizeCustomEventPage(result);
      if (!generated || generated.category !== key) throw new Error("Your event theme could not be read. Retry to continue with your uploaded details.");
      if (!controller.signal.aborted) {
        const selectedDate = search?.get("d");
        const details = selectedDate && !extracted.details.date && /^\d{4}-\d{2}-\d{2}$/.test(selectedDate)
          ? { ...extracted.details, date: selectedDate } : extracted.details;
        const token = stageCustomEventPage({ ...generated, details });
        router.push(`/event/design/customize?category=${key}&themePreview=${encodeURIComponent(token)}&ready=1`);
      }
    } catch (failure) {
      if (!controller.signal.aborted) {
        if (failure instanceof UploadSignInRequired) {
          pendingFiles.current = imported.current ? [] : files;
          setAuthOpen(true);
        } else setError(failure instanceof Error ? failure.message : "Please retry the upload.");
      }
    } finally {
      if (request.current === controller) { request.current = null; setImporting(false); }
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
    <div className={contained ? "my-4 sm:my-8" : "mx-auto max-w-[1500px] px-5 py-4 sm:px-8 sm:py-8 lg:px-12"}>
      {!importing && <CreateWithEnvitefyCallout category={key} onClick={() => setOpen(true)} onImport={() => picker.current?.click()} />}
      <input ref={picker} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" aria-label="Upload event information images" onChange={(event) => { const files = Array.from(event.target.files || []); event.target.value = ""; void importInformation(files); }} />
      {importing && <div className="mt-4" aria-busy="true"><DesignGenerationProgress stage="generating" title="Creating your event page" description="Your event details, theme and artwork are coming together." statusText={stage} /><button type="button" className="mt-3 min-h-11 rounded-full border px-4 text-sm" onClick={() => request.current?.abort()}>Cancel</button></div>}
      {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
      {authOpen && <AuthModal open mode={authMode} onModeChange={setAuthMode} onClose={() => setAuthOpen(false)} allowGoogleAuth={false} description="Sign in to continue. Your uploaded event information is kept here." onAuthenticated={async () => { await update(); resumeUpload.current = true; setAuthOpen(false); }} />}
      {imported.current && !importing && <button type="button" className="mt-2 min-h-11 rounded-full border px-4 text-sm" onClick={() => void importInformation([])}>{error ? "Retry creating event page" : "Continue creating event page"}</button>}
      {open && status === "authenticated" && (
        <EventCustomThemeDialog
          category={key}
          initialMessage={
            search?.get("themeExpired") === "1"
              ? "That preview is no longer available. Create a new design to continue."
              : undefined
          }
          onClose={() => setOpen(false)}
          onUseDesign={(page) => {
            const selectedDate = search?.get("d");
            const details =
              selectedDate && !page.details.date && /^\d{4}-\d{2}-\d{2}$/.test(selectedDate)
                ? { ...page.details, date: selectedDate }
                : page.details;
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
