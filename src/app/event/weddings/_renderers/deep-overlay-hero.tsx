export default function DeepOverlayHero({
  theme,
  event,
}: {
  theme: any;
  event: any;
}) {

  return (
    <div className="w-full min-h-screen" style={{ fontFamily: theme.fonts.body }}>
      <section className="relative h-[380px] flex items-center justify-center">
        {theme.decorations.heroImage && (
          <img
            src={theme.decorations.heroImage}
            className="absolute inset-0 w-full h-full object-cover"
            alt=""
          />
        )}
        <div className="absolute inset-0 bg-black/60" />

        <h1
          className="relative text-white text-5xl"
          style={{ fontFamily: theme.fonts.headline }}
        >
          {event.headlineTitle}
        </h1>
      </section>

      <main className="max-w-3xl mx-auto p-6 text-slate-200">
        {event.story && (
          <section>
            <h2 className="text-xl font-bold">Our Story</h2>
            <p>{event.story}</p>
          </section>
        )}
      </main>
    </div>
  );
}
