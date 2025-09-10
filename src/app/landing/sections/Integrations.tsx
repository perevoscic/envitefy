import Image from "next/image";

export default function Integrations() {
  return (
    <section aria-labelledby="integrations" className="w-full">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <h2
          id="integrations"
          className="text-2xl sm:text-3xl font-bold text-center"
        >
          Works with your calendars
        </h2>
        <p className="mt-2 text-center text-foreground/70 max-w-3xl mx-auto">
          Add with one tap to Google Calendar, Apple Calendar (via ICS), and
          Microsoft Outlook using secure connections.
        </p>
        <div className="mt-8 flex items-center justify-center gap-6 flex-wrap text-foreground/80">
          <div className="inline-flex items-center gap-3 rounded-2xl border border-border px-4 py-2 bg-surface/70">
            <Image
              src="https://fonts.gstatic.com/s/i/productlogos/googleg/v6/24px.svg"
              alt="Google"
              width={20}
              height={20}
            />
            <span className="text-sm">Google Calendar</span>
          </div>
          <div className="inline-flex items-center gap-3 rounded-2xl border border-border px-4 py-2 bg-surface/70">
            <Image
              src="/brands/apple-white.svg"
              alt="Apple"
              width={20}
              height={20}
              className="show-dark"
            />
            <Image
              src="/brands/apple-black.svg"
              alt="Apple"
              width={20}
              height={20}
              className="show-light"
            />
            <span className="text-sm">Apple Calendar</span>
          </div>
          <div className="inline-flex items-center gap-3 rounded-2xl border border-border px-4 py-2 bg-surface/70">
            <Image
              src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg"
              alt="Microsoft"
              width={20}
              height={20}
            />
            <span className="text-sm">Outlook</span>
          </div>
        </div>
      </div>
    </section>
  );
}
