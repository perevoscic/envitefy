import type { ConciergeEventDraft } from "./types.ts";

/** Contract for /chat's current creation path, not every specialized event builder. */
export const CONCIERGE_CAPABILITIES = {
  workflow:
    "Generate draft preview creates artwork for review. It does not publish an event page. Publish is a separate action after review. A chat summary is not an interactive form.",
  formats: {
    "Live card":
      "A visual invitation with event details, calendar/location actions and standard RSVP when enabled.",
    "Flyer/Invitation":
      "Invitation artwork to review and share; standard RSVP can be attached when enabled.",
    "Event page":
      "A fuller event website with detail sections, schedule, location, calendar actions and standard RSVP when enabled.",
  },
  standardRsvp:
    "The current chat-created RSVP collects the guest's name, email and yes/no/maybe response. RSVP contact and deadline can be set in the draft.",
  householdRsvp:
    "Separate adult/child counts exist in specialized Envitefy flows, but this chat cannot configure those fields. Choosing Event Page instead of Live Card does not enable them.",
  customForms:
    "This chat cannot configure arbitrary RSVP questions, independent per-activity headcounts, an automatic waitlist or snack-claim slots. Smart sign-up is a separate builder for sign-up needs; it is not created merely by describing those needs in chat.",
  capacity:
    "The draft guest count is a planning figure, not an enforced capacity limit or automatic waitlist.",
  privacy:
    "This chat cannot configure RSVP-approval-based address release. Use a public location placeholder and communicate the exact address privately. A private-address request is not an access control.",
  externalActions:
    "The host shares the generated link or copy. This chat does not post to social accounts or contact guests.",
} as const;

export function conciergeCapabilityAnswer(message: string): string | null {
  if (
    !/[?]|\b(?:explain|whether|confirm|supports?|can you|does it|what happens|which|enough|working (?:form|fields))\b/i.test(
      message,
    )
  )
    return null;
  const answers: string[] = [];
  if (
    /\b(?:generate|publish|preview|button)\b/i.test(message) &&
    /\b(?:publish|live|private|preview|button|what happens)\b/i.test(message)
  ) {
    answers.push(
      "Generate draft preview makes the design for you to review; it does not publish the event. You choose Publish separately when you're happy with it.",
    );
  }
  if (
    /\b(?:household|adults? and (?:kids?|children)|adult[- /]and[- /]child|separate.*(?:adult|child)|adult.*child.*(?:count|box|field))\b/i.test(
      message,
    ) &&
    /\b(?:rsvp|count|form|field|box|response)\b/i.test(message)
  ) {
    answers.push(
      "The RSVP created here collects a name, email and yes, no or maybe. This chat cannot add separate adult and child count fields; choosing an Event page does not change that. You can collect family counts separately, or use a specialized RSVP flow.",
    );
  }
  if (
    /\b(?:separate|different|independent|each|two)\b/i.test(message) &&
    /\b(?:activit(?:y|ies)|headcounts?|each.*(?:friday|saturday|sunday))\b/i.test(message) &&
    /\b(?:rsvp|attend|form|field|support)\b/i.test(message)
  ) {
    answers.push(
      "I can include both activities in the event details, but this chat cannot build independent attendance and headcount fields for each activity. Separate event RSVPs or a separately configured form would be needed for that.",
    );
  }
  if (/\b(?:waitlist|wait list|stop people|once.*full|capacity limit)\b/i.test(message)) {
    answers.push(
      "The guest count here is for planning; it does not enforce a capacity limit or add an automatic waitlist. You would manage that limit yourself.",
    );
  }
  if (
    /\b(?:snack|bring|claim)\b/i.test(message) &&
    /\b(?:pick|slot|select|coordinate|sign.?up)\b/i.test(message)
  ) {
    answers.push(
      "For guests to claim specific snacks or slots, use the separate Smart sign-up builder. A snack note in this invitation will not create those controls.",
    );
  }
  if (
    /\baddress\b/i.test(message) &&
    /\b(?:approv|release|protected|only after|confirm)/i.test(message)
  ) {
    answers.push(
      "I can't set up address release after RSVP approval in this chat. We can display 'Exact address shared privately' and you can provide the address yourself; that wording is not an automatic privacy control.",
    );
  }
  return answers.length ? answers.join("\n\n") : null;
}

function planningHelp(message: string, draft: ConciergeEventDraft): string | null {
  const parts: string[] = [];
  const budget = draft.hostBrief?.budget;
  if (budget && /\b(?:budget|split|breakdown|allocate)\b/i.test(message)) {
    const total = budget.amount;
    const reserve = Math.round(total * 0.05);
    const food = Math.round(total * 0.65);
    const decor = Math.round(total * 0.2);
    const money = (amount: number) => `${budget.currency || ""}${amount}`;
    parts.push(/food|decor/i.test(budget.scope || "")
      ? `For your ${money(total)} food and decoration budget, a suggested split is ${money(food)} for food and drinks, ${money(decor)} for decorations, ${money(total - food - decor - reserve)} for dessert and ${money(reserve)} in reserve. These are planning amounts, not vendor quotes.`
      : `For the ${money(total)} budget${budget.scope ? ` for ${budget.scope}` : ""}, I suggest keeping ${money(reserve)} in reserve and planning the essentials within the remaining ${money(total - reserve)}. Confirm the largest costs before adding extras.`);
  }
  if (/\b(?:which|should|enough|better|difference)\b/i.test(message) && /live\s*card/i.test(message) && /event\s+page/i.test(message)) {
    parts.push(draft.additionalLocations.length > 1
      ? "I recommend an event page to keep the different locations and schedule together."
      : "I recommend a live card for a simple gathering shared in a family chat. An event page is useful when you need more room for schedules and detail sections.");
  }
  return parts.join("\n\n") || null;
}

/** A useful next step when the language model is unavailable, including after a limitation was accepted. */
export function conciergeServiceFallback(message: string, draft: ConciergeEventDraft): string | null {
  // A requested invitation is a different deliverable from advice about managing replies.
  if (/\b(?:write|draft|translate|show)\b[\s\S]{0,90}\b(?:invitation|invite|save.the.date|wording)\b/i.test(message)
    && !/\b(?:recommend|simple way|how (?:do I|can I|to))\b/i.test(message)) return planningHelp(message, draft);
  if (/\b(?:overwhelmed|on my own|starting point|sensible start|where (?:do I|to) start)\b/i.test(message)) {
    const occasion = draft.honoreeName ? `${draft.honoreeName}'s celebration` : "your event";
    const budget = message.match(/\$\s*(\d[\d,]*(?:\.\d{1,2})?)/);
    const amount = budget ? Number(budget[1].replaceAll(",", "")) : 0;
    const food = Math.round(amount * 0.65);
    const decor = Math.round(amount * 0.2);
    const dessert = Math.round(amount * 0.1);
    const stepFree = draft.hostBrief?.accessibilityNeeds?.some((note) => note.kind === "step_free" || note.kind === "wheelchair");
    return [
      `For ${occasion}, I suggest starting with a relaxed home gathering if you have the space${draft.numberOfGuests ? ` for about ${draft.numberOfGuests} guests` : ""}: simple shared food and a few personal details will keep the work manageable.`,
      planningHelp("budget", draft) || (amount > 0 ? `A suggested starting split of your $${amount}: $${food} for food and drinks, $${decor} for decorations, $${dessert} for dessert, and $${amount - food - decor - dessert} in reserve. These are planning amounts, not vendor quotes.` : null),
      stepFree ? "First, check that the gathering space has a step-free entrance and enough room for your relatives to move comfortably; the invitation can use date and venue TBC while you decide." : "First, check whether a home space will work; the invitation can use date and venue TBC while you decide.",
    ].filter(Boolean).join("\n\n");
  }
  const manualReplies =
    /\b(?:collect|manag\w*|repl\w*|rsvp|message|headcounts?)\b/i.test(message) &&
    /\b(?:adults?|children|family|numbers|vegetarian|dietary|meals)\b/i.test(message);
  if (!manualReplies) return planningHelp(message, draft) || conciergeCapabilityAnswer(message);
  const acceptedLimits = /\b(?:I understand|already know|don't explain|don’t explain|do not explain|limits again|repeating|collect replies myself)\b/i.test(message) || draft.hostBrief?.replyPlan?.mode === "manual" || draft.hostBrief?.replyPlan?.mode === "manual_private";
  const facts = acceptedLimits ? null : conciergeCapabilityAnswer(message);
  const privateAddress = /\baddress\b/i.test(message) || /\bprivat/i.test(draft.location || "");
  const guestMessage = "Please reply to me privately with the number of adults and children coming and how many vegetarian meals you need.";
  return [
    facts,
    "My recommendation is to collect one private reply per household and keep one simple list: family name, adults, children, vegetarian meals.",
    `You can send: “${guestMessage}${privateAddress ? " I'll share the exact address with you privately." : ""}”`,
    privateAddress ? "Keep the exact address off the shared card; send it in your private reply to each family." : null,
  ].filter(Boolean).join("\n\n");
}

export function conciergeDraftReview(draft: ConciergeEventDraft): string[] {
  const dateIncludesTime = /\b\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)\b|\b(?:noon|midnight)\b/i.test(draft.dateText || "");
  return [
    `Title: ${draft.title || "Not set"}`,
    `When: ${[draft.dateText, dateIncludesTime ? null : draft.timeText].filter(Boolean).join(" · ") || "Not set"}`,
    `Where: ${[...new Set([draft.venue, draft.location].filter(Boolean))].join(" · ") || "Not set"}`,
    `RSVP: ${draft.rsvpEnabled === true ? "Name, email, yes / no / maybe" : draft.rsvpEnabled === false ? "Off" : "Not decided"}`,
    ...(draft.rsvpDeadline ? [`RSVP deadline: ${draft.rsvpDeadline}`] : []),
    ...(draft.numberOfGuests ? [`Expected guests: ${draft.numberOfGuests} (planning count)`] : []),
    ...(draft.giftPreferenceNote || draft.giftNote
      ? [`Gift note: ${draft.giftPreferenceNote || draft.giftNote}`]
      : []),
  ];
}
