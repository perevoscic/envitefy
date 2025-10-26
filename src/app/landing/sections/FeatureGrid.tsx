const features = [
  {
    title: "Create & share in seconds",
    desc: "Start from a flyer, screenshot, or blank canvas and publish instantly.",
  },
  {
    title: "Shareable event pages",
    desc: "Send one beautiful link guests can open anywhere.",
  },
  {
    title: "Smart sign-up forms",
    desc: "Track volunteers, snack duty, or carpool slots with live updates.",
  },
  {
    title: "Text & email RSVPs",
    desc: "Replies land in your inbox so you can plan headcounts fast.",
  },
  {
    title: "Instant calendar sync",
    desc: "Connect Apple, Google or Outlook and we add events with reminders.",
  },
  {
    title: "Weekly practice builder",
    desc: "Spin up recurring practices with ready-made reminders.",
  },
  {
    title: "Universal ICS downloads",
    desc: "Share printable ICS files for classrooms and grandparents.",
  },
  {
    title: "Registry & wishlist links",
    desc: "Show Amazon, Target, Walmart, or custom wishlists right on the event page.",
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
          From papers to reminders—without typing
        </h2>
        <p className="mt-2 text-center text-foreground/70 max-w-2xl mx-auto">
          Powerful where it matters, simple everywhere else.
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
