import EnvitefySocialLinks from "@/components/branding/EnvitefySocialLinks";
import EnvitefyWordmark from "@/components/branding/EnvitefyWordmark";

const EVENT_CATEGORY_LABELS: Record<string, string> = {
  birthday: "Birthdays",
  birthdays: "Birthdays",
  wedding: "Weddings",
  weddings: "Weddings",
  anniversary: "Anniversaries",
  anniversaries: "Anniversaries",
  babyshower: "Baby Showers",
  babyshowers: "Baby Showers",
  bridalshower: "Bridal Showers",
  bridalshowers: "Bridal Showers",
  signup: "Sign-ups",
  signups: "Sign-ups",
  smartsignupform: "Sign-ups",
  genderreveal: "Gender Reveals",
  genderreveals: "Gender Reveals",
  football: "Football",
  footballseason: "Football",
  sportfootball: "Football",
  soccer: "Soccer",
  sportsoccer: "Soccer",
  sport: "Sports",
  sports: "Sports",
  gymnastics: "Gymnastics",
  sportgymnastics: "Gymnastics",
  sportgymnasticsschedule: "Gymnastics",
  cheerleading: "Cheerleading",
  danceballet: "Dance & Ballet",
  danceandballet: "Dance & Ballet",
  appointment: "Appointments",
  appointments: "Appointments",
  workshop: "Workshops",
  workshops: "Workshops",
  specialevent: "Special Events",
  specialevents: "Special Events",
  event: "Events",
  events: "Events",
};

export function getEnvitefyEventCategory(category?: string) {
  const key = category?.toLowerCase().replace(/[^a-z]/g, "");
  return (key && EVENT_CATEGORY_LABELS[key]) || "Events";
}

export default function EnvitefyEventBranding({
  category = "Events",
  inverse = false,
}: {
  category?: string;
  inverse?: boolean;
}) {
  const categoryLabel = getEnvitefyEventCategory(category);
  const destination =
    categoryLabel === "Birthdays"
      ? "https://envitefy.com/birthdays"
      : categoryLabel === "Weddings"
        ? "https://envitefy.com/weddings"
        : "https://envitefy.com";
  return (
    <div
      data-envitefy-event-branding={categoryLabel}
      className={`mx-auto max-w-sm px-4 pt-2 text-center font-sans text-sm font-normal not-italic normal-case tracking-normal ${inverse ? "text-white/85" : "text-slate-600"}`}
    >
      <a
        href={destination}
        target="_blank"
        rel="noopener noreferrer"
        className="mx-auto flex min-h-10 w-fit items-center justify-center rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
        aria-label={`Envitefy ${categoryLabel} (opens in a new tab)`}
      >
        <EnvitefyWordmark
          scaled={false}
          className="text-3xl"
          tone={inverse ? "light" : "gradient"}
        />
      </a>
      <p className="text-[10px] font-medium tracking-[0.16em]">
        CREATE | SHARE | ENJOY
      </p>
      <p className="mt-1 flex flex-wrap items-center justify-center gap-x-1 text-xs">
        <strong className="font-bold">Created with Envitefy {categoryLabel}</strong>{" "}
        <a
          href="https://envitefy.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-6 items-center rounded-md underline decoration-current/40 underline-offset-4 transition-opacity hover:opacity-75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Create now
        </a>
      </p>
      <EnvitefySocialLinks placement="event" inverse={inverse} />
    </div>
  );
}
