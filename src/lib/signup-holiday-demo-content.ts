import { HOLIDAY_COLLECTIONS } from "./holiday-collections";
import { holidayWindows } from "./seasonal-template-order";
import type { SignupOccasionContent } from "./signup-occasion-content";

const roles: Record<string, readonly string[]> = {
  "corn-maze": ["Entrance & welcome", "Maze path helpers", "Refreshment table", "End-of-day cleanup"],
  "trunk-or-treat": ["Decorate a trunk", "Welcome & parking", "Wrapped candy donations", "Cleanup crew"],
  "summer-camp": ["Welcome & check-in", "Arts & crafts helpers", "Outdoor activity helpers", "Supplies & pack down"],
  "earth-day": ["Park cleanup", "Garden planting", "Supply table", "Sorting & recycling"],
  "back-to-school": ["Welcome families", "Supply donations", "Classroom setup", "Event cleanup"],
};

/** Fictional gallery examples only; createEmptySignupTemplateForm never calls this. */
export function getHolidaySignupDemoContent(id: string): SignupOccasionContent | undefined {
  const [, collectionId, slug] = id.split("--");
  if (!id.startsWith("holidays--")) return undefined;
  const collection = HOLIDAY_COLLECTIONS.find((item) => item.id === collectionId);
  if (!collection?.designs.some((design) => design.slug === slug)) return undefined;
  const labels = roles[collection.id] || (collection.purpose === "potluck"
    ? ["Main dishes", "Seasonal sides", "Drinks & serving supplies", "Setup & cleanup"]
    : collection.purpose === "meeting"
      ? ["Room setup", "Welcome guests", "Accessibility support", "Room cleanup"]
      : ["Prepare the space", "Welcome guests", "Supplies & setup", "Pack down & tidy up"]);
  const start = holidayWindows(collection.date, 2028)[0]?.start;
  return {
    profile: collection.purpose,
    school: collection.id === "back-to-school",
    welcome: `Help prepare a welcoming space for ${collection.name}. Choose a contribution or helping role below.`,
    section: collection.purpose === "potluck" ? "What will you bring?" : "Ways to take part",
    instructions: "Choose a role and review the organizer’s notes. Contact the host about any access or dietary needs.",
    slots: labels.map((label) => ({ label, capacity: 4, notes: "Coordinate details with the organizing team." })),
    question: "Is there anything the organizing team should know?",
    multiple: true,
    date: start === undefined ? "2028-01-15" : new Date(start * 86_400_000).toISOString().slice(0, 10),
    startTime: "16:00",
    endTime: "19:00",
  };
}
