import type { SignupForm, SignupFormSection } from "@/types/signup";
import { createSignupSlot, generateSignupId } from "@/utils/signup";

export const SIGNUP_BLOCKS = [
  {
    id: "registration",
    name: "Registration places",
    description: "A place at a class, gathering, or event.",
    title: "Reserve your place",
    labels: ["Registration"],
    capacity: null,
  },
  {
    id: "volunteers",
    name: "Volunteer roles",
    description: "People to help with specific jobs.",
    title: "Volunteer roles",
    labels: ["Welcome guests", "Set up", "Clean up"],
    capacity: 2,
  },
  {
    id: "items",
    name: "Items to bring",
    description: "Food, supplies, or things to contribute.",
    title: "What to bring",
    labels: ["Main dish", "Side dish", "Dessert"],
    capacity: 1,
  },
  {
    id: "times",
    name: "Time slots",
    description: "Shifts, appointments, or session times.",
    title: "Choose a time",
    labels: [],
    capacity: 1,
  },
  {
    id: "custom",
    name: "Custom signup section",
    description: "Start with your own labels and quantities.",
    title: "",
    labels: [""],
    capacity: null,
  },
  {
    id: "info",
    name: "Instructions / text",
    description: "Directions, what to expect, or a helpful note.",
    title: "Helpful information",
    labels: [],
    capacity: null,
  },
] as const;
export type SignupBlockId = (typeof SIGNUP_BLOCKS)[number]["id"];
export type ComposerDrag = { kind: "block"; id: SignupBlockId } | { kind: "section"; id: string };
export const COMPOSER_DRAG_TYPE = "application/x-envitefy-signup-section";

export function createSignupBlock(id: SignupBlockId): SignupFormSection {
  const block = SIGNUP_BLOCKS.find((item) => item.id === id)!;
  return {
    id: generateSignupId(),
    kind: id === "info" ? "info" : "slots",
    ...(id !== "info"
      ? {
          purpose: id,
          unitLabel: id === "items" ? "items" : "people",
          maxSelectionsPerPerson: id === "times" || id === "volunteers" ? 1 : null,
          maxQuantityPerSlot: id === "items" ? 10 : 1,
        }
      : {}),
    title: block.title,
    description: "",
    slots: block.labels.map((label) => createSignupSlot({ label, capacity: block.capacity })),
  };
}

/** Insert before a target; dropping below the last section appends. IDs and responses stay intact. */
export function placeSignupSection(
  form: SignupForm,
  drag: ComposerDrag,
  beforeId?: string,
): SignupForm {
  const moving =
    drag.kind === "block"
      ? createSignupBlock(drag.id)
      : form.sections.find((s) => s.id === drag.id);
  if (!moving || moving.id === beforeId) return form;
  const sections = form.sections.filter((section) => section.id !== moving.id);
  const index = beforeId ? sections.findIndex((s) => s.id === beforeId) : -1;
  sections.splice(index < 0 ? sections.length : index, 0, moving);
  return { ...form, sections };
}

export function moveSignupItem<T>(items: T[], from: number, to: number): T[] {
  if (from < 0 || from >= items.length || to < 0 || to >= items.length) return items;
  const copy = [...items];
  copy.splice(to, 0, copy.splice(from, 1)[0]);
  return copy;
}

export function signupSectionHasResponses(
  form: SignupForm,
  sectionId: string,
  slotId?: string,
): boolean {
  return (
    form.responses.some((response) =>
      response.slots.some(
        (slot) => slot.sectionId === sectionId && (!slotId || slot.slotId === slotId),
      ),
    ) ||
    !!form.availability?.some(
      (slot) =>
        slot.sectionId === sectionId &&
        (!slotId || slot.slotId === slotId) &&
        (slot.confirmed > 0 || slot.waitlisted > 0),
    )
  );
}

export function copySignupSection(section: SignupFormSection): SignupFormSection {
  return {
    ...section,
    id: generateSignupId(),
    title: `${section.title || "Section"} (copy)`,
    slots: section.slots.map((slot) => ({ ...slot, id: generateSignupId() })),
  };
}

export function generateSignupShifts(
  start: string,
  end: string,
  interval: number,
  capacity: number,
  label = "Volunteer shift",
) {
  const minutes = (value: string) => {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return Number.NaN;
    const [hour, minute] = value.split(":").map(Number);
    return hour * 60 + minute;
  };
  const from = minutes(start),
    to = minutes(end);
  if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from)
    throw new Error("Choose an end time after the start on the same day.");
  if (
    !Number.isInteger(interval) ||
    interval < 5 ||
    interval > 720 ||
    Math.ceil((to - from) / interval) > 100
  )
    throw new Error("Choose 5–720 minutes per time slot, with no more than 100 slots.");
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 999)
    throw new Error("Choose 1–999 people per time slot.");
  const clock = (value: number) =>
    `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
  return Array.from({ length: Math.ceil((to - from) / interval) }, (_, index) => {
    const begins = from + index * interval,
      ends = Math.min(to, begins + interval);
    return createSignupSlot({
      label: `${label} ${index + 1}`,
      capacity,
      startTime: clock(begins),
      endTime: clock(ends),
    });
  });
}

/** Legacy placeholder rows can be removed only by an explicit choice, never with bookings. */
export function replaceableSignupStarterIds(
  form: SignupForm,
  section: SignupFormSection,
): string[] {
  if (section.purpose !== "times") return [];
  return section.slots
    .filter(
      (slot) =>
        ["First shift", "Second shift"].includes(slot.label) &&
        slot.capacity === 1 &&
        !slot.startTime &&
        !slot.endTime &&
        !slot.notes &&
        !signupSectionHasResponses(form, section.id, slot.id),
    )
    .map((slot) => slot.id);
}

export function appendSignupTimeSlots(
  form: SignupForm,
  section: SignupFormSection,
  generated: SignupFormSection["slots"],
  replaceStarters = false,
): SignupFormSection {
  const removeIds = replaceStarters ? replaceableSignupStarterIds(form, section) : [];
  const existing = section.slots.filter((slot) => !removeIds.includes(slot.id));
  const additions = generated.filter(
    (slot) =>
      !existing.some(
        (current) => current.startTime === slot.startTime && current.endTime === slot.endTime,
      ),
  );
  if (!additions.length)
    throw new Error("These time slots already exist. Choose a different time range.");
  return { ...section, slots: [...existing, ...additions] };
}

export function addFieldDayStarter(form: SignupForm): SignupForm {
  const shifts = {
    ...createSignupBlock("times"),
    slots: ["First shift", "Second shift"].map((label) => createSignupSlot({ label, capacity: 1 })),
    title: "Field Day volunteers",
    description: "Choose one shift. Add the times and arrival instructions for your school.",
  };
  const items = {
    ...createSignupBlock("items"),
    title: "Supplies for Field Day",
    unitLabel: "packs",
    slots: ["Bottled water", "Fruit", "Napkins"].map((label) =>
      createSignupSlot({ label, capacity: 6 }),
    ),
  };
  const info = {
    ...createSignupBlock("info"),
    title: "Before you arrive",
    description: "Add your school's check-in instructions, what to bring, and rain plan.",
  };
  return {
    ...form,
    sections: [...form.sections, info, shifts, items],
    questions: [
      ...form.questions,
      {
        id: generateSignupId(),
        prompt: "Which grade and teacher is your child with? Please do not enter the child’s name.",
        required: true,
      },
    ],
    settings: form.sections.length
      ? form.settings
      : { ...form.settings, allowMultipleSlotsPerPerson: true, maxSlotsPerPerson: null },
  };
}
