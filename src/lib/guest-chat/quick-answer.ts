import { guestChatKnowledgeItems } from "./knowledge.ts";
import {
  appendGuestSignupPrompt,
  buildDeterministicGuestChatAnswer,
  GUEST_CHAT_OUT_OF_SCOPE_ANSWER,
  shouldSuggestGuestSignup,
} from "./respond.ts";
import type { GuestChatAnswer, GuestChatMessage } from "./respond.ts";
import { guestChatStarterKnowledgeIds, guestChatStarterQuestions } from "./starters.ts";

function normalizeQuestion(message: string) {
  return message
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[?!.]+$/, "")
    .trim();
}

const answersById = new Map(guestChatKnowledgeItems.map((item) => [item.id, item]));
const exactQuestions = new Map(
  guestChatKnowledgeItems.map((item) => [normalizeQuestion(item.question), item.id]),
);
guestChatStarterQuestions.forEach((question, index) => {
  exactQuestions.set(normalizeQuestion(question), guestChatStarterKnowledgeIds[index]);
});

/**
 * These are complete, supported questions, not keyword scores. A question about
 * changing an RSVP, for example, must not receive the general RSVP explanation.
 */
const quickQuestionPatterns: ReadonlyArray<readonly [string, RegExp]> = [
  ["product-overview", /^(?:what (?:is envitefy|does envitefy (?:do|offer)|can (?:i|we) (?:do|make|create) with envitefy)|(?:tell me about|explain) envitefy|how does envitefy work)$/],
  ["choose-product", /^(?:(?:what(?:'s| is) the )?difference between |(?:should i|which should i) (?:choose|use) )(?:a |an )?(?:live card|event page|sign-up form)(?:,? (?:or|and|versus|vs) (?:a |an )?(?:live card|event page|sign-up form)){1,2}$/],
  ["guest-account", /^(?:(?:do|will|would) (?:my |our )?guests? (?:need|have to (?:create|install|use)) (?:an? )?(?:envitefy )?(?:app|account|login)(?: or (?:an? )?(?:account|app|login))?(?: to (?:rsvp|respond|view (?:the )?(?:event|page)|sign up))?|(?:can|do) guests? (?:rsvp|respond|sign up|view (?:the )?(?:event|page)) without (?:an? )?(?:app|account)|do (?:my )?guests? need to (?:sign in|log in))$/],
  ["uploads", /^(?:can i (?:upload (?:an? )?(?:invite|invitation|flyer|photo|screenshot|schedule|pdf)|(?:turn|convert) (?:an? )?(?:flyer|invite|invitation|photo|pdf)(?: (?:or|and) (?:invite |invitation )?photo)? into (?:an? )?(?:event|event page))|what can i upload(?: with (?:envitefy )?snap)?|(?:how do i|how can i) upload (?:an? )?(?:invite|invitation|flyer|photo|screenshot|schedule|pdf))$/],
  ["snap", /^(?:what(?:'s| is) (?:envitefy )?snap|how does (?:envitefy )?snap work|(?:tell me about|explain) (?:envitefy )?snap)$/],
  ["live-card", /^(?:how (?:do|can) i (?:create|make|build|start) (?:an? )?live card|what(?:'s| is) (?:an? )?live card|how (?:do|does) live cards? work)$/],
  ["create-event", /^(?:how (?:do|can) i (?:create|make|build|start) (?:an? |my )?(?:event|event page|invitation)|how (?:do|can) i get started(?: with envitefy)?|i (?:want|need|would like) to (?:create|make|build|start) (?:an? |my )?(?:event|event page|invitation))$/],
  ["concierge", /^(?:what(?:'s| is) (?:envitefy )?concierge|what can (?:this chat|concierge) (?:do|help with)|can (?:this chat|concierge) (?:create|make|publish) (?:my |an? )?event)$/],
  ["my-events-vs-invited", /^(?:what(?:'s| is) the difference between my events and invited events|what (?:are|is) (?:my events|invited events))$/],
  ["public-event-pages", /^(?:what(?:'s| is) (?:an? )?(?:envitefy )?(?:event page|event website)|what can guests? do(?: on (?:an? |the )?(?:shared )?(?:event page|event website))?|what (?:does|can) (?:an? )?event page (?:include|show))$/],
  ["rsvp", /^(?:how (?:(?:do|does) )?rsvps? work|what(?:'s| is) (?:an? )?rsvp|how (?:do|can) guests? (?:rsvp|respond)(?: to (?:an? |the )?(?:event|invitation))?|can guests? rsvp(?: directly)? (?:from|on) (?:an? |the )?(?:shared )?event page)$/],
  ["rsvp-fields", /^(?:what (?:information|details|fields) can (?:an? )?rsvp (?:collect|include)|can (?:an? )?rsvp collect (?:party size|meal choices|dietary needs|allergies|plus-ones))$/],
  ["rsvp-tracking", /^(?:can (?:i|hosts?|organizers?) (?:track|manage|view|see) (?:rsvps|rsvp responses|response counts|headcounts)|how (?:do|can) (?:i|hosts?|organizers?) (?:track|manage) (?:rsvps|rsvp responses))$/],
  ["smart-signups", /^(?:what (?:is|are) (?:a )?(?:smart )?sign[- ]?up forms?|how (?:do|does) (?:smart )?sign[- ]?ups? work|can i (?:create|make|use) (?:a )?(?:(?:volunteer|supply|potluck|food|shift) (?:or |and )?){0,2}sign[- ]?ups?(?: forms?)?|can guests? claim (?:sign[- ]?up )?slots)$/],
  ["registry", /^(?:can i (?:add|include) (?:a )?(?:registry|gift|wishlist|gift-list|fund)(?: (?:or|and) (?:gift|registry|fund))?(?: links?)?|does envitefy support (?:registries|registry links|gift links))$/],
  ["editing", /^(?:can i (?:edit|review|change) (?:the |my )?(?:event )?details before (?:publishing|sharing)|can i save (?:an? )?draft|how (?:do|does) drafts? work)$/],
  ["sharing", /^(?:how (?:do|can) i share (?:an? |my |the )?(?:event|event page|invitation|guest link)|how (?:do|can) guests? open (?:an? |the )?(?:event|event page|invitation)|can i share (?:an? |my |the )?(?:event|event page|invitation) (?:by|via) (?:text|email|link))$/],
  ["live-updates", /^(?:do guests? need (?:an? )?new link (?:after|when|if) i (?:edit|change|update) (?:the |my )?(?:event|event details)|(?:will|does) (?:the |my )?(?:event )?link (?:stay the same|change) (?:after|when|if) i (?:edit|change|update) (?:the |my )?(?:event|event details))$/],
  ["templates", /^(?:what (?:kinds|types) of events? (?:does envitefy support|can i (?:create|make))|(?:can i (?:create|make)|does envitefy support) (?:an? )?(?:wedding|birthday|baby shower|bridal shower|team event|school event|community event|gender reveal)(?: (?:page|invitation|event))?|what templates? (?:are available|does envitefy have))$/],
  ["passcodes", /^(?:can (?:an? )?event pages? (?:be (?:protected|private|password[- ]protected)|require (?:an? )?access code)|can i (?:protect|lock|password[- ]protect) (?:the |my |an? )?event page|how (?:do|does) (?:event )?(?:access codes?|passcodes?) work)$/],
  ["maps-calendar", /^(?:can guests? (?:get directions|save (?:the )?(?:date|event)(?: to (?:their |a )?calendar)?)|can (?:an? )?event page include (?:maps|directions|calendar actions)|how (?:do|can) guests? (?:get directions|save (?:the )?event to (?:their |a )?calendar))$/],
];

function isContextualQuestion(question: string) {
  return (
    /^(?:yes|no|maybe|sure|okay|ok|sounds good|what about that|how about that|what else|anything else|why|why not|how so|tell me more)$/.test(question) ||
    /^(?:can|could|would|will|do|does|how|what|where|when)\b[^?!.]{0,100}\b(?:it|that|those|them|this|they|there)\b/.test(question)
  );
}

function readyToDisplay(
  answer: GuestChatAnswer,
  message: string,
  history: GuestChatMessage[],
): GuestChatAnswer {
  const signupSuggested = answer.signupSuggested || shouldSuggestGuestSignup(message, history, {
    handoffSuggested: answer.handoffSuggested,
  });
  return {
    ...answer,
    answer: signupSuggested ? appendGuestSignupPrompt(answer.answer) : answer.answer,
    signupSuggested,
    aiAllowed: false,
  };
}

/**
 * Browser-safe, synchronous answers for supported complete questions. The returned
 * text and metadata are final. null means the server must interpret the question;
 * no keyword-based answer is presented as a confident answer to an unknown fact.
 */
export function getQuickGuestChatAnswer(
  message: string,
  history: GuestChatMessage[] = [],
): GuestChatAnswer | null {
  if (typeof message !== "string" || !message.trim() || message.length > 1000) return null;
  const question = normalizeQuestion(message);
  const deterministic = buildDeterministicGuestChatAnswer(message);

  // Privacy, specific-event, support, pricing, and account requests keep the
  // existing boundaries before any general product intent is considered.
  if (!deterministic.aiAllowed && deterministic.answer !== GUEST_CHAT_OUT_OF_SCOPE_ANSWER) {
    return readyToDisplay(deterministic, message, history);
  }

  const exactId = exactQuestions.get(question);
  const standaloneQuestion = question.replace(/^please /, "").replace(/^can you tell me /, "")
    .replace(/ (?:on|in|with) envitefy$/, "");
  const id = exactId || quickQuestionPatterns.find(([, pattern]) =>
    pattern.test(question) || pattern.test(standaloneQuestion))?.[0];
  const item = id ? answersById.get(id) : undefined;
  if (item) {
    return readyToDisplay({
      answer: item.answer,
      handoffSuggested: item.id === "support" || item.id === "pricing",
      signupSuggested: false,
      matchedKnowledgeIds: [item.id],
      aiAllowed: false,
    }, message, history);
  }

  if (isContextualQuestion(question)) return null;
  if (!deterministic.aiAllowed) return readyToDisplay(deterministic, message, history);
  return null;
}
