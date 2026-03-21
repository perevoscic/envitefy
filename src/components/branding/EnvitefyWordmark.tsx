type EnvitefyWordmarkProps = {
  className?: string;
};

const WORDMARK_GRADIENT =
  "linear-gradient(96deg, #6b3cff 0%, #6757ff 22%, #5a7dff 54%, #37a8ff 100%)";

export default function EnvitefyWordmark({
  className = "",
}: EnvitefyWordmarkProps) {
  return (
    <span
      aria-label="envitefy"
      className="inline-block shrink-0 origin-center scale-[1.80]"
    >
      <span
        aria-hidden
        className={`josefin-slab-variable inline-block shrink-0 whitespace-nowrap align-middle overflow-visible leading-[1.16] pl-[0.02em] pr-[0.14em] pt-[0.04em] pb-[0.16em] ${className}`.trim()}
        style={{
          fontFamily: 'var(--font-josefin-slab), "Josefin Slab", serif',
          fontWeight: 700,
          fontOpticalSizing: "auto",
          letterSpacing: "-0.055em",
          fontStyle: "normal",
          backgroundImage: WORDMARK_GRADIENT,
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          color: "transparent",
          WebkitTextFillColor: "transparent",
        }}
      >
        envitefy
      </span>
    </span>
  );
}
