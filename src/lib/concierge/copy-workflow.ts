import type { ConciergeEventDraft, ConciergePreviewCopy } from "./types.ts";
import { sanitizeGuestCopy } from "./public-copy.ts";

export function requestsInvitationCopy(message: string): boolean {
  return /\b(?:write|draft|rewrite|revise|translate|shorten|suggest|show|give|prepare)\b[\s\S]{0,140}\b(?:invitation|invite|save.the.date|wording|opening line|guest copy)\b/i.test(message)
    || /\b(?:invitation|invite|wording|guest copy)\b[\s\S]{0,80}\b(?:English|Spanish|bilingual|translate|shorter|warmer)\b/i.test(message);
}

export function copyRequirementsChanged(previous: ConciergeEventDraft, next: ConciergeEventDraft): boolean {
  const requirements = (draft: ConciergeEventDraft) => ({
    languages: draft.hostBrief?.languages?.values,
    replyPlan: draft.hostBrief?.replyPlan?.mode,
    dietary: draft.hostBrief?.dietaryNeeds?.map((note) => note.kind).sort(),
    privacy: draft.hostBrief?.privacyPreferences?.map((note) => note.kind).sort(),
    giftNote: draft.giftPreferenceNote || draft.giftNote,
  });
  return JSON.stringify(requirements(previous)) !== JSON.stringify(requirements(next));
}

/** A deliberately simple, editable draft, so missing logistics or AI availability do not block writing. */
export function provisionalInvitationCopy(draft: ConciergeEventDraft): ConciergePreviewCopy | null {
  const languages = draft.hostBrief?.languages?.values.length ? draft.hostBrief.languages.values : ["English"];
  if (languages.some((language) => !["English", "Spanish"].includes(language))) return null;
  const pending = languages.length > 1 ? "TBC / Por confirmar" : languages[0] === "Spanish" ? "Por confirmar" : "TBC";
  const privateLocation = languages.length > 1 ? "Exact address shared privately / Dirección compartida en privado" : languages[0] === "Spanish" ? "Dirección exacta compartida en privado" : "Exact address shared privately";
  const title = draft.title || "Our celebration";
  const name = draft.honoreeName;
  const manual = draft.hostBrief?.replyPlan?.mode === "manual" || draft.hostBrief?.replyPlan?.mode === "manual_private";
  const privateAddress = draft.hostBrief?.privacyPreferences?.some((note) => note.kind === "address_private")
    || /\bprivat/i.test(draft.location || "");
  const dietary = draft.hostBrief?.dietaryNeeds?.length;
  const noGifts = /\bno gifts?\b/i.test(draft.giftPreferenceNote || draft.giftNote || "");
  const paragraphs = languages.map((language) => {
    const spanish = language === "Spanish";
    const wording = [
      spanish ? (name ? `Acompáñanos a celebrar a ${name}.` : `Celebremos juntos: ${title}.`)
        : (name ? `Join us to celebrate ${name}.` : `Join us for ${title}.`),
      noGifts ? (spanish ? "Tu presencia es el mejor regalo; no hace falta traer regalos." : "Your presence is the best gift; no gifts, please.") : null,
      manual ? (spanish
        ? `Por favor, responde en privado con el número de adultos y niños que vienen${dietary ? " y sus necesidades alimentarias" : ""}.`
        : `Please reply privately with the number of adults and children coming${dietary ? " and any dietary needs" : ""}.`) : null,
      privateAddress ? (spanish ? "Compartiremos la dirección exacta en privado." : "The exact address will be shared privately.") : null,
    ].filter(Boolean).join(" ");
    return [languages.length > 1 ? (spanish ? "Español" : "English") : null, wording].filter(Boolean).join("\n");
  });
  return {
    headline: title,
    subheadline: draft.previewCopy.subheadline,
    body: sanitizeGuestCopy(paragraphs.join("\n\n")) || paragraphs.join("\n\n"),
    scheduleLine: [draft.dateText, /\b(?:am|pm)\b/i.test(draft.dateText || "") ? null : draft.timeText].filter(Boolean).join(" · ") || pending,
    locationLine: privateAddress ? (draft.location && /\bprivat/i.test(draft.location) ? draft.location : privateLocation) : draft.location || draft.venue || pending,
    cta: draft.rsvpEnabled === true ? "RSVP" : "View details",
  };
}

export function invitationCopyAnswer(draft: ConciergeEventDraft): string {
  const languages = draft.hostBrief?.languages?.values || ["English"];
  const bilingual = languages.includes("English") && languages.includes("Spanish");
  const spanishOnly = languages.length === 1 && languages[0] === "Spanish";
  return [
    draft.copyStatus === "provisional" ? "Here is a simple starting draft you can use while the remaining details come together:" : "Here is the current invitation wording:",
    draft.previewCopy.headline,
    draft.previewCopy.body,
    `${bilingual ? "When / Cuándo" : spanishOnly ? "Cuándo" : "When"}: ${draft.previewCopy.scheduleLine}`,
    `${bilingual ? "Where / Dónde" : spanishOnly ? "Dónde" : "Where"}: ${draft.previewCopy.locationLine}`,
  ].join("\n\n");
}

export function hasRequiredCopyLanguages(body: string, draft: ConciergeEventDraft): boolean {
  const languages = draft.hostBrief?.languages?.values || [];
  if (!languages.length) return true;
  const headings = [...body.matchAll(/(?:^|\n)\s*(English|Español|Spanish|French|Portuguese|German|Italian|Arabic|Hebrew|Hindi|Mandarin|Cantonese|Chinese|Japanese|Korean|Polish|Ukrainian|Russian)\s*(?::|\n)/gi)];
  const sections = headings.map((heading, index) => ({
    language: /^Español$/i.test(heading[1]) ? "spanish" : heading[1].toLowerCase(),
    content: body.slice(heading.index! + heading[0].length, headings[index + 1]?.index ?? body.length).trim(),
  }));
  // Explicit language requests require complete labelled blocks, including a single requested language.
  return sections.length === languages.length && languages.every((language) =>
    sections.some((section) => section.language === language.toLowerCase() && section.content.length > 10),
  );
}

export function nextPendingReply(previous: ConciergeEventDraft["pendingReply"], result: {
  message: string; retryReply?: boolean; unavailable?: boolean; copyStatus: ConciergeEventDraft["copyStatus"];
}): ConciergeEventDraft["pendingReply"] {
  const writing = requestsInvitationCopy(result.message);
  if (/\b(?:forget|cancel|drop|discard)\b.{0,40}\b(?:unfinished|pending|previous)\s+(?:reply|answer|request)\b/i.test(result.message)) return null;
  const unfinished = result.unavailable || writing && result.copyStatus !== "ready";
  if (unfinished) return previous && !writing && !result.retryReply ? previous : { message: result.message };
  if (result.retryReply || previous?.message === result.message || writing && previous && requestsInvitationCopy(previous.message)) return null;
  return previous || null;
}
