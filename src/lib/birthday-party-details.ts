export type BirthdayPartyDetails = {
  theme?: string;
  activities?: string;
  notes?: string;
  dropOff?: string;
  siblings?: string;
  parking?: string;
  allergies?: string;
};

export const BIRTHDAY_GUEST_NOTE_FIELDS = [
  { key: "dropOff", label: "Drop-off & pickup", placeholder: "Should adults stay? Include pickup time and who to meet." },
  { key: "siblings", label: "Siblings & extra guests", placeholder: "Let families know whether siblings are welcome and how to RSVP for them." },
  { key: "parking", label: "Parking & arrival", placeholder: "Where to park, which entrance to use, and any accessibility details." },
  { key: "allergies", label: "Food & allergies", placeholder: "What food is planned and how guests should tell the host about allergies or dietary needs." },
] as const;

export function getBirthdayGuestNotes(party?: BirthdayPartyDetails) {
  return BIRTHDAY_GUEST_NOTE_FIELDS.flatMap(({ key, label }) => {
    const value = party?.[key];
    return typeof value === "string" && value.trim() ? [{ key, label, value: value.trim() }] : [];
  });
}

export function getBirthdayEndLocal(date: string, time: string, endTime: string, endDate = "") {
  if (!endTime) return undefined;
  const start = `${date}T${time}`;
  const end = `${endDate || date}T${endTime}`;
  return Number.isFinite(Date.parse(start)) && Date.parse(end) > Date.parse(start) ? end : undefined;
}

export function birthdayLocalDateParts(iso?: string | null) {
  if (!iso) return { date: "", time: "" };
  const value = new Date(iso);
  if (Number.isNaN(value.getTime())) return { date: "", time: "" };
  const pad = (part: number) => String(part).padStart(2, "0");
  return {
    date: `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`,
    time: `${pad(value.getHours())}:${pad(value.getMinutes())}`,
  };
}
