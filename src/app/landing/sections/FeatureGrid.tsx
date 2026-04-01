const features = [
  {
    title: "Snap capture",
    desc: "Start from a flyer or screenshot and clean up event details fast.",
  },
  {
    title: "Shareable event pages",
    desc: "Send one beautiful link guests can open anywhere.",
  },
  {
    title: "Gymnastics meet pages",
    desc: "Keep sessions, venues, and updates in one page for families and coaches.",
  },
  {
    title: "Event updates",
    desc: "Edit details later and the shared page stays current.",
  },
  {
    title: "Instant calendar sync",
    desc: "Connect Apple, Google or Outlook and we add events with reminders.",
  },
  {
    title: "Meet logistics",
    desc: "Keep addresses, directions, and timing details easy to scan on mobile.",
  },
  {
    title: "Universal ICS downloads",
    desc: "Share calendar-ready files for anyone who needs a portable save option.",
  },
  {
    title: "Scope-based access",
    desc: "Snap is available to every profile while Gymnastics unlocks both products.",
  },
];

export default function FeatureGrid() {
  return (
    <section aria-labelledby="features" className="w-full">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <h2
          id="features"
          className="text-2xl sm:text-3xl font-bold text-center"
        >
          Snap and share—without extra product sprawl
        </h2>
        <p className="mt-2 text-center text-foreground/70 max-w-2xl mx-auto">
          Focused on the two live public surfaces: Snap and Gymnastics.
        </p>
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl bg-surface/70 border border-border p-6"
            >
              <h3 className="text-lg font-semibold">{f.title}</h3>
              <p className="mt-1 text-foreground/70">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
