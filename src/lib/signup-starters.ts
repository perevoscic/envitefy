import { getSignupDemoContent } from "@/lib/signup-demo-content";
import { getSignupDesign } from "@/lib/signup-designs";
import { applySignupTheme, createSignupAppearance, getSignupTheme } from "@/lib/signup-themes";
import type { SignupForm, SignupFormSection, SignupFormSlot, SignupThemeId } from "@/types/signup";
import { createDefaultSignupForm, generateSignupId } from "@/utils/signup";

export const SIGNUP_STARTERS = [
  {
    id: "potluck",
    name: "Potluck",
    description: "Everyone brings something to the table.",
    title: "Something good to share",
    section: "What will you bring?",
    slots: ["Main dishes", "Salads & sides", "Something sweet", "Drinks"],
    capacity: 3,
    themeId: "harvest-table",
  },
  {
    id: "volunteers",
    name: "Volunteer shifts",
    description: "Find a helping hand for every role.",
    title: "A few helping hands",
    section: "Lend a hand",
    slots: ["Set up", "Welcome guests", "Help with activities", "Clean up"],
    capacity: 4,
    themeId: "community-garden",
  },
  {
    id: "classroom",
    name: "Classroom supplies",
    description: "Make the class wish list a shared effort.",
    title: "Good things for our classroom",
    section: "Supplies we need",
    slots: ["Drawing paper", "Colored pencils", "Glue sticks", "Tissues"],
    capacity: 5,
    themeId: "school-days",
  },
  {
    id: "team-snacks",
    name: "Team snacks",
    description: "Keep the team ready for game day.",
    title: "For our team",
    section: "Bring something for the team",
    slots: ["Fruit", "Snacks", "Water", "After-game cleanup"],
    capacity: 2,
    themeId: "game-day",
  },
  {
    id: "workshop",
    name: "Workshop places",
    description: "A place for everyone ready to learn.",
    title: "Make room for something new",
    section: "Save your place",
    slots: ["Workshop registration"],
    capacity: 20,
    themeId: "clean-clear",
  },
  {
    id: "gathering",
    name: "Gathering helpers",
    description: "Share the little details of a lovely day.",
    title: "A little occasion",
    section: "Help make it happen",
    slots: ["Flowers & table", "Food & drinks", "Music", "Welcome guests"],
    capacity: 2,
    themeId: "celebrate-together",
  },
] as const;

type SectionDefinition = Pick<SignupFormSection, "title" | "description"> & {
  slots: Omit<SignupFormSlot, "id">[];
};

// IDs are regenerated for each template and save; compare the editable content.
const sectionSignature = (sections: SectionDefinition[]) =>
  JSON.stringify(
    sections.map((section) => ({
      title: section.title.trim(),
      description: section.description?.trim() || "",
      slots: section.slots.map((slot) => ({
        label: slot.label.trim(),
        capacity: slot.capacity && slot.capacity > 0 ? slot.capacity : null,
        startTime: slot.startTime?.trim() || "",
        endTime: slot.endTime?.trim() || "",
        notes: slot.notes?.trim() || "",
      })),
    })),
  );

export function signupStarterNeedsConfirmation(form: SignupForm): boolean {
  if (form.responses.length) return true;
  const hasContent = form.sections.some(
    (section) =>
      section.title.trim() ||
      section.description?.trim() ||
      section.slots.some(
        (slot) =>
          slot.label.trim() ||
          slot.notes?.trim() ||
          slot.startTime ||
          slot.endTime ||
          slot.capacity,
      ),
  );
  if (!hasContent) return false;

  const current = sectionSignature(form.sections);
  const starter = SIGNUP_STARTERS.find((item) => item.id === form.starterId);
  if (
    starter &&
    current ===
      sectionSignature([
        {
          title: starter.section,
          slots: starter.slots.map((label) => ({ label, capacity: starter.capacity })),
        },
      ])
  )
    return false;

  const design = getSignupDesign(form.appearance?.designId);
  if (design) {
    const demo = getSignupDemoContent(design);
    if (
      current ===
      sectionSignature([
        {
          title: demo.section,
          description: demo.instructions,
          slots: demo.slots,
        },
      ])
    )
      return false;
  }
  return true;
}

export function applySignupStarter(form: SignupForm, id: string, append = false): SignupForm {
  const starter = SIGNUP_STARTERS.find((item) => item.id === id);
  if (!starter) return form;
  const previousStarter = SIGNUP_STARTERS.find((item) => item.id === form.starterId);
  const section = {
    id: generateSignupId(),
    title: starter.section,
    slots: starter.slots.map((label) => ({
      id: generateSignupId(),
      label,
      capacity: starter.capacity,
    })),
  };
  return {
    ...form,
    starterId: id,
    title: form.title || starter.title,
    sections: append ? [...form.sections, section] : [section],
    settings: {
      ...form.settings,
      // Keep custom rules and contact settings when changing the slot structure.
      allowMultipleSlotsPerPerson:
        !append &&
        (!previousStarter ||
          form.settings.allowMultipleSlotsPerPerson === (previousStarter.id !== "workshop"))
          ? id !== "workshop"
          : form.settings.allowMultipleSlotsPerPerson,
    },
  };
}

export function createSignupThemeForm(id: SignupThemeId): SignupForm {
  const theme = getSignupTheme(id)!;
  const form = applySignupStarter(createDefaultSignupForm(), theme.starterId);
  return applySignupTheme(
    {
      ...form,
      start: null,
      locationMode: "tba",
      settings: { ...form.settings, collectPhone: false },
      description: theme.description,
      header: { ...form.header, groupName: "Made for getting together" },
    },
    id,
  );
}

export function getSignupTemplateTheme(template: { id: string; name: string }) {
  return (
    getSignupTheme(template.id.replace(/^editorial--/, "")) ||
    getSignupTheme(getSignupDemoContent(template).themeId)!
  );
}

export function createSignupTemplateForm(template: {
  id: string;
  name: string;
  heroImage: string;
}): SignupForm {
  const theme = getSignupTemplateTheme(template);
  const demo = getSignupDemoContent(template);
  const form = createSignupThemeForm(theme.id);
  return {
    ...form,
    title: demo.title,
    appearance: createSignupAppearance(theme.id, template.id),
    description: demo.welcome,
    locationMode: "in-person",
    venue: demo.venue,
    location: demo.location,
    start: demo.start,
    end: demo.end,
    timezone: demo.timezone,
    allDay: false,
    arrivalInstructions: demo.arrivalInstructions,
    parkingInfo: demo.parkingInfo,
    sections: [
      {
        id: generateSignupId(),
        title: demo.section,
        description: demo.instructions,
        slots: demo.slots.map((slot) => ({ ...slot, id: generateSignupId() })),
      },
    ],
    questions: [
      { id: generateSignupId(), prompt: demo.question, required: false, multiline: true },
    ],
    settings: {
      ...form.settings,
      collectPhone: false,
      allowMultipleSlotsPerPerson: !!demo.multiple,
    },
    header: {
      ...form.header,
      groupName: demo.group,
      creatorName: demo.host,
      backgroundImage: {
        name: template.name,
        type: template.heroImage.endsWith(".png") ? "image/png" : "image/webp",
        dataUrl: template.heroImage,
      },
    },
  };
}

/** A chosen design supplies artwork and styling, never fictitious event details or bookings. */
export function createEmptySignupTemplateForm(template?: {
  id: string;
  name: string;
  heroImage: string;
}): SignupForm {
  const themed = template ? createSignupTemplateForm(template) : createDefaultSignupForm();
  const empty = createDefaultSignupForm();
  return {
    ...empty,
    boardTitle: "",
    boardDescription: "",
    appearance: themed.appearance,
    header: { ...themed.header, groupName: "", creatorName: "" },
    starterId: null,
    start: null,
    end: null,
    locationMode: "tba",
    sections: [],
    questions: [],
    settings: { ...empty.settings, collectPhone: false, allowMultipleSlotsPerPerson: true },
  };
}
