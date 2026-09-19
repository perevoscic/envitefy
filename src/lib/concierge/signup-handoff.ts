export const SIGNUP_FORM_GALLERY_HREF = "/signup-forms/templates";

const HANDOFF_MESSAGE = `You can create sign-up forms in the template gallery: ${SIGNUP_FORM_GALLERY_HREF}`;
const SIGNUP_PRODUCT = /\b(?:sign[-\s]?up\s+(?:forms?|sheets?|lists?|pages?|templates?|builders?)|smart\s+sign[-\s]?ups?|(?:volunteer|potluck|snack|shift|time[-\s]?slot)\s+(?:sign[-\s]?ups?|forms?|sheets?))\b/i;

/** Legacy product/category selectors cannot create a form through chat either. */
export function signupSelectionHandoff(outputs?: readonly string[] | null, category?: string | null): string | null {
  const selected = [...(Array.isArray(outputs) ? outputs : []), category];
  return selected.some((value) => typeof value === "string" && /^(?:signup|signupform|smartsignup)$/.test(value.toLowerCase().replace(/[-_\s‐‑–—]+/g, "")))
    ? HANDOFF_MESSAGE : null;
}

/** Route form-building intent; ordinary event RSVP and account access stay in their own flows. */
export function signupFormHandoff(message: string): string | null {
  const normalized = message.replace(/[‐‑–—]/g, "-").replace(/[’‘]/g, "'");
  const clauses = normalized.split(/(?<=[.!?;])\s+|\s+(?:but|instead)\s+/i);
  for (const clause of clauses) {
    const product = SIGNUP_PRODUCT.exec(clause)
      || (!/\b(?:account|log[-\s]?in|authentication|password)\b/i.test(clause)
        ? /\b(?:create|make|build|need|want|offer|support)\b[^.!?;]{0,45}\bsign[-\s]?ups?\b/i.exec(clause)
        : null);
    if (/\b(?:account|log[-\s]?in|authentication)\s+(?:sign[-\s]?up\s+)?forms?\b|\baccount\s+sign[-\s]?up\b|\b(?:sign[-\s]?up|register)\s+for\s+(?:an?\s+|my\s+|the\s+)?(?:envitefy\s+)?account\b/i.test(clause)) continue;
    if (!product && /\b(?:account|log[-\s]?in|password|authentication|sign[-\s]?in)\b/i.test(clause)) continue;
    const assignmentRequest = /\b(?:create|make|build|need|want|can|how|where|help)\b/i.test(clause)
      && /\b(?:volunteers?|items?|slots?|shifts?|roles?|snacks?|potluck)\b/i.test(clause)
      && /\b(?:sign[-\s]?up|claim|choose|pick|reserve|collect|assign)\b/i.test(clause);
    if (!product && !assignmentRequest) continue;
    const beforeProduct = product ? clause.slice(0, product.index) : clause;
    if (/\b(?:don't|do not|doesn't|does not|no|not|without|remove|delete|drop|disable|cancel|stop|turn off|rather than|instead of)\b[^.!?;]{0,65}$/i.test(beforeProduct)
      || /\b(?:is|are)\s+(?:not needed|unnecessary|not wanted)\b/i.test(clause)) continue;
    // An invitation may link a form the host already has without requesting another form.
    if (/\b(?:add|include|reuse|use|link|attach|keep)\b[^.!?;]{0,80}\b(?:existing|already|my|our|this|the)\b[^.!?;]{0,55}\bsign[-\s]?up\s+(?:form|sheet)\b/i.test(clause)
      && /\b(?:link|url|https?:\/\/|existing|already)\b/i.test(clause)) continue;
    return HANDOFF_MESSAGE;
  }
  return null;
}
