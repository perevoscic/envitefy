import { HOLIDAY_COLLECTIONS } from "../holiday-collections";
import { seasonalCollectionScores } from "../seasonal-template-order";
import { type CreateGuess, createGuessLabel } from "./create-intent";

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
  return `${eventTypeChoiceLabel(choice)} ${holiday?.aliases || ""} ${choice.category === "general" ? "thematic" : ""}`;
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
  { id: "sports", label: "Sports & teams" },
] as const;

export type EventTypeGroup = (typeof EVENT_TYPE_GROUPS)[number]["id"];

export function eventTypeGroup(choice: CreateGuess): EventTypeGroup {
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
