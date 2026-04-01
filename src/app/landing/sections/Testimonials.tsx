const groups = [
  {
    title: "Parents",
    summary:
      "Envitefy helps parents capture flyer details fast and keep calendars current.",
    quotes: [
      {
        quote:
          "Finally, no re-typing school flyers. It’s become our go-to for family events.",
        by: "Emily, mom of two",
      },
      {
        quote:
          "So simple my teens use it to save their activities. Love it!",
        by: "Priya, parent of teens",
      },
    ],
  },
  {
    title: "Gym families",
    summary:
      "Meet pages keep sessions, venues, and updates in one shareable place.",
    quotes: [
      {
        quote:
          "Having one meet page instead of another PDF thread makes travel weekends much easier.",
        by: "Marcus, gym dad",
      },
      {
        quote:
          "Parents know exactly where to look for the latest session updates.",
        by: "Coach Maya",
      },
    ],
  },
  {
    title: "Organizers",
    summary:
      "Shared event pages stay polished and easy to open on any phone.",
    quotes: [
      {
        quote:
          "Snap cleaned up the invite details faster than typing them myself.",
        by: "Ava",
      },
      {
        quote:
          "We finally have one link to send instead of juggling screenshots.",
        by: "Jen, organizer",
      },
    ],
  },
];

export default function Testimonials() {
  return (
    <section aria-labelledby="testimonials" className="w-full">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <h2
          id="testimonials"
          className="text-2xl sm:text-3xl font-bold text-center"
        >
          Why people keep using it
        </h2>
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          {groups.map((group) => (
            <article
              key={group.title}
              className="rounded-2xl bg-surface/70 border border-border p-6 shadow-sm flex flex-col gap-4"
            >
              <header>
                <h3 className="text-lg font-semibold">{group.title}</h3>
                <p className="mt-1 text-sm text-foreground/60">
                  {group.summary}
                </p>
              </header>
              <div className="space-y-4 text-foreground/80 text-sm">
                {group.quotes.map((item) => (
                  <figure key={item.by}>
                    <blockquote>“{item.quote}”</blockquote>
                    <figcaption className="mt-2 text-foreground/60">
                      — {item.by}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
