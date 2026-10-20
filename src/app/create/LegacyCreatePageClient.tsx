"use client";

import { ArrowRight, FileText, ImageIcon, Paperclip, Sparkles, Trophy, X } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type DragEvent, type FormEvent, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import DiscoveryProgressPanel, {
  type DiscoveryProgressTheme,
} from "@/components/event-create/DiscoveryProgressPanel";
import { LiveCardIcon } from "@/components/icons/LiveCardIcon";
import { getCreateEventSections } from "@/config/navigation-config";
import { useMenuOptional } from "@/contexts/MenuContext";
import {
  CREATE_CATEGORIES,
  CREATE_SPORT_KEYS,
  type CreateClassification,
  type CreateGuess,
  classifyCreateText,
  createGuessLabel,
  customCategoryForGuess,
  isLikelyUrl,
} from "@/lib/create/create-intent";
import {
  createEventPageFromInformation,
  customEventEditorHref,
  EVENT_INFORMATION_IMAGE_TYPES,
  EventInformationSignInRequired,
  eventInformationFilesError,
  readEventInformation,
  readFileAsDataUrl,
} from "@/lib/create/event-information-import";
import { cancelSportDiscovery, runSportDiscovery, sportDiscoveryStageLabel } from "@/lib/create/run-sport-discovery";
import type { CustomEventCategory, CustomEventPage } from "@/lib/event-custom-design";
import { stageCustomEventPage } from "@/lib/event-custom-design";

const EventCustomThemeDialog = dynamic(() => import("@/components/events/custom/EventCustomThemeDialog"), {
  ssr: false,
});

const PDF_LIMIT = 8 * 1024 * 1024;
const IMAGE_LIMIT = 2 * 1024 * 1024;

const PROGRESS_THEME: DiscoveryProgressTheme = {
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

type Source =
  | { kind: "text"; text: string }
  | { kind: "url"; url: string }
  | { kind: "images"; files: File[] }
  | { kind: "pdf"; file: File };

type Phase =
  | { kind: "idle" }
  | { kind: "reading"; source: Source }
  | { kind: "confirm"; source: Source; classification: CreateClassification | null; showAll: boolean }
  | { kind: "working"; source: Source; guess: CreateGuess; label: string; progress: number; indeterminate: boolean };

const SPORT_HREF = /^\/event\/(gymnastics|football|sport-events)(?:[/?]|$)/;

function sourceKind(source: Source): "file" | "url" {
  return source.kind === "url" ? "url" : "file";
}

function describeSource(source: Source): string {
  if (source.kind === "text") return "your description";
  if (source.kind === "url") return "that link";
  if (source.kind === "pdf") return source.file.name;
  return source.files.length === 1 ? source.files[0].name : `${source.files.length} photos`;
}

function uniqueGuesses(guesses: CreateGuess[]): CreateGuess[] {
  const seen = new Set<string>();
  return guesses.filter((guess) => {
    const key = `${guess.category}:${guess.sport}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default function CreatePageClient() {
  const router = useRouter();
  const menu = useMenuOptional();
  const fileInput = useRef<HTMLInputElement>(null);
  const request = useRef<AbortController | null>(null);
  const discoveryEventId = useRef<string | null>(null);
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [error, setError] = useState("");
  const [dialog, setDialog] = useState<{ category: CustomEventCategory; prompt: string } | null>(null);

  useEffect(
    () => () => {
      request.current?.abort();
      void cancelSportDiscovery(discoveryEventId.current);
    },
    [],
  );

  const createItems = useMemo(() => {
    if (!menu) return [];
    const visibility = menu.featureVisibility;
    return getCreateEventSections(
      visibility.hasLoadedPreferences ? visibility.visibleTemplateKeys : [],
      menu.productScopes,
      visibility.sportPreferences,
      { isAdmin: menu.isAdmin, defaultCreateIntent: menu.defaultCreateIntent },
    ).flatMap((section) => section.items);
  }, [menu]);
  const eventTiles = createItems.filter((item) => !SPORT_HREF.test(item.href) && item.href.startsWith("/event/"));
  const sportItems = createItems.filter((item) => SPORT_HREF.test(item.href));
  const signupItem = createItems.find((item) => item.href.startsWith("/signup-forms"));

  const busy = phase.kind === "reading" || phase.kind === "working";

  const reset = () => {
    request.current?.abort();
    request.current = null;
    void cancelSportDiscovery(discoveryEventId.current);
    discoveryEventId.current = null;
    setPhase({ kind: "idle" });
  };

  const addFiles = (incoming: File[]) => {
    setError("");
    if (!incoming.length) return;
    const pdfs = incoming.filter((file) => file.type === "application/pdf");
    const images = incoming.filter((file) => EVENT_INFORMATION_IMAGE_TYPES.includes(file.type));
    if (pdfs.length + images.length !== incoming.length) {
      setError("Choose a PDF, or JPG, PNG or WebP photos.");
      return;
    }
    if (pdfs.length) {
      if (pdfs.length > 1 || images.length || files.length) {
        setError("Choose one PDF at a time.");
        return;
      }
      if (pdfs[0].size > PDF_LIMIT) {
        setError("Choose a PDF smaller than 8 MB.");
        return;
      }
      setFiles(pdfs);
      return;
    }
    if (files.some((file) => file.type === "application/pdf")) {
      setError("Choose one PDF at a time.");
      return;
    }
    const next = [...files, ...images];
    if (next.length > 5 || next.some((file) => file.size > IMAGE_LIMIT)) {
      setError("Choose up to five photos, up to 2 MB each.");
      return;
    }
    setFiles(next);
  };

  const proceed = async (source: Source, guess: CreateGuess) => {
    setError("");
    const label = createGuessLabel(guess);
    const customCategory = customCategoryForGuess(guess);

    if (source.kind === "text") {
      setPhase({ kind: "idle" });
      setDialog({ category: customCategory, prompt: source.text });
      return;
    }

    const sport = guess.category === "sports" ? guess.sport : null;
    const singleFile = source.kind === "pdf" ? source.file : source.kind === "images" && source.files.length === 1 ? source.files[0] : null;
    if (sport && (source.kind === "url" || singleFile)) {
      const controller = new AbortController();
      request.current = controller;
      setPhase({
        kind: "working",
        source,
        guess,
        label: `${label} detected. ${sportDiscoveryStageLabel(0, sourceKind(source))}`,
        progress: 5,
        indeterminate: false,
      });
      try {
        const href = await runSportDiscovery({
          sport,
          file: singleFile || undefined,
          url: source.kind === "url" ? source.url : undefined,
          signal: controller.signal,
          onEventId: (eventId) => {
            discoveryEventId.current = eventId;
          },
          onProgress: (progress) =>
            setPhase((current) =>
              current.kind === "working"
                ? { ...current, progress, label: `${label} detected. ${sportDiscoveryStageLabel(progress, sourceKind(source))}` }
                : current,
            ),
        });
        discoveryEventId.current = null;
        if (!controller.signal.aborted) router.push(href);
      } catch (failure) {
        if (controller.signal.aborted) return;
        void cancelSportDiscovery(discoveryEventId.current);
        discoveryEventId.current = null;
        setPhase({ kind: "idle" });
        setError(failure instanceof Error ? failure.message : "We couldn't read that. Please try again.");
      } finally {
        if (request.current === controller) request.current = null;
      }
      return;
    }

    if (source.kind === "url") {
      setPhase({ kind: "idle" });
      setError(
        "Links work for team, schedule and meet pages. For other events, add a photo of the invitation or describe it.",
      );
      return;
    }
    if (source.kind === "pdf") {
      setPhase({ kind: "idle" });
      setError(
        `PDFs work for sports schedules and meet packets. For a ${label.toLowerCase()}, add a photo or screenshot of the invitation instead.`,
      );
      return;
    }

    const invalid = eventInformationFilesError(source.files);
    if (invalid) {
      setPhase({ kind: "idle" });
      setError(invalid);
      return;
    }
    const controller = new AbortController();
    request.current = controller;
    setPhase({ kind: "working", source, guess, label: `${label} detected. Reading your event information…`, progress: 30, indeterminate: true });
    try {
      const extracted = await readEventInformation(source.files, customCategory, controller.signal);
      if (controller.signal.aborted) return;
      setPhase((current) =>
        current.kind === "working" ? { ...current, label: `${label} detected. Creating your event page and theme…`, progress: 65 } : current,
      );
      const token = await createEventPageFromInformation(extracted, controller.signal);
      if (!controller.signal.aborted) router.push(customEventEditorHref(customCategory, token));
    } catch (failure) {
      if (controller.signal.aborted) return;
      setPhase({ kind: "idle" });
      setError(
        failure instanceof EventInformationSignInRequired
          ? "Sign in again to continue. Your files are still selected."
          : failure instanceof Error
            ? failure.message
            : "Please retry the upload.",
      );
    } finally {
      if (request.current === controller) request.current = null;
    }
  };

  const decide = (source: Source, classification: CreateClassification | null) => {
    if (classification?.confidence === "high") {
      void proceed(source, classification);
      return;
    }
    setPhase({ kind: "confirm", source, classification, showAll: !classification || classification.category === "general" });
  };

  const submit = async (event?: FormEvent) => {
    event?.preventDefault();
    if (busy) return;
    setError("");
    const text = input.trim();
    let source: Source;
    if (files.length) {
      source = files[0].type === "application/pdf" ? { kind: "pdf", file: files[0] } : { kind: "images", files };
    } else if (isLikelyUrl(text)) {
      source = { kind: "url", url: text };
    } else if (text.length >= 5) {
      source = { kind: "text", text };
    } else {
      setError("Add a file, paste a link, or describe your event in a few words.");
      return;
    }

    // Links and clear descriptions are classified instantly; files are read by Envitefy.
    if (source.kind === "url") {
      const local = classifyCreateText(source.url);
      decide(source, local.category === "sports" ? local : null);
      return;
    }
    if (source.kind === "text") {
      const local = classifyCreateText(source.text);
      if (local.confidence === "high") {
        decide(source, local);
        return;
      }
    }

    const controller = new AbortController();
    request.current = controller;
    setPhase({ kind: "reading", source });
    try {
      const body =
        source.kind === "text"
          ? { text: source.text }
          : source.kind === "pdf"
            ? { pdf: await readFileAsDataUrl(source.file), text: text || undefined }
            : { images: await Promise.all(source.files.map(readFileAsDataUrl)), text: text || undefined };
      const response = await fetch("/api/create/classify", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      const result = await response.json().catch(() => ({}));
      if (controller.signal.aborted) return;
      if (!response.ok) {
        if (response.status === 400 || response.status === 413) {
          setPhase({ kind: "idle" });
          setError(result?.error || "That file could not be read.");
          return;
        }
        decide(source, null);
        return;
      }
      decide(source, result as CreateClassification);
    } catch {
      if (controller.signal.aborted) return;
      decide(source, null);
    } finally {
      if (request.current === controller) request.current = null;
    }
  };

  const onDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    setDragging(false);
    if (busy) return;
    addFiles(Array.from(event.dataTransfer.files || []));
  };

  const confirmGuesses =
    phase.kind === "confirm"
      ? uniqueGuesses([
          ...(phase.classification && !(phase.classification.category === "sports" && !phase.classification.sport)
            ? [phase.classification as CreateGuess]
            : []),
          ...(phase.classification?.alternatives || []),
        ]).filter((guess) => guess.category !== "sports" || guess.sport)
      : [];
  const linkOnly = phase.kind === "confirm" && phase.source.kind === "url";

  return (
    <main className="min-h-screen bg-[#f7f5fc] px-4 pb-16 pt-6 text-[#251f3d] sm:px-8 sm:pt-10 lg:px-12">
      <div className="mx-auto max-w-[1100px]">
        <header>
          <h1 className="text-4xl font-normal leading-tight tracking-tight [font-family:var(--font-playfair),Georgia,serif] sm:text-5xl">
            What are you planning?
          </h1>
          <p className="mt-2 text-base text-[#5d5677] sm:text-lg">Start with what you have. We'll open the right page for you.</p>
        </header>

        <form
          onSubmit={submit}
          onDragOver={(event) => {
            event.preventDefault();
            if (!busy) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`mt-6 rounded-[1.6rem] border-2 border-dashed bg-white p-4 shadow-[0_18px_55px_rgba(70,55,160,0.08)] transition sm:p-5 ${
            dragging ? "border-[#5f55ff] bg-[#f3f1ff]" : "border-[#d8d2ee]"
          }`}
          aria-busy={busy}
        >
          <label htmlFor="create-input" className="block text-base font-semibold text-[#251f3d] sm:text-lg">
            Drop a flyer or schedule, paste a link, or describe your event
          </label>
          <textarea
            id="create-input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) void submit();
            }}
            disabled={busy}
            rows={3}
            maxLength={2000}
            placeholder="e.g. Maya's 7th birthday, unicorn theme, May 3 at Riverside Park"
            className="mt-3 w-full resize-none rounded-2xl border border-[#e5e1ee] bg-[#fbfaff] px-4 py-3 text-base text-[#251f3d] outline-none placeholder:text-[#8d87a6] focus:border-[#675cf4] focus:ring-2 focus:ring-[#675cf4]/20 disabled:opacity-60"
          />
          {files.length ? (
            <ul className="mt-3 flex flex-wrap gap-2" aria-label="Selected files">
              {files.map((file, index) => (
                <li
                  key={`${file.name}-${index}`}
                  className="inline-flex max-w-full items-center gap-2 rounded-full border border-[#e1dcf3] bg-[#f6f4ff] py-1.5 pl-3 pr-1.5 text-sm text-[#433b66]"
                >
                  {file.type === "application/pdf" ? (
                    <FileText className="h-4 w-4 shrink-0" aria-hidden="true" />
                  ) : (
                    <ImageIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  )}
                  <span className="truncate">{file.name}</span>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setFiles((current) => current.filter((_, position) => position !== index))}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[#5d5677] hover:bg-white disabled:opacity-50"
                    aria-label={`Remove ${file.name}`}
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-[#6d6787]">PDF, JPG, PNG or WebP. Schedules, meet packets, invitations and flyers.</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => fileInput.current?.click()}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#d8d2ee] bg-white px-4 text-sm font-semibold text-[#433b66] hover:border-[#bdb5f5] disabled:opacity-50"
              >
                <Paperclip className="h-4 w-4" aria-hidden="true" />
                Choose file
              </button>
              <button
                type="submit"
                disabled={busy || (!files.length && input.trim().length < 5)}
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#5f55ff] px-5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(95,85,255,0.28)] hover:bg-[#4f45ef] disabled:cursor-not-allowed disabled:bg-[#bdb7e6] disabled:shadow-none"
              >
                Continue
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
          <input
            ref={fileInput}
            type="file"
            accept="application/pdf,image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            aria-label="Choose an event file"
            onChange={(event) => {
              const selected = Array.from(event.target.files || []);
              event.target.value = "";
              addFiles(selected);
            }}
          />
        </form>

        {error ? (
          <p role="alert" className="mt-3 rounded-2xl border border-[#f2c9c9] bg-[#fff6f6] px-4 py-3 text-sm text-[#9b2c2c]">
            {error}
          </p>
        ) : null}

        {phase.kind === "reading" ? (
          <div className="mt-4">
            <DiscoveryProgressPanel
              cancelLabel="Cancel"
              indeterminate
              label={`Reading ${describeSource(phase.source)}…`}
              onCancel={reset}
              progress={20}
              showDetails={false}
              theme={PROGRESS_THEME}
            />
          </div>
        ) : null}

        {phase.kind === "working" ? (
          <div className="mt-4">
            <DiscoveryProgressPanel
              cancelLabel="Cancel"
              indeterminate={phase.indeterminate}
              label={phase.label}
              onCancel={reset}
              progress={phase.progress}
              showDetails={false}
              theme={PROGRESS_THEME}
            />
            <button
              type="button"
              onClick={() => {
                const source = phase.source;
                reset();
                setPhase({ kind: "confirm", source, classification: null, showAll: true });
              }}
              className="mt-2 min-h-11 px-1 text-sm font-semibold text-[#4238b4] underline-offset-4 hover:underline"
            >
              Not a {createGuessLabel(phase.guess).toLowerCase()}? Change
            </button>
          </div>
        ) : null}

        {phase.kind === "confirm" ? (
          <section
            aria-labelledby="create-confirm-title"
            className="mt-4 rounded-[1.6rem] border border-[#e1dcf3] bg-white p-4 sm:p-5"
          >
            <h2 id="create-confirm-title" className="text-lg font-semibold">
              {linkOnly ? "Which sport is this page for?" : confirmGuesses.length ? "Which is it?" : "What kind of event is this?"}
            </h2>
            <p className="mt-1 text-sm text-[#6d6787]">
              {linkOnly
                ? "Links work for team, schedule and meet pages."
                : `We read ${describeSource(phase.source)}. One tap and we'll open the right editor.`}
            </p>
            {confirmGuesses.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {confirmGuesses.map((guess) => (
                  <ChoiceButton key={`${guess.category}:${guess.sport}`} onClick={() => void proceed(phase.source, guess)} strong>
                    {createGuessLabel(guess)}
                  </ChoiceButton>
                ))}
              </div>
            ) : null}
            {phase.showAll || !confirmGuesses.length ? (
              <div className="mt-4 space-y-3">
                {linkOnly ? null : (
                  <div className="flex flex-wrap gap-2">
                    {CREATE_CATEGORIES.filter((category) => category !== "sports").map((category) => (
                      <ChoiceButton key={category} onClick={() => void proceed(phase.source, { category, sport: null })}>
                        {createGuessLabel({ category, sport: null })}
                      </ChoiceButton>
                    ))}
                  </div>
                )}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8d87a6]">Sports</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {CREATE_SPORT_KEYS.map((sport) => (
                      <ChoiceButton key={sport} onClick={() => void proceed(phase.source, { category: "sports", sport })}>
                        {createGuessLabel({ category: "sports", sport })}
                      </ChoiceButton>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setPhase({ ...phase, showAll: true })}
                className="mt-3 min-h-11 px-1 text-sm font-semibold text-[#4238b4] underline-offset-4 hover:underline"
              >
                Something else…
              </button>
            )}
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setPhase({ kind: "idle" })}
                className="min-h-11 px-1 text-sm text-[#5d5677] underline-offset-4 hover:underline"
              >
                Cancel
              </button>
            </div>
          </section>
        ) : null}

        <section aria-labelledby="create-pick-title" className="mt-10">
          <h2 id="create-pick-title" className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8d87a6]">
            Or pick what you're planning
          </h2>
          <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {eventTiles.map((item) => (
              <li key={item.href}>
                <Tile href={item.href} icon={item.icon} title={item.label} />
              </li>
            ))}
            {sportItems.length ? (
              <li>
                <div className="flex h-full min-h-[8.5rem] flex-col justify-between rounded-[1.35rem] border border-[#e5e1ee] bg-white p-4">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-6 w-6 text-[#5f55ff]" aria-hidden="true" />
                    <span className="text-base font-semibold">Sports</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {sportItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="inline-flex min-h-9 items-center rounded-full border border-[#e1dcf3] px-3 text-sm text-[#433b66] hover:border-[#bdb5f5] hover:bg-[#f6f4ff]"
                      >
                        {item.label}
                      </Link>
                    ))}
                    {sportItems.some((item) => item.href.startsWith("/event/sport-events")) ? null : (
                      <Link
                        href="/event/sport-events"
                        className="inline-flex min-h-9 items-center rounded-full border border-[#e1dcf3] px-3 text-sm text-[#433b66] hover:border-[#bdb5f5] hover:bg-[#f6f4ff]"
                      >
                        More sports
                      </Link>
                    )}
                  </div>
                </div>
              </li>
            ) : null}
            <li>
              <Tile href="/live-cards" icon={<LiveCardIcon size={26} />} title="Live Card" note="Shortcut" dashed />
            </li>
            {signupItem ? (
              <li>
                <Tile href={signupItem.href} icon={signupItem.icon} title={signupItem.label} note="Shortcut" dashed />
              </li>
            ) : null}
          </ul>
        </section>
      </div>

      {dialog ? (
        <EventCustomThemeDialog
          category={dialog.category}
          initialPrompt={dialog.prompt}
          onClose={() => setDialog(null)}
          onUseDesign={(page: CustomEventPage) => {
            const token = stageCustomEventPage(page);
            setDialog(null);
            router.push(customEventEditorHref(dialog.category, token, false));
          }}
        />
      ) : null}
    </main>
  );
}

function ChoiceButton({ children, onClick, strong = false }: { children: ReactNode; onClick: () => void; strong?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-11 items-center rounded-2xl border px-4 text-sm font-semibold transition ${
        strong
          ? "border-[#675cf4] bg-[#f3f1ff] text-[#3a31a8] hover:bg-[#ebe8ff]"
          : "border-[#e1dcf3] bg-white text-[#433b66] hover:border-[#bdb5f5] hover:bg-[#f6f4ff]"
      }`}
    >
      {children}
    </button>
  );
}

function Tile({
  href,
  icon,
  title,
  note,
  dashed = false,
}: {
  href: string;
  icon?: ReactNode;
  title: string;
  note?: string;
  dashed?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex h-full min-h-[8.5rem] flex-col justify-between rounded-[1.35rem] border bg-white p-4 transition hover:-translate-y-0.5 hover:border-[#bdb5f5] hover:shadow-[0_14px_34px_rgba(70,55,160,0.10)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5f55ff] ${
        dashed ? "border-dashed border-[#d8d2ee]" : "border-[#e5e1ee]"
      }`}
    >
      <span className="text-2xl leading-none text-[#5f55ff]" aria-hidden="true">
        {icon || <Sparkles className="h-6 w-6" />}
      </span>
      <span>
        <span className="block text-base font-semibold text-[#251f3d]">{title}</span>
        {note ? <span className="block text-xs text-[#8d87a6]">{note}</span> : null}
      </span>
    </Link>
  );
}
