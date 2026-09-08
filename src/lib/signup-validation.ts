import type { SignupForm } from "@/types/signup";
import { parseCalendarDateTimeToIso } from "@/lib/calendar-date-time";

export type SignupIssue = { field: string; step: 0 | 1; message: string };
export function validateSignupPublish(form: SignupForm): SignupIssue[] {
  const issues: SignupIssue[] = [];
  if (!form.title.trim()) issues.push({ field: "signup-title", step: 0, message: "Give your signup a title." });
  if (form.locationMode !== "tba" && !form.location?.trim()) issues.push({ field: "signup-location", step: 0, message: form.locationMode === "online" ? "Add an online meeting link." : "Add an address or choose location to be announced." });
  if (form.locationMode === "online" && form.location?.trim() && !/^https?:\/\/\S+$/i.test(form.location)) issues.push({ field: "signup-location", step: 0, message: "Use a complete meeting link beginning with https://." });
  const start = form.start ? parseCalendarDateTimeToIso(form.start, form.timezone) : null;
  const end = form.end ? parseCalendarDateTimeToIso(form.end, form.timezone) : null;
  if (form.start && !start) issues.push({ field: "signup-start", step: 0, message: "Choose a valid event date and time in your timezone." });
  if (form.end && (!end || !start || end <= start)) issues.push({ field: "signup-end", step: 0, message: "The end must be after the start." });
  if (!form.sections.some((section) => section.slots.some((slot) => slot.label.trim()))) issues.push({ field: "signup-slots", step: 1, message: "Add at least one named signup slot." });
  for (const section of form.sections) for (const slot of section.slots) {
    if (!slot.label.trim()) issues.push({ field: "signup-slots", step: 1, message: "Name or remove each empty slot." });
    if (slot.capacity !== null && (!Number.isInteger(slot.capacity) || slot.capacity < 1 || slot.capacity > 999)) issues.push({ field: "signup-slots", step: 1, message: `Use a capacity from 1 to 999 for ${slot.label || "each slot"}, or leave it unlimited.` });
    if (slot.startTime && slot.endTime && slot.endTime <= slot.startTime) issues.push({ field: "signup-slots", step: 1, message: `The end time for ${slot.label || "a slot"} must follow its start time.` });
  }
  const opens = form.settings.signupOpensAt ? parseCalendarDateTimeToIso(form.settings.signupOpensAt, form.timezone) : null;
  const closes = form.settings.signupClosesAt ? parseCalendarDateTimeToIso(form.settings.signupClosesAt, form.timezone) : null;
  if ((form.settings.signupOpensAt && !opens) || (form.settings.signupClosesAt && !closes) || (opens && closes && closes <= opens)) issues.push({ field: "signup-rules", step: 1, message: "Choose a valid signup window with closing after opening." });
  return issues.filter((item, index, all) => all.findIndex((other) => other.message === item.message) === index);
}

export function signupWindowMessage(form: SignupForm, now = new Date()): string | null {
  if (!form.enabled) return "This signup is closed. Please contact the organizer if you need to make a change.";
  const opens = parseCalendarDateTimeToIso(form.settings.signupOpensAt, form.timezone);
  const closes = parseCalendarDateTimeToIso(form.settings.signupClosesAt, form.timezone);
  if ((form.settings.signupOpensAt && !opens) || (form.settings.signupClosesAt && !closes)) return "The organizer needs to update this signup's dates.";
  if (opens && now.getTime() < Date.parse(opens)) return "Signups have not opened yet. Check back when the signup window opens.";
  if (closes && now.getTime() >= Date.parse(closes)) return "The signup window has closed. Contact the organizer if you need help.";
  return null;
}
