"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import RegistryLinksEditor, {
  RegistryFormEntry,
} from "@/components/RegistryLinksEditor";
import {
  MAX_REGISTRY_LINKS,
  normalizeRegistryLinks,
  validateRegistryUrl,
} from "@/utils/registry-links";
import { createThumbnailDataUrl, readFileAsDataUrl } from "@/utils/thumbnail";

interface EventEditModalProps {
  eventId: string;
  eventData: any;
  eventTitle: string;
}

const createRegistryFormEntry = (): RegistryFormEntry => ({
  key: `registry-${Math.random().toString(36).slice(2, 10)}`,
  label: "",
  url: "",
  error: null,
  detectedLabel: null,
});

const createRegistryEntryFromLink = (
  label: string,
  url: string
): RegistryFormEntry => {
  const trimmedLabel = (label || "").slice(0, 60);
  const validation = validateRegistryUrl(url);
  const detectedLabel =
    validation.ok && validation.brand ? validation.brand.defaultLabel : null;
  const effectiveLabel = trimmedLabel.trim()
    ? trimmedLabel.trim()
    : detectedLabel || trimmedLabel;
  return {
    key: `registry-${Math.random().toString(36).slice(2, 10)}`,
    label: effectiveLabel || "",
    url,
    error: validation.ok ? null : validation.error || null,
    detectedLabel,
  };
};

const REGISTRY_CATEGORY_KEYS = new Set([
  "birthdays",
  "weddings",
  "baby showers",
]);

export default function EventEditModal({
  eventId,
  eventData,
  eventTitle,
}: EventEditModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: eventTitle,
    start: eventData?.start || "",
    end: eventData?.end || "",
    venue: eventData?.venue || "",
    location: eventData?.location || "",
    description: eventData?.description || "",
    category: eventData?.category || "",
    recurrence: eventData?.recurrence || "",
    rsvp: eventData?.rsvp || "",
  });
  const buildInitialRegistries = useCallback((): RegistryFormEntry[] => {
    if (!Array.isArray(eventData?.registries)) return [];
    const base = normalizeRegistryLinks(
      (eventData.registries as any[]).map((item: any) => ({
        label: typeof item?.label === "string" ? item.label : "",
        url: typeof item?.url === "string" ? item.url : "",
      }))
    );
    return base.map((link) => createRegistryEntryFromLink(link.label, link.url));
  }, [eventData]);
  const [registryEntries, setRegistryEntries] = useState<RegistryFormEntry[]>(
    buildInitialRegistries
  );
  const { data: session } = useSession();
  const router = useRouter();
  const descriptionRef = useRef<HTMLTextAreaElement | null>(null);
  const initialAttachment = useMemo(() => {
    const raw = eventData?.attachment;
    if (
      raw &&
      typeof raw === "object" &&
      typeof raw.name === "string" &&
      typeof raw.type === "string" &&
      typeof raw.dataUrl === "string"
    ) {
      return {
        name: raw.name,
        type: raw.type,
        dataUrl: raw.dataUrl,
      } as {
        name: string;
        type: string;
        dataUrl: string;
      };
    }
    return null;
  }, [eventData?.attachment]);
  const initialPreview = useMemo(() => {
    if (initialAttachment?.type.startsWith("image/")) {
      if (typeof eventData?.thumbnail === "string") return eventData.thumbnail;
      return initialAttachment.dataUrl;
    }
    return null;
  }, [initialAttachment, eventData?.thumbnail]);
  const [attachment, setAttachment] = useState(initialAttachment);
  const [attachmentPreviewUrl, setAttachmentPreviewUrl] = useState<string | null>(
    initialPreview
  );
  const [attachmentDirty, setAttachmentDirty] = useState(false);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const flyerInputRef = useRef<HTMLInputElement | null>(null);

  const addRegistryLink = () => {
    setRegistryEntries((prev) => {
      if (prev.length >= MAX_REGISTRY_LINKS) return prev;
      return [...prev, createRegistryFormEntry()];
    });
  };

  const removeRegistryLink = (key: string) => {
    setRegistryEntries((prev) => prev.filter((entry) => entry.key !== key));
  };

  const handleRegistryFieldChange = (
    key: string,
    field: "label" | "url",
    value: string
  ) => {
    const trimmed = field === "label" ? value.slice(0, 60) : value;
    setRegistryEntries((prev) =>
      prev.map((entry) => {
        if (entry.key !== key) return entry;
        const next: RegistryFormEntry = {
          ...entry,
          [field]: trimmed,
        };
        if (field === "url") {
          if (!trimmed.trim()) {
            next.error = null;
            next.detectedLabel = null;
          } else {
            const validation = validateRegistryUrl(trimmed);
            next.error = validation.ok ? null : validation.error || null;
            next.detectedLabel =
              validation.ok && validation.brand
                ? validation.brand.defaultLabel
                : null;
            if (
              validation.ok &&
              validation.brand &&
              (!entry.label || !entry.label.trim())
            ) {
              next.label = validation.brand.defaultLabel;
            }
          }
        }
        if (field === "label" && !trimmed.trim() && entry.detectedLabel) {
          next.label = "";
        }
        return next;
      })
    );
  };

  const handleFlyerChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0] || null;
    if (!file) {
      setAttachment(null);
      setAttachmentPreviewUrl(null);
      setAttachmentDirty(true);
      setAttachmentError(null);
      return;
    }
    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf";
    if (!isImage && !isPdf) {
      setAttachmentError("Upload an image or PDF file");
      event.target.value = "";
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setAttachmentError("File must be 10 MB or smaller");
      event.target.value = "";
      return;
    }
    setAttachmentError(null);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      let previewUrl: string | null = null;
      if (isImage) {
        previewUrl = (await createThumbnailDataUrl(file, 1200, 0.85)) || null;
      }
      setAttachment({ name: file.name, type: file.type, dataUrl });
      setAttachmentPreviewUrl(previewUrl);
      setAttachmentDirty(true);
    } catch {
      setAttachmentError("Could not process the file");
      setAttachment(null);
      setAttachmentPreviewUrl(null);
      event.target.value = "";
    }
  };

  const clearFlyer = () => {
    setAttachment(null);
    setAttachmentPreviewUrl(null);
    setAttachmentDirty(true);
    setAttachmentError(null);
    if (flyerInputRef.current) flyerInputRef.current.value = "";
  };

  useEffect(() => {
    const el = descriptionRef.current;
    if (!el) return;
    // Auto-size description to fit content
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [isOpen, formData.description]);

  useEffect(() => {
    if (!isOpen) return;
    setRegistryEntries(buildInitialRegistries());
    setAttachment(initialAttachment);
    setAttachmentPreviewUrl(initialPreview);
    setAttachmentDirty(false);
    setAttachmentError(null);
    if (flyerInputRef.current) flyerInputRef.current.value = "";
  }, [isOpen, buildInitialRegistries, initialAttachment, initialPreview]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;

    const invalidRegistries = registryEntries.filter((entry) => {
      const trimmedUrl = entry.url.trim();
      if (!trimmedUrl) return false;
      return !validateRegistryUrl(trimmedUrl).ok;
    });
    if (invalidRegistries.length > 0) {
      setRegistryEntries((prev) =>
        prev.map((entry) => {
          const trimmedUrl = entry.url.trim();
          if (!trimmedUrl) {
            return { ...entry, error: null };
          }
          const validation = validateRegistryUrl(trimmedUrl);
          return {
            ...entry,
            error: validation.ok ? null : validation.error || "Enter a valid https:// link",
            detectedLabel:
              validation.ok && validation.brand
                ? validation.brand.defaultLabel
                : entry.detectedLabel,
          };
        })
      );
      alert("Fix the highlighted registry links before saving.");
      return;
    }

    const normalizedCategoryForSubmit = (formData.category || "").toLowerCase();
    const allowsRegistriesForSubmit =
      REGISTRY_CATEGORY_KEYS.has(normalizedCategoryForSubmit);
    const sanitizedRegistries = allowsRegistriesForSubmit
      ? normalizeRegistryLinks(
          registryEntries.map((entry) => ({
            label: entry.label,
            url: entry.url,
          }))
        )
      : [];
    const previousRegistries = normalizeRegistryLinks(
      Array.isArray(eventData?.registries)
        ? (eventData.registries as any[]).map((item: any) => ({
            label: typeof item?.label === "string" ? item.label : "",
            url: typeof item?.url === "string" ? item.url : "",
          }))
        : []
    );

    setIsLoading(true);
    try {
      // Update title
      if (formData.title !== eventTitle) {
        await fetch(`/api/history/${eventId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: formData.title }),
        });
      }

      // Update other data fields
      const dataUpdate: any = {};
      if (formData.start !== eventData?.start)
        dataUpdate.start = formData.start;
      if (formData.end !== eventData?.end) dataUpdate.end = formData.end;
      if (formData.venue !== eventData?.venue)
        dataUpdate.venue = formData.venue;
      if (formData.location !== eventData?.location)
        dataUpdate.location = formData.location;
      if (formData.description !== eventData?.description)
        dataUpdate.description = formData.description;
      if (formData.category !== eventData?.category)
        dataUpdate.category = formData.category;
      if (formData.recurrence !== eventData?.recurrence)
        dataUpdate.recurrence = formData.recurrence || null;
      const nextRsvp = trimmedRsvp ? trimmedRsvp : null;
      const prevRsvp = eventData?.rsvp ? String(eventData.rsvp).trim() : null;
      if (nextRsvp !== prevRsvp) dataUpdate.rsvp = nextRsvp;
      const registriesChanged = (() => {
        if (sanitizedRegistries.length !== previousRegistries.length) return true;
        return (
          JSON.stringify(sanitizedRegistries) !==
          JSON.stringify(previousRegistries)
        );
      })();
      if (registriesChanged) {
        dataUpdate.registries = sanitizedRegistries.length
          ? sanitizedRegistries
          : null;
      }
      if (attachmentDirty) {
        dataUpdate.attachment = attachment
          ? {
              name: attachment.name,
              type: attachment.type,
              dataUrl: attachment.dataUrl,
            }
          : null;
        dataUpdate.thumbnail = attachment?.type.startsWith("image/")
          ? attachmentPreviewUrl || attachment?.dataUrl || null
          : null;
      }

      if (Object.keys(dataUpdate).length > 0) {
        await fetch(`/api/history/${eventId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: dataUpdate }),
        });
      }

      setIsOpen(false);
      router.refresh(); // Refresh the page to show updated data
    } catch (error) {
      console.error("Failed to update event:", error);
      alert("Failed to update event. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const trimmedRsvp = formData.rsvp.trim();
  const normalizedCategory = (formData.category || "").toLowerCase();
  const isRegistryCategory = REGISTRY_CATEGORY_KEYS.has(normalizedCategory);
  const allowsRegistrySection = isRegistryCategory;
  const showRsvpField =
    isRegistryCategory ||
    normalizedCategory.includes("birthday") ||
    normalizedCategory.includes("wedding") ||
    normalizedCategory.includes("baby shower") ||
    Boolean(trimmedRsvp);

  if (!session) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-foreground/70 hover:text-foreground hover:bg-surface transition-colors"
        title="Edit event"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
        >
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
        <span className="hidden sm:inline">Edit</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background border border-border rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Edit Event</h2>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="text-foreground/50 hover:text-foreground"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="title"
                    className="block text-sm font-medium text-foreground/80 mb-1"
                  >
                    Title
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="start"
                      className="block text-sm font-medium text-foreground/80 mb-1"
                    >
                      Start
                    </label>
                    <input
                      type="datetime-local"
                      id="start"
                      name="start"
                      value={
                        formData.start
                          ? new Date(formData.start).toISOString().slice(0, 16)
                          : ""
                      }
                      onChange={(e) => {
                        const value = e.target.value
                          ? new Date(e.target.value).toISOString()
                          : "";
                        setFormData((prev) => ({ ...prev, start: value }));
                      }}
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="end"
                      className="block text-sm font-medium text-foreground/80 mb-1"
                    >
                      End
                    </label>
                    <input
                      type="datetime-local"
                      id="end"
                      name="end"
                      value={
                        formData.end
                          ? new Date(formData.end).toISOString().slice(0, 16)
                          : ""
                      }
                      onChange={(e) => {
                        const value = e.target.value
                          ? new Date(e.target.value).toISOString()
                          : "";
                        setFormData((prev) => ({ ...prev, end: value }));
                      }}
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="venue"
                    className="block text-sm font-medium text-foreground/80 mb-1"
                  >
                    Venue
                  </label>
                  <input
                    type="text"
                    id="venue"
                    name="venue"
                    value={formData.venue}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="location"
                    className="block text-sm font-medium text-foreground/80 mb-1"
                  >
                    Location
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="category"
                    className="block text-sm font-medium text-foreground/80 mb-1"
                  >
                    Category
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select category</option>
                    <option value="Birthdays">Birthdays</option>
                    <option value="Weddings">Weddings</option>
                    <option value="Baby Showers">Baby Showers</option>
                    <option value="Meetings">Meetings</option>
                    <option value="Appointments">Appointments</option>
                    <option value="Social">Social</option>
                    <option value="Work">Work</option>
                    <option value="Sports">Sports</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {allowsRegistrySection && (
                  <RegistryLinksEditor
                    entries={registryEntries}
                    onAdd={addRegistryLink}
                    onRemove={removeRegistryLink}
                    onChange={handleRegistryFieldChange}
                    maxLinks={MAX_REGISTRY_LINKS}
                  />
                )}

                {showRsvpField && (
                  <div>
                    <label
                      htmlFor="rsvp"
                      className="block text-sm font-medium text-foreground/80 mb-1"
                    >
                      RSVP
                    </label>
                    <textarea
                      id="rsvp"
                      name="rsvp"
                      value={formData.rsvp}
                      onChange={handleInputChange}
                      rows={1}
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                <div>
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-foreground/80 mb-1"
                  >
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={(e) => {
                      handleInputChange(e);
                      const el = descriptionRef.current;
                      if (el) {
                        el.style.height = "auto";
                        el.style.height = `${el.scrollHeight}px`;
                      }
                    }}
                    ref={descriptionRef}
                    rows={3}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ overflow: "hidden" }}
                  />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span>Upload a file (optional)</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => flyerInputRef.current?.click()}
                        className="inline-flex items-center rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground/80 hover:bg-surface"
                      >
                        {attachment ? "Replace file" : "Upload file"}
                      </button>
                      {attachment && (
                        <button
                          type="button"
                          onClick={clearFlyer}
                          className="text-xs font-medium text-foreground/70 hover:text-foreground"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    id="edit-flyer"
                    ref={flyerInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFlyerChange}
                    className="hidden"
                  />
                  {attachmentError && (
                    <p className="mt-2 text-xs text-red-600">{attachmentError}</p>
                  )}
                  {attachment && (
                    <div className="mt-2 flex items-center gap-3 text-xs text-foreground/80">
                      {attachmentPreviewUrl ? (
                        <img
                          src={attachmentPreviewUrl}
                          alt={attachment.name}
                          className="h-16 w-16 rounded border border-border object-cover"
                        />
                      ) : (
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border text-foreground/70">
                          📄
                        </span>
                      )}
                      <span className="truncate" title={attachment.name}>
                        {attachment.name}
                      </span>
                    </div>
                  )}
                  {!attachment && !attachmentError && (
                    <p className="mt-2 text-xs text-foreground/60">
                      Images or PDFs up to 10 MB.
                    </p>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 text-sm text-foreground/70 hover:text-foreground border border-border rounded-md hover:bg-surface transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 text-sm rounded-md bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white shadow transition hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isLoading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
