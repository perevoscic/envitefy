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
          A simple flow designed for busy parents and coaches.
        </p>
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="rounded-2xl bg-surface/70 border border-border p-6 text-center">
            <div className="mx-auto h-10 w-10 rounded-full bg-primary/15 text-primary flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <rect x="3" y="3" width="18" height="14" rx="2" />
                <circle cx="9" cy="10" r="2" />
                <path d="M21 15l-5-5-4 4-2-2-5 5" />
              </svg>
            </div>
            <h3 className="mt-3 text-lg font-semibold">Snap or upload</h3>
            <p className="mt-1 text-foreground/70">
              Take a quick photo of a flyer, invite, or appointment card.
            </p>
          </div>
          <div className="rounded-2xl bg-surface/70 border border-border p-6 text-center">
            <div className="mx-auto h-10 w-10 rounded-full bg-secondary/15 text-secondary flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path d="M8 2v4" />
                <path d="M16 2v4" />
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M3 10h18" />
              </svg>
            </div>
            <h3 className="mt-3 text-lg font-semibold">
              We fill in the details
            </h3>
            <p className="mt-1 text-foreground/70">
              We extract the date, time, location, and description for you.
            </p>
          </div>
          <div className="rounded-2xl bg-surface/70 border border-border p-6 text-center">
            <div className="mx-auto h-10 w-10 rounded-full bg-accent/15 text-accent flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            </div>
            <h3 className="mt-3 text-lg font-semibold">Add to your calendar</h3>
            <p className="mt-1 text-foreground/70">
              Save to Google, Apple, or Outlook—complete with reminders.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
