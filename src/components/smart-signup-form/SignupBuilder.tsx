"use client";

import React from "react";
import { useSession } from "next-auth/react";
import type {
  SignupForm,
  SignupFormSection,
  SignupFormSlot,
  SignupQuestion,
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
      bgColor: "#1A1B2E",
      bgCss:
        "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.08), transparent 40%), radial-gradient(circle at 80% 30%, rgba(255,255,255,0.06), transparent 45%), linear-gradient(180deg, rgba(26,27,46,1) 0%, rgba(13,14,29,1) 100%)",
      textColor1: "#D7E3FF",
      textColor2: "#FFFFFF",
      buttonColor: "#6EA8FE",
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
  ];

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

  return (
    <section className="rounded-lg border border-border bg-surface/60 px-4 py-4 sm:px-5 sm:py-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-xl space-y-1">
          <p className="text-xs text-foreground/70 leading-relaxed">
            Better than static spreadsheets. Create roles, time slots, and
            supply lists in minutes. We’ll auto-manage waitlists, limit
            sign-ups, and send reminders so no one drops the ball.
          </p>
        </div>
      </div>

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
            {/* Removed manual background color control */}
            <div className="space-y-1 sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wide text-foreground/60">
                Image template
              </label>
              <div className="inline-flex gap-2 flex-wrap">
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
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
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
                      <div className="text-[10px] text-foreground/60">
                        {p.id}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wide text-foreground/60">
                Header image (top-left)
              </label>
              <div className="flex items-center gap-3 text-xs">
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0] || null;
                    if (!file) {
                      setHeader({ backgroundImage: null });
                      return;
                    }
                    const dataUrl = await readFileAsDataUrl(file);
                    const thumb = (await createThumbnailDataUrl(
                      file,
                      600,
                      0.85
                    )) as string | null;
                    setHeader({
                      backgroundImage: {
                        name: file.name,
                        type: file.type,
                        dataUrl: thumb || dataUrl,
                      },
                    });
                  }}
                  className="text-sm"
                />
                {form.header?.backgroundImage?.dataUrl && (
                  <img
                    src={form.header.backgroundImage.dataUrl}
                    alt="header"
                    className="h-12 w-12 rounded border border-border object-cover"
                  />
                )}
              </div>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wide text-foreground/60">
                Gallery images (for headers 3, 4, 5, 6)
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={async (e) => {
                  await addGalleryImages(e.target.files);
                }}
              />
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
            <div className="sm:col-span-2">
              <div className="rounded-xl overflow-hidden border">
                <section
                  className="px-5 py-6"
                  style={{
                    backgroundColor: form.header?.backgroundColor || undefined,
                    backgroundImage: form.header?.backgroundCss || undefined,
                    backgroundSize: form.header?.backgroundCss
                      ? "cover"
                      : undefined,
                    backgroundPosition: form.header?.backgroundCss
                      ? "center"
                      : undefined,
                  }}
                >
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
                        : (form.header?.templateId || "header-1") === "header-4"
                        ? "md:grid-cols-[325px_1fr]"
                        : (form.header?.templateId || "header-1") === "header-5"
                        ? "md:grid-cols-2"
                        : (form.header?.templateId || "header-1") === "header-6"
                        ? "md:grid-cols-3"
                        : "md:grid-cols-[325px_1fr]"
                    }`}
                  >
                    {((form.header?.templateId || "header-1") === "header-1" ||
                      (form.header?.templateId || "header-1") ===
                        "header-2") && (
                      <div
                        className={`relative ${
                          (form.header?.templateId || "header-1") === "header-2"
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
                    {((form.header?.templateId || "header-1") === "header-5" ||
                      (form.header?.templateId || "header-1") ===
                        "header-6") && (
                      <div
                        className={`${
                          (form.header?.templateId || "header-1") === "header-6"
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
                        style={{ color: form.header?.textColor2 || undefined }}
                      >
                        {form.title || "Smart sign-up"}
                      </h3>
                      {creatorName ? (
                        <div
                          className="flex items-center gap-2 text-xs opacity-85"
                          style={{
                            color: form.header?.textColor1 || undefined,
                          }}
                        >
                          <span
                            className="inline-grid place-items-center h-7 w-7 rounded-full"
                            style={{
                              background: form.header?.buttonColor || "#44AD3C",
                              color: form.header?.buttonTextColor || "#FFF4C7",
                            }}
                          >
                            {creatorInitials || "?"}
                          </span>
                          <span>Created by {creatorName}</span>
                        </div>
                      ) : null}
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
                <section className="px-5 py-3 border-t bg-background/60">
                  <div className="mt-1 flex items-center gap-2 text-sm opacity-90">
                    <strong>Related files</strong>
                    <span aria-hidden>📎</span>
                  </div>
                </section>
              </div>
            </div>
            {/* Removed duplicate legacy preview block */}
            {/* Creator name removed - it will use the signed-in user's name */}
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
