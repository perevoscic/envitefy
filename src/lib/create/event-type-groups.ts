import { HOLIDAY_OCCASIONS as HOLIDAY_COLLECTIONS } from "../holiday-occasions";
import { seasonalCollectionScores } from "../seasonal-template-order";
import { creationAllowed, type CreationAccess } from "../creation-access";
import { type CreateGuess, createGuessLabel, customCategoryForGuess } from "./create-intent";

const holidays = new Map(HOLIDAY_COLLECTIONS.map((collection) => [collection.id, collection]));

export const eventTypeChoiceKey = (choice: CreateGuess) =>
  `${choice.category}:${choice.sport || ""}:${choice.occasion || ""}`;

export function eventTypeChoiceLabel(choice: CreateGuess) {
  const holiday = choice.category === "holidays-seasonal" && choice.occasion
    ? holidays.get(choice.occasion) : undefined;
  return holiday?.name || createGuessLabel(choice);
}

export function eventTypeChoiceSearchText(choice: CreateGuess) {
  const holiday = choice.category === "holidays-seasonal" && choice.occasion
    ? holidays.get(choice.occasion) : undefined;
  return `${eventTypeChoiceLabel(choice)} ${holiday?.aliases || ""} ${choice.category === "signup-forms" ? "signup sign up volunteer slots shifts potluck form" : choice.category === "school" ? "weekly memo newsletter field trip school celebration parent meeting classroom conference" : choice.category === "general" ? "thematic" : ""}`;
}

/** Sign-up forms share the starting list while retaining their own product grant. */
export function manualEventTypeChoices(choices: CreateGuess[], access?: CreationAccess | null): CreateGuess[] {
  if (!access) return [];
  const allowed = choices.filter((choice) => choice.category !== "signup-forms" &&
    creationAllowed(access, "event_page", customCategoryForGuess(choice)));
  if (access.allowedProducts.includes("signup_form")) allowed.push({ category: "signup-forms", sport: null });
  return allowed.filter((choice, index, all) => all.findIndex((item) => eventTypeChoiceKey(item) === eventTypeChoiceKey(choice)) === index);
}

/** Put timely occasions first while keeping every category and occasion identity. */
export function expandEventTypeChoices(choices: CreateGuess[], day: string | null = null): CreateGuess[] {
  if (!choices.some((choice) => choice.category === "holidays-seasonal" && !choice.occasion)) return [...choices];
  const scores = day ? seasonalCollectionScores(day) : new Map<string, number>();
  const orderedHolidays = [...HOLIDAY_COLLECTIONS].sort((a, b) =>
    (scores.get(b.id) ?? -1) - (scores.get(a.id) ?? -1));
  // A month-long activity window should accompany, rather than displace,
  // the nearest named holiday at the list's starting position.
  const closest = orderedHolidays.find((collection) =>
    collection.date.kind !== "window" && (scores.get(collection.id) ?? -1) > 0);
  const holidayChoices = closest
    ? [closest, ...orderedHolidays.filter((collection) => collection.id !== closest.id)]
    : orderedHolidays;
  const expanded = choices.flatMap<CreateGuess>((choice) => choice.category === "holidays-seasonal" && !choice.occasion
    ? holidayChoices.map((collection) => ({ ...choice, occasion: collection.id }))
    : [choice]);
  // All should open at the same timely holiday as the Holidays filter.
  // Keep the remaining choices in their existing relative order.
  const timely = (choice: CreateGuess) => choice.category === "holidays-seasonal" &&
    !!choice.occasion && (scores.get(choice.occasion) ?? -1) > 0;
  return [...expanded.filter(timely), ...expanded.filter((choice) => !timely(choice))];
}

export const EVENT_TYPE_GROUPS = [
  { id: "celebrations", label: "Celebrations" },
  { id: "holidays", label: "Holidays & seasonal" },
  { id: "home", label: "Home & property" },
  { id: "religious", label: "Religious & cultural" },
  { id: "gatherings", label: "Gatherings & more" },
  { id: "school", label: "School & classroom" },
  { id: "sports", label: "Sports & teams" },
] as const;

export type EventTypeGroup = (typeof EVENT_TYPE_GROUPS)[number]["id"];

export function eventTypeGroup(choice: CreateGuess): EventTypeGroup {
  if (choice.category === "school") return "school";
  if (choice.category === "sports") return "sports";
  if (choice.category === "holidays-seasonal") return "holidays";
  if (choice.category === "housewarming" || choice.category === "open-house") return "home";
  if (choice.category === "religious-events") return "religious";
  return [
    "birthdays", "weddings", "anniversaries", "baby-showers",
    "bridal-showers", "gender-reveal", "graduations",
  ].includes(choice.category) ? "celebrations" : "gatherings";
}

export function availableEventTypeGroups(choices: CreateGuess[]) {
  const available = new Set(choices.map(eventTypeGroup));
  return EVENT_TYPE_GROUPS.filter((group) => available.has(group.id));
}

const featuredTypes: Record<EventTypeGroup, readonly string[]> = {
  celebrations: ["birthdays", "weddings", "baby-showers", "graduations", "anniversaries", "bridal-showers", "gender-reveal"],
  holidays: ["christmas", "halloween", "thanksgiving", "easter", "new-years-eve", "valentines-day", "july-fourth", "mothers-day"],
  home: ["housewarming", "open-house"],
  religious: [],
  gatherings: ["general", "signup-forms"],
  school: ["school"],
  sports: ["football", "basketball", "soccer", "baseball", "gymnastics", "volleyball", "softball", "tennis", "swimming"],
};

/** Familiar catalog examples, limited to the event types this account can choose. */
export function eventTypeGroupExamples(choices: CreateGuess[], group: EventTypeGroup): string[] {
  const priority = featuredTypes[group];
  const rank = (choice: CreateGuess) => {
    const index = priority.indexOf(choice.occasion || choice.sport || choice.category);
    return index < 0 ? priority.length : index;
  };
  const members = expandEventTypeChoices(choices.filter((choice) => eventTypeGroup(choice) === group))
    .sort((a, b) => rank(a) - rank(b));
  const labels = members.flatMap((choice) => {
    // These are supported designs within the parent category, not separate grants.
    if (choice.category === "religious-events") return ["Baptism", "First Communion", "Bar/Bat Mitzvah", "Iftar", "Confirmation", "Aqiqah", "Puja", "Langar"];
    if (choice.category === "school") return ["Weekly memo", "Field trip", "School celebration", "Parent meeting"];
    if (choice.category === "general") return ["Meetup", "Picnic", "Potluck", "Game night", "Book club", "Networking", "Garden party", "Community gathering"];
    return [eventTypeChoiceLabel(choice)];
  });
  return [...new Set(labels)].slice(0, 8);
}
