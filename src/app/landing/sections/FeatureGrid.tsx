const features = [
  {
    title: "PDF support",
    desc: "Upload PDFs directly—no conversion needed.",
  },
  {
    title: "Timezone smart",
    desc: "Keeps your local timezone; travel handling that just works.",
  },
  {
    title: "One‑tap add",
    desc: "Google, Apple (ICS), and Outlook via Graph.",
  },
  {
    title: "Automatic reminders",
    desc: "Quick chips for 1h, 1d, 1w. Edit anytime.",
  },
  {
    title: "History & sharing",
    desc: "Saved items and shareable detail pages for family.",
  },
  {
    title: "Privacy‑first",
    desc: "You control what is saved. Simple, transparent use.",
  },
  {
    title: "No lock‑in",
    desc: "ICS support means your events work anywhere.",
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
