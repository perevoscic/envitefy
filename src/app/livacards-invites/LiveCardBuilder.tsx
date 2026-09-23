"use client";

import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  Eye,
  Gift,
  ImagePlus,
  Loader2,
  Mail,
  Plus,
  Save,
  Smartphone,
  Sparkles,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { sanitizeInvitationData } from "@/app/studio/studio-workspace-sanitize";
import ArtworkDownloadButton from "@/components/ArtworkDownloadButton";
import ArtworkPreviewDialog from "@/components/ArtworkPreviewDialog";
import StudioShowcaseLiveCard from "@/components/studio/StudioShowcaseLiveCard";
import { useUnsavedProgress } from "@/components/UnsavedProgressProvider";
import {
  createLiveCardForm,
  emptyLiveCardLocation,
  isSharedCardDesignCurrent,
  LIVE_CARD_BUILDER_PATH,
  LIVE_CARD_BUILDER_SOURCE,
  LIVE_CARD_EVENT_TYPES,
  type LiveCardErrors,
  type LiveCardForm,
  liveCardDateTime,
  liveCardDesignKey,
  readLiveCardForm,
  sharedCardDesignKey,
  validateLiveCard,
} from "@/lib/livecard-builder";
import {
  type BuilderPlace,
  type LocationPreparationIssue,
  locationLookupKey,
  mergeResolvedLocation,
  readBuilderPlace,
} from "@/lib/livecard-location";
import { liveCardWordingKey, mergeLiveCardProofread } from "@/lib/livecard-wording";
import { composeSharedCard } from "@/lib/shared-card-canvas";
import { hasGeneratedCardHeadline, readSharedCardDesign } from "@/lib/shared-card-design";
import type { GenerationStage } from "@/lib/studio/generation-progress";
import { buildEventPath } from "@/utils/event-url";
import { persistImageMediaValue } from "@/utils/media-upload-client";
import DesignGenerationProgress from "./DesignGenerationProgress";
import LocationField from "./LocationField";
import {
  type LiveCardArtwork,
  liveCardDetails,
  liveCardHistoryPayload,
  liveCardInvitation,
  restoreLiveCardForm,
} from "./livecard-adapters";
import styles from "./livecard-builder.module.css";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function Field({
  id,
  label,
  hint,
  error,
  hideLabel = false,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  hideLabel?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={hideLabel ? styles.hiddenLabel : undefined}>
        {label}
      </label>
      {children}
      {hint && (
        <p id={`${id}-hint`} className={styles.hint}>
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className={styles.fieldError}>
          {error}
        </p>
      )}
    </div>
  );
}

function Toggle({
  id,
  title,
  description,
  enabled,
  onChange,
  icon,
  children,
}: {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  onChange: () => void;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className={styles.optionalSection}>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-controls={`${id}-fields`}
        onClick={onChange}
        className={styles.toggleRow}
      >
        <span className={styles.sectionIcon} aria-hidden="true">
          {icon}
        </span>
        <span className={styles.toggleCopy}>
          <strong>{title}</strong>
          <span>{description}</span>
        </span>
        <span className={styles.switch} data-on={enabled} aria-hidden="true">
          <span />
        </span>
      </button>
      {enabled && (
        <div id={`${id}-fields`} className={styles.toggleFields}>
          {children}
        </div>
      )}
    </section>
  );
}

type Snapshot = { form: LiveCardForm; artwork: LiveCardArtwork | null };
const serialize = (snapshot: Snapshot) => JSON.stringify(snapshot);
const DETAIL_TABS = ["Basics", "When & Where", "RSVP", "Registry"] as const;
const STEPS = ["Design", "Event details", "Review"] as const;
const FIELD_LABELS: Partial<Record<keyof LiveCardForm, string>> = {
  title: "Event title",
  eventType: "Event type",
  date: "Event date",
  startTime: "Start time",
  endDate: "End date",
  endTime: "End time",
  locations: "Location",
  timezone: "Location",
  hostName: "Host name",
  hostEmail: "RSVP contact",
  rsvpDeadline: "RSVP deadline",
  registryUrl: "Registry link",
};
type BuilderStep = 1 | 2 | 3;
type DetailTab = (typeof DETAIL_TABS)[number];
export default function LiveCardBuilder({ initialEventId }: { initialEventId: string | null }) {
  const [form, setForm] = useState(createLiveCardForm);
  const [artwork, setArtwork] = useState<LiveCardArtwork | null>(null);
  const checkedWording = useRef("");
  const wordingController = useRef<AbortController | null>(null);
  const pendingWording = useRef<Promise<boolean> | null>(null);
  const [preparingWording, setPreparingWording] = useState(false);
  const [preparingHeadline, setPreparingHeadline] = useState(false);
  const [publicUrl, setPublicUrl] = useState("");
  const [step, setStep] = useState<BuilderStep>(1);
  const [detailTab, setDetailTab] = useState<DetailTab>("Basics");
  const [expandedTextFields, setExpandedTextFields] = useState({
    overview: false,
    instructions: false,
  });
  const [activeLocationId, setActiveLocationId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [reload, setReload] = useState(0);
  const [baseline, setBaseline] = useState("");
  const [generation, setGeneration] = useState<GenerationStage | null>(null);
  const [generationError, setGenerationError] = useState("");
  const [partialImage, setPartialImage] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const [published, setPublished] = useState(false);
  const [message, setMessage] = useState("");
  const [locationIssues, setLocationIssues] = useState<Record<string, LocationPreparationIssue>>(
    {},
  );
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<LiveCardErrors>({});
  const [previewOpen, setPreviewOpen] = useState(false);
  const savedId = useRef(initialEventId);
  const draftId = useRef("");
  const generationController = useRef<AbortController | null>(null);
  const generationVersion = useRef(0);
  const uploadCache = useRef(new Map<string, Promise<string>>());
  const headingRef = useRef<HTMLHeadingElement>(null);
  const reviewHeadingRef = useRef<HTMLHeadingElement>(null);
  const snapshot = { form, artwork };
  const snapshotRef = useRef<Snapshot>(snapshot);
  snapshotRef.current = snapshot;
  const dirty = ready && serialize(snapshot) !== baseline;
  const isArtworkCurrent = (value: LiveCardForm, image: LiveCardArtwork) =>
    image.invitationData?.sharedDesign
      ? isSharedCardDesignCurrent(value, image.designKey)
      : image.designKey === liveCardDesignKey(value);
  const designChanged = Boolean(artwork && !isArtworkCurrent(form, artwork));
  const publishErrors = validateLiveCard(form, "publish");
  const preparationErrors = validateLiveCard(form, "prepare");
  const detailIssues = (Object.keys(preparationErrors) as (keyof LiveCardForm)[]).filter(
    (key) => key !== "design" && (key !== "timezone" || !preparationErrors.locations),
  );
  const canReview =
    Boolean(artwork) &&
    !designChanged &&
    !generation &&
    Object.keys(preparationErrors).length === 0;

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setReady(false);
    setLoadError("");
    draftId.current ||= crypto.randomUUID();
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    async function load() {
      let nextForm = createLiveCardForm(timezone);
      let nextArtwork: LiveCardArtwork | null = null;
      if (initialEventId) {
        const response = await fetch(`/api/history/${encodeURIComponent(initialEventId)}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        const row = asRecord(await response.json());
        const data = asRecord(row.data);
        if (!response.ok)
          throw new Error(
            "This card could not be opened. Check that you are signed in to its owner account.",
          );
        if (data.createdVia !== LIVE_CARD_BUILDER_SOURCE)
          throw new Error("This event uses a different editor. Open it from My Events.");
        const builder = asRecord(data.liveCardBuilder);
        const restored = restoreLiveCardForm(builder.form, data);
        if (!restored) throw new Error("The saved card details could not be loaded.");
        nextForm = restored;
        const card = asRecord(data.studioCard);
        if (typeof card.imageUrl === "string" && card.imageUrl)
          nextArtwork = {
            imageUrl: card.imageUrl,
            designKey: typeof builder.designKey === "string" ? builder.designKey : "",
            invitationData: sanitizeInvitationData(card.invitationData, liveCardDetails(nextForm)),
          };
        if (nextArtwork?.invitationData?.sharedDesign)
          nextArtwork.imageUrl = nextArtwork.invitationData.sharedDesign.backgroundUrl;
        if (!active) return;
        const isPublished = data.status === "published";
        if (isPublished)
          setPublicUrl(
            `https://envitefy.com${buildEventPath(initialEventId, nextForm.title, undefined, typeof row.public_slug === "string" ? row.public_slug : undefined)}`,
          );
        setPublished(isPublished);
        setStep(nextArtwork ? 2 : 1);
      }
      if (!active) return;

      setForm(nextForm);
      checkedWording.current = "";
      setArtwork(nextArtwork);
      setBaseline(serialize({ form: nextForm, artwork: nextArtwork }));
      setReady(true);
    }
    void load().catch((failure: Error) => {
      if (active && !controller.signal.aborted) setLoadError(failure.message);
    });
    return () => {
      active = false;
      controller.abort();
    };
  }, [initialEventId, reload]);

  useEffect(
    () => () => {
      generationVersion.current += 1;
      generationController.current?.abort();
      wordingController.current?.abort();
    },
    [],
  );

  function change<K extends keyof LiveCardForm>(key: K, value: LiveCardForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setError("");
    setMessage("");
  }

  async function prepareLocations(signal: AbortSignal): Promise<boolean> {
    // Resolve all stops at final preparation, including collapsed sections. Never search as the host types.
    while (!signal.aborted) {
      const before = snapshotRef.current.form;
      const pending = before.locations.filter(
        (location) =>
          location.resolution === "unresolved" || !location.address || !location.timezone,
      );
      if (!pending.length) return true;
      const results = await Promise.all(
        pending
          .map(async (location) => {
            const query = location.query || location.venue || location.address;
            const response = await fetch("/api/livecard-builder/location", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              signal,
              body: JSON.stringify({
                ...location,
                query,
                date: before.date,
                timezone: before.timezone,
              }),
            });
            const result = asRecord(await response.json());
            if (!response.ok) throw new Error("Location preparation unavailable");
            const resolved = result.location
              ? readLiveCardForm({ locations: [result.location] })?.locations[0]
              : undefined;
            const candidates = Array.isArray(result.candidates)
              ? result.candidates
                  .map(readBuilderPlace)
                  .filter((place): place is BuilderPlace => Boolean(place))
              : [];
            return { before: location, query, resolved, candidates, unavailable: false };
          })
          .map((request, index) =>
            request.catch(() => ({
              before: pending[index],
              query: pending[index].query || pending[index].venue || pending[index].address,
              resolved: undefined,
              candidates: [],
              unavailable: true,
            })),
          ),
      );
      if (signal.aborted) return false;
      let next = snapshotRef.current.form;
      const issues: Record<string, LocationPreparationIssue> = {};
      for (const result of results) {
        const active = next.locations.find((location) => location.id === result.before.id);
        if (!active || locationLookupKey(active) !== locationLookupKey(result.before)) continue;
        if (result.resolved?.address && result.resolved.timezone) {
          next = mergeResolvedLocation(next, result.before, result.resolved);
        } else {
          issues[active.id] = {
            query: result.query,
            candidates: result.candidates,
            message: result.unavailable
              ? "We couldn’t check this location right now. Select Review to retry."
              : result.candidates.length
                ? "Which venue is yours?"
                : "We couldn’t identify this venue. Add its city or full address.",
          };
        }
      }
      snapshotRef.current = { ...snapshotRef.current, form: next };
      setForm(next);
      setLocationIssues(issues);
      if (Object.keys(issues).length) {
        setActiveLocationId(Object.keys(issues)[0]);
        focusFirstError({ locations: "Check the location below to finish your card." });
        return false;
      }
      // A changed query is resolved on the next pass; never overwrite newer venue input.
    }
    return false;
  }

  async function prepareHeadline(signal: AbortSignal): Promise<boolean> {
    const before = snapshotRef.current;
    const design = before.artwork?.invitationData?.sharedDesign;
    if (
      !design ||
      hasGeneratedCardHeadline({
        title: before.form.title,
        headlineIntro: before.form.headlineIntro,
        sharedDesign: design,
      })
    )
      return true;
    setPreparingHeadline(true);
    try {
      const response = await fetch("/api/livecard-builder/headline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal,
        body: JSON.stringify({ form: before.form, design }),
      });
      const result = asRecord(await response.json());
      const updated = readSharedCardDesign({ ...design, headline: result.headline });
      if (!response.ok || !updated?.headline)
        throw new Error(
          typeof result.error === "string"
            ? result.error
            : "The title artwork could not be prepared. Select Review to retry.",
        );
      if (signal.aborted) return false;
      const current = snapshotRef.current;
      if (
        !current.artwork ||
        current.artwork.invitationData?.sharedDesign?.backgroundUrl !== design.backgroundUrl ||
        !isArtworkCurrent(current.form, current.artwork) ||
        !hasGeneratedCardHeadline({
          title: current.form.title,
          headlineIntro: current.form.headlineIntro,
          sharedDesign: updated,
        })
      ) {
        setError(
          "Your title or design changed while the lettering was being drawn. Select Review to prepare the latest version.",
        );
        return false;
      }
      const nextArtwork = {
        ...current.artwork,
        invitationData: { ...current.artwork.invitationData, sharedDesign: updated },
      };
      snapshotRef.current = { ...current, artwork: nextArtwork };
      setArtwork(nextArtwork);
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      return true;
    } catch (failure) {
      if (!signal.aborted)
        setError(
          failure instanceof Error
            ? failure.message
            : "The title artwork could not be prepared. Select Review to retry.",
        );
      return false;
    } finally {
      setPreparingHeadline(false);
    }
  }

  function prepareWording(): Promise<boolean> {
    if (pendingWording.current) return pendingWording.current;
    const controller = new AbortController();
    wordingController.current = controller;
    const task = async () => {
      setPreparingWording(true);
      setError("");
      try {
        if (!(await prepareLocations(controller.signal))) return false;
        // If the host types while a request runs, keep their edits and check the latest wording.
        while (!controller.signal.aborted) {
          const before = snapshotRef.current.form;
          if (checkedWording.current === liveCardWordingKey(before)) {
            if (
              !(await prepareLocations(controller.signal)) ||
              !(await prepareHeadline(controller.signal)) ||
              !(await prepareLocations(controller.signal))
            )
              return false;
            if (checkedWording.current === liveCardWordingKey(snapshotRef.current.form))
              return true;
            continue;
          }
          const response = await fetch("/api/livecard-builder/assist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: controller.signal,
            body: JSON.stringify({ mode: "wording", form: before }),
          });
          const result = asRecord(await response.json());
          const corrected = readLiveCardForm(result.form);
          if (!response.ok || !corrected) throw new Error("Wording unavailable");
          if (controller.signal.aborted) return false;
          const next = mergeLiveCardProofread(snapshotRef.current.form, before, corrected);
          checkedWording.current = liveCardWordingKey(corrected);
          snapshotRef.current = { ...snapshotRef.current, form: next };
          setForm(next);
          // Let previews and download callbacks observe the corrected text before continuing.
          await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        }
        return false;
      } catch {
        if (!controller.signal.aborted)
          setError(
            "We couldn’t finish preparing your Live Card. Your details are safe. Please try again.",
          );
        return false;
      } finally {
        if (wordingController.current === controller) {
          pendingWording.current = null;
          setPreparingWording(false);
        }
      }
    };
    const pending = task();
    pendingWording.current = pending;
    void pending.finally(() => {
      if (pendingWording.current === pending) pendingWording.current = null;
    });
    return pending;
  }

  async function persistReference(currentForm: LiveCardForm): Promise<LiveCardForm> {
    const value = currentForm.referenceUrl;
    if (!value.startsWith("data:")) return currentForm;
    let pending = uploadCache.current.get(value);
    if (!pending) {
      pending = persistImageMediaValue({ value, fileName: "livecard-reference.png" }).then(
        (url) => {
          if (!url || url.startsWith("data:"))
            throw new Error("Your reference image could not be uploaded. Please try again.");
          return url;
        },
      );
      uploadCache.current.set(value, pending);
      void pending.catch(() => uploadCache.current.delete(value));
    }
    const referenceUrl = await pending;
    setForm((latest) => (latest.referenceUrl === value ? { ...latest, referenceUrl } : latest));
    return { ...currentForm, referenceUrl };
  }

  async function persistBackground(value: string): Promise<string> {
    let pending = uploadCache.current.get(value);
    if (!pending) {
      pending = persistImageMediaValue({ value, fileName: "card-background.webp" }).then((url) => {
        if (!url) throw new Error("The background could not be saved. Please retry.");
        return url;
      });
      uploadCache.current.set(value, pending);
      void pending.catch(() => uploadCache.current.delete(value));
    }
    return pending;
  }

  async function generate() {
    if (generation) return;
    const current = snapshotRef.current.form;
    const validation = validateLiveCard(current, "design");
    setErrors(validation);
    if (Object.keys(validation).length) {
      setStep(1);

      focusFirstError(validation);
      setError("Complete the highlighted fields before creating your design.");
      return;
    }
    generationController.current?.abort();
    const controller = new AbortController();
    generationController.current = controller;
    const version = ++generationVersion.current;
    setGeneration("preparing");
    setGenerationError("");
    setError("");
    setPartialImage(null);
    void goToStep(2);
    try {
      const prepared = await persistReference(current);
      if (version !== generationVersion.current) return;
      setGeneration("generating");
      const response = await fetch("/api/livecard-builder/design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({ form: prepared }),
      });
      const body = asRecord(await response.json());
      const sharedDesign = readSharedCardDesign(body.design);
      if (!response.ok || !sharedDesign)
        throw new Error(
          typeof body.error === "string"
            ? body.error
            : "The design could not be created. Please retry.",
        );
      if (version !== generationVersion.current || controller.signal.aborted) return;
      // Apply artwork only. The host may have changed any event field while we waited.
      setArtwork({
        imageUrl: sharedDesign.backgroundUrl,
        designKey: sharedCardDesignKey(prepared),
        invitationData: { sharedDesign },
      });
    } catch (failure) {
      if (version === generationVersion.current && !controller.signal.aborted)
        setGenerationError(
          failure instanceof Error
            ? failure.message
            : "We couldn't finish the design. Your details are still here.",
        );
    } finally {
      if (version === generationVersion.current) {
        setGeneration(null);
        setPartialImage(null);
      }
    }
  }

  async function save(publish = published, toDashboard = false): Promise<void> {
    if (working) throw new Error("A save is already in progress.");
    if (publish && !(await prepareWording()))
      throw new Error(
        "We couldn’t finish preparing your Live Card. Your details are safe. Please try again.",
      );
    const captured = snapshotRef.current;
    if (publish) {
      const validation = validateLiveCard(captured.form, "publish");
      setErrors(validation);
      if (Object.keys(validation).length) {
        focusFirstError(validation);
        throw new Error("Complete the highlighted fields before publishing.");
      }
      if (generation)
        throw new Error("Your artwork is still generating. You can save a draft while you wait.");
      if (!captured.artwork || !isArtworkCurrent(captured.form, captured.artwork))
        throw new Error("Generate the current design before publishing.");
    }
    setWorking(true);
    setError("");
    setMessage("");
    try {
      const prepared = await persistReference(captured.form);
      let savedArtwork = captured.artwork;
      if (savedArtwork?.invitationData?.sharedDesign) {
        const backgroundUrl = await persistBackground(
          savedArtwork.invitationData.sharedDesign.backgroundUrl,
        );
        const headline = savedArtwork.invitationData.sharedDesign.headline;
        const savedHeadline = headline
          ? { ...headline, imageUrl: await persistBackground(headline.imageUrl) }
          : undefined;
        const invitationData = liveCardInvitation(prepared, {
          ...savedArtwork.invitationData,
          sharedDesign: {
            ...savedArtwork.invitationData.sharedDesign,
            backgroundUrl,
            headline: savedHeadline,
          },
        });
        const composed = await composeSharedCard(
          invitationData,
          publish ? prepared.format : "live_card",
        );
        const imageUrl = await persistImageMediaValue({
          value: composed,
          fileName: "invitation.webp",
        });
        if (!imageUrl) throw new Error("The card could not be saved. Please retry.");
        savedArtwork = { ...savedArtwork, imageUrl, invitationData };
      }
      const payload = liveCardHistoryPayload(
        prepared,
        savedArtwork,
        publish ? "published" : "draft",
      );
      const id = savedId.current;
      const response = await fetch(id ? `/api/history/${encodeURIComponent(id)}` : "/api/history", {
        method: id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, ...(id ? {} : { clientDraftId: draftId.current }) }),
      });
      let row = asRecord(await response.json());
      if (!response.ok || typeof row.id !== "string")
        throw new Error(
          typeof row.error === "string"
            ? row.error
            : "Your card could not be saved. Please try again.",
        );
      // A lost initial response can leave the idempotent POST pointing at an older snapshot.
      if (!id && response.status === 200) {
        const retry = await fetch(`/api/history/${encodeURIComponent(row.id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        row = asRecord(await retry.json());
        if (!retry.ok || typeof row.id !== "string")
          throw new Error("Your latest changes could not be saved. Please retry.");
      }
      savedId.current = String(row.id);
      setBaseline(serialize({ form: prepared, artwork: captured.artwork }));
      setPublished(publish);
      if (publish)
        setPublicUrl(
          `https://envitefy.com${buildEventPath(String(row.id), prepared.title, undefined, typeof row.public_slug === "string" ? row.public_slug : undefined)}`,
        );
      window.history.replaceState(
        window.history.state,
        "",
        `${LIVE_CARD_BUILDER_PATH}?edit=${encodeURIComponent(savedId.current)}`,
      );
      window.dispatchEvent(new CustomEvent("history:updated", { detail: { id: savedId.current } }));
      setMessage(
        publish
          ? published
            ? "Your Live Card is updated."
            : "Your Live Card is published. It's ready to share."
          : "Draft saved. Find it in Drafts anytime.",
      );
      if (publish && toDashboard) {
        const destination = buildEventPath(
          savedId.current,
          prepared.title,
          { tab: "dashboard", published: "1" },
          typeof row.public_slug === "string" ? row.public_slug : undefined,
        );
        navigation.allowNavigation(() => window.location.assign(destination));
      }
    } finally {
      setWorking(false);
    }
  }

  const navigation = useUnsavedProgress({
    dirty,
    busy: working || preparingWording,
    save: () => save(),
    discard: () => {
      generationVersion.current += 1;
      generationController.current?.abort();
      wordingController.current?.abort();
    },
  });

  function saveWithFeedback(publish: boolean, toDashboard = false) {
    void save(publish, toDashboard).catch((failure: Error) => setError(failure.message));
  }

  async function selectReference(file?: File) {
    if (!file) return;
    if (
      !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
      file.size > 10 * 1024 * 1024
    ) {
      setError("Choose a JPG, PNG, or WebP image smaller than 10 MB.");
      return;
    }
    try {
      const url = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () =>
          typeof reader.result === "string"
            ? resolve(reader.result)
            : reject(new Error("Image could not be read."));
        reader.onerror = () => reject(new Error("Image could not be read."));
        reader.readAsDataURL(file);
      });
      change("referenceUrl", url);
      setError("");
    } catch {
      setError("The image could not be opened. Please choose it again.");
    }
  }

  async function goToStep(next: BuilderStep) {
    if (next === 3) {
      if (!canReview || !(await prepareWording())) return;
      // The host can still edit fields while wording is being prepared.
      const latest = snapshotRef.current;
      const validation = validateLiveCard(latest.form, "publish");
      if (Object.keys(validation).length) {
        setErrors(validation);
        focusFirstError(validation);
        return;
      }
      if (!latest.artwork || !isArtworkCurrent(latest.form, latest.artwork)) return;
    }
    if (next !== step) setMessage("");
    setStep(next);
  }

  const previousStep = useRef(step);
  useEffect(() => {
    if (previousStep.current === step) return;
    previousStep.current = step;
    const heading =
      step === 3 ? reviewHeadingRef.current || headingRef.current : headingRef.current;
    heading?.focus();
  }, [step]);

  function focusFirstError(validation: LiveCardErrors) {
    const key = Object.keys(validation)[0];
    setStep(key === "design" || key === "eventType" ? 1 : 2);
    if (key === "overview" || key === "instructions")
      setExpandedTextFields((current) => ({ ...current, [key]: true }));
    if (["title", "headlineIntro", "overview", "instructions"].includes(key))
      setDetailTab("Basics");
    else if (["date", "startTime", "endDate", "endTime", "timezone"].includes(key))
      setDetailTab("When & Where");
    else if (["hostName", "hostEmail", "hostPhone", "rsvpDeadline"].includes(key))
      setDetailTab("RSVP");
    else if (key === "registryUrl") setDetailTab("Registry");
    const location =
      snapshotRef.current.form.locations.find(
        (item) => !item.address.trim() || item.resolution === "unresolved" || !item.timezone,
      ) || snapshotRef.current.form.locations[0];
    if (key === "locations" || key === "timezone") {
      setDetailTab("When & Where");
      setActiveLocationId(location?.id || null);
    }
    const id =
      (key === "locations" || key === "timezone") && location
        ? `location-${location.id}-address`
        : `livecard-${key}`;
    requestAnimationFrame(() => {
      const input = document.getElementById(id);
      if (input) input.focus();
      else headingRef.current?.focus();
    });
  }

  function selectDetailTab(next: DetailTab, focus = false) {
    setDetailTab(next);
    requestAnimationFrame(() => {
      const tab = document.getElementById(`detail-tab-${next}`);
      if (focus) tab?.focus();
      tab?.scrollIntoView({ block: "nearest", inline: "nearest" });
    });
  }

  function textField(
    key: Exclude<
      keyof LiveCardForm,
      "eventType" | "locations" | "rsvpEnabled" | "registryEnabled" | "sourceEvidence" | "format"
    >,
    label: string,
    options: {
      type?: string;
      placeholder?: string;
      multiline?: boolean;
      hint?: string;
      required?: boolean;
      hideLabel?: boolean;
    } = {},
  ) {
    const id = `livecard-${key}`;
    const collapsible = key === "overview" || key === "instructions";
    const shared = {
      id,
      value: form[key],
      onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        change(key, event.target.value),
      "aria-invalid": Boolean(errors[key]),
      "aria-describedby":
        [options.hint ? `${id}-hint` : "", errors[key] ? `${id}-error` : ""]
          .filter(Boolean)
          .join(" ") || undefined,
      required: options.required,
      placeholder: options.placeholder,
      maxLength: options.multiline ? 4000 : 300,
    };
    const field = (
      <Field
        id={id}
        label={label}
        hint={options.hint}
        error={errors[key]}
        hideLabel={collapsible || options.hideLabel}
      >
        {options.multiline ? (
          <textarea {...shared} rows={3} />
        ) : (
          <input {...shared} type={options.type || "text"} />
        )}
      </Field>
    );
    if (!collapsible) return field;
    const expanded = expandedTextFields[key];
    return (
      <div className={styles.collapsibleField}>
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={`${id}-fields`}
          onClick={() => setExpandedTextFields((current) => ({ ...current, [key]: !current[key] }))}
        >
          <span>{label}</span>
          <ChevronDown size={18} aria-hidden="true" />
        </button>
        <div id={`${id}-fields`} className={styles.collapsibleFieldBody} hidden={!expanded}>
          {field}
        </div>
      </div>
    );
  }

  const hasSharedDesign = Boolean(artwork?.invitationData?.sharedDesign);
  const activePreviewFormat = hasSharedDesign ? "live_card" : form.format;
  const outputs = [
    {
      format: activePreviewFormat,
      name: activePreviewFormat === "live_card" ? "Live Card" : "Saved invitation",
      description:
        activePreviewFormat === "live_card"
          ? "Share a link to event details, directions and optional RSVPs."
          : "Preview your existing artwork before publishing.",
      icon: activePreviewFormat === "live_card" ? Smartphone : Mail,
    },
  ];
  const previewFor = (format: LiveCardForm["format"]) =>
    artwork
      ? {
          id: `builder-preview-${format}`,
          title: form.title || "Your event",
          imageUrl: artwork.imageUrl,
          invitationData: liveCardInvitation({ ...form, format }, artwork.invitationData),
        }
      : null;
  const preview = previewFor(activePreviewFormat);
  async function openPreview() {
    if (!(await prepareWording())) return;
    setPreviewOpen(true);
  }
  const startISO = liveCardDateTime(form.date, form.startTime, form.timezone);
  const dateSummary = startISO
    ? new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: form.timezone,
      }).format(new Date(startISO))
    : form.date || "Add a date and time";
  const previewContent = preview ? (
    <StudioShowcaseLiveCard
      preview={preview}
      actionsPlacement="overlay"
      fitToContainer
      previewMode
      imageLoading="eager"
    />
  ) : generation ? (
    <DesignGenerationProgress stage={generation} />
  ) : (
    <div className={styles.previewEmpty}>
      {partialImage ? (
        <img src={partialImage} alt="Your artwork taking shape" />
      ) : (
        <>
          <span className={styles.emptyIcon}>
            <Sparkles size={30} />
          </span>
          <p>Your design starts here.</p>
          <span>
            Describe the look in Design. We’ll create the artwork while you add your event details.
          </span>
        </>
      )}
    </div>
  );

  const previewPane = (
    <aside className={styles.previewPane} aria-label="Artwork preview">
      {step === 3 && preview ? (
        <section className={styles.outputReview} aria-label="Review your Live Card">
          <div className={styles.outputHeading}>
            <div>
              <h2 ref={reviewHeadingRef} tabIndex={-1}>
                {activePreviewFormat === "live_card" ? "Your Live Card" : "Your saved design"}
              </h2>
              <p>
                {hasSharedDesign
                  ? "Your card is ready. Download an invitation with the event details added whenever you need it."
                  : "Preview your existing artwork before publishing."}
              </p>
            </div>
            <button type="button" className={styles.textButton} onClick={() => goToStep(1)}>
              Edit design <Sparkles size={16} />
            </button>
          </div>
          <div className={styles.outputGrid}>
            {outputs.map(({ format, name, description, icon: Icon }) => {
              const outputPreview = previewFor(format);
              if (!outputPreview) return null;
              return (
                <section key={format} className={styles.outputCard} aria-label={`${name} output`}>
                  <div className={styles.outputLabel}>
                    <Icon size={20} aria-hidden="true" />
                    <h3>{name}</h3>
                    <span>{format === "live_card" ? "Share a link" : "Download an image"}</span>
                  </div>
                  <p>{description}</p>
                  <div className={styles.outputArtwork}>
                    <StudioShowcaseLiveCard
                      preview={outputPreview}
                      actionsPlacement="overlay"
                      fitToContainer
                      previewMode
                      imageLoading="eager"
                    />
                  </div>
                  <div className={styles.outputActions}>
                    <button
                      type="button"
                      className={styles.secondary}
                      onClick={() => openPreview()}
                    >
                      <Eye size={17} /> Preview {name}
                    </button>
                    {(hasSharedDesign || format === "digital_flyer") &&
                      canReview &&
                      Object.keys(publishErrors).length === 0 && (
                        <ArtworkDownloadButton
                          imageUrl={outputPreview.imageUrl}
                          title={form.title}
                          invitationData={{ ...outputPreview.invitationData, publicUrl }}
                          beforeDownload={prepareWording}
                        />
                      )}
                  </div>
                  {format === "live_card" && (
                    <p className={styles.hint}>
                      Your sharing link will be available on the dashboard after publishing.
                    </p>
                  )}
                </section>
              );
            })}
          </div>
        </section>
      ) : (
        <div className={styles.inlineArtwork}>{previewContent}</div>
      )}
      {artwork && generation && <DesignGenerationProgress stage={generation} compact />}
      {artwork && !generation && (
        <div role="status" className={styles.status}>
          <Check size={17} />
          {preparingHeadline
            ? "Drawing your title and opening line…"
            : `Your design is ready${designChanged ? " for an update." : "."}`}
        </div>
      )}
      {artwork?.invitationData?.sharedDesign &&
        !hasGeneratedCardHeadline(liveCardInvitation(form, artwork.invitationData)) &&
        !preparingHeadline && (
          <p className={styles.hint}>
            Your title and opening line will be drawn into the artwork when you select Review.
          </p>
        )}
      {generationError && (
        <div role="alert" className={styles.generationError}>
          <p>{generationError}</p>
          <button type="button" className={styles.secondary} onClick={() => void generate()}>
            Retry design
          </button>
        </div>
      )}
      {artwork && !generation && step === 2 && (
        <button type="button" className={styles.textButton} onClick={() => goToStep(1)}>
          Edit design <Sparkles size={16} />
        </button>
      )}
      {step === 1 && artwork && !artwork.invitationData?.sharedDesign && !generation && (
        <div className={styles.assistance}>
          <p>
            This card has lettering built into its image. Create a new design to make its text
            editable and download an invitation after your card is ready.
          </p>
          <button type="button" className={styles.secondary} onClick={() => void generate()}>
            Create editable design
          </button>
        </div>
      )}
    </aside>
  );

  if (loadError)
    return (
      <main className={styles.page}>
        <div role="alert" className={styles.error}>
          {loadError}
        </div>
        <button
          type="button"
          className={styles.secondary}
          onClick={() => setReload((value) => value + 1)}
        >
          Try again
        </button>
      </main>
    );
  if (!ready)
    return (
      <main className={styles.page}>
        <p role="status" className={styles.status}>
          <Loader2 className={styles.spin} size={18} /> Opening your event…
        </p>
      </main>
    );

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>LIVE CARD</p>
          <h1>Create your Live Card</h1>
          <p>Create a design, add your event details, and share it with your guests.</p>
        </div>
        <button
          type="button"
          className={styles.secondary}
          disabled={working || preparingWording || !dirty}
          onClick={() => saveWithFeedback(published)}
        >
          <Save size={17} />
          {working ? "Saving…" : published ? "Save changes" : "Save draft"}
        </button>
      </header>
      <nav aria-label="Card creation steps" className={styles.steps}>
        {STEPS.map((label, index) => (
          <button
            key={label}
            type="button"
            aria-current={step === index + 1 ? "step" : undefined}
            disabled={working || preparingWording || (index === 2 && !canReview)}
            onClick={() => goToStep((index + 1) as BuilderStep)}
          >
            <span>{index + 1}</span>
            {label}
          </button>
        ))}
      </nav>
      {preparingWording && (
        <p role="status" className={styles.status}>
          <Loader2 size={18} className={styles.spin} />{" "}
          {preparingHeadline ? "Drawing your title and opening line…" : "Preparing your Live Card…"}
        </p>
      )}
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
      {message && (
        <p role="status" className={styles.success}>
          <Check size={18} />
          {message}
        </p>
      )}
      <div className={styles.workspace} data-step={step} data-has-artwork={Boolean(artwork)}>
        {step === 3 && previewPane}
        <div className={styles.editor} data-step={step}>
          <form
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              if (step === 1) {
                if (generation || (artwork && !designChanged)) void goToStep(2);
                else void generate();
              } else if (step === 2) {
                if (artwork && !designChanged) void goToStep(3);
                else void goToStep(1);
              } else saveWithFeedback(true, true);
            }}
          >
            <fieldset disabled={working}>
              {step !== 1 && (
                <p className={styles.stepCaption}>
                  STEP {step} OF 3 · {STEPS[step - 1]}
                </p>
              )}
              <h2 ref={headingRef} tabIndex={-1}>
                {step === 1
                  ? "What should your Live Card look like?"
                  : step === 2
                    ? "Tell us about your event"
                    : "Ready to share?"}
              </h2>
              <p className={styles.intro}>
                {step === 1
                  ? "Describe the look for your Live Card. We’ll create the artwork while you fill in the event details."
                  : step === 2
                    ? "Add the information your guests need on your Live Card."
                    : "Review your Live Card, then publish your event to get its sharing link."}
              </p>
              {step === 1 && (
                <div className={styles.formStack}>
                  <Field id="livecard-eventType" label="Event type" error={errors.eventType}>
                    <select
                      id="livecard-eventType"
                      value={form.eventType}
                      onChange={(event) =>
                        change("eventType", event.target.value as LiveCardForm["eventType"])
                      }
                      aria-invalid={Boolean(errors.eventType)}
                      aria-describedby={errors.eventType ? "livecard-eventType-error" : undefined}
                      required
                    >
                      <option value="">Choose an event type</option>
                      {LIVE_CARD_EVENT_TYPES.map((type) => (
                        <option key={type}>{type}</option>
                      ))}
                    </select>
                  </Field>
                  {textField("design", "Describe your design", {
                    placeholder:
                      "A pink movie-night theme with popcorn, stars, and a playful title…",
                    multiline: true,
                    required: true,
                    hideLabel: true,
                  })}
                  <div className={styles.reference}>
                    <ImagePlus size={21} />
                    <div>
                      <label htmlFor="livecard-reference">
                        Add a reference image <span>(optional)</span>
                      </label>
                      <p>Use a photo or image to guide the design.</p>
                      <input
                        id="livecard-reference"
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={(event) => {
                          void selectReference(event.target.files?.[0]);
                          event.target.value = "";
                        }}
                      />
                    </div>
                    {form.referenceUrl && (
                      <div className={styles.referenceThumb}>
                        <img src={form.referenceUrl} alt="Your design reference" />
                        <button
                          type="button"
                          aria-label="Remove reference image"
                          onClick={() => change("referenceUrl", "")}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                  {designChanged && (
                    <p className={styles.note}>
                      Your design direction has changed. Generate the updated artwork when you’re
                      ready.
                    </p>
                  )}
                  {artwork && !designChanged && !generation && (
                    <button
                      type="button"
                      className={styles.textButton}
                      disabled={preparingWording || !form.eventType || !form.design.trim()}
                      onClick={() => void generate()}
                    >
                      <Sparkles size={16} /> Generate a new design
                    </button>
                  )}
                </div>
              )}
              {step === 2 && (
                <div className={styles.detailSections}>
                  <div
                    className={styles.detailTabs}
                    role="tablist"
                    aria-label="Event details sections"
                  >
                    {DETAIL_TABS.map((tab, index) => (
                      <button
                        key={tab}
                        type="button"
                        role="tab"
                        id={`detail-tab-${tab}`}
                        aria-selected={detailTab === tab}
                        aria-controls={`detail-panel-${tab}`}
                        tabIndex={detailTab === tab ? 0 : -1}
                        onClick={() => selectDetailTab(tab)}
                        onKeyDown={(event) => {
                          const target =
                            event.key === "ArrowRight"
                              ? (index + 1) % DETAIL_TABS.length
                              : event.key === "ArrowLeft"
                                ? (index + DETAIL_TABS.length - 1) % DETAIL_TABS.length
                                : event.key === "Home"
                                  ? 0
                                  : event.key === "End"
                                    ? DETAIL_TABS.length - 1
                                    : null;
                          if (target === null) return;
                          event.preventDefault();
                          selectDetailTab(DETAIL_TABS[target], true);
                        }}
                      >
                        {tab}
                        {((tab === "RSVP" && form.rsvpEnabled) ||
                          (tab === "Registry" && form.registryEnabled)) && (
                          <span className={styles.tabDot} aria-hidden="true" />
                        )}
                      </button>
                    ))}
                  </div>
                  <div
                    key={detailTab}
                    id={`detail-panel-${detailTab}`}
                    role="tabpanel"
                    aria-labelledby={`detail-tab-${detailTab}`}
                    className={styles.detailPanel}
                  >
                    {detailTab === "Basics" && (
                      <div className={styles.formStack}>
                        {textField("headlineIntro", "Opening line (optional)", {
                          placeholder: "You're invited",
                          hint: "Drawn above the title when you review your card. Leave blank to omit it.",
                        })}
                        {textField("title", "Event title or name", {
                          placeholder: "Livia's 10th Birthday",
                          required: true,
                        })}
                        {textField("overview", "Message to guests (optional)", {
                          multiline: true,
                          placeholder:
                            "Join us to celebrate Livia’s 10th birthday! We can’t wait to see you.",
                          hint: "Guests read this in Overview. It is not printed on the artwork or download.",
                        })}
                        {textField("instructions", "Anything else guests should know? (optional)", {
                          multiline: true,
                          placeholder: "Dress code, parking, what to bring…",
                          hint: "Guests read this in Overview. It is not printed on the artwork or download.",
                        })}
                      </div>
                    )}
                    {detailTab === "When & Where" && (
                      <section className={styles.formSection}>
                        <h3>
                          <CalendarDays size={19} /> When &amp; Where
                        </h3>
                        <div className={styles.dateGrid}>
                          {textField("date", "Event date", { type: "date", required: true })}
                          {textField("startTime", "Start time", { type: "time", required: true })}
                          {textField("endTime", "End time (optional)", { type: "time" })}
                          {textField("endDate", "End date (if different)", { type: "date" })}
                        </div>
                        {form.locations[0]?.timezone && (
                          <p className={styles.hint}>
                            {form.locations[0]?.city
                              ? `Times are local to ${form.locations[0].city}.`
                              : "Times are local to your event location."}
                          </p>
                        )}
                        {errors.timezone && (
                          <p
                            id="livecard-timezone-error"
                            role="alert"
                            className={styles.fieldError}
                          >
                            {errors.timezone}
                          </p>
                        )}
                        {form.locations.map((location, index) => (
                          <div key={location.id} className={styles.location}>
                            <div className={styles.locationHeader}>
                              <button
                                type="button"
                                className={styles.locationSelect}
                                aria-expanded={
                                  location.id === (activeLocationId || form.locations[0]?.id)
                                }
                                aria-controls={`location-fields-${location.id}`}
                                onClick={() => setActiveLocationId(location.id)}
                              >
                                <strong>
                                  {index === 0
                                    ? "Main location"
                                    : location.label || `Location ${index + 1}`}
                                </strong>
                                {(location.venue || location.address || location.query) && (
                                  <span>
                                    {location.venue || location.address || location.query}
                                  </span>
                                )}
                              </button>
                              {index > 0 && (
                                <button
                                  type="button"
                                  aria-label={`Remove location ${index + 1}`}
                                  className={styles.iconButton}
                                  onClick={() => {
                                    change(
                                      "locations",
                                      form.locations.filter((item) => item.id !== location.id),
                                    );
                                    if (activeLocationId === location.id) setActiveLocationId(null);
                                  }}
                                >
                                  <Trash2 size={17} />
                                </button>
                              )}
                            </div>
                            {location.id === (activeLocationId || form.locations[0]?.id) && (
                              <div
                                id={`location-fields-${location.id}`}
                                className={styles.formStack}
                              >
                                {index > 0 &&
                                  (["label", "time", "note"] as const).map((key) => (
                                    <Field
                                      key={key}
                                      id={`location-${location.id}-${key}`}
                                      label={
                                        {
                                          label: "What happens here?",
                                          time: "Local time (optional)",
                                          note: "Extra directions (optional)",
                                        }[key]
                                      }
                                    >
                                      <input
                                        id={`location-${location.id}-${key}`}
                                        type={key === "time" ? "time" : "text"}
                                        value={location[key]}
                                        onChange={(event) =>
                                          change(
                                            "locations",
                                            form.locations.map((item) =>
                                              item.id === location.id
                                                ? { ...item, [key]: event.target.value }
                                                : item,
                                            ),
                                          )
                                        }
                                      />
                                    </Field>
                                  ))}
                                <LocationField
                                  location={location}
                                  issue={locationIssues[location.id]}
                                  onChoose={(place) => {
                                    const current = snapshotRef.current.form;
                                    const next = {
                                      ...current,
                                      locations: current.locations.map((item) =>
                                        item.id === location.id
                                          ? {
                                              ...item,
                                              ...place,
                                              timezone: undefined,
                                              resolution: "unresolved" as const,
                                            }
                                          : item,
                                      ),
                                    };
                                    snapshotRef.current = { ...snapshotRef.current, form: next };
                                    setForm(next);
                                    void goToStep(3);
                                  }}
                                  onChange={(next) =>
                                    setForm((current) => ({
                                      ...current,
                                      locations: current.locations.map((item) =>
                                        item.id === next.id ? next : item,
                                      ),
                                      timezone:
                                        current.locations[0]?.id === next.id && next.timezone
                                          ? next.timezone
                                          : current.timezone,
                                    }))
                                  }
                                />
                              </div>
                            )}
                          </div>
                        ))}
                        {errors.locations && (
                          <p
                            id="livecard-locations-error"
                            role="alert"
                            className={styles.fieldError}
                          >
                            {errors.locations}
                          </p>
                        )}
                        <button
                          type="button"
                          className={styles.textButton}
                          disabled={form.locations.length >= 10}
                          onClick={() => {
                            const location = emptyLiveCardLocation(crypto.randomUUID());
                            change("locations", [...form.locations, location]);
                            setActiveLocationId(location.id);
                          }}
                        >
                          <Plus size={17} /> Add another location
                        </button>
                      </section>
                    )}
                    {detailTab === "RSVP" && (
                      <Toggle
                        id="livecard-rsvp"
                        title={
                          form.format === "live_card" ? "Collect RSVPs" : "Include RSVP details"
                        }
                        description={
                          form.format === "live_card"
                            ? "Let guests reply directly on your card."
                            : "Print the host’s contact information for replies."
                        }
                        icon={<Users size={20} />}
                        enabled={form.rsvpEnabled}
                        onChange={() => change("rsvpEnabled", !form.rsvpEnabled)}
                      >
                        {textField("hostName", "Host name", { required: true })}
                        <div className={styles.fieldGrid}>
                          {textField("hostEmail", "Host email (optional)", { type: "email" })}
                          {textField("hostPhone", "Host phone (optional)", { type: "tel" })}
                        </div>
                        {textField("rsvpDeadline", "Reply by (optional)", { type: "date" })}
                        <p className={styles.hint}>
                          Guests can respond on the Live Card. Add an email or phone number so
                          guests receiving a downloaded invitation can reply to you directly.
                        </p>
                      </Toggle>
                    )}
                    {detailTab === "Registry" && (
                      <Toggle
                        id="livecard-registry"
                        title="Add a registry or gift list"
                        description="Share a gift link and a little guidance."
                        icon={<Gift size={20} />}
                        enabled={form.registryEnabled}
                        onChange={() => change("registryEnabled", !form.registryEnabled)}
                      >
                        {textField("registryUrl", "Registry or gift-list link", {
                          type: "url",
                          placeholder: "https://…",
                          required: true,
                        })}
                        {textField("giftNote", "Gift message (optional)", {
                          multiline: true,
                          placeholder: "Your presence is the best present…",
                        })}
                      </Toggle>
                    )}
                  </div>
                </div>
              )}
              {step === 3 && (
                <div className={styles.review}>
                  {Object.keys(publishErrors).length > 0 && (
                    <section className={styles.readiness} aria-label="Before publishing">
                      <h3>Finish these details before publishing</h3>
                      {Object.entries(publishErrors).map(([key, issue]) => (
                        <button
                          type="button"
                          className={styles.textButton}
                          key={key}
                          onClick={() => {
                            setErrors(publishErrors);
                            focusFirstError({ [key]: issue });
                          }}
                        >
                          {issue} <ArrowRight size={15} />
                        </button>
                      ))}
                    </section>
                  )}
                  <h3>{form.title || "Your Live Card"}</h3>
                  <p>{form.eventType || "Choose an event type"}</p>
                  <dl>
                    <div>
                      <dt>When</dt>
                      <dd>
                        {form.date ? dateSummary : "Add a date and time"}
                        <small>
                          {form.locations[0]?.city
                            ? `Local time in ${form.locations[0].city}`
                            : "Event local time"}
                        </small>
                      </dd>
                    </div>
                    <div>
                      <dt>Where</dt>
                      <dd>
                        {form.locations
                          .map((location) =>
                            [location.label, location.venue, location.address]
                              .filter(Boolean)
                              .join(" · "),
                          )
                          .filter(Boolean)
                          .join("; ") || "Add your location"}
                      </dd>
                    </div>
                    <div>
                      <dt>
                        {form.format === "live_card" || hasSharedDesign
                          ? "Live Card guest buttons"
                          : "Format"}
                      </dt>
                      <dd>
                        {form.format === "digital_flyer" && !hasSharedDesign
                          ? "Classic invitation · ready to download"
                          : [
                              "Overview",
                              "Location",
                              "Calendar",
                              form.rsvpEnabled && "RSVP",
                              form.registryEnabled && "Registry",
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                      </dd>
                    </div>
                  </dl>
                  <button type="button" className={styles.textButton} onClick={() => goToStep(2)}>
                    Edit event details <ArrowRight size={16} />
                  </button>
                  {designChanged && (
                    <p className={styles.note}>
                      Your design direction has changed. Create the updated artwork before
                      publishing.
                    </p>
                  )}
                  {!artwork && !generation && (
                    <p className={styles.note}>Create your design before publishing.</p>
                  )}
                </div>
              )}
              {step === 2 && detailIssues.length > 0 && (
                <section
                  id="livecard-required-details"
                  className={styles.requiredDetails}
                  aria-label="Required details"
                >
                  <p>To continue, complete:</p>
                  <div>
                    {detailIssues.map((key) => (
                      <button
                        type="button"
                        key={key}
                        onClick={() => {
                          const issue = { [key]: preparationErrors[key] };
                          setErrors((current) => ({ ...current, ...issue }));
                          focusFirstError(issue);
                        }}
                      >
                        {FIELD_LABELS[key] || key}
                      </button>
                    ))}
                  </div>
                </section>
              )}
              <div className={styles.formActions}>
                {step > 1 && (
                  <button
                    type="button"
                    className={styles.secondary}
                    onClick={() => void goToStep((step - 1) as BuilderStep)}
                  >
                    <ArrowLeft size={17} /> Back
                  </button>
                )}
                <button
                  className={styles.primary}
                  type="submit"
                  aria-describedby={
                    step === 2 && detailIssues.length ? "livecard-required-details" : undefined
                  }
                  disabled={
                    working ||
                    preparingWording ||
                    (step === 1 && !generation && (!form.eventType || !form.design.trim())) ||
                    (step === 2 &&
                      (Boolean(generation) ||
                        (Boolean(artwork) && !designChanged && !canReview))) ||
                    (step === 3 && !canReview)
                  }
                >
                  {step === 1
                    ? generation || (artwork && !designChanged)
                      ? "Continue to event details"
                      : artwork
                        ? "Generate updated design"
                        : "Generate & continue"
                    : step === 2
                      ? generation
                        ? "Creating your design…"
                        : artwork && !designChanged
                          ? "Review Live Card"
                          : "Go to design"
                      : working
                        ? "Saving…"
                        : published
                          ? "Save & go to dashboard"
                          : "Publish & go to dashboard"}
                  {step === 1 && !generation && (!artwork || designChanged) ? (
                    <Sparkles size={17} />
                  ) : (
                    <ArrowRight size={17} />
                  )}
                </button>
              </div>
            </fieldset>
          </form>
        </div>
        {step !== 3 && previewPane}
      </div>
      <ArtworkPreviewDialog
        open={previewOpen}
        title={
          activePreviewFormat === "live_card" ? "Preview your Live Card" : "Preview your invitation"
        }
        imageUrl={preview?.imageUrl}
        onClose={() => setPreviewOpen(false)}
      >
        {preview && (
          <StudioShowcaseLiveCard
            preview={preview}
            actionsPlacement="overlay"
            previewMode
            imageLoading="eager"
          />
        )}
      </ArtworkPreviewDialog>
    </main>
  );
}
