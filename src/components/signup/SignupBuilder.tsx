'use client';

import React from "react";
import type {
  SignupForm,
  SignupFormSection,
  SignupFormSlot,
  SignupQuestion,
} from "@/types/signup";
import {
  createSignupSection,
  createSignupSlot,
  DEFAULT_SIGNUP_SETTINGS,
  generateSignupId,
} from "@/utils/signup";

type Props = {
  enabled: boolean;
  form: SignupForm;
  onEnabledChange: (next: boolean) => void;
  onChange: (next: SignupForm) => void;
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

const Toggle = ({
  checked,
  onChange,
  srLabel,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  srLabel: string;
}) => (
  <label className="flex items-center cursor-pointer select-none text-foreground">
    <span className="sr-only">{srLabel}</span>
    <div className="relative">
      <input
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <div className="block h-6 w-11 rounded-full bg-foreground/20 transition-colors duration-200 ease-out peer-checked:bg-primary/60 border border-border/70 shadow-inner" />
      <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.12)] transition-all duration-200 ease-out peer-checked:translate-x-full peer-checked:bg-primary peer-checked:shadow-md dark:bg-surface dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]" />
    </div>
  </label>
);

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
  onSlotMove: (
    sectionId: string,
    slotId: string,
    direction: -1 | 1
  ) => void;
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

const SignupBuilder: React.FC<Props> = ({
  enabled,
  form,
  onEnabledChange,
  onChange,
}) => {
  const settings = { ...DEFAULT_SIGNUP_SETTINGS, ...form.settings };

  const setSettings = (next: Partial<typeof settings>) => {
    onChange({
      ...form,
      settings: { ...settings, ...next },
    });
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
      sections: form.sections.filter((candidate) => candidate.id !== section.id),
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
      questions: (form.questions || []).filter((question) => question.id !== id),
    });
  };

  return (
    <section className="rounded-lg border border-border bg-surface/60 px-4 py-4 sm:px-5 sm:py-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-xl space-y-1">
          <h4 className="text-sm font-semibold text-foreground">
            Smart sign-up form
          </h4>
          <p className="text-xs text-foreground/70 leading-relaxed">
            Better than static spreadsheets. Create roles, time slots, and
            supply lists in minutes. We’ll auto-manage waitlists, limit
            sign-ups, and send reminders so no one drops the ball.
          </p>
        </div>
        <Toggle
          checked={enabled}
          onChange={(next) => onEnabledChange(next)}
          srLabel="Toggle smart signup form"
        />
      </div>

      {enabled && (
        <div className="space-y-4">
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
          </div>

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
            </div>
          </div>

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
        </div>
      )}
    </section>
  );
};

export default SignupBuilder;
