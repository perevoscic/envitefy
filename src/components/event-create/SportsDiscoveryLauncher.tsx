"use client";

import { ArrowRight, CheckCircle2, FileUp, Globe2, PencilLine, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import DiscoveryProgressPanel, {
  type DiscoveryProgressTheme,
} from "@/components/event-create/DiscoveryProgressPanel";
import { resolveDiscoveryClientParseTimeoutMs } from "@/lib/discovery-budget";
import { buildSportEventCustomizeHref, getSportEventPreset } from "@/lib/sport-event-presets";

type SportsDiscoveryLauncherProps = {
  sport: string;
};

type SourceInput = { file?: File; url?: string };

const SPORTS_PROGRESS_THEME: DiscoveryProgressTheme = {
  badgeBackground: "rgba(255,255,255,0.16)",
  badgeBorder: "rgba(255,255,255,0.24)",
  baseBackground: "#352c66",
  borderColor: "#675cf4",
  cancelBorderColor: "#ddd8ff",
  cancelHoverBackground: "#f3f1ff",
  cancelTextColor: "#4238b4",
  fillEnd: "#a79cff",
  fillMiddle: "#7668ff",
  fillStart: "#5f55ff",
  textColor: "#ffffff",
};

function progressLabel(progress: number, sourceType: "file" | "url") {
  if (progress < 18)
    return sourceType === "file" ? "Uploading event file..." : "Checking event page...";
  if (progress < 45) return "Reading schedule and event details...";
  if (progress < 72) return "Detecting sport and event format...";
  if (progress < 90) return "Organizing venue, dates, and links...";
  if (progress < 100) return "Building your editable event page...";
  return "Opening builder...";
}

export default function SportsDiscoveryLauncher({ sport }: SportsDiscoveryLauncherProps) {
  const router = useRouter();
  const preset = getSportEventPreset(sport);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const uploadXhrRef = useRef<XMLHttpRequest | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const eventIdRef = useRef<string | null>(null);
  const cancelledRef = useRef(false);
  const [activeMethod, setActiveMethod] = useState<"upload" | "url" | "manual">("upload");
  const [busyMethod, setBusyMethod] = useState<"upload" | "url" | null>(null);
  const [progress, setProgress] = useState(0);
  const [sourceUrl, setSourceUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");

  const cancelServerWork = async (eventId: string | null) => {
    if (!eventId) return;
    await fetch(`/api/discovery/${eventId}/cancel`, {
      method: "POST",
      credentials: "include",
      keepalive: true,
    }).catch(() => {});
  };

  const cancel = () => {
    cancelledRef.current = true;
    uploadXhrRef.current?.abort();
    uploadXhrRef.current = null;
    abortRef.current?.abort();
    abortRef.current = null;
    void cancelServerWork(eventIdRef.current);
    eventIdRef.current = null;
    setBusyMethod(null);
    setProgress(0);
    setError("");
  };

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      uploadXhrRef.current?.abort();
      abortRef.current?.abort();
      void cancelServerWork(eventIdRef.current);
    };
  }, []);

  const uploadSource = (formData: FormData) =>
    new Promise<{ eventId: string }>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      uploadXhrRef.current = xhr;
      xhr.open("POST", "/api/discovery/intake", true);
      xhr.withCredentials = true;
      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable) return;
        setProgress(5 + (event.loaded / event.total) * 20);
      };
      xhr.onabort = () => reject(new DOMException("Cancelled", "AbortError"));
      xhr.onerror = () => reject(new Error("Network error while uploading the file."));
      xhr.onload = () => {
        uploadXhrRef.current = null;
        try {
          const json = JSON.parse(xhr.responseText || "{}") as {
            eventId?: string;
            error?: string;
          };
          if (xhr.status >= 200 && xhr.status < 300 && json.eventId) {
            resolve({ eventId: json.eventId });
            return;
          }
          reject(new Error(json.error || "Could not read this event source."));
        } catch {
          reject(new Error("The server returned an invalid upload response."));
        }
      };
      xhr.send(formData);
    });

  const startDiscovery = async ({ file, url }: SourceInput) => {
    cancelledRef.current = false;
    setError("");
    setProgress(file ? 3 : 8);
    const sourceType = file ? "file" : "url";
    let eventId = "";
    if (file) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("workflow", "sports");
      formData.append("activityProfile", preset.key);
      const intake = await uploadSource(formData);
      eventId = intake.eventId;
    } else {
      abortRef.current = new AbortController();
      const response = await fetch("/api/discovery/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          url,
          workflow: "sports",
          activityProfile: preset.key,
        }),
        signal: abortRef.current.signal,
      });
      const json = (await response.json().catch(() => ({}))) as {
        eventId?: string;
        error?: string;
      };
      if (!response.ok || !json.eventId) {
        throw new Error(json.error || "Could not sync this event page.");
      }
      eventId = json.eventId;
    }
    eventIdRef.current = eventId;
    setProgress(28);
    abortRef.current = new AbortController();
    const timeoutMs = resolveDiscoveryClientParseTimeoutMs(sourceType);
    const startedAt = Date.now();
    const runResponse = await fetch(`/api/discovery/${eventId}/run`, {
      method: "POST",
      credentials: "include",
      signal: abortRef.current.signal,
    });
    const runJson = await runResponse.json().catch(() => ({}));
    if (!runResponse.ok) {
      throw new Error(runJson?.error || "Could not start event discovery.");
    }

    while (Date.now() - startedAt < timeoutMs) {
      if (cancelledRef.current) throw new DOMException("Cancelled", "AbortError");
      const statusResponse = await fetch(`/api/discovery/${eventId}/status`, {
        credentials: "include",
        cache: "no-store",
        signal: abortRef.current.signal,
      });
      const status = await statusResponse.json().catch(() => ({}));
      if (!statusResponse.ok) throw new Error(status?.error || "Could not check event status.");
      if (status?.errorCode) throw new Error(status?.errorMessage || "Event discovery failed.");
      const stageProgress: Record<string, number> = {
        ingested: 30,
        extract: 42,
        parse: 62,
        map: 82,
        enrich: 94,
        compose_public: 97,
        review_ready: 100,
      };
      setProgress(stageProgress[status?.processingStage] || 35);
      if (status?.draftReady || status?.builderReady) break;
      await new Promise((resolve) => window.setTimeout(resolve, 900));
    }
    if (Date.now() - startedAt >= timeoutMs) {
      throw new Error("Event discovery is taking longer than expected. Please retry.");
    }
    setProgress(100);
    eventIdRef.current = null;
    const params = new URLSearchParams({
      edit: eventId,
      new: "1",
      sport: preset.key,
    });
    router.push(`/event/sport-events/customize?${params.toString()}`);
  };

  const run = async (input: SourceInput, method: "upload" | "url") => {
    setBusyMethod(method);
    try {
      await startDiscovery(input);
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "AbortError") return;
      setError(caught instanceof Error ? caught.message : "Could not create the event page.");
      eventIdRef.current = null;
    } finally {
      setBusyMethod(null);
      abortRef.current = null;
    }
  };

  const manualHref = buildSportEventCustomizeHref(preset.key);
  const cardClass = (method: typeof activeMethod) =>
    `flex min-h-[20rem] flex-col rounded-[1.6rem] border bg-white p-5 transition ${
      activeMethod === method
        ? "border-[#675cf4] shadow-[0_18px_55px_rgba(95,85,255,0.15)] ring-1 ring-[#675cf4]"
        : "border-[#e5e1ee] hover:-translate-y-0.5 hover:border-[#bdb5f5]"
    }`;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <section className={cardClass("upload")} onClick={() => setActiveMethod("upload")}>
        <div className="flex items-center justify-between">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f0eeff] text-[#5f55ff]">
            <FileUp className="h-5 w-5" />
          </span>
          {activeMethod === "upload" ? <CheckCircle2 className="h-5 w-5 text-[#5f55ff]" /> : null}
        </div>
        <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#8c86a0]">
          Fastest setup
        </p>
        <h2 className="mt-2 text-2xl font-black">Upload event file</h2>
        <p className="mt-2 text-sm leading-6 text-[#625b70]">
          Use a PDF, schedule, flyer, or parent packet. We’ll fill the most important details.
        </p>
        <div className="mt-auto pt-5">
          {busyMethod === "upload" ? (
            <DiscoveryProgressPanel
              cancelLabel="Cancel upload"
              label={progressLabel(progress, "file")}
              onCancel={cancel}
              progress={progress}
              theme={SPORTS_PROGRESS_THEME}
            />
          ) : (
            <button
              type="button"
              className="w-full rounded-2xl border-2 border-dashed border-[#d9d4e8] bg-[#faf9fd] px-4 py-5 text-sm font-bold text-[#4a40c7] hover:border-[#675cf4]"
              disabled={Boolean(busyMethod)}
              onClick={(event) => {
                event.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              Choose PDF or image
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,image/png,image/jpeg,image/jpg"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.currentTarget.value = "";
              if (!file) return;
              setFileName(file.name);
              void run({ file }, "upload");
            }}
          />
          {fileName ? (
            <p className="mt-2 truncate text-xs text-[#777086]">Selected: {fileName}</p>
          ) : null}
        </div>
      </section>

      <section className={cardClass("url")} onClick={() => setActiveMethod("url")}>
        <div className="flex items-center justify-between">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eef4ff] text-[#4d66c8]">
            <Globe2 className="h-5 w-5" />
          </span>
          {activeMethod === "url" ? <CheckCircle2 className="h-5 w-5 text-[#5f55ff]" /> : null}
        </div>
        <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#8c86a0]">
          Sync from web
        </p>
        <h2 className="mt-2 text-2xl font-black">Paste a live URL</h2>
        <p className="mt-2 text-sm leading-6 text-[#625b70]">
          Use a public team, tournament, schedule, or event page.
        </p>
        <div className="mt-auto space-y-3 pt-5">
          <input
            type="url"
            value={sourceUrl}
            onChange={(event) => setSourceUrl(event.target.value)}
            placeholder="https://team.org/schedule"
            className="w-full rounded-2xl border border-[#d9d4e8] bg-white px-4 py-3 text-sm outline-none focus:border-[#675cf4]"
          />
          {busyMethod === "url" ? (
            <DiscoveryProgressPanel
              cancelLabel="Cancel sync"
              label={progressLabel(progress, "url")}
              onCancel={cancel}
              progress={progress}
              theme={SPORTS_PROGRESS_THEME}
            />
          ) : (
            <button
              type="button"
              disabled={Boolean(busyMethod)}
              onClick={(event) => {
                event.stopPropagation();
                const url = sourceUrl.trim();
                try {
                  new URL(url);
                } catch {
                  setError("Enter a valid public event URL.");
                  return;
                }
                void run({ url }, "url");
              }}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#5f55ff] px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
            >
              Sync URL <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </section>

      <section className={cardClass("manual")} onClick={() => setActiveMethod("manual")}>
        <div className="flex items-center justify-between">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fff5df] text-[#9a6414]">
            <PencilLine className="h-5 w-5" />
          </span>
          {activeMethod === "manual" ? <CheckCircle2 className="h-5 w-5 text-[#5f55ff]" /> : null}
        </div>
        <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#8c86a0]">
          Full control
        </p>
        <h2 className="mt-2 text-2xl font-black">Build it yourself</h2>
        <p className="mt-2 text-sm leading-6 text-[#625b70]">
          Start with a polished {preset.label.toLowerCase()} template and add only what you need.
        </p>
        <a
          href={manualHref}
          className="mt-auto inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#17111e] px-4 py-3 text-sm font-bold text-white"
          onClick={(event) => event.stopPropagation()}
        >
          Open visual builder <ArrowRight className="h-4 w-4" />
        </a>
      </section>

      {error ? (
        <div className="flex items-start justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 lg:col-span-3">
          <span>{error}</span>
          <button type="button" aria-label="Dismiss error" onClick={() => setError("")}>
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
