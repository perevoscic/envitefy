import Image from "next/image";

export default function Integrations() {
  return (
    <section aria-labelledby="integrations" className="w-full">
      <div className="max-w-7xl mx-auto px-6 pt-4">
        <h2
          id="integrations"
          className="text-2xl sm:text-3xl font-bold text-center"
        >
          Works with your calendars
        </h2>
      </div>
      <div className="max-w-7xl mx-auto px-6 py-8 mt-4 text-center">
        <div className="grid grid-cols-3 gap-4 items-center justify-center">
          <div className="flex flex-col items-center">
            <Image
              src="/google_calendar_light.png"
              alt="Google Calendar"
              width={250}
              height={100}
              className="show-light"
            />
            <Image
              src="/google_calendar_dark.png"
              alt="Google Calendar"
              width={250}
              height={100}
              className="show-dark"
            />
            <div className="inline-flex items-center gap-3 rounded-2xl border border-border px-4 py-2 bg-surface/70">
              <Image
                src="https://fonts.gstatic.com/s/i/productlogos/googleg/v6/24px.svg"
                alt="Google"
                width={20}
                height={20}
              />
              <span className="text-sm max-sm:hidden">Google Calendar</span>
            </div>
          </div>
          <div className="flex flex-col items-center">
            <Image
              src="/ics_calendar_light.png"
              alt="Apple Calendar (ICS)"
              width={250}
              height={100}
              className="show-light"
            />
            <Image
              src="/ics_calendar_dark.png"
              alt="Apple Calendar (ICS)"
              width={250}
              height={100}
              className="show-dark"
            />
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
              <span className="text-sm max-sm:hidden">Apple Calendar</span>
            </div>
          </div>
          <div className="flex flex-col items-center">
            <Image
              src="/outlook_calendar_light.png"
              alt="Microsoft Outlook"
              width={250}
              height={100}
              className="show-light"
            />
            <Image
              src="/outlook_calendar_dark.png"
              alt="Microsoft Outlook"
              width={250}
              height={100}
              className="show-dark"
            />
            <div className="inline-flex items-center gap-3 rounded-2xl border border-border px-4 py-2 bg-surface/70">
              <Image
                src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg"
                alt="Microsoft"
                width={20}
                height={20}
              />
              <span className="text-sm max-sm:hidden">Outlook Calendar</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
