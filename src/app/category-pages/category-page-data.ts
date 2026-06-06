export type UseCaseIconId =
  | "calendar"
  | "checklist"
  | "gift"
  | "heart"
  | "link"
  | "map"
  | "message"
  | "sparkles"
  | "ticket"
  | "upload"
  | "users";

export type UseCaseStat = {
  label: string;
  value: string;
};

export type UseCaseFeature = {
  icon: UseCaseIconId;
  title: string;
  body: string;
};

export type UseCaseStep = {
  title: string;
  body: string;
};

export type UseCaseFaq = {
  question: string;
  answer: string;
};

export type UseCasePage = {
  slug: string;
  path: string;
  navLabel: string;
  eyebrow: string;
  title: string;
  metadataTitle: string;
  description: string;
  keywords: string[];
  heroImage: string;
  heroImageAlt: string;
  heroImagePosition?: string;
  primaryCta: string;
  primaryHref: string;
  secondaryCta: string;
  secondaryHref: string;
  theme: {
    accent: string;
    accentDark: string;
    accentSoft: string;
    ink: string;
    surface: string;
  };
  stats: UseCaseStat[];
  proofTitle: string;
  proofBody: string;
  preview: {
    eventTitle: string;
    eventMeta: string;
    statusRows: UseCaseStat[];
    chips: string[];
  };
  features: UseCaseFeature[];
  steps: UseCaseStep[];
  audience: string[];
  faqs: UseCaseFaq[];
};

export const useCasePages = [
  {
    slug: "weddings",
    path: "/weddings",
    navLabel: "Weddings",
    eyebrow: "Wedding pages",
    title: "Wedding website, RSVPs, registry links, and guest details in one polished page",
    metadataTitle: "Wedding Website, RSVP and Registry Page | Envitefy",
    description:
      "Create a polished wedding page with guest responses, plus-ones, registry links, meal notes, calendar saves, hotel details, and editable event updates.",
    keywords: [
      "wedding RSVP tracker",
      "wedding event page",
      "wedding RSVP website",
      "wedding registry invitation",
      "wedding guest list tracker",
    ],
    heroImage: "/images/landing/hero/garden-vows-desktop.webp",
    heroImageAlt: "Wedding weekend event page preview",
    heroImagePosition: "center",
    primaryCta: "Create your wedding page",
    primaryHref: "/snap?auth=signup",
    secondaryCta: "Browse wedding guide",
    secondaryHref: "/guides/wedding-event-page",
    theme: {
      accent: "#b88a5c",
      accentDark: "#3c231d",
      accentSoft: "#f7efe6",
      ink: "#211819",
      surface: "#fffaf4",
    },
    stats: [
      { label: "attending", value: "84" },
      { label: "pending", value: "12" },
      { label: "registry links", value: "3" },
    ],
    proofTitle: "A wedding page that feels guest-ready, not spreadsheet-built.",
    proofBody:
      "Envitefy keeps the ceremony, reception, RSVP deadline, plus-ones, meal choices, registry links, maps, and calendar actions together after the invite is sent.",
    preview: {
      eventTitle: "Willow Garden Wedding",
      eventMeta: "Ceremony, reception, hotel block, registry",
      statusRows: [
        { label: "Households replied", value: "58" },
        { label: "Meal choices captured", value: "126" },
        { label: "Plus-ones confirmed", value: "19" },
      ],
      chips: ["Registry", "Hotel block", "Add to Calendar"],
    },
    features: [
      {
        icon: "ticket",
        title: "Track every response",
        body: "See attending, declined, pending, households, plus-ones, notes, and guest details without chasing separate texts.",
      },
      {
        icon: "heart",
        title: "Wedding-ready presentation",
        body: "Share a beautiful public page with ceremony timing, reception details, travel notes, dress code, photos, and schedule updates.",
      },
      {
        icon: "gift",
        title: "Registry and hotel links",
        body: "Keep registry links, hotel blocks, venue maps, and guest FAQs visible beside the RSVP flow.",
      },
      {
        icon: "calendar",
        title: "Calendar-safe details",
        body: "Guests can save the right date, time, location, and reminders from one link they can reopen anytime.",
      },
    ],
    steps: [
      {
        title: "Start from an invite or create manually",
        body: "Upload existing invitation details or build the wedding page from scratch.",
      },
      {
        title: "Set guest questions",
        body: "Collect attendance, household counts, plus-ones, meal choices, and notes.",
      },
      {
        title: "Share one live link",
        body: "Send the page once, then update registry, travel, venue, and timing details as plans change.",
      },
    ],
    audience: ["Couples", "wedding planners", "hosts", "families managing guest lists"],
    faqs: [
      {
        question: "Can guests RSVP without creating an account?",
        answer: "Yes. Guests can respond from the public event page without installing an app.",
      },
      {
        question: "Can we track plus-ones and families?",
        answer:
          "Yes. The RSVP flow can capture household counts, plus-ones, children, and guest notes.",
      },
      {
        question: "Can we collect meal choices?",
        answer:
          "Yes. Use RSVP questions for meal choices, allergies, notes, and other planner-visible details.",
      },
      {
        question: "Can we add registry links?",
        answer: "Yes. Registry, hotel, venue, map, and custom links can live on the wedding page.",
      },
      {
        question: "Can we update the page after sending it?",
        answer:
          "Yes. Update time, location, registry, schedule, and notes without sending a new invite image.",
      },
      {
        question: "Can guests add the wedding to their calendar?",
        answer: "Yes. Envitefy supports calendar save actions from the event page.",
      },
    ],
  },
  {
    slug: "bridal-showers",
    path: "/bridal-showers",
    navLabel: "Bridal Showers",
    eyebrow: "Bridal shower pages",
    title: "A bridal shower page with RSVPs, registry links, and host notes built in",
    metadataTitle: "Bridal Shower Invitation, RSVP and Registry Page | Envitefy",
    description:
      "Create a bridal shower RSVP page from an invite or from scratch with guest tracking, registry links, host details, calendar saves, and reminders.",
    keywords: [
      "bridal shower RSVP tracker",
      "bridal shower invitation",
      "bridal shower registry link",
      "bridal shower guest list",
    ],
    heroImage: "/images/landing/hero/garden-brunch-desktop.webp",
    heroImageAlt: "Garden brunch live invitation card",
    heroImagePosition: "center",
    primaryCta: "Create a bridal shower page",
    primaryHref: "/snap?auth=signup",
    secondaryCta: "Try invite upload",
    secondaryHref: "/snap",
    theme: {
      accent: "#d46f88",
      accentDark: "#3b2030",
      accentSoft: "#fff0f4",
      ink: "#241721",
      surface: "#fff9fb",
    },
    stats: [
      { label: "guests", value: "42" },
      { label: "pending", value: "9" },
      { label: "host links", value: "5" },
    ],
    proofTitle: "A shower page that helps the host look prepared.",
    proofBody:
      "Turn brunch details, registry links, guest notes, directions, RSVP status, and host updates into a page guests can use from their phones.",
    preview: {
      eventTitle: "Madeline's Garden Shower",
      eventMeta: "Brunch, registry, host message, RSVP",
      statusRows: [
        { label: "Accepted", value: "31" },
        { label: "Need reminder", value: "9" },
        { label: "Gift links", value: "3" },
      ],
      chips: ["Registry", "Host note", "Reminder list"],
    },
    features: [
      {
        icon: "upload",
        title: "From invite to RSVP page",
        body: "Upload an existing invitation or enter shower details manually, then publish a guest-ready link.",
      },
      {
        icon: "users",
        title: "Know who is coming",
        body: "Track yes, no, pending, guest notes, plus-ones, and host-visible details in one view.",
      },
      {
        icon: "gift",
        title: "Make gifts easy to find",
        body: "Add registry links, gift notes, themes, and host instructions beside the RSVP flow.",
      },
      {
        icon: "message",
        title: "Designed for hosts",
        body: "Share one link, send updates, remind pending guests, and change details after the invite is out.",
      },
    ],
    steps: [
      {
        title: "Upload or build",
        body: "Start from a shower invite, brunch flyer, or a blank event page.",
      },
      {
        title: "Add host details",
        body: "Include registry links, arrival notes, dress guidance, maps, and calendar actions.",
      },
      {
        title: "Track replies",
        body: "Keep RSVP status and reminders visible without managing a spreadsheet.",
      },
    ],
    audience: ["maids of honor", "hosts", "family planners", "bridal party organizers"],
    faqs: [
      {
        question: "Can I upload an existing bridal shower invitation?",
        answer: "Yes. Envitefy can start from an invite upload or a manually created shower page.",
      },
      {
        question: "Can guests RSVP from a phone?",
        answer: "Yes. The public RSVP flow is built for mobile guests.",
      },
      {
        question: "Can I include registry links?",
        answer: "Yes. Add registry links, gift notes, and custom host links.",
      },
      {
        question: "Can multiple hosts manage the shower details?",
        answer:
          "Hosts can keep the same live page updated, and shared planning details stay in one place.",
      },
      {
        question: "Can guests add the shower to their calendar?",
        answer: "Yes. Guests can save the date from the event page.",
      },
      {
        question: "Can I change the time or location after sharing?",
        answer: "Yes. Update the live page instead of resending a new invite.",
      },
    ],
  },
  {
    slug: "baby-showers",
    path: "/baby-showers",
    navLabel: "Baby Showers",
    eyebrow: "Baby shower pages",
    title: "Baby shower invitations, RSVPs, registry links, and guest details in one place",
    metadataTitle: "Baby Shower Invitation, RSVP and Registry Page | Envitefy",
    description:
      "Create a polished baby shower event site, collect RSVPs, track plus-ones, add registry links, collect guest notes, and send reminders.",
    keywords: [
      "baby shower RSVP tracker",
      "baby shower registry invitation",
      "baby shower guest list",
      "baby shower RSVP website",
    ],
    heroImage: "/images/landing/hero/baby-shower-desktop.webp",
    heroImageAlt: "Baby shower event page preview",
    heroImagePosition: "center",
    primaryCta: "Create your baby shower page",
    primaryHref: "/snap?auth=signup",
    secondaryCta: "Upload a shower invite",
    secondaryHref: "/snap",
    theme: {
      accent: "#6aa7a5",
      accentDark: "#183335",
      accentSoft: "#eaf7f4",
      ink: "#172827",
      surface: "#f8fffc",
    },
    stats: [
      { label: "RSVPs", value: "36" },
      { label: "pending", value: "11" },
      { label: "gift links", value: "4" },
    ],
    proofTitle: "Guest replies, registry links, and parent notes stay connected.",
    proofBody:
      "Envitefy gives hosts one shareable place for attendance, diaper raffle notes, meal preferences, sibling counts, calendar saves, and registry links.",
    preview: {
      eventTitle: "Little Sprout Baby Shower",
      eventMeta: "Registry, RSVP, diaper raffle, brunch",
      statusRows: [
        { label: "Going", value: "36" },
        { label: "No response", value: "11" },
        { label: "Notes captured", value: "18" },
      ],
      chips: ["Babylist", "Diaper raffle", "Calendar"],
    },
    features: [
      {
        icon: "checklist",
        title: "RSVP dashboard",
        body: "Track guest counts, household responses, plus-ones, pending replies, and host notes.",
      },
      {
        icon: "gift",
        title: "Registry and gift links",
        body: "Surface Babylist, Target, Amazon, or custom registry links on the public page.",
      },
      {
        icon: "users",
        title: "Guest details that matter",
        body: "Collect sibling attendance, meal notes, diaper raffle details, and special instructions.",
      },
      {
        icon: "calendar",
        title: "Reminders and calendar saves",
        body: "Make the event easy to remember and easier for guests to find later.",
      },
    ],
    steps: [
      {
        title: "Create the shower page",
        body: "Start from a baby shower invite or choose a clean page layout.",
      },
      {
        title: "Add registry and guest questions",
        body: "Collect the details the host needs without a separate form.",
      },
      {
        title: "Share and update",
        body: "Send one link and keep guests current when plans change.",
      },
    ],
    audience: ["baby shower hosts", "parents-to-be", "family organizers", "friends planning brunch"],
    faqs: [
      {
        question: "Can I add registry links to the RSVP page?",
        answer: "Yes. Add Babylist, Target, Amazon, or any custom registry link.",
      },
      {
        question: "Can guests RSVP for more than one person?",
        answer: "Yes. Guests can include plus-ones, household members, or siblings.",
      },
      {
        question: "Can I track meal choices or notes?",
        answer: "Yes. RSVP questions can collect meal preferences, notes, and host-only details.",
      },
      {
        question: "Can I upload an existing baby shower invite?",
        answer: "Yes. You can start from an upload or create the page manually.",
      },
      {
        question: "Can guests save the shower to their calendar?",
        answer: "Yes. Calendar save actions are available from the event page.",
      },
      {
        question: "Can I send reminders to people who have not responded?",
        answer: "Yes. Envitefy is built around tracking pending guests and follow-ups.",
      },
    ],
  },
  {
    slug: "gymnastics",
    path: "/gymnastics",
    navLabel: "Gymnastics",
    eyebrow: "Gymnastics meet schedule page",
    title: "Turn gymnastics meet flyers into a polished team info hub",
    metadataTitle: "Gymnastics Meet Schedule and RSVP Page | Envitefy",
    description:
      "Create a gymnastics meet page from flyers or schedules with session times, team info, RSVP tracking, parent updates, maps, and calendar links.",
    keywords: [
      "gymnastics meet schedule app",
      "gymnastics meet RSVP",
      "gymnastics flyer parser",
      "gymnastics team communication",
      "meet day schedule organizer",
    ],
    heroImage: "/images/landing/hero/friday-night-lights-desktop.webp",
    heroImageAlt: "Team schedule event page preview",
    heroImagePosition: "center",
    primaryCta: "Create a meet page",
    primaryHref: "/gymnastics?auth=signup",
    secondaryCta: "Upload a meet flyer",
    secondaryHref: "/snap",
    theme: {
      accent: "#20a6a2",
      accentDark: "#102f3a",
      accentSoft: "#e7f8f7",
      ink: "#12272f",
      surface: "#f7fcfd",
    },
    stats: [
      { label: "sessions", value: "6" },
      { label: "families", value: "48" },
      { label: "updates", value: "live" },
    ],
    proofTitle: "One meet-day page parents can actually use.",
    proofBody:
      "Envitefy organizes session times, warmups, rotations, location notes, parking, coach updates, calendar links, and parent responses from one shared link.",
    preview: {
      eventTitle: "Level 4 State Meet",
      eventMeta: "Warmup, march-in, awards, parking",
      statusRows: [
        { label: "Athlete availability", value: "42" },
        { label: "Missing responses", value: "6" },
        { label: "Volunteer slots", value: "8" },
      ],
      chips: ["Session 2", "Venue map", "Coach note"],
    },
    features: [
      {
        icon: "upload",
        title: "From flyer to meet page",
        body: "Turn meet PDFs, image schedules, and parent screenshots into structured event details.",
      },
      {
        icon: "calendar",
        title: "Session timelines",
        body: "Share warmup, march-in, competition, awards, and calendar links in a format families can scan.",
      },
      {
        icon: "users",
        title: "Team responses",
        body: "Track RSVP status, athlete availability, volunteer slots, and missing parent responses.",
      },
      {
        icon: "map",
        title: "Meet-day information",
        body: "Keep venue maps, admission notes, parking, coach updates, and changes on one page.",
      },
    ],
    steps: [
      {
        title: "Upload the meet info",
        body: "Start from a meet flyer, schedule screenshot, or PDF packet.",
      },
      {
        title: "Publish the team hub",
        body: "Give parents one link for sessions, location, team notes, and calendar saves.",
      },
      {
        title: "Keep families current",
        body: "Update details after changes instead of repeating the same answers in chat.",
      },
    ],
    audience: ["coaches", "booster clubs", "team parents", "gymnastics families"],
    faqs: [
      {
        question: "Can Envitefy parse a gymnastics meet flyer or PDF schedule?",
        answer:
          "Yes. The upload flow is built for flyers, PDFs, schedules, screenshots, and meet info packets.",
      },
      {
        question: "Can families RSVP or mark athlete availability?",
        answer: "Yes. Organizers can collect parent responses and athlete availability.",
      },
      {
        question: "Can parents add sessions to their calendars?",
        answer: "Yes. Calendar actions help families save the important meet timing.",
      },
      {
        question: "Can we share one page with the whole team?",
        answer: "Yes. One public link can carry the team schedule and organizer updates.",
      },
      {
        question: "Can meet details be updated after publishing?",
        answer: "Yes. Change session notes, venue details, parking, and updates after the link is shared.",
      },
      {
        question: "Does this work for multi-session meets?",
        answer: "Yes. The page can organize multiple sessions, levels, locations, and timing notes.",
      },
    ],
  },
  {
    slug: "signup-forms",
    path: "/signup-forms",
    navLabel: "Signup Forms",
    eyebrow: "Online signup forms",
    title: "Online signup forms that stay organized after people respond",
    metadataTitle: "Online Signup Forms for Events | Envitefy",
    description:
      "Create polished signup pages for volunteers, potlucks, teams, classes, fundraisers, and group events with slots, limits, reminders, and one shareable link.",
    keywords: [
      "online signup forms",
      "free signup sheet",
      "volunteer signup form",
      "potluck signup sheet",
      "event signup form",
    ],
    heroImage: "/images/landing/hero/lincoln-discovery-desktop.webp",
    heroImageAlt: "School field trip event page preview",
    heroImagePosition: "center",
    primaryCta: "Create a signup form",
    primaryHref: "/snap?auth=signup",
    secondaryCta: "Read signup guide",
    secondaryHref: "/guides/smart-signup-forms",
    theme: {
      accent: "#5270d7",
      accentDark: "#18214d",
      accentSoft: "#eef2ff",
      ink: "#171b33",
      surface: "#f8f9ff",
    },
    stats: [
      { label: "open slots", value: "14" },
      { label: "claimed", value: "31" },
      { label: "lists", value: "4" },
    ],
    proofTitle: "A signup link that does not turn into spreadsheet cleanup.",
    proofBody:
      "Envitefy helps organizers collect names, slots, quantities, notes, reminders, and event details from one clean public page.",
    preview: {
      eventTitle: "Spring Carnival Volunteers",
      eventMeta: "Booths, shifts, supplies, reminders",
      statusRows: [
        { label: "Snack slots claimed", value: "12" },
        { label: "Volunteer shifts", value: "18" },
        { label: "Still needed", value: "14" },
      ],
      chips: ["Copy link", "QR", "Reminder"],
    },
    features: [
      {
        icon: "checklist",
        title: "Built for group coordination",
        body: "Use it for volunteer shifts, potlucks, classroom needs, team snacks, fundraisers, and events.",
      },
      {
        icon: "sparkles",
        title: "Templates close to finished",
        body: "Start with the right structure, then customize slots, labels, quantities, and notes.",
      },
      {
        icon: "users",
        title: "Responses without cleanup",
        body: "Track who claimed each item, which slots are full, and what still needs attention.",
      },
      {
        icon: "link",
        title: "Share once, update anytime",
        body: "Send one form link, make edits after publishing, and keep reminders connected to the event.",
      },
    ],
    steps: [
      {
        title: "Pick the signup structure",
        body: "Start with slots, supplies, volunteer shifts, or a custom event signup.",
      },
      {
        title: "Set limits and details",
        body: "Control quantities, descriptions, names, notes, and organizer visibility.",
      },
      {
        title: "Share the live form",
        body: "Use one link for signups, updates, reminders, and event details.",
      },
    ],
    audience: ["teachers", "team parents", "volunteer coordinators", "church groups", "work teams"],
    faqs: [
      {
        question: "Can I create a signup form for free?",
        answer: "Envitefy supports fast signup creation, with account options handled during setup.",
      },
      {
        question: "Can people sign up without creating an account?",
        answer: "Guests can respond from the shared public form without installing an app.",
      },
      {
        question: "Can I limit how many people claim each item?",
        answer: "Yes. Signup slots can be structured around quantities, time slots, or needs.",
      },
      {
        question: "Can I edit the form after sharing it?",
        answer: "Yes. Update slots, notes, and event details after the link is out.",
      },
      {
        question: "Can Envitefy send reminders?",
        answer: "Envitefy is built around guest updates and reminder-friendly event workflows.",
      },
      {
        question: "Can I use signup forms for school, sports, church, or work events?",
        answer: "Yes. The form flow is flexible for many group coordination use cases.",
      },
    ],
  },
  {
    slug: "gender-reveal",
    path: "/gender-reveal",
    navLabel: "Gender Reveals",
    eyebrow: "Gender reveal pages",
    title: "Gender reveal invitations with RSVPs, guesses, gift notes, and reminders built in",
    metadataTitle: "Gender Reveal Invitation, RSVP and Party Page | Envitefy",
    description:
      "Create a gender reveal event page where guests RSVP, save the date, make reveal guesses, view details, and get updates from one shareable link.",
    keywords: [
      "gender reveal invitation",
      "gender reveal RSVP",
      "team pink team blue poll",
      "gender reveal party tracker",
    ],
    heroImage: "/images/landing/template-proof/generated/gender-reveal.webp",
    heroImageAlt: "Gender reveal event page example",
    heroImagePosition: "center",
    primaryCta: "Create your reveal party page",
    primaryHref: "/snap?auth=signup",
    secondaryCta: "Upload an invite",
    secondaryHref: "/snap",
    theme: {
      accent: "#a66dd7",
      accentDark: "#2b1748",
      accentSoft: "#f5edff",
      ink: "#21152f",
      surface: "#fbf8ff",
    },
    stats: [
      { label: "RSVPs", value: "54" },
      { label: "guesses", value: "49" },
      { label: "pending", value: "8" },
    ],
    proofTitle: "A reveal page with the fun and the guest logistics in one place.",
    proofBody:
      "Envitefy combines the invitation, RSVP status, reveal guesses, guest reminders, gift links, maps, and calendar saves so hosts stay in control.",
    preview: {
      eventTitle: "Little Spark Reveal",
      eventMeta: "RSVP, Team Pink or Team Blue, countdown",
      statusRows: [
        { label: "Team Pink", value: "28" },
        { label: "Team Blue", value: "21" },
        { label: "No response", value: "8" },
      ],
      chips: ["Guess poll", "Gift note", "Calendar"],
    },
    features: [
      {
        icon: "sparkles",
        title: "Invite page builder",
        body: "Create an event page with reveal details, theme styling, RSVP settings, and a share link.",
      },
      {
        icon: "ticket",
        title: "RSVP and guest tracking",
        body: "Track attendance, plus-ones, pending responses, and export-ready guest details.",
      },
      {
        icon: "heart",
        title: "Reveal guesses",
        body: "Add an optional Team Pink or Team Blue prediction tied to guest responses.",
      },
      {
        icon: "message",
        title: "Reminders and updates",
        body: "Notify guests about time, venue, dress code, reveal details, or plan changes.",
      },
    ],
    steps: [
      {
        title: "Create the reveal invite",
        body: "Upload an invitation or build a new reveal page with RSVP settings.",
      },
      {
        title: "Add the guess moment",
        body: "Collect reveal predictions and attendance in the same guest flow.",
      },
      {
        title: "Keep guests updated",
        body: "Share calendar saves, reminders, gift links, and plan changes from the live page.",
      },
    ],
    audience: ["parents-to-be", "family hosts", "party planners", "friends planning reveal events"],
    faqs: [
      {
        question: "Can guests vote Team Pink or Team Blue?",
        answer: "Yes. You can include an optional reveal guess flow with RSVP details.",
      },
      {
        question: "Can I hide or show the guess tally?",
        answer: "The page can be structured so the host controls how reveal guesses are presented.",
      },
      {
        question: "Can I upload my existing gender reveal invite?",
        answer: "Yes. Start from an upload or create a new event page manually.",
      },
      {
        question: "Can guests RSVP with plus-ones?",
        answer: "Yes. The RSVP flow can collect plus-ones and household counts.",
      },
      {
        question: "Can I add registry or gift links?",
        answer: "Yes. Add registry, gift, or custom links to the page.",
      },
      {
        question: "Can guests save the party to their calendar?",
        answer: "Yes. Calendar save actions are available from the event page.",
      },
    ],
  },
  {
    slug: "birthdays",
    path: "/birthdays",
    navLabel: "Birthdays",
    eyebrow: "Birthday party pages",
    title: "Birthday party invitations, RSVPs, gift notes, and updates without the group text chaos",
    metadataTitle: "Birthday Party Invitation and RSVP Page | Envitefy",
    description:
      "Create a birthday invite page, collect RSVPs, track guests, add gift links, send reminders, and keep party details easy to find on any phone.",
    keywords: [
      "birthday party RSVP",
      "birthday invitation tracker",
      "kids birthday RSVP",
      "online birthday invitation",
      "birthday party guest list",
    ],
    heroImage: "/images/landing/hero/birthday-dino-desktop.webp",
    heroImageAlt: "Birthday party event page preview",
    heroImagePosition: "center",
    primaryCta: "Create your birthday page",
    primaryHref: "/snap?auth=signup",
    secondaryCta: "Read birthday guide",
    secondaryHref: "/guides/birthday-rsvp-invitation",
    theme: {
      accent: "#e6953a",
      accentDark: "#3b2413",
      accentSoft: "#fff3df",
      ink: "#21170f",
      surface: "#fffaf2",
    },
    stats: [
      { label: "kids", value: "18" },
      { label: "adults", value: "22" },
      { label: "pending", value: "7" },
    ],
    proofTitle: "A party link parents can reopen when they need the details.",
    proofBody:
      "Envitefy replaces invite screenshots and group texts with one page for RSVPs, gift links, map details, calendar saves, and reminder-friendly guest tracking.",
    preview: {
      eventTitle: "Leo's Dino Birthday",
      eventMeta: "RSVP, gift note, map, allergy notes",
      statusRows: [
        { label: "Families attending", value: "16" },
        { label: "No response", value: "7" },
        { label: "Gift links", value: "2" },
      ],
      chips: ["RSVP", "Gift note", "Map"],
    },
    features: [
      {
        icon: "ticket",
        title: "A real party page",
        body: "Share date, time, place, map, RSVP buttons, notes, gift links, and calendar actions.",
      },
      {
        icon: "users",
        title: "Track every guest",
        body: "See attending counts, household names, children, adults, pending guests, and response notes.",
      },
      {
        icon: "upload",
        title: "Start from an invite",
        body: "Upload an existing birthday invite or create the page from scratch.",
      },
      {
        icon: "message",
        title: "Parent-friendly sharing",
        body: "Text one link, remind guests, and update details after plans change.",
      },
    ],
    steps: [
      {
        title: "Build or upload",
        body: "Start with a birthday invite image or build the party page manually.",
      },
      {
        title: "Collect useful replies",
        body: "Track kids, adults, allergies, notes, pending guests, and gift links.",
      },
      {
        title: "Send one live link",
        body: "Guests can reopen the page for directions, timing, RSVP, and calendar saves.",
      },
    ],
    audience: ["parents", "party hosts", "family organizers", "venue planners"],
    faqs: [
      {
        question: "Can guests RSVP without downloading an app?",
        answer: "Yes. Guests can RSVP from the public event page.",
      },
      {
        question: "Can I upload an existing birthday invitation?",
        answer: "Yes. Envitefy can start from an invitation upload or manual event details.",
      },
      {
        question: "Can I track who has not responded yet?",
        answer: "Yes. The host view helps separate attending, declined, and pending guests.",
      },
      {
        question: "Can I add gift registry or wishlist links?",
        answer: "Yes. Add wishlist, registry, gift note, or custom links.",
      },
      {
        question: "Can guests add the party to their calendar?",
        answer: "Yes. Guests can save the party date from the event page.",
      },
      {
        question: "Can I update the time or address after sending?",
        answer: "Yes. Update the live page so guests always see the current details.",
      },
    ],
  },
] as const satisfies UseCasePage[];

export type UseCaseSlug = (typeof useCasePages)[number]["slug"];

export const useCaseNavLinks = useCasePages.map((page) => ({
  label: page.navLabel,
  href: page.path,
}));

export function getUseCasePage(slug: string): UseCasePage | undefined {
  return useCasePages.find((page) => page.slug === slug);
}

export function getUseCasePageByPath(path: string): UseCasePage | undefined {
  return useCasePages.find((page) => page.path === path);
}
