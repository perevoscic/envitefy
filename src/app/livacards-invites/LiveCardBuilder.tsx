"use client";

import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  Eye,
  Gift,
  ImagePlus,
  Loader2,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { readSharedCardDesign } from "@/lib/shared-card-design";
import { composeSharedCard } from "@/lib/shared-card-canvas";
import ArtworkDownloadButton from "@/components/ArtworkDownloadButton";
import { sanitizeInvitationData } from "@/app/studio/studio-workspace-sanitize";
import { useUnsavedProgress } from "@/components/UnsavedProgressProvider";
import ArtworkPreviewDialog from "@/components/ArtworkPreviewDialog";
import StudioShowcaseLiveCard from "@/components/studio/StudioShowcaseLiveCard";
import {
  LIVE_CARD_BUILDER_PATH,
  LIVE_CARD_BUILDER_SOURCE,
  LIVE_CARD_EVENT_TYPES,
  createLiveCardForm,
  emptyLiveCardLocation,
  liveCardDesignKey,
  sharedCardDesignKey,
  liveCardDateTime,
  validateLiveCard,
  readLiveCardForm,
  mergeLiveCardProposal,
  type LiveCardErrors,
  type LiveCardForm,
} from "@/lib/livecard-builder";
import { GENERATION_STAGE_LABELS, type GenerationStage } from "@/lib/studio/generation-progress";
import { persistImageMediaValue } from "@/utils/media-upload-client";
import { buildEventPath } from "@/utils/event-url";
import LocationField from "./LocationField";
import {
  liveCardDetails,
  liveCardHistoryPayload,
  liveCardInvitation,
  restoreLiveCardForm,
  type LiveCardArtwork,
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
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className={styles.field}>
      <label htmlFor={id}>{label}</label>
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
const DETAIL_TABS = ["Overview", "When & Where", "RSVP", "Registry"] as const;
type DetailTab = (typeof DETAIL_TABS)[number];

export default function LiveCardBuilder({ initialEventId }: { initialEventId: string | null }) {
  const [form, setForm] = useState(createLiveCardForm);
  const [artwork, setArtwork] = useState<LiveCardArtwork | null>(null);
  const artworkByFormat = useRef<Partial<Record<LiveCardForm["format"], LiveCardArtwork | null>>>(
    {},
  );
  const [described, setDescribed] = useState(Boolean(initialEventId));
  const [assisting, setAssisting] = useState(false);
  const [revision, setRevision] = useState("");
  const [proposal, setProposal] = useState<{
    kind?: "overview";
    before: LiveCardForm;
    form: LiveCardForm;
    questions: string[];
  } | null>(null);
  const assistanceController = useRef<AbortController | null>(null);
  const reviewedOverview = useRef("");
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [detailTab, setDetailTab] = useState<DetailTab>("Overview");
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
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<LiveCardErrors>({});
  const [previewOpen, setPreviewOpen] = useState(false);
  const savedId = useRef(initialEventId);
  const draftId = useRef("");
  const generationController = useRef<AbortController | null>(null);
  const generationVersion = useRef(0);
  const uploadCache = useRef(new Map<string, Promise<string>>());
  const headingRef = useRef<HTMLHeadingElement>(null);
  const snapshot = { form, artwork };
  const snapshotRef = useRef<Snapshot>(snapshot);
  snapshotRef.current = snapshot;
  const dirty = ready && serialize(snapshot) !== baseline;
  const designKey = (value: LiveCardForm, image: LiveCardArtwork | null) =>
    image?.invitationData?.sharedDesign ? sharedCardDesignKey(value) : liveCardDesignKey(value);
  const designChanged = Boolean(artwork && artwork.designKey !== designKey(form, artwork));

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
        setPublished(isPublished);
        setStep(nextForm.title ? 2 : 1);
      }
      if (!active) return;
      setForm(nextForm);
      reviewedOverview.current = initialEventId ? nextForm.overview : "";
      setArtwork(nextArtwork);
      artworkByFormat.current[nextForm.format] = nextArtwork;
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
      assistanceController.current?.abort();
    },
    [],
  );

  function change<K extends keyof LiveCardForm>(key: K, value: LiveCardForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setMessage("");
  }

  function switchFormat(format: LiveCardForm["format"]) {
    if (format === form.format) return;
    if (artwork?.invitationData?.sharedDesign || generation) {
      change("format", format);
      return;
    }
    artworkByFormat.current[form.format] = artwork;
    generationVersion.current += 1;
    generationController.current?.abort();
    setGeneration(null);
    setPartialImage(null);
    setGenerationError("");
    setArtwork(artworkByFormat.current[format] || null);
    change("format", format);
  }

  async function assist(message = form.brief) {
    if (!message.trim() && !form.referenceUrl) {
      setError("Tell us about your event or add a reference image.");
      return;
    }
    assistanceController.current?.abort();
    const controller = new AbortController();
    assistanceController.current = controller;
    setAssisting(true);
    setError("");
    setProposal(null);
    try {
      const before = await persistReference(snapshotRef.current.form);
      const response = await fetch("/api/livecard-builder/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({ form: before, message }),
      });
      const result = asRecord(await response.json());
      const next = readLiveCardForm(result.form);
      if (!response.ok || !next)
        throw new Error(
          typeof result.error === "string"
            ? result.error
            : "Your suggestions could not be prepared. Try again or continue manually.",
        );
      setProposal({
        before,
        form: next,
        questions: Array.isArray(result.questions)
          ? result.questions.filter((item): item is string => typeof item === "string")
          : [],
      });
      requestAnimationFrame(() => document.getElementById("builder-proposal")?.focus());
    } catch (failure) {
      if (!controller.signal.aborted)
        setError(
          failure instanceof Error
            ? failure.message
            : "AI assistance is unavailable. Your details are safe.",
        );
    } finally {
      if (!controller.signal.aborted) setAssisting(false);
    }
  }

  function acceptProposal() {
    if (!proposal) return;
    const next = mergeLiveCardProposal(snapshotRef.current.form, proposal.before, proposal.form);
    setForm(next);
    if (proposal.kind === "overview" && next.overview === proposal.form.overview)
      reviewedOverview.current = next.overview;
    setDescribed(true);
    setRevision("");
    setProposal(null);
    setMessage(
      proposal.kind === "overview"
        ? next.overview === proposal.form.overview
          ? "Overview reviewed. Your event details are unchanged."
          : "Your newer wording was kept. Check it again before publishing."
        : "Suggestions applied. Review your details before publishing.",
    );
  }

  function keepProposalOriginal() {
    if (
      proposal?.kind === "overview" &&
      snapshotRef.current.form.overview === proposal.before.overview
    )
      reviewedOverview.current = proposal.before.overview;
    setProposal(null);
  }

  async function reviewOverview(): Promise<boolean> {
    const before = snapshotRef.current.form;
    if (!before.overview.trim() || reviewedOverview.current === before.overview) return true;
    if (assisting || proposal) return false;
    const controller = new AbortController();
    assistanceController.current?.abort();
    assistanceController.current = controller;
    setAssisting(true);
    setError("");
    setMessage("Checking Overview wording…");
    try {
      const response = await fetch("/api/livecard-builder/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({ mode: "overview", form: before }),
      });
      const result = asRecord(await response.json());
      const next = readLiveCardForm(result.form);
      if (!response.ok || !next) throw new Error("Wording check unavailable");
      if (snapshotRef.current.form.overview !== before.overview) {
        setMessage(
          "You changed the Overview while it was being checked. Check the latest wording when you’re ready.",
        );
        return false;
      }
      if (next.overview === before.overview) {
        reviewedOverview.current = before.overview;
        setMessage("Overview checked. No wording changes suggested.");
        return true;
      }
      setProposal({
        kind: "overview",
        before,
        form: { ...before, overview: next.overview },
        questions: [],
      });
      setMessage("");
      requestAnimationFrame(() => document.getElementById("builder-proposal")?.focus());
      return false;
    } catch {
      if (!controller.signal.aborted) {
        setMessage("");
        setProposal({
          kind: "overview",
          before,
          form: before,
          questions: [
            "We couldn’t check the wording. Review your original Overview below, or keep editing and try again.",
          ],
        });
        requestAnimationFrame(() => document.getElementById("builder-proposal")?.focus());
      }
      return false;
    } finally {
      if (!controller.signal.aborted) setAssisting(false);
    }
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
    const current = snapshotRef.current.form;
    const validation = validateLiveCard(current, "design");
    setErrors(validation);
    if (Object.keys(validation).length) {
      setStep(validation.title || validation.eventType || validation.design ? 1 : 2);
      setDescribed(true);
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
    setStep(2);
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
      if (!response.ok || !sharedDesign) throw new Error(typeof body.error === "string" ? body.error : "The design could not be created. Please retry.");
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
    if (publish && !(await reviewOverview()))
      throw new Error("Review your Overview wording before publishing.");
    const captured = snapshotRef.current;
    if (publish) {
      const validation = validateLiveCard(captured.form, "publish");
      setErrors(validation);
      if (Object.keys(validation).length) {
        setStep(validation.title || validation.eventType || validation.design ? 1 : 2);
        setDescribed(true);
        focusFirstError(validation);
        throw new Error("Complete the highlighted fields before publishing.");
      }
      if (generation)
        throw new Error("Your artwork is still generating. You can save a draft while you wait.");
      if (!captured.artwork || captured.artwork.designKey !== designKey(captured.form, captured.artwork))
        throw new Error("Generate the current design before publishing.");
    }
    setWorking(true);
    setError("");
    setMessage("");
    try {
      const prepared = await persistReference(captured.form);
      let savedArtwork = captured.artwork;
      if (savedArtwork?.invitationData?.sharedDesign) {
        const backgroundUrl = await persistBackground(savedArtwork.invitationData.sharedDesign.backgroundUrl);
        const invitationData = liveCardInvitation(prepared, {
          ...savedArtwork.invitationData,
          sharedDesign: { ...savedArtwork.invitationData.sharedDesign, backgroundUrl },
        });
        const composed = await composeSharedCard(invitationData, publish ? prepared.format : "live_card");
        const imageUrl = await persistImageMediaValue({ value: composed, fileName: "invitation.webp" });
        if (!imageUrl) throw new Error("The invitation could not be saved. Please retry.");
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
      window.history.replaceState(
        window.history.state,
        "",
        `${LIVE_CARD_BUILDER_PATH}?edit=${encodeURIComponent(savedId.current)}`,
      );
      window.dispatchEvent(new CustomEvent("history:updated", { detail: { id: savedId.current } }));
      setMessage(
        publish
          ? published
            ? "Your invitation is updated."
            : "Your invitation is published. It's ready to share."
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
    busy: working,
    save: () => save(),
    discard: () => {
      generationVersion.current += 1;
      generationController.current?.abort();
      assistanceController.current?.abort();
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

  function goToStep(next: 1 | 2 | 3) {
    setStep(next);
    if (next === 3) void reviewOverview();
    requestAnimationFrame(() => headingRef.current?.focus());
  }

  function focusFirstError(validation: LiveCardErrors) {
    const key = Object.keys(validation)[0];
    if (["date", "startTime", "endDate", "endTime", "timezone"].includes(key))
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

  function advanceDetails() {
    const next = DETAIL_TABS[DETAIL_TABS.indexOf(detailTab) + 1];
    if (next) selectDetailTab(next, true);
    else goToStep(3);
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
    } = {},
  ) {
    const id = `livecard-${key}`;
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
    return (
      <Field id={id} label={label} hint={options.hint} error={errors[key]}>
        {options.multiline ? (
          <textarea {...shared} rows={3} />
        ) : (
          <input {...shared} type={options.type || "text"} />
        )}
      </Field>
    );
  }

  const preview = artwork
    ? {
        id: "builder-preview",
        title: form.title || "Your Live Card",
        imageUrl: artwork.imageUrl,
        invitationData: liveCardInvitation(form, artwork.invitationData),
      }
    : null;
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
  ) : (
    <div className={styles.previewEmpty}>
      {partialImage ? (
        <img src={partialImage} alt="Your artwork taking shape" />
      ) : (
        <>
          <span className={styles.emptyIcon}>
            <Sparkles size={30} />
          </span>
          <p>
            {generation
              ? "A little imagination is on its way."
              : "Your event, beautifully invited."}
          </p>
          <span>
            {generation
              ? "Keep adding the details. Your design will appear here."
              : "Describe your event. We'll bring your idea to life."}
          </span>
        </>
      )}
    </div>
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
          <Loader2 className={styles.spin} size={18} /> Opening your Live Card…
        </p>
      </main>
    );

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>LIVE CARDS & INVITES</p>
          <h1>
            {form.format === "live_card" ? "Create your Live Card" : "Create your invitation"}
          </h1>
          <p>
            {form.format === "live_card"
              ? "A beautiful card. All the details, one tap away."
              : "A complete invitation, ready to download and share."}
          </p>
        </div>
        <button
          type="button"
          className={styles.secondary}
          disabled={working || assisting || Boolean(proposal) || !dirty}
          onClick={() => saveWithFeedback(published)}
        >
          <Save size={17} />
          {working ? "Saving…" : published ? "Save changes" : "Save draft"}
        </button>
      </header>
      <div className={styles.formatToggle} role="group" aria-label="Invitation format">
        <button
          type="button"
          aria-pressed={form.format === "live_card"}
          disabled={working}
          onClick={() => switchFormat("live_card")}
        >
          Live Card
        </button>
        <button
          type="button"
          aria-pressed={form.format === "digital_flyer"}
          disabled={working}
          onClick={() => switchFormat("digital_flyer")}
        >
          Invite
        </button>
      </div>
      <nav aria-label="Card creation steps" className={styles.steps}>
        {(["Describe", "Details & design", "Review"] as const).map((label, index) => (
          <button
            key={label}
            type="button"
            aria-current={step === index + 1 ? "step" : undefined}
            onClick={() => goToStep((index + 1) as 1 | 2 | 3)}
          >
            <span>{index + 1}</span>
            {label}
          </button>
        ))}
      </nav>
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
      {proposal && (
        <section
          id="builder-proposal"
          tabIndex={-1}
          className={styles.proposal}
          aria-label={
            proposal.kind === "overview" ? "Review Overview wording" : "Suggested event details"
          }
        >
          <h2>
            {proposal.kind === "overview" ? "A quick wording check" : "Here’s what we have in mind"}
          </h2>
          <dl>
            {proposal.kind === "overview" && (
              <div>
                <dt>Your original Overview</dt>
                <dd>{proposal.before.overview}</dd>
              </div>
            )}
            {Object.entries({
              title: "Title",
              eventType: "Occasion",
              design: "Design direction",
              overview: "Invitation wording",
              date: "Date",
              startTime: "Start time",
              endDate: "End date",
              endTime: "End time",
              hostName: "Host",
              hostEmail: "Reply email",
              hostPhone: "Reply phone",
              rsvpDeadline: "Reply by",
              registryUrl: "Registry",
              giftNote: "Gift note",
              instructions: "Guest information",
              rsvpEnabled: "RSVP",
              registryEnabled: "Registry enabled",
            }).map(([key, label]) => {
              const field = key as keyof LiveCardForm;
              const value = proposal.form[field];
              if (JSON.stringify(value) === JSON.stringify(proposal.before[field])) return null;
              return (
                <div key={key}>
                  <dt>{label}</dt>
                  <dd>
                    {typeof value === "boolean"
                      ? value
                        ? "Included"
                        : "Off"
                      : String(value || "Cleared")}
                  </dd>
                </div>
              );
            })}
            {JSON.stringify(proposal.form.locations) !==
              JSON.stringify(proposal.before.locations) && (
              <div>
                <dt>Location</dt>
                <dd>
                  {proposal.form.locations
                    .map((location) =>
                      [location.venue, location.address, location.city].filter(Boolean).join(" · "),
                    )
                    .join("; ")}
                </dd>
              </div>
            )}
          </dl>
          {proposal.questions.map((question) => (
            <p key={question} className={styles.note}>
              {question}
            </p>
          ))}
          <div className={styles.searchRow}>
            <button
              type="button"
              className={styles.primary}
              onClick={
                proposal.kind === "overview" && proposal.questions.length
                  ? () => {
                      setProposal(null);
                      setStep(2);
                      setDetailTab("Overview");
                    }
                  : acceptProposal
              }
            >
              {proposal.kind === "overview"
                ? proposal.questions.length
                  ? "Keep editing"
                  : "Use reviewed wording"
                : "Use suggestions"}
            </button>
            <button type="button" className={styles.secondary} onClick={keepProposalOriginal}>
              {proposal.kind === "overview" ? "Keep my original wording" : "Keep my details"}
            </button>
          </div>
        </section>
      )}
      {described && (
        <details className={styles.assistance}>
          <summary>
            <Sparkles size={17} /> Describe a change
          </summary>
          <label htmlFor="builder-revision">What would you like to change?</label>
          <textarea
            id="builder-revision"
            rows={2}
            value={revision}
            onChange={(event) => setRevision(event.target.value)}
            placeholder="Use the AMC in Destin instead, or make the wording warmer…"
          />
          <button
            type="button"
            className={styles.secondary}
            disabled={assisting || !revision.trim()}
            onClick={() => void assist(revision)}
          >
            {assisting ? "Preparing suggestions…" : "Suggest changes"}
          </button>
        </details>
      )}
      <div className={styles.workspace}>
        <div className={styles.editor} data-step={step}>
          <form
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              if (step === 1 && !described) void assist();
              else if (step === 1 && artwork && !designChanged) goToStep(2);
              else if (step === 1) void generate();
              else if (step === 2) advanceDetails();
              else saveWithFeedback(true, true);
            }}
          >
            <fieldset disabled={working}>
              <h2 ref={headingRef} tabIndex={-1}>
                {step === 1
                  ? described
                    ? "Your idea, taking shape."
                    : "What are we celebrating?"
                  : step === 2
                    ? "Make it your event"
                    : "Ready for your guests?"}
              </h2>
              <p className={styles.intro}>
                {step === 1
                  ? described
                    ? form.format === "live_card"
                      ? "Your headline stays on the card. Details open from the buttons at the bottom."
                      : "Your invitation uses the same design, with editable event details."
                    : "Tell us the occasion, the place, the date and the look you have in mind. We’ll help with the rest."
                  : step === 2
                    ? "One section at a time. Edit any detail later."
                    : form.format === "live_card"
                      ? "Try your guest buttons and review the details before publishing."
                      : "Check every printed detail before publishing your invitation."}
              </p>
              {step === 1 && (
                <div className={styles.formStack}>
                  {!described &&
                    textField("brief", "Tell us about your event", {
                      multiline: true,
                      placeholder:
                        "Livia’s 10th birthday at AMC Grand Boulevard in Miramar Beach on September 26, 2026 at 4 PM. A pink movie-night theme with popcorn and stars…",
                      hint: "Include the venue or address here. We’ll find its address and use the event’s local time.",
                    })}
                  {!described && (
                    <button
                      type="button"
                      className={styles.textButton}
                      onClick={() => {
                        setDescribed(true);
                        setError("");
                      }}
                    >
                      Enter details myself
                    </button>
                  )}
                  {described && (
                    <>
                      {textField("title", "Event title or name", {
                        placeholder: "Livia's 10th Birthday",
                        required: true,
                      })}
                      {textField("headlineIntro", "Headline introduction", {
                        placeholder: "You're invited",
                        hint: "Shown above the title on both versions. Leave blank to omit it.",
                      })}
                      <Field id="livecard-eventType" label="Event type" error={errors.eventType}>
                        <select
                          id="livecard-eventType"
                          value={form.eventType}
                          onChange={(event) =>
                            change("eventType", event.target.value as LiveCardForm["eventType"])
                          }
                          aria-invalid={Boolean(errors.eventType)}
                          aria-describedby={
                            errors.eventType ? "livecard-eventType-error" : undefined
                          }
                          required
                        >
                          <option value="">Choose an event type</option>
                          {LIVE_CARD_EVENT_TYPES.map((type) => (
                            <option key={type}>{type}</option>
                          ))}
                        </select>
                      </Field>
                      {textField("design", "How would you like your card to look?", {
                        placeholder:
                          "A pink movie-night theme with popcorn, stars, and a playful title…",
                        multiline: true,
                        required: true,
                        hint: "Tell us the colors, mood, or theme you have in mind.",
                      })}
                    </>
                  )}
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
                      Your title or design idea has changed. Create the updated design before
                      publishing.
                    </p>
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
                    {detailTab === "Overview" && (
                      <div className={styles.formStack}>
                        {textField("overview", "About your event", {
                          multiline: true,
                          placeholder:
                            "A warm welcome, what you're celebrating, and what guests can look forward to…",
                          hint:
                            form.format === "live_card"
                              ? "Appears in Overview on your card."
                              : "Invitation wording printed with your event details.",
                        })}
                        <button
                          type="button"
                          className={styles.textButton}
                          disabled={assisting || Boolean(proposal) || !form.overview.trim()}
                          onClick={() => void reviewOverview()}
                        >
                          <Sparkles size={16} />
                          Check grammar & spelling
                        </button>
                        {textField("instructions", "Anything else guests should know? (optional)", {
                          multiline: true,
                          placeholder: "Dress code, parking, what to bring…",
                          hint:
                            form.format === "live_card"
                              ? "Included in Overview."
                              : "Included in the invitation wording.",
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
                        <p className={styles.hint}>
                          {form.locations[0]?.timezone
                            ? form.locations[0]?.city
                              ? `Times are local to ${form.locations[0].city}.`
                              : "Times are local to your event location."
                            : "Choose your location below to set its local time automatically."}
                        </p>
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
                                <span>
                                  {location.venue || location.address || "Find your venue"}
                                </span>
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
                                  date={form.date}
                                  timezone={form.timezone}
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
                          {form.format === "live_card"
                            ? "Guests can respond Yes, No, or Maybe. Host contacts are visible when provided."
                            : "Guests reply using the email or phone number printed on the invitation."}
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
                      <dt>{form.format === "live_card" ? "Guest buttons" : "Format"}</dt>
                      <dd>
                        {form.format === "digital_flyer"
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
                      Your invitation has changed. Create the updated artwork before publishing.
                    </p>
                  )}
                  {!artwork && !generation && (
                    <p className={styles.note}>Create your design before publishing.</p>
                  )}
                </div>
              )}
              <div className={styles.formActions}>
                {step > 1 && (
                  <button
                    type="button"
                    className={styles.secondary}
                    onClick={() => {
                      const previous = DETAIL_TABS[DETAIL_TABS.indexOf(detailTab) - 1];
                      if (step === 2 && previous) selectDetailTab(previous, true);
                      else goToStep(step === 3 ? 2 : 1);
                    }}
                  >
                    <ArrowLeft size={17} /> Back
                  </button>
                )}
                <button
                  className={styles.primary}
                  type="submit"
                  disabled={
                    working ||
                    assisting ||
                    Boolean(proposal) ||
                    (step === 1 && Boolean(generation)) ||
                    (step === 3 && (Boolean(generation) || !artwork || designChanged))
                  }
                >
                  {step === 1 ? (
                    <>
                      <Sparkles size={18} />
                      {assisting
                        ? "Understanding your event…"
                        : !described
                          ? "Help me create"
                          : generation
                              ? "Creating your design…"
                              : artwork && !designChanged
                                ? "Continue to event details"
                                : artwork ? "Create updated design & continue"
                                : "Create design & continue"}
                    </>
                  ) : step === 2 ? (
                    <>
                      {detailTab === "Registry"
                        ? "Continue to preview"
                        : `Next: ${DETAIL_TABS[DETAIL_TABS.indexOf(detailTab) + 1]}`}{" "}
                      <ArrowRight size={17} />
                    </>
                  ) : (
                    <>
                      {working
                        ? "Saving…"
                        : published
                          ? "Save & go to dashboard"
                          : "Publish & go to dashboard"}
                      <ArrowRight size={17} />
                    </>
                  )}
                </button>
              </div>
              {step === 1 && artwork && !designChanged && (
                <button type="button" className={styles.textButton} onClick={() => goToStep(2)}>
                  Keep this design & continue <ArrowRight size={16} />
                </button>
              )}
            </fieldset>
          </form>
        </div>
        <aside className={styles.previewPane} aria-label="Artwork preview">
          <div className={styles.previewHeader}>
            <span>{form.format === "live_card" ? "YOUR LIVE CARD" : "YOUR INVITATION"}</span>
            <button type="button" disabled={!artwork} onClick={() => setPreviewOpen(true)}>
              <Eye size={17} /> Preview
            </button>
          </div>
          <div className={styles.inlineArtwork}>{previewContent}</div>
          {step > 1 && (!artwork || designChanged) && !generation && (
            <button
              type="button"
              className={styles.primary}
              disabled={working || assisting || Boolean(proposal)}
              onClick={() => void generate()}
            >
              <Sparkles size={17} />
              {form.format === "digital_flyer" ? "Create invitation" : "Create design"}
            </button>
          )}
          <div role="status" className={styles.status}>
            {generation ? (
              <>
                <Loader2 size={17} className={styles.spin} />
                {GENERATION_STAGE_LABELS[generation]}. Keep filling in your details.
              </>
            ) : artwork ? (
              <>
                <Check size={17} />
                Your design is ready{designChanged ? " for an update." : "."}
              </>
            ) : (
              "Your artwork will appear here."
            )}
          </div>
          {generationError && (
            <div role="alert" className={styles.generationError}>
              <p>{generationError}</p>
              <button type="button" className={styles.secondary} onClick={() => void generate()}>
                Retry design
              </button>
            </div>
          )}
          {artwork && !generation && (
            <button type="button" className={styles.textButton} onClick={() => goToStep(1)}>
              Edit design <Sparkles size={16} />
            </button>
          )}
          {preview?.invitationData.sharedDesign && !designChanged && (
            <ArtworkDownloadButton imageUrl={preview.imageUrl} title={form.title} invitationData={preview.invitationData} beforeDownload={reviewOverview} className="mt-3" />
          )}
          {artwork && !artwork.invitationData?.sharedDesign && !generation && (
            <div className={styles.assistance}>
              <p>This card has lettering built into its image. Create a new design to make its text editable and share the artwork with an invite.</p>
              <button type="button" className={styles.secondary} onClick={() => void generate()}>Create editable design</button>
            </div>
          )}
        </aside>
      </div>
      <ArtworkPreviewDialog
        open={previewOpen}
        title={form.format === "live_card" ? "Preview your Live Card" : "Preview your invitation"}
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
