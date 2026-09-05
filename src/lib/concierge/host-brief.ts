export type AccessibilityNeed = "step_free" | "wheelchair" | "seating" | "hearing" | "sensory";
export type DietaryNeed = "vegetarian" | "vegan" | "gluten_free" | "nut_free" | "dairy_free" | "halal" | "kosher" | "allergies";
export type PrivacyPreference = "address_private" | "contact_private" | "guest_list_private";
export type HostSupport = "planning_alone" | "simple_steps" | "has_help";
export type HostBriefNote<Kind extends string = string> = { kind: Kind; sourceText: string };
export type HostBudget = { amount: number; currency: string | null; scope: string | null; sourceText: string };
export type HostBrief = {
  budget?: HostBudget | null;
  languages?: { values: string[]; sourceText: string } | null;
  accessibilityNeeds?: HostBriefNote<AccessibilityNeed>[];
  dietaryNeeds?: HostBriefNote<DietaryNeed>[];
  privacyPreferences?: HostBriefNote<PrivacyPreference>[];
  hostSupport?: HostBriefNote<HostSupport>[];
  replyPlan?: { mode: "manual_private" | "manual" | "online"; sourceText: string } | null;
};

const MAX_SOURCE = 280;
const MAX_NOTES = 8;
const LANGUAGE_NAMES = ["English", "Spanish", "French", "Portuguese", "German", "Italian", "Arabic", "Hebrew", "Hindi", "Mandarin", "Cantonese", "Chinese", "Japanese", "Korean", "Polish", "Ukrainian", "Russian"];
const ACCESSIBILITY: Array<[AccessibilityNeed, RegExp]> = [
  ["step_free", /\b(?:step[- ]free|no stairs|without stairs|avoid stairs|ramp access)\b/i],
  ["wheelchair", /\b(?:wheelchair|mobility scooter|accessible (?:venue|entrance|toilet|bathroom))\b/i],
  ["seating", /\b(?:accessible seating|seated access|need(?:s)? (?:a )?chair|cannot stand|can['’]?t stand)\b/i],
  ["hearing", /\b(?:hearing loop|hearing impairment|sign language|captioning|deaf guests?)\b/i],
  ["sensory", /\b(?:sensory needs?|sensory[- ]friendly|quiet (?:room|space)|low[- ]sensory)\b/i],
];
const DIETARY: Array<[DietaryNeed, RegExp]> = [
  ["vegetarian", /\bvegetarian\b/i], ["vegan", /\bvegan\b/i],
  ["gluten_free", /\b(?:gluten[- ]free|celiac|coeliac)\b/i],
  ["nut_free", /\b(?:(?:pea)?nut[- ](?:free|allerg(?:y|ies))|(?:pea)?nut allergy|no (?:pea)?nuts)\b/i],
  ["dairy_free", /\b(?:dairy[- ]free|milk allergy|lactose intoleran(?:t|ce))\b/i],
  ["halal", /\bhalal\b/i], ["kosher", /\bkosher\b/i],
  ["allergies", /\b(?:food allergies|dietary restrictions|allergen needs?)\b/i],
];

function clauses(message: string): string[] {
  return message
    .split(/(?<=[.!?])\s+|[;\r\n]+|,\s+(?=(?:and\s+)?(?:I(?:['’]m|['’]ve|\s)|we\s|please\s|keep\s|turn\s))|\s+(?:but|and)\s+(?=(?:keep|remove|drop|add|use|switch|don['’]?t|do not)\b)/i)
    .map((part) => part.trim())
    .filter((part) => part.length > 0 && part.length <= MAX_SOURCE)
    .slice(0, 40);
}

function isConfirmedClause(source: string): boolean {
  if (/\b(?:might|maybe|perhaps|hypothetically|possibly|we may|I may|not sure|wondering whether|if we|if I|would we|should we|should I)\b/i.test(source)) return false;
  if (/\b(?:you (?:suggested|recommended|said)|the assistant (?:suggested|said)|for example|suppose)\b/i.test(source)) return false;
  if (/\?/.test(source) && !/^(?:please\s+)?(?:can|could|would|will)\s+you\s+(?:keep|use|set|change|remove|include|add|write|make|collect)\b/i.test(source)) return false;
  return true;
}

function isRetraction(source: string): boolean {
  return /\b(?:no longer (?:needs?|wants?|requires?|have|has)|(?:don['’]?t|doesn['’]?t|do not|does not) (?:need|want|require)|remove|drop|forget|ignore|not (?:needed|required)|unnecessary)\b/i.test(source);
}

function updateNote<Kind extends string>(notes: HostBriefNote<Kind>[] | undefined, kind: Kind, sourceText: string, remove = false): HostBriefNote<Kind>[] {
  const others = (notes || []).filter((note) => note.kind !== kind);
  return remove ? others : [...others, { kind, sourceText }].slice(-MAX_NOTES);
}

function extractBudget(source: string, previous: HostBudget | null | undefined): HostBudget | null {
  const amount = source.match(/([$€£₹])\s*(\d[\d,]*(?:\.\d{1,2})?)|\b(\d[\d,]*(?:\.\d{1,2})?)\s*(USD|CAD|AUD|EUR|GBP|INR|dollars?|euros?|pounds?)\b/i);
  const bareAmount = !amount ? source.match(/\b(?:budget|spending limit)\s+(?:is\s+)?(?:now\s+)?(?:to\s+)?(\d[\d,]*(?:\.\d{1,2})?)\b/i) : null;
  if (!amount && !bareAmount) return null;
  const explicitBudget = /\b(?:budget|can spend|able to spend|have to spend|spending limit|total|all[- ]in|(?:I|we)['’]?(?:ve)? (?:got|have)|working with)\b/i.test(source);
  if (!explicitBudget && !(previous == null && /^[$€£₹]/.test(source))) return null;
  if (/\b(?:set aside|allocate|of (?:that|the budget)|from (?:that|the budget)|line item|flowers budget)\b/i.test(source)) return null;
  const matched = amount || bareAmount!;
  const remainder = source.slice((matched.index || 0) + matched[0].length);
  const scope = remainder.match(/^\s+(?:in total\s+)?for\s+(.+?)(?=[.!?]|,\s+(?:and\s+)?(?:some|two|three|our|my|I|we)\b|$)/i)?.[1]?.trim() || null;
  const revised = /\b(?:overall|total|instead|revise|change|increase|decrease|raise|reduce|new budget|now|only)\b/i.test(source);
  if (previous?.scope && scope && scope.toLowerCase() !== previous.scope.toLowerCase() && !revised) return null;
  const value = Number((amount?.[2] || amount?.[3] || bareAmount![1]).replace(/,/g, ""));
  if (!Number.isFinite(value) || value < 0 || value > 1_000_000_000) return null;
  return { amount: value, currency: amount?.[1] || amount?.[4] || previous?.currency || null, scope: scope || previous?.scope || null, sourceText: source };
}

/** This memory is derived from user clauses, never assistant planning suggestions. */
export function updateHostBrief(previous: HostBrief | null | undefined, message: string): HostBrief {
  const brief: HostBrief = { ...previous };
  for (const source of clauses(message)) {
    if (!isConfirmedClause(source)) continue;
    const retract = isRetraction(source);
    if (/\b(?:no (?:fixed )?budget|no budget (?:limit|cap)|unlimited budget|remove (?:the )?budget|forget (?:the )?budget)\b/i.test(source)) brief.budget = null;
    else {
      const budget = extractBudget(source, brief.budget);
      if (budget) brief.budget = budget;
    }

    const languages = LANGUAGE_NAMES.filter((language) => new RegExp(`\\b${language}\\b`, "i").test(source));
    if (/\b(?:no language preference|any language is fine|remove (?:the )?language preference)\b/i.test(source)) brief.languages = null;
    else if (languages.length) {
      const only = languages.filter((language) => new RegExp(`\\b(?:only|just)\\s+${language}\\b|\\b${language}\\s+only\\b`, "i").test(source));
      const removed = languages.filter((language) => new RegExp(`\\b(?:remove|drop|no|without|don['’]?t (?:use|need|want)|do not (?:use|need|want))\\s+(?:the\\s+)?${language}\\b`, "i").test(source));
      const added = languages.filter((language) => !removed.includes(language));
      const replace = only.length > 0 || /\b(?:switch|instead|use|change|only|just)\b/i.test(source) && !/\b(?:also|add|in addition)\b/i.test(source);
      const values = only.length ? only : [...new Set([...(replace ? [] : brief.languages?.values || []), ...added])].filter((language) => !removed.includes(language));
      if (values.length || removed.length) brief.languages = values.length ? { values: values.slice(0, 8), sourceText: source } : null;
    }

    if (/\b(?:no accessibility (?:needs|requirements)|remove (?:all )?accessibility (?:needs|requirements))\b/i.test(source)) brief.accessibilityNeeds = [];
    else for (const [kind, pattern] of ACCESSIBILITY) {
      if (pattern.test(source)) brief.accessibilityNeeds = updateNote(brief.accessibilityNeeds, kind, source, retract);
    }
    if (/\b(?:no dietary (?:needs|requirements|restrictions)|remove (?:all )?dietary (?:needs|requirements|restrictions))\b/i.test(source)) brief.dietaryNeeds = [];
    else for (const [kind, pattern] of DIETARY) {
      if (pattern.test(source)) {
        const negativeMeal = new RegExp(`\\b(?:no|not)\\s+${kind.replace(/_/g, "[- ]")}(?:\\s+(?:meals|food|options))?\\b`, "i").test(source);
        brief.dietaryNeeds = updateNote(brief.dietaryNeeds, kind, source, retract || negativeMeal);
      }
    }

    if (/\b(?:remove|drop|forget)\s+(?:all\s+|the\s+)?privacy\s+(?:preferences|requirements|restrictions)\b/i.test(source)) brief.privacyPreferences = [];
    if (/\b(?:exact address shared privately|(?:keep|leave|share|send|give|release|show|display|put|print|include|hide|remove|don['’]?t|do not|no)\b[^.!?]{0,65}\b(?:address|location)\b|(?:address|location)\b[^.!?]{0,65}\b(?:private|privately|off the card|not public|after (?:I|we) approve))\b/i.test(source)) {
      const publicAddress = /\b(?:address|location)\b[^.!?]{0,40}\b(?:public|on the card)|\b(?:publish|show|print|include)\b[^.!?]{0,25}\b(?:full|exact|home) address\b/i.test(source) && !/\b(?:don['’]?t|do not|not|no|off|privately|private)\b/i.test(source);
      const privateAddress = /\b(?:private|privately|hide|remove|off|don['’]?t|do not|after (?:I|we) approve)\b/i.test(source);
      const retractPrivacy = /\b(?:no longer|don['’]?t need|do not need)\b[^.!?]{0,45}\b(?:private|privately|hidden)\b/i.test(source);
      if (publicAddress || privateAddress) brief.privacyPreferences = updateNote(brief.privacyPreferences, "address_private", source, publicAddress || retractPrivacy);
    }
    if (/\b(?:phone|email|contact details?)\b/i.test(source) && /\b(?:private|privately|off|hide|remove|no|don['’]?t|do not)\b/i.test(source)) brief.privacyPreferences = updateNote(brief.privacyPreferences, "contact_private", source);
    else if (/\b(?:include|show|print|publish|use)\b[^.!?]{0,35}\b(?:phone|email|contact details?)\b/i.test(source)) brief.privacyPreferences = updateNote(brief.privacyPreferences, "contact_private", source, true);
    if (/\b(?:guest list|guest names|attendee list)\b/i.test(source) && /\b(?:private|hidden|hide|not public)\b/i.test(source)) brief.privacyPreferences = updateNote(brief.privacyPreferences, "guest_list_private", source);
    else if (/\b(?:guest list|guest names|attendee list)\b[^.!?]{0,25}\bpublic\b/i.test(source)) brief.privacyPreferences = updateNote(brief.privacyPreferences, "guest_list_private", source, true);

    if (/\b(?:on my own|by myself|doing this alone|planning (?:it |this )?alone|organising (?:it |this )?alone|organizing (?:it |this )?alone)\b/i.test(source)) brief.hostSupport = updateNote(brief.hostSupport, "planning_alone", source, retract || /\bnot\b/i.test(source));
    if (/\b(?:I (?:have|now have)|my (?:sister|brother|partner|friend|family) (?:will|can|is going to))\b[^.!?]{0,70}\b(?:help|helping|co[- ]host)\b/i.test(source)) {
      brief.hostSupport = updateNote(brief.hostSupport, "planning_alone", source, true);
      brief.hostSupport = updateNote(brief.hostSupport, "has_help", source);
    }
    if (/\b(?:overwhelmed|not (?:very )?technical|simple (?:steps|plan|next step)|one step at a time|rather than ask me a whole form|next step I can (?:actually )?manage)\b/i.test(source)) brief.hostSupport = updateNote(brief.hostSupport, "simple_steps", source, retract);

    if (/\b(?:remove|drop|forget)\b[^.!?]{0,25}\b(?:reply plan|manual replies|manual RSVP)\b|\b(?:no longer|won['’]?t|will not)\s+(?:collect|manage|handle)\s+(?:the\s+)?replies\b/i.test(source)) brief.replyPlan = null;
    else if (/\b(?:I['’]ll|I will|we['’]ll|we will|let me)\s+(?:collect|manage|handle|track)\s+(?:the\s+)?(?:replies|responses|RSVPs)\b|\b(?:reply|respond|replies|responses)\s+(?:to me\s+)?privately\b|\b(?:private|manual)\s+(?:reply|replies|responses|RSVP)\b/i.test(source)) {
      const mode = /\bprivate(?:ly)?\b/i.test(source) || brief.replyPlan?.mode === "manual_private" ? "manual_private" : "manual";
      brief.replyPlan = { mode, sourceText: source };
    } else if (/\b(?:use|enable|turn on|switch to)\s+(?:the\s+)?online\s+rsvp\b|\bturn\s+(?:the\s+)?online\s+rsvp\s+on\b/i.test(source)) brief.replyPlan = { mode: "online", sourceText: source };
  }
  return brief;
}

/** The model cannot author durable facts: re-derive changes from current user clauses in their original order. */
export function normalizeHostBrief(modelValue: unknown, fallback: HostBrief | null | undefined, latestMessage: string): HostBrief {
  const normalized = updateHostBrief(fallback, latestMessage);
  if (!modelValue || typeof modelValue !== "object" || Array.isArray(modelValue)) return normalized;
  // Even a valid citation can be paired with an invented value or an earlier, superseded choice.
  // Preserve the user-derived result instead of replaying model-selected excerpts out of order.
  return normalized;
}

export function formatHostBrief(brief: HostBrief | null | undefined): string[] {
  if (!brief) return [];
  const lines: string[] = [];
  if (brief.budget) {
    const { amount, currency, scope } = brief.budget;
    const money = currency && /^[$€£₹]$/.test(currency) ? `${currency}${amount.toLocaleString("en-US")}` : `${amount.toLocaleString("en-US")}${currency ? ` ${currency}` : ""}`;
    lines.push(`Budget: ${money}${scope ? ` for ${scope}` : ""}`);
  }
  if (brief.languages?.values.length) lines.push(`Languages: ${brief.languages.values.join(" and ")}`);
  const noteLabels: Record<AccessibilityNeed | DietaryNeed | PrivacyPreference | HostSupport, string> = {
    step_free: "Step-free access", wheelchair: "Wheelchair access", seating: "Accessible seating", hearing: "Hearing accessibility", sensory: "Sensory needs",
    vegetarian: "Vegetarian meals", vegan: "Vegan meals", gluten_free: "Gluten-free needs", nut_free: "Nut-free needs", dairy_free: "Dairy-free needs", halal: "Halal meals", kosher: "Kosher meals", allergies: "Food allergies or dietary restrictions",
    address_private: "Exact address shared privately", contact_private: "Host contact details kept off the invitation", guest_list_private: "Guest list kept private",
    planning_alone: "Planning alone", simple_steps: "One manageable step at a time", has_help: "Has planning help",
  };
  for (const [label, notes] of [
    ["Accessibility", brief.accessibilityNeeds], ["Dietary needs", brief.dietaryNeeds],
    ["Privacy", brief.privacyPreferences], ["Support", brief.hostSupport],
  ] as const) {
    if (notes?.length) lines.push(`${label}: ${[...new Set(notes.map((note) => noteLabels[note.kind]))].join("; ")}`);
  }
  if (brief.replyPlan) lines.push(`Reply plan: ${brief.replyPlan.mode === "online" ? "Online RSVP" : brief.replyPlan.mode === "manual_private" ? "Collect replies privately" : "Collect replies manually"}`);
  return lines;
}
