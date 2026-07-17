"use client";

import { CircleDollarSign, ClipboardList, Gift, Info, Shirt, Sparkles, Users } from "lucide-react";
import type { ReactNode } from "react";
import { coalesceFactValues, type OcrFact } from "@/lib/ocr/facts";

type Props = {
  facts?: OcrFact[] | null;
  className?: string;
  cardClassName?: string;
  labelColor?: string;
  valueColor?: string;
  backgroundColor?: string;
  borderColor?: string;
  accentColor?: string;
};

function iconForFactLabel(label: string): ReactNode {
  const key = label.trim().toLowerCase();
  if (/^host$/.test(key) || /\bsponsor\b/.test(key)) return <Users className="h-5 w-5" />;
  if (/entry\s*fee|fee|cost|admission/.test(key)) return <CircleDollarSign className="h-5 w-5" />;
  if (/dress|attire/.test(key)) return <Shirt className="h-5 w-5" />;
  if (/check[-\s]?in/.test(key)) return <ClipboardList className="h-5 w-5" />;
  if (/perk|prize|gift/.test(key)) return <Gift className="h-5 w-5" />;
  if (/good\s*to\s*know|details|note/.test(key)) return <Sparkles className="h-5 w-5" />;
  return <Info className="h-5 w-5" />;
}

export default function OcrFactCards({
  facts,
  className = "contents",
  cardClassName = "rounded-[2.2rem] border border-black/5 bg-white p-6 shadow-sm",
  labelColor = "rgba(0,0,0,0.35)",
  valueColor = "rgba(0,0,0,0.9)",
  backgroundColor,
  borderColor,
  accentColor = "var(--theme-primary)",
}: Props) {
  const displayFacts = Array.isArray(facts) ? facts.filter((fact) => fact.label && fact.value) : [];
  const groupedFacts = displayFacts.reduce<Array<{ label: string; values: string[] }>>(
    (groups, fact) => {
      const label = fact.label.trim();
      const values = coalesceFactValues(
        label,
        fact.value
          .split(/\s*(?:;|\n)\s*/)
          .map((value) => value.trim())
          .filter(Boolean),
      );
      const group = groups.find((item) => item.label.toLowerCase() === label.toLowerCase());
      if (group) {
        for (const value of values) {
          if (!group.values.some((existing) => existing.toLowerCase() === value.toLowerCase())) {
            group.values.push(value);
          }
        }
        group.values = coalesceFactValues(label, group.values);
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
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div
                className="mb-4 text-[10px] font-bold uppercase tracking-widest"
                style={{ color: labelColor }}
              >
                {fact.label}
              </div>
              <div className="text-sm font-bold leading-snug" style={{ color: valueColor }}>
                {fact.values.length > 1 ? (
                  <ul
                    className={
                      fact.values.length >= 3 && fact.values.every((value) => value.length <= 28)
                        ? "grid grid-cols-2 gap-x-4 gap-y-2"
                        : "space-y-2"
                    }
                  >
                    {fact.values.map((value) => (
                      <li key={value}>{value}</li>
                    ))}
                  </ul>
                ) : (
                  fact.values[0]
                )}
              </div>
            </div>
            <div
              className="hidden h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-white shadow-lg sm:flex"
              style={{ color: accentColor }}
              aria-hidden
            >
              {iconForFactLabel(fact.label)}
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
