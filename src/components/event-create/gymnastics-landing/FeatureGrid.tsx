import {
  FileText,
  Hotel,
  LayoutPanelTop,
  MapPinned,
  Medal,
  Route,
  ScanSearch,
  Ticket,
  Users,
} from "lucide-react";

const features = [
  {
    title: "Session Schedule",
    copy: "Warm-up, march-in, competition, and awards timing in a layout parents can read quickly.",
    icon: LayoutPanelTop,
  },
  {
    title: "Rotation Details",
    copy: "Organize the moving pieces of a gymnastics meet into a clearer event hub.",
    icon: ScanSearch,
  },
  {
    title: "Venue Map",
    copy: "Entry points, parking flow, seating, and venue notes without making families zoom through packet pages.",
    icon: MapPinned,
  },
  {
    title: "Hotels",
    copy: "Keep travel blocks and lodging information attached to the meet instead of split across documents.",
    icon: Hotel,
  },
  {
    title: "Athlete List",
    copy: "Helpful team-facing context for coaches and gym families following the meet.",
    icon: Users,
  },
  {
    title: "Live Results",
    copy: "Result links belong beside the rest of the meet information, not buried in a later email.",
    icon: Medal,
  },
  {
    title: "Parking",
    copy: "Arrival details, lot guidance, and parent flow all in one place.",
    icon: Route,
  },
  {
    title: "Documents",
    copy: "Meet packets, schedules, forms, and PDFs stay connected to the published page.",
    icon: FileText,
  },
  {
    title: "Spectator Guide",
    copy: "Admission, seating, doors, and practical info structured for families and guests.",
    icon: Ticket,
  },
];

export default function FeatureGrid() {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[0.78fr_1.22fr]">
          <div className="lg:sticky lg:top-28">
            <p className="text-sm font-semibold uppercase tracking-[0.26em] text-[#4f46e5]">
              Meet modules
            </p>
            <h2 className="mt-4 font-[var(--font-gym-display)] text-4xl font-bold tracking-[-0.045em] text-[#17153f] sm:text-5xl">
              Everything a gymnastics meet page actually needs
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-8 text-[#55627f]">
              This page should not read like generic sports software. The
              modules reflect the shape of real gymnastics meets: sessions,
              logistics, documents, hotels, and family-facing updates.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {features.map(({ title, copy, icon: Icon }, index) => (
              <article
                key={title}
                className={`rounded-[1.85rem] border p-6 shadow-[0_16px_40px_rgba(30,27,75,0.05)] transition hover:-translate-y-1 ${
                  index === 4
                    ? "border-[#dfd1a0] bg-[#fff9ea]"
                    : "border-[#dde2f4] bg-white"
                }`}
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                    index === 4
                      ? "bg-[#f5e6b4] text-[#7b6112]"
                      : "bg-[#efeeff] text-[#4f46e5]"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 font-[var(--font-gym-display)] text-xl font-bold tracking-[-0.02em] text-[#1e1b4b]">
                  {title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-[#586581]">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
