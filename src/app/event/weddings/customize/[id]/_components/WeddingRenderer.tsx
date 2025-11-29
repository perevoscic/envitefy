type WeddingRendererProps = {
  template: any;
  event: any;
};

export default function WeddingRenderer({ template, event }: WeddingRendererProps) {
  const colors = template?.theme?.colors || {};
  const fonts = template?.theme?.fonts || {};
  const decorations = template?.theme?.decorations || {};

  const headlineStyle = {
    color: colors.primary || "#111827",
    fontFamily: fonts.headline || "serif",
  } as const;

  const bodyStyle = {
    color: colors.secondary || "#6b7280",
    fontFamily: fonts.body || "sans-serif",
  } as const;

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
      <div
        className="relative h-64 flex items-end justify-start"
        style={{
          backgroundColor: colors.primary || "#0f172a",
          backgroundImage: decorations.heroImage
            ? `linear-gradient(180deg, rgba(0,0,0,0.2), rgba(0,0,0,0.6)), url(${decorations.heroImage})`
            : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="p-8 w-full">
          <p className="text-xs uppercase tracking-[0.3em] text-white/80 mb-2">
            Wedding of
          </p>
          <h1
            className="text-3xl sm:text-4xl font-semibold text-white drop-shadow"
            style={headlineStyle}
          >
            {event?.title || `${event?.partner1 || "Partner 1"} & ${event?.partner2 || "Partner 2"}`}
          </h1>
          <p className="text-white/80 mt-2" style={bodyStyle}>
            {event?.date || ""} {event?.location ? `• ${event.location}` : ""}
          </p>
        </div>
      </div>

      <div className="p-6 space-y-4" style={bodyStyle}>
        <div>
          <h2 className="text-lg font-semibold" style={headlineStyle}>
            Details
          </h2>
          <p className="text-sm mt-2 text-slate-600" style={bodyStyle}>
            {event?.description ||
              "Preview your wedding website with the selected theme. Customize sections from the panel to the right."}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-lg border border-slate-100 p-4 bg-slate-50/60">
            <p className="text-xs uppercase tracking-wide text-slate-500">When</p>
            <p className="text-sm font-medium mt-1 text-slate-800">
              {event?.date || "TBD"} {event?.time || ""}
            </p>
          </div>
          <div className="rounded-lg border border-slate-100 p-4 bg-slate-50/60">
            <p className="text-xs uppercase tracking-wide text-slate-500">Where</p>
            <p className="text-sm font-medium mt-1 text-slate-800">
              {event?.location || "Add your venue details"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
