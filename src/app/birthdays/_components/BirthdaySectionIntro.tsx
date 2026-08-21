export default function BirthdaySectionIntro({
  eyebrow,
  title,
  body,
  centered = false,
  inverse = false,
}: {
  eyebrow: string;
  title: string;
  body?: string;
  centered?: boolean;
  inverse?: boolean;
}) {
  const alignment = centered ? "mx-auto max-w-3xl text-center" : "max-w-3xl";

  return (
    <div className={alignment}>
      <p
        className={`text-xs font-bold uppercase tracking-[0.22em] ${
          inverse ? "text-[#f5c8ad]" : "text-[var(--birthday-accent)]"
        }`}
      >
        {eyebrow}
      </p>
      <h2
        className={`mt-4 text-3xl font-semibold leading-[1.06] tracking-[-0.045em] sm:text-5xl ${
          inverse ? "!text-white" : "text-[var(--birthday-ink)]"
        }`}
      >
        {title}
      </h2>
      {body ? (
        <p
          className={`mt-5 text-base leading-8 sm:text-lg ${
            inverse ? "text-white/68" : "text-[var(--birthday-muted)]"
          }`}
        >
          {body}
        </p>
      ) : null}
    </div>
  );
}
