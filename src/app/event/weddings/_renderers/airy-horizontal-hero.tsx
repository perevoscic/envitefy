export default function AiryHorizontalHero({
  theme,
  event,
}: {
  theme: any;
  event: any;
}) {

  return (
    <div style={{ fontFamily: theme.fonts.body }}>
      <section className="h-[280px] flex items-center relative px-6">
        {theme.decorations.heroImage && (
          <img
            src={theme.decorations.heroImage}
            className="absolute inset-0 w-full h-full object-cover opacity-70"
            alt=""
          />
        )}

        <div className="relative text-white">
          <h1
            className="text-4xl"
            style={{ fontFamily: theme.fonts.headline }}
          >
            {event.headlineTitle}
          </h1>
          <p className="opacity-75">{event.date}</p>
        </div>
      </section>

      <main className="max-w-3xl mx-auto p-6">
        <h2 className="text-xl font-semibold">Our Story</h2>
        <p>{event.story}</p>
      </main>
    </div>
  );
}
