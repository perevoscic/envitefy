export default function MarbleSlabHero({
  theme,
  event,
}: {
  theme: any;
  event: any;
}) {

  return (
    <div style={{ fontFamily: theme.fonts.body }}>
      <div
        className="h-[320px] flex items-center justify-center text-center"
        style={{
          backgroundImage: theme.decorations.heroImage
            ? `url(${theme.decorations.heroImage})`
            : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <h1
          className="text-4xl font-bold"
          style={{ fontFamily: theme.fonts.headline }}
        >
          {event.headlineTitle}
        </h1>
      </div>

      <main className="max-w-3xl mx-auto p-6">
        <h2 className="text-xl font-semibold">Our Story</h2>
        <p>{event.story}</p>
      </main>
    </div>
  );
}
