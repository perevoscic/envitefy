"use client";

import Image from "next/image";
import {
  useMemo,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ChangeEvent,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "@/components/event-create/TemplateGallery.module.css";
import {
  DEFAULT_PREVIEW,
  resolveTemplateVariation,
  type ResolvedTemplateVariation,
} from "@/components/event-create/TemplateGallery";
import {
  type BirthdayTemplateDefinition,
  birthdayTemplateCatalog,
} from "@/components/event-create/BirthdayTemplateGallery";
import { EditSquareIcon } from "@/components/icons/EditSquareIcon";

function parseDateInput(label?: string | null) {
  if (!label) return "";
  const parsed = new Date(label);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
}

function formatDateLabel(value?: string) {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(parsed);
  } catch {
    return parsed.toDateString();
  }
}

function toLocalDateValue(d: Date | null): string {
  if (!d) return "";
  try {
    const pad = (n: number) => String(n).padStart(2, "0");
    const y = d.getFullYear();
    const m = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    return `${y}-${m}-${day}`;
  } catch {
    return "";
  }
}

function toLocalTimeValue(d: Date | null): string {
  if (!d) return "";
  try {
    const pad = (n: number) => String(n).padStart(2, "0");
    const hh = pad(d.getHours());
    const mm = pad(d.getMinutes());
    return `${hh}:${mm}`;
  } catch {
    return "";
  }
}

function getTemplateById(id?: string | null): BirthdayTemplateDefinition {
  if (!id) return birthdayTemplateCatalog[0];
  return (
    birthdayTemplateCatalog.find((template) => template.id === id) ??
    birthdayTemplateCatalog[0]
  );
}

const infoSections = [
  {
    key: "headline",
    label: "Headline",
    description:
      "Set the birthday person's name, event date, and city/state for the hero header.",
  },
  {
    key: "design",
    label: "Design",
    description:
      "Pick a color story that sets the palette for the hero preview.",
  },
  {
    key: "photos",
    label: "Photos",
    description:
      "Upload up to five gallery photos. Landscape-oriented shots keep the layout tidy.",
  },
  {
    key: "registry",
    label: "Registry",
    description:
      "Drop your registry links here. We'll feature them on a dedicated page once the site is live.",
  },
];

type RegistryEntry = {
  id: string;
  label: string;
  url: string;
};

export default function BirthdayTemplateCustomizePage() {
  const search = useSearchParams();
  const router = useRouter();

  const templateId = search?.get("templateId");
  const defaultDate = search?.get("d") ?? undefined;
  const editEventId = search?.get("edit") ?? undefined;

  // Redirect to template selection if no templateId is provided
  useEffect(() => {
    if (!templateId) {
      const params = new URLSearchParams();
      if (defaultDate) params.set("d", defaultDate);
      const query = params.toString();
      router.replace(`/event/birthdays${query ? `?${query}` : ""}`);
    }
  }, [templateId, defaultDate, router]);

  const template = useMemo(() => {
    if (!templateId) return birthdayTemplateCatalog[0];
    return getTemplateById(templateId);
  }, [templateId]);
  const variationParam = search?.get("variationId") ?? "";
  const firstVariationId = template.variations[0]?.id ?? "";
  const [selectedVariationId, setSelectedVariationId] = useState(
    variationParam || firstVariationId
  );
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [sectionNotes, setSectionNotes] = useState<Record<string, string>>({});
  const [photoFiles, setPhotoFiles] = useState<
    Array<{ file: File; previewUrl: string }>
  >([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [customTitles, setCustomTitles] = useState<Record<string, string>>({});
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const generateId = useCallback(
    () =>
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2, 10),
    []
  );
  const [registries, setRegistries] = useState<RegistryEntry[]>([]);

  useEffect(() => {
    return () => {
      photoFiles.forEach((photo) => {
        URL.revokeObjectURL(photo.previewUrl);
      });
    };
  }, []);

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    const remainingSlots = 5 - photoFiles.length;
    if (remainingSlots <= 0) return;

    const filesToAdd = files.slice(0, remainingSlots);
    const newPhotos = filesToAdd.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setPhotoFiles((prev) => [...prev, ...newPhotos]);

    if (photoInputRef.current) {
      photoInputRef.current.value = "";
    }
  };

  const removePhoto = (index: number) => {
    setPhotoFiles((prev) => {
      const photo = prev[index];
      if (photo) {
        URL.revokeObjectURL(photo.previewUrl);
      }
      const newPhotos = prev.filter((_, i) => i !== index);
      if (currentPhotoIndex >= newPhotos.length && newPhotos.length > 0) {
        setCurrentPhotoIndex(newPhotos.length - 1);
      } else if (newPhotos.length === 0) {
        setCurrentPhotoIndex(0);
      }
      return newPhotos;
    });
  };

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % photoFiles.length);
  };
  const prevPhoto = () => {
    setCurrentPhotoIndex(
      (prev) => (prev - 1 + photoFiles.length) % photoFiles.length
    );
  };

  useEffect(() => {
    if (variationParam) {
      setSelectedVariationId(variationParam);
      return;
    }
    if (firstVariationId) {
      setSelectedVariationId(firstVariationId);
    }
  }, [variationParam, firstVariationId]);

  const resolvedVariation: ResolvedTemplateVariation = useMemo(() => {
    const variation =
      template.variations.find((v) => v.id === selectedVariationId) ??
      template.variations[0];
    return resolveTemplateVariation(variation);
  }, [template, selectedVariationId]);

  const resolvedVariations = useMemo(
    () =>
      template.variations.map((variation) =>
        resolveTemplateVariation(variation)
      ),
    [template.variations]
  );

  const displayVariations = useMemo(() => {
    const trimmed = resolvedVariations.slice(0, 16);
    if (
      trimmed.some((variation) => variation.id === selectedVariationId) ||
      trimmed.length < 6
    ) {
      return trimmed;
    }
    const selected = resolvedVariations.find(
      (variation) => variation.id === selectedVariationId
    );
    if (!selected) {
      return trimmed;
    }
    return [...trimmed.slice(0, trimmed.length - 1), selected];
  }, [resolvedVariations, selectedVariationId]);

  const renderSectionContent = (sectionKey: string) => {
    if (sectionKey === "headline") {
      return (
        <div className="space-y-4">
          <label className="block text-sm font-medium text-stone-700">
            Birthday person's name
            <input
              type="text"
              value={birthdayName}
              onChange={(e) => setBirthdayName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-stone-400 focus:outline-none"
              placeholder="Name"
            />
          </label>
          <label className="block text-sm font-medium text-stone-700">
            Event date
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-stone-400 focus:outline-none"
            />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="block text-sm font-medium text-stone-700">
              City
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-stone-400 focus:outline-none"
              />
            </label>
            <label className="block text-sm font-medium text-stone-700">
              State
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-stone-400 focus:outline-none"
              />
            </label>
          </div>
        </div>
      );
    }
    if (sectionKey === "design") {
      return (
        <div className={styles.variationSection}>
          <span className={styles.variationKicker}>Color stories</span>
          <div className={styles.variationRow}>
            {displayVariations.map((variation) => {
              const isActiveVariation = variation.id === selectedVariationId;
              return (
                <button
                  key={variation.id}
                  type="button"
                  aria-pressed={isActiveVariation}
                  className={`${styles.variationButton} ${
                    isActiveVariation ? styles.variationActive : ""
                  }`}
                  onClick={() => setSelectedVariationId(variation.id)}
                >
                  <div className={styles.variationSwatches}>
                    {variation.swatches.map((color) => (
                      <span
                        key={color}
                        className={styles.paletteDot}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <div className={styles.variationLabel}>
                    <span>{variation.label}</span>
                    <small>{variation.tagline}</small>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      );
    }
    if (sectionKey === "photos") {
      return (
        <div className="space-y-3">
          <div className="flex flex-col gap-2">
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoChange}
              className="hidden"
              id="photo-upload-input"
              disabled={photoFiles.length >= 5}
            />
            <label
              htmlFor="photo-upload-input"
              className={`inline-flex cursor-pointer items-center gap-2 rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-stone-400 hover:bg-stone-50 ${
                photoFiles.length >= 5 ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <rect
                  x="3"
                  y="3"
                  width="18"
                  height="18"
                  rx="2"
                  strokeWidth="1.6"
                />
                <circle cx="8.5" cy="8.5" r="1.5" strokeWidth="1.6" />
                <path
                  d="M21 15l-5-5L5 21"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>Choose Files</span>
            </label>
            <p className="text-xs text-stone-500">
              Selected {photoFiles.length}{" "}
              {photoFiles.length === 1 ? "photo" : "photos"} (max 5).
            </p>
            <p className="text-xs text-stone-500">
              💡 Best results: Landscape photos (16:9 or 4:3), 1920×1080px or
              larger. JPG or PNG, under 10MB per image.
            </p>
          </div>
          {photoFiles.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
              {photoFiles.map((photo, index) => (
                <div
                  key={index}
                  className="relative group rounded-lg overflow-hidden border border-stone-200 bg-white"
                >
                  <img
                    src={photo.previewUrl}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-32 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Remove photo"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      className="h-4 w-4"
                      strokeWidth="2"
                    >
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
    if (sectionKey === "registry") {
      return (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() =>
              setRegistries((prev) => [
                ...prev,
                { id: generateId(), label: "", url: "" },
              ])
            }
            className="inline-flex items-center gap-2 rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-stone-400 hover:bg-stone-50"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              className="h-5 w-5"
              strokeWidth="1.6"
            >
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
            <span>Add registry</span>
          </button>
          {registries.length > 0 && (
            <div className="space-y-3">
              {registries.map((registry) => (
                <div
                  key={registry.id}
                  className="rounded-2xl border border-stone-200 bg-white/80 p-4 shadow-sm"
                >
                  <input
                    type="text"
                    placeholder="Registry name (e.g., Amazon, Target)"
                    value={registry.label}
                    onChange={(event) =>
                      setRegistries((prev) =>
                        prev.map((entry) =>
                          entry.id === registry.id
                            ? { ...entry, label: event.target.value }
                            : entry
                        )
                      )
                    }
                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-stone-400 focus:outline-none"
                  />
                  <input
                    type="url"
                    placeholder="https://www.example.com/your-registry"
                    value={registry.url}
                    onChange={(event) =>
                      setRegistries((prev) =>
                        prev.map((entry) =>
                          entry.id === registry.id
                            ? { ...entry, url: event.target.value }
                            : entry
                        )
                      )
                    }
                    className="mt-2 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-stone-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    className="mt-3 text-xs font-semibold uppercase tracking-[0.3em] text-stone-500"
                    onClick={() =>
                      setRegistries((prev) =>
                        prev.filter((entry) => entry.id !== registry.id)
                      )
                    }
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const activeSectionData = activeSection
    ? infoSections.find((section) => section.key === activeSection)
    : undefined;
  const handleBack = () => {
    setActiveSection(null);
  };
  useEffect(() => {
    if (!activeSection) {
      setEditingTitle(null);
      setRenameDraft("");
    }
  }, [activeSection]);
  const menuLabel = (key: string, label: string) => customTitles[key] ?? label;
  const startEditTitle = () => {
    if (!activeSection) return;
    setEditingTitle(activeSection);
    setRenameDraft(
      customTitles[activeSection] ?? activeSectionData?.label ?? activeSection
    );
  };
  const saveTitle = () => {
    if (!activeSection || renameDraft.trim() === "") return;
    setCustomTitles((prev) => ({
      ...prev,
      [activeSection]: renameDraft.trim(),
    }));
    setEditingTitle(null);
  };

  const hasPhotos = photoFiles.length > 0;

  const templateLocation =
    template.preview?.location ?? DEFAULT_PREVIEW.location;
  const [defaultCity, defaultState] = templateLocation
    .split(",")
    .map((s) => s.trim());

  const [birthdayName, setBirthdayName] = useState("");
  const [eventDate, setEventDate] = useState(
    parseDateInput(
      defaultDate ?? template.preview?.dateLabel ?? DEFAULT_PREVIEW.dateLabel
    )
  );
  const [city, setCity] = useState(defaultCity ?? "");
  const [state, setState] = useState(defaultState ?? "");

  // Event fields from old birthday form
  const initialStart = useMemo(() => {
    const base = defaultDate ? new Date(defaultDate) : new Date();
    base.setSeconds(0, 0);
    const rounded = new Date(base);
    const minutes = rounded.getMinutes();
    rounded.setMinutes(minutes - (minutes % 15));
    return rounded;
  }, [defaultDate]);

  const initialEnd = useMemo(() => {
    const d = new Date(initialStart);
    d.setHours(d.getHours() + 1);
    return d;
  }, [initialStart]);

  const [title, setTitle] = useState("");
  const [whenDate, setWhenDate] = useState<string>(
    toLocalDateValue(new Date(initialStart))
  );
  const [fullDay, setFullDay] = useState<boolean>(false);
  const [startTime, setStartTime] = useState<string>(
    toLocalTimeValue(initialStart)
  );
  const [endDate, setEndDate] = useState<string>(
    toLocalDateValue(new Date(initialStart))
  );
  const [endTime, setEndTime] = useState<string>(toLocalTimeValue(initialEnd));

  // Sync end date with start date when start date changes
  useEffect(() => {
    setEndDate(whenDate);
  }, [whenDate]);
  const [venue, setVenue] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [description, setDescription] = useState("");
  const [rsvp, setRsvp] = useState("");
  const [numberOfGuests, setNumberOfGuests] = useState<number>(0);
  const descriptionRef = useRef<HTMLTextAreaElement | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load event data when editing
  useEffect(() => {
    if (!editEventId) return;

    const loadEvent = async () => {
      try {
        const res = await fetch(`/api/history/${editEventId}`, {
          credentials: "include",
        });
        if (!res.ok) return;
        const event = await res.json();
        const data = event?.data || {};

        // Load template customization data
        if (data.templateId) {
          // Template ID is already in URL, but we can verify
        }
        if (data.variationId) {
          setSelectedVariationId(data.variationId);
        }
        if (data.birthdayName) {
          setBirthdayName(data.birthdayName);
        }
        if (data.customTitles && typeof data.customTitles === "object") {
          setCustomTitles(data.customTitles);
        }
        if (data.sectionNotes && typeof data.sectionNotes === "object") {
          setSectionNotes(data.sectionNotes);
        }
        if (Array.isArray(data.registries)) {
          setRegistries(
            data.registries.map((r: any) => ({
              id: generateId(),
              label: r.label || "",
              url: r.url || "",
            }))
          );
        }

        // Load event details
        if (event.title) {
          setTitle(event.title);
        }
        if (data.startISO) {
          const startDate = new Date(data.startISO);
          setWhenDate(toLocalDateValue(startDate));
          setEndDate(toLocalDateValue(startDate));
          if (!data.allDay) {
            setStartTime(toLocalTimeValue(startDate));
            if (data.endISO) {
              const endDate = new Date(data.endISO);
              setEndTime(toLocalTimeValue(endDate));
            }
          }
          setFullDay(data.allDay || false);
        }
        if (data.venue) {
          setVenue(data.venue);
        }
        if (data.location) {
          setEventLocation(data.location);
          // Try to extract city/state from location
          const parts = data.location.split(",").map((s: string) => s.trim());
          if (parts.length >= 2) {
            setCity(parts[0]);
            setState(parts.slice(1).join(", "));
          }
        }
        if (data.description) {
          setDescription(data.description);
        }
        if (data.rsvp) {
          setRsvp(data.rsvp);
        }
        if (typeof data.numberOfGuests === "number") {
          setNumberOfGuests(data.numberOfGuests);
        }
      } catch (err) {
        console.error("Failed to load event:", err);
      }
    };

    loadEvent();
  }, [editEventId, generateId]);

  // Autosize description
  useEffect(() => {
    const el = descriptionRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [description]);

  const previewName =
    birthdayName.trim() || template.preview?.birthdayName || "Birthday Person";

  const previewDateLabel =
    formatDateLabel(eventDate) ??
    template.preview?.dateLabel ??
    DEFAULT_PREVIEW.dateLabel;
  const previewLocation =
    city || state ? [city, state].filter(Boolean).join(", ") : templateLocation;

  const heroImageSrc = `/templates/wedding-placeholders/${template.heroImageName}`;
  const backgroundImageSrc = `/templates/birthdays/${template.id}.webp`;

  const handleReview = useCallback(() => {
    setShowReview(true);
  }, []);

  const handlePublish = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      // Calculate start and end ISO dates
      let startISO: string | null = null;
      let endISO: string | null = null;
      if (whenDate) {
        if (fullDay) {
          const start = new Date(`${whenDate}T00:00:00`);
          const now = new Date();
          const todayStart = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
          );
          if (start < todayStart)
            throw new Error("Start date cannot be in the past");
          const end = new Date(start);
          end.setDate(end.getDate() + 1);
          startISO = start.toISOString();
          endISO = end.toISOString();
        } else {
          const start = new Date(`${whenDate}T${startTime || "09:00"}:00`);
          const end = new Date(`${whenDate}T${endTime || "10:00"}:00`);
          const now = new Date();
          const todayStart = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
          );
          if (start < todayStart)
            throw new Error("Start date cannot be in the past");
          if (end < start) {
            endISO = new Date(start.getTime() + 60 * 60 * 1000).toISOString();
            startISO = start.toISOString();
          } else {
            startISO = start.toISOString();
            endISO = end.toISOString();
          }
        }
      }

      // Prepare registries
      const sanitizedRegistries = registries
        .filter((r) => r.url.trim())
        .map((r) => ({
          label: r.label.trim() || "Registry",
          url: r.url.trim(),
        }));

      const payload: any = {
        title: title || `${birthdayName || "Birthday Person"}'s Birthday`,
        data: {
          category: "Birthdays",
          createdVia: "template",
          createdManually: true,
          startISO,
          endISO,
          venue: venue || undefined,
          location: eventLocation || undefined,
          description: description || undefined,
          rsvp: (rsvp || "").trim() || undefined,
          numberOfGuests: numberOfGuests || 0,
          allDay: fullDay || undefined,
          registries:
            sanitizedRegistries.length > 0 ? sanitizedRegistries : undefined,
          // Template customization data
          templateId: template.id,
          variationId: resolvedVariation.id,
          birthdayName: birthdayName || undefined,
          customTitles:
            Object.keys(customTitles).length > 0 ? customTitles : undefined,
          sectionNotes:
            Object.keys(sectionNotes).length > 0 ? sectionNotes : undefined,
        },
      };

      let id: string | undefined;

      if (editEventId) {
        // Update existing event
        await fetch(`/api/history/${editEventId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            title: payload.title,
            data: payload.data,
          }),
        });
        id = editEventId;
      } else {
        // Create new event
        const r = await fetch("/api/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
        const j = await r.json().catch(() => ({}));
        id = (j as any)?.id as string | undefined;
      }

      if (id) {
        router.push(`/event/${id}${editEventId ? "?updated=1" : "?created=1"}`);
      } else {
        throw new Error(
          editEventId ? "Failed to update event" : "Failed to create event"
        );
      }
    } catch (err: any) {
      const msg = String(err?.message || err || "Failed to create event");
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  }, [
    submitting,
    whenDate,
    fullDay,
    startTime,
    endDate,
    endTime,
    title,
    birthdayName,
    venue,
    eventLocation,
    description,
    rsvp,
    numberOfGuests,
    registries,
    template.id,
    resolvedVariation.id,
    customTitles,
    sectionNotes,
    editEventId,
    router,
  ]);

  const PreviewCard = ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => (
    <div className="rounded-2xl border border-black/5 bg-white/80 p-5 shadow-sm backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-400">
        {title}
      </p>
      <div className="mt-3 space-y-3 text-sm text-stone-700">{children}</div>
    </div>
  );

  return (
    <main className="px-5 py-10">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 lg:flex-row">
        <div className="flex-1 space-y-6">
          <article className={styles.templateCard}>
            <div className={styles.cardBody}>
              <div className={styles.previewFrame}>
                <div
                  className={styles.previewHeader}
                  style={{
                    backgroundImage: `url(${backgroundImageSrc})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                  }}
                  data-birthday="true"
                >
                  <p
                    className={styles.previewNames}
                    style={{
                      color: resolvedVariation.titleColor,
                      fontFamily: resolvedVariation.titleFontFamily,
                      fontWeight:
                        resolvedVariation.titleWeight === "bold"
                          ? 700
                          : resolvedVariation.titleWeight === "semibold"
                          ? 600
                          : 400,
                    }}
                  >
                    {previewName}'s Birthday
                  </p>
                  <p
                    className={styles.previewMeta}
                    style={{ color: resolvedVariation.titleColor }}
                  >
                    {previewDateLabel} • {previewLocation}
                  </p>
                  <div
                    className={styles.previewNav}
                    style={{ color: resolvedVariation.titleColor }}
                  >
                    {template.menu.slice(0, 5).map((item) => (
                      <span key={item} className={styles.previewNavItem}>
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
                <div className={styles.previewPhoto}>
                  <Image
                    src={heroImageSrc}
                    alt={`${template.name} preview`}
                    width={640}
                    height={360}
                    className={styles.previewPhotoImage}
                    priority={false}
                  />
                </div>
              </div>

              {/* Event Fields Section */}
              <div className="mt-6 rounded-2xl border border-black/5 bg-white/90 p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-stone-900 mb-4">
                  Event Details
                </h2>
                <div className="space-y-4">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:border-stone-400 focus:outline-none"
                      placeholder="Event title"
                    />
                  </div>

                  {/* When */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-stone-700">
                        When
                      </label>
                      <label className="inline-flex items-center gap-2 text-sm text-stone-600">
                        <input
                          type="checkbox"
                          checked={fullDay}
                          onChange={(e) => setFullDay(e.target.checked)}
                          className="rounded"
                        />
                        <span>Full day</span>
                      </label>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                      <div>
                        <label className="text-xs text-stone-500">Date</label>
                        <input
                          type="date"
                          value={whenDate}
                          onChange={(e) => setWhenDate(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:border-stone-400 focus:outline-none"
                        />
                      </div>
                      {!fullDay && (
                        <>
                          <div>
                            <label className="text-xs text-stone-500">
                              Start time
                            </label>
                            <input
                              type="time"
                              value={startTime}
                              onChange={(e) => setStartTime(e.target.value)}
                              className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:border-stone-400 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-stone-500">
                              End time
                            </label>
                            <input
                              type="time"
                              value={endTime}
                              onChange={(e) => setEndTime(e.target.value)}
                              className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:border-stone-400 focus:outline-none"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">
                      Address
                    </label>
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={venue}
                        onChange={(e) => setVenue(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:border-stone-400 focus:outline-none"
                        placeholder="Venue name (optional)"
                      />
                      <input
                        type="text"
                        value={eventLocation}
                        onChange={(e) => setEventLocation(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:border-stone-400 focus:outline-none"
                        placeholder="Street, City, State ZIP"
                      />
                    </div>
                  </div>

                  {/* Guests */}
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">
                      Guests
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={numberOfGuests || ""}
                      onChange={(e) =>
                        setNumberOfGuests(
                          Number.parseInt(e.target.value, 10) || 0
                        )
                      }
                      className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:border-stone-400 focus:outline-none"
                      placeholder="Enter number of guests"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">
                      Description
                    </label>
                    <textarea
                      ref={descriptionRef}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:border-stone-400 focus:outline-none resize-none"
                      placeholder="Add details for your guests"
                    />
                  </div>

                  {/* RSVP */}
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">
                      RSVP
                    </label>
                    <input
                      type="text"
                      value={rsvp}
                      onChange={(e) => setRsvp(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:border-stone-400 focus:outline-none"
                      placeholder="Phone number or email for RSVP"
                    />
                  </div>
                </div>
              </div>

              {hasPhotos && (
                <div className="mt-4 space-y-4">
                  <PreviewCard title={menuLabel("photos", "Photos")}>
                    <div className="relative w-full">
                      <div className="relative overflow-hidden rounded-2xl bg-stone-100 aspect-[4/3]">
                        <div
                          className="flex h-full transition-transform duration-500 ease-in-out"
                          style={{
                            transform: `translateX(-${
                              currentPhotoIndex * 100
                            }%)`,
                          }}
                        >
                          {photoFiles.map((photo, index) => (
                            <div
                              key={index}
                              className="min-w-full h-full relative"
                            >
                              <img
                                src={photo.previewUrl}
                                alt={`Gallery photo ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                            </div>
                          ))}
                        </div>

                        {photoFiles.length > 1 && (
                          <>
                            <button
                              type="button"
                              onClick={prevPhoto}
                              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white backdrop-blur-sm rounded-full p-2 shadow-lg transition-all hover:scale-110"
                              aria-label="Previous photo"
                            >
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                className="w-5 h-5 text-stone-700"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M15 18l-6-6 6-6" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={nextPhoto}
                              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white backdrop-blur-sm rounded-full p-2 shadow-lg transition-all hover:scale-110"
                              aria-label="Next photo"
                            >
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                className="w-5 h-5 text-stone-700"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M9 18l6-6-6-6" />
                              </svg>
                            </button>
                          </>
                        )}

                        {photoFiles.length > 1 && (
                          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2">
                            {photoFiles.map((_, index) => (
                              <button
                                key={index}
                                type="button"
                                onClick={() => setCurrentPhotoIndex(index)}
                                className={`h-2 rounded-full transition-all ${
                                  index === currentPhotoIndex
                                    ? "w-8 bg-white"
                                    : "w-2 bg-white/60 hover:bg-white/80"
                                }`}
                                aria-label={`Go to photo ${index + 1}`}
                              />
                            ))}
                          </div>
                        )}

                        {photoFiles.length > 1 && (
                          <div className="absolute top-4 right-4 z-10 bg-black/40 backdrop-blur-sm text-white text-xs font-medium px-3 py-1.5 rounded-full">
                            {currentPhotoIndex + 1} / {photoFiles.length}
                          </div>
                        )}
                      </div>

                      {photoFiles.length > 1 && (
                        <div className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                          {photoFiles.map((photo, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => setCurrentPhotoIndex(index)}
                              className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                                index === currentPhotoIndex
                                  ? "border-stone-400 scale-105 shadow-md"
                                  : "border-stone-200 hover:border-stone-300 opacity-70 hover:opacity-100"
                              }`}
                            >
                              <img
                                src={photo.previewUrl}
                                alt={`Thumbnail ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </PreviewCard>
                </div>
              )}
            </div>
          </article>
        </div>
        <div className="w-full max-w-md flex flex-col rounded-2xl border border-black/5 bg-white/90 p-6 shadow-md">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-stone-500">
              Customize
            </p>
            <h2 className="text-2xl font-semibold text-stone-900">
              Add your details
            </h2>
          </div>
          <div className={`${styles.accordionWrapper} flex-1 min-h-0`}>
            <div
              className={`${styles.menuView} ${
                activeSection ? styles.menuHidden : ""
              }`}
            >
              {infoSections.map((section) => (
                <div key={section.key} className={styles.menuItem}>
                  <button
                    type="button"
                    className={styles.menuButton}
                    onClick={() => setActiveSection(section.key)}
                  >
                    <span>{menuLabel(section.key, section.label)}</span>
                    <span className={styles.menuButtonIcon}>➤</span>
                  </button>
                  <p>{section.description}</p>
                </div>
              ))}
            </div>
            {activeSectionData && (
              <div
                className={`${styles.detailPanel} ${styles.detailPanelOpen}`}
              >
                <div className={styles.detailHeader}>
                  <button
                    type="button"
                    className="text-sm font-semibold text-stone-600"
                    onClick={handleBack}
                  >
                    ← Back
                  </button>
                  <div className="flex items-center gap-2">
                    {editingTitle === activeSection ? (
                      <input
                        value={renameDraft}
                        onChange={(event) => setRenameDraft(event.target.value)}
                        onBlur={saveTitle}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            saveTitle();
                          }
                        }}
                        className="border-b border-stone-700 text-sm uppercase tracking-[0.3em] px-2 py-1"
                        autoFocus
                      />
                    ) : (
                      <h3 className={styles.detailTitle}>
                        {menuLabel(
                          activeSectionData.key,
                          activeSectionData.label
                        )}
                      </h3>
                    )}
                    {editingTitle !== activeSection && (
                      <button
                        type="button"
                        aria-label="Rename link"
                        className="text-xs uppercase tracking-[0.3em] text-stone-500"
                        onClick={startEditTitle}
                      >
                        <EditSquareIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <span />
                </div>
                <p className={styles.detailDesc}>
                  {activeSectionData.description}
                </p>
                <div className={styles.detailContent}>
                  {renderSectionContent(activeSectionData.key)}
                </div>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleReview}
            className="mt-5 w-full rounded-full bg-stone-900 px-4 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-stone-800"
          >
            Review
          </button>
        </div>
      </section>

      {/* Review/Preview Modal */}
      {showReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-stone-200 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-2xl font-semibold text-stone-900">
                Review Your Event
              </h2>
              <button
                type="button"
                onClick={() => setShowReview(false)}
                className="text-stone-500 hover:text-stone-700"
                aria-label="Close"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Template Preview */}
              <div className="rounded-2xl border border-stone-200 bg-white p-6">
                <div className={styles.templateCard}>
                  <div className={styles.cardBody}>
                    <div className={styles.previewFrame}>
                      <div
                        className={styles.previewHeader}
                        style={{
                          backgroundImage: `url(${backgroundImageSrc})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          backgroundRepeat: "no-repeat",
                        }}
                        data-birthday="true"
                      >
                        <p
                          className={styles.previewNames}
                          style={{
                            color: resolvedVariation.titleColor,
                            fontFamily: resolvedVariation.titleFontFamily,
                            fontWeight:
                              resolvedVariation.titleWeight === "bold"
                                ? 700
                                : resolvedVariation.titleWeight === "semibold"
                                ? 600
                                : 400,
                          }}
                        >
                          {previewName}'s Birthday
                        </p>
                        <p
                          className={styles.previewMeta}
                          style={{ color: resolvedVariation.titleColor }}
                        >
                          {previewDateLabel} • {previewLocation}
                        </p>
                        <div
                          className={styles.previewNav}
                          style={{ color: resolvedVariation.titleColor }}
                        >
                          {template.menu.slice(0, 5).map((item) => (
                            <span key={item} className={styles.previewNavItem}>
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className={styles.previewPhoto}>
                        <Image
                          src={heroImageSrc}
                          alt={`${template.name} preview`}
                          width={640}
                          height={360}
                          className={styles.previewPhotoImage}
                          priority={false}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Event Details */}
              <div className="rounded-2xl border border-stone-200 bg-white p-6">
                <h3 className="text-lg font-semibold text-stone-900 mb-4">
                  Event Details
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 mb-1">
                      Title
                    </p>
                    <p className="text-base text-stone-900">
                      {title ||
                        `${birthdayName || "Birthday Person"}'s Birthday`}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 mb-1">
                      When
                    </p>
                    <p className="text-base text-stone-900">
                      {whenDate
                        ? new Date(whenDate).toLocaleDateString("en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                        : "Not set"}
                      {!fullDay && startTime && ` at ${startTime}`}
                      {!fullDay && endTime && ` - ${endTime}`}
                      {fullDay && " (All day)"}
                    </p>
                  </div>

                  {(venue || eventLocation) && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 mb-1">
                        Location
                      </p>
                      <p className="text-base text-stone-900">
                        {venue && <span className="font-medium">{venue}</span>}
                        {venue && eventLocation && <span>, </span>}
                        {eventLocation}
                      </p>
                    </div>
                  )}

                  {numberOfGuests > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 mb-1">
                        Guests
                      </p>
                      <p className="text-base text-stone-900">
                        {numberOfGuests}
                      </p>
                    </div>
                  )}

                  {description && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 mb-1">
                        Description
                      </p>
                      <p className="text-base text-stone-900 whitespace-pre-wrap">
                        {description}
                      </p>
                    </div>
                  )}

                  {rsvp && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 mb-1">
                        RSVP
                      </p>
                      <p className="text-base text-stone-900">{rsvp}</p>
                    </div>
                  )}

                  {registries.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 mb-2">
                        Registry Links
                      </p>
                      <div className="space-y-2">
                        {registries
                          .filter((r) => r.url.trim())
                          .map((registry) => (
                            <div
                              key={registry.id}
                              className="flex items-center gap-2"
                            >
                              <span className="text-sm text-stone-700">
                                {registry.label || "Registry"}
                              </span>
                              <a
                                href={registry.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:underline"
                              >
                                {registry.url}
                              </a>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Event Details */}
              <div className="rounded-2xl border border-stone-200 bg-white p-6">
                <h3 className="text-lg font-semibold text-stone-900 mb-4">
                  Event Details
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 mb-1">
                      Title
                    </p>
                    <p className="text-base text-stone-900">
                      {title ||
                        `${birthdayName || "Birthday Person"}'s Birthday`}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 mb-1">
                      When
                    </p>
                    <p className="text-base text-stone-900">
                      {whenDate
                        ? new Date(whenDate).toLocaleDateString("en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                        : "Not set"}
                      {!fullDay && startTime && ` at ${startTime}`}
                      {!fullDay && endTime && ` - ${endTime}`}
                      {fullDay && " (All day)"}
                    </p>
                  </div>

                  {(venue || eventLocation) && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 mb-1">
                        Location
                      </p>
                      <p className="text-base text-stone-900">
                        {venue && <span className="font-medium">{venue}</span>}
                        {venue && eventLocation && <span>, </span>}
                        {eventLocation}
                      </p>
                    </div>
                  )}

                  {numberOfGuests > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 mb-1">
                        Guests
                      </p>
                      <p className="text-base text-stone-900">
                        {numberOfGuests}
                      </p>
                    </div>
                  )}

                  {description && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 mb-1">
                        Description
                      </p>
                      <p className="text-base text-stone-900 whitespace-pre-wrap">
                        {description}
                      </p>
                    </div>
                  )}

                  {rsvp && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 mb-1">
                        RSVP
                      </p>
                      <p className="text-base text-stone-900">{rsvp}</p>
                    </div>
                  )}

                  {registries.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 mb-2">
                        Registry Links
                      </p>
                      <div className="space-y-2">
                        {registries
                          .filter((r) => r.url.trim())
                          .map((registry) => (
                            <div
                              key={registry.id}
                              className="flex items-center gap-2"
                            >
                              <span className="text-sm text-stone-700">
                                {registry.label || "Registry"}
                              </span>
                              <a
                                href={registry.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:underline"
                              >
                                {registry.url}
                              </a>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="sticky bottom-0 bg-white border-t border-stone-200 px-6 py-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowReview(false)}
                className="px-4 py-2 text-sm font-medium text-stone-700 bg-white border border-stone-300 rounded-md hover:bg-stone-50"
              >
                Back to Edit
              </button>
              <button
                type="button"
                onClick={handlePublish}
                disabled={submitting}
                className="px-6 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-md hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? "Publishing..." : "Publish Event"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
