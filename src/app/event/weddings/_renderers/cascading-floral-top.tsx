export default function CascadingFloralTop({
  theme,
  event,
}: {
  theme: any;
  event: any;
}) {

  return (
    <div style={{ fontFamily: theme.fonts.body }}>
      <div className="relative">
        {theme.decorations.heroImage && (
          <img
            src={theme.decorations.heroImage}
            className="absolute top-0 w-full h-40 object-cover"
            alt=""
          />
        )}
        <div className="pt-44 pb-10 text-center">
          <h1
            className="text-4xl"
            style={{ fontFamily: theme.fonts.headline }}
          >
            {event.headlineTitle}
          </h1>
          <p className="opacity-70">{event.date}</p>
        </div>
      </div>

      <main className="max-w-3xl mx-auto p-6">
        <section>
          <h2 className="text-xl font-semibold">Our Story</h2>
          <p>{event.story}</p>
        </section>
      </main>
    </div>
  );
}
