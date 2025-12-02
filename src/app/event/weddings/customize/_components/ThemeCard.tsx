export default function ThemeCard({
  theme,
  selected,
  onSelect,
  disabled = false,
}: {
  theme: any;
  selected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}) {
  const primary = theme.primaryColor || "#f8fafc";
  const secondary = theme.secondaryColor || "#1f2937";
  const headlineFont = theme.headlineFont || "serif";
  const heroImage = typeof theme.heroImage === "string" ? theme.heroImage : null;

  const luminance = (hex: string) => {
    const normalized = hex.replace("#", "");
    if (normalized.length !== 6) return 0;
    const r = parseInt(normalized.slice(0, 2), 16) / 255;
    const g = parseInt(normalized.slice(2, 4), 16) / 255;
    const b = parseInt(normalized.slice(4, 6), 16) / 255;
    const channel = (c: number) =>
      c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
  };

  const textColor = (() => {
    const lum = luminance(secondary.replace("#", "").length === 6 ? secondary : "#1f2937");
    return lum > 0.7 ? "#111827" : secondary;
  })();

  return (
    <button
      onClick={onSelect}
      disabled={disabled}
      className={`border rounded-md overflow-hidden transition ${
        selected ? "border-[var(--accent-color)] ring-2 ring-[var(--accent-color)]/40" : "border-gray-200"
      }`}
      style={{
        ["--accent-color" as string]: textColor,
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      <div
        className="w-full h-20 flex items-center justify-center text-center"
        style={
          heroImage
            ? {
                backgroundImage:
                  "linear-gradient(180deg, rgba(0,0,0,0.35), rgba(0,0,0,0.55)), " + `url(${heroImage})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                color: "#f8fafc",
                fontFamily: headlineFont,
              }
            : {
                backgroundColor: primary,
                color: textColor,
                fontFamily: headlineFont,
              }
        }
      >
        <span className="text-sm font-semibold leading-tight px-2">{theme.name}</span>
      </div>
      <div className="p-2 text-left" style={{ color: textColor }}>
        <div className="text-sm font-medium" style={{ fontFamily: headlineFont, color: textColor }}>
          {theme.name}
        </div>
        <div className="text-xs uppercase" style={{ color: "#6b7280" }}>
          {theme.category}
        </div>
      </div>
    </button>
  );
}
