export default function BotanicalArchBorder({
  theme,
  event,
}: {
  theme: any;
  event: any;
}) {

  return (
    <div style={{ fontFamily: theme.fonts.body }}>
      <div
        className="relative text-center py-20 border-b-4"
        style={{ borderColor: theme.colors.primary }}
      >
        {theme.decorations.heroImage && (
          <img
            src={theme.decorations.heroImage}
            className="absolute top-0 left-1/2 -translate-x-1/2 w-56 opacity-80"
            alt=""
          />
        )}
        <h1
          className="text-4xl mt-32"
          style={{ fontFamily: theme.fonts.headline }}
        >
          {event.headlineTitle}
        </h1>
        <p className="opacity-70">{event.date}</p>
      </div>

      <main className="max-w-3xl mx-auto p-6">
        <h2 className="text-xl font-semibold">Our Story</h2>
        <p>{event.story}</p>
      </main>
    </div>
  );
}
