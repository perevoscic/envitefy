export default function SilverGradientHero({
  theme,
  event,
}: {
  theme: any;
  event: any;
}) {

  return (
    <div style={{ fontFamily: theme.fonts.body }}>
      <section
        className="h-[320px] flex items-center justify-center text-center"
        style={{
          background: `linear-gradient(180deg, ${theme.colors.primary}, ${theme.colors.secondary})`,
        }}
      >
        <h1
          className="text-4xl"
          style={{ fontFamily: theme.fonts.headline }}
        >
          {event.headlineTitle}
        </h1>
      </section>

      <main className="max-w-3xl mx-auto p-6">
        <h2 className="text-xl font-semibold">Our Story</h2>
        <p>{event.story}</p>
      </main>
    </div>
  );
}
