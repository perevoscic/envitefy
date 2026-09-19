export const SIGNUP_FORM_GALLERY_HREF = "/signup-forms/templates";

const HANDOFF_MESSAGE = `You can create sign-up forms in the template gallery: ${SIGNUP_FORM_GALLERY_HREF}`;
const SIGNUP_PRODUCT = /\b(?:sign[-\s]?up\s+(?:forms?|sheets?|lists?|templates?|builders?)|smart\s+sign[-\s]?ups?|(?:volunteer|potluck|snack|shift|time[-\s]?slot)\s+(?:sign[-\s]?ups?|forms?|sheets?))\b/i;

/** Route form-building intent; ordinary event RSVP and account access stay in their own flows. */
export function signupFormHandoff(message: string): string | null {
  const normalized = message.replace(/[‐‑–—]/g, "-").replace(/[’‘]/g, "'");
  const clauses = normalized.split(/(?<=[.!?;])\s+|\s+(?:but|instead)\s+/i);
  for (const clause of clauses) {
    if (/\b(?:account|log[-\s]?in|password|authentication|sign[-\s]?in)\b/i.test(clause)) continue;
    const product = SIGNUP_PRODUCT.exec(clause);
    const assignmentRequest = /\b(?:create|make|build|need|want|can|how|where|help)\b/i.test(clause)
      && /\b(?:volunteers?|items?|slots?|shifts?|roles?|snacks?|potluck)\b/i.test(clause)
      && /\b(?:sign[-\s]?up|claim|choose|pick|reserve|collect|assign)\b/i.test(clause);
    if (!product && !assignmentRequest) continue;
    const beforeProduct = product ? clause.slice(0, product.index) : clause;
    if (/\b(?:don't|do not|doesn't|does not|no|not|without|remove|delete|drop|rather than|instead of)\b[^.!?;]{0,65}$/i.test(beforeProduct)
      || /\b(?:is|are)\s+(?:not needed|unnecessary|not wanted)\b/i.test(clause)) continue;
    // An invitation may link a form the host already has without requesting another form.
    if (/\b(?:link|url|https?:\/\/)/i.test(clause)
      && /\b(?:existing|already|my|our|this|the)\b[^.!?;]{0,55}\bsign[-\s]?up\s+(?:form|sheet)\b/i.test(clause)) continue;
    return HANDOFF_MESSAGE;
  }
  return null;
}
