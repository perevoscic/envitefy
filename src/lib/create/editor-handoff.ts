import { normalizeSchoolTemplate } from "../school-events";
import { normalizeScanSchedule, scanScheduleHistoryFields } from "../scan-schedule";
import type { DraftValue } from "../template-draft-storage";
import type { CreationIntake } from "./creation-intake";
import { informationForCreation } from "./creation-information";
export { creationComposition } from "./creation-information";
import { type CustomEventInformation } from "../event-custom-design";
import { getTemplates as getSignupTemplates } from "../public-template-catalogs/signup-forms";
import { createEmptySignupTemplateForm } from "../signup-starters";
import { createLiveCardForm, type LiveCardEventType } from "../livecard-builder";
import { getGeneralEventDesign } from "../general-event-designs";
import { parseCalendarDateTimeToIso } from "../calendar-date-time";
import type { EventEditorPayload } from "../event-editor";
import { normalizeCreationCategory } from "../creation-access";
import { buildGymnasticsEventDateTimes } from "../gymnastics-event-dates";

/** Imported event-local clocks keep their supplied zone through native writers. */
export function creationNativePayload(payload: EventEditorPayload, snapshot: object): EventEditorPayload {
  const data = object(object(snapshot).data);
  const facts: Record<string, DraftValue | undefined> = {};
  for (const key of ["rsvpPhone", "rsvpEmail", "hostName"]) if (typeof data[key] === "string") facts[key] = data[key];
  if (typeof data.timezone === "string" && data.timezone && typeof data.date === "string" && data.date) {
    const gymnastics = String(payload.data.category || "").toLowerCase() === "gymnastics";
    const dates = gymnastics ? buildGymnasticsEventDateTimes(data) : null;
    const start = dates ? dates.startISO : parseCalendarDateTimeToIso(`${data.date}${data.time ? `T${data.time}` : ""}`, data.timezone);
    const end = dates ? dates.endISO : data.endTime ? parseCalendarDateTimeToIso(`${data.endDate || data.date}T${data.endTime}`, data.timezone) : null;
    Object.assign(facts, { timezone: data.timezone, tz: data.timezone, start, startAt: start, startISO: start, end, endAt: end, endISO: end, allDay: dates?.allDay ?? !data.time });
    if (gymnastics) facts.gymnasticsDateVersion = 1;
    if (gymnastics && payload.data.builderDraft) {
      const builder = object(payload.data.builderDraft);
      facts.builderDraft = { ...builder, event: { ...object(builder.event), ...facts } };
    }
  }
  const schoolTemplate = normalizeSchoolTemplate(data.schoolTemplate);
  if (schoolTemplate) Object.assign(facts, { schoolTemplate, creationCollection: "school", category: "School & classroom" });
  const schedule = normalizeScanSchedule(data.scanSchedule);
  if (schedule?.kind === "school-memo") Object.assign(facts, { scanSchedule: schedule, ...scanScheduleHistoryFields(schedule), visibility: "private", noindex: true });
  return { ...payload, data: { ...payload.data, ...facts } };
}
const object = (value: unknown): Record<string, any> => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, any> : {};
/** Start with the native editor's complete structural defaults, replacing sample facts only. */
export function hydrateCreationValue<S>(category: string, key: string, initial: S, information?: CustomEventInformation, templateId?: string): S {
  if (!information || key !== "data") return initial;
  const d = information.details, data = structuredClone(initial) as Record<string, any>;
  Object.assign(data, { date: d.date, time: d.time, endDate: d.endDate, endTime: d.endTime, timezone: d.timezone, venue: d.venue, address: d.location, city: "", state: "", title: d.title, details: d.description, rsvpEnabled: d.rsvpEnabled, rsvpDeadline: "", hostName: d.host, rsvpPhone: d.rsvpPhone, rsvpEmail: d.rsvpEmail });
  if (d.schoolTemplate) { data.schoolTemplate = d.schoolTemplate; data.creationCollection = "school"; }
  if (d.scanSchedule?.kind === "school-memo") {
    data.scanSchedule = structuredClone(d.scanSchedule);
    if (!templateId?.startsWith("school--")) data.hero = "/templates/event-pages/v2/open-house/school-open-house-paper-learning-garden.webp";
  }
  if ("rsvp" in data) data.rsvp = { ...object(data.rsvp), isEnabled: d.rsvpEnabled, deadline: "", phone: d.rsvpPhone, email: d.rsvpEmail };
  if ("hosts" in data) data.hosts = d.host ? [{ id: 1, name: d.host, role: "Host" }] : [];
  for (const key of ["gallery", "weddingParty", "thingsToDo", "schedule"]) if (key in data) data[key] = [];
  for (const key of ["registry", "registries"]) if (key in data) data[key] = d.registryLinks.map((link, index) => ({ id: index + 1, ...link }));
  if ("travel" in data) data.travel = { hotels: [], airports: [], directions: d.location, shuttle: "" };
  if (category === "weddings") Object.assign(data, { partner1: d.title, partner2: "", story: d.description, theme: { ...object(data.theme), themeId: templateId } });
  if (category === "birthdays" || category === "anniversaries") {
    const name = d.title.match(/^(.+?)(?:['’]s|\s+turns?\s+\d)/i)?.[1] || "";
    const age = d.title.match(/\b(\d{1,3})(?:st|nd|rd|th)?\s+(?:birthday|anniversary)|\bturn(?:s|ing)?\s+(\d{1,3})/i);
    Object.assign(data, { childName: name, age: age ? Number(age[1] || age[2]) : "", headlineTitle: d.title, partyDetails: { ...object(data.partyDetails), theme: "", activities: "", notes: d.description }, theme: { ...object(data.theme), professionalThemeId: templateId } });
  }
  if (category === "baby-showers" || category === "bridal-showers") Object.assign(data, { eventTitle: d.title, babyName: "", momName: "", babyDetails: { ...object(data.babyDetails), expectingDate: "", gender: "", notes: d.description }, momDetails: { notes: "" } });
  if (category === "gender-reveal") Object.assign(data, { eventTitle: d.title, parentsName: "", eventDetails: { expectingDate: "", notes: d.description } });
  if (category === "gymnastics") data.pageTemplateId = templateId;
  if (["appointments", "workshops", "special-events"].includes(category)) data.hero = getGeneralEventDesign(templateId)?.artwork || data.hero;
  return data as S;
}

export function creationSignupForm(information: CustomEventInformation | undefined, templateId: string) {
  const template = getSignupTemplates().find(template => template.id === templateId);
  const form = createEmptySignupTemplateForm(template || undefined);
  if (!information) return form;
  const d = information.details;
  return { ...form, title: d.title, description: d.description, venue: d.venue, location: d.location, start: d.date ? `${d.date}${d.time ? `T${d.time}` : ""}` : null, end: (d.endDate || d.date) && d.endTime ? `${d.endDate || d.date}T${d.endTime}` : null, timezone: d.timezone || null, sections: d.sections.map((section, index) => ({ id: `import-${index}`, kind: "info" as const, title: section.title, description: section.body, slots: [] })), responses: [], availability: undefined };
}
export function creationLiveCardForm(information?: CustomEventInformation) {
  const form = createLiveCardForm("");
  if (!information) return form;
  const d = information.details;
  const types: Record<string, LiveCardEventType> = { birthdays: "Birthday", weddings: "Wedding", anniversaries: "Anniversary", "baby-showers": "Baby shower", "bridal-showers": "Bridal shower", "gender-reveal": "Gender reveal" };
  return { ...form, title: d.title, creationCategory: normalizeCreationCategory(information.category) || "general", eventType: types[information.category] || "General event", overview: d.description, date: d.date, startTime: d.time, endDate: d.endDate, endTime: d.endTime, timezone: d.timezone, hostName: d.host, hostPhone: d.rsvpPhone, hostEmail: d.rsvpEmail, rsvpEnabled: d.rsvpEnabled, registryEnabled: Boolean(d.registryLinks.length), registryUrl: d.registryLinks[0]?.url || "", instructions: d.sections.map(section => `${section.title}\n${section.body}`).join("\n\n"), locations: [{ ...form.locations[0], venue: d.venue, address: d.location, resolution: "unresolved" as const }] };
}

export { prepareCreationEditor } from "./editor-navigation";
import { prepareCreationEditor } from "./editor-navigation";

export { informationForCreation } from "./creation-information";

export async function prepareOriginalCreationEditor(intake: CreationIntake): Promise<string> {
  const file = intake.source.files[0];
  if (intake.source.files.length !== 1 || !/^image\/(jpeg|png|webp)$/.test(file?.type || "")) throw new Error("Choose one invitation image to keep its original design.");
  const artwork = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("The invitation image could not be opened.")); reader.onerror = () => reject(reader.error); reader.readAsDataURL(file); });
  const information = informationForCreation(intake);
  const customPage = { version: 1 as const, category: information.category, design: information.design, details: information.details, artwork };
  return prepareCreationEditor({ ...intake, customPage }, { id: "original-upload", title: "Keep uploaded design", imageUrl: artwork, category: information.category, description: "", style: "Original", family: "custom", href: `/event/design/customize?category=${information.category}` });
}
