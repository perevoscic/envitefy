export default function UseCases() {
  const items = [
    {
      title: "Parents",
      text: "Snap school flyers, share beautiful event pages, add smart sign-up forms, and keep calendars in sync.",
      badgeClass: "bg-[#efe9ff] text-[#6d5eea]",
      icon: (
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
          <circle cx="9" cy="7" r="3" />
          <circle cx="17" cy="7" r="3" />
          <path d="M2 21c0-4 5-6 7-6s7 2 7 6" />
        </svg>
      ),
    },
    {
      title: "Coaches",
      text: "Upload the season once; Envitefy creates every game and practice with reminders.",
      badgeClass: "bg-[#edeaff] text-[#5f63e6]",
      icon: (
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
          <path d="M8 21h8" />
          <path d="M12 17v4" />
          <path d="M7 4h10v4a5 5 0 0 1-10 0V4z" />
          <path d="M5 6h2a4 4 0 0 1-4 4V8a2 2 0 0 1 2-2z" />
          <path d="M19 6h-2a4 4 0 0 0 4 4V8a2 2 0 0 0-2-2z" />
        </svg>
      ),
    },
    {
      title: "Teachers",
      text: "Send calendar-ready class events with one link and gather volunteer or snack sign-ups without extra apps.",
      badgeClass: "bg-[#f3eeff] text-[#7F8CFF]",
      icon: (
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
          <path d="M2 3h6a4 4 0 0 1 4 4v14a4 4 0 0 0-4-4H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a4 4 0 0 1 4-4h6z" />
        </svg>
      ),
    },
    {
      title: "Weddings",
      text: "Registries, RSVPs, and timeline updates stay current for every guest.",
      badgeClass: "bg-[#efe9ff] text-[#6d5eea]",
      icon: (
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
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21l8.84-8.61a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      ),
    },
    {
      title: "Playdates",
      text: "Share allergy notes, packing lists, and directions in a single invite.",
      badgeClass: "bg-[#edeaff] text-[#5f63e6]",
      icon: (
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
          <circle cx="8" cy="8" r="3" />
          <circle cx="14" cy="7" r="3" />
          <path d="M8 11c0 3-2 3-2 5" />
          <path d="M14 10c0 3-2 3-2 5" />
        </svg>
      ),
    },
    {
      title: "Doctor appointments",
      text: "Save appointment cards with automatic follow-up reminders for the whole family.",
      badgeClass: "bg-[#f3eeff] text-[#7F8CFF]",
      icon: (
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
          <path d="M6 4v4a4 4 0 1 0 8 0V4" />
          <path d="M10 14c0 3 2 4 4 4h1" />
          <circle cx="18" cy="18" r="2" />
        </svg>
      ),
    },
  ];
  return (
    <section
      aria-labelledby="use-cases"
      className="w-full bg-transparent pb-12 transition"
    >
      <div className="max-w-7xl mx-auto px-6 py-12">
        <h2
          id="use-cases"
          className="text-2xl sm:text-3xl font-bold text-center text-[#2f2850]"
        >
          Who it’s for
        </h2>
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((i) => (
            <div
              key={i.title}
              className="rounded-3xl bg-white/95 border border-[#e5dcff] p-6 shadow-[0_30px_40px_rgba(79,63,142,0.1)] transition hover:-translate-y-1 hover:shadow-[0_40px_50px_rgba(79,63,142,0.15)]"
            >
              <h3 className="text-lg font-semibold flex items-center gap-2 text-[#2f2850]">
                <span
                  className={`inline-flex h-7 w-7 items-center justify-center rounded-full ${i.badgeClass}`}
                >
                  {i.icon}
                </span>
                {i.title}
              </h3>
              <p className="mt-2 text-sm text-[#5a5377]">{i.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
