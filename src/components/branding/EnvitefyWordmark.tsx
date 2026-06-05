type EnvitefyWordmarkProps = {
  className?: string;
  scaled?: boolean;
  shine?: boolean;
  tone?: "gradient" | "light";
};

const WORDMARK_GRADIENT =
  "linear-gradient(96deg, #6b3cff 0%, #6757ff 22%, #5a7dff 54%, #37a8ff 100%)";
const WORDMARK_SHINE_GRADIENT =
  "linear-gradient(100deg, #6b3cff 0%, #6757ff 22%, #ffffff 39%, #5a7dff 52%, #37a8ff 100%)";

export default function EnvitefyWordmark({
  className = "",
  scaled = true,
  shine = false,
  tone = "gradient",
}: EnvitefyWordmarkProps) {
  return (
    <span
      role="img"
      aria-label="envitefy"
      className={`inline-block shrink-0 origin-center ${scaled ? "scale-[2.95]" : ""}`.trim()}
    >
      <span
        aria-hidden
        className={`josefin-slab-variable inline-block shrink-0 whitespace-nowrap align-middle overflow-visible leading-[1.16] pl-[0.02em] pr-[0.14em] pt-[0.04em] pb-[0.16em] ${
          shine ? "envitefy-wordmark-shine" : ""
        } ${className}`.trim()}
        style={{
          fontFamily: 'var(--font-josefin-slab), "Josefin Slab", serif',
          fontWeight: 700,
          fontOpticalSizing: "auto",
          letterSpacing: "-0.075em",
          fontStyle: "normal",
          ...(tone === "gradient"
            ? {
                backgroundImage: shine ? WORDMARK_SHINE_GRADIENT : WORDMARK_GRADIENT,
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                color: "transparent",
                WebkitTextFillColor: "transparent",
              }
            : {
                color: "#ffffff",
                WebkitTextFillColor: "#ffffff",
              }),
        }}
      >
        envitefy
      </span>
    </span>
  );
}
