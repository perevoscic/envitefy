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
  const groupedFacts = displayFacts.reduce<Array<{ label: string; values: string[] }>>(
    (groups, fact) => {
      const label = fact.label.trim();
      const values = fact.value
        .split(/\s*(?:;|\n)\s*/)
        .map((value) => value.trim())
        .filter(Boolean);
      const group = groups.find((item) => item.label.toLowerCase() === label.toLowerCase());
      if (group) {
        for (const value of values) {
          if (!group.values.some((existing) => existing.toLowerCase() === value.toLowerCase())) {
            group.values.push(value);
          }
        }
      } else {
        groups.push({ label, values });
      }
      return groups;
    },
    [],
  );
  if (!groupedFacts.length) return null;

  return (
    <div className={className}>
      {groupedFacts.map((fact, index) => (
        <section
          key={`${fact.label}-${fact.values.join("|")}-${index}`}
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
            {fact.values.length > 1 ? (
              <ul className="grid gap-1 sm:grid-cols-2">
                {fact.values.map((value) => (
                  <li key={value}>{value}</li>
                ))}
              </ul>
            ) : (
              fact.values[0]
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
