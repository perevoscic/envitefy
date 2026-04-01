export default function UseCases() {
  const items = [
    {
      title: "Busy parents",
      text: "Use Snap to turn school flyers, invites, and screenshots into calendar-ready event details without retyping them.",
      badgeClass: "bg-[#efe9ff] text-[#6d5eea]",
    },
    {
      title: "Gym families",
      text: "Keep meet times, venues, and updates in one place that is easy to open on the go.",
      badgeClass: "bg-[#edeaff] text-[#5f63e6]",
    },
    {
      title: "Coaches",
      text: "Share a clean meet page instead of sending another long text thread or PDF packet.",
      badgeClass: "bg-[#f3eeff] text-[#7F8CFF]",
    },
    {
      title: "Meet organizers",
      text: "Publish a polished destination for schedules, logistics, and updates that families can trust.",
      badgeClass: "bg-[#efe9ff] text-[#6d5eea]",
    },
  ];

  return (
    <section
      aria-labelledby="use-cases"
      className="w-full bg-transparent pb-12 transition"
    >
      <div className="mx-auto max-w-7xl px-6 py-12">
        <h2
          id="use-cases"
          className="text-center text-2xl font-bold text-[#2f2850] sm:text-3xl"
        >
          Who it’s for
        </h2>
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {items.map((item) => (
            <div
              key={item.title}
              className="rounded-3xl border border-[#e5dcff] bg-white/95 p-6 shadow-[0_30px_40px_rgba(79,63,142,0.1)] transition hover:-translate-y-1 hover:shadow-[0_40px_50px_rgba(79,63,142,0.15)]"
            >
              <h3 className="flex items-center gap-2 text-lg font-semibold text-[#2f2850]">
                <span
                  className={`inline-flex h-7 w-7 items-center justify-center rounded-full ${item.badgeClass}`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="8" r="3" />
                    <path d="M5 20c0-3.3 3.1-6 7-6s7 2.7 7 6" />
                  </svg>
                </span>
                {item.title}
              </h3>
              <p className="mt-2 text-sm text-[#5a5377]">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
