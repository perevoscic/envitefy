import { isMedicalAppointmentCategory } from "../medical-appointments.ts";
import type { OcrFact } from "./facts.ts";
import { withMissingContactNumbers } from "./contact-numbers.ts";

const GENERIC_APPOINTMENT_REMINDER =
  /(?:^|(?<=[.!?\n])\s*)bring\s+your\s+appointment\s+details\s+with\s+you[.!]?(?=\s|$)/gi;

const MEDICAL_RECORD_FIELD =
  /\b(?:d\.?o\.?b\.?|date\s+of\s+birth)\s*:?\s*\d|\bpatient\s*(?:id|identifier|number)\s*[:#]?\s*[\w-]*\d/i;
const MEDICAL_DETAIL_LABEL = /^(?:goodtoknow|details|notes?|overview|description)$/;

function withoutMedicalRecordCopy(value: string, facts: OcrFact[]): string {
  const identityValues = facts
    .filter((fact) =>
      /^(?:patient|patientid|appointmentprovider|clinician|phone|fax|host)$/.test(
        fact.label.toLowerCase().replace(/[^a-z]/g, ""),
      ),
    )
    .map((fact) => fact.value.toLowerCase().trim())
    .filter(Boolean);
  // Descriptions from older scans can be the whole flattened transcription. Keep
  // separate preparation sentences, but never present record fields as advice.
  return value
    .split(/\n+|(?<=[.!?])\s+/)
    .filter((part) => {
      if (MEDICAL_RECORD_FIELD.test(part)) return false;
      const lower = part.toLowerCase();
      return identityValues.filter((identity) => lower.includes(identity)).length < 3;
    })
    .join(" ")
    .trim();
}

/** Display-only labels and filtering; preserve the printed source facts and DOB for age calculation. */
export function appointmentDisplayDetails(input: {
  title: string;
  category?: string | null;
  detailCopy?: string | null;
  facts: OcrFact[];
}): { detailCopy: string; facts: OcrFact[] } {
  const detailCopy = input.detailCopy?.trim() || "";
  if (!/\bappointments?\b/i.test(`${input.category || ""} ${input.title}`)) {
    return { detailCopy, facts: input.facts };
  }
  const withoutReminder = (value: string) => value.replace(GENERIC_APPOINTMENT_REMINDER, "").trim();
  const medical = isMedicalAppointmentCategory(input.category);
  const sourceFacts = medical
    ? withMissingContactNumbers(
        input.facts,
        [
          detailCopy,
          ...input.facts
            .filter((fact) =>
              MEDICAL_DETAIL_LABEL.test(fact.label.toLowerCase().replace(/[^a-z]/g, "")),
            )
            .map((fact) => fact.value),
        ].join("\n"),
      )
    : input.facts;
  const cleanDetailCopy = (value: string) => {
    const cleaned = withoutReminder(value);
    return medical ? withoutMedicalRecordCopy(cleaned, sourceFacts) : cleaned;
  };
  return {
    detailCopy: cleanDetailCopy(detailCopy),
    facts: sourceFacts.flatMap((fact) => {
      const label = fact.label.toLowerCase().replace(/[^a-z]/g, "");
      if (/^(?:patient)?(?:dob|dateofbirth|birthdate|birthday)$/.test(label)) return [];
      const value = MEDICAL_DETAIL_LABEL.test(label)
        ? cleanDetailCopy(fact.value)
        : withoutReminder(fact.value);
      const displayLabel =
        medical && label === "appointmentprovider"
          ? "Clinician"
          : medical && label === "host"
            ? "Appointment provider"
            : fact.label;
      return value ? [{ ...fact, label: displayLabel, value }] : [];
    }),
  };
}
