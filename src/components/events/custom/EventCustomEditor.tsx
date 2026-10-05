"use client";

import HeroImageEditor from "@/components/events/HeroImageEditor";
import { CloudSun, MapPinned } from "lucide-react";
import { useEventHistoryClient } from "@/lib/event-history-client";
import { readEventResponse } from "@/lib/event-response";
import { isEventDraft } from "@/lib/event-draft-access";
import { prepareCustomEventHeroImage } from "@/lib/custom-event-hero-image";
import { FontPairingSelect } from "@/components/design-panel/FontPairingSelect";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  EventEditorInput,
  EventEditorSections,
  EventEditorToggle,
} from "@/components/events/EventEditorFields";
import EventEditorWorkspace from "@/components/events/EventEditorWorkspace";
import { EventSectionBuilderProvider, EventSectionPalette, EventSectionsReadOnly } from "@/components/events/EventSectionBuilder";
import { useEventPageEditor } from "@/components/events/useEventPageEditor";
import {
  applyCustomEventWording,
  type CustomEventDetails,
  type CustomEventPage,
  customEventCategory,
  customEventGalleryHref,
  customEventSectionOrder,
  customEventWording,
  EVENT_DESIGN_FONT_PAIRS,
  normalizeCustomEventPage,
  takeCustomEventPage,
} from "@/lib/event-custom-design";
import {
  customEventFieldErrors,
  saveCustomEventPage,
  withCustomEventTimezone,
} from "@/lib/event-custom-save";
import { buildEventPath } from "@/utils/event-url";
import { validateCustomEventPublicSlug, MAX_PUBLIC_SLUG_LENGTH } from "@/utils/event-public-slug";
import CustomEventPageContent from "./CustomEventPageContent";
import CustomEventLayoutPicker from "./CustomEventLayoutPicker";
import {
  normalizeArrivalMap,
  type EventArrivalMap as EventArrivalMapData,
} from "@/lib/event-arrival-map";
import styles from "./custom-event.module.css";
import EventCustomThemeDialog from "./EventCustomThemeDialog";
import EventPageLoading from "./EventPageLoading";

const arrivalMapSectionIndex = (details: CustomEventDetails) => {
  const candidates = details.sections.flatMap((section, index) =>
    /\bparking\b/i.test(section.title) && /\bdrop[\s-]*off\b/i.test(section.title) ? [index] : [],
  );
  return candidates.length === 1 ? candidates[0] : -1;
};

const prepareArrivalMapImage = async (source: string) => {
  const image = await prepareCustomEventHeroImage(source);
  if (image.length > 2_800_000) throw new Error("Choose a smaller map image (under 2 MB).");
  return image;
};

const editorSnapshot = (page: CustomEventPage | null) => {
  if (!page) return { page };
  const details = page.details;
  // Legacy pages omit the default layout. Compare it with the explicit default
  // produced when a host moves a section and then restores its original order.
  return {
    page: {
      ...page,
      details: {
        ...details,
        sectionLayout: details.sectionLayout ?? {
          version: 1,
          order: customEventSectionOrder(details).filter((id) =>
            id === "overview" ? Boolean(details.description.trim()) :
              id === "registry" ? details.registryLinks.length > 0 : true,
          ),
          hidden: [],
          added: [],
        },
      },
    },
  };
};

export default function EventCustomEditor({ initialPage }: { initialPage?: CustomEventPage } = {}) {
  const eventHistoryClient = useEventHistoryClient();
  const search = useSearchParams(),
    router = useRouter();
  const editId = search?.get("edit") || undefined;
  const category = customEventCategory(search?.get("category")) || "general";
  const token = search?.get("themePreview");
  const [activeSection, setActiveSection] = useState("main");
  const [page, setPage] = useState<CustomEventPage | null>(null);
  const currentPage = useRef(page);
  currentPage.current = page;
  const [baseline, setBaseline] = useState("");
  const [operationBusy, setBusy] = useState(false);
  const [imageBusy, setImageBusy] = useState(false);
  const busy = operationBusy || imageBusy;
  const [error, setError] = useState("");
  const [validationMode, setValidationMode] = useState<"draft" | "published" | null>(null);
  const fieldErrors =
    page && validationMode ? customEventFieldErrors(page, validationMode === "published") : {};
  const focusField = (key: string) => {
    setActiveSection(
      key.startsWith("registry-")
        ? "registry"
        : key.startsWith("section-")
          ? "sections"
          : key.startsWith("rsvp")
            ? "rsvp"
            : "details",
    );
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
  const fieldError = (key: string) =>
    fieldErrors[key] ? (
      <span id={`event-error-${key}`} className={styles.error}>
        {fieldErrors[key]}
      </span>
    ) : null;
  const [redesign, setRedesign] = useState(false);
  const [published, setPublished] = useState(false);
  const [publicSlug, setPublicSlug] = useState("");
  const [savedPublicSlug, setSavedPublicSlug] = useState("");
  const [linkError, setLinkError] = useState("");
  const [linkMessage, setLinkMessage] = useState("");
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
        const response = await eventHistoryClient.fetch(
          `/api/history/${encodeURIComponent(editId)}`,
          {
            credentials: "include",
          },
        );
        if (!response.ok)
          throw new Error(
            "This event page could not be opened. Sign in to its host account and retry.",
          );
        const row = await readEventResponse(response);
        const saved = normalizeCustomEventPage(
          row.data?.customEventPageDraft || row.data?.customEventPage,
        );
        if (!saved) throw new Error("This event uses a different editor.");
        if (cancelled) return;
        existing.current = row.data;
        savedId.current = editId;
        setPublicSlug(row.public_slug || row.data?.publicSlug || "");
        setSavedPublicSlug(row.public_slug || row.data?.publicSlug || "");
        const initialized = withCustomEventTimezone(saved);
        setPage(initialized);
        setBaseline(JSON.stringify(initialized));
        setPublished(!isEventDraft(row.data));
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
    const result = await readEventResponse(response);
    if (!response.ok || !result.details)
      throw new Error(result.error || "Your wording could not be prepared. Please try again.");
    const details = applyCustomEventWording(current.details, customEventWording(result.details));
    preparedWording.current = JSON.stringify(customEventWording(details));
    const next = { ...current, details };
    setPage(next);
    return next;
  };

  const persist = async (status: "draft" | "published", navigate = true) => {
    if (!page || saving.current || imageBusy)
      throw new Error("Wait for your event page to finish saving.");
    setValidationMode(status);
    if (Object.keys(customEventFieldErrors(page, status === "published")).length) {
      setError("");
      setPreviewOnly(false);
      throw new Error("Correct the highlighted fields.");
    }
    saving.current = true;
    setBusy(true);
    setError("");
    clientDraftId.current ||= crypto.randomUUID();
    try {
      const result = await saveCustomEventPage({
        historyFetch: eventHistoryClient.fetch,
        page: status === "published" ? await prepareWording(page) : page,
        status,
        eventId: savedId.current,
        clientDraftId: clientDraftId.current,
        existing: existing.current,
      });
      savedId.current = result.id;
      existing.current = result.data;
      const nextPublicSlug =
        typeof result.data.publicSlug === "string" ? result.data.publicSlug : savedPublicSlug;
      setPublicSlug(nextPublicSlug);
      setSavedPublicSlug(nextPublicSlug);
      setPage(result.page);
      setBaseline(JSON.stringify(result.page));
      if (status === "published" && navigate)
        navigation.allowNavigation(() =>
          router.push(
            buildEventPath(result.id, result.page.details.title, undefined, nextPublicSlug),
          ),
        );
      else if (status === "draft") {
        if (navigate) {
          navigation.allowNavigation(() =>
            router.replace(`/event/design/customize?edit=${encodeURIComponent(result.id)}`),
          );
        }
      }

      return result;
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Your event page could not be saved.");
      throw failure;
    } finally {
      saving.current = false;
      setBusy(false);
    }
  };
  const editor = useEventPageEditor({
    snapshot: editorSnapshot(page),
    category,
    eventId: editId,
    historyClient: eventHistoryClient,
    ready: Boolean(page),
    busy,
    published,
    initialDirty: !editId && !baseline,
    cancelHref: savedId.current
      ? buildEventPath(
          savedId.current,
          typeof existing.current.title === "string" ? existing.current.title : undefined,
          undefined,
          savedPublicSlug,
        )
      : undefined,
    savePage: async (publish) => {
      const result = await persist(publish ? "published" : "draft", false);
      return {
        id: result.id,
        href: buildEventPath(
          result.id,
          result.page.details.title,
          undefined,
          typeof result.data.publicSlug === "string" ? result.data.publicSlug : savedPublicSlug,
        ),
        snapshot: editorSnapshot(result.page),
      };
    },
  });
  const navigation = editor;

  const savePublicLink = async () => {
    if (!savedId.current || busy || saving.current) return;
    const validation = validateCustomEventPublicSlug(publicSlug);
    setLinkError("");
    setLinkMessage("");
    if (validation.error || !validation.slug) {
      setLinkError(validation.error || "Enter an event link.");
      return;
    }
    saving.current = true;
    setBusy(true);
    try {
      const response = await eventHistoryClient.fetch(
        `/api/events/${encodeURIComponent(savedId.current)}/public-slug`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publicSlug: validation.slug }),
        },
      );
      const result = await readEventResponse(response);
      if (!response.ok) throw new Error(result.error || "The event link could not be updated.");
      existing.current = { ...existing.current, publicSlug: result.publicSlug };
      setPublicSlug(result.publicSlug);
      setSavedPublicSlug(result.publicSlug);
      setLinkMessage("Link updated. Previous links still work.");
      window.dispatchEvent(new CustomEvent("history:updated", { detail: { id: savedId.current } }));
    } catch (failure) {
      setLinkError(
        failure instanceof Error ? failure.message : "The event link could not be updated.",
      );
    } finally {
      saving.current = false;
      setBusy(false);
    }
  };
  const updateDetail = <K extends keyof CustomEventDetails>(key: K, value: CustomEventDetails[K]) =>
    setPage((previous) =>
      previous ? { ...previous, details: { ...previous.details, [key]: value } } : previous,
    );
  const updateArrivalMapSource = async (sourceImage: string, sectionIndex?: number) => {
    const current = currentPage.current;
    if (
      !current ||
      (sectionIndex === undefined && current.details.sections.some((section) => section.map))
    )
      return;
    const sections = [...current.details.sections];
    const index = sectionIndex ?? arrivalMapSectionIndex(current.details);
    if (index < 0 && sections.length >= 20) return;
    const section: CustomEventDetails["sections"][number] =
      index < 0 ? { title: "Parking & drop-off", body: "" } : sections[index];
    if (!section) return;
    const map: EventArrivalMapData = {
      version: 1,
      sourceImage,
      status: "location_unavailable",
      markers: section.map
        ? section.map.markers.map((marker) => ({ ...marker, point: null, confirmed: false }))
        : [
            { label: "Parking", kind: "parking", note: "", point: null, confirmed: false },
            {
              label: "Student drop-off",
              kind: "dropoff",
              note: "",
              point: null,
              confirmed: false,
            },
          ],
    };
    if (index < 0) sections.push({ ...section, map });
    else sections[index] = { ...section, map };
    const next = { ...current, details: { ...current.details, sections } };
    currentPage.current = next;
    setPage(next);
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/event-themes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "arrival-map",
          category: next.category,
          prompt: "Prepare the parking and drop-off map screenshot with the marked locations.",
          currentDesign: next.design,
          currentDetails: next.details,
          arrivalMapSection: index < 0 ? sections.length - 1 : index,
        }),
      });
      const result = await readEventResponse(response);
      const prepared = normalizeArrivalMap(result.map);
      if (!response.ok || !prepared || prepared.sourceImage !== sourceImage)
        throw new Error(result.error || "The parking map screenshot could not be prepared.");
      setPage((latest) => {
        if (!latest || latest.details.location !== next.details.location) return latest;
        return {
          ...latest,
          details: {
            ...latest.details,
            sections: latest.details.sections.map((item) =>
              item.map?.sourceImage === sourceImage ? { ...item, map: prepared } : item,
            ),
          },
        };
      });
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "The parking map screenshot could not be prepared.",
      );
    } finally {
      setBusy(false);
    }
  };
  if (!page && !error) return <EventPageLoading />;
  if (!page)
    return (
      <main className={styles.editor}>
        <div className={styles.loadError}>
          <p role="alert">{error}</p>
          <button
            type="button"
            className={styles.secondary}
            onClick={() => setRetry((value) => value + 1)}
          >
            Retry
          </button>
        </div>
      </main>
    );
  const d = page.details;
  const sectionName = (key: string) =>
    key === "overview"
      ? "Welcome & overview"
      : key === "registry"
        ? "Registry"
        : d.sections[Number(key.slice(8))]?.title || `Section ${Number(key.slice(8)) + 1}`;
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
    <EventEditorInput
      label={label}
      id={`event-field-${key}`}
      value={d[key]}
      type={key === "description" ? "textarea" : type}
      maxLength={key === "description" ? 6000 : key === "location" ? 1000 : 300}
      error={fieldErrors[key]}
      onChange={(value) => updateDetail(key, value)}
    />
  );
  const menuWeather = (
    <EventEditorToggle
      label="Show weather"
      icon={<CloudSun size={20} />}
      checked={d.weather?.enabled === true}
      onChange={(enabled) => updateDetail("weather", { enabled, units: d.weather?.units || "f" })}
      controls={d.weather?.enabled && (
        <div className={styles.weatherUnits} role="group" aria-label="Weather units">
          {(["f", "c"] as const).map((units) => (
            <button
              type="button"
              key={units}
              aria-label={units === "f" ? "Fahrenheit" : "Celsius"}
              aria-pressed={d.weather?.units === units}
              onClick={() => updateDetail("weather", { enabled: true, units })}
            >
              {units === "f" ? "°F" : "°C"}
            </button>
          ))}
        </div>
      )}
    />
  );
  return (
    <EventSectionBuilderProvider layout={d.sectionLayout}
      initialEntries={customEventSectionOrder(d).filter((id) => id === "overview" ? Boolean(d.description.trim()) : id === "registry" ? d.registryLinks.length > 0 : true).map((id) => ({ id, label: sectionName(id) }))}
      onChange={(sectionLayout) => setPage((current) => current ? { ...current, details: { ...current.details, sectionLayout } } : current)}
      catalog={customEventSectionOrder(d).map((id) => ({ id, label: sectionName(id) }))}
      createSection={() => {
        if (d.sections.length >= 20) return undefined;
        const id = `section:${d.sections.length}`;
        setPage((current) => current ? { ...current, details: { ...current.details, sections: [...current.details.sections, { title: "Information", body: "" }] } } : current);
        return { id, label: "Information" };
      }}
      renderEditor={(id) => {
        if (id === "overview") return <EventEditorInput label="Welcome message" type="textarea" value={d.description} onChange={(value) => updateDetail("description", value)} />;
        if (id === "registry") return <>{d.registryLinks.map((link, index) => <div key={index}><EventEditorInput label="Link label" value={link.label} onChange={(label) => updateDetail("registryLinks", d.registryLinks.map((item, i) => i === index ? { ...item, label } : item))} /><EventEditorInput label="Link URL" value={link.url} onChange={(url) => updateDetail("registryLinks", d.registryLinks.map((item, i) => i === index ? { ...item, url } : item))} /></div>)}</>;
        const index = Number(id.slice(8)), section = d.sections[index];
        return section ? <><EventEditorInput label="Section heading" value={section.title} maxLength={180} onChange={(title) => updateDetail("sections", d.sections.map((item, i) => i === index ? { ...item, title } : item))} /><EventEditorInput label="Section content" type="textarea" value={section.body} maxLength={6000} onChange={(body) => updateDetail("sections", d.sections.map((item, i) => i === index ? { ...item, body } : item))} /></> : null;
      }}>
    <EventEditorWorkspace
      editor={editor}
      revealControls={activeSection}
      templatesHref={customEventGalleryHref(page.category)}
      notices={
        Object.keys(fieldErrors).length > 0 ? (
          <div role="alert" className={styles.error}>
            <p>Correct these fields to continue:</p>
            {Object.entries(fieldErrors).map(([key, message]) => (
              <button
                key={key}
                type="button"
                className={styles.errorLink}
                onClick={() => focusField(key)}
              >
                {message}
              </button>
            ))}
          </div>
        ) : null
      }
      preview={
        <div className={styles.sharedPreview}>
          <CustomEventPageContent
            page={page}
            showGuestActions
            onGuestActionsChange={
              busy
                ? undefined
                : (guestActions) =>
                    setPage((current) =>
                      current
                        ? { ...current, details: { ...current.details, guestActions } }
                        : current,
                    )
            }
          />
        </div>
      }
      controls={(headerAction) => (
        <fieldset
          disabled={busy}
          className={styles.sharedControls}
          aria-label="Event editing controls"
        >
          <EventEditorSections
            headerAction={headerAction}
            menuContent={menuWeather}
            menuFooter={d.sections.some((section) => section.map) && (
              <EventEditorToggle
                label="Show parking map"
                icon={<MapPinned size={20} />}
                checked={d.arrivalMapEnabled !== false}
                onChange={(enabled) => updateDetail("arrivalMapEnabled", enabled ? undefined : false)}
              />
            )}
            activeSection={activeSection}
            onSectionChange={setActiveSection}
            sections={[
              {
                id: "details",
                title: "Event details",
                description: "Title, welcome, host, date and location.",
                content: (
                  <>
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
                  </>
                ),
              },
              {
                id: "design",
                title: "Design",
                description: "Photos, layout, typography and colors.",
                content: (
                  <>
                    <div className={styles.group}>
                      <h2>Design</h2>
                      <HeroImageEditor
                        label="Replace hero image"
                        prepareImage={prepareCustomEventHeroImage}
                        onBusyChange={setImageBusy}
                        onChange={(artwork) =>
                          setPage((current) =>
                            current
                              ? {
                                  ...current,
                                  artwork,
                                  design: {
                                    ...current.design,
                                    description: "Hero image selected by the host.",
                                  },
                                }
                              : current,
                          )
                        }
                      />
                      <p>
                        {published
                          ? "Your selected image is saved when you choose Save changes."
                          : "Your selected image is saved when you choose Save draft or Publish."}
                      </p>
                      <CustomEventLayoutPicker
                        page={page}
                        onChange={(layout) =>
                          setPage((current) =>
                            current
                              ? { ...current, design: { ...current.design, layout } }
                              : current,
                          )
                        }
                      />
                      <fieldset className={styles.field}>
                        <legend>Typography</legend>
                        <FontPairingSelect
                          options={EVENT_DESIGN_FONT_PAIRS}
                          value={page.design.font}
                          onChange={(font) =>
                            setPage({ ...page, design: { ...page.design, font } })
                          }
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
                      <button
                        type="button"
                        className={styles.secondary}
                        onClick={() => setRedesign(true)}
                      >
                        Redesign with Envitefy
                      </button>
                    </div>
                  </>
                ),
              },
              {
                id: "rsvp",
                title: "RSVP",
                description: "Guest response settings and contacts.",
                content: (
                  <>
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
                  </>
                ),
              },
              {
                id: "registry",
                title: "Gift List",
                description: "Gift list and registry links.",
                content: (
                  <>
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
                          updateDetail("registryLinks", [
                            ...d.registryLinks,
                            { label: "", url: "" },
                          ])
                        }
                      >
                        Add registry link
                      </button>
                    </div>
                  </>
                ),
              },
              {
                id: "sections",
                title: "Page sections",
                description: "Arrange and edit guest information.",
                content: (
                  <>
                    <EventSectionPalette />
                    <div className={styles.group}>
                      {!d.sections.some((section) => section.map) &&
                        (d.sections.length >= 20 && arrivalMapSectionIndex(d) < 0 ? (
                          <button type="button" className={styles.secondary} disabled>
                            Add parking / drop-off map
                          </button>
                        ) : (
                          <HeroImageEditor
                            label="Add parking / drop-off map"
                            onBusyChange={setImageBusy}
                            prepareImage={prepareArrivalMapImage}
                            onChange={updateArrivalMapSource}
                          />
                        ))}
                    </div>
                  </>
                ),
              },
              {
                id: "link",
                title: "Public link",
                description: "Your event's public address.",
                content: (
                  <>
                    <div className={styles.group}>
                      <h2>Public link</h2>
                      {savedId.current ? (
                        <>
                          <div className={styles.publicLinkField}>
                            <label htmlFor="event-public-link" className={styles.field}>
                              Custom link
                            </label>
                            <div
                              className={styles.publicLinkControl}
                              data-invalid={Boolean(linkError)}
                            >
                              <span className={styles.publicLinkPrefix}>envitefy.com/event/</span>
                              <input
                                id="event-public-link"
                                className={styles.publicLinkInput}
                                type="text"
                                value={publicSlug}
                                maxLength={MAX_PUBLIC_SLUG_LENGTH}
                                placeholder="your-custom-link"
                                autoCapitalize="none"
                                autoCorrect="off"
                                spellCheck={false}
                                aria-invalid={Boolean(linkError)}
                                aria-describedby="event-public-link-status"
                                onChange={(event) => {
                                  setPublicSlug(event.target.value);
                                  setLinkError("");
                                  setLinkMessage("");
                                }}
                              />
                            </div>
                          </div>
                          <button
                            type="button"
                            className={styles.secondary}
                            disabled={busy || !publicSlug.trim() || publicSlug === savedPublicSlug}
                            onClick={() => void savePublicLink()}
                          >
                            Save link
                          </button>
                          <p
                            id="event-public-link-status"
                            role={linkError ? "alert" : "status"}
                            className={linkError ? styles.error : undefined}
                          >
                            {linkError ||
                              linkMessage ||
                              "Save link updates the URL immediately. Previous links keep working. Event details and design are saved separately."}
                          </p>
                        </>
                      ) : (
                        <p>Save a draft to create your public link, then edit it here.</p>
                      )}
                    </div>
                  </>
                ),
              },
            ]}
          />
        </fieldset>
      )}
    >
      {previewOnly && (
        <dialog
          ref={previewDialog}
          className={styles.pagePreviewDialog}
          aria-label="Event Page preview"
          onCancel={() => setPreviewOnly(false)}
        >
          <header className={styles.pagePreviewHeader}>
            <span>Event Page preview</span>
            <button
              type="button"
              className={styles.secondary}
              onClick={() => setPreviewOnly(false)}
            >
              Close
            </button>
          </header>
          <EventSectionsReadOnly><CustomEventPageContent page={page} showGuestActions /></EventSectionsReadOnly>
        </dialog>
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
    </EventEditorWorkspace>
    </EventSectionBuilderProvider>
  );
}
