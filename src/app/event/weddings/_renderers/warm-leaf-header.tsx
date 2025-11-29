export default function WarmLeafHeader({
  theme,
  event,
}: {
  theme: any;
  event: any;
}) {

  return (
    <div style={{ fontFamily: theme.fonts.body }}>
      <header className="relative p-10 text-center">
        {theme.decorations.heroImage && (
          <img
            src={theme.decorations.heroImage}
            className="absolute top-0 w-full h-32 object-cover"
            alt=""
          />
        )}
        <h1
          className="relative mt-32 text-4xl"
          style={{ fontFamily: theme.fonts.headline }}
        >
          {event.headlineTitle}
        </h1>
        <p className="opacity-70">{event.date}</p>
      </header>

      <main className="max-w-3xl mx-auto p-6">
        <h2 className="text-xl font-semibold">Our Story</h2>
        <p>{event.story}</p>
      </main>
    </div>
  );
}
