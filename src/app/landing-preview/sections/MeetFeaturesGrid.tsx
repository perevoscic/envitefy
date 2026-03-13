import {
  ClipboardList,
  FileArchive,
  Hotel,
  MapPinned,
  Megaphone,
  ParkingCircle,
  Route,
  Trophy,
  Users,
} from "lucide-react";

const featureCards = [
  {
    icon: ClipboardList,
    title: "Meet Schedule",
    description:
      "Session times, warm-ups, awards, and schedule notes organized into a cleaner format than the source packet.",
  },
  {
    icon: MapPinned,
    title: "Venue & Maps",
    description:
      "Venue details, location notes, and map-friendly directions that make arrival easier for parents and spectators.",
  },
  {
    icon: Hotel,
    title: "Travel & Hotels",
    description:
      "Keep hotel blocks, travel reminders, and stay-related logistics in the same page as the meet details.",
  },
  {
    icon: Users,
    title: "Athlete Roster",
    description:
      "Helpful for team-facing meet pages where families need roster context and quick athlete visibility.",
  },
  {
    icon: Trophy,
    title: "Results",
    description:
      "Surface result links and scoring references alongside the rest of the meet information.",
  },
  {
    icon: ParkingCircle,
    title: "Parking Info",
    description:
      "Parking rates, garages, drop-off instructions, and arrival flow kept in one predictable section.",
  },
  {
    icon: FileArchive,
    title: "Documents",
    description:
      "Meet packet PDFs, supplemental docs, policies, and registration references stay attached to the hub.",
  },
  {
    icon: Megaphone,
    title: "Announcements",
    description:
      "Post spectator notes, schedule updates, or coach reminders without resending the whole packet.",
  },
  {
    icon: Route,
    title: "Spectator Guide",
    description:
      "Turn organizer-heavy documents into something a busy family can understand on the first scan.",
  },
];

export default function MeetFeaturesGrid() {
  return (
    <section
      id="features"
      className="px-4 py-20 sm:px-6 lg:px-8 lg:py-24"
      aria-labelledby="meet-features-heading"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
          <div className="lg:sticky lg:top-28">
            <p className="text-sm font-semibold uppercase tracking-[0.26em] text-[#4d8fb4]">
              What the meet hub includes
            </p>
            <h2
              id="meet-features-heading"
              className="mt-4 font-['Poppins'] text-4xl font-semibold tracking-[-0.04em] text-[#0b2035] sm:text-5xl"
            >
              A real event page, not just extracted text
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-8 text-[#587088]">
              The strongest value in Envitefy right now is turning meet material
              into a page people can actually use. Families get clarity.
              Organizers get a polished destination to share.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {featureCards.map(({ icon: Icon, title, description }) => (
              <article
                key={title}
                className="rounded-[1.9rem] border border-[#d7e2ec] bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)] transition hover:-translate-y-1 hover:shadow-[0_24px_50px_rgba(15,23,42,0.08)]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef6fb] text-[#0f766e]">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-xl font-semibold tracking-[-0.02em] text-[#10233f]">
                  {title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-[#587088]">
                  {description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
