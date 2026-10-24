/** Starter questions shown when a visitor opens the guest help chat. */
export const guestChatStarterQuestions = [
  "What can I make with Envitefy?",
  "Should I use a Live Card, an Event Page, or a Sign-up Form?",
  "Do my guests need an app or account?",
  "Can I turn a flyer or invite photo into an event?",
  "How do RSVPs work?",
] as const;

/** Every visible starter has an authored answer; never infer its topic by ranking. */
export const guestChatStarterKnowledgeIds = [
  "product-overview",
  "choose-product",
  "guest-account",
  "uploads",
  "rsvp",
] as const;
