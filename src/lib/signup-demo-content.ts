import type { SignupFormSlot, SignupThemeId } from "@/types/signup";

type DemoSlot = Omit<SignupFormSlot, "id">;
type DemoProfile = {
  themeId: SignupThemeId;
  group: string;
  host: string;
  venue: string;
  welcome: string;
  section: string;
  instructions: string;
  slots: DemoSlot[];
  question: string;
  startTime: string;
  endTime: string;
  multiple?: boolean;
};

const slot = (label: string, capacity: number, notes: string): DemoSlot => ({
  label,
  capacity,
  notes,
});

// Fictional, editable examples. Guest responses and reservations are never seeded.
const PROFILES = {
  potluck: {
    themeId: "harvest-table",
    group: "Maple Street Neighbors",
    host: "Morgan & Jamie",
    venue: "Maple House · Community kitchen",
    welcome:
      "Pull up a chair and bring a favorite dish. Choose something below so there is a little of everything on the table.",
    section: "What will you bring?",
    instructions:
      "Each dish should serve 8–10 people. Please label ingredients and bring a serving spoon.",
    slots: [
      slot("A favorite main dish", 3, "Bring it ready to serve in a covered dish."),
      slot("Salad or seasonal sides", 4, "Fresh, roasted, or family famous—all welcome."),
      slot("Something sweet", 3, "Small portions make it easy to share."),
      slot("Drinks & ice", 2, "Bring enough for 12 guests and a bag of ice."),
    ],
    question: "What are you bringing, and does it contain any common allergens?",
    startTime: "17:00",
    endTime: "20:00",
    multiple: true,
  },
  volunteers: {
    themeId: "community-garden",
    group: "Oakwood Community Collective",
    host: "Alex Morgan",
    venue: "Oakwood Community Center",
    welcome:
      "A few helping hands make a big difference. Pick a role that suits you and help us make the day welcoming for everyone.",
    section: "Find your helping role",
    instructions: "Choose a shift and check in at the welcome table 10 minutes before it begins.",
    slots: [
      slot("Set up tables & signs", 4, "Help the team prepare the space."),
      slot("Welcome & check-in", 3, "Greet guests and point them in the right direction."),
      slot("Activity helpers", 6, "Support the hosts and keep supplies topped up."),
      slot("Pack down & tidy up", 4, "Leave the shared space ready for its next gathering."),
    ],
    question: "Is there a role you especially enjoy or an accommodation that would help?",
    startTime: "09:00",
    endTime: "13:00",
    multiple: true,
  },
  supplies: {
    themeId: "school-days",
    group: "Oakwood Elementary · Room 12",
    host: "Ms. Taylor & the class families",
    venue: "Oakwood Elementary · Front office",
    welcome:
      "Small supplies, big possibilities. Help stock our classroom for a creative new term by choosing an item from the wish list.",
    section: "Our classroom wish list",
    instructions:
      "Each place is one pack or box. Label your delivery Room 12 and drop it at the front office.",
    slots: [
      slot("Drawing paper · one ream", 5, "White, letter-size paper for everyday projects."),
      slot("Colored pencils · one pack", 6, "A standard pack of 12 colors is perfect."),
      slot("Glue sticks · four-pack", 8, "Washable glue sticks for our art table."),
      slot("Tissues · two boxes", 6, "Soft tissues help keep our classroom comfortable."),
    ],
    question: "Which day would you like to drop off your supplies?",
    startTime: "08:00",
    endTime: "15:00",
    multiple: true,
  },
  team: {
    themeId: "game-day",
    group: "Oakwood Athletics",
    host: "Coach Jordan & the team families",
    venue: "Oakwood Sports Park · Field 2",
    welcome:
      "Keep our team ready for a great day together. Choose a snack, supply, or sideline role and we will take care of the rest.",
    section: "Support the team",
    instructions: "Plan for 16 players. Bring team supplies to the sideline table before warm-up.",
    slots: [
      slot("Fresh fruit for the team", 2, "Bring washed fruit in individual portions."),
      slot("After-game snacks", 2, "Choose individually wrapped, nut-free snacks."),
      slot("Water & cooler", 2, "Bring chilled water and a cooler for the sideline."),
      slot("Equipment & sideline tidy-up", 3, "Help gather cones, balls, and team supplies."),
    ],
    question: "What will you bring, or which sideline role would you like?",
    startTime: "10:00",
    endTime: "12:00",
    multiple: true,
  },
  workshop: {
    themeId: "clean-clear",
    group: "Oakwood Learning Studio",
    host: "Taylor Bennett",
    venue: "Oakwood Learning Studio · Workshop room",
    welcome:
      "Make room for something new. Join a small, friendly session with practical ideas, time to try them, and plenty of room for questions.",
    section: "Choose your session",
    instructions: "Reserve one session. All materials are included and beginners are welcome.",
    slots: [
      slot("Morning session · 10:00–11:30", 12, "A relaxed introduction with guided practice."),
      slot("Afternoon session · 1:00–2:30", 12, "The same workshop, at a later time."),
      slot("Welcome desk · 9:45–10:15", 2, "Help greet participants and hand out materials."),
      slot("Materials & room reset", 2, "Help prepare the tables for our next session."),
    ],
    question: "What would you love to learn or try during the workshop?",
    startTime: "10:00",
    endTime: "14:30",
  },
  celebration: {
    themeId: "celebrate-together",
    group: "Friends & Family",
    host: "Jamie & Alex",
    venue: "The Garden House · Courtyard",
    welcome:
      "Good company makes a lovely occasion. Help with one of the little details below, then stay to enjoy the celebration together.",
    section: "Help make it special",
    instructions:
      "Choose something you would enjoy helping with. The hosts will have the table plan ready when you arrive.",
    slots: [
      slot("Flowers & table details", 2, "Arrange simple flowers and set the tables."),
      slot("Drinks & welcome station", 2, "Help pour a welcome drink and greet friends."),
      slot("Dessert table", 3, "Bring a favorite treat with ingredients labeled."),
      slot("Music & finishing touches", 2, "Help set a relaxed mood and tidy up afterward."),
    ],
    question: "What are you planning to bring or help with?",
    startTime: "14:00",
    endTime: "17:00",
    multiple: true,
  },
  donations: {
    themeId: "community-garden",
    group: "Oakwood Neighbors Give",
    host: "Sam Rivera",
    venue: "Oakwood Community Center · Donation desk",
    welcome:
      "Share a little, help a lot. Choose a donation bundle or a sorting role to help get useful supplies to our community pantry.",
    section: "Supplies & helping hands",
    instructions:
      "Bring unopened items within their use-by dates. Each donation place represents one bundle.",
    slots: [
      slot("Canned vegetables · six cans", 12, "Easy-open cans are especially helpful."),
      slot("Pasta & rice · three packs", 10, "Bring sealed, family-size packs."),
      slot("Everyday essentials bundle", 8, "Soap, toothpaste, and other unopened essentials."),
      slot("Sort & pack donations", 6, "Help group items and prepare pantry boxes."),
    ],
    question: "What will be in your donation bundle, or when can you help sort?",
    startTime: "10:00",
    endTime: "14:00",
    multiple: true,
  },
  fundraiser: {
    themeId: "harvest-table",
    group: "Oakwood Community Fund",
    host: "Casey Brooks",
    venue: "Oakwood Hall · Main entrance",
    welcome:
      "Turn a good day out into something good for our neighborhood. Choose a role and help our fundraiser run smoothly from the first welcome to the final tidy-up.",
    section: "Join the event team",
    instructions:
      "No experience needed. Check in with Casey for a quick introduction before your role begins.",
    slots: [
      slot("Welcome & tickets", 4, "Greet visitors and help them get started."),
      slot("Stall & activity helpers", 6, "Support a table and answer visitor questions."),
      slot("Refreshments team", 4, "Keep the drinks and snack table welcoming."),
      slot("Set up & pack down", 6, "Help with tables, signs, and the final tidy-up."),
    ],
    question: "Which part of the event would you most enjoy supporting?",
    startTime: "11:00",
    endTime: "15:00",
    multiple: true,
  },
  meeting: {
    themeId: "clean-clear",
    group: "Oakwood Working Group",
    host: "Jordan Lee",
    venue: "Oakwood Hub · Meeting room B",
    welcome:
      "Bring your ideas and help shape what comes next. Reserve a place or choose a small meeting role so we can make good use of our time together.",
    section: "Places & meeting roles",
    instructions:
      "Choose a place if you are attending, or take a role that includes your seat at the table.",
    slots: [
      slot("A place at the table", 16, "Join the discussion and share your perspective."),
      slot("Welcome & introductions", 1, "Help everyone settle in and get acquainted."),
      slot("Notes & next steps", 1, "Capture decisions and the actions we agree on."),
      slot("Room setup", 2, "Arrive 15 minutes early to arrange the space."),
    ],
    question: "Is there a topic you would like us to include on the agenda?",
    startTime: "18:00",
    endTime: "19:30",
  },
  fitness: {
    themeId: "game-day",
    group: "Oakwood Movement Club",
    host: "Coach Riley",
    venue: "Oakwood Recreation Center · Studio 1",
    welcome:
      "Make a little time to move together. Choose a session that fits your day; a friendly introduction and a comfortable pace are part of the plan.",
    section: "Choose a session",
    instructions:
      "Reserve one session and arrive 10 minutes early. Bring water and comfortable clothing.",
    slots: [
      slot("Early session · 8:00–9:00", 12, "Start the morning with the first group."),
      slot("Mid-morning · 9:30–10:30", 12, "A later start with the same welcoming format."),
      slot("Lunchtime · 12:00–1:00", 12, "Make some room to move in the middle of the day."),
      slot("Afternoon · 2:00–3:00", 12, "Join the final session of the day."),
    ],
    question: "Is this your first visit, and is there anything practical we can help with?",
    startTime: "08:00",
    endTime: "15:00",
  },
  outdoors: {
    themeId: "community-garden",
    group: "Oakwood Outdoor Club",
    host: "Avery & the outing team",
    venue: "Oakwood Nature Center · Welcome shelter",
    welcome:
      "Fresh air is even better with good company. Reserve a place for our next outing or help the group get ready for a relaxed day outdoors.",
    section: "Places for the outing",
    instructions: "Meet at the welcome shelter with water, comfortable shoes, and a light layer.",
    slots: [
      slot("Join the morning group", 12, "Meet at 9:00 for introductions before we set off."),
      slot("Join the afternoon group", 12, "Meet at 1:00 for a second outing together."),
      slot("Welcome & route handouts", 2, "Help the host check everyone in at the shelter."),
      slot("Shared supplies helper", 2, "Help organize the group's water and supplies."),
    ],
    question: "What would help you feel ready for the outing?",
    startTime: "09:00",
    endTime: "15:00",
  },
  creative: {
    themeId: "celebrate-together",
    group: "Oakwood Makers & Friends",
    host: "Rowan Ellis",
    venue: "Oakwood Arts House · Shared studio",
    welcome:
      "Bring a project, a little curiosity, and yourself. There is a seat at the table for beginners, regulars, and anyone ready to make something together.",
    section: "Find your place at the table",
    instructions:
      "Choose a table place or a helping role. Shared basic materials will be ready when you arrive.",
    slots: [
      slot("Morning table · 10:00–12:00", 10, "Settle in with the first group of the day."),
      slot("Afternoon table · 1:00–3:00", 10, "A later session with space to share ideas."),
      slot("Materials table helper", 2, "Help organize the shared tools and supplies."),
      slot("Welcome & studio reset", 2, "Greet newcomers and help leave the tables tidy."),
    ],
    question: "What project or idea are you bringing along?",
    startTime: "10:00",
    endTime: "15:00",
  },
  reading: {
    themeId: "clean-clear",
    group: "Oakwood Readers",
    host: "Ellis Parker",
    venue: "Oakwood Library · Reading room",
    welcome:
      "A good book is even better when we talk about it together. Save a seat for a friendly conversation, fresh perspectives, and a cup of something warm.",
    section: "Seats & small contributions",
    instructions: "Choose a seat or a helping role that includes your place in the discussion.",
    slots: [
      slot("A seat in the reading circle", 14, "Bring your copy and a favorite passage to share."),
      slot("Discussion opener", 1, "Start us off with two or three thoughtful questions."),
      slot("Tea & coffee", 2, "Help set up a small refreshment table."),
      slot("Something to share", 2, "Bring a simple snack with ingredients labeled."),
    ],
    question: "What question or passage would you like to discuss?",
    startTime: "18:00",
    endTime: "19:30",
  },
  games: {
    themeId: "clean-clear",
    group: "Oakwood Games Club",
    host: "Jordan & Casey",
    venue: "Oakwood Hub · Games room",
    welcome:
      "Find a table, meet a few new people, and settle in for a friendly game. First-timers are welcome and we will explain the rules together.",
    section: "Choose your table or role",
    instructions:
      "Pick one table place or a helping role. Bring a favorite game if you would like to share it.",
    slots: [
      slot("Early tables · 5:00–6:30", 16, "Join the first round of friendly games."),
      slot("Later tables · 7:00–8:30", 16, "Settle in for a second round together."),
      slot("Table host", 3, "Welcome players and help explain a game."),
      slot("Snacks & refreshments", 2, "Keep the shared snack table topped up."),
    ],
    question: "Is there a game you would like to play or bring?",
    startTime: "17:00",
    endTime: "20:30",
  },
} satisfies Record<string, DemoProfile>;

type ProfileId = keyof typeof PROFILES;

const EDITORIAL_DEMOS: Record<string, { profile: ProfileId; title: string }> = {
  "clean-clear": { profile: "workshop", title: "A Saturday to Create" },
  "harvest-table": { profile: "potluck", title: "The Neighborhood Potluck" },
  "school-days": { profile: "supplies", title: "Room 12, Ready to Learn" },
  "game-day": { profile: "team", title: "Saturday on the Sidelines" },
  "community-garden": { profile: "volunteers", title: "Good Things Grow Together" },
  "celebrate-together": { profile: "celebration", title: "An Afternoon in the Garden" },
};

function profileFor(id: string, name: string): ProfileId {
  const category = id.split("--")[0];
  const subject = name.toLowerCase();
  if (/food drive|food pantry|donation/.test(subject)) return "donations";
  if (
    /potluck|thanksgiving|friendsgiving|harvest table|team lunch|picnic|feast|fall food/.test(
      subject,
    )
  )
    return "potluck";
  if (/book|reading|bible study/.test(subject)) return "reading";
  if (/gaming|game night/.test(subject)) return "games";
  if (/classroom|sunday school/.test(subject)) return "supplies";
  if (
    /bake sale|car wash|fundrais|charity|auction|raffle|vendor|restaurant night|campaign/.test(
      subject,
    )
  )
    return "fundraiser";
  if (
    /cleanup|clean.up|service project|mission|volunteer sign|environment|senior services|pets|worship/.test(
      subject,
    )
  )
    return "volunteers";
  if (
    /birthday|wedding|shower|anniversary|party|celebration|banquet|holiday|gathering|blessings/.test(
      subject,
    )
  )
    return "celebration";
  if (/workshop|training|conference|tech event/.test(subject)) return "workshop";
  if (
    /fitness|yoga|pilates|spin class|zumba|bootcamp|crossfit|martial arts|boxing|swimming lessons|dance class/.test(
      subject,
    )
  )
    return "fitness";
  if (
    /hiking|climbing|bird watching|fisherman|horseback|travel|drive group|apple picking|pumpkin patch|corn maze|forest/.test(
      subject,
    )
  )
    return "outdoors";
  if (
    /writing|cooking|baking|painting|pottery|knitting|crochet|sewing|quilting|arts|gardening/.test(
      subject,
    )
  )
    return "creative";
  if (
    category === "sports-and-recreation" ||
    /soccer|baseball|basketball|football|tennis|volleyball|golf|cheer|swim team|gymnastics/.test(
      subject,
    )
  )
    return "team";
  if (
    category === "health-and-fitness" ||
    /running|run|cycling|bike|swim club|dance club/.test(subject)
  )
    return "fitness";
  if (
    category === "business-and-professional" ||
    category === "general" ||
    /meeting|open house/.test(subject)
  )
    return "meeting";
  if (category === "fundraising-and-food") return "fundraiser";
  if (category === "fall-and-seasonal" || category === "church-and-community") return "volunteers";
  if (category === "family-and-personal" || category === "parties-and-events") return "celebration";
  return "workshop";
}

export function getSignupDemoContent(template: { id: string; name: string }) {
  const editorial = EDITORIAL_DEMOS[template.id.replace(/^editorial--/, "")];
  const profile: DemoProfile =
    PROFILES[editorial?.profile || profileFor(template.id, template.name)];
  const isAutumn =
    template.id.startsWith("fall-and-seasonal--") || /harvest|potluck/.test(template.id);
  const date = /holiday|thanksgiving|friendsgiving/.test(template.id)
    ? "2028-11-18"
    : isAutumn
      ? "2028-10-14"
      : "2028-09-16";
  return {
    ...profile,
    title: editorial?.title || `${template.name} · Oakwood`,
    location: "125 Maple Lane, Oakwood, IL",
    start: `${date}T${profile.startTime}`,
    end: `${date}T${profile.endTime}`,
    timezone: "America/Chicago",
    arrivalInstructions:
      "Arrive 10 minutes early and look for the welcome table. Your host will help you get settled.",
    parkingInfo:
      "Use the visitor spaces beside the main entrance. Keep the accessible drop-off area clear.",
  };
}
