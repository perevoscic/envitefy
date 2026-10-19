"use client";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  FileText,
  ImageIcon,
  Link2,
  LoaderCircle,
  LockKeyhole,
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
import {
  CREATE_CATEGORIES,
  CREATE_SPORT_KEYS,
  type CreateClassification,
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
import { getCreationPresentation } from "@/lib/create/creation-presentation";
import {
  informationForCreation,
  prepareCreationEditor,
  prepareOriginalCreationEditor,
} from "@/lib/create/editor-handoff";
import {
  cancelSportDiscovery,
  runSportDiscovery,
  sportDiscoveryStageLabel,
} from "@/lib/create/run-sport-discovery";
import { type CreationTemplate, getCreationTemplates } from "@/lib/create/template-selection";
import type { CustomEventInformation, CustomEventPage } from "@/lib/event-custom-design";
import { savePendingSnapUpload } from "@/lib/pending-snap-upload";
import { getUploadAcceptAttribute } from "@/lib/upload-config";
import { validateClientUploadFile } from "@/utils/media-upload-client";
import CreationInspiration from "./CreationInspiration";
import styles from "./create-workspace.module.css";

const EventCustomThemeDialog = dynamic(
  () => import("@/components/events/custom/EventCustomThemeDialog"),
  { ssr: false },
);
type Mode = "files" | "url" | "scratch";
type Phase = "source" | "recognizing" | "templates" | "opening";
const control =
  "min-h-11 rounded-[10px] border border-[#ded6e5] bg-white px-4 py-2.5 text-sm font-semibold text-[#5b3d80] transition hover:border-[#a98abb] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5b3d80] disabled:cursor-wait disabled:opacity-50";
const primary =
  "min-h-12 rounded-[10px] border border-[#5b3d80] bg-[#5b3d80] px-5 py-3 text-sm font-semibold text-white transition hover:border-[#483065] hover:bg-[#483065] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5b3d80] disabled:cursor-not-allowed disabled:opacity-50";

export function allowedCreationGuess(guess: CreateGuess, allowed: string[]) {
  return allowed.includes(customCategoryForGuess(guess));
}

export default function UnifiedCreatePageClient() {
  const router = useRouter(),
    search = useSearchParams();
  const { data: session, status } = useSession();
  const ownerId = creationIntakeOwner(session?.user);
  const activeOwner = useRef(ownerId);
  activeOwner.current = ownerId;
  const [workspaceOwner, setWorkspaceOwner] = useState(ownerId);
  const menu = useMenuOptional(),
    access = useCreationAccess();
  const [mode, setMode] = useState<Mode>("files");
  const modeIntakes = useRef<Partial<Record<Mode, CreationIntake>>>({});
  const changingMode = useRef(false);
  const [switchingMode, setSwitchingMode] = useState(false);
  const [typeQuery, setTypeQuery] = useState("");
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
  const inputRef = useRef<HTMLInputElement>(null),
    headingRef = useRef<HTMLHeadingElement>(null);
  const [phase, setPhase] = useState<Phase>("source");
  const [workingLabel, setWorkingLabel] = useState(""),
    [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [showTypes, setShowTypes] = useState(false);
  const [restoring, setRestoring] = useState(false),
    [customDialog, setCustomDialog] = useState(false);
  const ready =
    status === "authenticated" && !!ownerId && workspaceOwner === ownerId && !!access.access;
  const busy = phase === "recognizing" || phase === "opening";
  const allowedCategories = access.access?.allowedCategories || [];
  const canCreatePage = access.access?.allowedProducts.includes("event_page") === true;
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
    [guess?.category, guess?.sport, supportedGuess],
  );
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
  const initialChoices = preferredChoices;
  const manualChoices = showTypes ? choices : initialChoices;

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
    current.current = null;
    setIntake(null);
    setMode("files");
    modeIntakes.current = {};
    setFiles([]);
    setText("");
    setUrl("");
    setUsePastedText(false);
    setPhase("source");
    setError("");
    setCustomDialog(false);
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
    epoch.current++;
    request.current?.abort();
    request.current = null;
    submitting.current = false;
    setPhase("source");
    setError("");
    const previous = current.current;
    if (previous)
      update(
        previous.guess || previous.classification || previous.discoveryEventId
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
      !ready ||
      !canCreatePage ||
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
    submitting.current = true;
    request.current?.abort();
    const controller = new AbortController(),
      version = ++epoch.current;
    request.current = controller;
    setError("");
    setWorkingLabel("Reading your event information…");
    setPhase("recognizing");
    try {
      // Let any earlier source write finish before saving recognition, so its
      // older revision cannot replace this batch or its extracted information.
      await sourceSaves.current.catch(() => {});
      if (version !== epoch.current || controller.signal.aborted) return;
      let next = current.current || createCreationIntake(ownerId, source);
      next = await persist({ ...next, source, phase: "recognizing" });
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
          if (confirmedGuess) form.set("category", customCategoryForGuess(confirmedGuess));
          body = form;
        } else {
          headers = { "Content-Type": "application/json" };
          body = JSON.stringify({
            url: source.kind === "url" ? source.url : undefined,
            text: source.text,
            ...(confirmedGuess ? { category: customCategoryForGuess(confirmedGuess) } : {}),
          });
        }
        const response = await fetch("/api/create/extract", {
          method: "POST",
          credentials: "include",
          headers,
          body,
          signal: controller.signal,
        });
        const result = (await response.json().catch(() => ({}))) as {
          classification?: CreateClassification;
          information?: CustomEventInformation;
          sourceText?: string;
          error?: string;
        };
        if (version !== epoch.current || controller.signal.aborted) return;
        if (!response.ok)
          throw new Error(
            result.error ||
              "We couldn't read that source. Your information is retained so you can retry.",
          );
        if (!result.classification)
          throw new Error("Choose an event type so we can open the right editor.");
        next = await persist({
          ...next,
          classification: result.classification,
          guess: confirmedGuess || result.classification,
          information: result.information ? withCalendarDate(next, result.information) : undefined,
          sourceText: result.sourceText,
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
    const id = pendingUploadRead.current;
    if (!id || id !== intake?.id || !ready || !canCreatePage || restoring || phase !== "source")
      return;
    // A fresh gallery upload starts once. Consume its handoff before reading so
    // cancellation, failure and refresh keep their explicit retry behavior.
    pendingUploadRead.current = null;
    setLocation(id, "source");
    void readSource();
  }, [intake?.id, ready, canCreatePage, restoring, phase]);
  const chooseCategory = async (selected: CreateGuess) => {
    if (!allowedCreationGuess(selected, allowedCategories)) return;
    if (phase === "templates" && current.current) {
      const previous = current.current,
        category = customCategoryForGuess(selected);
      if (!previous.information && previous.source.kind !== "scratch") {
        await readSource(undefined, selected);
        return;
      }
      const version = ++epoch.current;
      request.current?.abort();
      const changed =
        selected.category !== previous.guess?.category || selected.sport !== previous.guess?.sport;
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
          onEventId: async (id) => {
            if (version !== epoch.current) return;
            next = await persist({ ...next, discoveryEventId: id });
          },
          onProgress: (value) => {
            if (version === epoch.current)
              setWorkingLabel(
                sportDiscoveryStageLabel(
                  value,
                  next.source.kind === "url"
                    ? "url"
                    : next.source.kind === "text"
                      ? "text"
                      : "file",
                ),
              );
          },
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
    const sportsImport =
      phase === "opening" &&
      previous?.guess?.category === "sports" &&
      ["files", "url", "text"].includes(previous.source.kind);
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
      setShowTypes(false);
      setTypeQuery("");
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

  const selectShortcut = async (selected: CreateGuess) => {
    if (!allowedCreationGuess(selected, allowedCategories) || !(await switchMode("scratch")))
      return;
    invalidate();
    const version = epoch.current;
    setFiles([]);
    setText("");
    setUrl("");
    if (selected.category === "sports" && !selected.sport) {
      current.current = null;
      setIntake(null);
      setShowTypes(true);
      return;
    }
    const next = createCreationIntake(ownerId, { kind: "scratch", files: [], text: "" });
    try {
      const saved = await persist({
        ...next,
        guess: selected,
        information: withCalendarDate({ ...next, guess: selected }),
        phase: "templates",
      });
      if (version !== epoch.current || saved.ownerId !== activeOwner.current) return;
      setPhase("templates");
      setLocation(saved.id, "templates", true);
    } catch (failure) {
      if (version === epoch.current) setError(String(failure));
    }
  };

  const visibleTypes = manualChoices.filter((choice) =>
    createGuessLabel(choice).toLowerCase().includes(typeQuery.trim().toLowerCase()),
  );
  const manualCreation = mode === "scratch";
  const progressSteps = manualCreation ? ["Start", "Design", "Details"] : ["Start", "Details"];
  const activeStep = phase === "opening" ? progressSteps.length - 1 : phase === "templates" ? 1 : 0;
  const preview = <CreationInspiration guess={preferredChoices[0]} />;

  return (
    <main className={styles.page} data-unified-create>
      <div className={styles.container}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>
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
        {access.loading || restoring ? (
          <p role="status" className="mb-4 flex items-center gap-2 text-sm text-[#786b80]">
            <LoaderCircle
              className="size-4 animate-spin motion-reduce:animate-none"
              aria-hidden="true"
            />
            {restoring ? "Restoring your unfinished event…" : "Loading your workspace…"}
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
                      { id: "files", title: "Upload", icon: Upload },
                      { id: "url", title: "Paste URL", icon: Link2 },
                      { id: "scratch", title: "Start from scratch", icon: PencilLine },
                    ] as const
                  ).map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      aria-label={option.title}
                      aria-pressed={mode === option.id}
                      disabled={busy || switchingMode || restoring || !ready || !canCreatePage}
                      onClick={() => void switchMode(option.id)}
                      className={`${styles.modeButton} ${mode === option.id ? styles.modeActive : ""}`}
                    >
                      <option.icon aria-hidden="true" />
                      <span className="sm:hidden">
                        {option.id === "scratch" ? "From scratch" : option.title}
                      </span>
                      <span className="hidden sm:inline">{option.title}</span>
                    </button>
                  ))}
                </div>
                {ready && canCreatePage && !restoring ? (
                  <section
                    className={styles.sourcePane}
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
                        <>
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <h2 className={styles.taskHeading}>What are you creating?</h2>
                              <p className={styles.taskIntro}>
                                Pick an event type to explore its designs.
                              </p>
                            </div>
                            <Link href="/settings?section=creation" className={styles.settingsLink}>
                              Manage event types
                              <ChevronRight className="size-3.5" aria-hidden="true" />
                            </Link>
                          </div>
                          {showTypes ? (
                            <div className={styles.pickerTools}>
                              <label className="sr-only" htmlFor="creation-type-search">
                                Search event types
                              </label>
                              <input
                                id="creation-type-search"
                                type="search"
                                value={typeQuery}
                                onChange={(event) => setTypeQuery(event.target.value)}
                                placeholder="Search event types"
                                className={styles.typeSearch}
                              />
                            </div>
                          ) : null}
                          <div className={styles.typeGrid}>
                            {visibleTypes.map((choice) => {
                              const designs = getCreationTemplates(choice);
                              return (
                                <button
                                  key={`${choice.category}:${choice.sport}`}
                                  type="button"
                                  aria-label={createGuessLabel(choice)}
                                  className={styles.typeButton}
                                  onClick={() => void chooseCategory(choice)}
                                >
                                  {designs[0]?.imageUrl ? (
                                    <img
                                      src={designs[0].imageUrl}
                                      alt=""
                                      className={styles.typeThumb}
                                      loading="lazy"
                                    />
                                  ) : (
                                    <span
                                      className={`${styles.typeThumb} flex items-center justify-center`}
                                    >
                                      <FileText
                                        className="m-auto size-5 text-[#8c769b]"
                                        aria-hidden="true"
                                      />
                                    </span>
                                  )}
                                  <span className={styles.typeCopy}>
                                    <span className={styles.typeLabel}>
                                      {createGuessLabel(choice)}
                                    </span>
                                    <span className={styles.typeMeta}>
                                      {designs.length
                                        ? `${designs.length} designs`
                                        : "Choose a design"}
                                    </span>
                                  </span>
                                  <ChevronRight className={styles.typeArrow} aria-hidden="true" />
                                </button>
                              );
                            })}
                          </div>
                          {!visibleTypes.length ? (
                            <p className={styles.taskIntro}>
                              {typeQuery.trim()
                                ? "No matching event types. Try another search."
                                : menu?.featureVisibility.hasLoadedPreferences
                                  ? "Choose the event types you use, or browse available event types below."
                                  : "Loading your event types…"}
                            </p>
                          ) : null}
                          {!showTypes && choices.length > manualChoices.length ? (
                            <button
                              type="button"
                              className={styles.moreTypes}
                              onClick={() => setShowTypes(true)}
                            >
                              {initialChoices.length
                                ? "More event types"
                                : "Browse available event types"}
                              <ChevronRight className="size-4" aria-hidden="true" />
                            </button>
                          ) : null}
                        </>
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
                              <button
                                type="submit"
                                disabled={
                                  switchingMode ||
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
                      {mode !== "scratch" ? (
                        <p className={styles.privacyNote}>
                          <LockKeyhole aria-hidden="true" />
                          Your page stays private until you publish.
                        </p>
                      ) : null}
                    </fieldset>
                  </section>
                ) : (
                  <div className={styles.sourcePane}>
                    <p className={styles.taskIntro}>
                      {restoring
                        ? "Restoring your source…"
                        : !canCreatePage && !access.loading
                          ? "Choose an available creation tool or request access above."
                          : "Loading your workspace…"}
                    </p>
                  </div>
                )}
              </div>
              {ready && canCreatePage && !restoring && mode !== "scratch" ? preview : null}
            </div>
          </div>
        ) : null}
        {busy ? (
          <section className={styles.workspace} role="status" aria-live="polite">
            <div className={styles.workspaceGrid}>
              <div className={styles.progress}>
                <LoaderCircle
                  className="mb-5 size-8 animate-spin text-[#5b3d80] motion-reduce:animate-none"
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
              {preview}
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
                    <p>{templates.length} designs · Your details stay with you</p>
                  )}
                </div>
                <CreationTemplateGallery
                  templates={templates}
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
                  {information &&
                  !signupIntent &&
                  access.access?.allowedProducts.includes("live_card") ? (
                    <button
                      type="button"
                      className={control}
                      onClick={() =>
                        void openTemplate({
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
        {!busy && phase === "source" && mode !== "scratch" && ready && canCreatePage ? (
          <section className={styles.shortcuts} aria-label="Your event templates">
            <div className={styles.shortcutsHeader}>
              <h2 className={styles.shortcutsTitle}>Your event templates</h2>
              <button
                type="button"
                className={styles.shortcutButton}
                disabled={switchingMode || restoring}
                onClick={async () => {
                  if (await switchMode("scratch")) setShowTypes(true);
                }}
              >
                Browse available event types
                <ArrowRight className="size-4" aria-hidden="true" />
              </button>
            </div>
            {preferred.length ? (
              <div className={styles.shortcutGrid}>
                {preferred.slice(0, 4).map((item) => {
                  const presentation = getCreationPresentation(item.guess);
                  return (
                    <button
                      key={item.href}
                      type="button"
                      aria-label={item.label}
                      className={styles.shortcutTile}
                      disabled={switchingMode || restoring}
                      onClick={() => void selectShortcut(item.guess)}
                    >
                      {presentation.artwork ? (
                        <img
                          src={presentation.artwork}
                          alt=""
                          className={styles.typeThumb}
                          loading="lazy"
                        />
                      ) : (
                        <span className={styles.typeThumb}>
                          <FileText aria-hidden="true" />
                        </span>
                      )}
                      <span className={styles.typeCopy}>
                        <span className={styles.typeLabel}>{item.label}</span>
                      </span>
                      <ChevronRight className={styles.typeArrow} aria-hidden="true" />
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className={styles.emptySuggestions} role="status">
                {menu?.featureVisibility.hasLoadedPreferences
                  ? "Choose the event types you use in Manage event types."
                  : "Loading your event templates…"}
              </p>
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
