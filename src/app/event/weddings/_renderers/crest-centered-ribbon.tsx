export default function CrestCenteredRibbon({
  theme,
  event,
}: {
  theme: any;
  event: any;
}) {

  return (
    <div style={{ fontFamily: theme.fonts.body }}>
      <section
        className="relative text-center py-16"
        style={{ backgroundColor: theme.colors.primary }}
      >
        {theme.decorations.heroImage && (
          <img
            src={theme.decorations.heroImage}
            className="mx-auto w-40 opacity-90 mb-4"
            alt=""
          />
        )}
        <h1
          className="text-4xl"
          style={{ fontFamily: theme.fonts.headline, color: theme.colors.secondary }}
        >
          {event.headlineTitle}
        </h1>
        <p className="opacity-80" style={{ color: theme.colors.secondary }}>
          {event.date}
        </p>
      </section>

      <main className="max-w-3xl mx-auto p-6">
        <section>
          <h2 className="text-xl font-semibold">Our Story</h2>
          <p>{event.story}</p>
        </section>
      </main>
    </div>
  );
}
