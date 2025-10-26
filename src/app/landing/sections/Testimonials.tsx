const groups = [
  {
    title: "Parents",
    summary:
      "Envitefy keeps family calendars in sync and wrangles snack sign-ups without retyping flyers or invites.",
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
    title: "Coaches",
    summary:
      "Seasons, practices, and carpools shared instantly with every player.",
    quotes: [
      {
        quote: "I snapped the soccer schedule and it added every date perfectly.",
        by: "Marcus, dad & coach",
      },
      {
        quote:
          "Our basketball season imported in one tap — home and away labeled.",
        by: "Coach Maya",
      },
    ],
  },
  {
    title: "Planners",
    summary:
      "Events look polished and stay updated for guests and vendors.",
    quotes: [
      {
        quote:
          "Wedding invites were parsed flawlessly—ceremony and reception saved in seconds.",
        by: "Ava & Noah",
      },
      {
        quote:
          "Birthday party details captured from the invite — reminders set automatically.",
        by: "Jen, party planner",
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
          Why Families &amp; Teams Love It
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
