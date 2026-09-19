import type { ConciergeEventDraft } from "./types.ts";

export type ConciergePublicContentKind = "instruction" | "safety" | "equipment" | "eligibility" | "activity" | "exact_copy";
export type ConciergePublicContent = {
  version: 1;
  revision: number;
  items: Array<{ id: string; kind: ConciergePublicContentKind; text: string; sourceText: string; sourceMessage: string }>;
};
export type ConciergeSemanticKind = "anniversary" | "school_open_house" | "property_open_house" | "clinic" | "practice" | "scrimmage" | "watch_party" | "general";

function key(text: string) { return text.replace(/[^\p{L}\p{N}]+/gu, " ").trim().toLowerCase(); }
function id(text: string) {
  let hash = 2166136261;
  for (const char of key(text)) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return `public-${(hash >>> 0).toString(36)}`;
}

/** Public requirements are sourced user text, independent of private styling and AI copy. */
export function updatePublicContent(previous: ConciergePublicContent | null | undefined, message: string): ConciergePublicContent {
  let items = [...(previous?.items || [])];
  const before = JSON.stringify(items);
  const quotes: string[] = [];
  const protectedMessage = message.replace(/(?<![\p{L}])["“‘'](.{2,12000}?)["”’'](?=\s*(?:[.!?;,]|$|and\b|I['’]d\b))/gu, (quote) => {
    quotes.push(quote);
    return `__PUBLIC_QUOTE_${quotes.length - 1}__`;
  });
  const clauses = protectedMessage.split(/(?<=[.!?])\s+|[;\r\n]+/).map((part) => part.replace(/__PUBLIC_QUOTE_(\d+)__/g, (_match, index: string) => quotes[Number(index)]).trim()).filter(Boolean);
  for (const sourceText of clauses) {
    const publicEditRequest = /^(?:(?:can|could|would|will)\s+you\s+(?:please\s+)?|please\s+)?(?:add|include|state|mention|keep|write|use|remove|drop|delete|replace)\b/i.test(sourceText);
    if (/\b(?:password|api\s*key|door\s+code|access\s+code|gate\s+code|private|budget)\b/i.test(sourceText)) continue;
    if (!publicEditRequest && /\b(?:maybe|perhaps|hypothetical|for example|should we|could we|can guests|will guests|would guests)\b|\?/i.test(sourceText)) continue;
    if (/\b(?:theme|artwork|background|palette|font|illustrat|draw|pictured|image)\b/i.test(sourceText) && !/\b(?:exact\s+(?:lines?|labels?|words?)|guests?\s+(?:must|should|need)|please\s+bring)\b/i.test(sourceText)) continue;
    const returnCorrection = sourceText.match(/\b(?:correction|change|update)\b.*\b(?:bus\s+)?returns?\s+(?:at\s+)?(\d{1,2}(?::\d{2})?\s*[ap]m)/i);
    if (returnCorrection) {
      items = items.map((item) => /\breturns?\s+(?:there\s+)?at\s+\d/i.test(item.text) ? {
        ...item, text: item.text.replace(/(\breturns?\s+(?:there\s+)?at\s+)\d{1,2}(?::\d{2})?\s*[ap]m/i, `$1${returnCorrection[1]}`), sourceText, sourceMessage: message,
      } : item);
      continue;
    }
    const replacing = sourceText.match(/\breplace\s+(?:the\s+)?(?:exact\s+)?(?:line|wording|instruction|note)\s+["“‘'](.+?)["”’']\s+with\s+["“‘'](.+?)["”’']/i);
    const removing = sourceText.match(/\b(?:remove|drop|delete)\s+(?:the\s+)?(?:line|wording|instruction|note)\s+["“‘'](.+?)["”’']/i);
    if (replacing || removing) items = items.filter((item) => key(item.text) !== key((replacing || removing)![1]));
    if (removing) continue;
    const exact = /\b(?:exact\s+(?:lines?|labels?|words?|wording)|(?:lines?|labels?|wording)\s+exactly|keep\s+(?:the\s+)?(?:lines?|wording)|both\s+(?:lines?|languages))\b/i.test(sourceText);
    const quoted = exact ? [...sourceText.matchAll(/(?<![\p{L}])["“‘'](.{2,12000}?)["”’'](?=\s*(?:[.!?;,]|$|and\b|I['’]d\b))/gu)].map((match) => match[1]) : [];
    let kind: ConciergePublicContentKind | null = null;
    if (exact || replacing) kind = "exact_copy";
    else if (/\b(?:non[- ]contact|no\s+(?:diving|contact|tackling|sparring|drop[- ]offs?)|battery[- ]powered|open\s+flames?|supervis(?:ed|ion)|safety|must\s+(?:stay|remain)|adult\s+(?:required|present)|parent\s+(?:required|present))\b/i.test(sourceText)) kind = "safety";
    else if (/\b(?:bring|wear|equipment|materials?\s+(?:are\s+)?provided|supplies\s+(?:are\s+)?provided|goggles|shin\s+guards|water\s+bottle|towel|cleats|kneepads)\b/i.test(sourceText)) kind = "equipment";
    else if (/\b(?:ages?\s+\d|adults?|teens?|beginners?|all\s+(?:ages|levels)|eligible|eligibility)\b/i.test(sourceText)) kind = "eligibility";
    else if (/\b(?:stations?|drills?|activities|warm[- ]?up|doors\s+(?:open|at)|arriv(?:e|al)|home\s+team|away\s+team|are\s+(?:away|home)|lane\s+assignments?|permission\s+(?:form|slip)|check[- ]in|ceremony|reception|vow\s+renewal|dinner|afternoon\s+tea|dress\s+code|packed\s+lunch|bus\s+(?:leaves|returns)|visit\s+is|throwing|fielding|ballet|contemporary|watching\s+a\s+game|community\s+gathering|neighborhood\s+tea|sit\s+in|main\s+office)\b/i.test(sourceText)) kind = "activity";
    else if (/\b(?:wording\s+should|invite\s+people|find\s+out\s+together|drop\s+in|portrait\s+session|school\s+open\s+house|meet\s+teachers|see\s+classrooms|housewarming\s+with\s+snacks|conversation\s+with\s+tea|players\s+are\s+welcome|practice\s+for|will\s+scrimmage|show\s+starts|no\s+experience\s+needed|indoor\s+volleyball)\b/i.test(sourceText)) kind = "instruction";
    else if (/\b(?:guests?|participants?|parents?|players?|students?)\s+(?:must|should|need|can|will)\b/i.test(sourceText)) kind = "instruction";
    if (!kind) continue;
    // Only the public clause is eligible; never expose the opening creation command.
    let publicClause = sourceText.replace(/^please\s+(?:mention|state\s+that)\s+/i, "");
    if (publicEditRequest && !exact) {
      publicClause = publicClause.replace(/^(?:(?:can|could|would|will)\s+you\s+(?:please\s+)?|please\s+)?(?:add|include|state|mention|write)\s+(?:that\s+)?/i, "").replace(/\?$/, ".");
    }
    if (!exact && /\b(?:create|generate|design|make|I\s+need|we\s+need)\s+(?:an?\s+)?(?:event|flyer|live|invitation|downloadable|workshop)\b/i.test(publicClause)) {
      const guestClause = publicClause.match(/\b(?:(?:guests?|participants?|players?|students?|families|parents?)\s+(?:must|should|need|are\s+required)|(?:please\s+)?(?:bring|wear))\b/i);
      if (!guestClause) continue;
      publicClause = publicClause.slice(guestClause.index);
    }
    const texts = replacing ? [replacing[2]] : quoted.length ? quoted : [publicClause];
    for (const text of texts) {
      const normalized = key(text);
      if (!normalized || items.some((item) => key(item.text) === normalized)) continue;
      items.push({ id: id(text), kind, text, sourceText, sourceMessage: message });
    }
  }
  return { version: 1, revision: (previous?.revision || 0) + (before === JSON.stringify(items) ? 0 : 1), items };
}

export function publicContentLines(content: ConciergePublicContent | null | undefined): string[] {
  return (content?.items || []).map((item) => item.text);
}

export function semanticKindForMessage(message: string, previous?: ConciergeSemanticKind | null): ConciergeSemanticKind | undefined {
  if (/\banniversary\b/i.test(message)) return "anniversary";
  if (/\bopen\s+house\b/i.test(message)) {
    if (/\b(?:school|classroom|teacher|families|parents|students|campus)\b/i.test(message)) return "school_open_house";
    if (/\b(?:property|realtor|listing|bedrooms?|square\s+feet|real\s+estate)\b/i.test(message)) return "property_open_house";
  }
  for (const kind of ["clinic", "practice", "scrimmage", "watch_party"] as const) {
    if (new RegExp(`\\b${kind.replace("_", "\\s+")}\\b`, "i").test(message)) return kind;
  }
  return previous || undefined;
}

export function publicContentForDraft(draft: ConciergeEventDraft): {
  guestInstructions: string[]; requiredArtworkLines: string[]; semanticKind: string | null;
} {
  return {
    guestInstructions: (draft.publicContent?.items || []).filter((item) => item.kind !== "exact_copy").map((item) => item.text),
    requiredArtworkLines: (draft.publicContent?.items || []).filter((item) => item.kind === "exact_copy").map((item) => item.text),
    semanticKind: draft.semanticKind || (draft.eventType === "anniversary" ? "anniversary" : null),
  };
}
