"use client";

import Image from "next/image";
import {
  useMemo,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ChangeEvent,
  type ReactNode,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "@/components/event-create/TemplateGallery.module.css";
import {
  DEFAULT_PREVIEW,
  resolveTemplateVariation,
  type ResolvedTemplateVariation,
} from "@/components/event-create/TemplateGallery";
import {
  type WeddingTemplateDefinition,
  weddingTemplateCatalog,
} from "@/components/event-create/WeddingTemplateGallery";
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

function getTemplateById(id?: string | null): WeddingTemplateDefinition {
  if (!id) return weddingTemplateCatalog[0];
  return (
    weddingTemplateCatalog.find((template) => template.id === id) ??
    weddingTemplateCatalog[0]
  );
}

const infoSections = [
  {
    key: "headline",
    label: "Headline",
    description:
      "Set your names, event date, and city/state for the hero header.",
  },
  {
    key: "design",
    label: "Design",
    description:
      "Pick a color story that picks the palette for the hero preview.",
  },
  {
    key: "our-story",
    label: "Our Story",
    description:
      "Tell the story of how you met, what you love about each other, and why this day is special.",
  },
  {
    key: "photos",
    label: "Photos",
    description:
      "Upload up to five gallery photos. Landscape-oriented shots keep the layout tidy.",
  },
  {
    key: "wedding-party",
    label: "Wedding Party",
    description:
      "Introduce the people standing with you-names, roles, and a short note about their connection.",
  },
  {
    key: "travel",
    label: "Travel",
    description:
      "Share arrival guidance, airport tips, shuttles, and parking info so guests travel with confidence.",
  },
  {
    key: "things-to-do",
    label: "Things To Do",
    description:
      "Highlight nearby activities, restaurants, or guided experiences that pair well with your weekend.",
  },
  {
    key: "registry",
    label: "Registry",
    description:
      "Drop your registry links here. We'll feature them on a dedicated page once the site is live.",
  },
];

type TravelEntry = {
  id: string;
  name: string;
  detail: string;
  link?: string;
};

type TravelDirection = {
  id: string;
  title: string;
  instructions: string;
};

type ActivityItem = {
  id: string;
  title: string;
  description: string;
};

type PartyMember = {
  name: string;
  id: string;
  role: string;
  bio: string;
};

type StoryEntry = {
  id: string;
  title: string;
  text: string;
  photoUrl: string | null;
};

export default function WeddingTemplateCustomizePage() {
  const search = useSearchParams();
  const router = useRouter();

  const templateId = search?.get("templateId") ?? weddingTemplateCatalog[0].id;
  const defaultDate = search?.get("d") ?? undefined;

  const template = useMemo(() => getTemplateById(templateId), [templateId]);
  const variationParam = search?.get("variationId") ?? "";
  const firstVariationId = template.variations[0]?.id ?? "";
  const [selectedVariationId, setSelectedVariationId] = useState(
    variationParam || firstVariationId
  );
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [sectionNotes, setSectionNotes] = useState<Record<string, string>>({});
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
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
  const [travelHotels, setTravelHotels] = useState<TravelEntry[]>([]);
  const [travelAirports, setTravelAirports] = useState<TravelEntry[]>([]);
  const [travelDirections, setTravelDirections] = useState<TravelDirection[]>(
    []
  );
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [partyMembers, setPartyMembers] = useState<PartyMember[]>([]);
  const [storyEntries, setStoryEntries] = useState<StoryEntry[]>([]);
  const storyEntriesRef = useRef<StoryEntry[]>([]);
  useEffect(() => {
    storyEntriesRef.current = storyEntries;
  }, [storyEntries]);
  useEffect(() => {
    return () => {
      storyEntriesRef.current.forEach((entry) => {
        if (entry.photoUrl) {
          URL.revokeObjectURL(entry.photoUrl);
        }
      });
    };
  }, []);
  const addStoryEntry = () => {
    setStoryEntries((prev) => [
      ...prev,
      { id: generateId(), title: "", text: "", photoUrl: null },
    ]);
  };
  const removeStoryEntry = (entryId: string) => {
    setStoryEntries((prev) => {
      const target = prev.find((entry) => entry.id === entryId);
      if (target?.photoUrl) {
        URL.revokeObjectURL(target.photoUrl);
      }
      return prev.filter((entry) => entry.id !== entryId);
    });
  };
  const handleStoryPhotoChange = (
    entryId: string,
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setStoryEntries((prev) =>
      prev.map((entry) => {
        if (entry.id !== entryId) return entry;
        if (entry.photoUrl) {
          URL.revokeObjectURL(entry.photoUrl);
        }
        return { ...entry, photoUrl: url };
      })
    );
    event.target.value = "";
  };
  const clearStoryPhoto = (entryId: string) => {
    setStoryEntries((prev) =>
      prev.map((entry) => {
        if (entry.id !== entryId) return entry;
        if (entry.photoUrl) {
          URL.revokeObjectURL(entry.photoUrl);
        }
        return { ...entry, photoUrl: null };
      })
    );
  };
  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    setPhotoFiles(files.slice(0, 5));
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
            Partner one
            <input
              type="text"
              value={partnerOne}
              onChange={(e) => setPartnerOne(e.target.value)}
              className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-stone-400 focus:outline-none"
              placeholder="First partner name"
            />
          </label>
          <label className="block text-sm font-medium text-stone-700">
            Partner two
            <input
              type="text"
              value={partnerTwo}
              onChange={(e) => setPartnerTwo(e.target.value)}
              className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-stone-400 focus:outline-none"
              placeholder="Second partner name"
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
    if (sectionKey === "travel") {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <TileButton
              icon={tileIcons.hotel}
              label="Add hotel"
              onClick={() =>
                setTravelHotels((prev) => [
                  ...prev,
                  { id: generateId(), name: "", detail: "", link: "" },
                ])
              }
            />
            <TileButton
              icon={tileIcons.airport}
              label="Add airport"
              onClick={() =>
                setTravelAirports((prev) => [
                  ...prev,
                  { id: generateId(), name: "", detail: "", link: "" },
                ])
              }
            />
            <TileButton
              icon={tileIcons.directions}
              label="Add directions"
              onClick={() =>
                setTravelDirections((prev) => [
                  ...prev,
                  { id: generateId(), title: "", instructions: "" },
                ])
              }
            />
          </div>
          {travelHotels.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-400">
                Hotels
              </p>
              {travelHotels.map((hotel) => (
                <div
                  key={hotel.id}
                  className="rounded-2xl border border-stone-200 bg-white/80 p-4 shadow-sm"
                >
                  <input
                    type="text"
                    placeholder="Hotel name"
                    value={hotel.name}
                    onChange={(event) =>
                      setTravelHotels((prev) =>
                        prev.map((entry) =>
                          entry.id === hotel.id
                            ? { ...entry, name: event.target.value }
                            : entry
                        )
                      )
                    }
                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-stone-400 focus:outline-none"
                  />
                  <textarea
                    placeholder="Booking link, code, or walking instructions"
                    value={hotel.detail}
                    onChange={(event) =>
                      setTravelHotels((prev) =>
                        prev.map((entry) =>
                          entry.id === hotel.id
                            ? { ...entry, detail: event.target.value }
                            : entry
                        )
                      )
                    }
                    rows={2}
                    className="mt-2 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-stone-400 focus:outline-none"
                  />
                  <input
                    type="url"
                    placeholder="Link (optional)"
                    value={hotel.link ?? ""}
                    onChange={(event) =>
                      setTravelHotels((prev) =>
                        prev.map((entry) =>
                          entry.id === hotel.id
                            ? { ...entry, link: event.target.value }
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
                      setTravelHotels((prev) =>
                        prev.filter((entry) => entry.id !== hotel.id)
                      )
                    }
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
          {travelAirports.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-400">
                Airports
              </p>
              {travelAirports.map((airport) => (
                <div
                  key={airport.id}
                  className="rounded-2xl border border-stone-200 bg-white/80 p-4 shadow-sm"
                >
                  <input
                    type="text"
                    placeholder="Airport name or code"
                    value={airport.name}
                    onChange={(event) =>
                      setTravelAirports((prev) =>
                        prev.map((entry) =>
                          entry.id === airport.id
                            ? { ...entry, name: event.target.value }
                            : entry
                        )
                      )
                    }
                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-stone-400 focus:outline-none"
                  />
                  <textarea
                    placeholder="Recommended routes or airlines"
                    value={airport.detail}
                    onChange={(event) =>
                      setTravelAirports((prev) =>
                        prev.map((entry) =>
                          entry.id === airport.id
                            ? { ...entry, detail: event.target.value }
                            : entry
                        )
                      )
                    }
                    rows={2}
                    className="mt-2 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-stone-400 focus:outline-none"
                  />
                  <input
                    type="url"
                    placeholder="Airport site (optional)"
                    value={airport.link ?? ""}
                    onChange={(event) =>
                      setTravelAirports((prev) =>
                        prev.map((entry) =>
                          entry.id === airport.id
                            ? { ...entry, link: event.target.value }
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
                      setTravelAirports((prev) =>
                        prev.filter((entry) => entry.id !== airport.id)
                      )
                    }
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
          {travelDirections.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-400">
                Directions & transit
              </p>
              {travelDirections.map((direction) => (
                <div
                  key={direction.id}
                  className="rounded-2xl border border-stone-200 bg-white/80 p-4 shadow-sm"
                >
                  <input
                    type="text"
                    placeholder="Shuttle name or driving route"
                    value={direction.title}
                    onChange={(event) =>
                      setTravelDirections((prev) =>
                        prev.map((entry) =>
                          entry.id === direction.id
                            ? { ...entry, title: event.target.value }
                            : entry
                        )
                      )
                    }
                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-stone-400 focus:outline-none"
                  />
                  <textarea
                    placeholder="Pickup times, ride-share notes, parking passes"
                    value={direction.instructions}
                    onChange={(event) =>
                      setTravelDirections((prev) =>
                        prev.map((entry) =>
                          entry.id === direction.id
                            ? { ...entry, instructions: event.target.value }
                            : entry
                        )
                      )
                    }
                    rows={2}
                    className="mt-2 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-stone-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    className="mt-3 text-xs font-semibold uppercase tracking-[0.3em] text-stone-500"
                    onClick={() =>
                      setTravelDirections((prev) =>
                        prev.filter((entry) => entry.id !== direction.id)
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
    if (sectionKey === "things-to-do") {
      return (
        <div className="space-y-4">
          <TileButton
            icon={tileIcons.highlight}
            label="Add highlight"
            onClick={() =>
              setActivities((prev) => [
                ...prev,
                { id: generateId(), title: "", description: "" },
              ])
            }
          />
          {activities.length > 0 && (
            <div className="space-y-2">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="rounded-2xl border border-stone-200 bg-white/80 p-4 shadow-sm"
                >
                  <input
                    type="text"
                    placeholder="Activity title"
                    value={activity.title}
                    onChange={(event) =>
                      setActivities((prev) =>
                        prev.map((entry) =>
                          entry.id === activity.id
                            ? { ...entry, title: event.target.value }
                            : entry
                        )
                      )
                    }
                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-stone-400 focus:outline-none"
                  />
                  <textarea
                    placeholder="Why you love it, distance, reservations"
                    value={activity.description}
                    onChange={(event) =>
                      setActivities((prev) =>
                        prev.map((entry) =>
                          entry.id === activity.id
                            ? { ...entry, description: event.target.value }
                            : entry
                        )
                      )
                    }
                    rows={2}
                    className="mt-2 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-stone-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    className="mt-3 text-xs font-semibold uppercase tracking-[0.3em] text-stone-500"
                    onClick={() =>
                      setActivities((prev) =>
                        prev.filter((entry) => entry.id !== activity.id)
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
    if (sectionKey === "our-story") {
      return (
        <div className="space-y-4">
          <TileButton
            icon={tileIcons.story}
            label="Add story"
            onClick={addStoryEntry}
          />
          {storyEntries.length > 0 && (
            <div className="space-y-3">
              {storyEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-2xl border border-stone-200 bg-white/80 p-4 shadow-sm"
                >
                  <label className="block text-sm font-medium text-stone-700">
                    Story title
                    <input
                      type="text"
                      value={entry.title}
                      onChange={(event) =>
                        setStoryEntries((prev) =>
                          prev.map((story) =>
                            story.id === entry.id
                              ? { ...story, title: event.target.value }
                              : story
                          )
                        )
                      }
                      className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-stone-400 focus:outline-none"
                      placeholder="From swipe right to 'I do'"
                    />
                  </label>
                  <label className="mt-3 block text-sm font-medium text-stone-700">
                    Story text
                    <textarea
                      rows={4}
                      value={entry.text}
                      onChange={(event) =>
                        setStoryEntries((prev) =>
                          prev.map((story) =>
                            story.id === entry.id
                              ? { ...story, text: event.target.value }
                              : story
                          )
                        )
                      }
                      className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-stone-400 focus:outline-none"
                      placeholder="Share the meet-cute, proposal, or a favorite adventure."
                    />
                  </label>
                  <label className="mt-3 block text-sm font-medium text-stone-700">
                    Photo (optional)
                    <input
                      type="file"
                      accept="image/*"
                      className="mt-2"
                      onChange={(event) =>
                        handleStoryPhotoChange(entry.id, event)
                      }
                    />
                  </label>
                  {entry.photoUrl && (
                    <div className="mt-3 space-y-2">
                      <img
                        src={entry.photoUrl}
                        alt="Story preview"
                        className="h-32 w-full rounded-2xl object-cover"
                      />
                      <button
                        type="button"
                        className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500"
                        onClick={() => clearStoryPhoto(entry.id)}
                      >
                        Remove photo
                      </button>
                    </div>
                  )}
                  <button
                    type="button"
                    className="mt-4 text-xs font-semibold uppercase tracking-[0.3em] text-rose-500"
                    onClick={() => removeStoryEntry(entry.id)}
                  >
                    Remove story
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
    if (sectionKey === "photos") {
      return (
        <>
          <label className="block text-sm font-medium text-stone-700">
            Upload gallery photos
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoChange}
              className="mt-2"
            />
          </label>
          <p className={styles.photoUploadInfo}>
            Selected {photoFiles.length}{" "}
            {photoFiles.length === 1 ? "photo" : "photos"} (max 5).
          </p>
        </>
      );
    }
    if (sectionKey === "wedding-party") {
      return (
        <div className="space-y-4">
          <TileButton
            icon={tileIcons.attendant}
            label="Add attendant"
            onClick={() =>
              setPartyMembers((prev) => [
                ...prev,
                { id: generateId(), name: "", role: "", bio: "" },
              ])
            }
          />
          {partyMembers.length > 0 && (
            <div className="space-y-2">
              {partyMembers.map((member) => (
                <div
                  key={member.id}
                  className="rounded-2xl border border-stone-200 bg-white/80 p-4 shadow-sm"
                >
                  <input
                    type="text"
                    placeholder="Name"
                    value={member.name}
                    onChange={(event) =>
                      setPartyMembers((prev) =>
                        prev.map((entry) =>
                          entry.id === member.id
                            ? { ...entry, name: event.target.value }
                            : entry
                        )
                      )
                    }
                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-stone-400 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Role (Maid of Honor, Best Man)"
                    value={member.role}
                    onChange={(event) =>
                      setPartyMembers((prev) =>
                        prev.map((entry) =>
                          entry.id === member.id
                            ? { ...entry, role: event.target.value }
                            : entry
                        )
                      )
                    }
                    className="mt-2 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-stone-400 focus:outline-none"
                  />
                  <textarea
                    placeholder="Share a fun fact or connection story"
                    value={member.bio}
                    onChange={(event) =>
                      setPartyMembers((prev) =>
                        prev.map((entry) =>
                          entry.id === member.id
                            ? { ...entry, bio: event.target.value }
                            : entry
                        )
                      )
                    }
                    rows={2}
                    className="mt-2 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-stone-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    className="mt-3 text-xs font-semibold uppercase tracking-[0.3em] text-stone-500"
                    onClick={() =>
                      setPartyMembers((prev) =>
                        prev.filter((entry) => entry.id !== member.id)
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
    if (sectionKey === "registry") {
      return (
        <label className="block text-sm font-medium text-stone-700">
          Registry link
          <input
            type="url"
            placeholder="https://www.example.com/your-registry"
            className="mt-2"
          />
        </label>
      );
    }
    const value = sectionNotes[sectionKey] ?? "";
    return (
      <label className="block text-sm font-medium text-stone-700">
        Details
        <textarea
          rows={3}
          value={value}
          onChange={(event) =>
            setSectionNotes((prev) => ({
              ...prev,
              [sectionKey]: event.target.value,
            }))
          }
          placeholder="Share a short description to appear on the page."
          className="mt-2"
        />
      </label>
    );
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
  const storyPreviewEntries = storyEntries.filter(
    (entry) =>
      entry.title.trim() !== "" ||
      entry.text.trim() !== "" ||
      Boolean(entry.photoUrl)
  );
  const hasStoryDetails = storyPreviewEntries.length > 0;
  const hasTravelDetails =
    travelHotels.length > 0 ||
    travelAirports.length > 0 ||
    travelDirections.length > 0;
  const hasActivityHighlights = activities.length > 0;
  const hasWeddingParty = partyMembers.length > 0;

  const previewNames =
    template.preview?.coupleName ?? DEFAULT_PREVIEW.coupleName;
  const [defaultLeft, defaultRight] = previewNames
    .split("&")
    .map((s) => s.trim());
  const location = template.preview?.location ?? DEFAULT_PREVIEW.location;
  const [defaultCity, defaultState] = location.split(",").map((s) => s.trim());

  const [partnerOne, setPartnerOne] = useState(defaultLeft ?? "");
  const [partnerTwo, setPartnerTwo] = useState(defaultRight ?? "");
  const [eventDate, setEventDate] = useState(
    parseDateInput(
      defaultDate ?? template.preview?.dateLabel ?? DEFAULT_PREVIEW.dateLabel
    )
  );
  const [city, setCity] = useState(defaultCity ?? "");
  const [state, setState] = useState(defaultState ?? "");

  const previewCoupleName =
    partnerOne && partnerTwo ? `${partnerOne} & ${partnerTwo}` : previewNames;
  const previewDateLabel =
    formatDateLabel(eventDate) ??
    template.preview?.dateLabel ??
    DEFAULT_PREVIEW.dateLabel;
  const previewLocation =
    city || state ? [city, state].filter(Boolean).join(", ") : location;

  const tileIcons: Record<string, ReactNode> = {
    hotel: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        aria-hidden="true"
      >
        <rect x="4" y="8" width="16" height="12" rx="1.5" strokeWidth="1.6" />
        <path
          d="M9 4h6v4H9zM8 12h2M14 12h2M8 16h2M14 16h2"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    ),
    airport: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          d="M3 12l18-5-2 7 2 7-18-5"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M3 12l6 6M3 12l6-6" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
    directions: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          d="M12 3l7 7-7 11-7-11 7-7z"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path d="M12 8v4l2 2" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
    highlight: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        aria-hidden="true"
      >
        <circle cx="12" cy="10" r="3.5" strokeWidth="1.6" />
        <path
          d="M5.5 10c0 4.25 5.5 9.5 6.3 10.2.1.1.3.1.4 0 .8-.7 6.3-5.95 6.3-10.2A6.5 6.5 0 005.5 10z"
          strokeWidth="1.6"
        />
      </svg>
    ),
    story: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path d="M5 5h6a3 3 0 013 3v12H8a3 3 0 00-3 3V5z" strokeWidth="1.6" />
        <path d="M19 5h-6a3 3 0 00-3 3v12a3 3 0 013-3h6z" strokeWidth="1.6" />
        <path d="M8 9h4" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M8 12h3" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
    attendant: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        aria-hidden="true"
      >
        <circle cx="9" cy="8" r="3" strokeWidth="1.6" />
        <circle cx="17" cy="10" r="2.5" strokeWidth="1.6" />
        <path
          d="M4.5 19c0-3 2.5-5 4.5-5s4.5 2 4.5 5M14 19c0-2.5 1.5-4 3-4s3 1.5 3 4"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    ),
  };

  const TileButton = ({
    icon,
    label,
    onClick,
    disabled,
  }: {
    icon: ReactNode;
    label: string;
    onClick: () => void;
    disabled?: boolean;
  }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-5 text-center text-sm shadow-sm transition hover:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400 ${
        disabled ? "opacity-50" : ""
      }`}
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-full border border-stone-100 bg-stone-50 text-stone-500">
        <span className="h-8 w-8 text-stone-600 [&>svg]:h-full [&>svg]:w-full">
          {icon}
        </span>
      </span>
      <p className="text-sm font-semibold text-stone-900">{label}</p>
    </button>
  );

  const PreviewCard = ({
    title,
    children,
  }: {
    title: string;
    children: ReactNode;
  }) => (
    <div className="rounded-2xl border border-black/5 bg-white/80 p-5 shadow-sm backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-400">
        {title}
      </p>
      <div className="mt-3 space-y-3 text-sm text-stone-700">{children}</div>
    </div>
  );

  const heroImageSrc = `/templates/wedding-placeholders/${template.heroImageName}`;

  const handleContinue = useCallback(() => {
    const params = new URLSearchParams();
    params.set("templateId", template.id);
    params.set("variationId", resolvedVariation.id);
    if (eventDate) {
      try {
        const iso = new Date(eventDate).toISOString();
        params.set("d", iso);
      } catch {}
    } else if (defaultDate) {
      params.set("d", defaultDate);
    }
    router.push(`/event/new?${params.toString()}`);
  }, [template.id, resolvedVariation.id, eventDate, defaultDate, router]);

  return (
    <main className="px-5 py-10">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 lg:flex-row">
        <div className="flex-1">
          <article className={styles.templateCard}>
            <div className={styles.cardBody}>
              <div className={styles.previewFrame}>
                <div
                  className={styles.previewHeader}
                  style={{ background: resolvedVariation.background }}
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
                    {previewCoupleName}
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
                    {template.menu.slice(0, 7).map((item) => (
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
              {(hasStoryDetails ||
                hasTravelDetails ||
                hasActivityHighlights ||
                hasWeddingParty) && (
                <div className="mt-4 space-y-4">
                {hasStoryDetails && (
                  <PreviewCard title={menuLabel("our-story", "Our Story")}>
                    <div className="space-y-4">
                      {storyPreviewEntries.map((entry) => (
                        <div key={entry.id} className="space-y-2">
                          {entry.photoUrl && (
                            <img
                              src={entry.photoUrl}
                              alt="Our story preview"
                              className="h-40 w-full rounded-2xl object-cover"
                            />
                          )}
                          {entry.title && (
                            <p className="text-base font-semibold text-stone-900">
                              {entry.title}
                            </p>
                          )}
                          {entry.text && <p>{entry.text}</p>}
                        </div>
                      ))}
                    </div>
                  </PreviewCard>
                )}
                  {hasTravelDetails && (
                    <PreviewCard title={menuLabel("travel", "Travel")}>
                      {travelHotels.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                            Hotels
                          </p>
                          <ul className="mt-1 space-y-1">
                            {travelHotels.map((hotel) => (
                              <li key={hotel.id}>
                                <p className="font-semibold text-stone-900">
                                  {hotel.name || "Hotel to be announced"}
                                </p>
                                {hotel.detail && (
                                  <p className="text-sm text-stone-600">
                                    {hotel.detail}
                                  </p>
                                )}
                                {hotel.link && (
                                  <a
                                    href={hotel.link}
                                    className="text-xs text-stone-500 underline"
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    {hotel.link}
                                  </a>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {travelAirports.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                            Airports
                          </p>
                          <ul className="mt-1 space-y-1">
                            {travelAirports.map((airport) => (
                              <li key={airport.id}>
                                <p className="font-semibold text-stone-900">
                                  {airport.name || "Airport info coming soon"}
                                </p>
                                {airport.detail && (
                                  <p className="text-sm text-stone-600">
                                    {airport.detail}
                                  </p>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {travelDirections.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                            Directions
                          </p>
                          <ul className="mt-1 space-y-1">
                            {travelDirections.map((direction) => (
                              <li key={direction.id}>
                                <p className="font-semibold text-stone-900">
                                  {direction.title || "Transit plan"}
                                </p>
                                {direction.instructions && (
                                  <p className="text-sm text-stone-600">
                                    {direction.instructions}
                                  </p>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </PreviewCard>
                  )}
                  {hasActivityHighlights && (
                    <PreviewCard
                      title={menuLabel("things-to-do", "Things To Do")}
                    >
                      <ul className="space-y-2">
                        {activities.map((activity) => (
                          <li key={activity.id}>
                            <p className="font-semibold text-stone-900">
                              {activity.title || "Weekend highlight"}
                            </p>
                            {activity.description && (
                              <p className="text-sm text-stone-600">
                                {activity.description}
                              </p>
                            )}
                          </li>
                        ))}
                      </ul>
                    </PreviewCard>
                  )}
                  {hasWeddingParty && (
                    <PreviewCard
                      title={menuLabel("wedding-party", "Wedding Party")}
                    >
                      <ul className="space-y-2">
                        {partyMembers.map((member) => (
                          <li key={member.id}>
                            <p className="font-semibold text-stone-900">
                              {member.name || "Attendant"}
                              {member.role && (
                                <span className="ml-2 text-xs uppercase tracking-[0.2em] text-stone-500">
                                  {member.role}
                                </span>
                              )}
                            </p>
                            {member.bio && (
                              <p className="text-sm text-stone-600">
                                {member.bio}
                              </p>
                            )}
                          </li>
                        ))}
                      </ul>
                    </PreviewCard>
                  )}
                </div>
              )}
            </div>
          </article>
        </div>
        <div className="w-full max-w-md space-y-5 rounded-2xl border border-black/5 bg-white/90 p-6 shadow-md">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-stone-500">
              Customize
            </p>
            <h2 className="text-2xl font-semibold text-stone-900">
              Add your details
            </h2>
          </div>
          <div className={styles.accordionWrapper}>
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
            onClick={handleContinue}
            className="w-full rounded-full bg-stone-900 px-4 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-stone-800"
          >
            Preview and publish
          </button>
        </div>
      </section>
    </main>
  );
}
