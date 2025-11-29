export default function SplitTextureBanner({
  theme,
  event,
}: {
  theme: any;
  event: any;
}) {

  return (
    <div style={{ fontFamily: theme.fonts.body }}>
      <div className="relative h-[320px] flex items-end">
        {theme.decorations.heroImage && (
          <img
            src={theme.decorations.heroImage}
            className="absolute inset-0 w-full h-full object-cover opacity-50"
            alt=""
          />
        )}
        <div className="bg-white/80 w-full p-6 backdrop-blur">
          <h1
            className="text-3xl font-bold"
            style={{ fontFamily: theme.fonts.headline }}
          >
            {event.headlineTitle}
          </h1>
          <p className="text-sm opacity-80">{event.date}</p>
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
