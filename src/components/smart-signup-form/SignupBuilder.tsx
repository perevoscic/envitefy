"use client";

import React from "react";
import { useSession } from "next-auth/react";
import type {
  SignupForm,
  SignupFormSection,
  SignupFormSlot,
  SignupQuestion,
  SignupDesignTheme,
} from "@/types/signup";
import { readFileAsDataUrl, createThumbnailDataUrl } from "@/utils/thumbnail";
import {
  createSignupSection,
  createSignupSlot,
  DEFAULT_SIGNUP_SETTINGS,
  generateSignupId,
} from "@/utils/signup";

type Props = {
  form: SignupForm;
  onChange: (next: SignupForm) => void;
  showBasicsErrors?: boolean;
  panels?: {
    basics?: boolean;
    settings?: boolean;
    sections?: boolean;
    questions?: boolean;
  };
};

const REMINDER_PRESETS: Array<{ value: number; label: string }> = [
  { value: 168, label: "1 week before" },
  { value: 72, label: "3 days before" },
  { value: 48, label: "2 days before" },
  { value: 24, label: "1 day before" },
  { value: 6, label: "6 hours before" },
  { value: 2, label: "2 hours before" },
  { value: 1, label: "1 hour before" },
];

const moveItem = <T,>(items: T[], from: number, to: number): T[] => {
  if (from === to) return items;
  if (to < 0 || to >= items.length) return items;
  const copy = [...items];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
};

const duplicateSection = (section: SignupFormSection): SignupFormSection => ({
  ...section,
  id: generateSignupId(),
  title: section.title ? `${section.title} (copy)` : "Sign-up section copy",
  slots: section.slots.map((slot) => ({
    ...slot,
    id: generateSignupId(),
  })),
});

const duplicateSlot = (slot: SignupFormSlot): SignupFormSlot => ({
  ...slot,
  id: generateSignupId(),
  label: slot.label ? `${slot.label} (copy)` : "Slot copy",
});

const addQuestion = (questions: SignupQuestion[]): SignupQuestion[] => [
  ...questions,
  {
    id: generateSignupId(),
    prompt: "How can we make this experience better for you?",
    required: false,
    multiline: true,
  },
];

// Visual thumbnails for Theme design categories (moved outside component to prevent recreating on each render)
const THEME_NAMES = [
  "Spring",
  "Summer",
  "School & Education",
  "Fall & Seasonal",
  "Church & Community",
  "Sports & Recreation",
  "Fundraising & Food",
  "Family & Personal",
  "Business & Professional",
  "Parties & Events",
  "Health & Fitness",
  "Clubs & Groups",
  "General",
  "Other / Special Interest",
] as const;

// Removed toggle UI: Smart sign-up is always enabled in the modal now.

const ThemeImagesCarousel: React.FC<{
  themeName: string;
  onPick: (url: string) => void;
  searchQuery?: string;
  allNames?: string[];
  selectedUrl?: string | null;
}> = ({ themeName, onPick, searchQuery, allNames, selectedUrl }) => {
  const [urls, setUrls] = React.useState<string[] | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Memoize the search query to avoid unnecessary re-renders
  const normalizedSearchQuery = React.useMemo(
    () => (searchQuery || "").trim(),
    [searchQuery]
  );

  React.useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const q = normalizedSearchQuery;
        const categories: string[] = q ? allNames || [] : [themeName];
        const results = await Promise.all(
          categories.map(async (cat) => {
            const res = await fetch(
              `/api/templates/signup?category=${encodeURIComponent(cat)}`
            );
            if (!res.ok) return [] as string[];
            const data = await res.json();
            return Array.isArray(data.images) ? (data.images as string[]) : [];
          })
        );
        const all = results.flat();
        if (!mounted) return;
        setUrls(all);
      } catch (e) {
        if (mounted) {
          setError("failed");
          setUrls([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [themeName, normalizedSearchQuery, allNames]);

  if (loading) {
    return (
      <div className="sm:col-span-2">
        <div className="text-xs text-foreground/60">Loading theme images…</div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="sm:col-span-2">
        <div className="text-xs text-foreground/60">
          No images found for this theme.
        </div>
      </div>
    );
  }
  if (!urls || urls.length === 0) {
    return (
      <div className="sm:col-span-2">
        <div className="text-xs text-foreground/60">
          No theme images found for "{themeName}".
        </div>
      </div>
    );
  }

  return (
    <div className="sm:col-span-2 space-y-1 w-full min-w-0 max-w-full">
      <div className="rounded-md border border-gray-200 bg-white p-2 overflow-x-auto w-full min-w-0 max-w-full">
        <div className="flex gap-3 min-w-0 max-w-full">
          {urls.map((url) => {
            const file = url.split("/").pop() || "image";
            const base = file.replace(/\.[^.]+$/, "");
            const pretty = base
              .replace(/[\-_]+/g, " ")
              .replace(/\s+/g, " ")
              .trim()
              .toLowerCase()
              .replace(/\b\w/g, (m) => m.toUpperCase());
            if (
              (searchQuery || "").trim() &&
              !pretty.toLowerCase().includes((searchQuery || "").toLowerCase())
            ) {
              return null;
            }
            const isSelected = selectedUrl === url;
            return (
              <button
                key={url}
                type="button"
                className={`shrink-0 w-28 rounded-md border bg-white transition-all ${
                  isSelected
                    ? "border-blue-500 ring-2 ring-blue-500 shadow-md"
                    : "border-gray-200 hover:ring-2 hover:ring-blue-500"
                }`}
                title={pretty}
                onClick={() => onPick(url)}
              >
                <div className="p-1 relative">
                  <img
                    src={url}
                    alt={pretty}
                    className={`h-16 w-full object-cover rounded ${
                      isSelected ? "opacity-100" : "opacity-90"
                    }`}
                  />
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 20 20"
                        fill="none"
                        stroke="white"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M5 10l3 3 7-7" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="px-2 pb-2 text-[10px] text-gray-800 text-center truncate">
                  {pretty}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const SectionCard = ({
  section,
  index,
  total,
  onChange,
  onMove,
  onDuplicate,
  onRemove,
  onSlotChange,
  onSlotMove,
  onSlotDuplicate,
  onSlotRemove,
  onAddSlot,
}: {
  section: SignupFormSection;
  index: number;
  total: number;
  onChange: (next: SignupFormSection) => void;
  onMove: (index: number, direction: -1 | 1) => void;
  onDuplicate: (section: SignupFormSection) => void;
  onRemove: (section: SignupFormSection) => void;
  onSlotChange: (
    sectionId: string,
    slotId: string,
    next: SignupFormSlot
  ) => void;
  onSlotMove: (sectionId: string, slotId: string, direction: -1 | 1) => void;
  onSlotDuplicate: (sectionId: string, slot: SignupFormSlot) => void;
  onSlotRemove: (sectionId: string, slotId: string) => void;
  onAddSlot: (sectionId: string) => void;
}) => (
  <div className="rounded-lg border border-border/70 bg-surface/70 p-3 sm:p-4 space-y-3">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex-1 min-w-0 space-y-2">
        <div>
          <label className="block text-xs uppercase font-semibold tracking-wide text-foreground/60 mb-1">
            Section title
          </label>
          <input
            type="text"
            value={section.title}
            onChange={(event) =>
              onChange({ ...section, title: event.target.value })
            }
            placeholder="Example: Food stations, volunteer roles, supply checklist..."
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs uppercase font-semibold tracking-wide text-foreground/60 mb-1">
            Instructions (optional)
          </label>
          <textarea
            value={section.description || ""}
            onChange={(event) =>
              onChange({ ...section, description: event.target.value })
            }
            placeholder="Share context for this section."
            rows={2}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onMove(index, -1)}
          disabled={index === 0}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-sm disabled:opacity-50"
          title="Move section up"
        >
          ↑
        </button>
        <button
          type="button"
          onClick={() => onMove(index, 1)}
          disabled={index >= total - 1}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-sm disabled:opacity-50"
          title="Move section down"
        >
          ↓
        </button>
        <button
          type="button"
          onClick={() => onDuplicate(section)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-sm"
          title="Duplicate section"
        >
          ⧉
        </button>
        <button
          type="button"
          onClick={() => onRemove(section)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-sm text-red-600 hover:text-red-700"
          title="Remove section"
        >
          ✕
        </button>
      </div>
    </div>
    <div className="space-y-3">
      {section.slots.map((slot, slotIndex) => (
        <div
          key={slot.id}
          className="rounded-md border border-border bg-background/80 p-3 space-y-2"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <label className="block text-xs font-semibold uppercase tracking-wide text-foreground/60 mb-1">
                Slot label
              </label>
              <input
                type="text"
                value={slot.label}
                onChange={(event) =>
                  onSlotChange(section.id, slot.id, {
                    ...slot,
                    label: event.target.value,
                  })
                }
                placeholder="Example: Bring dessert for 12 guests"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            {/* Date and time removed from slot editor (moved to Basics) */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onSlotMove(section.id, slot.id, -1)}
                disabled={slotIndex === 0}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-xs disabled:opacity-50"
                title="Move slot up"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => onSlotMove(section.id, slot.id, 1)}
                disabled={slotIndex >= section.slots.length - 1}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-xs disabled:opacity-50"
                title="Move slot down"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => onSlotDuplicate(section.id, slot)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-xs"
                title="Duplicate slot"
              >
                ⧉
              </button>
              <button
                type="button"
                onClick={() => onSlotRemove(section.id, slot.id)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-xs text-red-600 hover:text-red-700"
                title="Remove slot"
              >
                ✕
              </button>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-xs uppercase font-semibold tracking-wide text-foreground/60 mb-1">
                Capacity
              </label>
              <input
                type="number"
                min={0}
                inputMode="numeric"
                value={
                  typeof slot.capacity === "number" && slot.capacity > 0
                    ? String(slot.capacity)
                    : ""
                }
                onChange={(event) => {
                  const value = event.target.value;
                  const nextCapacity =
                    value.trim() === ""
                      ? null
                      : Math.max(
                          0,
                          Math.min(999, Number.parseInt(value, 10) || 0)
                        );
                  onSlotChange(section.id, slot.id, {
                    ...slot,
                    capacity: nextCapacity === 0 ? null : nextCapacity,
                  });
                }}
                placeholder="Unlimited"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
              <p className="mt-1 text-[11px] text-foreground/60">
                Leave blank for unlimited sign-ups.
              </p>
            </div>
            <div>
              <label className="block text-xs uppercase font-semibold tracking-wide text-foreground/60 mb-1">
                Starts at
              </label>
              <input
                type="time"
                value={slot.startTime || ""}
                onChange={(event) =>
                  onSlotChange(section.id, slot.id, {
                    ...slot,
                    startTime: event.target.value || null,
                  })
                }
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs uppercase font-semibold tracking-wide text-foreground/60 mb-1">
                Ends at
              </label>
              <input
                type="time"
                value={slot.endTime || ""}
                onChange={(event) =>
                  onSlotChange(section.id, slot.id, {
                    ...slot,
                    endTime: event.target.value || null,
                  })
                }
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs uppercase font-semibold tracking-wide text-foreground/60 mb-1">
              Notes for volunteers (optional)
            </label>
            <textarea
              value={slot.notes || ""}
              onChange={(event) =>
                onSlotChange(section.id, slot.id, {
                  ...slot,
                  notes: event.target.value,
                })
              }
              rows={2}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              placeholder="Share what to bring or how to prepare."
            />
          </div>
        </div>
      ))}
    </div>
    <button
      type="button"
      onClick={() => onAddSlot(section.id)}
      className="inline-flex items-center gap-2 rounded-md border border-dashed border-primary/60 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10"
    >
      + Add slot
    </button>
  </div>
);

const SignupBuilder: React.FC<Props> = ({
  form,
  onChange,
  showBasicsErrors,
  panels,
}) => {
  const settings = { ...DEFAULT_SIGNUP_SETTINGS, ...form.settings };
  const { data: session } = useSession();
  const creatorName = (session?.user?.name as string | undefined) || null;
  const creatorInitials = (creatorName || "")
    .trim()
    .split(/\s+/)
    .map((w) => (w ? w[0].toUpperCase() : ""))
    .slice(0, 2)
    .join("");

  const showBasics = panels?.basics !== false;
  const showSettings = panels?.settings !== false;
  const showSections = panels?.sections !== false;
  const showQuestions = panels?.questions !== false;

  const setSettings = (next: Partial<typeof settings>) => {
    onChange({
      ...form,
      settings: { ...settings, ...next },
    });
  };

  // Helper to check if a color is dark (low brightness)
  const isDarkColor = (hex: string): boolean => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness < 128;
  };

  // Helper to get lightest color from palette
  const getLightestColor = (colors: string[]): string => {
    return colors.reduce((lightest, color) => {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;

      const rL = parseInt(lightest.slice(1, 3), 16);
      const gL = parseInt(lightest.slice(3, 5), 16);
      const bL = parseInt(lightest.slice(5, 7), 16);
      const brightnessL = (rL * 299 + gL * 587 + bL * 114) / 1000;

      return brightness > brightnessL ? color : lightest;
    });
  };

  // Helper to get darkest color from palette
  const getDarkestColor = (colors: string[]): string => {
    return colors.reduce((darkest, color) => {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;

      const rD = parseInt(darkest.slice(1, 3), 16);
      const gD = parseInt(darkest.slice(3, 5), 16);
      const bD = parseInt(darkest.slice(5, 7), 16);
      const brightnessD = (rD * 299 + gD * 587 + bD * 114) / 1000;

      return brightness < brightnessD ? color : darkest;
    });
  };

  const setHeader = (next: Partial<NonNullable<SignupForm["header"]>>) => {
    onChange({
      ...form,
      header: { ...(form.header || {}), ...next },
    });
  };

  const uploadImageToIndex = async (index: number, file: File) => {
    const dataUrl = await readFileAsDataUrl(file);
    const thumb = (await createThumbnailDataUrl(file, 900, 0.9)) || dataUrl;
    const currentImages = Array.isArray(form.header?.images)
      ? [...form.header!.images!]
      : [];

    // Ensure array has enough slots
    while (currentImages.length <= index) {
      currentImages.push({
        id: generateSignupId(),
        name: "",
        type: "image/jpeg",
        dataUrl: "",
      });
    }

    // Set the image at the specific index
    currentImages[index] = {
      id: currentImages[index]?.id || generateSignupId(),
      name: file.name,
      type: file.type,
      dataUrl: thumb,
    };

    setHeader({ images: currentImages });
  };

  const addGalleryImages = async (files: FileList | null) => {
    if (!files) return;
    const items: Array<{
      id: string;
      name: string;
      type: string;
      dataUrl: string;
    }> = [];
    for (const f of Array.from(files).slice(0, 6)) {
      const dataUrl = await readFileAsDataUrl(f);
      const thumb = (await createThumbnailDataUrl(f, 900, 0.9)) || dataUrl;
      items.push({
        id: generateSignupId(),
        name: f.name,
        type: f.type,
        dataUrl: thumb,
      });
    }
    const current = Array.isArray(form.header?.images)
      ? [...form.header!.images!]
      : [];

    const templateId = form.header?.templateId || "header-1";

    // For templates 5 and 6, if uploading first image (index 0), set it at index 0
    // For template 4, first image goes to index 0
    // Otherwise append
    if (
      (templateId === "header-4" ||
        templateId === "header-5" ||
        templateId === "header-6") &&
      (!current[0]?.dataUrl || current.length === 0)
    ) {
      // Set first image at index 0, preserving any existing images at other indices
      const newImages = [...current];
      newImages[0] = items[0];
      // Add any additional items after index 0
      if (items.length > 1) {
        for (let i = 1; i < items.length; i++) {
          const insertIndex =
            newImages.findIndex((img) => !img?.dataUrl) || newImages.length;
          if (insertIndex >= newImages.length) {
            newImages.push(items[i]);
          } else {
            newImages[insertIndex] = items[i];
          }
        }
      }
      setHeader({ images: newImages });
    } else {
      // Append to existing array
      setHeader({ images: [...current, ...items] });
    }
  };

  // Generate color stories for all themes (12 per theme)
  // Helper function to create gradient CSS
  const createGradient = (color1: string, color2: string, angle = 135) => {
    return `linear-gradient(${angle}deg, ${color1}, ${color2})`;
  };

  // Helper function to convert hex to rgba
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  };

  // Generate all color stories for each theme
  const generateColorStories = () => {
    const stories: Array<{
      id: string;
      name: string;
      description: string;
      colors: string[];
      bgColor: string;
      bgCss?: string;
      textColor1?: string;
      textColor2?: string;
      buttonColor?: string;
      buttonTextColor?: string;
    }> = [];

    // Spring - 12 color stories
    const springStories = [
      {
        id: "spring-1",
        name: "Verdant Atelier",
        desc: "Botanical inked outlines",
        colors: ["#697864", "#2D4739", "#96C7D4", "#B5D4DD", "#81A494"],
        bg: "#697864",
      },
      {
        id: "spring-2",
        name: "Petal Script",
        desc: "Painterly blush swash",
        colors: ["#5D3834", "#F5EDE4", "#DDB9B9", "#D9A884", "#B8876B"],
        bg: "#F5EDE4",
      },
      {
        id: "spring-3",
        name: "Garden Bloom",
        desc: "Lush emerald gathers",
        colors: ["#F5EDE4", "#9CC5B3", "#6B9D88", "#4A7662", "#2D5644"],
        bg: "#6B9D88",
      },
      {
        id: "spring-4",
        name: "Cherry Blossom",
        desc: "Soft pink petals",
        colors: ["#F8E8E8", "#E8B8C8", "#D88AA8", "#C85A88", "#A83A68"],
        bg: "#E8B8C8",
      },
      {
        id: "spring-5",
        name: "Meadow Fresh",
        desc: "New growth greens",
        colors: ["#E8F5E8", "#B8E8B8", "#88D888", "#68C868", "#48A848"],
        bg: "#88D888",
      },
      {
        id: "spring-6",
        name: "Daffodil Dawn",
        desc: "Bright yellow sunshine",
        colors: ["#FFF8E8", "#FFE8B8", "#FFD888", "#FFC868", "#FFB848"],
        bg: "#FFD888",
      },
      {
        id: "spring-7",
        name: "Lavender Fields",
        desc: "Purple spring blooms",
        colors: ["#F5E8F5", "#E8B8E8", "#D888D8", "#C868C8", "#A848A8"],
        bg: "#D888D8",
      },
      {
        id: "spring-8",
        name: "Tulip Garden",
        desc: "Vibrant spring colors",
        colors: ["#FFE0E0", "#FFB0B0", "#FF8080", "#E86060", "#C84040"],
        bg: "#FF8080",
      },
      {
        id: "spring-9",
        name: "Mint Fresh",
        desc: "Cool minty greens",
        colors: ["#E8F5F0", "#B8E8D8", "#88D8C8", "#68C8B8", "#48A898"],
        bg: "#88D8C8",
      },
      {
        id: "spring-10",
        name: "Peach Blossom",
        desc: "Warm peach tones",
        colors: ["#FFF5E8", "#FFE8C8", "#FFD8A8", "#FFC888", "#FFB868"],
        bg: "#FFD8A8",
      },
      {
        id: "spring-11",
        name: "Iris Garden",
        desc: "Deep purple blooms",
        colors: ["#E8E8F5", "#C8C8E8", "#A8A8D8", "#8888C8", "#6868A8"],
        bg: "#A8A8D8",
      },
      {
        id: "spring-12",
        name: "Lily Pond",
        desc: "Aqua and green harmony",
        colors: ["#E8F5F5", "#B8E8E8", "#88D8D8", "#68C8C8", "#48A8A8"],
        bg: "#88D8D8",
      },
    ];

    // Summer - 12 color stories
    const summerStories = [
      {
        id: "summer-1",
        name: "Shimmering Sea",
        desc: "Coastal mist & glitter",
        colors: ["#B5D7E8", "#5B9FB8", "#3D7A95", "#2C5466", "#A8CDDD"],
        bg: "#5B9FB8",
      },
      {
        id: "summer-2",
        name: "Mist Coast",
        desc: "Cool greenhouse glass",
        colors: ["#1C3D52", "#93C5E8", "#B5D7EA", "#7CADC7", "#4A7792"],
        bg: "#1C3D52",
      },
      {
        id: "summer-3",
        name: "Coral Lyric",
        desc: "Bougainvillea promise",
        colors: ["#D8A9A0", "#BA7A7A", "#B16B54", "#3D2522", "#E4D5D9"],
        bg: "#BA7A7A",
      },
      {
        id: "summer-4",
        name: "Tropical Paradise",
        desc: "Vibrant island colors",
        colors: ["#FFE8A8", "#FFD888", "#FFC868", "#FFB848", "#FFA828"],
        bg: "#FFC868",
      },
      {
        id: "summer-5",
        name: "Ocean Breeze",
        desc: "Cool blue waters",
        colors: ["#E0F5FF", "#B0E8FF", "#80D8FF", "#60C8FF", "#40A8FF"],
        bg: "#80D8FF",
      },
      {
        id: "summer-6",
        name: "Sunset Beach",
        desc: "Warm evening glow",
        colors: ["#FFE8C8", "#FFD8A8", "#FFC888", "#FFB868", "#FFA848"],
        bg: "#FFC888",
      },
      {
        id: "summer-7",
        name: "Palm Frond",
        desc: "Tropical green leaves",
        colors: ["#E5F5E5", "#B5E8B5", "#85D885", "#65C865", "#45A845"],
        bg: "#85D885",
      },
      {
        id: "summer-8",
        name: "Sandy Shore",
        desc: "Beach sand tones",
        colors: ["#FFF8E8", "#FFE8C8", "#FFD8A8", "#E8C888", "#D8B868"],
        bg: "#FFD8A8",
      },
      {
        id: "summer-9",
        name: "Poolside Blue",
        desc: "Swimming pool aqua",
        colors: ["#E5F5FF", "#B5E8FF", "#85D8FF", "#65C8FF", "#45A8FF"],
        bg: "#85D8FF",
      },
      {
        id: "summer-10",
        name: "Watermelon Slice",
        desc: "Fresh summer fruit",
        colors: ["#FFE5E5", "#FFB5B5", "#FF8585", "#E86565", "#C84545"],
        bg: "#FF8585",
      },
      {
        id: "summer-11",
        name: "Lemonade Stand",
        desc: "Bright citrus yellow",
        colors: ["#FFF5E0", "#FFE5B0", "#FFD580", "#FFC560", "#FFB540"],
        bg: "#FFD580",
      },
      {
        id: "summer-12",
        name: "Seashell Pink",
        desc: "Soft coastal pink",
        colors: ["#FFE8F5", "#FFC8E8", "#FFA8D8", "#E888C8", "#D868A8"],
        bg: "#FFA8D8",
      },
    ];

    // School & Education - 12 color stories
    const schoolStories = [
      {
        id: "school-1",
        name: "Sage Dusk",
        desc: "Lavender twilight canopy",
        colors: ["#6B86B3", "#4E6BA0", "#1E2C5C", "#B5CEE8", "#8FA6D4"],
        bg: "#4E6BA0",
      },
      {
        id: "school-2",
        name: "Mist Coast",
        desc: "Cool greenhouse glass",
        colors: ["#1C3D52", "#93C5E8", "#B5D7EA", "#7CADC7", "#4A7792"],
        bg: "#1C3D52",
      },
      {
        id: "school-3",
        name: "Velvet Gold",
        desc: "Gilded foliage shine",
        colors: ["#9A967E", "#6B6B4A", "#2C2E1A", "#E4E8DC", "#A8A89E"],
        bg: "#6B6B4A",
      },
      {
        id: "school-4",
        name: "Notebook Blue",
        desc: "Classic school blue",
        colors: ["#E8F0FF", "#B8D8FF", "#88C0FF", "#68A8FF", "#4890FF"],
        bg: "#88C0FF",
      },
      {
        id: "school-5",
        name: "Chalkboard",
        desc: "Dark academic green",
        colors: ["#2C3E2C", "#3E5E3E", "#4E7E4E", "#5E9E5E", "#6EBE6E"],
        bg: "#3E5E3E",
      },
      {
        id: "school-6",
        name: "Textbook Brown",
        desc: "Vintage book cover",
        colors: ["#8B6B4A", "#6B4A2A", "#4A2A1A", "#A88B6B", "#C8A88B"],
        bg: "#8B6B4A",
      },
      {
        id: "school-7",
        name: "Graduation Cap",
        desc: "Formal navy blue",
        colors: ["#1A2A3A", "#2A3A4A", "#3A4A5A", "#4A5A6A", "#5A6A7A"],
        bg: "#2A3A4A",
      },
      {
        id: "school-8",
        name: "Apple Red",
        desc: "Teacher's apple",
        colors: ["#FFE3E3", "#FFB3B3", "#FF8383", "#E86363", "#C84343"],
        bg: "#FF8383",
      },
      {
        id: "school-9",
        name: "Library Beige",
        desc: "Quiet study tones",
        colors: ["#F5F0E8", "#E8D8C8", "#D8C8B8", "#C8B8A8", "#B8A898"],
        bg: "#D8C8B8",
      },
      {
        id: "school-10",
        name: "Science Lab",
        desc: "Cool laboratory blue",
        colors: ["#E8F0F5", "#B8D8E8", "#88C0D8", "#68A8C8", "#4890B8"],
        bg: "#88C0D8",
      },
      {
        id: "school-11",
        name: "Art Studio",
        desc: "Creative purple",
        colors: ["#F5E8F5", "#E8C8E8", "#D8A8D8", "#C888C8", "#B868B8"],
        bg: "#D8A8D8",
      },
      {
        id: "school-12",
        name: "Study Hall",
        desc: "Neutral gray tones",
        colors: ["#E8E8E8", "#C8C8C8", "#A8A8A8", "#888888", "#686868"],
        bg: "#A8A8A8",
      },
    ];

    // Fall & Seasonal - 12 color stories
    const fallStories = [
      {
        id: "fall-1",
        name: "Trellis Brass",
        desc: "Gilded lattice cues",
        colors: ["#E8D99F", "#B89F5F", "#6B5D3B", "#3D2E1A", "#F5EDD1"],
        bg: "#B89F5F",
      },
      {
        id: "fall-2",
        name: "Amber Sunset",
        desc: "Warm adobe glow",
        colors: ["#C88F5E", "#8B5E3C", "#1E2C3A", "#F5EDE4", "#A8A8A3"],
        bg: "#C88F5E",
      },
      {
        id: "fall-3",
        name: "Terracotta Petal",
        desc: "Warm botanical clay",
        colors: ["#B16B54", "#4A2820", "#E4D5D9", "#D8A9AD", "#C17D7A"],
        bg: "#B16B54",
      },
      {
        id: "fall-4",
        name: "Maple Leaf",
        desc: "Autumn reds",
        colors: ["#FFE8E8", "#FFB8B8", "#E88868", "#C86848", "#A84828"],
        bg: "#E88868",
      },
      {
        id: "fall-5",
        name: "Pumpkin Spice",
        desc: "Warm orange tones",
        colors: ["#FFE8C8", "#FFD8A8", "#FFC888", "#E8A868", "#D88848"],
        bg: "#FFC888",
      },
      {
        id: "fall-6",
        name: "Harvest Gold",
        desc: "Golden wheat fields",
        colors: ["#FFF6E6", "#FFE6B6", "#FFD686", "#E8C666", "#D8B646"],
        bg: "#FFD686",
      },
      {
        id: "fall-7",
        name: "Cranberry",
        desc: "Deep red berries",
        colors: ["#FFE8F0", "#FFB8D8", "#E888B8", "#C86898", "#A84878"],
        bg: "#E888B8",
      },
      {
        id: "fall-8",
        name: "Rustic Brown",
        desc: "Weathered wood",
        colors: ["#8B6B4A", "#6B4A2A", "#4A2A1A", "#A88B6B", "#C8A88B"],
        bg: "#8B6B4A",
      },
      {
        id: "fall-9",
        name: "Cozy Sweater",
        desc: "Warm burgundy",
        colors: ["#E8D8D8", "#C8B8B8", "#A89898", "#887878", "#685858"],
        bg: "#A89898",
      },
      {
        id: "fall-10",
        name: "Apple Orchard",
        desc: "Crisp apple red",
        colors: ["#FFE6E6", "#FFB6B6", "#FF8686", "#E86666", "#C84646"],
        bg: "#FF8686",
      },
      {
        id: "fall-11",
        name: "Hay Bale",
        desc: "Golden yellow",
        colors: ["#FFF8E8", "#FFE8C8", "#FFD8A8", "#E8C888", "#D8B868"],
        bg: "#FFD8A8",
      },
      {
        id: "fall-12",
        name: "Mulled Wine",
        desc: "Deep wine red",
        colors: ["#E8D8E8", "#C8B8C8", "#A898A8", "#887888", "#685868"],
        bg: "#A898A8",
      },
    ];

    // Church & Community - 12 color stories
    const churchStories = [
      {
        id: "church-1",
        name: "Velvet Gold",
        desc: "Gilded foliage shine",
        colors: ["#9A967E", "#6B6B4A", "#2C2E1A", "#E4E8DC", "#A8A89E"],
        bg: "#6B6B4A",
      },
      {
        id: "church-2",
        name: "Tramontane",
        desc: "Noir dusk breeze",
        colors: ["#5D5247", "#7A6B7A", "#D9A884", "#3D2E1A", "#4A3834"],
        bg: "#5D5247",
      },
      {
        id: "church-3",
        name: "Sage Dusk",
        desc: "Lavender twilight canopy",
        colors: ["#6B86B3", "#4E6BA0", "#1E2C5C", "#B5CEE8", "#8FA6D4"],
        bg: "#4E6BA0",
      },
      {
        id: "church-4",
        name: "Stained Glass",
        desc: "Rich jewel tones",
        colors: ["#4A2A5A", "#5A3A6A", "#6A4A7A", "#7A5A8A", "#8A6A9A"],
        bg: "#5A3A6A",
      },
      {
        id: "church-5",
        name: "Chapel White",
        desc: "Pure white light",
        colors: ["#FFFFFF", "#F5F5F5", "#E8E8E8", "#D8D8D8", "#C8C8C8"],
        bg: "#F5F5F5",
      },
      {
        id: "church-6",
        name: "Altar Gold",
        desc: "Sacred gold",
        colors: ["#FFF0E0", "#FFE0C0", "#FFD0A0", "#E8C080", "#D8B060"],
        bg: "#FFD0A0",
      },
      {
        id: "church-7",
        name: "Navy Hymn",
        desc: "Deep blue reverence",
        colors: ["#1A2A3A", "#2A3A4A", "#3A4A5A", "#4A5A6A", "#5A6A7A"],
        bg: "#2A3A4A",
      },
      {
        id: "church-8",
        name: "Marble Stone",
        desc: "Classic gray",
        colors: ["#E8E8E8", "#C8C8C8", "#A8A8A8", "#888888", "#686868"],
        bg: "#A8A8A8",
      },
      {
        id: "church-9",
        name: "Candlelight",
        desc: "Warm amber glow",
        colors: ["#FFE8C8", "#FFD8A8", "#FFC888", "#E8A868", "#D88848"],
        bg: "#FFC888",
      },
      {
        id: "church-10",
        name: "Burgundy Pew",
        desc: "Rich red wood",
        colors: ["#8B4A4A", "#6B2A2A", "#4A1A1A", "#A86B6B", "#C88B8B"],
        bg: "#8B4A4A",
      },
      {
        id: "church-11",
        name: "Ivory Lace",
        desc: "Delicate cream",
        colors: ["#FFF8F5", "#FFE8E8", "#FFD8D8", "#E8C8C8", "#D8B8B8"],
        bg: "#FFE8E8",
      },
      {
        id: "church-12",
        name: "Royal Purple",
        desc: "Regal purple",
        colors: ["#6B4A8B", "#5A3A7A", "#4A2A6A", "#8B6BA8", "#A88BC8"],
        bg: "#5A3A7A",
      },
    ];

    // Sports & Recreation - 12 color stories
    const sportsStories = [
      {
        id: "sports-1",
        name: "Shimmering Sea",
        desc: "Coastal mist & glitter",
        colors: ["#B5D7E8", "#5B9FB8", "#3D7A95", "#2C5466", "#A8CDDD"],
        bg: "#5B9FB8",
      },
      {
        id: "sports-2",
        name: "Mist Coast",
        desc: "Cool greenhouse glass",
        colors: ["#1C3D52", "#93C5E8", "#B5D7EA", "#7CADC7", "#4A7792"],
        bg: "#1C3D52",
      },
      {
        id: "sports-3",
        name: "Garden Bloom",
        desc: "Lush emerald gathers",
        colors: ["#F5EDE4", "#9CC5B3", "#6B9D88", "#4A7662", "#2D5644"],
        bg: "#6B9D88",
      },
      {
        id: "sports-4",
        name: "Field Green",
        desc: "Grass playing field",
        colors: ["#E0F5E0", "#A8E8A8", "#70D870", "#50C850", "#30A830"],
        bg: "#70D870",
      },
      {
        id: "sports-5",
        name: "Team Blue",
        desc: "Athletic blue",
        colors: ["#E8F0FF", "#B8D8FF", "#88C0FF", "#68A8FF", "#4890FF"],
        bg: "#88C0FF",
      },
      {
        id: "sports-6",
        name: "Victory Red",
        desc: "Championship red",
        colors: ["#FFE2E2", "#FFB2B2", "#FF8282", "#E86262", "#C84242"],
        bg: "#FF8282",
      },
      {
        id: "sports-7",
        name: "Track Orange",
        desc: "Energetic orange",
        colors: ["#FFE8C8", "#FFD8A8", "#FFC888", "#E8A868", "#D88848"],
        bg: "#FFC888",
      },
      {
        id: "sports-8",
        name: "Court Yellow",
        desc: "Tennis court yellow",
        colors: ["#FFF4E4", "#FFE4B4", "#FFD484", "#E8C464", "#D8B444"],
        bg: "#FFD484",
      },
      {
        id: "sports-9",
        name: "Pool Blue",
        desc: "Swimming pool",
        colors: ["#E3F5FF", "#B3E8FF", "#83D8FF", "#63C8FF", "#43A8FF"],
        bg: "#83D8FF",
      },
      {
        id: "sports-10",
        name: "Gym Gray",
        desc: "Fitness center",
        colors: ["#E8E8E8", "#C8C8C8", "#A8A8A8", "#888888", "#686868"],
        bg: "#A8A8A8",
      },
      {
        id: "sports-11",
        name: "Stadium Lights",
        desc: "Bright white",
        colors: ["#FFFFFF", "#F5F5F5", "#E8E8E8", "#D8D8D8", "#C8C8C8"],
        bg: "#F5F5F5",
      },
      {
        id: "sports-12",
        name: "Trophy Gold",
        desc: "Championship gold",
        colors: ["#FFF3E3", "#FFE3C3", "#FFD3A3", "#E8C383", "#D8B363"],
        bg: "#FFD3A3",
      },
    ];

    // Fundraising & Food - 12 color stories
    const fundraisingStories = [
      {
        id: "fundraising-1",
        name: "Terracotta Petal",
        desc: "Warm botanical clay",
        colors: ["#B16B54", "#4A2820", "#E4D5D9", "#D8A9AD", "#C17D7A"],
        bg: "#B16B54",
      },
      {
        id: "fundraising-2",
        name: "Coral Lyric",
        desc: "Bougainvillea promise",
        colors: ["#D8A9A0", "#BA7A7A", "#B16B54", "#3D2522", "#E4D5D9"],
        bg: "#BA7A7A",
      },
      {
        id: "fundraising-3",
        name: "Amber Sunset",
        desc: "Warm adobe glow",
        colors: ["#C88F5E", "#8B5E3C", "#1E2C3A", "#F5EDE4", "#A8A8A3"],
        bg: "#C88F5E",
      },
      {
        id: "fundraising-4",
        name: "Bake Sale",
        desc: "Warm pastry tones",
        colors: ["#FFF2E2", "#FFE2C2", "#FFD2A2", "#E8C282", "#D8B262"],
        bg: "#FFD2A2",
      },
      {
        id: "fundraising-5",
        name: "Soup Kitchen",
        desc: "Comforting orange",
        colors: ["#FFE8C8", "#FFD8A8", "#FFC888", "#E8A868", "#D88848"],
        bg: "#FFC888",
      },
      {
        id: "fundraising-6",
        name: "Charity Red",
        desc: "Heartfelt red",
        colors: ["#FFE4E4", "#FFB4B4", "#FF8484", "#E86464", "#C84444"],
        bg: "#FF8484",
      },
      {
        id: "fundraising-7",
        name: "Community Green",
        desc: "Growth green",
        colors: ["#D8F5D8", "#A0E8A0", "#68D868", "#48C848", "#28A828"],
        bg: "#68D868",
      },
      {
        id: "fundraising-8",
        name: "Harvest Table",
        desc: "Rustic brown",
        colors: ["#8B6B4A", "#6B4A2A", "#4A2A1A", "#A88B6B", "#C8A88B"],
        bg: "#8B6B4A",
      },
      {
        id: "fundraising-9",
        name: "Fresh Market",
        desc: "Vibrant produce",
        colors: ["#D0F5D0", "#90E890", "#58D858", "#38C838", "#18A818"],
        bg: "#58D858",
      },
      {
        id: "fundraising-10",
        name: "Warm Meal",
        desc: "Comforting beige",
        colors: ["#F5F0E8", "#E8D8C8", "#D8C8B8", "#C8B8A8", "#B8A898"],
        bg: "#D8C8B8",
      },
      {
        id: "fundraising-11",
        name: "Giving Heart",
        desc: "Pink compassion",
        colors: ["#FFE8F5", "#FFC8E8", "#FFA8D8", "#E888C8", "#D868A8"],
        bg: "#FFA8D8",
      },
      {
        id: "fundraising-12",
        name: "Hope Yellow",
        desc: "Bright optimism",
        colors: ["#FFF1E1", "#FFE1B1", "#FFD181", "#E8C161", "#D8B141"],
        bg: "#FFD181",
      },
    ];

    // Family & Personal - 12 color stories
    const familyStories = [
      {
        id: "family-1",
        name: "Petal Script",
        desc: "Painterly blush swash",
        colors: ["#5D3834", "#F5EDE4", "#DDB9B9", "#D9A884", "#B8876B"],
        bg: "#F5EDE4",
      },
      {
        id: "family-2",
        name: "Coral Lyric",
        desc: "Bougainvillea promise",
        colors: ["#D8A9A0", "#BA7A7A", "#B16B54", "#3D2522", "#E4D5D9"],
        bg: "#BA7A7A",
      },
      {
        id: "family-3",
        name: "Verdant Atelier",
        desc: "Botanical inked outlines",
        colors: ["#697864", "#2D4739", "#96C7D4", "#B5D4DD", "#81A494"],
        bg: "#697864",
      },
      {
        id: "family-4",
        name: "Baby Pink",
        desc: "Soft gentle pink",
        colors: ["#FFE8F5", "#FFC8E8", "#FFA8D8", "#E888C8", "#D868A8"],
        bg: "#FFC8E8",
      },
      {
        id: "family-5",
        name: "Nursery Blue",
        desc: "Calming sky blue",
        colors: ["#E8F0FF", "#B8D8FF", "#88C0FF", "#68A8FF", "#4890FF"],
        bg: "#88C0FF",
      },
      {
        id: "family-6",
        name: "Lavender Dream",
        desc: "Soft purple",
        colors: ["#F5E8F5", "#E8C8E8", "#D8A8D8", "#C888C8", "#B868B8"],
        bg: "#D8A8D8",
      },
      {
        id: "family-7",
        name: "Peach Blush",
        desc: "Warm peach",
        colors: ["#FFF5E8", "#FFE8C8", "#FFD8A8", "#FFC888", "#FFB868"],
        bg: "#FFD8A8",
      },
      {
        id: "family-8",
        name: "Mint Fresh",
        desc: "Cool mint",
        colors: ["#E8F5F0", "#B8E8D8", "#88D8C8", "#68C8B8", "#48A898"],
        bg: "#88D8C8",
      },
      {
        id: "family-9",
        name: "Buttercream",
        desc: "Soft yellow",
        colors: ["#FFEFDF", "#FFDFCF", "#FFCFAF", "#E8BF8F", "#D8AF6F"],
        bg: "#FFCFAF",
      },
      {
        id: "family-10",
        name: "Rose Garden",
        desc: "Romantic rose",
        colors: ["#FFE8F0", "#FFB8D8", "#E888B8", "#C86898", "#A84878"],
        bg: "#E888B8",
      },
      {
        id: "family-11",
        name: "Lilac Morning",
        desc: "Light purple",
        colors: ["#F5E8F5", "#E8C8E8", "#D8A8D8", "#C888C8", "#B868B8"],
        bg: "#D8A8D8",
      },
      {
        id: "family-12",
        name: "Vanilla Cream",
        desc: "Warm cream",
        colors: ["#FFF8F5", "#FFE8E8", "#FFD8D8", "#E8C8C8", "#D8B8B8"],
        bg: "#FFE8E8",
      },
    ];

    // Business & Professional - 12 color stories
    const businessStories = [
      {
        id: "business-1",
        name: "Mist Coast",
        desc: "Cool greenhouse glass",
        colors: ["#1C3D52", "#93C5E8", "#B5D7EA", "#7CADC7", "#4A7792"],
        bg: "#1C3D52",
      },
      {
        id: "business-2",
        name: "Sage Dusk",
        desc: "Lavender twilight canopy",
        colors: ["#6B86B3", "#4E6BA0", "#1E2C5C", "#B5CEE8", "#8FA6D4"],
        bg: "#4E6BA0",
      },
      {
        id: "business-3",
        name: "Tramontane",
        desc: "Noir dusk breeze",
        colors: ["#5D5247", "#7A6B7A", "#D9A884", "#3D2E1A", "#4A3834"],
        bg: "#5D5247",
      },
      {
        id: "business-4",
        name: "Corporate Navy",
        desc: "Professional blue",
        colors: ["#1A2A3A", "#2A3A4A", "#3A4A5A", "#4A5A6A", "#5A6A7A"],
        bg: "#2A3A4A",
      },
      {
        id: "business-5",
        name: "Executive Gray",
        desc: "Sophisticated gray",
        colors: ["#E8E8E8", "#C8C8C8", "#A8A8A8", "#888888", "#686868"],
        bg: "#A8A8A8",
      },
      {
        id: "business-6",
        name: "Boardroom Blue",
        desc: "Trust blue",
        colors: ["#2A3A5A", "#3A4A6A", "#4A5A7A", "#5A6A8A", "#6A7A9A"],
        bg: "#3A4A6A",
      },
      {
        id: "business-7",
        name: "Charcoal Suit",
        desc: "Dark professional",
        colors: ["#2A2A2A", "#3A3A3A", "#4A4A4A", "#5A5A5A", "#6A6A6A"],
        bg: "#3A3A3A",
      },
      {
        id: "business-8",
        name: "Silver Lining",
        desc: "Metallic silver",
        colors: ["#E8E8E8", "#D8D8D8", "#C8C8C8", "#B8B8B8", "#A8A8A8"],
        bg: "#C8C8C8",
      },
      {
        id: "business-9",
        name: "Teal Accent",
        desc: "Modern teal",
        colors: ["#E8F5F5", "#B8E8E8", "#88D8D8", "#68C8C8", "#48A8A8"],
        bg: "#88D8D8",
      },
      {
        id: "business-10",
        name: "Burgundy Tie",
        desc: "Rich burgundy",
        colors: ["#8B4A4A", "#6B2A2A", "#4A1A1A", "#A86B6B", "#C88B8B"],
        bg: "#8B4A4A",
      },
      {
        id: "business-11",
        name: "Ivory Paper",
        desc: "Clean white",
        colors: ["#FFFFFF", "#F5F5F5", "#E8E8E8", "#D8D8D8", "#C8C8C8"],
        bg: "#F5F5F5",
      },
      {
        id: "business-12",
        name: "Midnight Blue",
        desc: "Deep professional",
        colors: ["#1A2A4A", "#2A3A5A", "#3A4A6A", "#4A5A7A", "#5A6A8A"],
        bg: "#2A3A5A",
      },
    ];

    // Parties & Events - 12 color stories
    const partiesStories = [
      {
        id: "parties-1",
        name: "Coral Lyric",
        desc: "Bougainvillea promise",
        colors: ["#D8A9A0", "#BA7A7A", "#B16B54", "#3D2522", "#E4D5D9"],
        bg: "#BA7A7A",
      },
      {
        id: "parties-2",
        name: "Amber Sunset",
        desc: "Warm adobe glow",
        colors: ["#C88F5E", "#8B5E3C", "#1E2C3A", "#F5EDE4", "#A8A8A3"],
        bg: "#C88F5E",
      },
      {
        id: "parties-3",
        name: "Petal Script",
        desc: "Painterly blush swash",
        colors: ["#5D3834", "#F5EDE4", "#DDB9B9", "#D9A884", "#B8876B"],
        bg: "#F5EDE4",
      },
      {
        id: "parties-4",
        name: "Celebration Pink",
        desc: "Festive pink",
        colors: ["#FFE8F5", "#FFC8E8", "#FFA8D8", "#E888C8", "#D868A8"],
        bg: "#FFA8D8",
      },
      {
        id: "parties-5",
        name: "Party Purple",
        desc: "Vibrant purple",
        colors: ["#E8C8F5", "#D8A8E8", "#C888D8", "#B868C8", "#A848B8"],
        bg: "#C888D8",
      },
      {
        id: "parties-6",
        name: "Confetti Yellow",
        desc: "Bright yellow",
        colors: ["#FFF7E7", "#FFE7B7", "#FFD787", "#E8C767", "#D8B747"],
        bg: "#FFD787",
      },
      {
        id: "parties-7",
        name: "Balloon Blue",
        desc: "Sky blue",
        colors: ["#E8F0FF", "#B8D8FF", "#88C0FF", "#68A8FF", "#4890FF"],
        bg: "#88C0FF",
      },
      {
        id: "parties-8",
        name: "Streamer Red",
        desc: "Party red",
        colors: ["#FFE1E1", "#FFB1B1", "#FF8181", "#E86161", "#C84141"],
        bg: "#FF8181",
      },
      {
        id: "parties-9",
        name: "Disco Gold",
        desc: "Shimmering gold",
        colors: ["#FFEDDD", "#FFDDCD", "#FFCDAD", "#E8BD8D", "#D8AD6D"],
        bg: "#FFCDAD",
      },
      {
        id: "parties-10",
        name: "Neon Green",
        desc: "Electric green",
        colors: ["#E8FFE8", "#B8FFB8", "#88FF88", "#68FF68", "#48FF48"],
        bg: "#88FF88",
      },
      {
        id: "parties-11",
        name: "Rainbow",
        desc: "Colorful spectrum",
        colors: ["#FFE8E8", "#FFE8C8", "#FFE8A8", "#E8E8FF", "#D8D8FF"],
        bg: "#FFE8A8",
      },
      {
        id: "parties-12",
        name: "Midnight Party",
        desc: "Dark celebration",
        colors: ["#2A2A4A", "#3A3A5A", "#4A4A6A", "#5A5A7A", "#6A6A8A"],
        bg: "#3A3A5A",
      },
    ];

    // Health & Fitness - 12 color stories
    const healthStories = [
      {
        id: "health-1",
        name: "Garden Bloom",
        desc: "Lush emerald gathers",
        colors: ["#F5EDE4", "#9CC5B3", "#6B9D88", "#4A7662", "#2D5644"],
        bg: "#6B9D88",
      },
      {
        id: "health-2",
        name: "Shimmering Sea",
        desc: "Coastal mist & glitter",
        colors: ["#B5D7E8", "#5B9FB8", "#3D7A95", "#2C5466", "#A8CDDD"],
        bg: "#5B9FB8",
      },
      {
        id: "health-3",
        name: "Verdant Atelier",
        desc: "Botanical inked outlines",
        colors: ["#697864", "#2D4739", "#96C7D4", "#B5D4DD", "#81A494"],
        bg: "#697864",
      },
      {
        id: "health-4",
        name: "Fresh Green",
        desc: "Vitality green",
        colors: ["#D5F5D5", "#95E895", "#5DD85D", "#3DC83D", "#1DA81D"],
        bg: "#5DD85D",
      },
      {
        id: "health-5",
        name: "Ocean Breeze",
        desc: "Cool blue",
        colors: ["#E6F5FF", "#B6E8FF", "#86D8FF", "#66C8FF", "#46A8FF"],
        bg: "#86D8FF",
      },
      {
        id: "health-6",
        name: "Energy Orange",
        desc: "Energetic orange",
        colors: ["#FFE8C8", "#FFD8A8", "#FFC888", "#E8A868", "#D88848"],
        bg: "#FFC888",
      },
      {
        id: "health-7",
        name: "Pure White",
        desc: "Clean white",
        colors: ["#FFFFFF", "#F5F5F5", "#E8E8E8", "#D8D8D8", "#C8C8C8"],
        bg: "#F5F5F5",
      },
      {
        id: "health-8",
        name: "Lime Zest",
        desc: "Fresh lime",
        colors: ["#E8FFE8", "#B8FFB8", "#88FF88", "#68FF68", "#48FF48"],
        bg: "#88FF88",
      },
      {
        id: "health-9",
        name: "Turquoise",
        desc: "Aqua wellness",
        colors: ["#E8F5F5", "#B8E8E8", "#88D8D8", "#68C8C8", "#48A8A8"],
        bg: "#88D8D8",
      },
      {
        id: "health-10",
        name: "Sunrise Yellow",
        desc: "Morning energy",
        colors: ["#FFEEDE", "#FFDECE", "#FFCE9E", "#E8BE7E", "#D8AE5E"],
        bg: "#FFCE9E",
      },
      {
        id: "health-11",
        name: "Mint Fresh",
        desc: "Cool mint",
        colors: ["#E8F5F0", "#B8E8D8", "#88D8C8", "#68C8B8", "#48A898"],
        bg: "#88D8C8",
      },
      {
        id: "health-12",
        name: "Coral Vitality",
        desc: "Warm coral",
        colors: ["#FFE7E7", "#FFB7B7", "#FF8787", "#E86767", "#C84747"],
        bg: "#FF8787",
      },
    ];

    // Clubs & Groups - 12 color stories
    const clubsStories = [
      {
        id: "clubs-1",
        name: "Sage Dusk",
        desc: "Lavender twilight canopy",
        colors: ["#6B86B3", "#4E6BA0", "#1E2C5C", "#B5CEE8", "#8FA6D4"],
        bg: "#4E6BA0",
      },
      {
        id: "clubs-2",
        name: "Velvet Gold",
        desc: "Gilded foliage shine",
        colors: ["#9A967E", "#6B6B4A", "#2C2E1A", "#E4E8DC", "#A8A89E"],
        bg: "#6B6B4A",
      },
      {
        id: "clubs-3",
        name: "Mist Coast",
        desc: "Cool greenhouse glass",
        colors: ["#1C3D52", "#93C5E8", "#B5D7EA", "#7CADC7", "#4A7792"],
        bg: "#1C3D52",
      },
      {
        id: "clubs-4",
        name: "Unity Blue",
        desc: "Togetherness blue",
        colors: ["#E8F0FF", "#B8D8FF", "#88C0FF", "#68A8FF", "#4890FF"],
        bg: "#88C0FF",
      },
      {
        id: "clubs-5",
        name: "Community Green",
        desc: "Group green",
        colors: ["#E3F5E3", "#B3E8B3", "#83D883", "#63C863", "#43A843"],
        bg: "#83D883",
      },
      {
        id: "clubs-6",
        name: "Friendship Pink",
        desc: "Warm pink",
        colors: ["#FFE8F5", "#FFC8E8", "#FFA8D8", "#E888C8", "#D868A8"],
        bg: "#FFA8D8",
      },
      {
        id: "clubs-7",
        name: "Team Purple",
        desc: "Collaborative purple",
        colors: ["#F5E8F5", "#E8C8E8", "#D8A8D8", "#C888C8", "#B868B8"],
        bg: "#D8A8D8",
      },
      {
        id: "clubs-8",
        name: "Social Orange",
        desc: "Friendly orange",
        colors: ["#FFE8C8", "#FFD8A8", "#FFC888", "#E8A868", "#D88848"],
        bg: "#FFC888",
      },
      {
        id: "clubs-9",
        name: "Gathering Beige",
        desc: "Neutral meeting",
        colors: ["#F5F0E8", "#E8D8C8", "#D8C8B8", "#C8B8A8", "#B8A898"],
        bg: "#D8C8B8",
      },
      {
        id: "clubs-10",
        name: "Activity Red",
        desc: "Active red",
        colors: ["#FFE9E9", "#FFB9B9", "#FF8989", "#E86969", "#C84949"],
        bg: "#FF8989",
      },
      {
        id: "clubs-11",
        name: "Meeting Gray",
        desc: "Professional gray",
        colors: ["#E8E8E8", "#C8C8C8", "#A8A8A8", "#888888", "#686868"],
        bg: "#A8A8A8",
      },
      {
        id: "clubs-12",
        name: "Together Teal",
        desc: "Unified teal",
        colors: ["#E8F5F5", "#B8E8E8", "#88D8D8", "#68C8C8", "#48A8A8"],
        bg: "#88D8D8",
      },
    ];

    // General - 12 color stories
    const generalStories = [
      {
        id: "general-1",
        name: "Mist Coast",
        desc: "Cool greenhouse glass",
        colors: ["#1C3D52", "#93C5E8", "#B5D7EA", "#7CADC7", "#4A7792"],
        bg: "#1C3D52",
      },
      {
        id: "general-2",
        name: "Sage Dusk",
        desc: "Lavender twilight canopy",
        colors: ["#6B86B3", "#4E6BA0", "#1E2C5C", "#B5CEE8", "#8FA6D4"],
        bg: "#4E6BA0",
      },
      {
        id: "general-3",
        name: "Velvet Gold",
        desc: "Gilded foliage shine",
        colors: ["#9A967E", "#6B6B4A", "#2C2E1A", "#E4E8DC", "#A8A89E"],
        bg: "#6B6B4A",
      },
      {
        id: "general-4",
        name: "Tramontane",
        desc: "Noir dusk breeze",
        colors: ["#5D5247", "#7A6B7A", "#D9A884", "#3D2E1A", "#4A3834"],
        bg: "#5D5247",
      },
      {
        id: "general-5",
        name: "Neutral Gray",
        desc: "Versatile gray",
        colors: ["#E8E8E8", "#C8C8C8", "#A8A8A8", "#888888", "#686868"],
        bg: "#A8A8A8",
      },
      {
        id: "general-6",
        name: "Classic Blue",
        desc: "Timeless blue",
        colors: ["#E8F0FF", "#B8D8FF", "#88C0FF", "#68A8FF", "#4890FF"],
        bg: "#88C0FF",
      },
      {
        id: "general-7",
        name: "Warm Beige",
        desc: "Comfortable beige",
        colors: ["#F5F0E8", "#E8D8C8", "#D8C8B8", "#C8B8A8", "#B8A898"],
        bg: "#D8C8B8",
      },
      {
        id: "general-8",
        name: "Soft White",
        desc: "Clean white",
        colors: ["#FFFFFF", "#F5F5F5", "#E8E8E8", "#D8D8D8", "#C8C8C8"],
        bg: "#F5F5F5",
      },
      {
        id: "general-9",
        name: "Muted Green",
        desc: "Calm green",
        colors: ["#E6F5E6", "#B6E8B6", "#86D886", "#66C866", "#46A846"],
        bg: "#86D886",
      },
      {
        id: "general-10",
        name: "Earth Brown",
        desc: "Natural brown",
        colors: ["#8B6B4A", "#6B4A2A", "#4A2A1A", "#A88B6B", "#C8A88B"],
        bg: "#8B6B4A",
      },
      {
        id: "general-11",
        name: "Sky Blue",
        desc: "Light blue",
        colors: ["#E4F5FF", "#B4E8FF", "#84D8FF", "#64C8FF", "#44A8FF"],
        bg: "#84D8FF",
      },
      {
        id: "general-12",
        name: "Charcoal",
        desc: "Dark neutral",
        colors: ["#2A2A2A", "#3A3A3A", "#4A4A4A", "#5A5A5A", "#6A6A6A"],
        bg: "#3A3A3A",
      },
    ];

    // Other / Special Interest - 12 color stories
    const otherStories = [
      {
        id: "other-1",
        name: "Verdant Atelier",
        desc: "Botanical inked outlines",
        colors: ["#697864", "#2D4739", "#96C7D4", "#B5D4DD", "#81A494"],
        bg: "#697864",
      },
      {
        id: "other-2",
        name: "Trellis Brass",
        desc: "Gilded lattice cues",
        colors: ["#E8D99F", "#B89F5F", "#6B5D3B", "#3D2E1A", "#F5EDD1"],
        bg: "#B89F5F",
      },
      {
        id: "other-3",
        name: "Petal Script",
        desc: "Painterly blush swash",
        colors: ["#5D3834", "#F5EDE4", "#DDB9B9", "#D9A884", "#B8876B"],
        bg: "#F5EDE4",
      },
      {
        id: "other-4",
        name: "Sage Dusk",
        desc: "Lavender twilight canopy",
        colors: ["#6B86B3", "#4E6BA0", "#1E2C5C", "#B5CEE8", "#8FA6D4"],
        bg: "#4E6BA0",
      },
      {
        id: "other-5",
        name: "Unique Purple",
        desc: "Distinctive purple",
        colors: ["#E8C8F5", "#D8A8E8", "#C888D8", "#B868C8", "#A848B8"],
        bg: "#C888D8",
      },
      {
        id: "other-6",
        name: "Special Teal",
        desc: "Unique teal",
        colors: ["#E8F5F5", "#B8E8E8", "#88D8D8", "#68C8C8", "#48A8A8"],
        bg: "#88D8D8",
      },
      {
        id: "other-7",
        name: "Custom Orange",
        desc: "Personal orange",
        colors: ["#FFE8C8", "#FFD8A8", "#FFC888", "#E8A868", "#D88848"],
        bg: "#FFC888",
      },
      {
        id: "other-8",
        name: "Distinctive Red",
        desc: "Standout red",
        colors: ["#FFEBEB", "#FFBBBB", "#FF8B8B", "#E86B6B", "#C84B4B"],
        bg: "#FF8B8B",
      },
      {
        id: "other-9",
        name: "Rare Green",
        desc: "Uncommon green",
        colors: ["#E1F5E1", "#B1E8B1", "#81D881", "#61C861", "#41A841"],
        bg: "#81D881",
      },
      {
        id: "other-10",
        name: "Exotic Pink",
        desc: "Unusual pink",
        colors: ["#FFE8F5", "#FFC8E8", "#FFA8D8", "#E888C8", "#D868A8"],
        bg: "#FFA8D8",
      },
      {
        id: "other-11",
        name: "Mystery Blue",
        desc: "Intriguing blue",
        colors: ["#E8F0FF", "#B8D8FF", "#88C0FF", "#68A8FF", "#4890FF"],
        bg: "#88C0FF",
      },
      {
        id: "other-12",
        name: "Eclectic Mix",
        desc: "Varied colors",
        colors: ["#FFE8E8", "#FFE8C8", "#FFE8A8", "#E8E8FF", "#D8D8FF"],
        bg: "#FFE8A8",
      },
    ];

    // Combine all stories
    const allStories = [
      ...springStories,
      ...summerStories,
      ...schoolStories,
      ...fallStories,
      ...churchStories,
      ...sportsStories,
      ...fundraisingStories,
      ...familyStories,
      ...businessStories,
      ...partiesStories,
      ...healthStories,
      ...clubsStories,
      ...generalStories,
      ...otherStories,
    ];

    // Process each story to add gradients and text colors
    allStories.forEach((story) => {
      const bgIsDark = isDarkColor(story.bg);

      // Calculate background brightness
      const bgR = parseInt(story.bg.slice(1, 3), 16);
      const bgG = parseInt(story.bg.slice(3, 5), 16);
      const bgB = parseInt(story.bg.slice(5, 7), 16);
      const bgBrightness = (bgR * 299 + bgG * 587 + bgB * 114) / 1000;

      const lightest = getLightestColor(story.colors);
      const darkest = getDarkestColor(story.colors);

      // Calculate brightness for lightest and darkest colors
      const lightestR = parseInt(lightest.slice(1, 3), 16);
      const lightestG = parseInt(lightest.slice(3, 5), 16);
      const lightestB = parseInt(lightest.slice(5, 7), 16);
      const lightestBrightness =
        (lightestR * 299 + lightestG * 587 + lightestB * 114) / 1000;

      const darkestR = parseInt(darkest.slice(1, 3), 16);
      const darkestG = parseInt(darkest.slice(3, 5), 16);
      const darkestB = parseInt(darkest.slice(5, 7), 16);
      const darkestBrightness =
        (darkestR * 299 + darkestG * 587 + darkestB * 114) / 1000;

      // Ensure proper contrast: dark backgrounds need light text, light backgrounds need dark text
      // For dark backgrounds (brightness < 128), use white or very light colors (brightness > 200)
      // For light backgrounds (brightness >= 128), use black or very dark colors (brightness < 100)
      let textColor1: string;
      let textColor2: string;

      if (bgIsDark) {
        // Dark background: need light text
        if (lightestBrightness > 200) {
          textColor1 = lightest;
        } else {
          textColor1 = "#FFFFFF"; // Use white for maximum contrast
        }
        textColor2 = "#FFFFFF"; // Always white for main title on dark backgrounds
      } else {
        // Light background: need dark text
        if (darkestBrightness < 100) {
          textColor1 = darkest;
        } else {
          textColor1 = "#111827"; // Use near-black for maximum contrast
        }
        textColor2 = darkestBrightness < 100 ? darkest : "#111827"; // Use darkest or near-black
      }

      // Create gradient from first two colors
      const gradientColor1 = hexToRgba(story.colors[0], 0.95);
      const gradientColor2 = hexToRgba(
        story.colors[1] || story.colors[0],
        0.85
      );
      const bgCss = createGradient(gradientColor1, gradientColor2);

      stories.push({
        id: story.id,
        name: story.name,
        description: story.desc,
        colors: story.colors,
        bgColor: story.bg,
        bgCss,
        textColor1,
        textColor2,
        buttonColor: story.colors[2] || story.colors[0],
        buttonTextColor: bgIsDark ? textColor1 : darkest,
      });
    });

    return stories;
  };

  const PRESETS = generateColorStories();

  // Map theme designs to their color stories
  const THEME_COLOR_STORIES: Record<string, string[]> = {
    Spring: PRESETS.filter((p) => p.id.startsWith("spring-")).map((p) => p.id),
    Summer: PRESETS.filter((p) => p.id.startsWith("summer-")).map((p) => p.id),
    "School & Education": PRESETS.filter((p) => p.id.startsWith("school-")).map(
      (p) => p.id
    ),
    "Fall & Seasonal": PRESETS.filter((p) => p.id.startsWith("fall-")).map(
      (p) => p.id
    ),
    "Church & Community": PRESETS.filter((p) => p.id.startsWith("church-")).map(
      (p) => p.id
    ),
    "Sports & Recreation": PRESETS.filter((p) =>
      p.id.startsWith("sports-")
    ).map((p) => p.id),
    "Fundraising & Food": PRESETS.filter((p) =>
      p.id.startsWith("fundraising-")
    ).map((p) => p.id),
    "Family & Personal": PRESETS.filter((p) => p.id.startsWith("family-")).map(
      (p) => p.id
    ),
    "Business & Professional": PRESETS.filter((p) =>
      p.id.startsWith("business-")
    ).map((p) => p.id),
    "Parties & Events": PRESETS.filter((p) => p.id.startsWith("parties-")).map(
      (p) => p.id
    ),
    "Health & Fitness": PRESETS.filter((p) => p.id.startsWith("health-")).map(
      (p) => p.id
    ),
    "Clubs & Groups": PRESETS.filter((p) => p.id.startsWith("clubs-")).map(
      (p) => p.id
    ),
    General: PRESETS.filter((p) => p.id.startsWith("general-")).map(
      (p) => p.id
    ),
    "Other / Special Interest": PRESETS.filter((p) =>
      p.id.startsWith("other-")
    ).map((p) => p.id),
  };

  const [themeMenuOpen, setThemeMenuOpen] = React.useState(false);
  const [templateMenuOpen, setTemplateMenuOpen] = React.useState(false);
  const [themeImagesQuery, setThemeImagesQuery] = React.useState("");
  const [themeImagesSearchOpen, setThemeImagesSearchOpen] =
    React.useState(false);

  const TEMPLATE_OPTIONS = [
    { id: "header-1", label: "1. Left" },
    { id: "header-2", label: "2. Right" },
    { id: "header-3", label: "3. Full-width banner" },
    { id: "header-4", label: "4. Banner + square left" },
    { id: "header-5", label: "5. Two images" },
    { id: "header-6", label: "6. Three images" },
  ] as const;

  const renderTemplateThumbSvg = (id: string) => {
    switch (id) {
      case "header-1":
        return (
          <svg
            viewBox="0 0 80 48"
            className="w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="80" height="48" fill="#F3F4F6" />
            <rect x="8" y="8" width="24" height="32" rx="4" fill="#D1D5DB" />
            <rect x="36" y="10" width="36" height="8" rx="2" fill="#E5E7EB" />
            <rect x="36" y="22" width="30" height="6" rx="2" fill="#E5E7EB" />
            <rect x="36" y="32" width="20" height="4" rx="2" fill="#E5E7EB" />
          </svg>
        );
      case "header-2":
        return (
          <svg
            viewBox="0 0 80 48"
            className="w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="80" height="48" fill="#F3F4F6" />
            <rect x="48" y="8" width="24" height="32" rx="4" fill="#D1D5DB" />
            <rect x="8" y="10" width="36" height="8" rx="2" fill="#E5E7EB" />
            <rect x="8" y="22" width="30" height="6" rx="2" fill="#E5E7EB" />
            <rect x="8" y="32" width="20" height="4" rx="2" fill="#E5E7EB" />
          </svg>
        );
      case "header-3":
        return (
          <svg
            viewBox="0 0 80 48"
            className="w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="80" height="48" fill="#F3F4F6" />
            <rect x="8" y="8" width="64" height="24" rx="4" fill="#D1D5DB" />
            <rect x="12" y="36" width="28" height="4" rx="2" fill="#E5E7EB" />
            <rect x="44" y="36" width="24" height="4" rx="2" fill="#E5E7EB" />
          </svg>
        );
      case "header-4":
        return (
          <svg
            viewBox="0 0 80 48"
            className="w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="80" height="48" fill="#F3F4F6" />
            <rect x="8" y="8" width="64" height="18" rx="4" fill="#D1D5DB" />
            <rect x="12" y="22" width="20" height="20" rx="4" fill="#E5E7EB" />
            <rect x="36" y="28" width="32" height="4" rx="2" fill="#E5E7EB" />
          </svg>
        );
      case "header-5":
        return (
          <svg
            viewBox="0 0 80 48"
            className="w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="80" height="48" fill="#F3F4F6" />
            <rect x="10" y="12" width="26" height="24" rx="4" fill="#D1D5DB" />
            <rect x="44" y="12" width="26" height="24" rx="4" fill="#D1D5DB" />
          </svg>
        );
      case "header-6":
        return (
          <svg
            viewBox="0 0 80 48"
            className="w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="80" height="48" fill="#F3F4F6" />
            <rect x="10" y="12" width="18" height="24" rx="4" fill="#D1D5DB" />
            <rect x="31" y="12" width="18" height="24" rx="4" fill="#D1D5DB" />
            <rect x="52" y="12" width="18" height="24" rx="4" fill="#D1D5DB" />
          </svg>
        );
      default:
        return (
          <svg
            viewBox="0 0 80 48"
            className="w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="80" height="48" fill="#F3F4F6" />
            <rect x="8" y="8" width="64" height="32" rx="4" fill="#D1D5DB" />
          </svg>
        );
    }
  };

  const renderThemeThumbSvg = (name: SignupDesignTheme) => {
    switch (name) {
      case "Spring":
        return (
          <svg
            viewBox="0 0 80 48"
            className="w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="80" height="48" fill="#F0FDF4" />
            <circle cx="20" cy="28" r="8" fill="#F472B6" />
            <circle cx="28" cy="20" r="6" fill="#FDE68A" />
            <circle cx="36" cy="28" r="8" fill="#34D399" />
            <path
              d="M55 34 C60 28, 70 28, 75 34"
              stroke="#10B981"
              strokeWidth="4"
              fill="none"
            />
          </svg>
        );
      case "Summer":
        return (
          <svg
            viewBox="0 0 80 48"
            className="w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="80" height="48" fill="#FFFBEB" />
            <circle cx="18" cy="16" r="10" fill="#F59E0B" />
            <path d="M0 36 C20 30, 40 42, 80 34" fill="#93C5FD" />
            <path d="M0 40 C25 34, 45 46, 80 38" fill="#60A5FA" />
          </svg>
        );
      case "School & Education":
        return (
          <svg
            viewBox="0 0 80 48"
            className="w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="80" height="48" fill="#EEF2FF" />
            <rect x="12" y="14" width="26" height="18" rx="2" fill="#3B82F6" />
            <line
              x1="16"
              y1="20"
              x2="34"
              y2="20"
              stroke="#BFDBFE"
              strokeWidth="2"
            />
            <line
              x1="16"
              y1="24"
              x2="34"
              y2="24"
              stroke="#BFDBFE"
              strokeWidth="2"
            />
            <polygon points="54,14 74,20 54,26" fill="#F59E0B" />
            <rect x="54" y="26" width="20" height="4" fill="#92400E" />
          </svg>
        );
      case "Fall & Seasonal":
        return (
          <svg
            viewBox="0 0 80 48"
            className="w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="80" height="48" fill="#FFF7ED" />
            <path
              d="M18 22 C22 16, 30 16, 34 22 C30 20, 22 24, 18 22"
              fill="#EA580C"
            />
            <path
              d="M44 26 C48 20, 58 20, 62 26 C58 24, 48 28, 44 26"
              fill="#F59E0B"
            />
            <rect x="10" y="34" width="60" height="6" fill="#FCD34D" />
          </svg>
        );
      case "Church & Community":
        return (
          <svg
            viewBox="0 0 80 48"
            className="w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="80" height="48" fill="#ECFEFF" />
            <rect x="12" y="18" width="18" height="14" fill="#0EA5E9" />
            <polygon points="12,18 21,12 30,18" fill="#38BDF8" />
            <circle cx="52" cy="28" r="6" fill="#22C55E" />
            <circle cx="64" cy="30" r="5" fill="#86EFAC" />
          </svg>
        );
      case "Sports & Recreation":
        return (
          <svg
            viewBox="0 0 80 48"
            className="w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="80" height="48" fill="#F0FDF4" />
            <circle cx="24" cy="24" r="9" fill="#FB923C" />
            <line
              x1="24"
              y1="15"
              x2="24"
              y2="33"
              stroke="#9A3412"
              strokeWidth="2"
            />
            <line
              x1="15"
              y1="24"
              x2="33"
              y2="24"
              stroke="#9A3412"
              strokeWidth="2"
            />
            <rect x="46" y="22" width="20" height="4" fill="#22C55E" />
          </svg>
        );
      case "Fundraising & Food":
        return (
          <svg
            viewBox="0 0 80 48"
            className="w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="80" height="48" fill="#FEF2F2" />
            <path
              d="M20 30 C20 22, 34 22, 34 30 C34 36, 20 36, 20 30 Z"
              fill="#EF4444"
            />
            <rect x="44" y="22" width="18" height="10" rx="2" fill="#F59E0B" />
            <rect x="64" y="22" width="2" height="10" fill="#92400E" />
            <rect x="68" y="22" width="2" height="10" fill="#92400E" />
          </svg>
        );
      case "Family & Personal":
        return (
          <svg
            viewBox="0 0 80 48"
            className="w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="80" height="48" fill="#FDF2F8" />
            <circle cx="24" cy="22" r="5" fill="#EC4899" />
            <rect x="18" y="28" width="12" height="6" rx="3" fill="#F472B6" />
            <circle cx="44" cy="22" r="5" fill="#8B5CF6" />
            <rect x="38" y="28" width="12" height="6" rx="3" fill="#A78BFA" />
          </svg>
        );
      case "Business & Professional":
        return (
          <svg
            viewBox="0 0 80 48"
            className="w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="80" height="48" fill="#EFF6FF" />
            <rect x="12" y="20" width="20" height="12" rx="2" fill="#334155" />
            <rect x="16" y="16" width="12" height="6" rx="1" fill="#64748B" />
            <polyline
              points="46,30 54,24 62,28 70,18"
              fill="none"
              stroke="#3B82F6"
              strokeWidth="2"
            />
          </svg>
        );
      case "Parties & Events":
        return (
          <svg
            viewBox="0 0 80 48"
            className="w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="80" height="48" fill="#FFF7ED" />
            <circle cx="20" cy="18" r="6" fill="#F59E0B" />
            <rect x="14" y="24" width="12" height="10" rx="2" fill="#FCA5A5" />
            <path d="M44 12 L50 26 L38 26 Z" fill="#60A5FA" />
            <rect x="36" y="26" width="16" height="4" fill="#3B82F6" />
            <circle cx="64" cy="22" r="5" fill="#A78BFA" />
          </svg>
        );
      case "Health & Fitness":
        return (
          <svg
            viewBox="0 0 80 48"
            className="w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="80" height="48" fill="#F0FDF4" />
            <rect x="18" y="22" width="12" height="4" fill="#059669" />
            <rect x="50" y="22" width="12" height="4" fill="#059669" />
            <rect x="30" y="20" width="20" height="8" fill="#10B981" />
            <circle cx="40" cy="18" r="4" fill="#34D399" />
          </svg>
        );
      case "Clubs & Groups":
        return (
          <svg
            viewBox="0 0 80 48"
            className="w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="80" height="48" fill="#ECFEFF" />
            <circle cx="26" cy="22" r="6" fill="#0EA5E9" />
            <circle cx="40" cy="26" r="6" fill="#22D3EE" />
            <circle cx="54" cy="22" r="6" fill="#38BDF8" />
            <rect x="20" y="32" width="40" height="6" rx="3" fill="#67E8F9" />
          </svg>
        );
      case "General":
        return (
          <svg
            viewBox="0 0 80 48"
            className="w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="80" height="48" fill="#F3F4F6" />
            <polygon
              points="40,8 46,24 64,24 50,34 56,46 40,38 24,46 30,34 16,24 34,24"
              fill="#9CA3AF"
            />
          </svg>
        );
      default:
        return (
          <svg
            viewBox="0 0 80 48"
            className="w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="80" height="48" fill="#F5F5F4" />
            <polygon
              points="40,8 46,24 64,24 50,34 56,46 40,38 24,46 30,34 16,24 34,24"
              fill="#93C5FD"
            />
          </svg>
        );
    }
  };

  const toggleReminder = (value: number) => {
    const exists = settings.autoRemindersHoursBefore.includes(value);
    const next = exists
      ? settings.autoRemindersHoursBefore.filter((n) => n !== value)
      : [...settings.autoRemindersHoursBefore, value];
    next.sort((a, b) => a - b);
    setSettings({ autoRemindersHoursBefore: next });
  };

  const handleAddReminderPrompt = () => {
    if (typeof window === "undefined") return;
    const answer = window
      .prompt(
        "Send a reminder how many hours before the event? (Example: 36)",
        "36"
      )
      ?.trim();
    if (!answer) return;
    const hours = Number.parseInt(answer, 10);
    if (!Number.isFinite(hours) || hours <= 0) {
      window.alert("Enter a positive number of hours.");
      return;
    }
    const sanitized = Math.max(1, Math.min(24 * 14, Math.round(hours)));
    const next = Array.from(
      new Set([...settings.autoRemindersHoursBefore, sanitized])
    ).sort((a, b) => a - b);
    setSettings({ autoRemindersHoursBefore: next });
  };

  const handleSectionChange = (sectionId: string, next: SignupFormSection) => {
    onChange({
      ...form,
      sections: form.sections.map((section) =>
        section.id === sectionId ? next : section
      ),
    });
  };

  const handleSectionMove = (index: number, direction: -1 | 1) => {
    const next = moveItem(form.sections, index, index + direction);
    onChange({ ...form, sections: next });
  };

  const handleSectionDuplicate = (section: SignupFormSection) => {
    const index = form.sections.findIndex(
      (candidate) => candidate.id === section.id
    );
    if (index === -1) return;
    onChange({
      ...form,
      sections: [
        ...form.sections.slice(0, index + 1),
        duplicateSection(section),
        ...form.sections.slice(index + 1),
      ],
    });
  };

  const handleSectionRemove = (section: SignupFormSection) => {
    onChange({
      ...form,
      sections: form.sections.filter(
        (candidate) => candidate.id !== section.id
      ),
    });
  };

  const handleSlotChange = (
    sectionId: string,
    slotId: string,
    next: SignupFormSlot
  ) => {
    onChange({
      ...form,
      sections: form.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              slots: section.slots.map((slot) =>
                slot.id === slotId ? next : slot
              ),
            }
          : section
      ),
    });
  };

  const handleSlotMove = (
    sectionId: string,
    slotId: string,
    direction: -1 | 1
  ) => {
    onChange({
      ...form,
      sections: form.sections.map((section) => {
        if (section.id !== sectionId) return section;
        const index = section.slots.findIndex((slot) => slot.id === slotId);
        if (index === -1) return section;
        return {
          ...section,
          slots: moveItem(section.slots, index, index + direction),
        };
      }),
    });
  };

  const handleSlotDuplicate = (sectionId: string, slot: SignupFormSlot) => {
    onChange({
      ...form,
      sections: form.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              slots: (() => {
                const slotIndex = section.slots.findIndex(
                  (candidate) => candidate.id === slot.id
                );
                if (slotIndex === -1) return section.slots;
                const copy = [...section.slots];
                copy.splice(slotIndex + 1, 0, duplicateSlot(slot));
                return copy;
              })(),
            }
          : section
      ),
    });
  };

  const handleSlotRemove = (sectionId: string, slotId: string) => {
    onChange({
      ...form,
      sections: form.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              slots: section.slots.filter((slot) => slot.id !== slotId),
            }
          : section
      ),
    });
  };

  const handleAddSlot = (sectionId: string) => {
    onChange({
      ...form,
      sections: form.sections.map((section) =>
        section.id === sectionId
          ? { ...section, slots: [...section.slots, createSignupSlot()] }
          : section
      ),
    });
  };

  const handleAddSection = () => {
    onChange({ ...form, sections: [...form.sections, createSignupSection()] });
  };

  const handleAddQuestion = () => {
    onChange({
      ...form,
      questions: addQuestion(form.questions || []),
    });
  };

  const handleQuestionChange = (id: string, next: Partial<SignupQuestion>) => {
    onChange({
      ...form,
      questions: (form.questions || []).map((question) =>
        question.id === id ? { ...question, ...next } : question
      ),
    });
  };

  const handleQuestionRemove = (id: string) => {
    onChange({
      ...form,
      questions: (form.questions || []).filter(
        (question) => question.id !== id
      ),
    });
  };

  const headerFileInputRef = React.useRef<HTMLInputElement | null>(null);
  const galleryFileInputRef = React.useRef<HTMLInputElement | null>(null);
  const uploadTargetIndexRef = React.useRef<number | null>(null);

  const handleHeaderFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0] || null;
    if (!file) {
      setHeader({ backgroundImage: null });
      return;
    }
    const dataUrl = await readFileAsDataUrl(file);
    const thumb = (await createThumbnailDataUrl(file, 600, 0.85)) as
      | string
      | null;
    setHeader({
      backgroundImage: {
        name: file.name,
        type: file.type,
        dataUrl: thumb || dataUrl,
      },
    });
  };

  const [previewFixedHeightPx, setPreviewFixedHeightPx] = React.useState(240);
  const [previewFloating, setPreviewFloating] = React.useState(true);
  const previewRef = React.useRef<HTMLDivElement | null>(null);
  const sentinelRef = React.useRef<HTMLDivElement | null>(null);
  const lastToggleAtRef = React.useRef(0);
  const overlapRef = React.useRef<HTMLDivElement | null>(null);

  // Gallery image selection modal
  const [galleryImageIndex, setGalleryImageIndex] = React.useState<
    number | null
  >(null);

  // Keep the spacer in sync with the preview's live height to avoid jump/IO thrash
  React.useLayoutEffect(() => {
    if (!previewRef.current) return;
    const node = previewRef.current;
    const update = () => {
      const h = node.offsetHeight || 240;
      if (h !== previewFixedHeightPx) setPreviewFixedHeightPx(h);
    };
    update();
    const RO = (window as any).ResizeObserver;
    const ro = RO
      ? new RO((entries: any[]) => {
          if (!Array.isArray(entries) || entries.length === 0) return;
          update();
        })
      : null;
    if (ro) ro.observe(node);
    return () => ro && ro.disconnect();
  }, [previewFixedHeightPx]);

  React.useEffect(() => {
    if (!sentinelRef.current) return;
    const node = sentinelRef.current;
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        const now = Date.now();
        if (now - lastToggleAtRef.current < 120) return; // hysteresis to prevent rapid flip near boundary
        const shouldFloat = !entry.isIntersecting;
        if (shouldFloat !== previewFloating) {
          lastToggleAtRef.current = now;
          setPreviewFloating(shouldFloat);
        }
      },
      {
        root: null,
        threshold: 0,
        // Un-float as soon as the sentinel enters the viewport
        rootMargin: `0px 0px 0px 0px`,
      }
    );
    io.observe(node);
    return () => io.disconnect();
  }, [previewFixedHeightPx, previewFloating]);

  // Additional guard: if a sentinel above the image placement area enters the lower
  // viewport zone, un-float the preview to keep it inside the form boundaries.
  React.useEffect(() => {
    if (!overlapRef.current) return;
    const node = overlapRef.current;
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        const now = Date.now();
        if (now - lastToggleAtRef.current < 120) return;
        const shouldFloat = !entry.isIntersecting;
        if (shouldFloat !== previewFloating) {
          lastToggleAtRef.current = now;
          setPreviewFloating(shouldFloat);
        }
      },
      {
        root: null,
        threshold: 0,
        // Dock as soon as the guard sentinel appears
        rootMargin: `0px 0px 0px 0px`,
      }
    );
    io.observe(node);
    return () => io.disconnect();
  }, [previewFixedHeightPx, previewFloating]);

  return (
    <div className="space-y-6">
      {showBasics && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Form Title
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(event) =>
                  onChange({ ...form, title: event.target.value })
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="Example: Volunteer & supply sign-up"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Group Name
              </label>
              <input
                type="text"
                value={form.header?.groupName || ""}
                onChange={(e) => setHeader({ groupName: e.target.value })}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="Your group or team"
              />
            </div>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-medium text-gray-700">
              Headline Description
            </label>
            <textarea
              value={form.description || ""}
              onChange={(event) =>
                onChange({ ...form, description: event.target.value })
              }
              rows={3}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="Let guests know how to prepare."
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Venue</label>
              <input
                type="text"
                value={(form as any).venue || ""}
                onChange={(e) =>
                  onChange({ ...(form as any), venue: e.target.value })
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="e.g., Central Park"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                aria-required="true"
                value={(form as any).location || ""}
                onChange={(e) =>
                  onChange({ ...(form as any), location: e.target.value })
                }
                className={`w-full rounded-lg border bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition focus:outline-none focus:ring-2 ${
                  showBasicsErrors &&
                  (typeof (form as any).location !== "string" ||
                    !(form as any).location.trim())
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                    : "border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
                }`}
                placeholder="Street, City, State"
              />
              {showBasicsErrors &&
                (typeof (form as any).location !== "string" ||
                  !(form as any).location.trim()) && (
                  <p className="text-xs text-red-600">Address is required.</p>
                )}
            </div>
          </div>

          {/* Date and time */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Date</label>
              <input
                type="date"
                value={(((form as any).start as string) || "").slice(0, 10)}
                onChange={(e) => {
                  const date = e.target.value;
                  const current = ((form as any).start as string) || "";
                  const time = current.includes("T")
                    ? current.split("T")[1].slice(0, 5)
                    : "00:00";
                  const isoLocal = date ? `${date}T${time}` : null;
                  onChange({ ...(form as any), start: isoLocal });
                }}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Time</label>
              <input
                type="time"
                value={(() => {
                  const s = ((form as any).start as string) || "";
                  if (!s.includes("T")) return "";
                  return s.split("T")[1].slice(0, 5);
                })()}
                onChange={(e) => {
                  const time = e.target.value || "00:00";
                  const current = ((form as any).start as string) || "";
                  const date = current ? current.slice(0, 10) : "";
                  const today = new Date();
                  const yyyy = String(today.getFullYear()).padStart(4, "0");
                  const mm = String(today.getMonth() + 1).padStart(2, "0");
                  const dd = String(today.getDate()).padStart(2, "0");
                  const fallbackDate = `${yyyy}-${mm}-${dd}`;
                  const baseDate = date || fallbackDate;
                  const isoLocal = `${baseDate}T${time}`;
                  onChange({ ...(form as any), start: isoLocal });
                }}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            {/* Removed manual background color control */}
            {/* Theme design picker (between Headline description and Image template) */}
            <div className="space-y-1 sm:col-span-2 min-w-0 max-w-full">
              <label className="block text-xs font-semibold uppercase tracking-wide text-foreground/60">
                Theme design
              </label>
              {/* Small screens: dropdown with thumbnail */}
              <div className="relative md:hidden">
                <button
                  type="button"
                  onClick={() => setThemeMenuOpen((o) => !o)}
                  className="w-full flex items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm"
                >
                  <span className="inline-flex items-center gap-2">
                    <span className="h-6 w-10 overflow-hidden rounded bg-muted grid place-items-center">
                      {form.header?.designTheme ? (
                        renderThemeThumbSvg(
                          form.header.designTheme as SignupDesignTheme
                        )
                      ) : (
                        <svg
                          viewBox="0 0 80 48"
                          className="w-full h-full"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <rect width="80" height="48" fill="#F3F4F6" />
                          <rect
                            x="18"
                            y="16"
                            width="44"
                            height="16"
                            rx="3"
                            fill="#E5E7EB"
                          />
                        </svg>
                      )}
                    </span>
                    <span className="truncate">
                      {form.header?.designTheme || "Choose your theme"}
                    </span>
                  </span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="opacity-70"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.08 1.04l-4.25 4.25a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                {themeMenuOpen && (
                  <div className="absolute z-10 mt-1 w-full rounded-md border border-border bg-background shadow">
                    <ul className="max-h-64 overflow-auto py-1">
                      {THEME_NAMES.map((name) => (
                        <li key={name}>
                          <button
                            type="button"
                            onClick={() => {
                              setHeader({ designTheme: name as any });
                              setThemeMenuOpen(false);
                            }}
                            className={`flex w-full items-center gap-2 px-2 py-2 text-left text-sm hover:bg-muted/40 ${
                              (form.header?.designTheme || "") === name
                                ? "bg-muted/30"
                                : ""
                            }`}
                          >
                            <span className="h-6 w-10 overflow-hidden rounded bg-muted grid place-items-center">
                              {renderThemeThumbSvg(name as SignupDesignTheme)}
                            </span>
                            <span className="truncate">{name}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* md+ screens: 5-column grid */}
              <div className="hidden md:grid grid-cols-5 gap-2">
                {THEME_NAMES.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setHeader({ designTheme: name as any })}
                    className={`relative w-full rounded-lg border ${
                      (form.header?.designTheme || "") === name
                        ? "border-foreground"
                        : "border-border"
                    }`}
                    title={name}
                  >
                    <div className="h-12 rounded-t-lg overflow-hidden bg-background grid place-items-center">
                      {renderThemeThumbSvg(name as SignupDesignTheme)}
                    </div>
                    <div className="px-2 py-1 text-left">
                      <div className="text-[11px] font-semibold truncate">
                        {name}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Theme images header with search */}
            <div className="sm:col-span-2 flex items-center justify-between min-w-0 max-w-full gap-2">
              <label className="block text-xs font-semibold uppercase tracking-wide text-foreground/60 truncate min-w-0">
                Theme images
              </label>
              <div className="flex items-center gap-2 flex-shrink-0">
                {themeImagesSearchOpen ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={themeImagesQuery}
                      onChange={(e) => setThemeImagesQuery(e.target.value)}
                      placeholder="Search..."
                      autoFocus
                      className="h-8 w-32 rounded-md border border-border bg-background px-2 text-sm"
                      onBlur={() => {
                        if (!themeImagesQuery.trim()) {
                          setThemeImagesSearchOpen(false);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") {
                          setThemeImagesSearchOpen(false);
                          setThemeImagesQuery("");
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setThemeImagesSearchOpen(false);
                        setThemeImagesQuery("");
                      }}
                      className="h-8 w-8 rounded-md border border-border bg-background flex items-center justify-center hover:bg-muted"
                      title="Close search"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setThemeImagesSearchOpen(true)}
                    className="h-8 w-8 rounded-md border border-border bg-background flex items-center justify-center hover:bg-muted"
                    title="Search theme images"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="9" cy="9" r="6" />
                      <path d="m17 17-4-4" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            {/* Theme images carousel (from public/templates/signup/<Theme>) */}
            <ThemeImagesCarousel
              themeName={
                (form.header?.designTheme || (THEME_NAMES[0] as any)) as any
              }
              onPick={React.useCallback(
                (url: string) => {
                  const templateId = form.header?.templateId || "header-1";
                  const imageObj = {
                    name: url.split("/").pop() || "theme-image",
                    type: "image/jpeg",
                    dataUrl: url,
                  };

                  // For templates 3, 4, 5, 6, set the first image to images[0]
                  // For templates 1, 2, set it to backgroundImage
                  if (
                    templateId === "header-3" ||
                    templateId === "header-4" ||
                    templateId === "header-5" ||
                    templateId === "header-6"
                  ) {
                    const currentImages = Array.isArray(form.header?.images)
                      ? [...form.header!.images!]
                      : [];
                    // Ensure array has at least one slot
                    if (currentImages.length === 0) {
                      currentImages.push({
                        id: generateSignupId(),
                        ...imageObj,
                      });
                    } else {
                      // Set at index 0, preserving other images
                      currentImages[0] = {
                        id: currentImages[0]?.id || generateSignupId(),
                        ...imageObj,
                      };
                    }
                    setHeader({ images: currentImages });
                  } else {
                    // For templates 1 and 2, use backgroundImage
                    setHeader({
                      backgroundImage: imageObj,
                    });
                  }
                },
                [form.header?.templateId, form.header?.images, setHeader]
              )}
              searchQuery={themeImagesQuery}
              allNames={THEME_NAMES as unknown as string[]}
              selectedUrl={(() => {
                const templateId = form.header?.templateId || "header-1";
                if (
                  templateId === "header-3" ||
                  templateId === "header-4" ||
                  templateId === "header-5" ||
                  templateId === "header-6"
                ) {
                  return form.header?.images?.[0]?.dataUrl || null;
                }
                return form.header?.backgroundImage?.dataUrl || null;
              })()}
            />
            <div className="space-y-1 sm:col-span-2 min-w-0 max-w-full">
              <label className="block text-xs font-semibold uppercase tracking-wide text-foreground/60">
                Color stories
              </label>
              <div className="flex flex-wrap gap-3 max-w-full">
                {(() => {
                  const selectedTheme =
                    form.header?.designTheme || THEME_NAMES[0];
                  const themeColorStoryIds =
                    THEME_COLOR_STORIES[selectedTheme] || [];
                  const filteredPresets = PRESETS.filter((p) =>
                    themeColorStoryIds.includes(p.id)
                  );
                  return filteredPresets.map((p) => {
                    // Use pre-calculated text colors from PRESETS
                    const textColor1 = p.textColor1 || "#374151";
                    const textColor2 =
                      p.textColor2 || p.textColor1 || "#111827";

                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() =>
                          setHeader({
                            themeId: p.id,
                            backgroundColor: p.bgColor,
                            backgroundCss: p.bgCss || null,
                            textColor1: textColor1,
                            textColor2: textColor2 || textColor1,
                            buttonColor: p.buttonColor || null,
                            buttonTextColor: p.buttonTextColor || null,
                          })
                        }
                        className={`flex-1 min-w-[150px] border rounded-2xl p-[0.65rem] bg-[#f7f4f0] cursor-pointer flex flex-col gap-[0.45rem] transition-all duration-[120ms] ease text-left ${
                          (form.header?.themeId || "") === p.id
                            ? "border-[rgba(199,153,100,0.9)] shadow-[0_12px_30px_rgba(12,0,6,0.2)]"
                            : "border-[rgba(0,0,0,0.08)] hover:border-[rgba(199,153,100,0.6)] hover:-translate-y-0.5"
                        }`}
                        style={{ color: "rgba(21, 12, 9, 0.9)" }}
                        title={`${p.name} - ${p.description}`}
                      >
                        {/* Color circles */}
                        <div className="flex gap-[0.3rem]">
                          {p.colors.map((color, idx) => (
                            <span
                              key={idx}
                              className="w-[18px] h-[18px] rounded-full border border-[rgba(0,0,0,0.08)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.4)]"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>

                        {/* Text content */}
                        <div className="flex flex-col text-[0.65rem] leading-[1.2] tracking-[0.1em] uppercase">
                          <span>{p.name}</span>
                          <small className="text-[0.6rem] text-[rgba(21,12,9,0.55)] normal-case tracking-[0.05em]">
                            {p.description}
                          </small>
                        </div>
                      </button>
                    );
                  });
                })()}
              </div>
            </div>

            <div className="space-y-1 sm:col-span-2 min-w-0 max-w-full">
              <label className="block text-xs font-semibold uppercase tracking-wide text-foreground/60">
                Image template
              </label>
              {/* Small screens: dropdown with thumbnail */}
              <div className="relative md:hidden">
                <button
                  type="button"
                  onClick={() => setTemplateMenuOpen((o) => !o)}
                  className="w-full flex items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm"
                >
                  <span className="inline-flex items-center gap-2">
                    <span className="h-6 w-10 overflow-hidden rounded bg-muted grid place-items-center">
                      {renderTemplateThumbSvg(
                        (form.header?.templateId || "") as string
                      )}
                    </span>
                    <span className="truncate">
                      {(() => {
                        const current = TEMPLATE_OPTIONS.find(
                          (t) => t.id === (form.header?.templateId || "")
                        );
                        return current ? current.label : "Choose layout";
                      })()}
                    </span>
                  </span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="opacity-70"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.08 1.04l-4.25 4.25a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                {templateMenuOpen && (
                  <div className="absolute z-10 mt-1 w-full rounded-md border border-border bg-background shadow">
                    <ul className="max-h-64 overflow-auto py-1">
                      {TEMPLATE_OPTIONS.map((opt) => (
                        <li key={opt.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setHeader({ templateId: opt.id as any });
                              setTemplateMenuOpen(false);
                            }}
                            className={`flex w-full items-center gap-2 px-2 py-2 text-left text-sm hover:bg-muted/40 ${
                              (form.header?.templateId || "") === opt.id
                                ? "bg-muted/30"
                                : ""
                            }`}
                          >
                            <span className="h-6 w-10 overflow-hidden rounded bg-muted grid place-items-center">
                              {renderTemplateThumbSvg(opt.id as string)}
                            </span>
                            <span className="truncate">{opt.label}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* md+ screens: existing button group */}
              <div className="hidden md:inline-flex gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setHeader({ templateId: "header-1" })}
                  className={`px-3 py-1 text-xs rounded-md border ${
                    (form.header?.templateId || "header-1") === "header-1"
                      ? "bg-foreground text-background"
                      : "bg-background"
                  }`}
                >
                  1. Left
                </button>
                <button
                  type="button"
                  onClick={() => setHeader({ templateId: "header-2" })}
                  className={`px-3 py-1 text-xs rounded-md border ${
                    form.header?.templateId === "header-2"
                      ? "bg-foreground text-background"
                      : "bg-background"
                  }`}
                >
                  2. Right
                </button>
                <button
                  type="button"
                  onClick={() => setHeader({ templateId: "header-3" })}
                  className={`px-3 py-1 text-xs rounded-md border ${
                    form.header?.templateId === "header-3"
                      ? "bg-foreground text-background"
                      : "bg-background"
                  }`}
                >
                  3. Full-width banner
                </button>
                <button
                  type="button"
                  onClick={() => setHeader({ templateId: "header-4" })}
                  className={`px-3 py-1 text-xs rounded-md border ${
                    form.header?.templateId === "header-4"
                      ? "bg-foreground text-background"
                      : "bg-background"
                  }`}
                >
                  4. Banner + square left
                </button>
                <button
                  type="button"
                  onClick={() => setHeader({ templateId: "header-5" })}
                  className={`px-3 py-1 text-xs rounded-md border ${
                    form.header?.templateId === "header-5"
                      ? "bg-foreground text-background"
                      : "bg-background"
                  }`}
                >
                  5. Two images
                </button>
                <button
                  type="button"
                  onClick={() => setHeader({ templateId: "header-6" })}
                  className={`px-3 py-1 text-xs rounded-md border ${
                    form.header?.templateId === "header-6"
                      ? "bg-foreground text-background"
                      : "bg-background"
                  }`}
                >
                  6. Three images
                </button>
              </div>
            </div>
            {/* Hidden file inputs */}
            <input
              ref={headerFileInputRef}
              type="file"
              accept="image/*"
              onChange={handleHeaderFileChange}
              className="hidden"
            />
            <input
              ref={galleryFileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file && uploadTargetIndexRef.current !== null) {
                  // Upload to specific index
                  await uploadImageToIndex(uploadTargetIndexRef.current, file);
                  uploadTargetIndexRef.current = null;
                } else {
                  // Use default behavior (add to gallery)
                  await addGalleryImages(e.target.files);
                }
                // Reset input
                e.target.value = "";
              }}
              className="hidden"
            />
            {/* Preview (bottom of Basics) */}
            <div className="sm:col-span-2 min-w-0 max-w-full">
              <div className="relative z-10 w-full max-w-[720px] min-w-0">
                <div className="rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm">
                  <div className="bg-white backdrop-blur supports-[backdrop-filter]:backdrop-blur max-h-[70vh] overflow-auto">
                    <section
                      className="px-5 py-6"
                      style={{
                        backgroundColor:
                          form.header?.backgroundColor || undefined,
                        backgroundImage:
                          form.header?.backgroundCss || undefined,
                        backgroundSize: form.header?.backgroundCss
                          ? "cover"
                          : undefined,
                        backgroundPosition: form.header?.backgroundCss
                          ? "center"
                          : undefined,
                      }}
                    >
                      <p
                        className="text-xs mb-2 text-center opacity-75"
                        style={{
                          color: form.header?.textColor1 || "#374151",
                        }}
                      >
                        Header preview
                      </p>
                      {(form.header?.templateId || "header-1") ===
                        "header-3" && (
                        <div className="mb-4 relative">
                          {form.header?.images?.[0]?.dataUrl ? (
                            <div className="group relative w-full h-48 sm:h-64 md:h-72 rounded-xl border border-gray-200 overflow-hidden">
                              <img
                                src={form.header.images[0].dataUrl}
                                alt="banner"
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                                <button
                                  type="button"
                                  onClick={() =>
                                    galleryFileInputRef.current?.click()
                                  }
                                  className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors shadow-lg"
                                  aria-label="Replace image"
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
                                    <path d="M18.5 20L18.5 14M18.5 14L21 16.5M18.5 14L16 16.5" />
                                    <path d="M12 19H5C3.89543 19 3 18.1046 3 17V7C3 5.89543 3.89543 5 5 5H9.58579C9.851 5 10.1054 5.10536 10.2929 5.29289L12 7H19C20.1046 7 21 7.89543 21 9V11" />
                                  </svg>
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const newImages =
                                      form.header?.images?.filter(
                                        (_, i) => i !== 0
                                      ) || [];
                                    setHeader({
                                      images:
                                        newImages.length > 0 ? newImages : null,
                                    });
                                  }}
                                  className="p-2 bg-white rounded-full hover:bg-red-100 transition-colors shadow-lg"
                                  aria-label="Delete image"
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="h-4 w-4 text-red-600"
                                  >
                                    <path d="M3 6h18" />
                                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                galleryFileInputRef.current?.click()
                              }
                              className="w-full h-48 sm:h-64 md:h-72 rounded-xl border border-dashed border-gray-200 grid place-items-center text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors"
                            >
                              Full-width image
                            </button>
                          )}
                        </div>
                      )}
                      {(form.header?.templateId || "header-1") ===
                        "header-4" && (
                        <div className="relative mb-16">
                          {form.header?.images?.[0]?.dataUrl ? (
                            <div className="group relative w-full h-40 sm:h-56 rounded-xl border border-gray-200 overflow-hidden">
                              <img
                                src={form.header.images[0].dataUrl}
                                alt="banner"
                                className="w-full h-full object-cover"
                              />
                              {/* Number label overlay */}
                              <div className="absolute top-2 left-2 bg-black/60 text-white text-xs font-semibold rounded-full w-6 h-6 flex items-center justify-center">
                                1
                              </div>
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setGalleryImageIndex(0);
                                  }}
                                  className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors shadow-lg"
                                  aria-label="Select from gallery"
                                  title="Select from gallery"
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
                                    <rect
                                      x="3"
                                      y="3"
                                      width="18"
                                      height="18"
                                      rx="2"
                                      ry="2"
                                    />
                                    <circle cx="9" cy="9" r="2" />
                                    <path d="M21 15l-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                                  </svg>
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    uploadTargetIndexRef.current = 0;
                                    galleryFileInputRef.current?.click();
                                  }}
                                  className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors shadow-lg"
                                  aria-label="Upload file"
                                  title="Upload file"
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
                                    <path d="M18.5 20L18.5 14M18.5 14L21 16.5M18.5 14L16 16.5" />
                                    <path d="M12 19H5C3.89543 19 3 18.1046 3 17V7C3 5.89543 3.89543 5 5 5H9.58579C9.851 5 10.1054 5.10536 10.2929 5.29289L12 7H19C20.1046 7 21 7.89543 21 9V11" />
                                  </svg>
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const newImages =
                                      form.header?.images?.filter(
                                        (_, i) => i !== 0
                                      ) || [];
                                    setHeader({
                                      images:
                                        newImages.length > 0 ? newImages : null,
                                    });
                                  }}
                                  className="p-2 bg-white rounded-full hover:bg-red-100 transition-colors shadow-lg"
                                  aria-label="Delete image"
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="h-4 w-4 text-red-600"
                                  >
                                    <path d="M3 6h18" />
                                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="w-full h-40 sm:h-56 rounded-xl border border-dashed border-gray-200 flex flex-col items-center justify-center gap-3 hover:bg-gray-50 transition-colors p-4">
                              <span className="text-gray-600 text-sm font-medium">
                                Banner image
                              </span>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => setGalleryImageIndex(0)}
                                  className="px-3 py-2 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-1.5"
                                  title="Select from gallery"
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="h-3 w-3"
                                  >
                                    <rect
                                      x="3"
                                      y="3"
                                      width="18"
                                      height="18"
                                      rx="2"
                                      ry="2"
                                    />
                                    <circle cx="9" cy="9" r="2" />
                                    <path d="M21 15l-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                                  </svg>
                                  Gallery
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    uploadTargetIndexRef.current = 0;
                                    galleryFileInputRef.current?.click();
                                  }}
                                  className="px-3 py-2 text-xs font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-1.5"
                                  title="Upload file"
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="h-3 w-3"
                                  >
                                    <path d="M18.5 20L18.5 14M18.5 14L21 16.5M18.5 14L16 16.5" />
                                    <path d="M12 19H5C3.89543 19 3 18.1046 3 17V7C3 5.89543 3.89543 5 5 5H9.58579C9.851 5 10.1054 5.10536 10.2929 5.29289L12 7H19C20.1046 7 21 7.89543 21 9V11" />
                                  </svg>
                                  Upload
                                </button>
                              </div>
                            </div>
                          )}
                          <div className="absolute left-6 -bottom-10">
                            {form.header?.images?.[1]?.dataUrl ? (
                              <div className="group relative w-40 h-40 rounded-xl border border-gray-200 shadow-lg overflow-hidden">
                                <img
                                  src={form.header.images[1].dataUrl}
                                  alt="square"
                                  className="w-full h-full object-cover"
                                />
                                {/* Number label overlay */}
                                <div className="absolute top-2 left-2 bg-black/60 text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center">
                                  2
                                </div>
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setGalleryImageIndex(1);
                                    }}
                                    className="p-1.5 bg-white rounded-full hover:bg-gray-100 transition-colors shadow-lg"
                                    aria-label="Replace image"
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      className="h-3 w-3"
                                    >
                                      <path d="M18.5 20L18.5 14M18.5 14L21 16.5M18.5 14L16 16.5" />
                                      <path d="M12 19H5C3.89543 19 3 18.1046 3 17V7C3 5.89543 3.89543 5 5 5H9.58579C9.851 5 10.1054 5.10536 10.2929 5.29289L12 7H19C20.1046 7 21 7.89543 21 9V11" />
                                    </svg>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const newImages =
                                        form.header?.images?.filter(
                                          (_, i) => i !== 1
                                        ) || [];
                                      setHeader({
                                        images:
                                          newImages.length > 0
                                            ? newImages
                                            : null,
                                      });
                                    }}
                                    className="p-1.5 bg-white rounded-full hover:bg-red-100 transition-colors shadow-lg"
                                    aria-label="Delete image"
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      className="h-3 w-3 text-red-600"
                                    >
                                      <path d="M3 6h18" />
                                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            ) : form.header?.backgroundImage?.dataUrl ? (
                              <div className="group relative w-40 h-40 rounded-xl border border-gray-200 shadow-lg overflow-hidden">
                                <img
                                  src={form.header.backgroundImage.dataUrl}
                                  alt="square"
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setGalleryImageIndex(1);
                                    }}
                                    className="p-1.5 bg-white rounded-full hover:bg-gray-100 transition-colors shadow-lg"
                                    aria-label="Replace image"
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      className="h-3 w-3"
                                    >
                                      <path d="M18.5 20L18.5 14M18.5 14L21 16.5M18.5 14L16 16.5" />
                                      <path d="M12 19H5C3.89543 19 3 18.1046 3 17V7C3 5.89543 3.89543 5 5 5H9.58579C9.851 5 10.1054 5.10536 10.2929 5.29289L12 7H19C20.1046 7 21 7.89543 21 9V11" />
                                    </svg>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setHeader({ backgroundImage: null });
                                    }}
                                    className="p-1.5 bg-white rounded-full hover:bg-red-100 transition-colors shadow-lg"
                                    aria-label="Delete image"
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      className="h-3 w-3 text-red-600"
                                    >
                                      <path d="M3 6h18" />
                                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="w-40 h-40 rounded-xl border border-dashed border-gray-200 bg-gray-100 hover:bg-gray-200 transition-colors flex flex-col items-center justify-center gap-2 p-2">
                                <span className="text-gray-600 text-xs font-medium">
                                  Top-left image
                                </span>
                                <div className="flex flex-col gap-1.5 w-full">
                                  <button
                                    type="button"
                                    onClick={() => setGalleryImageIndex(1)}
                                    className="px-2 py-1 text-[10px] font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-1"
                                    title="Select from gallery"
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      className="h-2.5 w-2.5"
                                    >
                                      <rect
                                        x="3"
                                        y="3"
                                        width="18"
                                        height="18"
                                        rx="2"
                                        ry="2"
                                      />
                                      <circle cx="9" cy="9" r="2" />
                                      <path d="M21 15l-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                                    </svg>
                                    Gallery
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      uploadTargetIndexRef.current = 1;
                                      galleryFileInputRef.current?.click();
                                    }}
                                    className="px-2 py-1 text-[10px] font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 transition-colors flex items-center justify-center gap-1"
                                    title="Upload file"
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      className="h-2.5 w-2.5"
                                    >
                                      <path d="M18.5 20L18.5 14M18.5 14L21 16.5M18.5 14L16 16.5" />
                                      <path d="M12 19H5C3.89543 19 3 18.1046 3 17V7C3 5.89543 3.89543 5 5 5H9.58579C9.851 5 10.1054 5.10536 10.2929 5.29289L12 7H19C20.1046 7 21 7.89543 21 9V11" />
                                    </svg>
                                    Upload
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      <div
                        className={`grid gap-4 items-start ${
                          (form.header?.templateId || "header-1") === "header-2"
                            ? "md:grid-cols-[1fr_325px]"
                            : (form.header?.templateId || "header-1") ===
                              "header-4"
                            ? "md:grid-cols-[325px_1fr]"
                            : (form.header?.templateId || "header-1") ===
                              "header-5"
                            ? "md:grid-cols-2"
                            : (form.header?.templateId || "header-1") ===
                              "header-6"
                            ? "md:grid-cols-3"
                            : "md:grid-cols-[325px_1fr]"
                        }`}
                      >
                        {((form.header?.templateId || "header-1") ===
                          "header-1" ||
                          (form.header?.templateId || "header-1") ===
                            "header-2") && (
                          <div
                            className={`relative ${
                              (form.header?.templateId || "header-1") ===
                              "header-2"
                                ? "order-2"
                                : "order-1"
                            }`}
                          >
                            {form.header?.backgroundImage?.dataUrl ? (
                              <div className="group relative w-full max-w-[325px] max-h-[325px] rounded-xl border border-gray-200 overflow-hidden">
                                <img
                                  src={form.header.backgroundImage.dataUrl}
                                  alt="header"
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      headerFileInputRef.current?.click();
                                    }}
                                    className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors shadow-lg"
                                    aria-label="Replace image"
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
                                      <path d="M18.5 20L18.5 14M18.5 14L21 16.5M18.5 14L16 16.5" />
                                      <path d="M12 19H5C3.89543 19 3 18.1046 3 17V7C3 5.89543 3.89543 5 5 5H9.58579C9.851 5 10.1054 5.10536 10.2929 5.29289L12 7H19C20.1046 7 21 7.89543 21 9V11" />
                                    </svg>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setHeader({ backgroundImage: null });
                                    }}
                                    className="p-2 bg-white rounded-full hover:bg-red-100 transition-colors shadow-lg"
                                    aria-label="Delete image"
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      className="h-4 w-4 text-red-600"
                                    >
                                      <path d="M3 6h18" />
                                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  headerFileInputRef.current?.click()
                                }
                                className="w-full max-w-[325px] h-[200px] rounded-xl border border-dashed border-gray-200 grid place-items-center text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors"
                              >
                                Top-left image
                              </button>
                            )}
                          </div>
                        )}
                        {((form.header?.templateId || "header-1") ===
                          "header-5" ||
                          (form.header?.templateId || "header-1") ===
                            "header-6") && (
                          <div
                            className={`${
                              (form.header?.templateId || "header-1") ===
                              "header-6"
                                ? "col-span-3"
                                : "col-span-2"
                            }`}
                          >
                            <div
                              className={`grid gap-3 ${
                                (form.header?.templateId || "header-1") ===
                                "header-6"
                                  ? "grid-cols-3"
                                  : "grid-cols-2"
                              }`}
                            >
                              {((form.header?.templateId || "header-1") ===
                              "header-6"
                                ? [0, 1, 2]
                                : [0, 1]
                              ).map((i) =>
                                form.header?.images?.[i]?.dataUrl ? (
                                  <div
                                    key={i}
                                    className="group relative w-full h-36 rounded-xl border border-gray-200 overflow-hidden"
                                  >
                                    <img
                                      src={form.header.images[i].dataUrl}
                                      alt={`image-${i}`}
                                      className="w-full h-full object-cover"
                                    />
                                    {/* Number label overlay */}
                                    <div className="absolute top-2 left-2 bg-black/60 text-white text-xs font-semibold rounded-full w-6 h-6 flex items-center justify-center">
                                      {i + 1}
                                    </div>
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (i === 1 || i === 2) {
                                            setGalleryImageIndex(i);
                                          } else {
                                            galleryFileInputRef.current?.click();
                                          }
                                        }}
                                        className="p-1.5 bg-white rounded-full hover:bg-gray-100 transition-colors shadow-lg"
                                        aria-label="Replace image"
                                      >
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth="2"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          className="h-3 w-3"
                                        >
                                          <path d="M18.5 20L18.5 14M18.5 14L21 16.5M18.5 14L16 16.5" />
                                          <path d="M12 19H5C3.89543 19 3 18.1046 3 17V7C3 5.89543 3.89543 5 5 5H9.58579C9.851 5 10.1054 5.10536 10.2929 5.29289L12 7H19C20.1046 7 21 7.89543 21 9V11" />
                                        </svg>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const templateId =
                                            form.header?.templateId ||
                                            "header-1";
                                          const currentImages = Array.isArray(
                                            form.header?.images
                                          )
                                            ? [...form.header!.images!]
                                            : [];

                                          // For templates 5 and 6, preserve array structure by setting to null
                                          // For other templates, filter out
                                          if (
                                            templateId === "header-5" ||
                                            templateId === "header-6"
                                          ) {
                                            const newImages = [
                                              ...currentImages,
                                            ];
                                            newImages[i] = {
                                              id: generateSignupId(),
                                              name: "",
                                              type: "image/jpeg",
                                              dataUrl: "",
                                            };
                                            // Clean up trailing empty images
                                            while (
                                              newImages.length > 0 &&
                                              !newImages[newImages.length - 1]
                                                ?.dataUrl
                                            ) {
                                              newImages.pop();
                                            }
                                            setHeader({
                                              images:
                                                newImages.length > 0
                                                  ? newImages
                                                  : null,
                                            });
                                          } else {
                                            const newImages =
                                              currentImages.filter(
                                                (_, idx) => idx !== i
                                              );
                                            setHeader({
                                              images:
                                                newImages.length > 0
                                                  ? newImages
                                                  : null,
                                            });
                                          }
                                        }}
                                        className="p-1.5 bg-white rounded-full hover:bg-red-100 transition-colors shadow-lg"
                                        aria-label="Delete image"
                                      >
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth="2"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          className="h-3 w-3 text-red-600"
                                        >
                                          <path d="M3 6h18" />
                                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                        </svg>
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div
                                    key={i}
                                    className="relative w-full h-36 rounded-xl border border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
                                  >
                                    <span className="text-gray-600 text-sm">
                                      Image {i + 1}
                                    </span>
                                    <div className="flex gap-2">
                                      {i === 1 || i === 2 ? (
                                        <>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              setGalleryImageIndex(i)
                                            }
                                            className="px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-1.5"
                                            title="Select from gallery"
                                          >
                                            <svg
                                              xmlns="http://www.w3.org/2000/svg"
                                              viewBox="0 0 24 24"
                                              fill="none"
                                              stroke="currentColor"
                                              strokeWidth="2"
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              className="h-3 w-3"
                                            >
                                              <rect
                                                x="3"
                                                y="3"
                                                width="18"
                                                height="18"
                                                rx="2"
                                                ry="2"
                                              />
                                              <circle cx="9" cy="9" r="2" />
                                              <path d="M21 15l-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                                            </svg>
                                            Gallery
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              uploadTargetIndexRef.current = i;
                                              galleryFileInputRef.current?.click();
                                            }}
                                            className="px-3 py-1.5 text-xs font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-1.5"
                                            title="Upload file"
                                          >
                                            <svg
                                              xmlns="http://www.w3.org/2000/svg"
                                              viewBox="0 0 24 24"
                                              fill="none"
                                              stroke="currentColor"
                                              strokeWidth="2"
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              className="h-3 w-3"
                                            >
                                              <path d="M18.5 20L18.5 14M18.5 14L21 16.5M18.5 14L16 16.5" />
                                              <path d="M12 19H5C3.89543 19 3 18.1046 3 17V7C3 5.89543 3.89543 5 5 5H9.58579C9.851 5 10.1054 5.10536 10.2929 5.29289L12 7H19C20.1046 7 21 7.89543 21 9V11" />
                                            </svg>
                                            Upload
                                          </button>
                                        </>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            galleryFileInputRef.current?.click()
                                          }
                                          className="px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-1.5"
                                        >
                                          <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="h-3 w-3"
                                          >
                                            <path d="M18.5 20L18.5 14M18.5 14L21 16.5M18.5 14L16 16.5" />
                                            <path d="M12 19H5C3.89543 19 3 18.1046 3 17V7C3 5.89543 3.89543 5 5 5H9.58579C9.851 5 10.1054 5.10536 10.2929 5.29289L12 7H19C20.1046 7 21 7.89543 21 9V11" />
                                          </svg>
                                          Upload
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}
                        <div
                          className={`${
                            (form.header?.templateId || "header-1") ===
                            "header-2"
                              ? "order-1"
                              : "order-2"
                          } flex flex-col gap-3`}
                        >
                          {form.header?.groupName ? (
                            <div
                              className="text-[0.9rem] sm:text-sm font-semibold opacity-85"
                              style={{
                                color: form.header?.textColor1 || "#374151",
                              }}
                            >
                              {form.header.groupName}
                            </div>
                          ) : null}
                          <h3
                            className="text-2xl sm:text-[1.6rem] font-semibold"
                            style={{
                              color:
                                form.header?.textColor2 ||
                                form.header?.textColor1 ||
                                "#111827",
                            }}
                          >
                            {form.title || "Smart sign-up"}
                          </h3>
                        </div>
                      </div>
                      {form.description && (
                        <p
                          className="mt-3 text-[0.95rem] max-w-2xl opacity-90"
                          style={{
                            color: form.header?.textColor1 || "#374151",
                          }}
                        >
                          {form.description}
                        </p>
                      )}
                    </section>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSettings && (
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-foreground mb-1">
                Smart Settings
              </h3>
              <p className="text-sm text-foreground/60">
                Set capacity, deadlines, and preferences
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSettings({ ...DEFAULT_SIGNUP_SETTINGS })}
              className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
            >
              Reset to defaults
            </button>
          </div>

          {/* Smart Settings Section */}
          <div className="space-y-4 bg-muted/30 rounded-2xl p-6 border border-border/50">
            {/* Allow multiple slots */}
            <label className="flex items-start gap-4 group cursor-pointer">
              <div className="relative flex-shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  checked={settings.allowMultipleSlotsPerPerson}
                  onChange={(event) =>
                    setSettings({
                      allowMultipleSlotsPerPerson: event.target.checked,
                    })
                  }
                  className="sr-only"
                />
                <div
                  className={`w-5 h-5 rounded-md border-2 transition-all duration-200 flex items-center justify-center ${
                    settings.allowMultipleSlotsPerPerson
                      ? "bg-gradient-to-br from-purple-500 to-pink-500 border-transparent shadow-lg shadow-purple-500/30"
                      : "border-foreground/30 bg-background group-hover:border-foreground/50"
                  }`}
                >
                  {settings.allowMultipleSlotsPerPerson && (
                    <svg
                      className="w-3.5 h-3.5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
              </div>
              <div className="flex-1">
                <div className="font-semibold text-foreground mb-0.5">
                  Allow guests to claim multiple slots
                </div>
                <p className="text-sm text-foreground/60">
                  Perfect for parents helping in multiple time blocks.
                </p>
              </div>
            </label>

            {/* Max slots per person */}
            <div className="space-y-2 pl-9">
              <label className="text-sm font-medium text-foreground/70">
                Max slots per person
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={settings.maxSlotsPerPerson ?? ""}
                onChange={(event) =>
                  setSettings({
                    maxSlotsPerPerson: event.target.value
                      ? Math.max(
                          1,
                          Math.min(
                            50,
                            Number.parseInt(event.target.value, 10) || 1
                          )
                        )
                      : null,
                  })
                }
                className="w-32 rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground transition-all focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                placeholder="Unlimited"
              />
            </div>

            {/* Enable waitlist */}
            <label className="flex items-start gap-4 group cursor-pointer">
              <div className="relative flex-shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  checked={settings.waitlistEnabled}
                  onChange={(event) =>
                    setSettings({ waitlistEnabled: event.target.checked })
                  }
                  className="sr-only"
                />
                <div
                  className={`w-5 h-5 rounded-md border-2 transition-all duration-200 flex items-center justify-center ${
                    settings.waitlistEnabled
                      ? "bg-gradient-to-br from-purple-500 to-pink-500 border-transparent shadow-lg shadow-purple-500/30"
                      : "border-foreground/30 bg-background group-hover:border-foreground/50"
                  }`}
                >
                  {settings.waitlistEnabled && (
                    <svg
                      className="w-3.5 h-3.5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
              </div>
              <div className="flex-1">
                <div className="font-semibold text-foreground mb-0.5">
                  Enable automatic waitlist
                </div>
                <p className="text-sm text-foreground/60">
                  Overflow sign-ups queue automatically when slots are full.
                </p>
              </div>
            </label>

            {/* Lock when full */}
            <label className="flex items-start gap-4 group cursor-pointer">
              <div className="relative flex-shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  checked={settings.lockWhenFull}
                  onChange={(event) =>
                    setSettings({ lockWhenFull: event.target.checked })
                  }
                  className="sr-only"
                />
                <div
                  className={`w-5 h-5 rounded-md border-2 transition-all duration-200 flex items-center justify-center ${
                    settings.lockWhenFull
                      ? "bg-gradient-to-br from-purple-500 to-pink-500 border-transparent shadow-lg shadow-purple-500/30"
                      : "border-foreground/30 bg-background group-hover:border-foreground/50"
                  }`}
                >
                  {settings.lockWhenFull && (
                    <svg
                      className="w-3.5 h-3.5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
              </div>
              <div className="flex-1">
                <div className="font-semibold text-foreground mb-0.5">
                  Lock slots once capacity is met
                </div>
                <p className="text-sm text-foreground/60">
                  Prevents overbooking. Waitlist still collects interest.
                </p>
              </div>
            </label>

            {/* Show remaining spots */}
            <label className="flex items-start gap-4 group cursor-pointer">
              <div className="relative flex-shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  checked={settings.showRemainingSpots}
                  onChange={(event) =>
                    setSettings({ showRemainingSpots: event.target.checked })
                  }
                  className="sr-only"
                />
                <div
                  className={`w-5 h-5 rounded-md border-2 transition-all duration-200 flex items-center justify-center ${
                    settings.showRemainingSpots
                      ? "bg-gradient-to-br from-purple-500 to-pink-500 border-transparent shadow-lg shadow-purple-500/30"
                      : "border-foreground/30 bg-background group-hover:border-foreground/50"
                  }`}
                >
                  {settings.showRemainingSpots && (
                    <svg
                      className="w-3.5 h-3.5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
              </div>
              <div className="flex-1">
                <div className="font-semibold text-foreground mb-0.5">
                  Show remaining spots to guests
                </div>
                <p className="text-sm text-foreground/60">
                  Creates urgency and builds trust in availability data.
                </p>
              </div>
            </label>

            {/* Hide participant names */}
            <label className="flex items-start gap-4 group cursor-pointer">
              <div className="relative flex-shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  checked={Boolean(settings.hideParticipantNames)}
                  onChange={(event) =>
                    setSettings({
                      hideParticipantNames: event.target.checked,
                    })
                  }
                  className="sr-only"
                />
                <div
                  className={`w-5 h-5 rounded-md border-2 transition-all duration-200 flex items-center justify-center ${
                    settings.hideParticipantNames
                      ? "bg-gradient-to-br from-purple-500 to-pink-500 border-transparent shadow-lg shadow-purple-500/30"
                      : "border-foreground/30 bg-background group-hover:border-foreground/50"
                  }`}
                >
                  {settings.hideParticipantNames && (
                    <svg
                      className="w-3.5 h-3.5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
              </div>
              <div className="flex-1">
                <div className="font-semibold text-foreground mb-0.5">
                  Hide names from participants
                </div>
                <p className="text-sm text-foreground/60">
                  Only the host can see who signed up.
                </p>
              </div>
            </label>

            {/* Collect phone */}
            <label className="flex items-start gap-4 group cursor-pointer">
              <div className="relative flex-shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  checked={settings.collectPhone}
                  onChange={(event) =>
                    setSettings({ collectPhone: event.target.checked })
                  }
                  className="sr-only"
                />
                <div
                  className={`w-5 h-5 rounded-md border-2 transition-all duration-200 flex items-center justify-center ${
                    settings.collectPhone
                      ? "bg-gradient-to-br from-purple-500 to-pink-500 border-transparent shadow-lg shadow-purple-500/30"
                      : "border-foreground/30 bg-background group-hover:border-foreground/50"
                  }`}
                >
                  {settings.collectPhone && (
                    <svg
                      className="w-3.5 h-3.5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
              </div>
              <div className="flex-1">
                <div className="font-semibold text-foreground mb-0.5">
                  Collect mobile numbers
                </div>
                <p className="text-sm text-foreground/60">
                  Useful for last-minute changes or team group texts.
                </p>
              </div>
            </label>

            {/* Collect email */}
            <label className="flex items-start gap-4 group cursor-pointer">
              <div className="relative flex-shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  checked={settings.collectEmail}
                  onChange={(event) =>
                    setSettings({ collectEmail: event.target.checked })
                  }
                  className="sr-only"
                />
                <div
                  className={`w-5 h-5 rounded-md border-2 transition-all duration-200 flex items-center justify-center ${
                    settings.collectEmail
                      ? "bg-gradient-to-br from-purple-500 to-pink-500 border-transparent shadow-lg shadow-purple-500/30"
                      : "border-foreground/30 bg-background group-hover:border-foreground/50"
                  }`}
                >
                  {settings.collectEmail && (
                    <svg
                      className="w-3.5 h-3.5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
              </div>
              <div className="flex-1">
                <div className="font-semibold text-foreground mb-0.5">
                  Collect alternate email
                </div>
                <p className="text-sm text-foreground/60">
                  Guests can route reminders to a personal inbox if needed.
                </p>
              </div>
            </label>
          </div>

          {/* Max Guests Section */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wide text-foreground/60">
              Max guests per sign-up
            </label>
            <input
              type="number"
              min={1}
              max={20}
              value={settings.maxGuestsPerSignup}
              onChange={(event) =>
                setSettings({
                  maxGuestsPerSignup: Math.max(
                    1,
                    Math.min(20, Number.parseInt(event.target.value || "1", 10))
                  ),
                })
              }
              className="w-1/5 rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground transition-all focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
            <p className="text-xs text-foreground/60">
              Let families register multiple attendees at once.
            </p>
          </div>

          {/* Sign-up Window Section */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wide text-foreground/60">
              Sign-up window
            </label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="datetime-local"
                value={settings.signupOpensAt || ""}
                onChange={(e) =>
                  setSettings({ signupOpensAt: e.target.value || null })
                }
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground transition-all focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                placeholder="Opens"
              />
              <input
                type="datetime-local"
                value={settings.signupClosesAt || ""}
                onChange={(e) =>
                  setSettings({ signupClosesAt: e.target.value || null })
                }
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground transition-all focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                placeholder="Closes"
              />
            </div>
            <p className="text-xs text-foreground/60">
              Leave blank to accept sign-ups anytime.
            </p>
          </div>
        </div>
      )}

      {showSections && (
        <div className="space-y-4">
          {form.sections.map((section, index) => (
            <SectionCard
              key={section.id}
              section={section}
              index={index}
              total={form.sections.length}
              onChange={(nextSection) =>
                handleSectionChange(section.id, nextSection)
              }
              onMove={handleSectionMove}
              onDuplicate={handleSectionDuplicate}
              onRemove={handleSectionRemove}
              onSlotChange={handleSlotChange}
              onSlotMove={handleSlotMove}
              onSlotDuplicate={handleSlotDuplicate}
              onSlotRemove={handleSlotRemove}
              onAddSlot={handleAddSlot}
            />
          ))}
          <button
            type="button"
            onClick={handleAddSection}
            className="inline-flex items-center gap-2 rounded-md border border-dashed border-primary/60 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10"
          >
            + Add another section
          </button>
        </div>
      )}

      {showQuestions && (
        <div className="rounded-md border border-border bg-background/80 p-3 sm:p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-semibold text-foreground">
              Custom follow-up questions
            </span>
            <button
              type="button"
              onClick={handleAddQuestion}
              className="inline-flex items-center gap-1 rounded-md border border-dashed border-primary/60 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10"
            >
              + Question
            </button>
          </div>
          {(form.questions || []).length === 0 ? (
            <p className="text-xs text-foreground/60">
              Ask for dietary notes, t-shirt sizes, carpool info, or anything
              else you need.
            </p>
          ) : (
            <div className="space-y-3">
              {(form.questions || []).map((question, index) => (
                <div
                  key={question.id}
                  className="rounded-md border border-border bg-background px-3 py-3 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0 space-y-2">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide text-foreground/60 mb-1">
                          Prompt
                        </label>
                        <input
                          type="text"
                          value={question.prompt}
                          onChange={(event) =>
                            handleQuestionChange(question.id, {
                              prompt: event.target.value,
                            })
                          }
                          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                          placeholder="Example: What time works best for you?"
                        />
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs">
                        <label className="inline-flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={Boolean(question.required)}
                            onChange={(event) =>
                              handleQuestionChange(question.id, {
                                required: event.target.checked,
                              })
                            }
                          />
                          Required to submit
                        </label>
                        <label className="inline-flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={Boolean(question.multiline)}
                            onChange={(event) =>
                              handleQuestionChange(question.id, {
                                multiline: event.target.checked,
                              })
                            }
                          />
                          Use a multi-line answer box
                        </label>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border text-[11px] text-foreground/60">
                        #{index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleQuestionRemove(question.id)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-background text-xs text-red-600 hover:text-red-700"
                        title="Remove question"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Gallery image selection modal */}
      {galleryImageIndex !== null && (
        <div className="fixed inset-0 z-[10000] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">
                Select Image{" "}
                {galleryImageIndex === 0
                  ? "1"
                  : galleryImageIndex === 1
                  ? "2"
                  : galleryImageIndex === 2
                  ? "3"
                  : ""}{" "}
                from Gallery
              </h3>
              <button
                type="button"
                onClick={() => setGalleryImageIndex(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Close modal"
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
            <div className="flex-1 overflow-y-auto p-4">
              <ThemeImagesCarousel
                themeName={
                  (form.header?.designTheme || (THEME_NAMES[0] as any)) as any
                }
                onPick={(url) => {
                  const currentImages = Array.isArray(form.header?.images)
                    ? [...form.header!.images!]
                    : [];

                  // Ensure we have enough slots in the array
                  const newImages = [...currentImages];
                  while (newImages.length <= galleryImageIndex) {
                    newImages.push({
                      id: generateSignupId(),
                      name: "",
                      type: "image/jpeg",
                      dataUrl: "",
                    });
                  }

                  // Set the image at the correct index
                  newImages[galleryImageIndex] = {
                    id:
                      currentImages[galleryImageIndex]?.id ||
                      generateSignupId(),
                    name: url.split("/").pop() || "theme-image",
                    type: "image/jpeg",
                    dataUrl: url,
                  };

                  setHeader({ images: newImages });
                  setGalleryImageIndex(null);
                }}
                searchQuery={themeImagesQuery}
                allNames={THEME_NAMES as unknown as string[]}
                selectedUrl={
                  form.header?.images?.[galleryImageIndex]?.dataUrl || null
                }
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SignupBuilder;
