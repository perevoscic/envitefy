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

// Removed toggle UI: Smart sign-up is always enabled in the modal now.

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

const SignupBuilder: React.FC<Props> = ({ form, onChange, panels }) => {
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

  const setHeader = (next: Partial<NonNullable<SignupForm["header"]>>) => {
    onChange({
      ...form,
      header: { ...(form.header || {}), ...next },
    });
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
      ? form.header!.images!
      : [];
    setHeader({ images: [...current, ...items] });
  };

  const PRESETS: Array<{
    id: string;
    name: string;
    bgColor: string;
    bgCss?: string;
    textColor1?: string;
    textColor2?: string;
    buttonColor?: string;
    buttonTextColor?: string;
  }> = [
    {
      id: "fall-fun",
      name: "Fall Fun",
      bgColor: "#A42D06",
      bgCss:
        "linear-gradient(135deg, rgba(164,45,6,0.92), rgba(214,128,40,0.85))",
      textColor1: "#FAFCCD",
      textColor2: "#FFFFFF",
      buttonColor: "#44AD3C",
      buttonTextColor: "#FFF4C7",
    },
    {
      id: "trusty-blue",
      name: "Trusty Blue + Orange",
      bgColor: "#143A66",
      bgCss:
        "linear-gradient(120deg, rgba(20,58,102,0.95) 0%, rgba(17,92,150,0.85) 100%)",
      textColor1: "#FCEFD5",
      textColor2: "#FFFFFF",
      buttonColor: "#FF7A30",
      buttonTextColor: "#FFF8E7",
    },
    {
      id: "mint-fresh",
      name: "Mint Fresh",
      bgColor: "#D1F1E0",
      bgCss:
        "linear-gradient(135deg, rgba(59,201,159,0.25), rgba(255,255,255,0.6))",
      textColor1: "#176B5B",
      textColor2: "#0D3B34",
      buttonColor: "#176B5B",
      buttonTextColor: "#E7FFF7",
    },
    {
      id: "night-sky",
      name: "Night Sky",
      bgColor: "#334155",
      bgCss: "linear-gradient(180deg, #334155 0%, #1F2937 100%)",
      textColor1: "#E5E7EB",
      textColor2: "#FFFFFF",
      buttonColor: "#60A5FA",
      buttonTextColor: "#0B1220",
    },
    {
      id: "sunset-blend",
      name: "Sunset Blend",
      bgColor: "#F97316",
      bgCss: "linear-gradient(135deg, #F97316 0%, #EF4444 50%, #DB2777 100%)",
      textColor1: "#FFF1E6",
      textColor2: "#FFFFFF",
      buttonColor: "#EA580C",
      buttonTextColor: "#FEF2F2",
    },
    {
      id: "ocean-wave",
      name: "Ocean Wave",
      bgColor: "#0EA5E9",
      bgCss:
        "linear-gradient(120deg, rgba(14,165,233,0.95) 0%, rgba(59,130,246,0.85) 100%)",
      textColor1: "#E0F2FE",
      textColor2: "#FFFFFF",
      buttonColor: "#22D3EE",
      buttonTextColor: "#022C22",
    },
    {
      id: "forest-mist",
      name: "Forest Mist",
      bgColor: "#166534",
      bgCss:
        "linear-gradient(135deg, rgba(22,101,52,0.95), rgba(15,118,110,0.85))",
      textColor1: "#D1FAE5",
      textColor2: "#ECFDF5",
      buttonColor: "#10B981",
      buttonTextColor: "#052E2B",
    },
    {
      id: "royal-plum",
      name: "Royal Plum",
      bgColor: "#6D28D9",
      bgCss:
        "linear-gradient(135deg, rgba(109,40,217,0.95), rgba(147,51,234,0.85))",
      textColor1: "#EDE9FE",
      textColor2: "#FAF5FF",
      buttonColor: "#A855F7",
      buttonTextColor: "#2E1065",
    },
    {
      id: "citrus-light",
      name: "Citrus Light",
      bgColor: "#FDE68A",
      bgCss: "linear-gradient(135deg, #FDE68A 0%, #FCA5A5 100%)",
      textColor1: "#4B5563",
      textColor2: "#1F2937",
      buttonColor: "#F59E0B",
      buttonTextColor: "#1F1302",
    },
    {
      id: "dawn-rose",
      name: "Dawn Rose",
      bgColor: "#FBCFE8",
      bgCss: "linear-gradient(135deg, #FBCFE8 0%, #E9D5FF 100%)",
      textColor1: "#4B5563",
      textColor2: "#1F2937",
      buttonColor: "#EC4899",
      buttonTextColor: "#3B0820",
    },
    {
      id: "steel-sky",
      name: "Steel Sky",
      bgColor: "#93C5FD",
      bgCss: "linear-gradient(135deg, #93C5FD 0%, #A7F3D0 100%)",
      textColor1: "#0F172A",
      textColor2: "#0F172A",
      buttonColor: "#3B82F6",
      buttonTextColor: "#041022",
    },
    {
      id: "berry-splash",
      name: "Berry Splash",
      bgColor: "#F472B6",
      bgCss: "linear-gradient(135deg, #F472B6 0%, #60A5FA 100%)",
      textColor1: "#111827",
      textColor2: "#0F172A",
      buttonColor: "#8B5CF6",
      buttonTextColor: "#1E0E3E",
    },
    {
      id: "charcoal-glow",
      name: "Charcoal Glow",
      bgColor: "#1F2937",
      bgCss: "linear-gradient(135deg, #1F2937 0%, #374151 60%, #4B5563 100%)",
      textColor1: "#F3F4F6",
      textColor2: "#FFFFFF",
      buttonColor: "#93C5FD",
      buttonTextColor: "#0B1220",
    },
    {
      id: "emerald-glow",
      name: "Emerald Glow",
      bgColor: "#064E3B",
      bgCss: "linear-gradient(135deg, #064E3B 0%, #059669 100%)",
      textColor1: "#D1FAE5",
      textColor2: "#ECFDF5",
      buttonColor: "#10B981",
      buttonTextColor: "#052E2B",
    },
    {
      id: "sunrise-peach",
      name: "Sunrise Peach",
      bgColor: "#FDBA74",
      bgCss: "linear-gradient(135deg, #FDBA74 0%, #F472B6 100%)",
      textColor1: "#1F2937",
      textColor2: "#111827",
      buttonColor: "#EC4899",
      buttonTextColor: "#3B0820",
    },
  ];

  // Visual thumbnails for Theme design categories
  const THEME_NAMES = [
    "Spring",
    "Summer",
    "School & Education",
    "Fall & Seasonal",
    "Winter & Holidays",
    "Church & Community",
    "Sports & Recreation",
    "Fundraising, Food, & Events",
    "Family & Personal",
    "Business & Professional",
    "Parties & Events",
    "Health & Fitness",
    "Clubs & Groups",
    "General",
    "Other / Special Interest",
  ] as const;

  const [themeMenuOpen, setThemeMenuOpen] = React.useState(false);
  const [templateMenuOpen, setTemplateMenuOpen] = React.useState(false);

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
      case "Winter & Holidays":
        return (
          <svg
            viewBox="0 0 80 48"
            className="w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="80" height="48" fill="#F8FAFC" />
            <polygon points="40,8 48,22 32,22" fill="#22D3EE" />
            <polygon points="40,14 46,24 34,24" fill="#38BDF8" />
            <circle cx="20" cy="36" r="3" fill="#E5E7EB" />
            <circle cx="40" cy="36" r="3" fill="#E5E7EB" />
            <circle cx="60" cy="36" r="3" fill="#E5E7EB" />
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
      case "Fundraising, Food, & Events":
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
        // Moderate early un-float to avoid overlap but still allow stickiness
        rootMargin: `0px 0px -${Math.max(
          72,
          Math.min(140, Math.round(previewFixedHeightPx * 0.5))
        )}px 0px`,
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
        // Guard zone before image placement to dock preview sooner, but not too early
        rootMargin: `0px 0px -${Math.max(
          100,
          Math.min(180, Math.round(previewFixedHeightPx * 0.7))
        )}px 0px`,
      }
    );
    io.observe(node);
    return () => io.disconnect();
  }, [previewFixedHeightPx, previewFloating]);

  return (
    <section className="rounded-lg border border-border bg-surface/60 px-4 py-4 sm:px-5 sm:py-5 space-y-4">
      <div className="space-y-4">
        {showBasics && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase tracking-wide text-foreground/60">
                Form title
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(event) =>
                  onChange({ ...form, title: event.target.value })
                }
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                placeholder="Example: Volunteer & supply sign-up"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase tracking-wide text-foreground/60">
                Group name
              </label>
              <input
                type="text"
                value={form.header?.groupName || ""}
                onChange={(e) => setHeader({ groupName: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                placeholder="Your group or team"
              />
            </div>
            <div className="space-y-1 hidden">
              <label className="block text-xs font-semibold uppercase tracking-wide text-foreground/60">
                Group name
              </label>
              <input
                type="text"
                value={form.header?.groupName || ""}
                onChange={(e) => setHeader({ groupName: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                placeholder="Your group or team"
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wide text-foreground/60">
                Headline description
              </label>
              <input
                type="text"
                value={form.description || ""}
                onChange={(event) =>
                  onChange({ ...form, description: event.target.value })
                }
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                placeholder="Let guests know how to prepare."
              />
            </div>
            {/* Venue and Address fields */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase tracking-wide text-foreground/60">
                Venue
              </label>
              <input
                type="text"
                value={(form as any).venue || ""}
                onChange={(e) =>
                  onChange({ ...(form as any), venue: e.target.value })
                }
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                placeholder="e.g., Central Park"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase tracking-wide text-foreground/60">
                Address <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                required
                aria-required="true"
                value={(form as any).location || ""}
                onChange={(e) =>
                  onChange({ ...(form as any), location: e.target.value })
                }
                className={`w-full rounded-md border bg-background px-3 py-2 text-sm ${
                  typeof (form as any).location !== "string" ||
                  !(form as any).location.trim()
                    ? "border-red-500"
                    : "border-border"
                }`}
                placeholder="Street, City, State"
              />
              {(typeof (form as any).location !== "string" ||
                !(form as any).location.trim()) && (
                <p className="text-[11px] text-red-600">Address is required.</p>
              )}
            </div>
            {/* Date and time (start) */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase tracking-wide text-foreground/60">
                Date
              </label>
              <input
                type="date"
                value={(((form as any).start as string) || "").slice(0, 10)}
                onChange={(e) => {
                  const date = e.target.value; // YYYY-MM-DD
                  const current = ((form as any).start as string) || "";
                  const time = current.includes("T")
                    ? current.split("T")[1].slice(0, 5)
                    : "00:00";
                  const isoLocal = date ? `${date}T${time}` : null;
                  onChange({ ...(form as any), start: isoLocal });
                }}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase tracking-wide text-foreground/60">
                Time
              </label>
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
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            {/* Removed manual background color control */}
            {/* Theme design picker (between Headline description and Image template) */}
            <div className="space-y-1 sm:col-span-2">
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
            <div className="space-y-1 sm:col-span-2">
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
            <div className="space-y-1 sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wide text-foreground/60">
                Background color
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-5 gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() =>
                      setHeader({
                        themeId: p.id,
                        backgroundColor: p.bgColor,
                        backgroundCss: p.bgCss || null,
                        textColor1: p.textColor1 || null,
                        textColor2: p.textColor2 || null,
                        buttonColor: p.buttonColor || null,
                        buttonTextColor: p.buttonTextColor || null,
                      })
                    }
                    className={`relative w-full rounded-lg border ${
                      (form.header?.themeId || "") === p.id
                        ? "border-foreground"
                        : "border-border"
                    }`}
                    title={p.name}
                  >
                    <div
                      className="h-12 rounded-t-lg"
                      style={{
                        backgroundColor: p.bgColor,
                        backgroundImage: p.bgCss,
                      }}
                    />
                    <div className="px-2 py-1 text-left">
                      <div className="text-[11px] font-semibold truncate">
                        {p.name}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            + <div ref={overlapRef} />
            {/* Image placement (grouped uploads) */}
            <div className="sm:col-span-2 rounded-md border border-border bg-background/80 p-3 sm:p-4 space-y-3">
              <label className="block text-xs uppercase tracking-wide text-foreground/60">
                IMAGE PLACEMENT
              </label>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-foreground/60">
                    Top-left
                  </label>
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      ref={headerFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleHeaderFileChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => headerFileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 rounded-md border border-dashed border-primary/60 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10"
                    >
                      Upload header image
                    </button>
                    {form.header?.backgroundImage?.dataUrl && (
                      <img
                        src={form.header.backgroundImage.dataUrl}
                        alt="header"
                        className="h-12 w-12 rounded border border-border object-cover"
                      />
                    )}
                  </div>
                  <div className="text-xs text-foreground/60">
                    {form.header?.backgroundImage?.name || "No file chosen"}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-foreground/60">
                    Banner
                  </label>
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      ref={galleryFileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={async (e) => {
                        await addGalleryImages(e.target.files);
                      }}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => galleryFileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 rounded-md border border-dashed border-primary/60 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10"
                    >
                      Upload gallery images
                    </button>
                  </div>
                  <div className="text-xs text-foreground/60">
                    {(() => {
                      const count = Array.isArray(form.header?.images)
                        ? form.header!.images!.length
                        : 0;
                      return count
                        ? `${count} image${count === 1 ? "" : "s"} selected`
                        : "No file chosen";
                    })()}
                  </div>
                  {Array.isArray(form.header?.images) &&
                    form.header!.images!.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {form.header!.images!.map((img) => (
                          <img
                            key={img.id}
                            src={img.dataUrl}
                            alt={img.name}
                            className="h-14 w-14 rounded border border-border object-cover"
                          />
                        ))}
                      </div>
                    )}
                </div>
              </div>
            </div>
            {/* Preview (bottom of Basics) */}
            <div className="sm:col-span-2">
              {/* spacer to prevent layout jump when preview is fixed */}
              {previewFloating ? (
                <div style={{ height: `${previewFixedHeightPx}px` }} />
              ) : null}
              <div
                ref={previewRef}
                className={
                  previewFloating
                    ? "fixed left-1/2 -translate-x-1/2 bottom-1 z-30 w-[min(720px,calc(100vw-2rem))]"
                    : "relative z-10"
                }
              >
                <div className="rounded-xl overflow-hidden border shadow-sm bg-background/95 backdrop-blur supports-[backdrop-filter]:backdrop-blur">
                  <section
                    className="px-5 py-6"
                    style={{
                      backgroundColor:
                        form.header?.backgroundColor || undefined,
                      backgroundImage: form.header?.backgroundCss || undefined,
                      backgroundSize: form.header?.backgroundCss
                        ? "cover"
                        : undefined,
                      backgroundPosition: form.header?.backgroundCss
                        ? "center"
                        : undefined,
                    }}
                  >
                    <p className="text-xs text-foreground/70 mb-2 text-center">
                      Header preview
                    </p>
                    {(form.header?.templateId || "header-1") === "header-3" && (
                      <div className="mb-4">
                        {form.header?.images?.[0]?.dataUrl ? (
                          <img
                            src={form.header.images[0].dataUrl}
                            alt="banner"
                            className="w-full h-48 sm:h-64 md:h-72 object-cover rounded-xl border border-border"
                          />
                        ) : (
                          <div className="w-full h-48 sm:h-64 md:h-72 rounded-xl border border-dashed border-border/70 grid place-items-center text-foreground/60">
                            Full-width image
                          </div>
                        )}
                      </div>
                    )}
                    {(form.header?.templateId || "header-1") === "header-4" && (
                      <div className="relative mb-16">
                        {form.header?.images?.[0]?.dataUrl ? (
                          <img
                            src={form.header.images[0].dataUrl}
                            alt="banner"
                            className="w-full h-40 sm:h-56 object-cover rounded-xl border border-border"
                          />
                        ) : (
                          <div className="w-full h-40 sm:h-56 rounded-xl border border-dashed border-border/70 grid place-items-center text-foreground/60">
                            Banner image
                          </div>
                        )}
                        <div className="absolute left-6 -bottom-10">
                          {form.header?.images?.[1]?.dataUrl ? (
                            <img
                              src={form.header.images[1].dataUrl}
                              alt="square"
                              className="w-40 h-40 object-cover rounded-xl border border-border shadow-lg"
                            />
                          ) : form.header?.backgroundImage?.dataUrl ? (
                            <img
                              src={form.header.backgroundImage.dataUrl}
                              alt="square"
                              className="w-40 h-40 object-cover rounded-xl border border-border shadow-lg"
                            />
                          ) : (
                            <div className="w-40 h-40 rounded-xl border border-dashed border-border/70 grid place-items-center text-foreground/60 bg-background/70">
                              Top-left image
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
                            <img
                              src={form.header.backgroundImage.dataUrl}
                              alt="header"
                              className="w-full max-w-[325px] max-h-[325px] rounded-xl border border-border object-cover"
                            />
                          ) : (
                            <div className="w-full max-w-[325px] h-[200px] rounded-xl border border-dashed border-border/70 grid place-items-center text-foreground/60">
                              Top-left image
                            </div>
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
                                <img
                                  key={i}
                                  src={form.header.images[i].dataUrl}
                                  alt={`image-${i}`}
                                  className="w-full h-36 object-cover rounded-xl border border-border"
                                />
                              ) : (
                                <div
                                  key={i}
                                  className="w-full h-36 rounded-xl border border-dashed border-border/70 grid place-items-center text-foreground/60"
                                >
                                  Image {i + 1}
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}
                      <div
                        className={`${
                          (form.header?.templateId || "header-1") === "header-2"
                            ? "order-1"
                            : "order-2"
                        } flex flex-col gap-3`}
                      >
                        {form.header?.groupName ? (
                          <div
                            className="text-xs font-semibold opacity-85"
                            style={{
                              color: form.header?.textColor1 || undefined,
                            }}
                          >
                            {form.header.groupName}
                          </div>
                        ) : null}
                        <h3
                          className="text-lg font-semibold"
                          style={{
                            color: form.header?.textColor2 || undefined,
                          }}
                        >
                          {form.title || "Smart sign-up"}
                        </h3>
                      </div>
                    </div>
                    {form.description && (
                      <p
                        className="mt-3 text-sm max-w-2xl opacity-90"
                        style={{ color: form.header?.textColor1 || undefined }}
                      >
                        {form.description}
                      </p>
                    )}
                  </section>
                </div>
              </div>
              {/* Sentinel placed after the preview; when visible, we unfix the preview so it docks at the bottom */}
              <div ref={sentinelRef} />
            </div>
          </div>
        )}

        {showSettings && (
          <div className="rounded-md border border-border bg-background/80 p-3 sm:p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold text-foreground">
                Smart settings
              </span>
              <button
                type="button"
                onClick={() => setSettings({ ...DEFAULT_SIGNUP_SETTINGS })}
                className="text-xs text-foreground/70 hover:text-foreground underline underline-offset-2"
              >
                Reset to defaults
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={settings.allowMultipleSlotsPerPerson}
                  onChange={(event) =>
                    setSettings({
                      allowMultipleSlotsPerPerson: event.target.checked,
                    })
                  }
                />
                <span>
                  Allow guests to claim multiple slots
                  <span className="block text-xs text-foreground/60">
                    Perfect for parents helping in multiple time blocks.
                  </span>
                </span>
              </label>
              <div className="grid grid-cols-[auto_1fr] items-center gap-2 text-sm">
                <label className="flex items-center gap-2">
                  <span>Max slots per person</span>
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
                  className="w-28 rounded-md border border-border bg-background px-2 py-1 text-sm"
                  placeholder="Unlimited"
                />
              </div>
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={settings.waitlistEnabled}
                  onChange={(event) =>
                    setSettings({ waitlistEnabled: event.target.checked })
                  }
                />
                <span>
                  Enable automatic waitlist
                  <span className="block text-xs text-foreground/60">
                    Overflow sign-ups queue automatically when slots are full.
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={settings.lockWhenFull}
                  onChange={(event) =>
                    setSettings({ lockWhenFull: event.target.checked })
                  }
                />
                <span>
                  Lock slots once capacity is met
                  <span className="block text-xs text-foreground/60">
                    Prevents overbooking. Waitlist still collects interest.
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={settings.showRemainingSpots}
                  onChange={(event) =>
                    setSettings({ showRemainingSpots: event.target.checked })
                  }
                />
                <span>
                  Show remaining spots to guests
                  <span className="block text-xs text-foreground/60">
                    Creates urgency and builds trust in availability data.
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={Boolean(settings.hideParticipantNames)}
                  onChange={(event) =>
                    setSettings({ hideParticipantNames: event.target.checked })
                  }
                />
                <span>
                  Hide names from participants
                  <span className="block text-xs text-foreground/60">
                    Only the host can see who signed up.
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={settings.collectPhone}
                  onChange={(event) =>
                    setSettings({ collectPhone: event.target.checked })
                  }
                />
                <span>
                  Collect mobile numbers
                  <span className="block text-xs text-foreground/60">
                    Useful for last-minute changes or team group texts.
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={settings.collectEmail}
                  onChange={(event) =>
                    setSettings({ collectEmail: event.target.checked })
                  }
                />
                <span>
                  Collect alternate email
                  <span className="block text-xs text-foreground/60">
                    Guests can route reminders to a personal inbox if needed.
                  </span>
                </span>
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-foreground/60 mb-1">
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
                        Math.min(
                          20,
                          Number.parseInt(event.target.value || "1", 10)
                        )
                      ),
                    })
                  }
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
                <p className="mt-1 text-[11px] text-foreground/60">
                  Let families register multiple attendees at once.
                </p>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-foreground/60 mb-1">
                  Automated reminders
                </label>
                <div className="flex flex-wrap gap-2">
                  {REMINDER_PRESETS.map((option) => {
                    const checked = settings.autoRemindersHoursBefore.includes(
                      option.value
                    );
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => toggleReminder(option.value)}
                        className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                          checked
                            ? "border-transparent bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white shadow"
                            : "border-border bg-background text-foreground"
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={handleAddReminderPrompt}
                    className="rounded-full border border-dashed border-primary/60 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/10"
                  >
                    + Custom
                  </button>
                </div>
                <p className="mt-2 text-[11px] text-foreground/60">
                  Active:{" "}
                  {settings.autoRemindersHoursBefore.length
                    ? settings.autoRemindersHoursBefore
                        .slice()
                        .sort((a, b) => a - b)
                        .map((hours) =>
                          hours >= 24
                            ? `${Math.round(hours / 24)} day${
                                hours / 24 === 1 ? "" : "s"
                              }`
                            : `${hours} hour${hours === 1 ? "" : "s"}`
                        )
                        .join(", ")
                    : "None"}
                </p>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-foreground/60 mb-1">
                  Sign-up window
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="datetime-local"
                    value={settings.signupOpensAt || ""}
                    onChange={(e) =>
                      setSettings({ signupOpensAt: e.target.value || null })
                    }
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    placeholder="Opens"
                  />
                  <input
                    type="datetime-local"
                    value={settings.signupClosesAt || ""}
                    onChange={(e) =>
                      setSettings({ signupClosesAt: e.target.value || null })
                    }
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    placeholder="Closes"
                  />
                </div>
                <p className="mt-1 text-[11px] text-foreground/60">
                  Leave blank to accept sign-ups anytime.
                </p>
              </div>
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
      </div>
    </section>
  );
};

export default SignupBuilder;
