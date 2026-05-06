import type {
  ConciergeEventDraft,
  ConciergeEventType,
  CreationSourceContext,
  RequestedOutput,
} from "./types.ts";

export type RequirementField =
  | "sourceContext"
  | "eventPurpose"
  | "honoreeName"
  | "ageOrMilestone"
  | "date"
  | "time"
  | "location"
  | "rsvpEnabled"
  | "numberOfGuests"
  | "tone";

export type OutputRequirement = {
  label: string;
  requiredAny: string[];
  requiredFields: RequirementField[];
  optional: string[];
  firstQuestion: string;
  previewCta: string;
  visualOutput: boolean;
};

type CategoryRequirement = {
  label: string;
  requiredFields: RequirementField[];
  intakeQuestions: string[];
  fieldQuestions?: Partial<Record<RequirementField, string>>;
  suggestedReplies?: Partial<Record<RequirementField, string[]>>;
};

export type RequirementPlan = {
  primaryOutput: RequestedOutput;
  output: OutputRequirement;
  eventLabel: string;
  requiredFields: RequirementField[];
  intakeQuestions: string[];
  fieldQuestions: Partial<Record<RequirementField, string>>;
  suggestedReplies: Partial<Record<RequirementField, string[]>>;
  shouldAskTone: boolean;
};

function cleanString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value.replace(/\s+/g, " ").trim();
  return cleaned || null;
}

export const OUTPUT_REQUIREMENTS: Record<RequestedOutput, OutputRequirement> = {
  event_page: {
    label: "Event page",
    requiredAny: ["eventPurpose", "title", "sourceContext"],
    requiredFields: ["eventPurpose", "date", "time", "location"],
    optional: ["rsvp", "registry", "schedule", "travel", "links"],
    firstQuestion: "What should this event page be for?",
    previewCta: "Create first preview",
    visualOutput: true,
  },
  live_card: {
    label: "Live card",
    requiredAny: ["eventPurpose", "title", "sourceContext"],
    requiredFields: ["eventPurpose", "date", "time", "location"],
    optional: ["rsvp", "theme"],
    firstQuestion:
      "What should this live card be for? Tell me what you're celebrating, or upload an invite/photo and I'll build the first version.",
    previewCta: "Create first preview",
    visualOutput: true,
  },
  digital_flyer: {
    label: "Flyer invite",
    requiredAny: ["eventPurpose", "title", "sourceContext"],
    requiredFields: ["eventPurpose", "date", "time", "location"],
    optional: ["rsvp", "theme"],
    firstQuestion: "What should this flyer invite be for?",
    previewCta: "Create first preview",
    visualOutput: true,
  },
  invitation: {
    label: "Invitation",
    requiredAny: ["eventPurpose", "title", "sourceContext"],
    requiredFields: ["eventPurpose", "date", "time", "location"],
    optional: ["rsvp", "theme"],
    firstQuestion: "What are we inviting people to?",
    previewCta: "Create first preview",
    visualOutput: true,
  },
  rsvp_page: {
    label: "RSVP page",
    requiredAny: ["eventPurpose", "title", "sourceContext"],
    requiredFields: ["eventPurpose", "date", "time", "location"],
    optional: ["guest count", "deadline"],
    firstQuestion: "Which event should collect RSVPs?",
    previewCta: "Create first preview",
    visualOutput: false,
  },
  signup_form: {
    label: "Smart sign-up form",
    requiredAny: ["eventPurpose", "title", "sourceContext"],
    requiredFields: ["eventPurpose", "date", "time", "location"],
    optional: ["slots", "volunteers", "supplies"],
    firstQuestion: "What should this sign-up form be for?",
    previewCta: "Create sign-up form",
    visualOutput: false,
  },
  whatsapp: {
    label: "WhatsApp",
    requiredAny: ["eventPurpose", "title", "sourceContext"],
    requiredFields: ["eventPurpose", "date", "location"],
    optional: ["time"],
    firstQuestion: "What event or source should I use?",
    previewCta: "Write copy",
    visualOutput: false,
  },
  text_message: {
    label: "Text message",
    requiredAny: ["eventPurpose", "title", "sourceContext"],
    requiredFields: ["eventPurpose", "date", "location"],
    optional: ["time"],
    firstQuestion: "What event or source should I use?",
    previewCta: "Write copy",
    visualOutput: false,
  },
  printable_flyer: {
    label: "Printable flyer",
    requiredAny: ["eventPurpose", "title", "sourceContext"],
    requiredFields: ["eventPurpose", "date", "time", "location"],
    optional: ["rsvp", "theme"],
    firstQuestion: "What event or source should I use?",
    previewCta: "Create first preview",
    visualOutput: true,
  },
  instagram_story: {
    label: "Instagram story",
    requiredAny: ["eventPurpose", "title", "sourceContext"],
    requiredFields: ["eventPurpose", "date", "time", "location"],
    optional: ["theme"],
    firstQuestion: "What event or source should I use?",
    previewCta: "Create first preview",
    visualOutput: true,
  },
  reminder: {
    label: "Reminder",
    requiredAny: ["eventPurpose", "title", "sourceContext"],
    requiredFields: ["eventPurpose", "date"],
    optional: ["time", "location"],
    firstQuestion: "What event should this reminder be for?",
    previewCta: "Write reminder",
    visualOutput: false,
  },
  thank_you_card: {
    label: "Thank you card",
    requiredAny: ["eventPurpose", "title", "sourceContext"],
    requiredFields: ["eventPurpose"],
    optional: [],
    firstQuestion: "What should this thank you card be for?",
    previewCta: "Create first preview",
    visualOutput: true,
  },
  menu: {
    label: "Menu",
    requiredAny: ["eventPurpose", "title", "sourceContext"],
    requiredFields: ["eventPurpose", "location"],
    optional: ["date"],
    firstQuestion: "What event or source should I use for this menu?",
    previewCta: "Create first preview",
    visualOutput: true,
  },
  welcome_sign: {
    label: "Welcome sign",
    requiredAny: ["eventPurpose", "title", "sourceContext"],
    requiredFields: ["eventPurpose", "date", "time", "location"],
    optional: ["theme"],
    firstQuestion: "What event or source should I use for this welcome sign?",
    previewCta: "Create first preview",
    visualOutput: true,
  },
};

const DEFAULT_FIELD_QUESTIONS: Partial<Record<RequirementField, string>> = {
  eventPurpose: "What are we creating this for?",
  honoreeName: "Whose name should be featured?",
  ageOrMilestone: "What age or milestone should be shown?",
  date: "When should this happen?",
  time: "What time should it start?",
  location: "Where should guests go?",
  rsvpEnabled:
    "Should Envitefy collect RSVPs for this event? Guests can answer yes, no, or maybe from the invite.",
  numberOfGuests: "How many guests should the RSVP track?",
  tone: "What kind of vibe should the invite have? For example: fun and colorful, elegant, playful, modern, or sweet.",
};

const DEFAULT_SUGGESTED_REPLIES: Partial<Record<RequirementField, string[]>> = {
  eventPurpose: ["A school fundraiser", "A birthday party", "Use an upload"],
  honoreeName: ["Ava", "Sara and Daniel"],
  ageOrMilestone: ["7", "Class of 2026"],
  date: ["Saturday at 3", "Next Friday evening"],
  time: ["3 PM", "6:30 PM"],
  location: ["At home", "At Sky Zone"],
  rsvpEnabled: ["Yes, collect RSVPs", "No RSVP needed"],
  numberOfGuests: ["20 guests", "35 guests"],
  tone: ["Fun and colorful", "Elegant", "Playful"],
};

const CATEGORY_REQUIREMENTS: Record<ConciergeEventType, CategoryRequirement> = {
  unknown: {
    label: "event",
    requiredFields: ["eventPurpose", "date", "time", "location"],
    intakeQuestions: [],
  },
  birthday: {
    label: "birthday",
    requiredFields: ["honoreeName", "ageOrMilestone", "date", "time", "location"],
    intakeQuestions: [
      "Who is the birthday for, and what age or milestone?",
      "When and where should it happen?",
    ],
    fieldQuestions: {
      honoreeName: "Who is the birthday for?",
      ageOrMilestone: "What age or birthday milestone should be shown?",
    },
    suggestedReplies: {
      honoreeName: ["Ava, 7", "Make it a surprise"],
      ageOrMilestone: ["7", "21st birthday"],
    },
  },
  wedding: {
    label: "wedding",
    requiredFields: ["honoreeName", "date", "time", "location"],
    intakeQuestions: [
      "What wedding event is this for, and whose names should be featured?",
      "When and where should it happen?",
    ],
    fieldQuestions: {
      honoreeName: "Whose names should be featured? Include both partners as you want them shown.",
      eventPurpose: "Is this for the ceremony, reception, full wedding weekend, or another wedding event?",
    },
    suggestedReplies: {
      honoreeName: ["Sara and Daniel", "Maya & Chris"],
      eventPurpose: ["Wedding ceremony and reception", "Reception only"],
    },
  },
  baby_shower: {
    label: "baby shower",
    requiredFields: ["honoreeName", "date", "time", "location"],
    intakeQuestions: [
      "Who are we celebrating, and what kind of shower is it?",
      "When and where should guests go?",
    ],
    fieldQuestions: {
      honoreeName: "Who are we celebrating for the shower?",
    },
    suggestedReplies: {
      honoreeName: ["Mia", "Baby girl shower"],
    },
  },
  gender_reveal: {
    label: "gender reveal",
    requiredFields: ["honoreeName", "date", "time", "location"],
    intakeQuestions: [
      "Whose gender reveal is this, and how should the reveal be described?",
      "When and where should guests go?",
    ],
    fieldQuestions: {
      honoreeName: "Whose gender reveal should this feature?",
    },
  },
  bridal_shower: {
    label: "bridal shower",
    requiredFields: ["honoreeName", "date", "time", "location"],
    intakeQuestions: [
      "Who is the bridal shower for, and what style should it have?",
      "When and where should guests go?",
    ],
    fieldQuestions: {
      honoreeName: "Who is the bridal shower for?",
    },
  },
  graduation: {
    label: "graduation",
    requiredFields: ["honoreeName", "date", "time", "location"],
    intakeQuestions: [
      "Who is graduating, and is this a ceremony, party, or open house?",
      "When and where should it happen?",
    ],
    fieldQuestions: {
      honoreeName: "Who is graduating?",
      ageOrMilestone: "What school, class year, or milestone should be shown?",
    },
  },
  gym_meet: {
    label: "gym meet",
    requiredFields: ["eventPurpose", "date", "time", "location"],
    intakeQuestions: [
      "What team, gym, or meet name should be featured?",
      "When and where should guests go?",
    ],
    fieldQuestions: {
      eventPurpose: "What team, gym, or meet name should be featured?",
    },
  },
  game_day: {
    label: "game day",
    requiredFields: ["eventPurpose", "date", "time", "location"],
    intakeQuestions: [
      "What team, game, or watch party should be featured?",
      "When and where should guests go?",
    ],
    fieldQuestions: {
      eventPurpose: "What team, game, or watch party should be featured?",
    },
  },
  football: {
    label: "football",
    requiredFields: ["eventPurpose", "date", "time", "location"],
    intakeQuestions: [
      "What football game, season, team, or watch party should be featured?",
      "When and where should guests go?",
    ],
  },
  sport_event: {
    label: "sports event",
    requiredFields: ["eventPurpose", "date", "time", "location"],
    intakeQuestions: [
      "What team, sport, or game should be featured?",
      "When and where should guests go?",
    ],
  },
  field_trip: {
    label: "field trip",
    requiredFields: ["eventPurpose", "date", "time", "location"],
    intakeQuestions: [
      "What field trip or school day should be featured?",
      "When and where should families or students go?",
    ],
  },
  open_house: {
    label: "open house",
    requiredFields: ["eventPurpose", "date", "time", "location"],
    intakeQuestions: [
      "What open house should this be for?",
      "When is it, and what address should visitors use?",
    ],
    fieldQuestions: {
      location: "What address should visitors use?",
    },
    suggestedReplies: {
      location: ["123 Main St", "At the model home"],
    },
  },
  housewarming: {
    label: "housewarming",
    requiredFields: ["eventPurpose", "date", "time", "location"],
    intakeQuestions: [
      "Whose housewarming is this for?",
      "When and where should guests go?",
    ],
  },
  appointment: {
    label: "appointment",
    requiredFields: ["eventPurpose", "date", "time", "location"],
    intakeQuestions: [
      "What appointment or booking should this be for?",
      "When and where should it happen?",
    ],
  },
  workshop: {
    label: "workshop",
    requiredFields: ["eventPurpose", "date", "time", "location"],
    intakeQuestions: [
      "What workshop, class, or session should be featured?",
      "When and where should attendees go?",
    ],
  },
  special_event: {
    label: "special event",
    requiredFields: ["eventPurpose", "date", "time", "location"],
    intakeQuestions: [
      "What special event should this be for?",
      "When and where should it happen?",
    ],
  },
  smart_signup: {
    label: "smart sign-up",
    requiredFields: ["eventPurpose", "date", "time", "location"],
    intakeQuestions: [
      "What should people sign up for?",
      "When and where is it happening?",
    ],
  },
  general: {
    label: "event",
    requiredFields: ["eventPurpose", "date", "time", "location"],
    intakeQuestions: [
      "What event should this be for?",
      "When and where should it happen?",
    ],
  },
};

export function getEventTypeLabel(eventType: ConciergeEventType) {
  return CATEGORY_REQUIREMENTS[eventType]?.label || "event";
}

export function getOutputRequirement(output: RequestedOutput): OutputRequirement {
  return OUTPUT_REQUIREMENTS[output] || OUTPUT_REQUIREMENTS.live_card;
}

export function getRequirementPlan(args: {
  eventType: ConciergeEventType;
  requestedOutputs: RequestedOutput[];
  sourceContext?: Pick<CreationSourceContext, "detectedSourceIntent"> | null;
}): RequirementPlan {
  const primaryOutput = args.requestedOutputs[0] || "live_card";
  const output = getOutputRequirement(primaryOutput);
  const category = CATEGORY_REQUIREMENTS[args.eventType] || CATEGORY_REQUIREMENTS.unknown;
  const requiredFields = Array.from(
    new Set<RequirementField>([
      ...category.requiredFields,
      ...output.requiredFields,
    ]),
  );
  const receivedInvite = args.sourceContext?.detectedSourceIntent === "received_invite";
  return {
    primaryOutput,
    output,
    eventLabel: category.label,
    requiredFields,
    intakeQuestions: category.intakeQuestions,
    fieldQuestions: {
      ...DEFAULT_FIELD_QUESTIONS,
      ...category.fieldQuestions,
    },
    suggestedReplies: {
      ...DEFAULT_SUGGESTED_REPLIES,
      ...category.suggestedReplies,
    },
    shouldAskTone: output.visualOutput && !receivedInvite,
  };
}

export function requirementFieldSatisfied(
  field: RequirementField,
  draft: Pick<
    ConciergeEventDraft,
    | "sourceContext"
    | "eventPurpose"
    | "title"
    | "honoreeName"
    | "ageOrMilestone"
    | "dateText"
    | "timeText"
    | "startISO"
    | "location"
    | "venue"
    | "rsvpEnabled"
    | "numberOfGuests"
    | "tone"
  >,
): boolean {
  if (field === "sourceContext") return Boolean(draft.sourceContext.hasUsableContext);
  if (field === "eventPurpose") {
    return Boolean(
      draft.sourceContext.hasUsableContext ||
        cleanString(draft.eventPurpose) ||
        cleanString(draft.title),
    );
  }
  if (field === "honoreeName") return Boolean(cleanString(draft.honoreeName));
  if (field === "ageOrMilestone") return Boolean(cleanString(draft.ageOrMilestone));
  if (field === "date") return Boolean(cleanString(draft.dateText) || cleanString(draft.startISO));
  if (field === "time") return Boolean(cleanString(draft.timeText) || cleanString(draft.startISO));
  if (field === "location") return Boolean(cleanString(draft.location) || cleanString(draft.venue));
  if (field === "rsvpEnabled") return typeof draft.rsvpEnabled === "boolean";
  if (field === "numberOfGuests") {
    return typeof draft.numberOfGuests === "number" && draft.numberOfGuests > 0;
  }
  if (field === "tone") return Boolean(cleanString(draft.tone));
  return false;
}

export function questionForRequirementField(field: RequirementField, plan: RequirementPlan) {
  return plan.fieldQuestions[field] || DEFAULT_FIELD_QUESTIONS[field] || "What detail should we add next?";
}

export function suggestedRepliesForRequirementField(field: RequirementField, plan: RequirementPlan) {
  return plan.suggestedReplies[field] || DEFAULT_SUGGESTED_REPLIES[field] || [];
}
