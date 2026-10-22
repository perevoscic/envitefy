"use client";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileText,
  ImageIcon,
  Link2,
  LoaderCircle,
  PencilLine,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import CreationTemplateGallery from "@/components/event-create/CreationTemplateGallery";
import { getCreateEventSections } from "@/config/navigation-config";
import { useMenuOptional } from "@/contexts/MenuContext";
import { useCreationAccess } from "@/hooks/useCreationAccess";
import type { InitialCreationAccess } from "@/lib/create/creation-access-client";
import {
  CREATE_CATEGORIES,
  CREATE_SPORT_KEYS,
  type CreateGuess,
  createGuessLabel,
  customCategoryForGuess,
  isLikelyUrl,
} from "@/lib/create/create-intent";
import {
  type CreationIntake,
  createCreationIntake,
  creationIntakeOwner,
  deleteCreationIntake,
  readCreationIntake,
  writeCreationIntake,
} from "@/lib/create/creation-intake";
import { creationChoicesFromLinks } from "@/lib/create/creation-navigation";
import { availableEventTypeGroups, eventTypeChoiceSearchText, eventTypeGroup, expandEventTypeChoices } from "@/lib/create/event-type-groups";
import { HOLIDAY_COLLECTIONS } from "@/lib/holiday-collections";
import { localGalleryDay } from "@/lib/seasonal-template-order";
import { getThemedEventDesign } from "@/lib/event-page-themed-designs";
import {
  informationForCreation,
  prepareCreationEditor,
  prepareOriginalCreationEditor,
} from "@/lib/create/editor-handoff";
import {
  cancelSportDiscovery,
  runSportDiscovery,
} from "@/lib/create/run-sport-discovery";
import { type CreationTemplate, getCreationTemplates } from "@/lib/create/template-selection";
import { CREATE_EXTRACTION_STAGE_LABELS, readCreateExtractionResponse } from "@/lib/create/extraction-progress";
import { normalizeCustomEventInformation, type CustomEventInformation, type CustomEventPage } from "@/lib/event-custom-design";
import { savePendingSnapUpload } from "@/lib/pending-snap-upload";
import { getUploadAcceptAttribute } from "@/lib/upload-config";
import { validateClientUploadFile } from "@/utils/media-upload-client";
import CategoryScrollPicker from "./CategoryScrollPicker";
import EventTypeFilter from "./EventTypeFilter";
import EventTypeSearch from "./EventTypeSearch";
import styles from "./create-workspace.module.css";

const EventCustomThemeDialog = dynamic(
  () => import("@/components/events/custom/EventCustomThemeDialog"),
  { ssr: false },
);
type Mode = "files" | "url" | "scratch";
type Phase = "source" | "recognizing" | "templates" | "opening";
const control =
  "min-h-11 rounded-full border border-[#e2ddef] bg-white px-5 py-2.5 text-sm font-semibold text-[#5b3fd1] shadow-[0_1px_2px_rgb(34_28_53/4%)] transition hover:border-[#cbc0f5] hover:bg-[#f2efff] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5b3fd1] disabled:cursor-wait disabled:opacity-50";
const primary =
  "min-h-12 rounded-full border border-[#5b3fd1] bg-[#5b3fd1] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_22px_-12px_rgb(74_47_191/70%)] transition hover:border-[#4a2fbf] hover:bg-[#4a2fbf] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5b3fd1] disabled:cursor-not-allowed disabled:opacity-50";
const typeChoiceKey = (choice: CreateGuess) => `${choice.category}:${choice.sport || ""}`;

export function allowedCreationGuess(guess: CreateGuess, allowed: string[]) {
  return allowed.includes(customCategoryForGuess(guess));
}

export default function UnifiedCreatePageClient({ initialCreationAccess }: { initialCreationAccess?: InitialCreationAccess }) {
  const router = useRouter(),
    search = useSearchParams();
  const { data: session, status } = useSession();
  const ownerId = creationIntakeOwner(session?.user);
  const activeOwner = useRef(ownerId);
  activeOwner.current = ownerId;
  const [workspaceOwner, setWorkspaceOwner] = useState(ownerId);
  const menu = useMenuOptional(),
    access = useCreationAccess(initialCreationAccess);
  const [mode, setMode] = useState<Mode>("scratch");
  const modeIntakes = useRef<Partial<Record<Mode, CreationIntake>>>({});
  const changingMode = useRef(false);
  const [switchingMode, setSwitchingMode] = useState(false);
  const [typeQuery, setTypeQuery] = useState("");
  const categoryIntroPlayed = useRef(false);
  const [typeFilter, setTypeFilter] = useState("all");
  const [holidayDay, setHolidayDay] = useState<string | null>(null);
  useEffect(() => setHolidayDay(localGalleryDay()), []);
  const [designThemeFilter, setDesignThemeFilter] = useState("all");
  const [files, setFiles] = useState<File[]>([]);
  const [text, setText] = useState(""),
    [url, setUrl] = useState("");
  const [usePastedText, setUsePastedText] = useState(false);
  const [intake, setIntake] = useState<CreationIntake | null>(null);
  const current = useRef<CreationIntake | null>(null);
  const sourceSaves = useRef<Promise<unknown>>(Promise.resolve());
  const pendingUploadRead = useRef<string | null>(null);
  const request = useRef<AbortController | null>(null),
    epoch = useRef(0),
    submitting = useRef(false);
  const preparingLiveCard = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null),
    headingRef = useRef<HTMLHeadingElement>(null),
    pageTitleRef = useRef<HTMLHeadingElement>(null);
  const [phase, setPhase] = useState<Phase>("source");
  const [workingLabel, setWorkingLabel] = useState(""),
    [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [restoring, setRestoring] = useState(!!search?.get("intake")),
    [customDialog, setCustomDialog] = useState(false);
  const [waitingToRead, setWaitingToRead] = useState(false);
  const accountReady = status === "authenticated" && !!ownerId && workspaceOwner === ownerId;
  const ready = accountReady && !!access.access;
  const busy = phase === "recognizing" || phase === "opening";

  useEffect(() => {
    if (phase !== "source") return;
    const mobile = window.matchMedia("(max-width: 1023px)");
    const previousRestoration = window.history.scrollRestoration;
    let ownsRestoration = false;
    const revealMobileTitle = () => {
      if (!mobile.matches) return;
      const title = pageTitleRef.current;
      const topbar = document.querySelector<HTMLElement>('[data-app-mobile-topbar="app"]');
      if (!title) return;
      const shell = title.closest<HTMLElement>('[data-app-main-content="true"]');
      if (!topbar && !shell) return;
      const topbarBottom = topbar?.getClientRects().length
        ? topbar.getBoundingClientRect().bottom
        : Number.parseFloat(shell ? getComputedStyle(shell).paddingTop : "0");
      // A restored page position or a method change can leave the title behind
      // the fixed navbar even though the shared shell reserves enough space.
      if (title.getBoundingClientRect().top < topbarBottom + 12) {
        window.scrollTo({ top: 0, behavior: "instant" });
      }
    };
    const syncMobileRestoration = () => {
      if (mobile.matches) {
        // Native reload restoration can run after pageshow and hide the title
        // again. This source view owns its initial mobile position instead.
        window.history.scrollRestoration = "manual";
        ownsRestoration = true;
        revealMobileTitle();
      } else if (ownsRestoration) {
        window.history.scrollRestoration = previousRestoration;
        ownsRestoration = false;
      }
    };
    syncMobileRestoration();
    const frame = requestAnimationFrame(revealMobileTitle);
    window.addEventListener("pageshow", revealMobileTitle);
    mobile.addEventListener("change", syncMobileRestoration);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pageshow", revealMobileTitle);
      mobile.removeEventListener("change", syncMobileRestoration);
      if (ownsRestoration) window.history.scrollRestoration = previousRestoration;
    };
  }, [mode, phase]);

  const allowedCategories = access.access?.allowedCategories || [];
  const canCreatePage = access.access?.allowedProducts.includes("event_page") === true;
  // Local source entry can start while grants load. Processing still waits for
  // this account's verified access, and saved-source restoration stays exclusive.
  const sourceAvailable = accountReady && (!access.access || canCreatePage) && !restoring;
  const guess = intake?.guess || intake?.classification;
  const personalCapture =
    guess?.category === "medical-appointments" || guess?.category === "appointments";
  const signupIntent = guess?.category === "signup-forms";
  const supportedGuess =
    !!guess &&
    (personalCapture
      ? access.access?.allowedProducts.includes("snap") === true
      : signupIntent
        ? access.access?.allowedProducts.includes("signup_form") === true
        : allowedCreationGuess(guess, allowedCategories));
  const information = intake?.information;
  const requestedDate = search?.get("d") || "";
  const calendarDate =
    /^\d{4}-\d{2}-\d{2}$/.test(requestedDate) &&
    Number.isFinite(Date.parse(`${requestedDate}T12:00:00Z`)) &&
    new Date(`${requestedDate}T12:00:00Z`).toISOString().slice(0, 10) === requestedDate
      ? requestedDate
      : "";
  const withCalendarDate = (next: CreationIntake, facts?: CustomEventInformation) => {
    if (!calendarDate || facts?.details.date) return facts;
    const base = facts || informationForCreation(next);
    return { ...base, details: { ...base.details, date: calendarDate } };
  };

  const choices = useMemo(() => {
    const ordinary: CreateGuess[] = CREATE_CATEGORIES.filter(
      (category) =>
        ![
          "sports",
          "appointments",
          "medical-appointments",
          "workshops",
          "special-events",
          "signup-forms",
        ].includes(category),
    ).map((category) => ({ category, sport: null }));
    const sports: CreateGuess[] = CREATE_SPORT_KEYS.map((sport) => ({ category: "sports", sport }));
    return [...ordinary, ...sports].filter((item) => allowedCreationGuess(item, allowedCategories));
  }, [allowedCategories.join(",")]);
  const preferred = useMemo(() => {
    if (!ready || !canCreatePage || !menu?.featureVisibility.hasLoadedPreferences) return [];
    return creationChoicesFromLinks(
      getCreateEventSections(
        menu.featureVisibility.visibleTemplateKeys,
        menu.productScopes,
        menu.featureVisibility.sportPreferences,
        { isAdmin: menu.isAdmin, defaultCreateIntent: menu.defaultCreateIntent },
      ).flatMap((section) => section.items),
    ).filter((item) => allowedCreationGuess(item.guess, allowedCategories));
  }, [menu, ready, canCreatePage, allowedCategories.join(",")]);
  const templates = useMemo(
    () => (guess && supportedGuess ? getCreationTemplates(guess) : []),
    [guess?.category, guess?.sport, guess?.occasion, supportedGuess],
  );
  const designThemes = useMemo(() => {
    const themes = new Map<string, string>();
    for (const template of templates) {
      const design = getThemedEventDesign(template.id);
      if (design) themes.set(design.subtype, design.label);
    }
    return [...themes].map(([id, label]) => ({ id, label }));
  }, [templates]);
  const activeDesignThemeFilter = designThemes.some((theme) => theme.id === designThemeFilter) ? designThemeFilter : "all";
  const visibleDesigns = useMemo(() => activeDesignThemeFilter === "all" ? templates : templates.filter((template) => getThemedEventDesign(template.id)?.subtype === activeDesignThemeFilter), [templates, activeDesignThemeFilter]);
  const defaultTemplateFor = (record: CreationIntake, confirmed = false) => {
    const selected = record.guess || record.classification;
    if (
      !selected ||
      (!confirmed && record.classification?.confidence === "low") ||
      ["medical-appointments", "appointments"].includes(selected.category) ||
      (selected.category === "sports" && !selected.sport) ||
      (selected.category !== "sports" && !record.information) ||
      (selected.category === "signup-forms"
        ? !access.access?.allowedProducts.includes("signup_form")
        : !allowedCreationGuess(selected, allowedCategories))
    )
      return;
    const available = getCreationTemplates(selected);
    return available.find((template) => template.id === record.selectedTemplateId) || available[0];
  };
  const preferredChoices = preferred
    .map((item) => item.guess!)
    .filter((item) => item.category !== "sports" || !!item.sport);
  const manualChoices = [...preferredChoices, ...choices].filter(
    (choice, index, all) => all.findIndex((item) => typeChoiceKey(item) === typeChoiceKey(choice)) === index,
  );
  const activeTypeFilter = availableEventTypeGroups(manualChoices).some((group) => group.id === typeFilter)
    ? typeFilter
    : "all";
  useEffect(() => {
    if (ready && typeFilter !== "all" && activeTypeFilter === "all") setTypeFilter("all");
  }, [ready, typeFilter, activeTypeFilter]);

  const update = useCallback((next: CreationIntake) => {
    current.current = next;
    setIntake(next);
  }, []);
  const persist = useCallback(
    async (next: CreationIntake) => {
      if (next.ownerId !== activeOwner.current)
        throw new Error("Sign in to the account that started this event.");
      update(next);
      const saved = await writeCreationIntake(next);
      if (current.current === next) update(saved);
      return saved;
    },
    [update],
  );
  useEffect(() => {
    if (workspaceOwner === ownerId) return;
    epoch.current++;
    request.current?.abort();
    submitting.current = false;
    pendingUploadRead.current = null;
    setWaitingToRead(false);
    current.current = null;
    setIntake(null);
    setMode("scratch");
    modeIntakes.current = {};
    setFiles([]);
    setText("");
    setUrl("");
    setUsePastedText(false);
    setTypeQuery("");
    setTypeFilter("all");
    setPhase("source");
    setError("");
    setCustomDialog(false);
    setRestoring(false);
    setWorkspaceOwner(ownerId);
  }, [ownerId, workspaceOwner]);
  const setLocation = (id: string, step: "source" | "templates", push = false) => {
    const params = new URLSearchParams(window.location.search);
    params.set("intake", id);
    params.set("step", step);
    window.history[push ? "pushState" : "replaceState"](
      window.history.state,
      "",
      `/create?${params}`,
    );
  };
  const restore = useCallback(
    async (id: string, step?: string | null) => {
      if (!ownerId) return;
      const version = ++epoch.current;
      request.current?.abort();
      submitting.current = false;
      pendingUploadRead.current = null;
      setWaitingToRead(false);
      setRestoring(true);
      setError("");
      try {
        const restored = await readCreationIntake(ownerId, id);
        if (version !== epoch.current) return;
        if (!restored)
          throw new Error(
            "This unfinished event is no longer available in this browser. Start again below.",
          );
        update(restored);
        setMode(
          restored.source.kind === "url" || restored.source.kind === "text"
            ? "url"
            : restored.source.kind === "files"
              ? "files"
              : "scratch",
        );
        setFiles(restored.source.files);
        setText(restored.source.text);
        setUrl(restored.source.url || "");
        setUsePastedText(restored.source.kind === "text");
        if (step === "recognizing" && restored.source.kind === "files" && !restored.classification)
          pendingUploadRead.current = restored.id;
        setPhase(
          step === "source" ||
            pendingUploadRead.current === restored.id ||
            !(restored.guess || restored.classification)
            ? "source"
            : "templates",
        );
      } catch (failure) {
        if (version === epoch.current)
          setError(
            failure instanceof Error
              ? failure.message
              : "Your unfinished event could not be restored.",
          );
      } finally {
        if (version === epoch.current) setRestoring(false);
      }
    },
    [ownerId, update],
  );
  useEffect(() => {
    if (!ownerId) return;
    const id = search?.get("intake");
    if (id && current.current?.id !== id) void restore(id, search?.get("step"));
  }, [ownerId, search?.get("intake"), restore]);
  useEffect(() => {
    const back = () => {
      const params = new URLSearchParams(window.location.search),
        id = params.get("intake");
      if (id) void restore(id, params.get("step"));
      else {
        request.current?.abort();
        epoch.current++;
        setWaitingToRead(false);
        setRestoring(false);
        setPhase("source");
      }
    };
    window.addEventListener("popstate", back);
    return () => {
      window.removeEventListener("popstate", back);
      request.current?.abort();
      epoch.current++;
    };
  }, [restore]);
  useEffect(() => {
    if (phase === "templates") headingRef.current?.focus();
  }, [phase]);

  const invalidate = () => {
    pendingUploadRead.current = null;
    setWaitingToRead(false);
    epoch.current++;
    request.current?.abort();
    request.current = null;
    submitting.current = false;
    setPhase("source");
    setError("");
    const previous = current.current;
    if (previous)
      update(
        previous.guess || previous.classification || previous.discoveryEventId || previous.sourceReadStarted
          ? createCreationIntake(ownerId, previous.source)
          : {
              ...previous,
              phase: "source",
              classification: undefined,
              guess: undefined,
              information: undefined,
              sourceText: undefined,
              customPage: undefined,
              editorSnapshot: undefined,
              selectedTemplateId: undefined,
              discoveryEventId: undefined,
            },
      );
  };
  const addFiles = (incoming: File[]) => {
    if (!incoming.length) return;
    const next = [...files, ...incoming],
      invalid = next.map((file) => validateClientUploadFile(file, "attachment")).find(Boolean);
    if (invalid) {
      setError(invalid);
      return;
    }
    if (
      next.length > 5 ||
      (next.some((file) => file.type === "application/pdf" || /\.pdf$/i.test(file.name)) &&
        next.length > 1)
    ) {
      setError("Choose one PDF or up to five photos.");
      return;
    }
    invalidate();
    setFiles(next);
    setMode("files");
    void readSource(undefined, undefined, { kind: "files", files: next, text });
  };
  const removeFile = (index: number) => {
    const next = files.filter((_, position) => index !== position);
    invalidate();
    setFiles(next);
    if (next.length) void readSource(undefined, undefined, { kind: "files", files: next, text });
  };

  useEffect(() => {
    if (!ownerId || !mode || phase !== "source" || restoring) return;
    if (!files.length && !text.trim() && !url.trim() && !current.current) return;
    const timer = setTimeout(() => {
      const sourceEpoch = epoch.current;
      const source: CreationIntake["source"] = {
        kind: mode === "url" && usePastedText ? "text" : mode,
        files: mode === "files" ? files : [],
        text,
        ...(mode === "url" ? { url: url.trim() } : {}),
      };
      const previous = current.current;
      const next = previous
        ? { ...previous, source, phase: "source" as const }
        : createCreationIntake(ownerId, source);
      update(next);
      sourceSaves.current = sourceSaves.current
        .catch(() => {})
        .then(async () => {
          if (sourceEpoch !== epoch.current || next.ownerId !== activeOwner.current) return;
          const latest = await readCreationIntake(next.ownerId, next.id);
          if (sourceEpoch !== epoch.current || next.ownerId !== activeOwner.current) return;
          const saved = await persist({ ...next, revision: latest?.revision ?? next.revision });
          if (sourceEpoch === epoch.current && saved.ownerId === activeOwner.current)
            setLocation(saved.id, "source");
        })
        .catch(
          (failure) =>
            sourceEpoch === epoch.current &&
            setError(
              failure instanceof Error
                ? failure.message
                : "Your work could not be retained in this browser.",
            ),
        );
    }, 250);
    return () => clearTimeout(timer);
  }, [ownerId, mode, usePastedText, files, text, url, phase, restoring, persist, update]);

  const readSource = async (
    event?: FormEvent,
    confirmedGuess?: CreateGuess,
    uploadedSource?: CreationIntake["source"],
  ) => {
    event?.preventDefault();
    if (
      !sourceAvailable ||
      changingMode.current ||
      restoring ||
      submitting.current ||
      (!mode && !confirmedGuess)
    )
      return;
    // File input state has not rendered yet when an upload starts this request.
    const source: CreationIntake["source"] = uploadedSource || {
      kind: mode === "url" && usePastedText ? "text" : mode,
      files: mode === "files" ? files : [],
      text,
      ...(mode === "url" ? { url: url.trim() } : {}),
    };
    if (source.kind === "files" && !source.files.length) {
      setError("Choose a flyer, photo or PDF first.");
      return;
    }
    if (source.kind === "url" && !isLikelyUrl(source.url || "")) {
      setError("Paste a complete public link beginning with https:// or http://.");
      return;
    }
    if (source.kind === "text" && !source.text.trim()) {
      setError("Paste the event details first.");
      return;
    }
    if (source.kind === "scratch" && !confirmedGuess) return;
    if (!ready) {
      if (!access.error) setWaitingToRead(true);
      return;
    }
    if (!canCreatePage) return;
    setWaitingToRead(false);
    submitting.current = true;
    request.current?.abort();
    const controller = new AbortController(),
      version = ++epoch.current;
    request.current = controller;
    setError("");
    setWorkingLabel("Retaining your source in this browser…");
    setPhase("recognizing");
    try {
      // Let any earlier source write finish before saving recognition, so its
      // older revision cannot replace this batch or its extracted information.
      await sourceSaves.current.catch(() => {});
      if (version !== epoch.current || controller.signal.aborted) return;
      let next = current.current || createCreationIntake(ownerId, source);
      next = await persist({ ...next, source, sourceReadStarted: true, phase: "recognizing" });
      if (version !== epoch.current) return;
      setLocation(next.id, "source");
      if (source.kind === "scratch" && !source.text.trim()) {
        if (!confirmedGuess || !allowedCreationGuess(confirmedGuess, allowedCategories))
          throw new Error("Choose an available event type.");
        next = await persist({
          ...next,
          guess: confirmedGuess,
          information: withCalendarDate({ ...next, guess: confirmedGuess }),
          phase: "templates",
        });
      } else {
        let body: FormData | string, headers: HeadersInit | undefined;
        if (source.kind === "files") {
          const form = new FormData();
          for (const file of source.files) form.append("file", file);
          form.set("text", source.text);
          form.set("clientIntakeId", next.id);
          if (confirmedGuess) form.set("category", customCategoryForGuess(confirmedGuess));
          if (confirmedGuess?.sport) form.set("sport", confirmedGuess.sport);
          body = form;
        } else {
          headers = { "Content-Type": "application/json" };
          body = JSON.stringify({
            url: source.kind === "url" ? source.url : undefined,
            text: source.text,
            clientIntakeId: next.id,
            ...(confirmedGuess ? { category: customCategoryForGuess(confirmedGuess) } : {}),
            ...(confirmedGuess?.sport ? { sport: confirmedGuess.sport } : {}),
          });
        }
        setWorkingLabel(source.kind === "files" ? "Uploading your file for reading…" : source.kind === "url" ? "Opening your public event page…" : "Sending your event details…");
        const response = await fetch("/api/create/extract", {
          method: "POST",
          credentials: "include",
          headers: { ...headers, Accept: "application/x-ndjson" },
          body,
          signal: AbortSignal.any([controller.signal, AbortSignal.timeout(285_000)]),
        });
        const result = await readCreateExtractionResponse(response, (stage) => {
          if (version === epoch.current && !controller.signal.aborted && CREATE_EXTRACTION_STAGE_LABELS[stage])
            setWorkingLabel(CREATE_EXTRACTION_STAGE_LABELS[stage]);
        });
        if (version !== epoch.current || controller.signal.aborted) return;
        if (!result.classification)
          throw new Error("Choose an event type so we can open the right editor.");
        next = await persist({
          ...next,
          classification: result.classification,
          guess: confirmedGuess || result.classification,
          information: result.information ? withCalendarDate(next, result.information) : undefined,
          sourceText: result.sourceText,
          discoveryEventId: result.discoveryEventId,
          phase: "templates",
        });
      }
      if (version !== epoch.current) return;
      if (source.kind !== "scratch") {
        const template = defaultTemplateFor(next, !!confirmedGuess);
        if (template) {
          await openTemplate(template, next, { version, controller });
          return;
        }
      }
      setPhase("templates");
      setLocation(next.id, "templates", true);
    } catch (failure) {
      if (version === epoch.current && !controller.signal.aborted) {
        setPhase("source");
        setError(
          failure instanceof Error ? failure.message : "We couldn't read that. Please retry.",
        );
      }
    } finally {
      if (request.current === controller) {
        request.current = null;
        submitting.current = false;
      }
    }
  };
  useEffect(() => {
    if (!waitingToRead) return;
    if (!accountReady || access.error || (ready && !canCreatePage)) {
      setWaitingToRead(false);
      return;
    }
    if (!ready || restoring || changingMode.current || phase !== "source") return;
    // Consume this explicit request once; failed or cancelled parsing keeps the
    // existing manual retry behavior instead of restarting on an access refresh.
    setWaitingToRead(false);
    void readSource();
  }, [waitingToRead, accountReady, access.error, ready, canCreatePage, restoring, phase]);
  useEffect(() => {
    const id = pendingUploadRead.current;
    if (!id || id !== intake?.id || !ready || !canCreatePage || restoring || phase !== "source")
      return;
    // A fresh gallery upload starts once. Consume its handoff before reading so
    // cancellation, failure and refresh keep their explicit retry behavior.
    pendingUploadRead.current = null;
    setLocation(id, "source");
    void readSource();
  }, [intake?.id, ready, canCreatePage, restoring, phase]);
  const openLiveCard = async (template: CreationTemplate) => {
    const previous = current.current;
    if (!previous || submitting.current) return;
    if (previous.information) {
      await openTemplate(template);
      return;
    }
    const selected = previous.guess || previous.classification;
    if (selected?.category !== "sports" || !previous.sourceText) return;
    const controller = new AbortController(), version = ++epoch.current;
    submitting.current = true;
    request.current = controller;
    preparingLiveCard.current = controller;
    setPhase("opening");
    setError("");
    setWorkingLabel("Preparing your Live Card details…");
    try {
      // Alternate output preparation is explicit. Reuse the completed read and
      // keep the original sports shell and source files available for recovery.
      const response = await fetch("/api/create/extract", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/x-ndjson" },
        body: JSON.stringify({ sourceText: previous.sourceText, text: previous.source.text, category: customCategoryForGuess(selected) }),
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(285_000)]),
      });
      const result = await readCreateExtractionResponse(response, (stage) => {
        if (version === epoch.current && !controller.signal.aborted && CREATE_EXTRACTION_STAGE_LABELS[stage])
          setWorkingLabel(CREATE_EXTRACTION_STAGE_LABELS[stage]);
      });
      if (version !== epoch.current || controller.signal.aborted) return;
      const information = normalizeCustomEventInformation(result.information);
      if (!information || information.category !== customCategoryForGuess(selected))
        throw new Error("Your Live Card details could not be prepared. Your event source is kept; please retry.");
      const next = await persist({ ...previous, information: withCalendarDate(previous, information) });
      if (version !== epoch.current || controller.signal.aborted) return;
      await openTemplate(template, next, { version, controller });
    } catch (failure) {
      if (version === epoch.current && !controller.signal.aborted) {
        setPhase("templates");
        setError(failure instanceof Error ? failure.message : "Your Live Card details could not be prepared. Please retry.");
      }
    } finally {
      if (preparingLiveCard.current === controller) preparingLiveCard.current = null;
      if (request.current === controller) {
        request.current = null;
        submitting.current = false;
      }
    }
  };
  const chooseCategory = async (selected: CreateGuess) => {
    if (!allowedCreationGuess(selected, allowedCategories)) return;
    setDesignThemeFilter("all");
    if (phase === "templates" && current.current) {
      const previous = current.current,
        category = customCategoryForGuess(selected);
      const version = ++epoch.current;
      request.current?.abort();
      const changed =
        selected.category !== previous.guess?.category || selected.sport !== previous.guess?.sport || selected.occasion !== previous.guess?.occasion;
      const next = changed
        ? {
            ...createCreationIntake(ownerId, previous.source),
            classification: previous.classification,
            sourceText: previous.sourceText,
          }
        : previous;
      const saved = await persist({
        ...next,
        guess: selected,
        information: previous.information ? { ...previous.information, category } : undefined,
        customPage: undefined,
        selectedTemplateId: undefined,
        phase: "templates",
      });
      if (version !== epoch.current || saved.ownerId !== activeOwner.current) return;
      setLocation(saved.id, "templates");
      if (!saved.information && !saved.discoveryEventId && saved.source.kind !== "scratch") {
        await readSource(undefined, selected);
        return;
      }
      if (saved.source.kind !== "scratch") {
        const template = defaultTemplateFor(saved, true);
        if (template) await openTemplate(template, saved);
      }
      return;
    }
    await readSource(undefined, selected);
  };
  const openTemplate = async (
    template: CreationTemplate,
    imported?: CreationIntake,
    operation?: { version: number; controller: AbortController },
  ) => {
    const previous = imported || current.current;
    const selectedGuess = previous?.guess || previous?.classification;
    const supported =
      selectedGuess &&
      (selectedGuess.category === "signup-forms"
        ? access.access?.allowedProducts.includes("signup_form")
        : allowedCreationGuess(selectedGuess, allowedCategories));
    if (!previous || !selectedGuess || !supported || (submitting.current && !operation)) return;
    submitting.current = true;
    const version = operation?.version ?? ++epoch.current,
      controller = operation?.controller || new AbortController();
    request.current = controller;
    setPhase("opening");
    setError("");
    setWorkingLabel("Preparing your editable event…");
    try {
      if (selectedGuess.category === "sports" && !selectedGuess.sport)
        throw new Error("Choose the sport before opening a design.");
      let next = await persist({ ...previous, selectedTemplateId: template.id, phase: "editor" });
      let href: string;
      if (
        selectedGuess.category === "sports" &&
        ["files", "url", "text"].includes(next.source.kind) &&
        !["live-card", "signup", "custom"].includes(template.family)
      ) {
        href = await runSportDiscovery({
          sport: selectedGuess.sport!,
          files: next.source.files,
          url: next.source.kind === "url" ? next.source.url : undefined,
          text: next.source.text,
          signal: controller.signal,
          clientIntakeId: next.id,
          existingEventId: next.discoveryEventId,
          pageTemplateId: template.id,
          onStage: (label) => {
            if (version === epoch.current) setWorkingLabel(label);
          },
          onEventId: async (id) => {
            if (version !== epoch.current) return;
            next = await persist({ ...next, discoveryEventId: id });
          },
          onProgress: () => {},
        });
        const target = new URL(href, window.location.origin);
        target.searchParams.set("intake", next.id);
        target.searchParams.set("templateId", template.id);
        if (selectedGuess.sport !== "gymnastics" && selectedGuess.sport !== "football")
          target.searchParams.set("style", template.id.split("--")[1] || "stadium");
        href = target.pathname + target.search;
      } else href = await prepareCreationEditor(next, template);
      if (controller.signal.aborted || version !== epoch.current) return;
      await persist({ ...next, phase: "editor" });
      if (controller.signal.aborted || version !== epoch.current) return;
      router.push(href);
    } catch (failure) {
      if (version === epoch.current && !controller.signal.aborted) {
        setPhase("templates");
        setError(
          failure instanceof Error
            ? failure.message
            : "Your editor couldn't be opened. Your information is retained; please retry.",
        );
      }
    } finally {
      if (request.current === controller) {
        request.current = null;
        submitting.current = false;
      }
    }
  };
  const cancel = async () => {
    const previous = current.current;
    epoch.current++;
    request.current?.abort();
    request.current = null;
    submitting.current = false;
    // Reading can now prepare the sports shell before its response arrives.
    // Cancel by the durable key even if its event ID has not reached this tab.
    const sportsImport =
      !preparingLiveCard.current &&
      (phase === "recognizing" || (phase === "opening" && previous?.guess?.category === "sports")) &&
      !!previous && ["files", "url", "text"].includes(previous.source.kind);
    if (sportsImport && previous)
      await cancelSportDiscovery(previous.discoveryEventId || null, previous.id);
    if (previous) {
      const next = sportsImport
        ? {
            ...createCreationIntake(ownerId, previous.source),
            guess: previous.guess,
            classification: previous.classification,
            information: previous.information,
            sourceText: previous.sourceText,
            phase: "templates" as const,
          }
        : { ...previous, phase: previous.guess ? ("templates" as const) : ("source" as const) };
      const saved = await persist(next);
      setLocation(saved.id, previous.guess ? "templates" : "source");
      if (sportsImport) await deleteCreationIntake(ownerId, previous.id);
    }
    setPhase(previous?.guess ? "templates" : "source");
    setWorkingLabel("");
  };
  const backToSource = () => {
    epoch.current++;
    request.current?.abort();
    submitting.current = false;
    setPhase("source");
    setError("");
    if (current.current) {
      void persist({ ...current.current, phase: "source" }).catch((failure) =>
        setError(String(failure)),
      );
      setLocation(current.current.id, "source");
    }
  };
  const switchMode = async (target: Mode) => {
    if (changingMode.current) return false;
    if (target === mode) return true;
    setWaitingToRead(false);
    changingMode.current = true;
    setSwitchingMode(true);
    const version = ++epoch.current;
    request.current?.abort();
    submitting.current = false;
    setError("");
    try {
      if (current.current || files.length || text.trim() || url.trim()) {
        const source: CreationIntake["source"] = {
          kind: mode === "url" && usePastedText ? "text" : mode,
          files: mode === "files" ? files : [],
          text,
          ...(mode === "url" ? { url } : {}),
        };
        const previous = current.current || createCreationIntake(ownerId, source);
        await sourceSaves.current.catch(() => {});
        const latest = await readCreationIntake(ownerId, previous.id);
        if (version !== epoch.current || previous.ownerId !== activeOwner.current) return false;
        modeIntakes.current[mode] = await persist({
          ...previous,
          revision: latest?.revision ?? previous.revision,
          source,
          phase: "source",
        });
      }
      if (version !== epoch.current) return false;
      const retained = modeIntakes.current[target];
      if (retained) {
        await restore(retained.id, "source");
        setLocation(retained.id, "source");
      } else {
        current.current = null;
        setIntake(null);
        setFiles([]);
        setText("");
        setUrl("");
        setUsePastedText(false);
        setMode(target);
        setPhase("source");
        const params = new URLSearchParams(window.location.search);
        params.delete("intake");
        params.delete("step");
        window.history.replaceState(
          window.history.state,
          "",
          `/create${params.size ? `?${params}` : ""}`,
        );
      }
      setTypeQuery("");
      setTypeFilter("all");
      return true;
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Your source could not be retained. Please try again.",
      );
      return false;
    } finally {
      changingMode.current = false;
      setSwitchingMode(false);
    }
  };

  const visibleTypes = expandEventTypeChoices(manualChoices, holidayDay).filter((choice) =>
    (activeTypeFilter === "all" || eventTypeGroup(choice) === activeTypeFilter) &&
    eventTypeChoiceSearchText(choice).toLowerCase().includes(typeQuery.trim().toLowerCase()),
  );
  const manualCreation = mode === "scratch";
  const progressSteps = manualCreation ? ["Start", "Design", "Details"] : ["Start", "Details"];
  const activeStep = phase === "opening" ? progressSteps.length - 1 : phase === "templates" ? 1 : 0;

  return (
    <main className={styles.page} data-unified-create>
      <div className={styles.container}>
        <header className={styles.header}>
          <div>
            {phase === "templates" && manualCreation ? (
              <p className={styles.eyebrow}>Design</p>
            ) : null}
            <h1 ref={pageTitleRef} className={styles.title}>
              {phase === "templates"
                ? manualCreation
                  ? "Choose your design"
                  : "Your event details"
                : "Create an event page"}
            </h1>
            <p className={styles.subtitle}>
              {phase === "templates"
                ? intake?.source.kind === "scratch"
                  ? "Choose a design, then add your event details."
                  : "Your details are ready. Continue editing or change the design."
                : "Turn a flyer, a link, or an idea into something worth sharing."}
            </p>
          </div>
          <ol className={styles.steps} aria-label="Creation progress">
            {progressSteps.map((label, index) => (
              <li
                key={label}
                className={`${styles.step} ${index === activeStep ? styles.stepActive : index < activeStep ? styles.stepDone : ""}`}
                aria-current={index === activeStep ? "step" : undefined}
              >
                <span className={styles.stepNumber}>
                  {index < activeStep ? <Check className="size-3" aria-hidden="true" /> : index + 1}
                </span>
                {label}
              </li>
            ))}
          </ol>
        </header>
        {access.error || (!access.loading && menu?.featureVisibility.error) ? (
          <div role="alert" className={styles.alert}>
            <p>{access.error || menu?.featureVisibility.error}</p>
            <button
              type="button"
              className={`${control} mt-3`}
              onClick={() => {
                void access.reload();
                void menu?.featureVisibility.refresh();
              }}
            >
              Try again
            </button>
          </div>
        ) : null}
        {restoring ? (
          <p role="status" className="mb-4 flex items-center gap-2 text-sm text-[#786b80]">
            <LoaderCircle
              className="size-4 animate-spin motion-reduce:animate-none"
              aria-hidden="true"
            />
            Restoring your unfinished event…
          </p>
        ) : null}
        {ready && !canCreatePage ? (
          <div className={styles.alert}>
            <h2 className={styles.taskHeading}>Event Pages aren’t enabled for this account.</h2>
            <p className={styles.taskIntro}>
              Request access in Settings. Your existing events are available in My Events.
            </p>
            <Link href="/settings?section=creation" className={`${control} mt-4 inline-flex`}>
              Open Settings
            </Link>
          </div>
        ) : null}
        {phase === "source" ? (
          <div className={styles.workspace}>
            <div className={styles.workspaceGrid}>
              <div className={styles.intakePane}>
                <div
                  className={styles.modeBar}
                  role="group"
                  aria-label="How would you like to start?"
                >
                  {(
                    [
                      { id: "scratch", title: "Start from scratch", icon: PencilLine },
                      { id: "files", title: "Upload", icon: Upload },
                      { id: "url", title: "Paste URL", icon: Link2 },
                    ] as const
                  ).map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      aria-label={option.title}
                      aria-pressed={mode === option.id}
                      data-mode={option.id}
                      disabled={busy || switchingMode || !sourceAvailable}
                      onClick={() => void switchMode(option.id)}
                      className={`${styles.modeButton} ${mode === option.id ? styles.modeActive : ""}`}
                    >
                      <span className={styles.modeGlow} aria-hidden="true" />
                      {(["front", "back"] as const).map((face) => (
                        <span
                          key={face}
                          className={`${styles.modeFace} ${face === "back" ? styles.modeFaceBack : styles.modeFaceFront}`}
                          aria-hidden="true"
                        >
                          <option.icon />
                          <span className="sm:hidden">
                            {option.id === "scratch" ? "From scratch" : option.title}
                          </span>
                          <span className="hidden sm:inline">{option.title}</span>
                        </span>
                      ))}
                    </button>
                  ))}
                </div>
                {sourceAvailable ? (
                  <section
                    key={mode}
                    className={styles.sourcePane}
                    data-source-panel={mode}
                    aria-label={
                      mode === "files"
                        ? "Upload event information"
                        : mode === "url"
                          ? "Read a public event link"
                          : "Choose an event type"
                    }
                  >
                    <fieldset
                      disabled={switchingMode || restoring}
                      aria-busy={switchingMode || restoring}
                      className="m-0 min-w-0 border-0 p-0"
                    >
                      <legend className="sr-only">Event information</legend>
                      {mode === "scratch" ? (
                        <div className={styles.categoryPanel}>
                          <EventTypeFilter
                            compact
                            choices={manualChoices}
                            value={activeTypeFilter}
                            onChange={(value) => {
                              categoryIntroPlayed.current = true;
                              setHolidayDay(localGalleryDay());
                              setTypeFilter(value);
                              setTypeQuery("");
                            }}
                            search={<EventTypeSearch value={typeQuery} onChange={(value) => {
                              categoryIntroPlayed.current = true;
                              setTypeQuery(value);
                            }} />}
                          />
                          {visibleTypes.length ? (
                            <CategoryScrollPicker
                              choices={visibleTypes}
                              query={typeQuery}
                              introPlayed={categoryIntroPlayed}
                              onSelect={(choice) => void chooseCategory(choice)}
                            />
                          ) : null}
                          {!visibleTypes.length ? (
                            <p className={styles.taskIntro} role="status">
                              {!ready
                                ? access.error
                                  ? "Event types could not be loaded. Try again above."
                                  : "Checking available event types…"
                                : typeQuery.trim()
                                  ? "No matching event types. Try another search."
                                  : "No event types are available for this account."}
                            </p>
                          ) : null}
                        </div>
                      ) : (
                        <form onSubmit={(event) => void readSource(event)}>
                          {mode === "files" ? (
                            <div
                              className={`${styles.dropZone} ${dragging ? styles.dropZoneDragging : ""}`}
                              onDragOver={(event) => {
                                event.preventDefault();
                                if (changingMode.current || restoring) return;
                                setDragging(true);
                              }}
                              onDragLeave={() => setDragging(false)}
                              onDrop={(event) => {
                                event.preventDefault();
                                setDragging(false);
                                if (changingMode.current || restoring) return;
                                addFiles(Array.from(event.dataTransfer.files));
                              }}
                            >
                              {!files.length ? (
                                <>
                                  <span className={styles.dropIcon}>
                                    <Upload aria-hidden="true" />
                                  </span>
                                  <h2 className={styles.taskHeading}>
                                    Drop your flyer or PDF here
                                  </h2>
                                  <p className={styles.taskIntro}>
                                    We’ll read the details and open your event editor.
                                  </p>
                                </>
                              ) : (
                                <>
                                  <h2 className={styles.taskHeading}>
                                    {files.length === 1
                                      ? "Your source is ready"
                                      : `${files.length} photos added`}
                                  </h2>
                                  <ul className={styles.filesList} aria-label="Selected files">
                                    {files.map((file, index) => (
                                      <li key={`${file.name}:${index}`} className={styles.fileRow}>
                                        {file.type === "application/pdf" ? (
                                          <FileText aria-hidden="true" />
                                        ) : (
                                          <ImageIcon aria-hidden="true" />
                                        )}
                                        <span className="min-w-0 flex-1">
                                          <span className={styles.fileName}>{file.name}</span>
                                          <span className={styles.fileMeta}>
                                            {file.size >= 1024 * 1024
                                              ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
                                              : `${Math.max(1, Math.round(file.size / 1024))} KB`}
                                          </span>
                                        </span>
                                        <button
                                          type="button"
                                          className="flex min-h-11 min-w-11 items-center justify-center rounded-lg"
                                          aria-label={`Remove ${file.name}`}
                                          onClick={() => removeFile(index)}
                                        >
                                          <X className="size-4" aria-hidden="true" />
                                        </button>
                                      </li>
                                    ))}
                                  </ul>
                                </>
                              )}
                              <button
                                type="button"
                                className={styles.uploadButton}
                                onClick={() => inputRef.current?.click()}
                              >
                                <Upload className="size-4" aria-hidden="true" />
                                {files.length ? "Add files" : "Choose files"}
                              </button>
                              <p className={styles.formats}>
                                JPG, PNG, WebP · Up to 5 photos or one PDF
                              </p>
                              <input
                                ref={inputRef}
                                type="file"
                                multiple
                                accept={getUploadAcceptAttribute("attachment")}
                                className="sr-only"
                                aria-label="Upload event information"
                                onChange={(event) => {
                                  addFiles(Array.from(event.target.files || []));
                                  event.target.value = "";
                                }}
                              />
                            </div>
                          ) : (
                            <>
                              <h2 className={styles.taskHeading}>
                                Bring a link. We’ll find the details.
                              </h2>
                              <p className={`${styles.taskIntro} mb-5`}>
                                Use a public event page, schedule or document.
                              </p>
                              <label className={styles.fieldLabel}>
                                Public event URL
                                <input
                                  type="url"
                                  value={url}
                                  onChange={(event) => {
                                    invalidate();
                                    setUrl(event.target.value);
                                  }}
                                  placeholder="https://example.com/your-event"
                                  required={!usePastedText}
                                  disabled={usePastedText}
                                  className={styles.urlInput}
                                />
                              </label>
                              <button
                                type="button"
                                className={styles.fallbackButton}
                                onClick={() => {
                                  invalidate();
                                  setUsePastedText((value) => !value);
                                }}
                              >
                                {usePastedText
                                  ? "Read the public link instead"
                                  : "Can’t open the link? Paste the event text instead"}
                              </button>
                            </>
                          )}
                          {usePastedText && mode === "url" ? (
                            <label className={`${styles.fieldLabel} mt-4`}>
                              Paste event text
                              <textarea
                                aria-label="Paste event text"
                                value={text}
                                onChange={(event) => {
                                  invalidate();
                                  setText(event.target.value);
                                }}
                                rows={6}
                                maxLength={12000}
                                placeholder="Copy the title, dates, location and other event details."
                                className={styles.textarea}
                              />
                            </label>
                          ) : null}
                          {mode !== "files" || files.length ? (
                            <div className={styles.sourceFooter}>
                              {waitingToRead ? (
                                <p
                                  role="status"
                                  className="mb-3 flex items-center justify-between gap-3 text-sm text-[#786b80]"
                                >
                                  Checking event access before reading…
                                  <button
                                    type="button"
                                    className="min-h-11 px-2 font-semibold text-[#5b3fd1]"
                                    onClick={() => setWaitingToRead(false)}
                                  >
                                    Cancel
                                  </button>
                                </p>
                              ) : null}
                              <button
                                type="submit"
                                disabled={
                                  switchingMode ||
                                  waitingToRead ||
                                  (mode === "files"
                                    ? !files.length
                                    : usePastedText
                                      ? !text.trim()
                                      : !url.trim())
                                }
                                className={`${primary} inline-flex w-full items-center justify-center gap-2`}
                              >
                                {mode === "files"
                                  ? error
                                    ? "Retry parsing"
                                    : "Parse files"
                                  : "Read event information"}
                                <ArrowRight className="size-4" aria-hidden="true" />
                              </button>
                            </div>
                          ) : null}
                        </form>
                      )}
                    </fieldset>
                  </section>
                ) : (
                  <div className={styles.sourcePane}>
                    <p className={styles.taskIntro}>
                      {restoring
                        ? "Restoring your source…"
                        : ready && !canCreatePage
                          ? "Choose an available creation tool or request access above."
                          : "Checking your sign-in…"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
        {busy ? (
          <section className={styles.workspace} role="status" aria-live="polite">
            <div className={styles.workspaceGrid}>
              <div className={styles.progress}>
                <LoaderCircle
                  className="mb-5 size-8 animate-spin text-[#5b3fd1] motion-reduce:animate-none"
                  aria-hidden="true"
                />
                <h2 className={styles.taskHeading}>
                  {phase === "opening" ? "Getting your editor ready" : "Finding your event details"}
                </h2>
                <p className={styles.taskIntro}>{workingLabel}</p>
                <div className={styles.progressTrack} role="progressbar" aria-label={workingLabel}>
                  <div className={styles.progressFill} />
                </div>
                <button
                  type="button"
                  className={`${control} mt-5`}
                  onClick={() =>
                    void cancel().catch((failure) =>
                      setError(
                        failure instanceof Error
                          ? failure.message
                          : "Cancellation could not be confirmed. Please retry.",
                      ),
                    )
                  }
                >
                  Cancel {phase === "opening" ? "import" : "reading"}
                </button>
              </div>
            </div>
          </section>
        ) : null}
        {error ? (
          <div role="alert" className={styles.sourceError}>
            {error}
          </div>
        ) : null}
        {phase === "templates" && guess && intake?.ownerId === ownerId ? (
          <section aria-label="Matching event designs">
            <button type="button" className={styles.backButton} onClick={backToSource}>
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back to your information
            </button>
            <div className={styles.summary}>
              <div className={styles.summaryFacts}>
                <p className="mb-2 text-xs font-medium text-[#786b80]">
                  {intake.source.kind === "scratch"
                    ? "Your event"
                    : intake.classification?.confidence === "low"
                      ? "Check the event type below"
                      : "From your event information"}
                </p>
                <h2 ref={headingRef} tabIndex={-1} className={styles.summaryTitle}>
                  {information?.details.title || createGuessLabel(guess)}
                </h2>
                <p className={styles.summaryDetails}>
                  {[
                    information?.details.date,
                    information?.details.time,
                    information?.details.venue || information?.details.location,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "Add your event details in the editor after choosing a design."}
                </p>
              </div>
              <label className={styles.categoryField}>
                Event type
                <select
                  aria-label="Event type"
                  value={`${guess.category}:${guess.sport || ""}`}
                  onChange={(event) => {
                    const choice = choices.find(
                      (item) => `${item.category}:${item.sport || ""}` === event.target.value,
                    );
                    if (choice)
                      void chooseCategory(choice).catch((failure) => setError(String(failure)));
                  }}
                >
                  {!choices.some(
                    (item) => item.category === guess.category && item.sport === guess.sport,
                  ) ? (
                    <option value={`${guess.category}:${guess.sport || ""}`}>
                      {createGuessLabel(guess)}
                      {!supportedGuess ? " — access required" : ""}
                    </option>
                  ) : null}
                  {choices.map((choice) => (
                    <option
                      key={`${choice.category}:${choice.sport}`}
                      value={`${choice.category}:${choice.sport || ""}`}
                    >
                      {createGuessLabel(choice)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {guess.category === "holidays-seasonal" && supportedGuess ? (
              <div className={styles.collectionPanel}>
                <label className={styles.collectionFilter} htmlFor="creation-holiday-occasion">
                  Holiday or occasion
                  <select
                    id="creation-holiday-occasion"
                    value={guess.occasion || ""}
                    onChange={(event) => {
                      const occasion = HOLIDAY_COLLECTIONS.find((collection) => collection.id === event.target.value)?.id;
                      void chooseCategory({ ...guess, occasion: occasion || null }).catch((failure) => setError(String(failure)));
                    }}
                  >
                    <option value="">All holidays & seasonal occasions</option>
                    {[...new Set(HOLIDAY_COLLECTIONS.map((collection) => collection.kind))].map((kind) => (
                      <optgroup key={kind} label={kind}>
                        {HOLIDAY_COLLECTIONS.filter((collection) => collection.kind === kind).map((collection) => (
                          <option key={collection.id} value={collection.id}>{collection.name}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </label>
                <p className={styles.collectionHelp}>Choose an occasion to see its matching designs. Add your event date in the editor.</p>
              </div>
            ) : null}
            {personalCapture && supportedGuess ? (
              <div className="mt-5 rounded-2xl border border-[#e2d9eb] bg-white p-5">
                <h3 className="font-semibold">Save this appointment with Snap a Flyer</h3>
                <p className="mt-2 text-sm text-[#75677e]">
                  Keep the original document and use the appointment and calendar tools.
                </p>
                <button
                  type="button"
                  className={`${control} mt-4`}
                  onClick={() => {
                    const source = current.current?.source;
                    if (!source) return;
                    void savePendingSnapUpload({
                      file: source.files[0],
                      files: source.files,
                      text: source.files.length
                        ? source.text
                        : current.current?.sourceText || source.text,
                    })
                      .then(() => router.push("/snap?action=upload"))
                      .catch((failure) =>
                        setError(
                          failure instanceof Error
                            ? failure.message
                            : "Your document could not be prepared.",
                        ),
                      );
                  }}
                >
                  Continue with Snap a Flyer
                </button>
              </div>
            ) : !supportedGuess ? (
              <div className="mt-5 rounded-xl border border-[#e2d9eb] bg-white p-5">
                <p className="font-medium">This event type isn’t available for your account.</p>
                <p className="mt-2 text-sm text-[#75677e]">
                  Your upload is retained. Request access in Settings, or choose a different type if
                  the recognition is incorrect.
                </p>
                <Link href="/settings?section=creation" className={`${control} mt-4 inline-flex`}>
                  Request access
                </Link>
              </div>
            ) : guess.category === "sports" && !guess.sport ? (
              <p className="mt-5 rounded-xl border border-[#e2d9eb] bg-white p-5 text-sm text-[#75677e]">
                Choose the sport above to see its matching designs and schedule tools.
              </p>
            ) : intake?.source.kind !== "scratch" && !information && guess.category !== "sports" ? (
              <div className="mt-5 rounded-xl border border-[#e2d9eb] bg-white p-5">
                <p className="text-sm text-[#75677e]">
                  Read the retained source to populate this event type.
                </p>
                <button
                  type="button"
                  className={`${primary} mt-4`}
                  onClick={() => void readSource(undefined, guess)}
                >
                  Read event details
                </button>
              </div>
            ) : (
              <>
                <div className={styles.galleryHeading}>
                  <h2>{manualCreation ? "Made for your event" : "Change the design"}</h2>
                  {!manualCreation && templates[0] ? (
                    <button
                      type="button"
                      className={primary}
                      onClick={() => {
                        const record = current.current;
                        const template = record && defaultTemplateFor(record, true);
                        if (template) void openTemplate(template);
                      }}
                    >
                      Continue to editor
                    </button>
                  ) : (
                    <p>{activeDesignThemeFilter === "all" ? `${templates.length} designs` : `${visibleDesigns.length} of ${templates.length} designs`} · Your details stay with you</p>
                  )}
                </div>
                {designThemes.length ? (
                  <label className={`${styles.collectionFilter} ${styles.collectionFilterStandalone}`} htmlFor="creation-design-theme">
                    Theme or occasion
                    <select id="creation-design-theme" value={activeDesignThemeFilter} onChange={(event) => setDesignThemeFilter(event.target.value)}>
                      <option value="all">All themed designs</option>
                      {designThemes.map((theme) => <option key={theme.id} value={theme.id}>{theme.label}</option>)}
                    </select>
                  </label>
                ) : null}
                <CreationTemplateGallery
                  templates={visibleDesigns}
                  onSelect={(template) => void openTemplate(template)}
                />
                {!templates.length ? (
                  <p className="mt-5 text-sm text-[#75677e]">
                    Use a custom design below or choose another event type.
                  </p>
                ) : null}
                <div className={styles.templateActions}>
                  {!signupIntent && guess.category !== "sports" ? (
                    <button
                      type="button"
                      className={`${control} inline-flex items-center gap-2`}
                      onClick={() => setCustomDialog(true)}
                    >
                      <Sparkles className="size-4" aria-hidden="true" />
                      Create a custom design
                    </button>
                  ) : null}
                  {information &&
                  intake?.source.files.length === 1 &&
                  intake.source.files[0].type.startsWith("image/") &&
                  !signupIntent &&
                  guess.category !== "sports" ? (
                    <button
                      type="button"
                      className={control}
                      onClick={() => {
                        if (!current.current || submitting.current) return;
                        submitting.current = true;
                        void prepareOriginalCreationEditor(current.current)
                          .then((href) => router.push(href))
                          .catch((failure) =>
                            setError(
                              failure instanceof Error
                                ? failure.message
                                : "The uploaded design could not be opened.",
                            ),
                          )
                          .finally(() => {
                            submitting.current = false;
                          });
                      }}
                    >
                      Keep uploaded design
                    </button>
                  ) : null}
                  {(information || (guess.category === "sports" && !!intake?.sourceText)) &&
                  !signupIntent &&
                  access.access?.allowedProducts.includes("live_card") ? (
                    <button
                      type="button"
                      className={control}
                      onClick={() =>
                        void openLiveCard({
                          id: "live-card",
                          title: "Live Card",
                          imageUrl: "",
                          href: "/live-cards",
                          category: customCategoryForGuess(guess),
                          family: "live-card",
                          description: "",
                          style: "",
                        })
                      }
                    >
                      Create as Live Card
                    </button>
                  ) : null}
                </div>
              </>
            )}
          </section>
        ) : null}
      </div>
      {customDialog && guess && current.current?.ownerId === ownerId ? (
        <EventCustomThemeDialog
          category={customCategoryForGuess(guess)}
          initialInformation={information}
          initialPrompt={text}
          onClose={() => setCustomDialog(false)}
          onUseDesign={async (page) => {
            const previous = current.current;
            if (!previous) return;
            const customPage: CustomEventPage = {
              ...page,
              details: previous.information?.details || page.details,
            };
            const template: CreationTemplate = {
              id: "custom",
              title: "Custom design",
              imageUrl: page.artwork,
              href: `/event/design/customize?category=${customCategoryForGuess(guess)}`,
              category: customCategoryForGuess(guess),
              family: "custom",
              description: "",
              style: "Custom",
            };
            setPhase("opening");
            setWorkingLabel("Opening your custom design…");
            try {
              const next = await persist({
                ...previous,
                customPage,
                selectedTemplateId: "custom",
                phase: "editor",
              });
              const href = await prepareCreationEditor(next, template);
              if (previous.ownerId !== activeOwner.current) return;
              setCustomDialog(false);
              router.push(href);
            } catch (failure) {
              setPhase("templates");
              throw failure instanceof Error
                ? failure
                : new Error("Your design could not be opened. Please retry.");
            }
          }}
        />
      ) : null}
    </main>
  );
}
