"use client";

import { FontPairingSelect } from "@/components/design-panel/FontPairingSelect";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useUnsavedProgress } from "@/components/UnsavedProgressProvider";
import {
  applyCustomEventWording,
  type CustomEventDetails,
  type CustomEventPage,
  customEventCategory,
  customEventGalleryHref,
  customEventWording,
  EVENT_DESIGN_FONT_PAIRS,
  EVENT_DESIGN_LAYOUTS,
  normalizeCustomEventPage,
  takeCustomEventPage,
} from "@/lib/event-custom-design";
import { customEventFieldErrors, saveCustomEventPage, withCustomEventTimezone } from "@/lib/event-custom-save";
import { buildEventPath } from "@/utils/event-url";
import CustomEventPageContent from "./CustomEventPageContent";
import styles from "./custom-event.module.css";
import EventCustomThemeDialog from "./EventCustomThemeDialog";

export default function EventCustomEditor({ initialPage }: { initialPage?: CustomEventPage } = {}) {
  const search = useSearchParams(),
    router = useRouter();
  const editId = search?.get("edit") || undefined;
  const category = customEventCategory(search?.get("category")) || "general";
  const token = search?.get("themePreview");
  const [editing, setEditing] = useState(search?.get("ready") !== "1");
  const [page, setPage] = useState<CustomEventPage | null>(null);
  const [baseline, setBaseline] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [validationMode, setValidationMode] = useState<"draft" | "published" | null>(null);
  const fieldErrors = page && validationMode ? customEventFieldErrors(page, validationMode === "published") : {};
  const focusField = (key: string) => {
    setEditing(true);
    setPreviewOnly(false);
    requestAnimationFrame(() => {
      const field = document.getElementById(`event-field-${key}`);
      field?.scrollIntoView({ block: "center", behavior: "instant" });
      field?.focus({ preventScroll: true });
    });
  };
  const fieldProps = (key: string) => ({
    id: `event-field-${key}`,
    "aria-invalid": Boolean(fieldErrors[key]),
    "aria-describedby": fieldErrors[key] ? `event-error-${key}` : undefined,
  });
  const fieldError = (key: string) => fieldErrors[key] ? (
    <span id={`event-error-${key}`} className={styles.error}>{fieldErrors[key]}</span>
  ) : null;
  const [message, setMessage] = useState("");
  const [redesign, setRedesign] = useState(false);
  const [published, setPublished] = useState(false);
  const [previewOnly, setPreviewOnly] = useState(false);
  const previewDialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = previewDialog.current;
    if (!previewOnly || !dialog) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.showModal();
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
    };
  }, [previewOnly]);
  const [retry, setRetry] = useState(0);
  const existing = useRef<Record<string, unknown>>({});
  const savedId = useRef<string | undefined>(editId);
  const handoff = useRef<{ token: string; page: CustomEventPage } | null>(null);
  const clientDraftId = useRef<string | null>(null);
  const saving = useRef(false);
  const preparedWording = useRef("");
  useEffect(() => {
    if (editId && savedId.current === editId && page) return;
    let cancelled = false;
    async function load() {
      setError("");
      if (initialPage) {
        setPage(withCustomEventTimezone(initialPage));
        setBaseline("");
        return;
      }
      if (editId) {
        setPage(null);
        const response = await fetch(`/api/history/${encodeURIComponent(editId)}`, {
          credentials: "include",
        });
        if (!response.ok)
          throw new Error(
            "This event page could not be opened. Sign in to its host account and retry.",
          );
        const row = await response.json();
        const saved = normalizeCustomEventPage(
          row.data?.customEventPageDraft || row.data?.customEventPage,
        );
        if (!saved) throw new Error("This event uses a different editor.");
        if (cancelled) return;
        existing.current = row.data;
        savedId.current = editId;
        const initialized = withCustomEventTimezone(saved);
        setPage(initialized);
        setBaseline(JSON.stringify(initialized));
        setPublished(row.data.status === "published");
      } else {
        await Promise.resolve();
        if (cancelled) return;
        const selected =
          token &&
          (handoff.current?.token === token
            ? handoff.current.page
            : takeCustomEventPage(token, category));
        if (!selected) {
          router.replace(`${customEventGalleryHref(category)}?customTheme=1&themeExpired=1`);
          return;
        }
        handoff.current = { token: token!, page: selected };
        preparedWording.current = JSON.stringify(customEventWording(selected.details));
        setPage(withCustomEventTimezone(selected));
        setBaseline("");
      }
    }
    void load().catch((failure) => {
      if (!cancelled) setError(failure instanceof Error ? failure.message : "Please try again.");
    });
    return () => {
      cancelled = true;
    };
    // Only a route change or explicit retry initializes the editor.
  }, [category, editId, token, router, retry, initialPage]);
  const prepareWording = async (current: CustomEventPage): Promise<CustomEventPage> => {
    const key = JSON.stringify(customEventWording(current.details));
    if (preparedWording.current === key) return current;
    const response = await fetch("/api/event-themes/generate", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "wording",
        category: current.category,
        prompt: "Prepare the current guest-facing wording.",
        currentDesign: current.design,
        currentDetails: current.details,
      }),
    });
    const result = await response.json();
    if (!response.ok || !result.details)
      throw new Error(result.error || "Your wording could not be prepared. Please try again.");
    const details = applyCustomEventWording(current.details, customEventWording(result.details));
    preparedWording.current = JSON.stringify(customEventWording(details));
    const next = { ...current, details };
    setPage(next);
    return next;
  };
  const showPreview = async () => {
    if (previewOnly) {
      setPreviewOnly(false);
      return;
    }
    if (!page || saving.current) return;
    setValidationMode("draft");
    if (Object.keys(customEventFieldErrors(page, false)).length) {
      setError("");
      setPreviewOnly(false);
      return;
    }
    saving.current = true;
    setBusy(true);
    setError("");
    try {
      await prepareWording(page);
      setPreviewOnly(true);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Please try again.");
    } finally {
      saving.current = false;
      setBusy(false);
    }
  };
  const persist = async (status: "draft" | "published") => {
    if (!page || saving.current) throw new Error("Wait for your event page to finish saving.");
    setValidationMode(status);
    if (Object.keys(customEventFieldErrors(page, status === "published")).length) {
      setError("");
      setPreviewOnly(false);
      throw new Error("Correct the highlighted fields.");
    }
    saving.current = true;
    setBusy(true);
    setError("");
    setMessage("");
    clientDraftId.current ||= crypto.randomUUID();
    try {
      const result = await saveCustomEventPage({
        page: status === "published" ? await prepareWording(page) : page,
        status,
        eventId: savedId.current,
        clientDraftId: clientDraftId.current,
        existing: existing.current,
      });
      savedId.current = result.id;
      existing.current = result.data;
      setPage(result.page);
      setBaseline(JSON.stringify(result.page));
      if (status === "published")
        navigation.allowNavigation(() =>
          router.push(buildEventPath(result.id, result.page.details.title)),
        );
      else {
        navigation.allowNavigation(() =>
          router.replace(`/event/design/customize?edit=${encodeURIComponent(result.id)}`),
        );
        setMessage(
          published
            ? "Draft saved. Publish when you're ready to update the live page."
            : "Draft saved.",
        );
      }
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Your event page could not be saved.");
      throw failure;
    } finally {
      saving.current = false;
      setBusy(false);
    }
  };
  const navigation = useUnsavedProgress({
    dirty: Boolean(page && JSON.stringify(page) !== baseline),
    busy,
    save: async () => {
      await persist("draft");
    },
  });
  const updateDetail = <K extends keyof CustomEventDetails>(key: K, value: CustomEventDetails[K]) =>
    setPage((previous) =>
      previous ? { ...previous, details: { ...previous.details, [key]: value } } : previous,
    );
  if (!page)
    return (
      <div className="p-10">
        <p role={error ? "alert" : "status"}>{error || "Opening your event page…"}</p>
        {error && (
          <button
            type="button"
            className={styles.secondary}
            onClick={() => setRetry((value) => value + 1)}
          >
            Retry
          </button>
        )}
      </div>
    );
  const d = page.details;
  const field = (
    key: keyof Pick<
      CustomEventDetails,
      | "title"
      | "description"
      | "host"
      | "venue"
      | "location"
      | "date"
      | "time"
      | "endDate"
      | "endTime"
      | "rsvpEmail"
      | "rsvpPhone"
    >,
    label: string,
    type = "text",
  ) => (
    <label className={styles.field}>
      {label}
      {key === "description" ? (
        <textarea
          {...fieldProps(key)}
          rows={5}
          value={d[key]}
          maxLength={6000}
          onChange={(e) => updateDetail(key, e.target.value)}
        />
      ) : (
        <input
          {...fieldProps(key)}
          type={type}
          value={d[key]}
          maxLength={key === "location" ? 1000 : 300}
          onChange={(e) => updateDetail(key, e.target.value)}
        />
      )}
      {fieldError(key)}
    </label>
  );
  return (
    <main className={styles.editor}>
      <header className={styles.toolbar}>
        <div>
          <Link href={customEventGalleryHref(page.category)}>← Templates</Link>
          <h1>Your event page</h1>
        </div>
        <div>
          <button type="button" className={styles.secondary} disabled={busy} aria-pressed={editing} onClick={() => setEditing((value) => !value)}>
            {editing ? "View event page" : "Edit details & design"}
          </button>
          <button
            className={styles.secondary}
            type="button"
            disabled={busy}
            onClick={() => void showPreview()}
          >
            Preview <span aria-hidden="true">→</span>
          </button>
          <button
            className={styles.secondary}
            type="button"
            disabled={busy}
            onClick={() => {
              void persist("draft").catch(() => {});
            }}
          >
            Save draft
          </button>
          <button
            className={styles.primary}
            type="button"
            disabled={busy}
            onClick={() => {
              void persist("published").catch(() => {});
            }}
          >
            {busy ? "Saving…" : published ? "Publish changes" : "Publish"}
          </button>
        </div>
      </header>
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
      {Object.keys(fieldErrors).length > 0 && (
        <div role="alert" className={styles.error}>
          <p>Correct these fields to continue:</p>
          {Object.entries(fieldErrors).map(([key, message]) => (
            <button key={key} type="button" className={styles.errorLink} onClick={() => focusField(key)}>{message}</button>
          ))}
        </div>
      )}
      {message && (
        <p role="status" className={styles.notice}>
          {message}
        </p>
      )}
      {previewOnly && (
        <dialog ref={previewDialog} className={styles.pagePreviewDialog} aria-label="Event Page preview" onCancel={() => setPreviewOnly(false)}>
          <header className={styles.pagePreviewHeader}>
            <span>Event Page preview</span>
            <button type="button" className={styles.secondary} onClick={() => setPreviewOnly(false)}>Close</button>
          </header>
          <CustomEventPageContent page={page} showGuestActions />
        </dialog>
      )}
      {(
        <div className={styles.workspace} style={editing ? undefined : { gridTemplateColumns: "minmax(0, 1fr)" }}>
          <fieldset disabled={busy} className={styles.controls} hidden={!editing} style={editing ? undefined : { display: "none" }}>
            <h2>Event details</h2>
            {field("title", "Event title")}
            {field("description", "Welcome & overview")}
            {field("host", "Hosted by")}
            <div className={styles.columns}>
              {field("date", "Date", "date")}
              {field("time", "Begins", "time")}
              {field("endTime", "End time (optional)", "time")}
              {field("endDate", "End date (optional)", "date")}
            </div>
            {field("venue", "Venue")}
            {field("location", "Address or location")}
            <div className={styles.group}>
              <h2>RSVP</h2>
              <label className={styles.check}>
                <input
                  type="checkbox"
                  checked={d.rsvpEnabled}
                  onChange={(e) => updateDetail("rsvpEnabled", e.target.checked)}
                />
                Allow guests to RSVP
              </label>
              {d.rsvpEnabled && (
                <>
                  {field("rsvpEmail", "RSVP email (optional)", "email")}
                  {field("rsvpPhone", "RSVP phone (optional)", "tel")}
                </>
              )}
            </div>
            <div className={styles.group}>
              <h2>Registry</h2>
              {d.registryLinks.map((link, index) => (
                <div key={index} className={styles.group}>
                  <label className={styles.field}>
                    Label
                    <input
                      {...fieldProps(`registry-${index}-label`)}
                      value={link.label}
                      maxLength={180}
                      onChange={(e) =>
                        updateDetail(
                          "registryLinks",
                          d.registryLinks.map((item, i) =>
                            i === index ? { ...item, label: e.target.value } : item,
                          ),
                        )
                      }
                    />
                    {fieldError(`registry-${index}-label`)}
                  </label>
                  <label className={styles.field}>
                    Link
                    <input
                      {...fieldProps(`registry-${index}-url`)}
                      type="url"
                      value={link.url}
                      onChange={(e) =>
                        updateDetail(
                          "registryLinks",
                          d.registryLinks.map((item, i) =>
                            i === index ? { ...item, url: e.target.value } : item,
                          ),
                        )
                      }
                    />
                    {fieldError(`registry-${index}-url`)}
                  </label>
                  <button
                    type="button"
                    className={styles.secondary}
                    onClick={() =>
                      updateDetail(
                        "registryLinks",
                        d.registryLinks.filter((_, i) => i !== index),
                      )
                    }
                  >
                    Remove link
                  </button>
                </div>
              ))}
              <button
                type="button"
                className={styles.secondary}
                disabled={d.registryLinks.length >= 20}
                onClick={() =>
                  updateDetail("registryLinks", [...d.registryLinks, { label: "", url: "" }])
                }
              >
                Add registry link
              </button>
            </div>
            <div className={styles.group}>
              <h2>Page sections</h2>
              {d.sections.map((section, index) => (
                <div key={index} className={styles.group}>
                  <label className={styles.field}>
                    Section heading
                    <input
                      {...fieldProps(`section-${index}-title`)}
                      value={section.title}
                      maxLength={180}
                      onChange={(e) =>
                        updateDetail(
                          "sections",
                          d.sections.map((item, i) =>
                            i === index ? { ...item, title: e.target.value } : item,
                          ),
                        )
                      }
                    />
                    {fieldError(`section-${index}-title`)}
                  </label>
                  <label className={styles.field}>
                    Section content
                    <textarea
                      {...fieldProps(`section-${index}-body`)}
                      value={section.body}
                      maxLength={6000}
                      rows={4}
                      onChange={(e) =>
                        updateDetail(
                          "sections",
                          d.sections.map((item, i) =>
                            i === index ? { ...item, body: e.target.value } : item,
                          ),
                        )
                      }
                    />
                    {fieldError(`section-${index}-body`)}
                  </label>
                  <button
                    type="button"
                    className={styles.secondary}
                    onClick={() =>
                      updateDetail(
                        "sections",
                        d.sections.filter((_, i) => i !== index),
                      )
                    }
                  >
                    Remove section
                  </button>
                </div>
              ))}
              <button
                type="button"
                className={styles.secondary}
                disabled={d.sections.length >= 20}
                onClick={() => updateDetail("sections", [...d.sections, { title: "", body: "" }])}
              >
                Add section
              </button>
            </div>
            <div className={styles.group}>
              <h2>Design</h2>
              <label className={styles.field}>
                Layout
                <select
                  value={page.design.layout}
                  onChange={(e) =>
                    setPage({
                      ...page,
                      design: {
                        ...page.design,
                        layout: e.target.value as CustomEventPage["design"]["layout"],
                      },
                    })
                  }
                >
                  {EVENT_DESIGN_LAYOUTS.map((layout) => (
                    <option key={layout}>{layout}</option>
                  ))}
                </select>
              </label>
              <fieldset className={styles.field}>
                <legend>Typography</legend>
                <FontPairingSelect
                  options={EVENT_DESIGN_FONT_PAIRS}
                  value={page.design.font}
                  onChange={(font) => setPage({ ...page, design: { ...page.design, font } })}
                />
              </fieldset>
              <div className={styles.columns}>
                {(["page", "surface", "ink", "accent"] as const).map((key) => (
                  <label key={key} className={styles.field}>
                    {key}
                    <input
                      type="color"
                      value={page.design.colors[key]}
                      onChange={(e) =>
                        setPage({
                          ...page,
                          design: {
                            ...page.design,
                            colors: { ...page.design.colors, [key]: e.target.value },
                          },
                        })
                      }
                    />
                  </label>
                ))}
              </div>
              <button type="button" className={styles.secondary} onClick={() => setRedesign(true)}>
                Redesign with Envitefy
              </button>
            </div>
          </fieldset>
          <div className={styles.preview} style={editing ? undefined : { display: "block" }}>
            <CustomEventPageContent page={page} showGuestActions onGuestActionsChange={busy ? undefined : (guestActions) => setPage((current) => current ? ({ ...current, details: { ...current.details, guestActions } }) : current)} />
          </div>
        </div>
      )}
      {redesign && (
        <EventCustomThemeDialog
          category={page.category}
          initialPage={page}
          onClose={() => setRedesign(false)}
          onUseDesign={(candidate) => {
            setPage((current) => (current ? { ...candidate, details: current.details } : current));
            setRedesign(false);
          }}
        />
      )}
    </main>
  );
}
