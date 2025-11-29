export default function CenteredMinimalHero({
  theme,
  event,
}: {
  theme: any;
  event: any;
}) {

  return (
    <div
      className="w-full min-h-screen"
      style={{ fontFamily: theme.fonts.body }}
    >
      <section
        className="h-[360px] flex items-center justify-center text-center relative"
        style={{ backgroundColor: theme.colors.primary }}
      >
        {theme.decorations.heroImage && (
          <img
            src={theme.decorations.heroImage}
            className="absolute inset-0 w-full h-full object-cover opacity-40"
            alt=""
          />
        )}

        <div className="relative text-white">
          <h1
            className="text-4xl font-semibold"
            style={{ fontFamily: theme.fonts.headline }}
          >
            {event.headlineTitle}
          </h1>
          <p className="opacity-80 mt-2">{event.date}</p>
          <p className="opacity-70">{event.location}</p>
        </div>
      </section>

      <main className="max-w-3xl mx-auto p-6 space-y-12 text-slate-700">
        {event.story && (
          <section>
            <h2 className="text-xl font-semibold">Our Story</h2>
            <p>{event.story}</p>
          </section>
        )}
      </main>
    </div>
  );
}
