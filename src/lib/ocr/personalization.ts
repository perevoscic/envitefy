import { normalizeMedicalAppointmentCategory } from "../medical-appointments.ts";

/** A small, non-identifying art brief. Never send the source document to the image model. */
export type ScanPersonalization = {
  version: 1;
  personFirstName: string | null;
  age: number | null;
  subject: string;
  medical: boolean;
  motifs: string[];
};

type PersonalizationInput = {
  title?: string | null;
  category?: string | null;
  sourceText?: string | null;
  start?: string | null;
  personName?: string | null;
  personBirthDate?: string | null;
  personAge?: number | null;
};

const SPECIALTIES: [RegExp, string, string[]][] = [
  [
    /\bENT\b|\botolaryngolog|ear[ ,/&-]+nose[ ,/&-]+(?:and[ ,/&-]+)?throat/i,
    "ENT",
    ["rounded otoscope", "ear and gentle listening waves"],
  ],
  [/\bdental|\bdentist|\borthodont/i, "dental", ["tooth", "toothbrush"]],
  [
    /\boptometr|\bophthalmolog|\beye\s+(?:exam|appointment)/i,
    "eye",
    ["eyeglasses", "soft circles of light"],
  ],
  [/\bpediatr/i, "pediatric", ["rounded stethoscope", "gentle sun"]],
  [
    /\bphysical\s+therapy|\bphysiotherap/i,
    "physical therapy",
    ["exercise band", "gentle movement arcs"],
  ],
  [/\bdermatolog/i, "dermatology", ["soft botanical leaves", "sun and shade"]],
  [/\bcardiolog/i, "cardiology", ["simple heart", "rounded stethoscope"]],
  [
    /\blab(?:oratory)?\s+(?:test|appointment|visit)|\bblood\s+(?:test|draw|work)/i,
    "lab",
    ["rounded sample tubes", "soft circles of light"],
  ],
  [
    /\bMRI\b|\bCT\s+scan|\bimaging|\bultrasound|\bx[- ]?ray/i,
    "imaging",
    ["soft rings of light", "calm geometric shapes"],
  ],
  [
    /\b(?:speech|occupational)\s+therapy|\btherapy\s+(?:appointment|session|visit)/i,
    "therapy",
    ["botanical leaves", "gentle movement arcs"],
  ],
];

const TOPICS: [RegExp, string, string[]][] = [
  [/\bgymnast/i, "gymnastics", ["gymnastics ribbon", "balance beam"]],
  [/\bfootball/i, "football", ["football", "field lines"]],
  [/\bbasketball/i, "basketball", ["basketball", "court arcs"]],
  [/\bpickleball/i, "pickleball", ["paddle", "pickleball court"]],
  [/\bsoccer/i, "soccer", ["soccer ball", "goal net"]],
  [/\bballet|\bdance/i, "dance", ["dance shoes", "flowing ribbons"]],
  [/\bswim|\bpool/i, "swimming", ["water ripples", "swimming goggles"]],
  [/\bgraduat/i, "graduation", ["graduation cap", "laurel leaves"]],
  [/\bbaby\s*shower|\bgender\s*reveal/i, "baby celebration", ["soft clouds", "small stars"]],
  [
    /\bwedding|\bbridal|\bengagement|\banniversar/i,
    "wedding celebration",
    ["botanical florals", "silk ribbon"],
  ],
  [/\bbirthday/i, "birthday", ["birthday candles", "paper streamers"]],
  [/\bopen\s*house|\bhousewarming/i, "home gathering", ["welcoming doorway", "botanical sprigs"]],
  [/\bschool|\bclass|\bparent.teacher/i, "school event", ["books", "colored pencils"]],
  [/\bconcert|\bmusic|\brecital/i, "music event", ["musical instrument", "flowing musical rhythm"]],
  [/\bmeeting|\bconference|\bworkshop/i, "meeting", ["notebook", "balanced geometric shapes"]],
  [/\btravel|\bflight|\btrip/i, "travel", ["suitcase", "abstract route curves"]],
  [/\breligious|\bchurch|\bworship/i, "community gathering", ["soft light", "olive branches"]],
];

const THEMES: [RegExp, string][] = [
  [/\bdinosaur|\bdino\b/i, "friendly dinosaurs"],
  [/\bspace|\bastronaut/i, "planets and stars"],
  [/\bbutterfl/i, "butterflies"],
  [/\bbeach|\bocean|\bmermaid/i, "shells and ocean waves"],
  [/\bart\b|\bpaint/i, "paintbrushes and colorful brush marks"],
];

function calendarParts(value: string | null | undefined): [number, number, number] | null {
  const iso = value?.match(/^(\d{4})-(\d{2})-(\d{2})(?:T|$)/);
  const us = value?.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!iso && !us) return null;
  const parts: [number, number, number] = iso
    ? [Number(iso[1]), Number(iso[2]), Number(iso[3])]
    : [Number(us?.[3]), Number(us?.[1]), Number(us?.[2])];
  const check = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  return check.getUTCFullYear() === parts[0] &&
    check.getUTCMonth() === parts[1] - 1 &&
    check.getUTCDate() === parts[2]
    ? parts
    : null;
}

export function ageOnEventDate(
  birthDate: string | null | undefined,
  eventDate: string | null | undefined,
): number | null {
  const birth = calendarParts(birthDate);
  const event = calendarParts(eventDate);
  if (!birth || !event) return null;
  const age =
    event[0] -
    birth[0] -
    (event[1] < birth[1] || (event[1] === birth[1] && event[2] < birth[2]) ? 1 : 0);
  return age >= 0 && age <= 120 ? age : null;
}

function firstName(value: string | null | undefined): string | null {
  const name = (value || "").trim();
  const given = (name.includes(",") ? name.split(",")[1] : name)?.trim().split(/\s+/)[0] || "";
  if (
    !/^[\p{L}][\p{L}'’-]{0,39}$/u.test(given) ||
    /^(patient|provider|doctor|north|south|name|upcoming|appointment|dob)$/i.test(given)
  )
    return null;
  return given === given.toUpperCase()
    ? given.toLowerCase().replace(/(^|[-’'])\p{L}/gu, (letter) => letter.toUpperCase())
    : given;
}

export function buildScanPersonalization(input: PersonalizationInput): ScanPersonalization {
  const source = input.sourceText || "";
  const text = [input.category, input.title, source].filter(Boolean).join("\n");
  const specialty = SPECIALTIES.find(([pattern]) => pattern.test(text));
  const medical =
    /\bappointments?\b|\bappts?\b|\bpatient\b|\bcheck[- ]?up\b/i.test(text) &&
    Boolean(
      specialty || /\bdoctor|\bclinic|\bphysician|\bsurgeon|\bhospital|\bmedical/i.test(text),
    );
  // Only use patient-labelled names or the name immediately above a DOB in a medical record.
  const patients = medical
    ? [
        ...source.matchAll(/(?:^|\n)[ \t]*(?:patient(?:\s+name)?|name)[ \t]*:[ \t]*([^\n\r]+)/gi),
        ...source.matchAll(
          /(?:^|\n)[ \t]*([\p{L}][\p{L} \t,'’-]{2,70})\r?\n[ \t]*(?:DOB|date\s+of\s+birth)\s*:/giu,
        ),
      ].map((match) => match[1].trim().toLowerCase())
    : [];
  const uniquePatients = [...new Set(patients)];
  const patient = uniquePatients.length === 1 ? uniquePatients[0].toUpperCase() : null;
  const name = firstName(input.personName || patient);
  const birthDates = [
    ...source.matchAll(
      /\b(?:DOB|date\s+of\s+birth)\s*:\s*(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4})/gi,
    ),
  ].map((match) => match[1]);
  const birthDate =
    input.personBirthDate ||
    (medical && name && uniquePatients.length === 1 && birthDates.length === 1
      ? birthDates[0]
      : null);
  const age =
    ageOnEventDate(birthDate || null, input.start) ??
    (Number.isInteger(input.personAge) &&
    Number(input.personAge) >= 0 &&
    Number(input.personAge) <= 120
      ? Number(input.personAge)
      : null);
  const topic = TOPICS.find(([pattern]) => pattern.test(text));
  const subject = medical ? specialty?.[1] || "medical" : topic?.[1] || "event";
  const motifs = medical
    ? specialty?.[2] || ["rounded stethoscope", "botanical leaves"]
    : topic?.[2] || ["abstract paper shapes", "botanical sprigs"];
  // Medical paperwork can mention locations/themes accidentally; never borrow those as interests.
  const themes = medical
    ? []
    : THEMES.filter(([pattern]) => pattern.test(text)).map(([, motif]) => motif);
  return {
    version: 1,
    personFirstName: name,
    age,
    subject,
    medical,
    motifs: [...motifs, ...themes].slice(0, 5),
  };
}

export function personalizedScanTitle(title: string, profile: ScanPersonalization): string {
  if (!profile.medical) return title;
  const subject = profile.subject === "medical" ? "medical" : profile.subject;
  return [profile.personFirstName, subject, "appointment"].filter(Boolean).join(" ");
}

export function personalizedScanCategory(
  category: string | null,
  profile: ScanPersonalization | null,
): string | null {
  const genericCategory =
    /^(?:(?:(?:doctor|dr\.?|medical|dental)\s+)?appointments?|general(?:\s+events?)?)?$/i;
  return profile?.medical && genericCategory.test((category || "").trim())
    ? "Medical Appointments"
    : normalizeMedicalAppointmentCategory(category);
}

/** Identity dates and record numbers cannot be candidates for the event schedule. */
export function withoutMedicalIdentityLines(text: string): string {
  return text.replace(
    /^.*\b(?:DOB|date\s+of\s+birth|patient\s*(?:ID|number)|medical\s+record|MRN)\s*:[^\n\r]*$/gim,
    "",
  );
}

export function normalizeScanPersonalization(value: unknown): ScanPersonalization | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  const allowed = [
    ...SPECIALTIES.map(([, subject]) => subject),
    ...TOPICS.map(([, subject]) => subject),
    "medical",
    "event",
  ];
  const allowedMotifs = new Set([
    ...SPECIALTIES.flatMap(([, , motifs]) => motifs),
    ...TOPICS.flatMap(([, , motifs]) => motifs),
    ...THEMES.map(([, motif]) => motif),
    "rounded stethoscope",
    "botanical leaves",
    "abstract paper shapes",
    "botanical sprigs",
  ]);
  if (
    row.version !== 1 ||
    typeof row.subject !== "string" ||
    !allowed.includes(row.subject) ||
    typeof row.medical !== "boolean"
  )
    return null;
  return {
    version: 1,
    subject: row.subject,
    medical: row.medical,
    personFirstName: firstName(
      typeof row.personFirstName === "string" ? row.personFirstName : null,
    ),
    age:
      typeof row.age === "number" && Number.isInteger(row.age) && row.age >= 0 && row.age <= 120
        ? row.age
        : null,
    motifs: Array.isArray(row.motifs)
      ? row.motifs
          .filter((motif): motif is string => typeof motif === "string" && allowedMotifs.has(motif))
          .slice(0, 5)
      : [],
  };
}

export function resolveSavedScanPersonalization(
  data: Record<string, unknown>,
  title: string,
): ScanPersonalization | null {
  const createdVia = String(data.createdVia || "");
  if (!/^ocr(?:-|$)/.test(createdVia) && createdVia !== "scan-event-page") return null;
  const saved = normalizeScanPersonalization(data.scanPersonalization);
  if (saved) return saved;
  const facts = Array.isArray(data.ocrFacts)
    ? data.ocrFacts.flatMap((fact: unknown) => {
        if (!fact || typeof fact !== "object") return [];
        const row = fact as Record<string, unknown>;
        return typeof row.label === "string" && typeof row.value === "string"
          ? [`${row.label}: ${row.value}`]
          : [];
      })
    : [];
  return buildScanPersonalization({
    title,
    category: typeof data.category === "string" ? data.category : null,
    sourceText: [typeof data.ocrText === "string" ? data.ocrText : "", ...facts].join("\n"),
    start:
      [data.start, data.startISO, data.startAt].find(
        (value): value is string => typeof value === "string",
      ) || null,
  });
}

/** Consistent display for legacy scans without changing their saved URLs or source facts. */
export function resolveSavedScanPresentation(data: Record<string, unknown>, title: string) {
  const profile = resolveSavedScanPersonalization(data, title);
  return {
    title:
      profile?.medical &&
      profile.personFirstName &&
      !title.toLowerCase().includes(profile.personFirstName.toLowerCase())
        ? personalizedScanTitle(title, profile)
        : title,
    category: personalizedScanCategory(
      typeof data.category === "string" ? data.category : null,
      profile,
    ),
  };
}

export function buildScanArtworkPrompt(profile: ScanPersonalization, variation: string): string {
  const audience =
    profile.age === null
      ? "age-neutral, polished and welcoming"
      : profile.age < 4
        ? "gentle, simple shapes for a young child"
        : profile.age < 13
          ? `playful but not babyish, appropriate for a ${profile.age}-year-old; small stars, a paper airplane and colorful building blocks`
          : profile.age < 18
            ? "understated, contemporary and suitable for a teenager; avoid childish toys"
            : "calm, refined adult editorial illustration; no toys or childish decoration";
  return [
    "Create an original landscape decorative background for an event page, not an invitation or UI mockup.",
    `Subject: ${profile.subject}${profile.medical ? " appointment" : ""}. Motifs: ${profile.motifs.join(", ")}.`,
    `Audience and tone: ${audience}. Do not infer gender, appearance or interests.`,
    "Use soft gouache, subtle paper grain, warm ivory and pale sage with teal, soft blue and butter-yellow accents. Place recognizable motifs around the outer edges and corners; keep the broad center and upper-left middle light and almost empty for dark headings and white information cards. Design for both wide desktop and narrow mobile crops.",
    profile.medical
      ? "Reassuring medical objects only. No procedure, needles, surgical tools, distress, diagnoses or detailed anatomy."
      : "Match the supplied occasion and motifs; do not invent personal details.",
    "No people, names, text, lettering, numbers, dates, logos, addresses, documents, QR codes, cards or buttons.",
    `Make a fresh composition for this opaque variation key: ${variation.replace(/[^a-zA-Z0-9-]/g, "").slice(0, 64)}.`,
  ].join("\n");
}

export function buildScanHeroPrompt(profile: ScanPersonalization, variation: string): string {
  return buildScanArtworkPrompt(profile, variation)
    .replace(
      "Create an original landscape decorative background for an event page, not an invitation or UI mockup.",
      "Create an original portrait 3:4 hero illustration for an event page, not an invitation or UI mockup.",
    )
    .replace(
      "Place recognizable motifs around the outer edges and corners; keep the broad center and upper-left middle light and almost empty for dark headings and white information cards. Design for both wide desktop and narrow mobile crops.",
      "Make the subject a complete, recognizable central composition with comfortable breathing room inside a portrait crop. Keep all important objects visible. No empty center reserved for text. Coordinate with a warm ivory and pale sage page background.",
    );
}
