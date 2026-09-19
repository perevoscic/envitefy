/**
 * Deterministic, synthetic briefs for the Create UX campaign.
 *
 * Exported convention: a scenario is an immutable brief, not a claimed result.
 * `initialFacts` are true until the correction turn; `facts` are the final approved
 * facts. Missing facts are revealed by the answer turn. Workers may answer an
 * assistant's relevant question from these facts, but must not invent new facts.
 * `messages` are user turns in order; only generate/style_edit authorize artwork.
 * `questionChecks` describe behaviors to verify against product evidence, not
 * assumed capability. `category` preserves the requested coverage family even
 * where the product routes it through a broader event type.
 */

export const CAMPAIGN_OUTPUTS = Object.freeze([
  Object.freeze({ id: "live_card", label: "Live Card", request: "live card" }),
  Object.freeze({ id: "digital_flyer", label: "Flyer / Invitation", request: "downloadable flyer or invitation" }),
  Object.freeze({ id: "event_page", label: "Event Page", request: "event page" }),
]);

export const CAMPAIGN_SCORE_DIMENSIONS = Object.freeze([
  "understanding", "factualAccuracy", "usefulQuestions", "qaAccuracy",
  "conversationFlow", "visualFidelity", "usability", "completion",
]);

const family = (id, label, persona, title, details, style, question, expectedBehavior, extra = {}) => ({
  id, label, persona, title, details, style, question, expectedBehavior, ...extra,
});

const families = [
  family("birthday", "Birthday", "mom", "Nora's 7th Birthday", "Nora is turning 7. Please keep the exact lines 'Ready, set, celebrate!' and 'No gifts, please.'", "a joyful rainbow obstacle-course theme, with big readable type", "Can the guests RSVP from the live card, or do I have to message everyone separately?", "Explain the actual RSVP capability of the selected format; do not promise automatic guest messaging.", { age: 7, honoree: "Nora", approvedCopy: ["Ready, set, celebrate!", "No gifts, please."], location: "Maple Community Center, Room A, 100 Example Lane, Austin, TX", correction: ["location", "Maple Community Center, Room B, 100 Example Lane, Austin, TX"] }),
  family("wedding", "Wedding", "general", "Maya and Jordan's Wedding", "The ceremony and reception are at the same venue. Dress code is garden formal. Do not invent a registry or meal choices.", "champagne paper, dark green botanical details, and elegant readable lettering", "Can I keep the ceremony time separate from when the reception starts?", "Explain how multiple times can be shown without replacing the main ceremony time.", { couple: "Maya and Jordan", ceremonyTime: "14:00", receptionTime: "15:00" }),
  family("anniversary", "Anniversary", "general", "Elena and Sam's 25th Anniversary", "This is our 25th wedding anniversary, not a new wedding. Vow renewal is at the main location. Dinner is at Example Garden Room, 200 Example Lane, Austin, TX, at 5 PM.", "warm ivory, copper, and understated botanical details", "Can the page show the vow renewal and dinner as two different locations without mixing up the times?", "Keep the two supplied locations and times distinct and preserve the anniversary milestone.", { anniversaryYears: 25, couple: "Elena and Sam", dinnerLocation: "Example Garden Room, 200 Example Lane, Austin, TX", dinnerTime: "17:00", endTime: "18:30" }),
  family("baby_shower", "Baby Shower", "mom", "A Little Sunshine for Mia", "Please use both exact lines: 'A little sunshine is on the way' and 'Un rayito de sol viene en camino'. No gifts, please. We have not shared the baby's sex.", "sunflowers, warm yellow, and soft blue with readable bilingual text", "Can the flyer keep both English and Spanish wording exactly as I give it?", "Preserve both supplied language lines exactly; do not invent a translation, registry, or baby's sex.", { honoree: "Mia", approvedCopy: ["A little sunshine is on the way", "Un rayito de sol viene en camino", "No gifts, please."] }),
  family("gender_reveal", "Gender Reveal", "mom", "A Surprise for Taylor and Morgan", "We do not know the result yet. The wording should invite people to find out together and must not announce a boy or girl.", "cream with small pink and blue confetti accents", "Will the invite reveal an answer if I have not told you one?", "Confirm missing reveal information stays unknown; do not infer or fabricate the result.", { honorees: ["Taylor", "Morgan"] }),
  family("bridal_shower", "Bridal Shower", "general", "Tea with Emma", "This is Emma's bridal shower. Please mention afternoon tea. There is no registry link to add yet.", "blush florals and porcelain tea details", "Can I leave the registry off and add a real link later?", "Explain editing of available fields without generating a registry URL.", { honoree: "Emma" }),
  family("graduation", "Graduation", "mom", "Leo's Graduation Celebration", "Leo is celebrating finishing his program. Use the exact line 'On to the next adventure'. Please do not invent a school or graduation year.", "navy and gold with modern typography", "Can this celebrate graduation without guessing a school name?", "Keep the school and graduation year absent unless supplied.", { honoree: "Leo", approvedCopy: ["On to the next adventure"] }),
  family("gymnastics", "Gymnastics", "gymnast", "Nora's Fall Gymnastics Meet", "I am competing, not hosting a birthday. Warmup starts at 1 PM, competition starts at 2 PM, and awards are at 4 PM. Please keep those three labels separate.", "deep navy and silver with an artistic gymnastics beam illustration; no football imagery", "Can I show warmup, competition, and awards separately so my family arrives on time?", "Preserve all three schedule entries and distinguish the primary competition time from warmup.", { warmupTime: "13:00", competitionTime: "14:00", awardsTime: "16:00", endTime: "16:30", sport: "artistic gymnastics", athlete: "Nora" }),
  family("game_day", "Game Day", "general", "Neighbors' Game Day Watch Party", "We are watching a game together, not playing a fixture. Bring a snack if you want; do not add a betting pool or ticket price.", "friendly living-room energy with forest green and cream", "Will people understand this is a watch party instead of a team playing at the venue?", "Keep the event a watch party and avoid invented matchups or competition facts."),
  family("football", "Football", "coach", "Cedar Hawks vs. Maple Bears", "This is our youth football game. Cedar Hawks are away and Maple Bears are home. Kickoff is 2 PM. Families should arrive at 1:30 PM. No score or ticket price has been announced.", "navy and silver stadium artwork with readable team names", "Can a downloaded flyer have working RSVP buttons, or would I share a link too?", "Distinguish a static image download from interactive online actions; do not claim image buttons work.", { homeTeam: "Maple Bears", awayTeam: "Cedar Hawks", arrivalTime: "13:30", kickoffTime: "14:00", sport: "football" }),
  family("sport_event", "General Sports", "coach", "Community Multi-Sport Afternoon", "This is a friendly skills afternoon with basketball and soccer stations, not a competitive tournament. Bring water; no experience needed.", "bright teal and coral with simple sport illustrations", "Can I explain the different activity stations without making them separate events?", "Preserve the single event and describe supplied activities without invented brackets or registration places.", { sport: "multi-sport" }),
  family("field_trip", "Field Trip / Field Day", "teacher", "Grade Two Nature Museum Trip", "The bus leaves Example Elementary at 9 AM and returns there at 2:30 PM. The visit is at Example Nature Museum, 300 Example Lane, Austin, TX. Bring a labeled water bottle and packed lunch. Do not publish any children's names.", "friendly nature drawings with forest green and warm cream", "Can parents sign a legally binding permission slip here, or should I link our school's form?", "Explain the actual product capability and avoid claiming legally binding school consent; recommend the school's supplied form when appropriate.", { startTime: "09:00", endTime: "14:30", departureTime: "09:00", returnTime: "14:30", departureLocation: "Example Elementary, 400 Example Lane, Austin, TX", location: "Example Nature Museum, 300 Example Lane, Austin, TX", correction: ["returnTime", "15:00"], privateExclusions: ["children's names", "medical information"] }),
  family("open_house", "Open House", "teacher", "Example Elementary Open House", "Families can meet teachers and see classrooms. This is a school open house, not a property sale. Enter through the main office.", "welcoming school colors, navy and sunny yellow", "Can I say drop in any time during the window instead of assigning everyone an appointment?", "Show the supplied drop-in window without inventing booked appointments."),
  family("housewarming", "Housewarming", "general", "Jordan's New-Home Gathering", "A relaxed housewarming with snacks. No gifts, please. Do not add a door code or claim the street has free parking.", "warm olive, cream, and hand-drawn houseplants", "If I edit the address later, will the shared online version update?", "Describe current online edit behavior accurately and distinguish previously downloaded images.", { honoree: "Jordan" }),
  family("appointment", "Appointment", "general", "Family Portrait Appointment", "This is one confirmed portrait session for the Rivera family. Arrive ten minutes early. This is not a booking form for other customers.", "simple cream and charcoal photography styling", "Does this create a booking in my photographer's calendar automatically?", "Do not claim an external booking or calendar write occurred; explain available calendar actions.", { clientName: "Rivera family", endTime: "15:00" }),
  family("workshop", "Workshop / Class", "teacher", "Beginner Watercolor Workshop", "Adults and teens aged 13 and up can join. Materials are provided. There is no price or capacity confirmed, so leave those out.", "real watercolor washes in teal and ochre with clear typography", "Can I add a price later without you choosing one now?", "Keep unsupplied pricing and capacity blank and explain supported later edits.", { minimumAge: 13 }),
  family("special_event", "Special Event", "general", "Neighborhood Lantern Evening", "This is a community gathering. Keep this safety line exactly: 'Battery-powered lanterns only. Open flames are not allowed.'", "night-sky blue and warm paper-lantern light", "Can you keep the safety instruction visible instead of hiding it in decorative text?", "Retain the explicit safety instruction visibly and do not depict flame lanterns.", { approvedCopy: ["Battery-powered lanterns only. Open flames are not allowed."] }),
  family("general", "General Event", "general", "Maple Neighbors Get-Together", "A casual neighborhood conversation with tea. No theme party, fundraiser, or admission charge is planned.", "a calm botanical design in sage and cream", "Do I need to choose a more specific category, or can this stay a simple gathering?", "Support a general event without forcing or inventing a specific occasion."),
  family("dance", "Dance", "gymnast", "Cedar Dance Studio Showcase", "This is a dance performance, with ballet and contemporary pieces. Performers arrive at 1 PM; audience doors open at 1:30 PM; the show starts at 2 PM.", "plum and soft peach with flowing dance silhouettes", "Can you keep performer arrival separate from when guests should come?", "Distinguish performer arrival, doors, and show time.", { sport: "dance", arrivalTime: "13:00", doorsTime: "13:30" }),
  family("cheerleading", "Cheerleading", "coach", "Cedar Cheer Showcase", "Our cheer squad is performing a showcase, not a football game. Bring water. Spectators should sit in the marked seating area.", "energetic teal and white with cheer pom-poms", "Can this look like cheerleading without changing it into a football event?", "Preserve the cheer activity and supplied event facts.", { sport: "cheerleading" }),
  family("basketball", "Basketball", "coach", "Cedar Hawks Basketball Scrimmage", "Cedar Hawks will scrimmage against Maple Bears. This is a practice scrimmage, not a league final. Wear indoor court shoes.", "burnt orange and navy with a basketball court composition", "Can I mark this as a scrimmage so parents do not mistake it for a league game?", "Retain scrimmage wording and do not invent league standings or scores.", { sport: "basketball", teams: ["Cedar Hawks", "Maple Bears"] }),
  family("baseball", "Baseball", "coach", "Cedar Baseball Skills Clinic", "Players ages 10 to 12 should bring a glove and water. We will practice throwing and fielding; there is no opponent or match score.", "forest green and cream with baseball stitching", "Can I include equipment instructions without creating a fake game opponent?", "Preserve clinic intent, equipment, and age range without invented match facts.", { sport: "baseball", ageRange: "10–12" }),
  family("softball", "Softball", "coach", "Maple Softball Team Practice", "This is softball practice for the Maple Comets. Bring a glove, helmet, and water. Keep softball in the title and artwork.", "purple and white with a yellow softball", "Can you make sure the artwork says softball and uses a yellow ball?", "Respect softball subject and yellow ball without relabeling it baseball.", { sport: "softball", team: "Maple Comets" }),
  family("soccer", "Soccer", "coach", "Cedar Soccer Family Match", "A friendly soccer match for families. Shin guards and water are required. Do not use American football graphics.", "fresh green and white with a soccer pitch", "Can parents add this to their calendars without me connecting their accounts?", "Describe the guest calendar action accurately; never claim automatic writes to guests' calendars.", { sport: "soccer" }),
  family("volleyball", "Volleyball", "coach", "Maple Volleyball Open Practice", "This is indoor volleyball. Wear non-marking shoes and bring knee pads. Do not turn it into a beach tournament.", "coral and navy with an indoor volleyball net", "Can you keep indoor volleyball clear in both the wording and the design?", "Preserve indoor context and required equipment.", { sport: "volleyball" }),
  family("hockey", "Hockey", "coach", "Cedar Ice Hockey Scrimmage", "This is ice hockey. Players need full protective gear. Families should bring a warm layer for the rink.", "icy blue and charcoal with rink lines", "Can you distinguish ice hockey from field hockey?", "Preserve ice rink setting and equipment without field hockey imagery.", { sport: "ice hockey" }),
  family("lacrosse", "Lacrosse", "coach", "Maple Lacrosse Skills Day", "Please use the exact label 'Non-contact skills session'. Bring a lacrosse stick, water, and a mouthguard. Do not advertise contact drills.", "forest green and gold with lacrosse sticks", "Can the non-contact note stay prominent after a redesign?", "Keep the explicit non-contact constraint through artwork edits.", { sport: "lacrosse", approvedCopy: ["Non-contact skills session"] }),
  family("tennis", "Tennis", "coach", "Cedar Beginner Tennis Afternoon", "New players are welcome. Bring a racket and water. We have not assigned court numbers or partners.", "cream and tennis-ball yellow with clean court lines", "Can I leave court assignments off until we know them?", "Do not fabricate court assignments, partners, or tournament brackets.", { sport: "tennis" }),
  family("track_field", "Track and Field", "coach", "Maple Track and Field Practice", "Sprint drills and long-jump technique are planned. Bring running shoes and water. No race results or qualifying times are available.", "navy and orange with track lanes and a long-jump motif", "Can you list both sprint and long jump without guessing race distances?", "Preserve named activities without invented race distances, times, or results.", { sport: "track and field" }),
  family("swimming", "Swimming", "mom", "Cedar Swim Team Family Meet", "Warmup is at 1 PM and the meet starts at 2 PM. Bring goggles, a towel, and water. No lane assignments are available.", "deep blue and aqua with clear swim-lane shapes", "Can warmup and the meet start both appear without guessing lanes?", "Keep warmup distinct and leave lane assignments unspecified.", { sport: "swimming", warmupTime: "13:00" }),
  family("wrestling", "Wrestling", "coach", "Maple Wrestling Technique Session", "This is a supervised technique practice, not a tournament. Bring wrestling shoes and water. No weight classes or brackets are assigned.", "burgundy and silver with wrestling mat circles", "Can this stay a practice announcement without made-up brackets?", "Preserve practice intent and omit unknown weight classes or brackets.", { sport: "wrestling" }),
];

export const CAMPAIGN_FAMILIES = deepFreeze(families.map(({ id, label, persona }) => ({ id, label, persona })));

const pilotIds = [
  "birthday--live_card", "field_trip--event_page", "football--digital_flyer",
  "gymnastics--live_card", "anniversary--event_page", "baby_shower--digital_flyer",
];

const personaNames = { mom: "Priya Rivera", teacher: "Ms. Kim", coach: "Coach Alex", gymnast: "Nora Rivera", general: "Jamie Lee" };

function deepFreeze(value) {
  for (const child of Object.values(value)) {
    if (child && typeof child === "object") deepFreeze(child);
  }
  return Object.freeze(value);
}

function parseReferenceDate(referenceDate) {
  const input = referenceDate instanceof Date ? referenceDate.toISOString().slice(0, 10) : referenceDate;
  if (typeof input !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    throw new TypeError("referenceDate must be a valid YYYY-MM-DD date or Date");
  }
  const date = new Date(`${input}T00:00:00.000Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== input) {
    throw new TypeError("referenceDate must be a valid calendar date");
  }
  return date;
}

function formatTime(time) {
  const [hour, minute] = time.split(":").map(Number);
  return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`;
}

function formatDate(date) {
  return new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }).format(date);
}

/** @returns {ReadonlyArray<object>} All 93 briefs, with the six pilot cases first. */
export function buildCampaignScenarios({ referenceDate = "2026-09-18" } = {}) {
  const baseDate = parseReferenceDate(referenceDate);
  const scenarios = families.flatMap((profile, familyIndex) => {
    const eventDate = new Date(baseDate);
    eventDate.setUTCDate(eventDate.getUTCDate() + 42 + familyIndex * 3);
    const date = eventDate.toISOString().slice(0, 10);
    return CAMPAIGN_OUTPUTS.map((output) => {
      const id = `${profile.id}--${output.id}`;
      const {
        id: category, label: categoryLabel, persona, title, details, style, question,
        expectedBehavior, correction, privateExclusions = [], ...extraFacts
      } = profile;
      const initialFacts = {
        title, date, startTime: "14:00", endTime: "16:00", timezone: "America/Chicago",
        location: "Maple Community Center, Room A, 100 Example Lane, Austin, TX",
        organizer: personaNames[persona], email: `${persona}.${category}@example.invalid`,
        notes: details, ...extraFacts,
      };
      const [field, after] = correction ?? ["location", "Maple Community Center, Room B, 100 Example Lane, Austin, TX"];
      const corrections = [{ field, before: initialFacts[field], after }];
      const facts = { ...initialFacts, [field]: after };
      if (field === "returnTime") {
        facts.endTime = after;
        facts.notes = facts.notes.replace("returns there at 2:30 PM", `returns there at ${formatTime(after)}`);
        corrections.push({ field: "endTime", before: initialFacts.endTime, after });
      }
      const correctionText = field === "returnTime"
        ? `Small correction: the bus returns at ${formatTime(after)}, not ${formatTime(initialFacts.returnTime)}. That is also the end of the trip. The departure time and museum location stay the same.`
        : `One correction: the venue is ${after}, not ${initialFacts.location}. Please keep the other details exactly as we agreed.`;
      const formatChecks = output.id === "digital_flyer"
        ? ["Download exists and preserves the full composition.", "The static download contains all essential logistics and approved wording.", "Do not represent static image controls as interactive."]
        : output.id === "live_card"
          ? ["Live card artwork remains readable with unobscured interactive controls.", "Detail panels and supported RSVP, directions, and calendar actions work."]
          : ["Event page hero, details, navigation, and supported guest actions work.", "Multiple supplied schedule entries and locations remain distinct."];
      const messages = [
        { id: "opening", kind: "opening", text: `Hi, I need a ${output.request} for ${title} (${categoryLabel}). It's ${formatDate(eventDate)} at ${formatTime(initialFacts.startTime)}, ${initialFacts.location}. ${details} I'd like ${style}. Let's confirm the details before making the artwork.` },
        { id: "missing-details", kind: "answer", text: `It ends at ${formatTime(initialFacts.endTime)}. All times are America/Chicago. I'm ${initialFacts.organizer}; the RSVP contact is ${initialFacts.email}. Use only the details I've given you, and leave anything else blank.` },
        { id: "capability-question", kind: "question", text: question.replace("the live card", output.id === "live_card" ? "the live card" : `the ${output.request}`) },
        { id: "factual-correction", kind: "correction", text: correctionText },
        { id: "initial-artwork", kind: "generate", artworkOperation: true, text: `Yes, those are the details. Please create the ${output.request} now, with the correction included. Keep the exact wording I supplied.` },
        { id: "appearance-change", kind: "style_edit", artworkOperation: true, text: `Keep this same event and every approved fact and line of copy. Please make the background darker and the lettering larger with strong contrast; keep the same subject and palette. This is only a visual change, not a new event.` },
      ];
      return {
        id, category, categoryLabel, output: output.id, outputLabel: output.label,
        persona, personaLabel: persona === "general" ? "General user" : persona[0].toUpperCase() + persona.slice(1),
        pilotOrder: pilotIds.includes(id) ? pilotIds.indexOf(id) + 1 : null,
        referenceDate: baseDate.toISOString().slice(0, 10), synthetic: true,
        initialFacts, facts, corrections, missingAtOpening: [...(category === "field_trip" ? [] : ["endTime"]), "timezone", "organizer", "email"],
        messages, questionChecks: [{ messageId: "capability-question", expectedBehavior }],
        requiredExpectations: [
          `Create the requested ${output.label} for the ${categoryLabel} occasion.`,
          "Preserve approved event facts and exact supplied copy through the correction and visual edit.",
          "Ask only useful missing questions; do not repeatedly request known facts.",
          "Keep progress in memory until explicit save or publish.",
          "Save, reload/resume, and publish retain the approved facts and artwork.",
          "Anonymous guest view has no editor controls and works on desktop and mobile.",
          ...formatChecks,
        ],
        exclusions: ["invented dates or venues", "invented prices, capacity, bookings, or registry links", "claims of external messages or bookings that did not occur", ...privateExclusions],
        limits: { maxUserTurns: 14, maxArtworkOperations: 2 },
      };
    });
  });
  scenarios.sort((a, b) => (a.pilotOrder ?? Number.MAX_SAFE_INTEGER) - (b.pilotOrder ?? Number.MAX_SAFE_INTEGER));
  return deepFreeze(scenarios);
}

/** Reorder execution only: keep every frozen brief and prioritize family breadth. */
export function breadthFirstCampaignQueue(scenarios) {
  const selected = scenarios.filter(scenario => scenario.pilotOrder !== null && scenario.pilotOrder !== undefined)
    .sort((a, b) => a.pilotOrder - b.pilotOrder);
  const covered = new Set(selected.map(scenario => scenario.category));
  const outputCounts = new Map(CAMPAIGN_OUTPUTS.map(output => [output.id, selected.filter(scenario => scenario.output === output.id).length]));
  for (const scenario of scenarios) {
    if (covered.has(scenario.category)) continue;
    const choices = scenarios.filter(candidate => candidate.category === scenario.category)
      .sort((a, b) => (outputCounts.get(a.output) || 0) - (outputCounts.get(b.output) || 0));
    const next = choices[0];
    selected.push(next);
    covered.add(next.category);
    outputCounts.set(next.output, (outputCounts.get(next.output) || 0) + 1);
  }
  const ids = new Set(selected.map(scenario => scenario.id));
  return [...selected, ...scenarios.filter(scenario => !ids.has(scenario.id))];
}
