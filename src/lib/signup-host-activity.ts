import type { SignupForm, SignupResponse } from "@/types/signup";

export type SignupHostAlertKind =
  | "new_signup"
  | "changed"
  | "cancelled"
  | "waitlisted"
  | "promoted";
export type SignupHostAlertPreferences = {
  newSignups: boolean;
  changes: boolean;
  cancellations: boolean;
  waitlist: boolean;
};
export type SignupHostActivity = {
  kind: SignupHostAlertKind;
  responseId: string;
  name: string;
  email: string | null;
  phone: string | null;
  note: string | null;
  guests: number;
  answers: Array<{ question: string; answer: string }>;
  selections: string[];
  previousSelections: string[];
  changes: string[];
  status: SignupResponse["status"];
};

export const SIGNUP_ALERT_LABELS: Record<SignupHostAlertKind, string> = {
  new_signup: "New signup",
  changed: "Signup changed",
  cancelled: "Signup cancelled",
  waitlisted: "Joined the waitlist",
  promoted: "Confirmed from the waitlist",
};

export function defaultSignupHostPreferences(owner: boolean): SignupHostAlertPreferences {
  return { newSignups: owner, changes: owner, cancellations: owner, waitlist: owner };
}

export function wantsSignupHostAlert(
  preferences: SignupHostAlertPreferences,
  kind: SignupHostAlertKind,
) {
  return kind === "new_signup"
    ? preferences.newSignups
    : kind === "changed"
      ? preferences.changes
      : kind === "cancelled"
        ? preferences.cancellations
        : preferences.waitlist;
}

export function signupSelectionLabels(form: SignupForm, response: SignupResponse): string[] {
  return response.slots.map((selection) => {
    const section = form.sections.find((item) => item.id === selection.sectionId);
    const slot = section?.slots.find((item) => item.id === selection.slotId);
    const time = [slot?.startTime, slot?.endTime].filter(Boolean).join("–");
    return `${section?.title || "Section"}: ${slot?.label || "Removed slot"} ×${selection.quantity}${time ? ` (${time}${form.timezone ? `, ${form.timezone}` : ""})` : ""}`;
  });
}

function content(response: SignupResponse) {
  return JSON.stringify({
    name: response.name,
    email: response.email || null,
    phone: response.phone || null,
    guests: response.guests || 0,
    note: response.note || null,
    status: response.status,
    slots: response.slots
      .slice()
      .sort((a, b) => `${a.sectionId}:${a.slotId}`.localeCompare(`${b.sectionId}:${b.slotId}`)),
    answers: (response.answers || [])
      .slice()
      .sort((a, b) => a.questionId.localeCompare(b.questionId)),
  });
}

/** Compare committed values, including people automatically promoted by another cancellation. */
export function signupHostActivities(before: SignupForm, after: SignupForm): SignupHostActivity[] {
  return after.responses.flatMap((response) => {
    const previous = before.responses.find((item) => item.id === response.id);
    if (previous && content(previous) === content(response)) return [];
    const kind: SignupHostAlertKind =
      response.status === "cancelled"
        ? "cancelled"
        : previous?.status === "waitlisted" && response.status === "confirmed"
          ? "promoted"
          : response.status === "waitlisted" && previous?.status !== "waitlisted"
            ? "waitlisted"
            : previous
              ? "changed"
              : "new_signup";
    const changes: string[] = [];
    if (previous) {
      for (const [key, label] of [
        ["name", "Name"],
        ["email", "Email"],
        ["phone", "Phone"],
        ["note", "Note"],
        ["guests", "Extra guests"],
        ["status", "Status"],
      ] as const) {
        if ((previous[key] || "") !== (response[key] || ""))
          changes.push(
            `${label}: ${key === "guests" ? previous.guests || 0 : previous[key] || "Not provided"} → ${key === "guests" ? response.guests || 0 : response[key] || "Not provided"}`,
          );
      }
      for (const question of after.questions) {
        const oldAnswer =
          previous.answers?.find((item) => item.questionId === question.id)?.value ||
          "Not provided";
        const newAnswer =
          response.answers?.find((item) => item.questionId === question.id)?.value ||
          "Not provided";
        if (oldAnswer !== newAnswer)
          changes.push(`${question.prompt}: ${oldAnswer} → ${newAnswer}`);
      }
    }
    return [
      {
        kind,
        responseId: response.id,
        name: response.name,
        email: response.email || null,
        phone: response.phone || null,
        note: response.note || null,
        guests: response.guests || 0,
        answers: (response.answers || []).map((answer) => ({
          question:
            after.questions.find((question) => question.id === answer.questionId)?.prompt ||
            "Answer",
          answer: answer.value,
        })),
        selections: signupSelectionLabels(after, response),
        previousSelections: previous ? signupSelectionLabels(before, previous) : [],
        changes,
        status: response.status,
      },
    ];
  });
}

/** A lost connection while submitting DATA is not proof of rejection; don't resend blindly. */
export function uncertainSignupSmtpResult(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const failure = error as { code?: unknown; command?: unknown; responseCode?: unknown };
  if (typeof failure.responseCode === "number" && failure.responseCode >= 400) return false;
  const command = String(failure.command || "").toUpperCase();
  if (/^(CONN|EHLO|HELO|AUTH|STARTTLS|MAIL|RCPT)\b/.test(command)) return false;
  return (
    command === "DATA" ||
    ["ETIMEDOUT", "ECONNRESET", "EPIPE", "ECONNECTION", "ESOCKET"].includes(String(failure.code))
  );
}
