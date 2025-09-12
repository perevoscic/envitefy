const features = [
  {
    title: "Family calendar harmony",
    desc: "All events in one place — no more juggling.",
  },
  {
    title: "Carpool & activity sync",
    desc: "Share with other parents to keep pickups and practices aligned.",
  },
  {
    title: "Automatic reminders",
    desc: "Quick chips for 1h, 1d, 1w. Edit anytime.",
  },
  {
    title: "RSVP in one tap",
    desc: "send reply with our intelligent in seconds.",
  },
  {
    title: "Photo-to-plan magic",
    desc: "Snap a flyer, we’ll turn it into calendar details instantly.",
  },
  {
    title: "One less thing to remember",
    desc: "Birthdays, weddings, play-days auto-saved, so nothing slips.",
  },
  {
    title: "Never late again",
    desc: "No more missed events, no more rushing.",
  },
  {
    title: "Peaceful mornings",
    desc: "Start the day calm with a clear plan — no last-minute chaos.",
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
