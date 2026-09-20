"use client";

import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  Copy,
  Eye,
  Gift,
  ImagePlus,
  Loader2,
  MapPin,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { requestStudioGeneration } from "@/app/studio/studio-workspace-api";
import { buildInvitationData } from "@/app/studio/studio-workspace-builders";
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
  liveCardDateTime,
  validateLiveCard,
  type LiveCardErrors,
  type LiveCardForm,
} from "@/lib/livecard-builder";
import { GENERATION_STAGE_LABELS, type GenerationStage } from "@/lib/studio/generation-progress";
import { persistImageMediaValue } from "@/utils/media-upload-client";
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
const DETAIL_TABS = ["Overview", "When", "Where", "RSVP", "Registry"] as const;
type DetailTab = (typeof DETAIL_TABS)[number];

export default function LiveCardBuilder({ initialEventId }: { initialEventId: string | null }) {
  const [form, setForm] = useState(createLiveCardForm);
  const [artwork, setArtwork] = useState<LiveCardArtwork | null>(null);
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
  const [publicPath, setPublicPath] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<LiveCardErrors>({});
  const [previewOpen, setPreviewOpen] = useState(false);
  const [timezones, setTimezones] = useState<string[]>([]);
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
  const designChanged = Boolean(artwork && artwork.designKey !== liveCardDesignKey(form));

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setReady(false);
    setLoadError("");
    draftId.current ||= crypto.randomUUID();
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    const supportedZones =
      typeof Intl.supportedValuesOf === "function"
        ? Intl.supportedValuesOf("timeZone")
        : [
            "America/New_York",
            "America/Chicago",
            "America/Denver",
            "America/Los_Angeles",
            "Europe/London",
            "Europe/Paris",
            "Asia/Kolkata",
            "Asia/Tokyo",
            "Australia/Sydney",
          ];
    setTimezones([...new Set([timezone, "UTC", ...supportedZones])].sort());
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
        if (!active) return;
        const isPublished = data.status === "published";
        setPublished(isPublished);
        if (isPublished)
          setPublicPath(
            `/card/${encodeURIComponent(typeof row.public_slug === "string" && row.public_slug ? row.public_slug : initialEventId)}`,
          );
        setStep(nextForm.title ? 2 : 1);
      }
      if (!active) return;
      setForm(nextForm);
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
    },
    [],
  );

  function change<K extends keyof LiveCardForm>(key: K, value: LiveCardForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setMessage("");
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

  async function generate() {
    const current = snapshotRef.current.form;
    const validation = validateLiveCard(current, "design");
    setErrors(validation);
    if (Object.keys(validation).length) {
      setStep(1);
      focusFirstError(validation);
      setError("Complete the highlighted design fields.");
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
      const details = liveCardDetails(prepared);
      const response = await requestStudioGeneration(
        details,
        "both",
        "page",
        undefined,
        undefined,
        undefined,
        {
          signal: controller.signal,
          onProgress: (progress) => {
            if (version !== generationVersion.current) return;
            if (progress.type === "stage") setGeneration(progress.stage);
            else setPartialImage(progress.imageDataUrl);
          },
        },
      );
      const imageUrl = await persistImageMediaValue({
        value: response.imageUrl || response.imageDataUrl || "",
        fileName: "livecard-artwork.png",
      });
      if (!imageUrl) throw new Error("The design could not be saved. Please retry.");
      if (version !== generationVersion.current || controller.signal.aborted) return;
      // Apply artwork only. The host may have changed any event field while we waited.
      setArtwork({
        imageUrl,
        designKey: liveCardDesignKey(prepared),
        invitationData: {
          ...buildInvitationData(details, response),
          artworkTextMode: response.artworkTextMode,
          artworkContract: response.artworkContract,
        },
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

  async function save(publish = published): Promise<void> {
    if (working) throw new Error("A save is already in progress.");
    const captured = snapshotRef.current;
    if (publish) {
      const validation = validateLiveCard(captured.form, "publish");
      setErrors(validation);
      if (Object.keys(validation).length) {
        setStep(validation.title || validation.eventType || validation.design ? 1 : 2);
        focusFirstError(validation);
        throw new Error("Complete the highlighted fields before publishing.");
      }
      if (generation)
        throw new Error("Your artwork is still generating. You can save a draft while you wait.");
      if (!captured.artwork || captured.artwork.designKey !== liveCardDesignKey(captured.form))
        throw new Error("Generate the current design before publishing.");
    }
    setWorking(true);
    setError("");
    setMessage("");
    try {
      const prepared = await persistReference(captured.form);
      const payload = liveCardHistoryPayload(
        prepared,
        captured.artwork,
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
      if (publish)
        setPublicPath(
          `/card/${encodeURIComponent(typeof row.public_slug === "string" && row.public_slug ? row.public_slug : savedId.current)}`,
        );
      window.dispatchEvent(new CustomEvent("history:updated", { detail: { id: savedId.current } }));
      setMessage(
        publish
          ? published
            ? "Your live card is updated."
            : "Your live card is published. It's ready to share."
          : "Draft saved. Find it in Drafts anytime.",
      );
      if (publish) setStep(3);
    } finally {
      setWorking(false);
    }
  }

  useUnsavedProgress({
    dirty,
    busy: working,
    save: () => save(),
    discard: () => {
      generationVersion.current += 1;
      generationController.current?.abort();
    },
  });

  function saveWithFeedback(publish: boolean) {
    void save(publish).catch((failure: Error) => setError(failure.message));
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
    requestAnimationFrame(() => headingRef.current?.focus());
  }

  function focusFirstError(validation: LiveCardErrors) {
    const key = Object.keys(validation)[0];
    if (["date", "startTime", "endDate", "endTime", "timezone"].includes(key)) setDetailTab("When");
    else if (["hostName", "hostEmail", "hostPhone", "rsvpDeadline"].includes(key))
      setDetailTab("RSVP");
    else if (key === "registryUrl") setDetailTab("Registry");
    const location = snapshotRef.current.form.locations.find((item) => !item.address.trim());
    if (key === "locations") {
      setDetailTab("Where");
      setActiveLocationId(location?.id || null);
    }
    const id =
      key === "locations" && location ? `location-${location.id}-address` : `livecard-${key}`;
    requestAnimationFrame(() => document.getElementById(id)?.focus());
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
    key: Exclude<keyof LiveCardForm, "eventType" | "locations" | "rsvpEnabled" | "registryEnabled">,
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
              : "Start with a title and an idea. We'll bring your card to life."}
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
          <h1>Create your Live Card</h1>
          <p>A beautiful invite. All the details, one tap away.</p>
        </div>
        <button
          type="button"
          className={styles.secondary}
          disabled={working || !dirty}
          onClick={() => saveWithFeedback(published)}
        >
          <Save size={17} />
          {working ? "Saving…" : published ? "Save changes" : "Save draft"}
        </button>
      </header>
      <nav aria-label="Card creation steps" className={styles.steps}>
        {(["Your design", "Event details", "Preview & share"] as const).map((label, index) => (
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
      <div className={styles.workspace}>
        <div className={styles.editor} data-step={step}>
          <form
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              if (step === 1) void generate();
              else if (step === 2) advanceDetails();
              else saveWithFeedback(true);
            }}
          >
            <fieldset disabled={working}>
              <h2 ref={headingRef} tabIndex={-1}>
                {step === 1
                  ? "Let's start with the look."
                  : step === 2
                    ? "Make it your event"
                    : "Ready for your guests?"}
              </h2>
              <p className={styles.intro}>
                {step === 1
                  ? "Only the title goes on the artwork. The details live in your card's buttons."
                  : step === 2
                    ? "One section at a time. Edit any detail later."
                    : "Try the buttons and review your details before sharing."}
              </p>
              {step === 1 && (
                <div className={styles.formStack}>
                  {textField("title", "Event title or name", {
                    placeholder: "Livia's 10th Birthday",
                    required: true,
                  })}
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
                  {textField("design", "How would you like your card to look?", {
                    placeholder:
                      "A pink movie-night theme with popcorn, stars, and a playful title…",
                    multiline: true,
                    required: true,
                    hint: "Tell us the colors, mood, or theme you have in mind.",
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
                          hint: "Appears in Overview on your card.",
                        })}
                        {textField("instructions", "Anything else guests should know? (optional)", {
                          multiline: true,
                          placeholder: "Dress code, parking, what to bring…",
                          hint: "Included in Overview.",
                        })}
                      </div>
                    )}
                    {detailTab === "When" && (
                      <section className={styles.formSection}>
                        <h3>
                          <CalendarDays size={19} /> When
                        </h3>
                        <div className={styles.dateGrid}>
                          {textField("date", "Event date", { type: "date", required: true })}
                          {textField("startTime", "Start time", { type: "time", required: true })}
                          {textField("endTime", "End time (optional)", { type: "time" })}
                          {textField("endDate", "End date (if different)", { type: "date" })}
                        </div>
                        <Field id="livecard-timezone" label="Timezone" error={errors.timezone}>
                          <select
                            id="livecard-timezone"
                            value={form.timezone}
                            onChange={(event) => change("timezone", event.target.value)}
                            aria-invalid={Boolean(errors.timezone)}
                            aria-describedby={
                              errors.timezone ? "livecard-timezone-error" : undefined
                            }
                          >
                            {timezones.map((zone) => (
                              <option key={zone} value={zone}>
                                {zone.replaceAll("_", " ")}
                              </option>
                            ))}
                          </select>
                        </Field>
                        <p className={styles.included}>
                          <Check size={15} /> Add to calendar is included automatically.
                        </p>
                      </section>
                    )}
                    {detailTab === "Where" && (
                      <section className={styles.formSection}>
                        <h3>
                          <MapPin size={19} /> Where
                        </h3>
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
                                  {location.venue || location.address || "Add location details"}
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
                                className={styles.fieldGrid}
                              >
                                {(index === 0
                                  ? (["venue", "address"] as const)
                                  : (["label", "time", "venue", "address", "note"] as const)
                                ).map((key) => {
                                  const id = `location-${location.id}-${key}`;
                                  return (
                                    <Field
                                      key={key}
                                      id={id}
                                      label={
                                        {
                                          label: "What happens here?",
                                          time: "Time (optional)",
                                          venue: "Venue name (optional)",
                                          address: "Address or meeting link",
                                          note: "Extra directions (optional)",
                                        }[key]
                                      }
                                    >
                                      <input
                                        id={id}
                                        type={key === "time" ? "time" : "text"}
                                        value={location[key]}
                                        maxLength={500}
                                        placeholder={
                                          key === "label"
                                            ? "Dinner after the movie"
                                            : key === "address"
                                              ? "Street address or online link"
                                              : undefined
                                        }
                                        aria-invalid={
                                          key === "address" && Boolean(errors.locations)
                                        }
                                        aria-describedby={
                                          key === "address" && errors.locations
                                            ? "livecard-locations-error"
                                            : undefined
                                        }
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
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        ))}
                        {errors.locations && (
                          <p id="livecard-locations-error" className={styles.fieldError}>
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
                        title="Collect RSVPs"
                        description="Let guests reply directly on your card."
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
                          Guests can respond Yes, No, or Maybe. Host contact details are visible to
                          guests when provided.
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
                        <small>{form.timezone.replaceAll("_", " ")}</small>
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
                      <dt>Guest buttons</dt>
                      <dd>
                        {[
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
                      Your design has changed. Go back to Your design to generate the updated
                      artwork.
                    </p>
                  )}
                  {!artwork && !generation && (
                    <p className={styles.note}>Create your design before publishing.</p>
                  )}
                  {publicPath && (
                    <div className={styles.shareBox}>
                      <strong>Your live card link</strong>
                      <div>
                        <input
                          aria-label="Live card share link"
                          readOnly
                          value={
                            typeof window !== "undefined"
                              ? `${window.location.origin}${publicPath}`
                              : publicPath
                          }
                        />
                        <button
                          type="button"
                          className={styles.iconButton}
                          aria-label="Copy live card link"
                          onClick={() => {
                            void navigator.clipboard
                              .writeText(`${window.location.origin}${publicPath}`)
                              .then(
                                () => setMessage("Link copied."),
                                () => setError("Copy the link from the field to share your card."),
                              );
                          }}
                        >
                          <Copy size={18} />
                        </button>
                      </div>
                      <a href={publicPath} target="_blank" rel="noopener noreferrer">
                        Open live card <ArrowRight size={15} />
                      </a>
                      {dirty && (
                        <p className={styles.hint}>Save your changes to update what guests see.</p>
                      )}
                    </div>
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
                    (step === 1 && Boolean(generation)) ||
                    (step === 3 && (Boolean(generation) || !artwork || designChanged))
                  }
                >
                  {step === 1 ? (
                    <>
                      <Sparkles size={18} />
                      {generation
                        ? "Creating your design…"
                        : artwork
                          ? "Update design & continue"
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
                      {working ? "Saving…" : published ? "Save changes" : "Publish & share"}
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
        <aside className={styles.previewPane} aria-label="Live card preview">
          <div className={styles.previewHeader}>
            <span>YOUR LIVE CARD</span>
            <button type="button" disabled={!artwork} onClick={() => setPreviewOpen(true)}>
              <Eye size={17} /> Preview
            </button>
          </div>
          <div className={styles.inlineArtwork}>{previewContent}</div>
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
        </aside>
      </div>
      <ArtworkPreviewDialog
        open={previewOpen}
        title="Preview your Live Card"
        imageUrl={preview?.imageUrl}
        onClose={() => setPreviewOpen(false)}
        onShare={
          publicPath
            ? () => {
                void navigator.clipboard.writeText(`${window.location.origin}${publicPath}`).then(
                  () => setMessage("Link copied."),
                  () => setError("Copy your live card link from Preview & share."),
                );
              }
            : undefined
        }
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
