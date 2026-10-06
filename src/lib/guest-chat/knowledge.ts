export type GuestChatKnowledgeItem = {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
};

export { guestChatStarterQuestions } from "./starters.ts";

export const guestChatKnowledgeItems: GuestChatKnowledgeItem[] = [
  {
    id: "product-overview",
    question: "What does Envitefy create?",
    answer:
      "Envitefy helps hosts create Live Cards (animated invitation cards), themed Event Pages, and Sign-up Forms, each shared with one link. Guests can RSVP, get directions, save the date to their calendar, open registry links, and claim sign-up slots. You can start from a design, a category template, or by uploading an invite or flyer you already have.",
    keywords: ["envitefy", "make", "create", "event", "page", "invitation", "hosted", "host", "offer", "features"],
  },
  {
    id: "guest-account",
    question: "Do guests need an account?",
    answer:
      "No. Guests can open a shared Envitefy event page in their browser on phones or desktops. They can use available actions like RSVP, maps, calendar saves, registry links, and sign-ups without installing an app.",
    keywords: ["guest", "account", "sign", "signin", "login", "install", "app", "browser"],
  },
  {
    id: "uploads",
    question: "Can I start from an invite, flyer, schedule, or PDF?",
    answer:
      "Yes. SNAP is the upload path for hosts who already have source material. Photograph or upload an invite, flyer, screenshot, schedule, or PDF, then review the extracted details before publishing.",
    keywords: [
      "upload",
      "snap",
      "invite",
      "flyer",
      "schedule",
      "pdf",
      "screenshot",
      "ocr",
      "photo",
      "camera",
    ],
  },
  {
    id: "snap",
    question: "What is SNAP?",
    answer:
      "SNAP lets you photograph or upload an invite, flyer, screenshot, schedule, or PDF. Envitefy reads the title, date, time, and location, builds a reviewable draft, and turns it into a live event page you can share.",
    keywords: ["snap", "upload", "ocr", "photo", "camera", "flyer", "screenshot", "pdf", "extract"],
  },
  {
    id: "live-card",
    question: "How do I create a Live Card?",
    answer:
      "Sign in and open Live Card from Create. In Design, pick the event type and describe the look you want (you can add a reference image), then select Generate & continue. While the artwork is being made, fill in Event details: title, date and time, location, RSVP and registry. Review the card, then Publish and share the guest link. Guests tap buttons on the card for RSVP, details, location, calendar and registry.",
    keywords: ["live card", "livecard", "card", "animated", "artwork", "design", "generate", "invitation card"],
  },
  {
    id: "choose-product",
    question: "Should I use a Live Card, an Event Page, or a Sign-up Form?",
    answer:
      "Choose a Live Card for a striking invitation card with RSVP and guest buttons, ideal for parties, showers and weddings. Choose an Event Page for a fuller website with schedules, sections, maps and updates, like a wedding weekend, sports season or school event. Choose a Sign-up Form when guests need to claim volunteer roles, items or time slots.",
    keywords: ["which", "choose", "difference", "should i use", "versus", "vs", "best", "where to start"],
  },
  {
    id: "concierge",
    question: "What is Envitefy Concierge?",
    answer:
      "Envitefy Concierge is this help chat. It answers questions about Envitefy and helps you choose where to start. Creating happens in the Live Card builder, the Event Page editors, and the Sign-up Form builder, where you save drafts and publish when you are ready.",
    keywords: ["concierge", "chat", "ai", "assistant", "envitefy concierge", "envitefy create"],
  },
  {
    id: "my-events-vs-invited",
    question: "What is the difference between My events and Invited events?",
    answer:
      "My events are events you are creating or owning as the host. Invited events are received invite-card cases, such as a birthday party, wedding, gender reveal, or similar social invite someone else sent you.",
    keywords: ["my", "events", "invited", "ownership", "received", "host", "hosting"],
  },
  {
    id: "public-event-pages",
    question: "What is an Envitefy event page?",
    answer:
      "An Envitefy event page is a guest-facing web page for the event. Depending on what the host enables, it can include event details, schedule, location, calendar actions, RSVP, registry or gift links, sign-up slots, and updates.",
    keywords: ["public", "event", "page", "website", "guest", "details", "location", "calendar"],
  },
  {
    id: "rsvp",
    question: "How do RSVPs work?",
    answer:
      "When RSVP is enabled, guests can respond from the live event page. Hosts keep replies organized with the event instead of tracking answers across texts, emails, screenshots, and separate spreadsheets.",
    keywords: [
      "rsvp",
      "reply",
      "respond",
      "attendance",
      "attending",
      "guest count",
      "yes",
      "no",
      "maybe",
    ],
  },
  {
    id: "smart-signups",
    question: "Can I create volunteer or supply sign-ups?",
    answer:
      "Yes. Smart sign-ups can support volunteer roles, supply lists, food stations, capacity limits, waitlists, and guest updates from the shared event page.",
    keywords: ["signup", "sign-up", "volunteer", "supply", "slots", "capacity", "waitlist", "food"],
  },
  {
    id: "registry",
    question: "Can I add registry or gift links?",
    answer:
      "Yes. Envitefy event pages can include registry, gift-list, wishlist, diaper fund, no-gifts notes, and other gift guidance when the host adds those details.",
    keywords: ["registry", "gift", "wishlist", "babylist", "diaper", "fund", "no gifts"],
  },
  {
    id: "editing",
    question: "Can I edit details before publishing?",
    answer:
      "Yes. Envitefy creates a draft first. Hosts can review names, dates, locations, RSVP settings, registry links, sign-up slots, and guest-facing copy before sharing the link.",
    keywords: ["edit", "draft", "publish", "review", "change", "update", "before", "sharing"],
  },
  {
    id: "templates",
    question: "What kinds of events does Envitefy support?",
    answer:
      "Envitefy supports many hosted event pages and invitation flows, including weddings, birthdays, baby showers, school events, team events, community gatherings, special events, and smart sign-up forms.",
    keywords: ["template", "wedding", "birthday", "baby", "school", "team", "community", "special"],
  },
  {
    id: "passcodes",
    question: "Can event pages be protected?",
    answer:
      "Some Envitefy event pages can use an access code when the host enables that setting. Guests unlock the shared event page with the code provided by the host.",
    keywords: ["passcode", "access", "code", "protected", "private", "unlock"],
  },
  {
    id: "pricing",
    question: "How much does Envitefy cost?",
    answer:
      "I do not have confirmed pricing details in this chat. For pricing, billing, partnerships, or account-specific questions, use the contact option so the Envitefy team can follow up.",
    keywords: ["price", "pricing", "cost", "billing", "plan", "subscription", "trial"],
  },
  {
    id: "privacy-boundary",
    question: "Can this chat see private event or account details?",
    answer:
      "No. This guest chat can explain Envitefy, but it cannot see private accounts, private guest lists, hidden RSVP responses, secret access codes, or unpublished event details.",
    keywords: ["private", "privacy", "guest list", "responses", "account", "secret", "hidden"],
  },
  {
    id: "support",
    question: "How do I contact Envitefy?",
    answer:
      "Use the contact option in this chat or visit the Contact page. Include what you are trying to create or the guest action you need help with so the team can respond with the right context.",
    keywords: ["support", "contact", "human", "help", "email", "team", "question"],
  },
];

const WORD_PATTERN = /[a-z0-9]+/g;

function words(value: string): string[] {
  return value.toLowerCase().match(WORD_PATTERN) || [];
}

export function rankGuestChatKnowledge(message: string, limit = 5): GuestChatKnowledgeItem[] {
  const queryWords = new Set(words(message));
  if (!queryWords.size) return [];

  return guestChatKnowledgeItems
    .map((item) => {
      const keywordScore = item.keywords.reduce((score, keyword) => {
        const normalized = keyword.toLowerCase();
        if (message.toLowerCase().includes(normalized)) return score + 4 * words(keyword).length;
        return score + words(keyword).filter((word) => queryWords.has(word)).length * 2;
      }, 0);
      const questionScore = words(item.question).filter((word) => queryWords.has(word)).length;
      const answerScore = words(item.answer).filter((word) => queryWords.has(word)).length * 0.25;
      return { item, score: keywordScore + questionScore + answerScore };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.item);
}

export function buildGuestChatKnowledgeContext(items: GuestChatKnowledgeItem[]) {
  return items.map((item) => `Q: ${item.question}\nA: ${item.answer}`).join("\n\n");
}
