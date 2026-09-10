"use client";

import {
  Building2,
  CircleDollarSign,
  ClipboardList,
  Gift,
  IdCard,
  Info,
  Phone,
  Printer,
  Shirt,
  Sparkles,
  Stethoscope,
  UserRound,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";
import EventDetailText from "./EventDetailText";
import { coalesceFactValues, type OcrFact } from "@/lib/ocr/facts";
import {
  combinePhoneAndFaxCards,
  contactNumberLabel,
  type OcrFactCard,
} from "@/lib/ocr/contact-numbers";

type Props = {
  facts?: OcrFact[] | null;
  className?: string;
  cardClassName?: string;
  labelColor?: string;
  valueColor?: string;
  backgroundColor?: string;
  borderColor?: string;
  accentColor?: string;
  compact?: boolean;
  combinePhoneAndFax?: boolean;
  interactive?: boolean;
};

function iconForFactLabel(label: string): ReactNode {
  const key = label
    .trim()
    .toLowerCase()
    .replace(/[._-]+/g, " ");
  if (/^patient\s*(?:id|identifier|number)$/.test(key)) return <IdCard className="h-5 w-5" />;
  if (/^patient(?:\s+name)?$/.test(key)) return <UserRound className="h-5 w-5" />;
  if (/^(?:clinician|doctor|physician|specialist|therapist)$/.test(key))
    return <Stethoscope className="h-5 w-5" />;
  if (/^(?:appointment\s+provider|clinic|practice|medical\s+center)$/.test(key))
    return <Building2 className="h-5 w-5" />;
  if (/^fax(?:\s+(?:number|no))?$/.test(key)) return <Printer className="h-5 w-5" />;
  if (key === "phone & fax" || contactNumberLabel(label) === "Phone")
    return <Phone className="h-5 w-5" />;
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
  compact = false,
  combinePhoneAndFax = false,
  interactive = true,
}: Props) {
  const displayFacts = Array.isArray(facts) ? facts.filter((fact) => fact.label && fact.value) : [];
  const groupedFacts = displayFacts.reduce<OcrFactCard[]>((groups, fact) => {
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
  }, []);
  if (!groupedFacts.length) return null;
  const cards = combinePhoneAndFax ? combinePhoneAndFaxCards(groupedFacts) : groupedFacts;

  return (
    <div className={className}>
      {cards.map((fact, index) => (
        <section
          key={`${fact.label}-${fact.values.join("|")}-${index}`}
          className={cardClassName}
          style={{
            backgroundColor,
            borderColor,
          }}
        >
          <div
            className={
              compact
                ? "grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-2 gap-y-3 sm:flex sm:justify-between sm:gap-4"
                : "flex items-start justify-between gap-3 sm:gap-4"
            }
          >
            <div className={compact ? "contents sm:block sm:min-w-0" : "min-w-0"}>
              <div
                className={`${compact ? "self-center sm:mb-4" : "mb-4"} text-[10px] font-bold uppercase tracking-widest`}
                style={{ color: labelColor }}
              >
                {fact.label}
              </div>
              <div
                className={`${compact ? "col-span-2 row-start-2 " : ""}break-words text-sm font-bold leading-snug`}
                style={{ color: valueColor }}
              >
                {fact.contacts ? (
                  <dl className="space-y-2">
                    {fact.contacts.map((contact) => (
                      <div key={`${contact.label}-${contact.value}`}>
                        <dt
                          className="text-[10px] font-semibold uppercase tracking-wider"
                          style={{ color: labelColor }}
                        >
                          {contact.label}
                        </dt>
                        <dd className="mt-0.5"><EventDetailText text={contact.value} label={contact.label} interactive={interactive} /></dd>
                      </div>
                    ))}
                  </dl>
                ) : fact.values.length > 1 ? (
                  <ul
                    className={
                      fact.values.length >= 3 && fact.values.every((value) => value.length <= 28)
                        ? `grid ${compact ? "sm:grid-cols-2" : "grid-cols-2"} gap-x-4 gap-y-2`
                        : "space-y-2"
                    }
                  >
                    {fact.values.map((value) => (
                      <li key={value}><EventDetailText text={value} label={fact.label} interactive={interactive} /></li>
                    ))}
                  </ul>
                ) : (
                  <EventDetailText text={fact.values[0]} label={fact.label} interactive={interactive} />
                )}
              </div>
            </div>
            <div
              className="col-start-2 row-start-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-lg sm:h-12 sm:w-12"
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
