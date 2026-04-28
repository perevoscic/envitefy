"use client";

import type { OcrFact } from "@/lib/ocr/facts";

type Props = {
  facts?: OcrFact[] | null;
  className?: string;
  cardClassName?: string;
  labelColor?: string;
  valueColor?: string;
  backgroundColor?: string;
  borderColor?: string;
};

export default function OcrFactCards({
  facts,
  className = "contents",
  cardClassName = "rounded-[2.2rem] border border-black/5 bg-white p-6 shadow-sm",
  labelColor = "rgba(0,0,0,0.35)",
  valueColor = "rgba(0,0,0,0.9)",
  backgroundColor,
  borderColor,
}: Props) {
  const displayFacts = Array.isArray(facts) ? facts.filter((fact) => fact.label && fact.value) : [];
  if (!displayFacts.length) return null;

  return (
    <div className={className}>
      {displayFacts.map((fact, index) => (
        <section
          key={`${fact.label}-${fact.value}-${index}`}
          className={cardClassName}
          style={{
            backgroundColor,
            borderColor,
          }}
        >
          <div
            className="text-[10px] font-black uppercase tracking-widest"
            style={{ color: labelColor }}
          >
            {fact.label}
          </div>
          <div className="mt-2 text-lg font-bold leading-snug" style={{ color: valueColor }}>
            {fact.value}
          </div>
        </section>
      ))}
    </div>
  );
}
