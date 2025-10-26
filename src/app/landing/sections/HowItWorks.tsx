export default function HowItWorks() {
  return (
    <section aria-labelledby="how-it-works" className="w-full">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <h2
          id="how-it-works"
          className="text-2xl sm:text-3xl font-bold text-center"
        >
          How it works
        </h2>
        <p className="mt-2 text-center text-foreground/70 max-w-2xl mx-auto">
          A simple flow designed for busy families and teams.
        </p>
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="rounded-2xl bg-surface/70 border border-border p-6 text-center shadow">
            <h3 className="text-lg font-semibold flex items-center justify-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-primary">
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
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3l2-3h8l2 3h3a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </span>
              Snap or Start Fresh
            </h3>
            <p className="mt-2 text-foreground/70">
              Upload a flyer, birthday or wedding invitation, or snap a photo of
              a flyer— and add it to your calendar in seconds.
            </p>
          </div>
          <div className="rounded-2xl bg-surface/70 border border-border p-6 text-center shadow">
            <h3 className="text-lg font-semibold flex items-center justify-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-secondary/15 text-secondary">
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
                  <path d="M3 4h18" />
                  <path d="M7 4v2" />
                  <path d="M17 4v2" />
                  <rect x="3" y="6" width="18" height="15" rx="2" />
                  <path d="M8 13h3" />
                  <path d="M8 16h6" />
                </svg>
              </span>
              Events in Seconds
            </h3>
            <p className="mt-2 text-foreground/70">
              Create events with dates, locations, and notes so birthdays,
              weddings, and team plans come together with smart RSVP by text or
              email, built-in directions, and handy registry links.
            </p>
          </div>
          <div className="rounded-2xl bg-surface/70 border border-border p-6 text-center shadow">
            <h3 className="text-lg font-semibold flex items-center justify-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-accent/15 text-accent">
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
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
              </span>
              Smart Sign-Up Forms
            </h3>
            <p className="mt-2 text-foreground/70">
              Share one sign-up form for school events, volunteer slots, snack
              duty, and field trips — seamless signup flow and updates for
              everyone.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
