import { isEventDraft } from "./event-draft-access";

const record = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

/** Published signup links work without an account; explicit privacy and drafts still apply. */
export function allowsPublicSignup(data: unknown): boolean {
  const event = record(data);
  const form = record(event?.signupForm);
  if (!event || !form || isEventDraft(event)) return false;
  const visibility = [
    form.visibility,
    form.publicVisibility,
    event.signupVisibility,
    event.publicVisibility,
    event.visibility,
  ].find((value) => typeof value === "string" && value.trim());
  if (
    typeof visibility === "string" &&
    ["private", "restricted", "invite-only"].includes(
      visibility
        .trim()
        .toLowerCase()
        .replace(/[\s_]+/g, "-"),
    )
  )
    return false;
  return ![
    form.publicPage,
    form.isPublic,
    form.public,
    event.publicSignup,
    event.signupPublic,
    event.smartSignupPublic,
  ].some((value) => value === false || value === "false" || value === "0");
}
