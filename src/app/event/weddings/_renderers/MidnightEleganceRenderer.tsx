import React from "react";

export default function MidnightEleganceRenderer({
  template,
  event,
}: {
  template: any;
  event: any;
}) {
  const { theme } = template;

  return (
    <div
      className="w-full min-h-screen flex flex-col"
      style={{
        fontFamily: theme.fonts.body,
        color: theme.colors.secondary,
      }}
    >
      {/* HERO */}
      <section
        className="relative w-full h-[380px] flex items-end justify-center overflow-hidden"
        style={{
          backgroundColor: theme.colors.primary,
        }}
      >
        {/* Hero Image */}
        {theme.decorations.heroImage && (
          <img
            src={theme.decorations.heroImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-60"
          />
        )}

        {/* Elegant Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Title */}
        <div className="relative pb-10 text-center text-white">
          <h1
            className="text-4xl md:text-5xl font-semibold"
            style={{
              fontFamily: theme.fonts.headline,
            }}
          >
            {event.headlineTitle || "Ava & Mason"}
          </h1>

          {event.date && (
            <p className="mt-2 text-sm tracking-wide opacity-90">{event.date}</p>
          )}

          {event.location && (
            <p className="text-xs mt-1 opacity-80 uppercase tracking-widest">
              {event.location}
            </p>
          )}
        </div>
      </section>

      {/* CONTENT SECTIONS */}
      <main className="w-full max-w-3xl mx-auto px-6 py-12 space-y-16">
        {/* OUR STORY */}
        {event.story && (
          <section>
            <h2
              className="text-2xl font-semibold mb-3"
              style={{ fontFamily: theme.fonts.headline }}
            >
              Our Story
            </h2>
            <p
              className="leading-relaxed"
              style={{ color: theme.colors.secondary }}
            >
              {event.story}
            </p>
          </section>
        )}

        {/* SCHEDULE */}
        {event.schedule && event.schedule.length > 0 && (
          <section>
            <h2
              className="text-2xl font-semibold mb-4"
              style={{ fontFamily: theme.fonts.headline }}
            >
              Wedding Schedule
            </h2>
            <div className="space-y-4">
              {event.schedule.map((item: any, idx: number) => (
                <div key={idx} className="border-l-4 border-[#C7A26B] pl-4">
                  <h3 className="font-medium text-lg">{item.title}</h3>
                  <p className="text-sm opacity-80">
                    {item.time} — {item.location}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* WEDDING PARTY */}
        {event.party && event.party.length > 0 && (
          <section>
            <h2
              className="text-2xl font-semibold mb-4"
              style={{ fontFamily: theme.fonts.headline }}
            >
              Wedding Party
            </h2>

            <div className="grid grid-cols-2 gap-6">
              {event.party.map((p: any, idx: number) => (
                <div key={idx}>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-sm opacity-70">{p.role}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* TRAVEL */}
        {event.travel && (
          <section>
            <h2
              className="text-2xl font-semibold mb-4"
              style={{ fontFamily: theme.fonts.headline }}
            >
              Travel
            </h2>
            <p
              className="leading-relaxed"
              style={{ color: theme.colors.secondary }}
            >
              {event.travel}
            </p>
          </section>
        )}

        {/* RSVP */}
        {event.rsvpEnabled && (
          <section className="text-center">
            <a
              href={event.rsvpLink}
              className="inline-block px-8 py-3 text-sm font-semibold rounded-md"
              style={{
                backgroundColor: theme.colors.secondary,
                color: theme.colors.primary,
              }}
            >
              RSVP
            </a>
          </section>
        )}
      </main>

      {/* FOOTER */}
      <footer
        className="py-6 text-center text-xs opacity-70"
        style={{ backgroundColor: theme.colors.primary, color: "#ffffff" }}
      >
        © {new Date().getFullYear()} {event.headlineTitle || "Your Names"}
      </footer>
    </div>
  );
}
