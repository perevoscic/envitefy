#!/usr/bin/env node
// Generate signup template images using OpenRouter (OpenAI: GPT-5 Image Mini)
// Fully explicit per-name prompts. Normalizes to 4:3 with a tiny sharpen.
import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

/* ------------------------------- CLI & Paths ------------------------------ */

const projectRoot = path.resolve(process.cwd());
const rootDir = path.join(projectRoot, "scripts");
const publicDir = path.join(projectRoot, "public");

function getArg(name, fallback = null) {
  const ix = process.argv.findIndex((a) => a === name || a.startsWith(name + "="));
  if (ix === -1) return fallback;
  const val = process.argv[ix].split("=")[1];
  return val ?? fallback;
}

const profile = (getArg("--profile") || getArg("-p") || "default").toString();
const isNana = profile === "nana";

const outputBaseDir = isNana
  ? path.join(publicDir, "nana", "templates", "signup")
  : path.join(publicDir, "templates", "signup");
const catalogPath = path.join(rootDir, "signup-image-catalog.json");
const manifestJsonPath = isNana
  ? path.join(publicDir, "nana", "templates", "signup", "manifest.json")
  : path.join(publicDir, "templates", "signup", "manifest.json");
const manifestTsPath = isNana
  ? path.join(projectRoot, "src", "assets", "signup-templates.nana.ts")
  : path.join(projectRoot, "src", "assets", "signup-templates.ts");

const openrouterApiKey = isNana
  ? process.env.NANA_OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY
  : process.env.OPENROUTER_API_KEY;

if (!openrouterApiKey) {
  console.error(isNana ? "NANA_OPENROUTER_API_KEY or OPENROUTER_API_KEY is not set" : "OPENROUTER_API_KEY is not set");
  process.exit(1);
}

const appReferer = process.env.OPENROUTER_HTTP_REFERER || process.env.PUBLIC_BASE_URL || "https://envitefy.com";
const appTitle = process.env.OPENROUTER_X_TITLE || "Envitefy";
const model = (getArg("--model") || "openai/gpt-5-image-mini").toString();

/* --------------------------------- Utils --------------------------------- */

function slugify(s) {
  return s.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}
async function fileExists(filePath) {
  try { await fs.access(filePath); return true; } catch { return false; }
}
async function sleep(ms) { await new Promise((r) => setTimeout(r, ms)); }

/* ----------------------------- Prompt Database ---------------------------- */

// Common style/tone guards (appended to ALL prompts)
const BASE_STYLE =
  "Modern flat vector illustration, smooth shapes, minimal gradients, clean color blocks, no outlines, no text, 4:3 composition.";
const PEOPLE_RULE =
  "All people (adults and children) must have fully visible heads and faces with no cropping, clear visible eyes and friendly expressions.";
const GUARDRAILS =
  "No typography, no brand logos or IP, not photographic.";

const TONE = {
  "fall-and-seasonal": "Warm autumn palette; soft golden light.",
  "spring": "Fresh pastels, flowering accents, airy light.",
  "summer": "Vibrant cheerful palette, sunny ambience.",
  "school-and-education": "Friendly scholastic tone.",
  "church-and-community": "Welcoming community tone.",
  "sports-and-recreation": "Energetic yet tidy sports tone.",
  "fundraising-and-food": "Inviting communal feel; uncluttered event layout.", // Match folder name
  "family-and-personal": "Cozy celebration tone; relaxed, candid feel.",
  "business-and-professional": "Clean, modern professional tone.",
  "health-and-fitness": "Active, energetic tone; clean modern fitness space.",
  "parties-and-events": "Celebratory, festive tone; party decorations, joyful atmosphere.",
  "clubs-and-groups": "Friendly group activity tone; shared interest, community gathering.",
  "other-special-interest": "Neutral modern styling tailored to subject.",
  "general": "Clean, inclusive tone for organizational and community gatherings."
};

// Per-category, per-name prompts (no heuristics). Keys are `${slug(category)}::${slug(name)}`

// --------------------------- FALL & SEASONAL ---------------------------
const PROMPTS_FALL = {
  "fall-and-seasonal::apple-picking":
    "Outdoor apple orchard activity with neat orchard rows and wood baskets full of apples; adults and kids picking fruit; all people with fully visible heads and faces, no heads cropped; no pumpkins or carving.",
  "fall-and-seasonal::fall-scene":
    "Outdoor autumn landscape only—rolling hills, colorful trees, leaf-strewn path, soft sky gradient; no people or tables.",
  "fall-and-seasonal::fall-fun-2":
    "Outdoor family fun with leaf piles, picnic blankets, gentle string lights at dusk; adults and kids together; all people with fully visible heads and faces, no heads cropped; not a kitchen.",
  "fall-and-seasonal::harvest-table":
    "Outdoor still life on a rustic wooden table—gourds, corn, wheat, lantern and fallen leaves; no people or text.",
  "fall-and-seasonal::pumpkin-patch":
    "Outdoor farm landscape—rows of pumpkins, hay bales, simple farm backdrop; families browsing pumpkins; all people with fully visible heads and faces, no heads cropped.",
  "fall-and-seasonal::fall-forest":
    "Outdoor forest landscape—warm sun through trees, layered depth, leaf carpet; no people.",
  "fall-and-seasonal::fall-food-drive":
    "Community food-drive scene—donation tables with crates of canned goods; adults and kids sorting items; all people with fully visible heads and faces, no heads cropped; no pumpkins or carving.",
  "fall-and-seasonal::fall-gathering":
    "Outdoor picnic gathering—picnic tables, blankets, thermoses, soft string lights; adults and kids chatting; all people with fully visible heads and faces, no heads cropped.",
  "fall-and-seasonal::corn-maze":
    "Outdoor corn maze landscape—tall corn rows with clear pathways; small entry arch shape without text; no people.",
  "fall-and-seasonal::autumn-blessings":
    "Outdoor scenic hills with glowing autumn trees and soft clouds; calm, contemplative; no religious symbols or people.",
  "fall-and-seasonal::thanksgiving-feast":
    "Thanksgiving Feast celebration—shared table with covered dishes, Thanksgiving turkey, Thanksgiving feast meal, harvest décor; families gathered for Thanksgiving Feast; adults and kids; all people with fully visible heads and faces, no heads cropped; no logos or text.",
  "fall-and-seasonal::friendsgiving":
    "Friendsgiving celebration—relaxed dining/picnic vibe with Friendsgiving meal; simple table setting or blankets, lanterns; friends gathered for Friendsgiving; adults and kids together; all people with fully visible heads and faces, no heads cropped; cozy and informal.",
  "fall-and-seasonal::fall-food":
    "Still life of autumn foods—pies, apples, cider jars on wooden trays; no people.",
  "fall-and-seasonal::fall-leaves":
    "Simple outdoor landscape with colorful foliage and drifting leaves over a quiet path; no people.",
  "fall-and-seasonal::fall-y-all":
    "Fall Y'all casual hangout—outdoor casual fall gathering with 'Fall Y'all' theme; quilts on lawn seating, lanterns; adults and kids gathered for Fall Y'all; all people with fully visible heads and faces, no heads cropped; cozy evening fall gathering.",
  "fall-and-seasonal::fall-festival":
    "Fall festival celebration—outdoor fall festival with small fair booths, game-station cues, bunting; families mingling at fall festival; all people with fully visible heads and faces, no heads cropped; no corporate signage.",
  "fall-and-seasonal::fall-pumpkins":
    "Outdoor still life—cluster of pumpkins on hay with fallen leaves; no people or carving tools."
};

// ------------------------------- SPRING -------------------------------
const PROMPTS_SPRING = {
  "spring::spring-hike":
    "Spring hike—outdoor hike with adults and children walking a gentle trail through green hills and wildflowers with a wide scenic view; all people with fully visible heads and faces, no heads cropped; spring hiking activity; not gardening indoors.",
  "spring::easter-bunnies":
    "Easter Bunnies celebration—Easter Bunnies scene with outdoor spring meadow, Easter Bunnies with pastel eggs hidden in grass, simple bunny mascots representing Easter Bunnies, children searching with adults for Easter Bunnies; all people with fully visible heads and faces; Easter Bunnies activity; fresh pastel palette.",
  "spring::mother-s-day":
    "Mother's Day celebration—Mother's Day brunch/tea celebration indoors or patio with flowers and a small gift for Mother's Day; all people with fully visible heads and faces; warm family moment with kids celebrating Mother's Day together.",
  "spring::spring-flowers":
    "Still life—vase of spring flowers against a pastel backdrop; no people.",
  "spring::graduation-caps":
    "Graduation celebration—young adults tossing graduation caps; all people with fully visible heads and faces; simple campus/stage cues; graduation ceremony; no kids baking or holiday décor.",
  "spring::teacher-appreciation":
    "Teacher appreciation event—indoor classroom with teacher at desk receiving flowers and thank-you cards; all people with fully visible heads and faces; a few students smiling; teacher appreciation activity.",
  "spring::spring-break":
    "Spring Break celebration—Spring Break activity with outdoor leisure in park or light beach vibe, kites or frisbee for Spring Break; all people with fully visible heads and faces; relaxed families enjoying Spring Break together.",
  "spring::spring-picnic":
    "Spring picnic—outdoor picnic with blanket, basket, lemonade; all people with fully visible heads and faces; adults and kids together; spring picnic activity.",
  "spring::field-day":
    "Field day event—outdoor school field with cones and relay stations; all people with fully visible heads and faces; children participating, teacher/coach guiding; field day activity.",
  "spring::spring-garden":
    "Spring garden activity—outdoor gardening with raised beds, seedlings, watering can; all people with fully visible heads and faces; adults and kids planting together; spring gardening."
};

// ------------------------------- SUMMER -------------------------------
const PROMPTS_SUMMER = {
  "summer::summer-camp":
    "Outdoor camp—tents or cabins in background, campfire ring or activity field; kids with counselors; all people with fully visible heads and faces, no heads cropped.",
  "summer::beach-day":
    "Outdoor beach—shoreline with gentle waves, umbrellas and towels; families playing; all people with fully visible heads and faces, no heads cropped.",
  "summer::vacation-vibes":
    "Vacation Vibes celebration—Vacation Vibes outdoor travel/leisure scene with boardwalk or overlook, families strolling for Vacation Vibes; all people with fully visible heads and faces, no heads cropped; sunny relaxed Vacation Vibes feel.",
  "summer::family-reunion":
    "Outdoor picnic—long tables or blankets, shared dishes; multi-generational family with kids; all people with fully visible heads and faces, no heads cropped.",
  "summer::picnic-fun":
    "Outdoor picnic—picnic tables, coolers, frisbee or kite; adults and kids; all people with fully visible heads and faces, no heads cropped.",
  "summer::fourth-of-july":
    "Fourth of July celebration—Fourth of July outdoor evening Independence Day celebration with Fourth of July fireworks, small American flags on tables and in hands, clear fireworks in the sky for Fourth of July, string lights, picnic tables; families with kids celebrating Fourth of July; all people with fully visible heads and faces, no heads cropped; no text or brand logos.",
  "summer::ice-cream-social":
    "Outdoor ice-cream stand or cart—kids and adults enjoying cones; all people with fully visible heads and faces, no heads cropped; sunny park.",
  "summer::summer-bbq":
    "Summer BBQ celebration—Summer BBQ outdoor barbecue with grill, picnic tables, lemonade cooler for Summer BBQ; adults and kids at Summer BBQ; all people with fully visible heads and faces, no heads cropped.",
  "summer::lemonade-stand":
    "Outdoor kid-led stand—simple booth with pitcher and cups; children selling with adults nearby; all people with fully visible heads and faces, no heads cropped; fundraiser vibe.",
  "summer::pool-party":
    "Outdoor pool—floaties, towels, umbrellas; kids playing, adults supervising; all people with fully visible heads and faces, no heads cropped."
};

// -------------------------- SCHOOL & EDUCATION --------------------------
const PROMPTS_SCHOOL = {
  "school-and-education::teacher-appreciation":
    "Indoor classroom—teacher receiving flowers/cards from students; all people with fully visible heads and faces, no heads cropped; warm friendly mood.",
  "school-and-education::book-fair":
    "Indoor school book fair—tables of books, simple banners without text; kids browsing; librarian/volunteers; all people with fully visible heads and faces, no heads cropped.",
  "school-and-education::field-trip":
    "Field Trip celebration—Field Trip outdoor educational outing with kids with chaperones at park/forest or museum exterior for Field Trip; all people with fully visible heads and faces, no heads cropped; Field Trip activity with simple sign shapes without text.",
  "school-and-education::back-to-school":
    "School entrance arrival—students with backpacks and parents; all people with fully visible heads and faces, no heads cropped; bright welcoming vibe.",
  "school-and-education::class-party":
    "Indoor classroom celebration—snack and craft tables, balloons/streamers; kids with teacher; all people with fully visible heads and faces, no heads cropped.",
  "school-and-education::open-house":
    "School open house—classroom/hall with display boards (no text), parents and students chatting; all people with fully visible heads and faces, no heads cropped.",
  "school-and-education::parent-teacher-conference":
    "Parent-Teacher Conference celebration—Parent-Teacher Conference quiet meeting with teacher and parent at table, child nearby with book for Parent-Teacher Conference; all people with fully visible heads and faces, no heads cropped; Parent-Teacher Conference calm professional tone.",
  "school-and-education::classroom-helpers":
    "Classroom Helpers celebration—Classroom Helpers activity with students assisting teacher with supplies or bulletin board for Classroom Helpers; all people with fully visible heads and faces, no heads cropped; Classroom Helpers friendly activity.",
  "school-and-education::school-spirit":
    "School spirit scene—students in school-color shirts, pennant shapes with no text, gym/bleachers hint; all people with fully visible heads and faces, no heads cropped.",
  "school-and-education::student-volunteers":
    "Student Volunteers celebration—Student Volunteers volunteer activity with students organizing supplies at tables with an adult supervisor for Student Volunteers; all people with fully visible heads and faces, no heads cropped; Student Volunteers activity.",
};

// ------------------------- CHURCH & COMMUNITY -------------------------
const PROMPTS_CHURCH = {
  "church-and-community::service-project":
    "Community service—volunteers cleaning a park or sorting supplies; all people with fully visible heads and faces, no heads cropped; inclusive group; no logos.",
  "church-and-community::community-picnic":
    "Outdoor picnic—potluck tables, blankets, lawn games; families with kids; all people with fully visible heads and faces, no heads cropped.",
  "church-and-community::bible-study":
    "Bible Study celebration—Bible Study indoor small-group with circle of chairs, open books (no text) for Bible Study, calm friendly Bible Study mood; all people with fully visible heads and faces, no heads cropped.",
  "church-and-community::mission-trip":
    "Mission Trip celebration—Mission Trip outdoor community help with volunteers painting a fence or repairing benches for Mission Trip; all people with fully visible heads and faces, no heads cropped; Mission Trip activity with simple setting; no logos.",
  "church-and-community::church-gathering":
    "Church Gathering celebration—Church Gathering indoor fellowship with coffee and pastry table for Church Gathering; all people with fully visible heads and faces, no heads cropped; warm conversation at Church Gathering; inclusive.",
  "church-and-community::volunteer-sign-up":
    "Volunteer Sign-Up celebration—Volunteer Sign-Up table with clipboards and bins (no text) for Volunteer Sign-Up; friendly mix of ages at Volunteer Sign-Up; all people with fully visible heads and faces, no heads cropped; Volunteer Sign-Up approachable activity.",
  "church-and-community::worship-team":
    "Worship Team celebration—Worship Team indoor rehearsal with microphones and music stands (no text), simple stage lighting for Worship Team; friendly faces at Worship Team; all people with fully visible heads and faces, no heads cropped; Worship Team activity.",
  "church-and-community::sunday-school":
    "Sunday School celebration—Sunday School children's class with kids at craft or story circle with teacher for Sunday School; all people with fully visible heads and faces, no heads cropped; Sunday School welcoming room.",
  "church-and-community::fundraiser":
    "Community fundraiser—donation table and jars/boxes (no text); friendly volunteers including kids; all people with fully visible heads and faces, no heads cropped.",
  "church-and-community::food-drive":
    "Food Drive celebration—Food Drive donation activity with adults and kids sorting canned goods at tables for Food Drive; all people with fully visible heads and faces, no heads cropped; Food Drive activity with neutral décor."
};

// ------------------------- SPORTS & RECREATION -------------------------
const PROMPTS_SPORTS = {
  "sports-and-recreation::swim-team":
    "Swimming pool with lane lines—swimmers practicing, coach signaling; kids in team suits; all people with fully visible heads and faces, no heads cropped.",
  "sports-and-recreation::cheer-squad":
    "Cheer Squad celebration—Cheer Squad gym or field with cheerleaders in formation with pom-poms for Cheer Squad; smiling faces at Cheer Squad; all people with fully visible heads and faces, no heads cropped; Cheer Squad activity.",
  "sports-and-recreation::track-meet":
    "Track Meet celebration—Track Meet outdoor track with runners at start or mid-race with lane markings for Track Meet; coach nearby at Track Meet; all people with fully visible heads and faces, no heads cropped; Track Meet activity.",
  "sports-and-recreation::baseball-team":
    "Baseball Team celebration—Baseball Team ballfield with pitcher, batter, outfielders for Baseball Team; kids and adults playing together for Baseball Team; all people with fully visible heads and faces, no heads cropped; Baseball Team activity.",
  "sports-and-recreation::sports-banquet":
    "Sports Banquet celebration—Sports Banquet indoor banquet with round tables, trophy centerpiece for Sports Banquet; friendly crowd at Sports Banquet; all people with fully visible heads and faces, no heads cropped; Sports Banquet activity; no text banners.",
  "sports-and-recreation::gymnastics":
    "Gymnastics celebration—Gymnastics gym with mats and balance beam for Gymnastics; children practicing with instructor for Gymnastics; all people with fully visible heads and faces, no heads cropped; Gymnastics activity.",
  "sports-and-recreation::fitness-class":
    "Fitness Class celebration—Fitness Class studio with mixed ages doing light stretches or aerobics on mats for Fitness Class; all people with fully visible heads and faces, no heads cropped; Fitness Class activity with clean minimal room.",
  "sports-and-recreation::soccer-game":
    "Outdoor soccer field—visible goal and ball in play; kids and adults; all people with fully visible heads and faces, no heads cropped; clear sidelines.",
  "sports-and-recreation::basketball-practice":
    "Basketball Practice celebration—Basketball Practice indoor court with kids dribbling with coach supervising for Basketball Practice; all people with fully visible heads and faces, no heads cropped; Basketball Practice activity with friendly energy.",
  "sports-and-recreation::golf-tournament":
    "Golf course—players taking turns on green; include youth alongside adults; all people with fully visible heads and faces, no heads cropped; bright sunny setting."
};

// -------------------- FUNDRAISING & FOOD --------------------
const PROMPTS_FUNDRAISING = {
  "fundraising-and-food::car-wash":
    "Sunny parking-lot fundraiser—kids washing cars with sponges and buckets; all people with fully visible heads and faces, no heads cropped; cheerful water splashes.",
  "fundraising-and-food::bake-sale":
    "Outdoor bake-sale table—cupcakes, cookies, pies; kids and adults selling/buying; all people with fully visible heads and faces, no heads cropped; no readable text on signs.",
  "fundraising-and-food::charity-gala":
    "Elegant indoor gala—round tables, subtle lighting, minimalist stage; friendly adults and teens; all people with fully visible heads and faces, no heads cropped.",
  "fundraising-and-food::restaurant-night":
    "Restaurant fundraiser—families dining together; all people with fully visible heads and faces, no heads cropped; warm community vibe; simple décor; no brand logos.",
  "fundraising-and-food::food-pantry":
    "Assistance event—volunteers sorting canned and boxed food; adults and kids helping; all people with fully visible heads and faces, no heads cropped.",
  "fundraising-and-food::auction-event":
    "Indoor auction—display tables with items; paddle shapes without text; attentive crowd; all people with fully visible heads and faces, no heads cropped.",
  "fundraising-and-food::donation-drive":
    "Community donation—labeled box shapes (no text), volunteers placing items; kids assisting; all people with fully visible heads and faces, no heads cropped.",
  "fundraising-and-food::vendor-fair":
    "Outdoor vendor stalls—handmade crafts and baked goods; families browsing; all people with fully visible heads and faces, no heads cropped; no text on signs.",
  "fundraising-and-food::raffle":
    "Raffle celebration—Raffle fundraiser booth with ticket box and strips (no text), balloons for Raffle; kids helping with adults at Raffle; all people with fully visible heads and faces, no heads cropped; Raffle activity.",
  "fundraising-and-food::potluck-dinner":
    "Potluck Dinner celebration—Potluck Dinner community potluck with buffet-style dishes and friendly conversation for Potluck Dinner; families including kids at Potluck Dinner; all people with fully visible heads and faces, no heads cropped; Potluck Dinner activity.",
};

// ------------------------ FAMILY & PERSONAL ------------------------
const PROMPTS_FAMILY = {
  "family-and-personal::anniversary-celebration":
    "Anniversary Celebration celebration—Anniversary Celebration with cake on table, candles/lanterns, warm romantic tone for Anniversary Celebration; adults with family present at Anniversary Celebration; all people with fully visible heads and faces, no heads cropped; Anniversary Celebration activity.",
  "family-and-personal::family-event":
    "Family Event celebration—Family Event general family gathering with casual seating, snacks, simple crafts or games for Family Event; mix of ages at Family Event; all people with fully visible heads and faces, no heads cropped; Family Event activity.",
  "family-and-personal::housewarming":
    "Housewarming celebration—Housewarming home gathering with entry with boxes or plants, snacks on counter for Housewarming; smiling guests at Housewarming; all people with fully visible heads and faces, no heads cropped; Housewarming activity.",
  "family-and-personal::birthday-party":
    "Birthday party—balloons, confetti, cake; kids and adults; all people with fully visible heads and faces, no heads cropped; no character IP.",
  "family-and-personal::block-party":
    "Block Party celebration—Block Party outdoor neighborhood party with string lights across street, food tables for Block Party; families mingling at Block Party; all people with fully visible heads and faces, no heads cropped; Block Party activity.",
  "family-and-personal::wedding":
    "Wedding ceremony—arch or floral backdrop; guests seated; all people with fully visible heads and faces, no heads cropped; elegant but minimal.",
  "family-and-personal::baby-shower":
    "Baby shower—pastel decorations, gifts table, light snacks; joyful family and friends; all people with fully visible heads and faces, no heads cropped.",
  "family-and-personal::game-night":
    "Indoor casual game night—tabletop games with snacks; family and friends smiling; all people with fully visible heads and faces, no heads cropped.",
  "family-and-personal::bridal-shower":
    "Bridal shower—florals, gifts table, refreshments; friends gathered; all people with fully visible heads and faces, no heads cropped.",
  "family-and-personal::family-holiday":
    "Neutral seasonal family gathering—cozy décor, snacks, simple garlands; mix of ages; all people with fully visible heads and faces, no heads cropped."
};

// ------------------- BUSINESS & PROFESSIONAL -------------------
const PROMPTS_BUSINESS = {
  "business-and-professional::conference-schedule":
    "Conference Schedule celebration—Conference Schedule venue hall with registration desk, signage shapes without text, attendees conversing for Conference Schedule; all people with fully visible heads and faces, no heads cropped; Conference Schedule activity.",
  "business-and-professional::client-meeting":
    "Client meeting—small table with laptops/tablets (blank screens), friendly discussion; all people with fully visible heads and faces, no heads cropped; modern space.",
  "business-and-professional::team-lunch":
    "Team lunch—long table with takeout trays and drinks; friendly team chat; all people with fully visible heads and faces, no heads cropped.",
  "business-and-professional::corporate-event":
    "Corporate Event celebration—Corporate Event company social with branded-color accents (no logos), high-tops, mingling attendees at Corporate Event; all people with fully visible heads and faces, no heads cropped; Corporate Event activity.",
  "business-and-professional::workshop":
    "Hands-on workshop—tables with laptops (blank), sticky-note shapes (no text), facilitator guiding; all people with fully visible heads and faces, no heads cropped.",
  "business-and-professional::networking-night":
    "Networking Night celebration—Networking Night evening mixer with string lights, name-tag shapes (no text), handshake moments for Networking Night; all people with fully visible heads and faces, no heads cropped; Networking Night activity.",
  "business-and-professional::professional-gathering":
    "Professional Gathering celebration—Professional Gathering mixer with clean décor, coffee station for Professional Gathering; friendly conversations at Professional Gathering; all people with fully visible heads and faces, no heads cropped; Professional Gathering activity.",
  "business-and-professional::office-meeting":
    "Office Meeting celebration—Office Meeting in conference room with whiteboard shapes (no text), laptops (blank screens) for Office Meeting; collaborative energy at Office Meeting; all people with fully visible heads and faces, no heads cropped; Office Meeting activity.",
  "business-and-professional::training-session":
    "Training session—rows of seats with laptops (blank), instructor at front; all people with fully visible heads and faces, no heads cropped; minimal visuals."
};

// ---------------------- OTHER / SPECIAL INTEREST ----------------------
const PROMPTS_OTHER = {
  "other-special-interest::tech-event":
    "Tech Event celebration—Tech Event meetup with screens with abstract UI shapes (no readable text), demo tables, attendees chatting for Tech Event; all people with fully visible heads and faces, no heads cropped; Tech Event activity.",
  "other-special-interest::political-campaign":
    "Political Campaign celebration—Political Campaign neutral civic event with podium or lawn-sign shapes with no text, volunteers handing flyers for Political Campaign; inclusive crowd at Political Campaign; all people with fully visible heads and faces, no heads cropped; Political Campaign activity; strictly nonpartisan.",
  "other-special-interest::gaming-tournament":
    "Gaming Tournament celebration—Gaming Tournament esports vibe with big screen with abstract game graphics (no IP), players at stations, audience cheering for Gaming Tournament; all people with fully visible heads and faces, no heads cropped; Gaming Tournament activity.",
  "other-special-interest::environment-and-cleanup":
    "Environment and Cleanup celebration—Environment and Cleanup park cleanup with volunteers with grabbers and bags for Environment and Cleanup; piles of leaves; kids helping at Environment and Cleanup; all people with fully visible heads and faces, no heads cropped; Environment and Cleanup activity; bright natural light.",
  "other-special-interest::senior-services":
    "Senior Services celebration—Senior Services community assistance with friendly staff helping seniors with blank forms/resources for Senior Services; all people with fully visible heads and faces, no heads cropped; Senior Services activity; warm approachable room.",
  "other-special-interest::travel-group":
    "Travel Group celebration—Travel Group tour meetup with guide with flag shape, group with backpacks for Travel Group; all people with fully visible heads and faces, no heads cropped; Travel Group activity; city or nature backdrop.",
  "other-special-interest::real-estate-open-house":
    "Real Estate Open House celebration—Real Estate Open House open house with entry table with brochures (no text), staged living room, smiling agent with visitors for Real Estate Open House; all people with fully visible heads and faces, no heads cropped; Real Estate Open House activity.",
  "other-special-interest::arts-and-culture":
    "Arts and Culture celebration—Arts and Culture community arts fair with easels or craft tables, small stage for Arts and Culture; families browsing at Arts and Culture; all people with fully visible heads and faces, no heads cropped; Arts and Culture activity; no text banners.",
  "other-special-interest::pets-and-animals":
    "Pets and Animals celebration—Pets and Animals pet adoption/community pet day with volunteers with leashes/carriers, families greeting pets for Pets and Animals; all people with fully visible heads and faces, no heads cropped; Pets and Animals activity; outdoor or indoor shelter vibe.",
};

// ------------------------- HEALTH & FITNESS -------------------------
const PROMPTS_HEALTH_FITNESS = {
  "health-and-fitness::fitness-class":
    "Fitness Class celebration—Fitness Class indoor fitness studio with mixed ages doing light stretches or aerobics on mats for Fitness Class; clean minimal room; friendly instructor guiding for Fitness Class; all people with fully visible heads and faces, no heads cropped; Fitness Class activity.",
  "health-and-fitness::yoga-class":
    "Indoor yoga studio—mats arranged in rows, people in yoga poses; calm peaceful atmosphere; instructor at front; all people with fully visible heads and faces, no heads cropped.",
  "health-and-fitness::pilates-class":
    "Pilates studio—reformers or mats, participants with instructor; focused workout session; clean modern space; all people with fully visible heads and faces, no heads cropped.",
  "health-and-fitness::spin-class":
    "Indoor cycling studio—stationary bikes in rows, participants cycling; energetic instructor at front; bright motivational atmosphere; all people with fully visible heads and faces, no heads cropped.",
  "health-and-fitness::zumba-class":
    "Dance fitness class—participants following energetic instructor, upbeat music vibe; diverse group; fun active mood; all people with fully visible heads and faces, no heads cropped.",
  "health-and-fitness::bootcamp-class":
    "Outdoor bootcamp—participants doing exercises in park or field; trainer leading group; energetic workout session; all people with fully visible heads and faces, no heads cropped.",
  "health-and-fitness::dance-class":
    "Dance studio—mirrored walls, participants learning choreography; dance instructor teaching; friendly artistic atmosphere; all people with fully visible heads and faces, no heads cropped.",
  "health-and-fitness::morning-run":
    "Outdoor morning run—runners on park trail or sidewalk; early light; mixed group including kids and adults; all people with fully visible heads and faces, no heads cropped.",
  "health-and-fitness::cycling-club":
    "Outdoor cycling group—cyclists with bikes on path or road; cycling gear; friendly group ride atmosphere; all people with fully visible heads and faces, no heads cropped.",
  "health-and-fitness::crossfit-session":
    "CrossFit gym—equipment visible (bars, weights, boxes); participants doing high-intensity exercises; coach supervising; energetic vibe; all people with fully visible heads and faces, no heads cropped.",
  "health-and-fitness::martial-arts-class":
    "Martial arts dojo—participants in uniform practicing moves; instructor demonstrating; respectful disciplined atmosphere; all people with fully visible heads and faces, no heads cropped.",
  "health-and-fitness::boxing-class":
    "Boxing gym—punching bags and gloves; participants training with coach; focused workout session; energetic atmosphere; all people with fully visible heads and faces, no heads cropped.",
  "health-and-fitness::swimming-lessons":
    "Swimming pool—swim lanes visible; instructor teaching kids or adults; swimming aids visible; clean aquatic facility; all people with fully visible heads and faces, no heads cropped.",
  "health-and-fitness::tennis-club":
    "Tennis courts—players on courts with rackets; nets and court lines visible; friendly competitive atmosphere; outdoor or indoor facility; all people with fully visible heads and faces, no heads cropped.",
  "health-and-fitness::basketball-league":
    "Basketball court—players shooting or dribbling; hoops and court markings visible; league game atmosphere; indoor or outdoor court; all people with fully visible heads and faces, no heads cropped.",
  "health-and-fitness::volleyball-league":
    "Volleyball court—net visible, players in position; volleyball in play; league match atmosphere; sand or indoor court; all people with fully visible heads and faces, no heads cropped.",
  "health-and-fitness::wellness-workshop":
    "Wellness workshop—participants seated in circle or rows; instructor presenting; calm educational atmosphere; wellness-focused setting; all people with fully visible heads and faces, no heads cropped."
};

// ------------------------- PARTIES & EVENTS -------------------------
const PROMPTS_PARTIES = {
  "parties-and-events::birthday-party":
    "Indoor or outdoor birthday party—birthday cake with candles on table, colorful balloons, wrapped presents, party decorations like streamers or banners; kids and adults celebrating; all people with fully visible heads and faces, no heads cropped; festive birthday atmosphere; NOT a park walk or family outing.",
  "parties-and-events::wedding":
    "Wedding ceremony or reception—wedding arch or floral backdrop, bride and groom, guests seated or mingling; elegant decorations; indoor or outdoor wedding venue; sophisticated celebration atmosphere; all people with fully visible heads and faces, no heads cropped.",
  "parties-and-events::baby-shower":
    "Baby shower celebration—pastel decorations, baby-themed decorations, gifts table with wrapped presents, baby items visible; expectant parents with family and friends; all people with fully visible heads and faces, no heads cropped; joyful anticipation atmosphere.",
  "parties-and-events::game-night":
    "Indoor casual game night—tabletop games and board games on table; friends and family playing together; snacks and drinks visible; cozy social gathering atmosphere; all people with fully visible heads and faces, no heads cropped.",
  "parties-and-events::bridal-shower":
    "Bridal shower celebration—floral decorations, gifts table with wrapped presents, elegant party setup; bride-to-be with friends; all people with fully visible heads and faces, no heads cropped; feminine celebration atmosphere.",
  "parties-and-events::family-holiday":
    "Family holiday gathering—holiday decorations like garlands or festive table settings; extended family together; all people with fully visible heads and faces, no heads cropped; seasonal celebration atmosphere; cozy warm feeling.",
  "parties-and-events::holiday-party":
    "Holiday party—holiday decorations like lights, garlands, or themed decorations; party attendees mingling; all people with fully visible heads and faces, no heads cropped; festive holiday atmosphere; indoor or outdoor celebration.",
  "parties-and-events::graduation-party":
    "Graduation celebration—graduation caps visible, decorated party area, congratulations decorations; graduate with family and friends; all people with fully visible heads and faces, no heads cropped; achievement celebration atmosphere.",
  "parties-and-events::retirement-party":
    "Retirement celebration—party decorations, congratulations cards or banners, cake; retiree with colleagues or family; all people with fully visible heads and faces, no heads cropped; milestone celebration atmosphere.",
  "parties-and-events::engagement-party":
    "Engagement party—celebration decorations, engagement ring visible or suggested, party setup; engaged couple with family and friends; all people with fully visible heads and faces, no heads cropped; romantic celebration atmosphere."
};

// -------------------------------- GENERAL --------------------------------
const PROMPTS_GENERAL = {
  "general::hoa-meeting":
    "Community HOA meeting—adults seated around a conference table with papers and coffee mugs, calm discussion, bright neutral room; all people with fully visible heads and faces, no heads cropped; not corporate branding.",
  "general::ad-hoc-meeting":
    "Small spontaneous meeting—few people gathered around a laptop or whiteboard, casual environment; all people with fully visible heads and faces, no heads cropped; friendly tone.",
  "general::board-meeting":
    "Formal board meeting—conference table, papers and tablets, attentive participants; all people with fully visible heads and faces, no heads cropped; modern professional space.",
  "general::team-planning-session":
    "Team planning session—table with open notebooks and sticky-note shapes (no text), engaged teammates collaborating; all people with fully visible heads and faces, no heads cropped.",
  "general::volunteer-orientation":
    "Volunteer orientation—community-center room, facilitator speaking to mixed group with pamphlets (no text), inclusive vibe; all people with fully visible heads and faces, no heads cropped.",
  "general::town-hall-meeting":
    "Town hall meeting—open hall or gym, rows of chairs, speaker addressing audience, welcoming civic tone; all people with fully visible heads and faces, no heads cropped.",
  "general::community-discussion":
    "Community discussion circle—diverse adults seated in a casual semicircle, warm conversational mood; all people with fully visible heads and faces, no heads cropped; no branding.",
  "general::staff-training":
    "Staff training—classroom or office setup with instructor and participants taking notes; all people with fully visible heads and faces, no heads cropped; friendly learning tone.",
  "general::committee-meeting":
    "Committee meeting—small conference setup, laptops and papers, group collaboration; all people with fully visible heads and faces, no heads cropped; calm neutral setting.",
  "general::monthly-meetup":
    "Casual monthly meetup—people mingling in a lounge or café, light refreshments, friendly connections; all people with fully visible heads and faces, no heads cropped.",
  "general::project-kickoff":
    "Project kickoff—enthusiastic small group reviewing plans on screen or whiteboard; all people with fully visible heads and faces, no heads cropped; collaborative team energy.",
  "general::workshop-registration":
    "Workshop registration—table with clipboards or laptops (no text), participants checking in or signing up; all people with fully visible heads and faces, no heads cropped; organized welcoming tone."
};

// -------------------------------- CLUBS & GROUPS --------------------------------
const PROMPTS_CLUBS_GROUPS = {
  "clubs-and-groups::baseball-club":
    "Clubs & Groups category, Baseball Club activity—baseball club practice session with players wearing baseball uniforms, baseball gloves, bats, and helmets; pitcher on mound throwing baseball or batter at home plate; baseball diamond field with four bases (first, second, third, home), pitcher's mound, and infield clearly visible; team members in dugout and fielders positioned; outdoor baseball field with outfield fence; all people with fully visible heads and faces; baseball club team activity; NOT soccer, football, softball, or other sports.",
  "clubs-and-groups::basketball-club":
    "Clubs & Groups category, Basketball Club activity—basketball club practice session with players wearing basketball jerseys dribbling or shooting basketballs; basketball hoops with nets mounted on backboards clearly visible; polished indoor basketball court with three-point arc, free-throw line, key area, and center circle; players practicing layups, jump shots, or free throws; basketball club team activity; all people with fully visible heads and faces; NOT volleyball, tennis, or other sports.",
  "clubs-and-groups::bike-club":
    "Clubs & Groups category, Bike Club activity—bike club group ride with cyclists riding bicycles wearing helmets and cycling gear; multiple bicycles visible; cyclists riding together in formation on road or trail; cycling club organized group ride outing; scenic route with cyclists; all people with fully visible heads and faces; bike club cycling activity; NOT running, walking, motorcycling, or other activities.",
  "clubs-and-groups::bird-watching-group":
    "Clubs & Groups category, Bird Watching Group activity—bird watching group outing with people holding binoculars and bird field guides, observing birds in natural habitat; group members pointing toward birds or looking through binoculars; forest, marsh, wetland, or park setting; bird watching activity with spotting scopes or cameras; nature observation club; all people with fully visible heads and faces; bird watching group activity; NOT hiking, fishing, wildlife photography, or other outdoor activities.",
  "clubs-and-groups::book-club":
    "Clubs & Groups category, Book Club activity—book club meeting with group of adults seated around table or in circle, each person holding open books; diverse participants actively discussing literature; multiple books stacked on table; cozy indoor setting like library, living room, or cafe; all people with fully visible heads and faces, no heads cropped; book club discussion session; NOT reading group silent reading or writing group.",
  "clubs-and-groups::cheerleading-club":
    "Clubs & Groups category, Cheerleading Club activity—cheerleading club practice with cheerleaders wearing uniforms holding pom-poms, performing stunts, jumps, or cheers; pyramid formations or group routines; gymnasium or outdoor athletic field; cheerleading squad practicing coordinated cheers; athletic cheerleading club activity; all people with fully visible heads and faces; NOT dance class, gymnastics, or fitness class.",
  "clubs-and-groups::cooking-group":
    "Clubs & Groups category, Cooking Group activity—cooking group meeting with people wearing aprons actively cooking in kitchen; participants chopping vegetables on cutting boards, stirring pots on stove, or preparing ingredients; fresh ingredients, vegetables, herbs, and cooking utensils visible; group cooking together collaboratively; cooking club meeting in commercial or home kitchen; all people with fully visible heads and faces; culinary group cooking savory dishes; NOT baking group with desserts.",
  "clubs-and-groups::crocheting-group":
    "Clubs & Groups category, Crocheting Group activity—crocheting group meeting with people crocheting using yarn and crochet hooks; half-finished crochet projects visible like blankets, scarves, hats, or amigurumi; colorful yarn balls and skeins on table; crocheters working together in cozy setting; crocheting club activity; all people with fully visible heads and faces; NOT knitting group with knitting needles or sewing group.",
  "clubs-and-groups::dance-club":
    "Clubs & Groups category, Dance Club activity—dance club rehearsal with dancers practicing choreography in dance studio; mirrored walls and hardwood dance floor clearly visible; dancers in dance attire performing dance moves or routines; dance club practice session; artistic dance studio atmosphere; all people with fully visible heads and faces; NOT cheerleading, fitness class, or aerobics.",
  "clubs-and-groups::drive-group":
    "Clubs & Groups category, Drive Group activity—drive group car meetup with classic cars, sports cars, or unique vehicles parked together; car enthusiasts admiring and discussing vehicles; scenic location like overlook, parking lot, or car show venue; automotive club gathering with multiple diverse cars; car club meetup; all people with fully visible heads and faces; NOT family road trip or single vehicle.",
  "clubs-and-groups::fisherman-group":
    "Clubs & Groups category, Fisherman Group activity—fisherman group fishing trip with people holding fishing rods and tackle boxes; participants fishing from pier, riverbank, boat, or dock; fishing gear including rods, reels, tackle boxes, and bait visible; calm water with fishing activity; fishing club organized outing; all people with fully visible heads and faces; outdoor fishing group activity; NOT bird watching, hiking, or boating.",
  "clubs-and-groups::football-club":
    "Clubs & Groups category, Football Club activity—football club practice with players wearing football uniforms including helmets, shoulder pads, and football; players in offensive or defensive formation or running plays; American football field with yard markers, goal lines, and goalposts clearly visible; football team practicing drills; all people with fully visible heads and faces; American football club activity; NOT soccer, rugby, or baseball.",
  "clubs-and-groups::gardening-group":
    "Clubs & Groups category, Gardening Group activity—gardening group in community garden with people using gardening tools like trowels, watering cans, gloves, and shovels tending plants; raised garden beds with vegetables, flowers, or herbs visible; gardeners planting seeds, watering plants, or harvesting produce; community garden setting with organized plots; gardening club activity; all people with fully visible heads and faces; NOT landscaping work or nature walk.",
  "clubs-and-groups::golf-club":
    "Clubs & Groups category, Golf Club activity—golf club on golf course with golfers wearing golf attire swinging golf clubs; golf course setting with putting green, fairway, rough, and flagstick visible; golf cart or golf bag with clubs nearby; golf club organized activity; outdoor golf course setting; all people with fully visible heads and faces; NOT tennis, mini-golf, or other sports.",
  "clubs-and-groups::hiking-club":
    "Clubs & Groups category, Hiking Club activity—hiking club on trail with group of hikers wearing backpacks and hiking boots on mountain or forest trail; hiking poles and outdoor gear visible; scenic natural landscape with trail path; hikers walking together on trail; hiking club organized outing; all people with fully visible heads and faces; NOT running club, casual walk, or mountaineering.",
  "clubs-and-groups::horseback-riding-group":
    "Clubs & Groups category, Horseback Riding Group activity—horseback riding group on trail with riders on horses wearing equestrian gear and helmets; horses trotting or walking on trail; scenic outdoor setting like trail or open field; horseback riding club organized trail ride; equestrian activity; all people with fully visible heads and faces; NOT other outdoor activities without horses.",
  "clubs-and-groups::knitting-group":
    "Clubs & Groups category, Knitting Group activity—knitting group meeting with people knitting using yarn and knitting needles; knitted projects in progress like sweaters, scarves, socks, or hats visible; colorful yarn balls and knitting needles on table; knitters working together in cozy setting; knitting club activity; all people with fully visible heads and faces; NOT crocheting with hooks or sewing.",
  "clubs-and-groups::painting-group":
    "Clubs & Groups category, Painting Group activity—painting group in art studio with artists at easels painting on canvases using paint brushes and palettes; paint tubes, brushes, and water containers visible; colorful paints on palettes; painting club members creating artwork; art studio with multiple easels; artistic painting activity; all people with fully visible heads and faces; NOT pottery, drawing, or sculpture.",
  "clubs-and-groups::pottery-group":
    "Clubs & Groups category, Pottery Group activity—pottery group in ceramic studio with people working with clay on pottery wheels or hand-building pottery; pottery wheels spinning with clay on them; clay, pottery tools, and finished ceramic pieces like bowls or vases visible; pottery club members creating pottery; ceramic studio with kilns in background; all people with fully visible heads and faces; pottery making activity; NOT painting or sculpture.",
  "clubs-and-groups::quilting-group":
    "Clubs & Groups category, Quilting Group activity—quilting group meeting with quilters working on quilts using fabric squares and quilting tools; sewing machines and colorful fabric pieces visible; quilt patterns, batting, and quilt frames visible; quilting club members piecing together quilt blocks; textile art quilting activity; all people with fully visible heads and faces; NOT sewing garments or crafting.",
  "clubs-and-groups::reading-group":
    "Clubs & Groups category, Reading Group activity—reading group session with people individually reading books silently or quietly discussing; books open on laps, tables, or held in hands; quiet reading atmosphere; reading group members with books; cozy library or reading room setting; all people with fully visible heads and faces; reading club activity; NOT book club discussion or writing group.",
  "clubs-and-groups::rock-climbing-club":
    "Clubs & Groups category, Rock Climbing Club activity—rock climbing club at indoor gym with climbers wearing harnesses and climbing shoes on colorful indoor climbing wall; climbing ropes, carabiners, and safety equipment visible; multiple climbers on different climbing routes; rock climbing gym with various wall features like holds and overhangs; all people with fully visible heads and faces; indoor rock climbing club activity; NOT outdoor hiking or bouldering.",
  "clubs-and-groups::running-club":
    "Clubs & Groups category, Running Club activity—running club group run with runners in athletic gear running together on path or track; running shoes and running attire including shorts and shirts visible; group of runners jogging together; running club organized group run; outdoor running activity on trail or track; all people with fully visible heads and faces; NOT walking, cycling, or other activities.",
  "clubs-and-groups::sewing-group":
    "Clubs & Groups category, Sewing Group activity—sewing group in craft room with people at sewing machines or hand-sewing fabric; fabric pieces, patterns, and sewing supplies like thread and scissors visible; sewing machines with fabric being sewn; sewing club members creating garments or crafts; textile sewing activity; all people with fully visible heads and faces; NOT quilting or embroidery.",
  "clubs-and-groups::soccer-club":
    "Clubs & Groups category, Soccer Club activity—soccer club practice or game with players wearing soccer jerseys with soccer ball on green field; soccer goals with nets clearly visible at each end of field; players dribbling, passing, or shooting soccer ball; soccer club team activity; outdoor or indoor soccer field with field markings; all people with fully visible heads and faces; NOT football, rugby, or other sports.",
  "clubs-and-groups::swim-club":
    "Clubs & Groups category, Swim Club activity—swim club at pool with swimmers in swimming caps and goggles swimming in pool lanes; swim lanes with lane lines and lane markers clearly visible; swimmers practicing swimming strokes; indoor or outdoor swimming pool facility; swim club training session; aquatic swimming activity; all people with fully visible heads and faces; NOT water polo, diving, or synchronized swimming.",
  "clubs-and-groups::tennis-club":
    "Clubs & Groups category, Tennis Club activity—tennis club on court with tennis players holding rackets hitting tennis balls over net; tennis court with net, baseline, service boxes, and court lines clearly visible; tennis players in action playing or practicing; tennis club match or practice session; outdoor or indoor tennis court facility; all people with fully visible heads and faces; NOT pickleball, badminton, or other racket sports.",
  "clubs-and-groups::volleyball-club":
    "Clubs & Groups category, Volleyball Club activity—volleyball club on court with volleyball players jumping and hitting volleyball over net; volleyball net and court boundaries clearly visible; players in volleyball positions like serving, spiking, or setting; volleyball club practice or game; indoor or sand volleyball court; all people with fully visible heads and faces; NOT basketball, beach volleyball for recreation, or tennis.",
  "clubs-and-groups::writing-group":
    "Clubs & Groups category, Writing Group activity—writing group workshop with writers using notebooks, laptops, or pens writing; writing materials and papers visible; writers working individually or sharing written work; writing club meeting in cafe, library, or writing space; creative writing group activity; all people with fully visible heads and faces; NOT reading group or book club discussion.",
  "clubs-and-groups::baking-group":
    "Clubs & Groups category, Baking Group activity—baking group in kitchen with bakers in aprons mixing dough, decorating cakes, or using oven; baking ingredients like flour, sugar, eggs, and mixing bowls visible; baked goods like cookies, cakes, pastries, or bread visible; baking club activity; kitchen with baking equipment including mixers and baking pans; all people with fully visible heads and faces; NOT cooking group with savory dishes."
};


// Merge all per-name prompts into one lookup
const PROMPTS = {
  ...PROMPTS_FALL,
  ...PROMPTS_SPRING,
  ...PROMPTS_SUMMER,
  ...PROMPTS_SCHOOL,
  ...PROMPTS_CHURCH,
  ...PROMPTS_SPORTS,
  ...PROMPTS_FUNDRAISING,
  ...PROMPTS_FAMILY,
  ...PROMPTS_BUSINESS,
  ...PROMPTS_OTHER,
  ...PROMPTS_HEALTH_FITNESS,
  ...PROMPTS_PARTIES,
  ...PROMPTS_CLUBS_GROUPS,
  ...PROMPTS_GENERAL
};

// Category to folder mapping (matches API route mapping and prompt keys)
const CATEGORY_FOLDER_MAP = {
  "Fall & Seasonal": "fall-and-seasonal",
  "Spring": "spring",
  "Summer": "summer",
  "School & Education": "school-and-education",
  "Church & Community": "church-and-community",
  "Sports & Recreation": "sports-and-recreation",
  "Fundraising & Food": "fundraising-and-food",
  "Family & Personal": "family-and-personal",
  "Business & Professional": "business-and-professional",
  "Health & Fitness": "health-and-fitness",
  "Parties & Events": "parties-and-events",
  "Clubs & Groups": "clubs-and-groups",
  "Other / Special Interest": "other-special-interest",
  "General": "general",
};

// Final builder (explicit lookup; minimal default if a name is missing)
export function buildPrompt(category, name) {
  // Use folder mapping to match prompt keys (some categories have non-standard slugs)
  const folderKey = CATEGORY_FOLDER_MAP[category] || slugify(category);
  const nameKey = slugify(name);
  const key = `${folderKey}::${nameKey}`;

  // Validate prompt exists
  const main = PROMPTS[key];
  if (!main) {
    console.warn(
      `⚠️  WARNING: No specific prompt found for "${category}" → "${name}" (key: ${key}). Using generic fallback.`
    );
  } else {
    // Validate prompt mentions the item name (case-insensitive)
    const nameLower = name.toLowerCase();
    const promptLower = main.toLowerCase();
    const nameWords = nameLower.split(/\s+/).filter((w) => w.length > 2); // Ignore short words like "a", "an", "of"
    const hasNameMatch = nameWords.some((word) => promptLower.includes(word));

    if (!hasNameMatch) {
      console.warn(
        `⚠️  WARNING: Prompt for "${name}" doesn't seem to mention the item name. Prompt: "${main.substring(0, 60)}..."`
      );
    }
  }

  const tone = TONE[folderKey] || TONE[slugify(category)] || TONE["other-special-interest"];
  const common = `${tone} ${BASE_STYLE} ${PEOPLE_RULE} ${GUARDRAILS}`;
  if (main) return `${main} ${common}`.trim();
  return `Outdoor seasonal landscape with simple depth and balanced spacing; no text. ${common}`.trim();
}

/* --------------------- OpenRouter image fetch (robust) --------------------- */

async function fetchImageBufferFromOpenRouter(prompt) {
  const payload = {
    model,
    messages: [{ role: "user", content: prompt }],
    // Let the model choose image; we normalize to 4:3 below
    modalities: ["image", "text"]
  };

  async function oneTry() {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openrouterApiKey}`,
        "HTTP-Referer": appReferer,
        "X-Title": appTitle,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`OpenRouter HTTP ${res.status}: ${text}`);
    }

    const data = await res.json();
    const msg = data?.choices?.[0]?.message ?? {};

    // Try all known locations for image data
    let b64 = msg?.images?.[0]?.b64_json || null;
    let imageUrl = msg?.images?.[0]?.image_url?.url || null;

    if (Array.isArray(msg?.content)) {
      for (const block of msg.content) {
        if (block?.type === "output_image" && block?.image_url?.url) imageUrl = block.image_url.url;
        else if (block?.type === "image" && (block?.b64_json || block?.image_base64)) {
          b64 = block.b64_json || block.image_base64;
        } else if (block?.type === "image_url" && block?.image_url?.url) {
          imageUrl = block.image_url.url;
        } else if (block?.type === "text" && typeof block?.text === "string") {
          const md = block.text.match(/!\[[^\]]*\]\((https?:[^)\s]+)\)/);
          const plain = block.text.match(/https?:\/\/\S+\.(png|jpg|jpeg|webp|gif)/i);
          if (md?.[1]) imageUrl = md[1];
          else if (plain?.[0]) imageUrl = plain[0];
          const dataUrl = block.text.match(/data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)/i);
          if (dataUrl?.[2]) b64 = dataUrl[2];
        }
      }
    }

    if (!b64 && !imageUrl && typeof msg?.content === "string") {
      const md = msg.content.match(/!\[[^\]]*\]\((https?:[^)\s]+)\)/);
      const plain = msg.content.match(/https?:\/\/\S+\.(png|jpg|jpeg|webp|gif)/i);
      if (md?.[1]) imageUrl = md[1];
      else if (plain?.[0]) imageUrl = plain[0];
      const dataUrl = msg.content.match(/data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)/i);
      if (dataUrl?.[2]) b64 = dataUrl[2];
    }

    if (!b64 && !imageUrl) {
      console.warn("DEBUG OpenRouter message (no image fields found):",
        JSON.stringify(msg, null, 2).slice(0, 4000)
      );
      throw new Error("No image data returned — OpenRouter response had no image field.");
    }

    if (b64) return Buffer.from(b64, "base64");

    // If URL needs auth (OpenRouter host), include headers
    const needsAuth = /(^https?:\/\/)?(www\.)?openrouter\.ai\//i.test(imageUrl);
    const imgHeaders = needsAuth
      ? { Authorization: `Bearer ${openrouterApiKey}`, "HTTP-Referer": appReferer, "X-Title": appTitle }
      : undefined;

    const imgRes = await fetch(imageUrl, { headers: imgHeaders });
    if (!imgRes.ok) {
      const t = await imgRes.text().catch(() => "");
      throw new Error(`Failed to download image: ${imgRes.status} ${t}`);
    }
    return Buffer.from(await imgRes.arrayBuffer());
  }

  try {
    return await oneTry();
  } catch (e) {
    console.warn("OpenRouter fetch failed, retrying in 15s:", e.message);
    await sleep(15000);
    return await oneTry();
  }
}

/* ----------------------- 4:3 normalize + tiny sharpen ---------------------- */

async function normalizeToFourThreePng(inputBuffer) {
  // 1600x1200 cover fit; lightly sharpen to keep UI-readable edges
  return await sharp(inputBuffer)
    .resize(1600, 1200, { fit: "cover", position: "attention" })
    .sharpen(0.2) // tiny sharpen step
    .png({ compressionLevel: 9 })
    .toBuffer();
}

/* --------------------------------- Runner -------------------------------- */

async function run() {
  const raw = await fs.readFile(catalogPath, "utf8");
  /** @type {Record<string, Array<{name: string; tier: 'free'|'premium'}>>} */
  const catalog = JSON.parse(raw);

  await ensureDir(outputBaseDir);

  /** @type {Record<string, Array<{ name: string; tier: 'free'|'premium'; path: string }>>} */
  const manifest = {};

  for (const [category, items] of Object.entries(catalog)) {
    // Use folder mapping for consistency with API routes (matches prompt keys)
    const categorySlug = CATEGORY_FOLDER_MAP[category] || slugify(category);
    const categoryDir = path.join(outputBaseDir, categorySlug);
    await ensureDir(categoryDir);

    for (const item of items) {
      const nameSlug = slugify(item.name);
      const filename = `${nameSlug}.png`;
      const filePath = path.join(categoryDir, filename);
      const publicPath = isNana
        ? `/nana/templates/signup/${categorySlug}/${filename}`
        : `/templates/signup/${categorySlug}/${filename}`;

      if (!(await fileExists(filePath))) {
        const prompt = buildPrompt(category, item.name);
        console.log(
          "Generating:",
          isNana ? "[nana]" : "[default]",
          "-",
          category,
          "-",
          item.name,
          `(${categorySlug}/${filename})`
        );

        let rawBuf;
        try {
          rawBuf = await fetchImageBufferFromOpenRouter(prompt);
        } catch (e) {
          console.warn("OpenRouter failed:", e?.message || String(e), "- waiting 20s then retrying...");
          await sleep(20000);
          rawBuf = await fetchImageBufferFromOpenRouter(prompt);
        }

        const finalBuf = await normalizeToFourThreePng(rawBuf);
        await fs.writeFile(filePath, finalBuf);
        console.log(`✓ Generated: ${publicPath}`);
      } else {
        console.log("Exists, skipping:", category, "-", item.name, `(${categorySlug}/${filename})`);
      }

      if (!manifest[category]) manifest[category] = [];
      manifest[category].push({ name: item.name, tier: item.tier, path: publicPath });
    }
  }

  await ensureDir(path.dirname(manifestJsonPath));
  await fs.writeFile(manifestJsonPath, JSON.stringify(manifest, null, 2));

  const tsLines = [];
  tsLines.push("// Auto-generated by scripts/generate-signup-templates-openrouter.mjs");
  tsLines.push("export type SignupTemplateItem = { name: string; tier: 'free'|'premium'; path: string };");
  tsLines.push("export type SignupTemplateManifest = Record<string, SignupTemplateItem[]>;");
  tsLines.push("export const SIGNUP_TEMPLATES: SignupTemplateManifest = ");
  tsLines.push(JSON.stringify(manifest, null, 2));
  tsLines.push(";");

  await ensureDir(path.dirname(manifestTsPath));
  await fs.writeFile(manifestTsPath, tsLines.join("\n"));

  console.log("\nWrote manifest: ", manifestJsonPath);
  console.log("Wrote TS export: ", manifestTsPath);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

