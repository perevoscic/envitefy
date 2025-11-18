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
import { Baloo_2, Poppins } from "next/font/google";
import styles from "@/components/event-create/TemplateGallery.module.css";
import {
  DEFAULT_PREVIEW,
  resolveTemplateVariation,
  type ResolvedTemplateVariation,
} from "@/components/event-create/TemplateGallery";
import {
  type BabyShowerTemplateDefinition,
  babyShowerTemplateCatalog,
} from "@/components/event-create/BabyShowersTemplateGallery";
import { EditSquareIcon } from "@/components/icons/EditSquareIcon";

const baloo = Baloo_2({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-baloo",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});

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

function formatTimeForPreview(value?: string | null): string {
  if (!value) return "";
  const [hourPart, minutePart] = value.split(":");
  const hour = Number.parseInt(hourPart || "0", 10);
  const minute = Number.parseInt(minutePart || "0", 10);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return value;
  const suffix = hour >= 12 ? "PM" : "AM";
  const normalizedHour = ((hour + 11) % 12) + 1;
  const paddedMinute = minute.toString().padStart(2, "0");
  return `${normalizedHour}:${paddedMinute} ${suffix}`;
}

function getTemplateById(id?: string | null): BabyShowerTemplateDefinition {
  if (!id) return babyShowerTemplateCatalog[0];
  return (
    babyShowerTemplateCatalog.find((template) => template.id === id) ??
    babyShowerTemplateCatalog[0]
  );
}

const infoSections = [
  {
    key: "headline",
    label: "Headline",
    description:
      "Set the event title, event date, and time for the hero header.",
  },
  {
    key: "design",
    label: "Design",
    description:
      "Pick a color story that sets the palette for the hero preview.",
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

export default function BabyShowerTemplateCustomizePage() {
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
      router.replace(`/event/baby-showers${query ? `?${query}` : ""}`);
    }
  }, [templateId, defaultDate, router]);

  const template = useMemo(() => {
    if (!templateId) return babyShowerTemplateCatalog[0];
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
  const [customHeroImage, setCustomHeroImage] = useState<{
    file: File;
    previewUrl: string;
    dataUrl?: string;
  } | null>(null);
  const heroImageInputRef = useRef<HTMLInputElement>(null);
  const heroImageObjectUrlRef = useRef<string | null>(null);
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
      if (heroImageObjectUrlRef.current) {
        URL.revokeObjectURL(heroImageObjectUrlRef.current);
      }
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

  const handleHeroImageChange = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Clean up previous object URL
    if (heroImageObjectUrlRef.current) {
      URL.revokeObjectURL(heroImageObjectUrlRef.current);
    }

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    heroImageObjectUrlRef.current = previewUrl;

    // Convert to data URL for storage
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setCustomHeroImage({
        file,
        previewUrl,
        dataUrl,
      });
    };
    reader.readAsDataURL(file);

    // Reset input to allow selecting the same file again
    if (heroImageInputRef.current) {
      heroImageInputRef.current.value = "";
    }
  };

  const removeHeroImage = () => {
    if (heroImageObjectUrlRef.current) {
      URL.revokeObjectURL(heroImageObjectUrlRef.current);
      heroImageObjectUrlRef.current = null;
    }
    setCustomHeroImage(null);
    if (heroImageInputRef.current) {
      heroImageInputRef.current.value = "";
    }
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
          <label className="block text-sm font-medium text-[#4A403C]">
            Title
            <input
              type="text"
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#E8D5FF] px-3 py-2 text-sm focus:border-[#9B7ED9] focus:outline-none bg-white"
              placeholder="Event Title"
            />
          </label>
          <label className="block text-sm font-medium text-[#4A403C]">
            Event date
            <input
              type="date"
              value={eventDate}
              onChange={(e) => {
                setEventDate(e.target.value);
                setWhenDate(e.target.value);
              }}
              className="mt-1 w-full rounded-lg border border-[#E8D5FF] px-3 py-2 text-sm focus:border-[#9B7ED9] focus:outline-none bg-white"
            />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="block text-sm font-medium text-[#4A403C]">
              Start time
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#E8D5FF] px-3 py-2 text-sm focus:border-[#9B7ED9] focus:outline-none bg-white"
              />
            </label>
            <label className="block text-sm font-medium text-[#4A403C]">
              End time
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#E8D5FF] px-3 py-2 text-sm focus:border-[#9B7ED9] focus:outline-none bg-white"
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
            className="inline-flex items-center gap-2 rounded-md border border-[#E8D5FF] bg-white px-4 py-2 text-sm font-medium text-[#4A403C] transition hover:border-[#9B7ED9] hover:bg-[#F5E8FF]"
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
                  className="rounded-2xl border border-[#E8D5FF] bg-white/95 p-4 shadow-sm"
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
                    className="w-full rounded-lg border border-[#E8D5FF] px-3 py-2 text-sm focus:border-[#9B7ED9] focus:outline-none bg-white"
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
                    className="mt-2 w-full rounded-lg border border-[#E8D5FF] px-3 py-2 text-sm focus:border-[#9B7ED9] focus:outline-none bg-white"
                  />
                  <button
                    type="button"
                    className="mt-3 text-xs font-semibold uppercase tracking-[0.3em] text-[#9B7ED9]"
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
    template.preview?.location ?? DEFAULT_PREVIEW.location ?? "New York, NY";
  const [defaultCity, defaultState] = templateLocation
    .split(",")
    .map((s) => s.trim());

  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState(
    parseDateInput(
      defaultDate ?? template.preview?.dateLabel ?? DEFAULT_PREVIEW.dateLabel
    )
  );
  const [city, setCity] = useState(defaultCity ?? "");
  const [state, setState] = useState(defaultState ?? "");

  // Event fields from old baby shower form
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

  // Sync eventDate with whenDate
  useEffect(() => {
    if (whenDate && eventDate !== whenDate) {
      setEventDate(whenDate);
    }
  }, [whenDate]);
  const [venue, setVenue] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
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
        if (data.eventTitle || data.babyShowerName) {
          setEventTitle(data.eventTitle || data.babyShowerName || "");
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
        if (data.customHeroImage) {
          // Load custom hero image from stored data URL
          // Create a placeholder file object for consistency
          const placeholderFile = new File([], "hero-image", {
            type: "image/jpeg",
          });
          setCustomHeroImage({
            file: placeholderFile,
            previewUrl: data.customHeroImage,
            dataUrl: data.customHeroImage,
          });
        }

        // Load event details
        if (event.title) {
          setTitle(event.title);
        }
        if (data.startISO) {
          const startDate = new Date(data.startISO);
          const dateValue = toLocalDateValue(startDate);
          setWhenDate(dateValue);
          setEventDate(dateValue);
          setEndDate(dateValue);
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
          // Parse location into streetAddress, city, state
          const parts = data.location.split(",").map((s: string) => s.trim());
          if (parts.length >= 3) {
            // Format: "Street, City, State"
            setStreetAddress(parts[0]);
            setCity(parts[1]);
            setState(parts.slice(2).join(", "));
          } else if (parts.length === 2) {
            // Format: "City, State" (no street address)
            setStreetAddress("");
            setCity(parts[0]);
            setState(parts[1]);
          } else if (parts.length === 1) {
            // Single part - could be street, city, or state
            setStreetAddress(parts[0]);
            setCity("");
            setState("");
          }
          // Keep eventLocation for backward compatibility
          setEventLocation(data.location);
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
    eventTitle.trim() || template.preview?.coupleName || "Baby Shower";

  const previewDateLabel =
    formatDateLabel(eventDate) ??
    template.preview?.dateLabel ??
    DEFAULT_PREVIEW.dateLabel;
  const previewTime = useMemo(() => {
    if (fullDay) return "";
    return formatTimeForPreview(startTime);
  }, [fullDay, startTime]);

  const heroImageSrc = `/templates/wedding-placeholders/${template.heroImageName}`;
  const backgroundImageSrc = `/templates/baby-showers/${template.id}.webp`;

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

      // Combine address parts into location
      const locationParts = [streetAddress, city, state].filter(Boolean);
      const combinedLocation =
        locationParts.length > 0 ? locationParts.join(", ") : undefined;

      const payload: any = {
        title: title || eventTitle || "Baby Shower",
        data: {
          category: "Baby Showers",
          createdVia: "template",
          createdManually: true,
          startISO,
          endISO,
          venue: venue || undefined,
          location: combinedLocation || undefined,
          description: description || undefined,
          rsvp: (rsvp || "").trim() || undefined,
          numberOfGuests: numberOfGuests || 0,
          allDay: fullDay || undefined,
          registries:
            sanitizedRegistries.length > 0 ? sanitizedRegistries : undefined,
          // Template customization data
          templateId: template.id,
          variationId: resolvedVariation.id,
          eventTitle: eventTitle || undefined,
          customTitles:
            Object.keys(customTitles).length > 0 ? customTitles : undefined,
          sectionNotes:
            Object.keys(sectionNotes).length > 0 ? sectionNotes : undefined,
          customHeroImage: customHeroImage?.dataUrl || undefined,
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
    eventTitle,
    venue,
    streetAddress,
    city,
    state,
    description,
    rsvp,
    numberOfGuests,
    registries,
    template.id,
    resolvedVariation.id,
    customTitles,
    sectionNotes,
    customHeroImage,
    editEventId,
    router,
  ]);

  return (
    <main className={`${poppins.className} ${baloo.variable} bg-[#FAFAFA]`}>
      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 py-10 sm:px-6 lg:px-10">
        {/* Header Section */}
        <div className="rounded-[40px] bg-gradient-to-br from-[#F5E8FF] via-[#E8F5F0] to-[#FFE8F5] p-8 shadow-2xl">
          <div className="space-y-4 text-[#2F2F2F]">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#9B7ED9]">
              Customize your baby shower invite
            </p>
            <h1
              style={{ fontFamily: "var(--font-baloo)" }}
              className="text-3xl leading-tight sm:text-4xl"
            >
              {template.name}
            </h1>
            <p className="text-base text-[#4A403C]">{template.description}</p>
          </div>
        </div>

        <section className="flex flex-col gap-8 lg:flex-row">
          <div className="flex-1 space-y-6">
            <article className={styles.templateCard}>
              <div className={styles.cardBody}>
                <div className={styles.previewFrame}>
                  <div
                    className={styles.previewHeader}
                    style={{
                      background: resolvedVariation.background,
                      position: "relative",
                      color: resolvedVariation.titleColor,
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        backgroundImage: `url(${backgroundImageSrc})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        backgroundRepeat: "no-repeat",
                        opacity: 0.4,
                        zIndex: 0,
                        pointerEvents: "none",
                      }}
                    />
                    <div style={{ position: "relative", zIndex: 1 }}>
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
                        {previewName}
                      </p>
                      <p
                        className={styles.previewMeta}
                        style={{ color: resolvedVariation.titleColor }}
                      >
                        {previewDateLabel}
                        {previewTime ? ` • ${previewTime}` : ""}
                      </p>
                      <div
                        className={styles.previewNav}
                        style={{ color: resolvedVariation.titleColor }}
                      >
                        {template.menu.map((item) => (
                          <span key={item} className={styles.previewNavItem}>
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className={`${styles.previewPhoto} relative`}>
                    {(customHeroImage?.previewUrl || heroImageSrc).startsWith(
                      "data:"
                    ) ? (
                      <img
                        src={customHeroImage?.previewUrl || heroImageSrc}
                        alt={`${template.name} preview`}
                        className={styles.previewPhotoImage}
                      />
                    ) : (
                      <Image
                        src={customHeroImage?.previewUrl || heroImageSrc}
                        alt={`${template.name} preview`}
                        width={640}
                        height={360}
                        className={styles.previewPhotoImage}
                        priority={false}
                      />
                    )}
                    {/* Image upload overlay */}
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute bottom-3 right-3 flex items-center gap-2 pointer-events-auto">
                        <input
                          ref={heroImageInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleHeroImageChange}
                          className="hidden"
                          id="hero-image-upload"
                        />
                        <label
                          htmlFor="hero-image-upload"
                          className="cursor-pointer bg-white/90 hover:bg-white text-stone-700 rounded-full p-2.5 shadow-lg transition-all hover:scale-110"
                          title="Change image"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            className="h-5 w-5"
                            strokeWidth="2"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </label>
                        {customHeroImage && (
                          <button
                            type="button"
                            onClick={removeHeroImage}
                            className="bg-white/90 hover:bg-white text-red-600 rounded-full p-2.5 shadow-lg transition-all hover:scale-110"
                            title="Remove image"
                            aria-label="Remove custom image"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              className="h-5 w-5"
                              strokeWidth="2"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Event Fields Section */}
                <div className="mt-6 rounded-2xl border border-[#F1E5FF] bg-white/95 p-6 shadow-sm">
                  <h2
                    style={{ fontFamily: "var(--font-baloo)" }}
                    className="text-xl font-semibold text-[#2F2F2F] mb-4"
                  >
                    Event Details
                  </h2>
                  <div className="space-y-4">
                    {/* Venue */}
                    <div>
                      <label className="block text-sm font-medium text-[#4A403C] mb-1">
                        Venue
                      </label>
                      <input
                        type="text"
                        value={venue}
                        onChange={(e) => setVenue(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-[#E8D5FF] text-sm focus:border-[#9B7ED9] focus:outline-none bg-white"
                        placeholder="Venue name (optional)"
                      />
                    </div>

                    {/* Address */}
                    <div>
                      <label className="block text-sm font-medium text-[#4A403C] mb-1">
                        Address
                      </label>
                      <input
                        type="text"
                        value={streetAddress}
                        onChange={(e) => setStreetAddress(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-[#E8D5FF] text-sm focus:border-[#9B7ED9] focus:outline-none mb-2 bg-white"
                        placeholder="Street address"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-[#E8D5FF] text-sm focus:border-[#9B7ED9] focus:outline-none bg-white"
                          placeholder="City"
                        />
                        <input
                          type="text"
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-[#E8D5FF] text-sm focus:border-[#9B7ED9] focus:outline-none bg-white"
                          placeholder="State"
                        />
                      </div>
                    </div>

                    {/* Guests */}
                    <div>
                      <label className="block text-sm font-medium text-[#4A403C] mb-1">
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
                        className="w-full px-3 py-2 rounded-lg border border-[#E8D5FF] text-sm focus:border-[#9B7ED9] focus:outline-none bg-white"
                        placeholder="Enter number of guests"
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-[#4A403C] mb-1">
                        Description
                      </label>
                      <textarea
                        ref={descriptionRef}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 rounded-lg border border-[#E8D5FF] text-sm focus:border-[#9B7ED9] focus:outline-none resize-none bg-white"
                        placeholder="Add details for your guests"
                      />
                    </div>

                    {/* RSVP */}
                    <div>
                      <label className="block text-sm font-medium text-[#4A403C] mb-1">
                        RSVP
                      </label>
                      <input
                        type="text"
                        value={rsvp}
                        onChange={(e) => setRsvp(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-[#E8D5FF] text-sm focus:border-[#9B7ED9] focus:outline-none bg-white"
                        placeholder="Phone number or email for RSVP"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </article>
          </div>
          <div className="w-full max-w-md flex flex-col rounded-2xl border border-[#F1E5FF] bg-white/95 p-6 shadow-md">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#9B7ED9]">
                Customize
              </p>
              <h2
                style={{ fontFamily: "var(--font-baloo)" }}
                className="text-2xl font-semibold text-[#2F2F2F]"
              >
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
                      className="text-sm font-semibold text-[#4A403C]"
                      onClick={handleBack}
                    >
                      ← Back
                    </button>
                    <div className="flex items-center gap-2">
                      {editingTitle === activeSection ? (
                        <input
                          value={renameDraft}
                          onChange={(event) =>
                            setRenameDraft(event.target.value)
                          }
                          onBlur={saveTitle}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              saveTitle();
                            }
                          }}
                          className="border-b border-[#9B7ED9] text-sm uppercase tracking-[0.3em] px-2 py-1 text-[#2F2F2F]"
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
                          className="text-xs uppercase tracking-[0.3em] text-[#9B7ED9]"
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
              className="mt-5 w-full rounded-full bg-[#9B7ED9] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#9B7ED9]/40 transition hover:scale-[1.01]"
            >
              Review
            </button>
          </div>
        </section>
      </div>

      {/* Review/Preview Modal */}
      {showReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-[#F1E5FF] px-6 py-4 flex items-center justify-between z-10">
              <h2
                style={{ fontFamily: "var(--font-baloo)" }}
                className="text-2xl font-semibold text-[#2F2F2F]"
              >
                Review Your Event
              </h2>
              <button
                type="button"
                onClick={() => setShowReview(false)}
                className="text-[#9B7ED9] hover:text-[#7B5FA3]"
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
                          background: `${resolvedVariation.background}, url(${backgroundImageSrc})`,
                          backgroundSize: "cover, cover",
                          backgroundPosition: "center, center",
                          backgroundRepeat: "no-repeat, no-repeat",
                          backgroundBlendMode: "normal, normal",
                        }}
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
                          {previewName}
                        </p>
                        <p
                          className={styles.previewMeta}
                          style={{ color: resolvedVariation.titleColor }}
                        >
                          {previewDateLabel}
                          {previewTime ? ` • ${previewTime}` : ""}
                        </p>
                        <div
                          className={styles.previewNav}
                          style={{ color: resolvedVariation.titleColor }}
                        >
                          {template.menu.map((item) => (
                            <span key={item} className={styles.previewNavItem}>
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className={styles.previewPhoto}>
                        {(
                          customHeroImage?.previewUrl || heroImageSrc
                        ).startsWith("data:") ? (
                          <img
                            src={customHeroImage?.previewUrl || heroImageSrc}
                            alt={`${template.name} preview`}
                            className={styles.previewPhotoImage}
                          />
                        ) : (
                          <Image
                            src={customHeroImage?.previewUrl || heroImageSrc}
                            alt={`${template.name} preview`}
                            width={640}
                            height={360}
                            className={styles.previewPhotoImage}
                            priority={false}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Event Details */}
              <div className="rounded-2xl border border-[#F1E5FF] bg-white p-6">
                <h3
                  style={{ fontFamily: "var(--font-baloo)" }}
                  className="text-lg font-semibold text-[#2F2F2F] mb-4"
                >
                  Event Details
                </h3>
                <div className="space-y-4">
                  {(venue || streetAddress || city || state) && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#9B7ED9] mb-1">
                        Location
                      </p>
                      <p className="text-base text-[#2F2F2F]">
                        {venue && <span className="font-medium">{venue}</span>}
                        {venue && (streetAddress || city || state) && (
                          <span>, </span>
                        )}
                        {[streetAddress, city, state]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    </div>
                  )}

                  {numberOfGuests > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#9B7ED9] mb-1">
                        Guests
                      </p>
                      <p className="text-base text-[#2F2F2F]">
                        {numberOfGuests}
                      </p>
                    </div>
                  )}

                  {description && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#9B7ED9] mb-1">
                        Description
                      </p>
                      <p className="text-base text-[#2F2F2F] whitespace-pre-wrap">
                        {description}
                      </p>
                    </div>
                  )}

                  {rsvp && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#9B7ED9] mb-1">
                        RSVP
                      </p>
                      <p className="text-base text-[#2F2F2F]">{rsvp}</p>
                    </div>
                  )}

                  {registries.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#9B7ED9] mb-2">
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
                              <span className="text-sm text-[#4A403C]">
                                {registry.label || "Registry"}
                              </span>
                              <a
                                href={registry.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-[#9B7ED9] hover:underline"
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
            <div className="sticky bottom-0 bg-white border-t border-[#F1E5FF] px-6 py-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowReview(false)}
                className="px-4 py-2 text-sm font-medium text-[#4A403C] bg-white border border-[#E8D5FF] rounded-full hover:bg-[#F5E8FF]"
              >
                Back to Edit
              </button>
              <button
                type="button"
                onClick={handlePublish}
                disabled={submitting}
                className="px-6 py-2 text-sm font-semibold text-white bg-[#9B7ED9] rounded-full shadow-lg shadow-[#9B7ED9]/40 hover:scale-[1.01] disabled:opacity-60 disabled:cursor-not-allowed transition"
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
