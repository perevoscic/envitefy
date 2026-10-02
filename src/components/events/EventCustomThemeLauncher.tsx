"use client";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { type CustomEventPage, EVENT_DESIGN_REFERENCE_LIMIT, normalizeCustomEventPage, customEventCategory, stageCustomEventPage } from "@/lib/event-custom-design";
import CreateWithEnvitefyCallout from "./CreateWithEnvitefyCallout";

const EventCustomThemeDialog = dynamic(() => import("./custom/EventCustomThemeDialog"), {
  ssr: false,
});
const EventCustomEditor = dynamic(() => import("./custom/EventCustomEditor"), { ssr: false });

export default function EventCustomThemeLauncher({
  category,
  contained = false,
}: {
  category: string;
  contained?: boolean;
}) {
  const router = useRouter();
  const search = useSearchParams();
  const { status } = useSession();
  const [open, setOpen] = useState(search?.get("customTheme") === "1");
  const picker = useRef<HTMLInputElement>(null);
  const request = useRef<AbortController | null>(null);
  const [imported, setImported] = useState<CustomEventPage | null>(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => () => request.current?.abort(), []);
  const key = customEventCategory(category);
  const importInformation = async (files: File[]) => {
    if (!key || !files.length || request.current) return;
    setError("");
    if (files.length > 3 || files.some((file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > EVENT_DESIGN_REFERENCE_LIMIT)) {
      setError("Choose up to three JPG, PNG or WebP images, up to 2 MB each.");
      return;
    }
    const controller = new AbortController();
    request.current = controller;
    setImporting(true);
    try {
      const images = await Promise.all(files.map((file) => new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("That image could not be read."));
        reader.onerror = () => reject(new Error("That image could not be read."));
        reader.readAsDataURL(file);
      })));
      if (controller.signal.aborted) return;
      const response = await fetch("/api/event-themes/generate", {
        method: "POST", credentials: "include", signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "information", category: key, prompt: "Read the uploaded event information and populate every supplied event field and section.", informationImages: images }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "The event information could not be read. Please retry.");
      const page = normalizeCustomEventPage(result);
      if (!page || page.category !== key) throw new Error("The event information could not be read. Please retry.");
      if (!controller.signal.aborted) setImported(page);
    } catch (failure) {
      if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : "Please retry the upload.");
    } finally {
      if (request.current === controller) { request.current = null; setImporting(false); }
    }
  };
  if (!key) return null;
  return (
    <div className={contained ? "my-4 sm:my-8" : "mx-auto max-w-[1500px] px-5 py-4 sm:px-8 sm:py-8 lg:px-12"}>
      {!imported && <CreateWithEnvitefyCallout category={key} onClick={() => setOpen(true)} onImport={() => { if (!importing) picker.current?.click(); }} />}
      <input ref={picker} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" aria-label="Upload event information images" onChange={(event) => { const files = Array.from(event.target.files || []); event.target.value = ""; void importInformation(files); }} />
      {importing && <p role="status" className="mt-3 text-sm">Reading your event information…</p>}
      {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
      {imported && <EventCustomEditor initialPage={imported} />}
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
