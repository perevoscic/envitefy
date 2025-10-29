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
  "All people (adults and children) must have clear visible eyes and friendly expressions.";
const GUARDRAILS =
  "No typography, no brand logos or IP, not photographic.";

const TONE = {
  "fall-and-seasonal": "Warm autumn palette; soft golden light.",
  "winter-and-holidays": "Crisp winter palette (soft whites, deep greens); subtle festive sparkle.",
  "spring": "Fresh pastels, flowering accents, airy light.",
  "summer": "Vibrant cheerful palette, sunny ambience.",
  "school-and-education": "Friendly scholastic tone.",
  "church-and-community": "Welcoming community tone.",
  "sports-and-recreation": "Energetic yet tidy sports tone.",
  "fundraising-food-and-events": "Inviting communal feel; uncluttered event layout.",
  "family-and-personal": "Cozy celebration tone; relaxed, candid feel.",
  "business-and-professional": "Clean, modern professional tone.",
  "other-special-interest": "Neutral modern styling tailored to subject.",
  "general": "Clean, inclusive tone for organizational and community gatherings."
};

// Per-category, per-name prompts (no heuristics). Keys are `${slug(category)}::${slug(name)}`

// --------------------------- FALL & SEASONAL ---------------------------
const PROMPTS_FALL = {
  "fall-and-seasonal::apple-picking":
    "Outdoor apple orchard activity with neat orchard rows and wood baskets full of apples; adults and kids picking fruit; no pumpkins or carving.",
  "fall-and-seasonal::fall-scene":
    "Outdoor autumn landscape only—rolling hills, colorful trees, leaf-strewn path, soft sky gradient; no people or tables.",
  "fall-and-seasonal::fall-fun-2":
    "Outdoor family fun with leaf piles, picnic blankets, gentle string lights at dusk; adults and kids together; not a kitchen.",
  "fall-and-seasonal::harvest-table":
    "Outdoor still life on a rustic wooden table—gourds, corn, wheat, lantern and fallen leaves; no people or text.",
  "fall-and-seasonal::pumpkin-patch":
    "Outdoor farm landscape—rows of pumpkins, hay bales, simple farm backdrop; families browsing pumpkins.",
  "fall-and-seasonal::fall-forest":
    "Outdoor forest landscape—warm sun through trees, layered depth, leaf carpet; no people.",
  "fall-and-seasonal::fall-food-drive":
    "Community food-drive scene—donation tables with crates of canned goods; adults and kids sorting items; no pumpkins or carving.",
  "fall-and-seasonal::fall-gathering":
    "Outdoor picnic gathering—picnic tables, blankets, thermoses, soft string lights; adults and kids chatting.",
  "fall-and-seasonal::corn-maze":
    "Outdoor corn maze landscape—tall corn rows with clear pathways; small entry arch shape without text; no people.",
  "fall-and-seasonal::autumn-blessings":
    "Outdoor scenic hills with glowing autumn trees and soft clouds; calm, contemplative; no religious symbols or people.",
  "fall-and-seasonal::thanksgiving-feast":
    "Casual group meal—shared table with covered dishes and harvest décor; adults and kids; no logos or text.",
  "fall-and-seasonal::friendsgiving":
    "Relaxed dining/picnic vibe—simple table setting or blankets, lanterns; adults and kids together; cozy and informal.",
  "fall-and-seasonal::fall-food":
    "Still life of autumn foods—pies, apples, cider jars on wooden trays; no people.",
  "fall-and-seasonal::fall-leaves":
    "Simple outdoor landscape with colorful foliage and drifting leaves over a quiet path; no people.",
  "fall-and-seasonal::fall-y-all":
    "Outdoor casual hangout—quilts on lawn seating, lanterns; adults and kids; cozy evening.",
  "fall-and-seasonal::fall-festival":
    "Outdoor small fair—little booths, game-station cues, bunting; families mingling; no corporate signage.",
  "fall-and-seasonal::fall-pumpkins":
    "Outdoor still life—cluster of pumpkins on hay with fallen leaves; no people or carving tools."
};

// --------------------------- WINTER & HOLIDAYS ---------------------------
const PROMPTS_WINTER = {
  "winter-and-holidays::winter-cabin":
    "Outdoor winter landscape—cozy cabin with window glow, snow-dusted pines, distant mountains; no people.",
  "winter-and-holidays::santa-s-workshop":
    "Indoor toy workshop—cheerful stylized elves (simple pointed hats) with a few kids at toy benches; wooden toys and gift-wrap rolls; not a living room.",
  "winter-and-holidays::ugly-sweater-party":
    "Indoor cozy party—adults and kids in bold patterned sweaters, cocoa mugs, warm string lights.",
  "winter-and-holidays::gingerbread-fun":
    "Indoor decorating table—gingerbread houses, icing bags, candy bowls; kids decorating with adults; not tree-decorating.",
  "winter-and-holidays::holiday-lights":
    "Outdoor evening street—glowing string lights and decorated houses, gentle snowfall; families strolling.",
  "winter-and-holidays::winter-wonderland":
    "Outdoor sparkling snowy landscape—evergreens, frosty sky glow; no people.",
  "winter-and-holidays::christmas-cookies":
    "Indoor kitchen baking—cookie trays and cooling racks, rolling pins, icing and sprinkles; kids decorating cookies with adults; not tree-decorating.",
  "winter-and-holidays::new-year-s-eve":
    "Indoor party—table with confetti and clock; subtle skyline fireworks through window; adults and kids together.",
  "winter-and-holidays::christmas-tree-farm":
    "Outdoor farm rows of pine trees; families with sleds or wagons choosing a tree; simple tree-netting stand.",
  "winter-and-holidays::holiday-giving":
    "Indoor donation/wrapping scene—boxes of toys and coats; volunteers (adults and kids) wrapping together.",
  "winter-and-holidays::christmas-village":
    "Outdoor holiday market—small huts with garlands and wreaths, cocoa stand, warm window glow; families browsing.",
  "winter-and-holidays::hanukkah-celebration":
    "Indoor celebration—menorah with candles, dreidels and gelt on a table; blue and silver accents; adults and kids.",
  "winter-and-holidays::snow-day":
    "Outdoor winter play—adults and kids making a snowman or sledding among evergreens; wide, bright snowy field.",
  "winter-and-holidays::snowflakes":
    "Stylized outdoor winter scene—large decorative snowflakes over a soft gradient sky above snowy trees; no indoor crafts, no people.",
  "winter-and-holidays::merry-christmas":
    "Festive still life—evergreen branches and ornaments with a subtle sparkle; no text and no people."
};

// ------------------------------- SPRING -------------------------------
const PROMPTS_SPRING = {
  "spring::spring-hike":
    "Outdoor hike—adults and children walking a gentle trail through green hills and wildflowers with a wide scenic view; not gardening indoors.",
  "spring::easter-bunnies":
    "Outdoor spring meadow—pastel eggs hidden in grass, simple bunny mascots, children searching with adults; fresh pastel palette.",
  "spring::mother-s-day":
    "Brunch/tea celebration indoors or patio—flowers and a small gift; warm family moment with kids.",
  "spring::spring-flowers":
    "Still life—vase of spring flowers against a pastel backdrop; no people.",
  "spring::graduation-caps":
    "Celebration—young adults tossing caps; simple campus/stage cues; no kids baking or holiday décor.",
  "spring::teacher-appreciation":
    "Indoor classroom—teacher at desk with flowers and thank-you cards; a few students smiling.",
  "spring::spring-break":
    "Outdoor leisure—park or light beach vibe, kites or frisbee, relaxed families.",
  "spring::spring-picnic":
    "Outdoor picnic—blanket, basket, lemonade; adults and kids together.",
  "spring::field-day":
    "Outdoor school field—cones and relay stations; children participating, teacher/coach guiding.",
  "spring::spring-garden":
    "Outdoor gardening—raised beds, seedlings, watering can; adults and kids planting together."
};

// ------------------------------- SUMMER -------------------------------
const PROMPTS_SUMMER = {
  "summer::summer-camp":
    "Outdoor camp—tents or cabins in background, campfire ring or activity field; kids with counselors.",
  "summer::beach-day":
    "Outdoor beach—shoreline with gentle waves, umbrellas and towels; families playing.",
  "summer::vacation-vibes":
    "Outdoor travel/leisure—boardwalk or overlook, families strolling; sunny relaxed feel.",
  "summer::family-reunion":
    "Outdoor picnic—long tables or blankets, shared dishes; multi-generational family with kids.",
  "summer::picnic-fun":
    "Outdoor picnic—picnic tables, coolers, frisbee or kite; adults and kids.",
  "summer::fourth-of-july":
    "Outdoor evening Independence Day celebration—small American flags on tables and in hands, clear fireworks in the sky, string lights, picnic tables; families with kids; no text or brand logos.",
  "summer::ice-cream-social":
    "Outdoor ice-cream stand or cart—kids and adults enjoying cones; sunny park.",
  "summer::summer-bbq":
    "Outdoor barbecue—grill, picnic tables, lemonade cooler; adults and kids.",
  "summer::lemonade-stand":
    "Outdoor kid-led stand—simple booth with pitcher and cups; children selling with adults nearby; fundraiser vibe.",
  "summer::pool-party":
    "Outdoor pool—floaties, towels, umbrellas; kids playing, adults supervising."
};

// -------------------------- SCHOOL & EDUCATION --------------------------
const PROMPTS_SCHOOL = {
  "school-and-education::teacher-appreciation":
    "Indoor classroom—teacher receiving flowers/cards from students; warm friendly mood.",
  "school-and-education::book-fair":
    "Indoor school book fair—tables of books, simple banners without text; kids browsing; librarian/volunteers.",
  "school-and-education::field-trip":
    "Outdoor educational outing—kids with chaperones at park/forest or museum exterior; simple sign shapes without text.",
  "school-and-education::back-to-school":
    "School entrance arrival—students with backpacks and parents; bright welcoming vibe.",
  "school-and-education::class-party":
    "Indoor classroom celebration—snack and craft tables, balloons/streamers; kids with teacher.",
  "school-and-education::open-house":
    "School open house—classroom/hall with display boards (no text), parents and students chatting.",
  "school-and-education::parent-teacher-conference":
    "Quiet meeting—teacher and parent at table, child nearby with book; calm professional tone.",
  "school-and-education::classroom-helpers":
    "Classroom activity—students assisting teacher with supplies or bulletin board; friendly.",
  "school-and-education::school-spirit":
    "School spirit scene—students in school-color shirts, pennant shapes with no text, gym/bleachers hint.",
  "school-and-education::student-volunteers":
    "Volunteer activity—students organizing supplies at tables with an adult supervisor."
};

// ------------------------- CHURCH & COMMUNITY -------------------------
const PROMPTS_CHURCH = {
  "church-and-community::service-project":
    "Community service—volunteers cleaning a park or sorting supplies; inclusive group; no logos.",
  "church-and-community::community-picnic":
    "Outdoor picnic—potluck tables, blankets, lawn games; families with kids.",
  "church-and-community::bible-study":
    "Indoor small-group—circle of chairs, open books (no text), calm friendly mood.",
  "church-and-community::mission-trip":
    "Outdoor community help—volunteers painting a fence or repairing benches; simple setting; no logos.",
  "church-and-community::church-gathering":
    "Indoor fellowship—coffee and pastry table; warm conversation; inclusive.",
  "church-and-community::volunteer-sign-up":
    "Volunteer table—clipboards and bins (no text); friendly mix of ages; approachable.",
  "church-and-community::worship-team":
    "Indoor rehearsal—microphones and music stands (no text), simple stage lighting; friendly faces.",
  "church-and-community::sunday-school":
    "Children’s class—kids at craft or story circle with teacher; welcoming room.",
  "church-and-community::fundraiser":
    "Community fundraiser—donation table and jars/boxes (no text); friendly volunteers including kids.",
  "church-and-community::food-drive":
    "Donation activity—adults and kids sorting canned goods at tables; neutral décor."
};

// ------------------------- SPORTS & RECREATION -------------------------
const PROMPTS_SPORTS = {
  "sports-and-recreation::swim-team":
    "Swimming pool with lane lines—swimmers practicing, coach signaling; kids in team suits.",
  "sports-and-recreation::cheer-squad":
    "Gym or field—cheerleaders in formation with pom-poms; smiling faces; a few younger members.",
  "sports-and-recreation::track-meet":
    "Outdoor track—runners at start or mid-race with lane markings; coach nearby.",
  "sports-and-recreation::baseball-team":
    "Ballfield—pitcher, batter, outfielders; kids and adults playing together.",
  "sports-and-recreation::sports-banquet":
    "Indoor banquet—round tables, trophy centerpiece; friendly crowd; no text banners.",
  "sports-and-recreation::gymnastics":
    "Gym—mats and balance beam; children practicing with instructor.",
  "sports-and-recreation::fitness-class":
    "Studio—mixed ages doing light stretches or aerobics on mats; clean minimal room.",
  "sports-and-recreation::soccer-game":
    "Outdoor soccer field—visible goal and ball in play; kids and adults; clear sidelines.",
  "sports-and-recreation::basketball-practice":
    "Indoor court—kids dribbling with coach supervising; friendly energy.",
  "sports-and-recreation::golf-tournament":
    "Golf course—players taking turns on green; include youth alongside adults; bright sunny setting."
};

// -------------------- FUNDRAISING, FOOD, & EVENTS --------------------
const PROMPTS_FUNDRAISING = {
  "fundraising-food-and-events::car-wash":
    "Sunny parking-lot fundraiser—kids washing cars with sponges and buckets; cheerful water splashes.",
  "fundraising-food-and-events::bake-sale":
    "Outdoor bake-sale table—cupcakes, cookies, pies; kids and adults selling/buying; no readable text on signs.",
  "fundraising-food-and-events::charity-gala":
    "Elegant indoor gala—round tables, subtle lighting, minimalist stage; friendly adults and teens.",
  "fundraising-food-and-events::restaurant-night":
    "Restaurant fundraiser—families dining together; warm community vibe; simple décor; no brand logos.",
  "fundraising-food-and-events::food-pantry":
    "Assistance event—volunteers sorting canned and boxed food; adults and kids helping.",
  "fundraising-food-and-events::auction-event":
    "Indoor auction—display tables with items; paddle shapes without text; attentive crowd.",
  "fundraising-food-and-events::donation-drive":
    "Community donation—labeled box shapes (no text), volunteers placing items; kids assisting.",
  "fundraising-food-and-events::vendor-fair":
    "Outdoor vendor stalls—handmade crafts and baked goods; families browsing; no text on signs.",
  "fundraising-food-and-events::raffle":
    "Fundraiser booth—ticket box and strips (no text), balloons; kids helping with adults.",
  "fundraising-food-and-events::potluck-dinner":
    "Community potluck—buffet-style dishes and friendly conversation; families including kids."
};

// ------------------------ FAMILY & PERSONAL ------------------------
const PROMPTS_FAMILY = {
  "family-and-personal::anniversary-celebration":
    "Celebration—cake on table, candles/lanterns, warm romantic tone; adults with family present.",
  "family-and-personal::family-event":
    "General family gathering—casual seating, snacks, simple crafts or games; mix of ages.",
  "family-and-personal::housewarming":
    "Home gathering—entry with boxes or plants, snacks on counter; smiling guests.",
  "family-and-personal::birthday-party":
    "Birthday party—balloons, confetti, cake; kids and adults; no character IP.",
  "family-and-personal::block-party":
    "Outdoor neighborhood party—string lights across street, food tables; families mingling.",
  "family-and-personal::wedding":
    "Wedding ceremony—arch or floral backdrop; guests seated; elegant but minimal.",
  "family-and-personal::baby-shower":
    "Baby shower—pastel decorations, gifts table, light snacks; joyful family and friends.",
  "family-and-personal::game-night":
    "Indoor casual game night—tabletop games with snacks; family and friends smiling.",
  "family-and-personal::bridal-shower":
    "Bridal shower—florals, gifts table, refreshments; friends gathered.",
  "family-and-personal::family-holiday":
    "Neutral seasonal family gathering—cozy décor, snacks, simple garlands; mix of ages."
};

// ------------------- BUSINESS & PROFESSIONAL -------------------
const PROMPTS_BUSINESS = {
  "business-and-professional::conference-schedule":
    "Conference venue hall—registration desk, signage shapes without text, attendees conversing.",
  "business-and-professional::client-meeting":
    "Client meeting—small table with laptops/tablets (blank screens), friendly discussion; modern space.",
  "business-and-professional::team-lunch":
    "Team lunch—long table with takeout trays and drinks; friendly team chat.",
  "business-and-professional::corporate-event":
    "Company social—branded-color accents (no logos), high-tops, mingling attendees.",
  "business-and-professional::workshop":
    "Hands-on workshop—tables with laptops (blank), sticky-note shapes (no text), facilitator guiding.",
  "business-and-professional::networking-night":
    "Evening mixer—string lights, name-tag shapes (no text), handshake moments.",
  "business-and-professional::professional-gathering":
    "Professional mixer—clean décor, coffee station; friendly conversations.",
  "business-and-professional::office-meeting":
    "Conference room—whiteboard shapes (no text), laptops (blank screens); collaborative energy.",
  "business-and-professional::training-session":
    "Training session—rows of seats with laptops (blank), instructor at front; minimal visuals."
};

// ---------------------- OTHER / SPECIAL INTEREST ----------------------
const PROMPTS_OTHER = {
  "other-special-interest::tech-event":
    "Tech meetup—screens with abstract UI shapes (no readable text), demo tables, attendees chatting.",
  "other-special-interest::political-campaign":
    "Neutral civic event—podium or lawn-sign shapes with no text, volunteers handing flyers; inclusive crowd; strictly nonpartisan.",
  "other-special-interest::gaming-tournament":
    "Esports vibe—big screen with abstract game graphics (no IP), players at stations, audience cheering.",
  "other-special-interest::environment-and-cleanup":
    "Park cleanup—volunteers with grabbers and bags; piles of leaves; kids helping; bright natural light.",
  "other-special-interest::senior-services":
    "Community assistance—friendly staff helping seniors with blank forms/resources; warm approachable room.",
  "other-special-interest::travel-group":
    "Tour meetup—guide with flag shape, group with backpacks; city or nature backdrop.",
  "other-special-interest::real-estate-open-house":
    "Open house—entry table with brochures (no text), staged living room, smiling agent with visitors.",
  "other-special-interest::arts-and-culture":
    "Community arts fair—easels or craft tables, small stage; families browsing; no text banners.",
  "other-special-interest::pets-and-animals":
    "Pet adoption/community pet day—volunteers with leashes/carriers, families greeting pets; outdoor or indoor shelter vibe."
};

// -------------------------------- GENERAL --------------------------------
const PROMPTS_GENERAL = {
  "general::hoa-meeting":
    "Community HOA meeting—adults seated around a conference table with papers and coffee mugs, calm discussion, bright neutral room; not corporate branding.",
  "general::ad-hoc-meeting":
    "Small spontaneous meeting—few people gathered around a laptop or whiteboard, casual environment; friendly tone.",
  "general::board-meeting":
    "Formal board meeting—conference table, papers and tablets, attentive participants; modern professional space.",
  "general::team-planning-session":
    "Team planning session—table with open notebooks and sticky-note shapes (no text), engaged teammates collaborating.",
  "general::volunteer-orientation":
    "Volunteer orientation—community-center room, facilitator speaking to mixed group with pamphlets (no text), inclusive vibe.",
  "general::town-hall-meeting":
    "Town hall meeting—open hall or gym, rows of chairs, speaker addressing audience, welcoming civic tone.",
  "general::community-discussion":
    "Community discussion circle—diverse adults seated in a casual semicircle, warm conversational mood; no branding.",
  "general::staff-training":
    "Staff training—classroom or office setup with instructor and participants taking notes; friendly learning tone.",
  "general::committee-meeting":
    "Committee meeting—small conference setup, laptops and papers, group collaboration; calm neutral setting.",
  "general::monthly-meetup":
    "Casual monthly meetup—people mingling in a lounge or café, light refreshments, friendly connections.",
  "general::project-kickoff":
    "Project kickoff—enthusiastic small group reviewing plans on screen or whiteboard; collaborative team energy.",
  "general::workshop-registration":
    "Workshop registration—table with clipboards or laptops (no text), participants checking in or signing up; organized welcoming tone."
};

// Merge all per-name prompts into one lookup
const PROMPTS = {
  ...PROMPTS_FALL,
  ...PROMPTS_WINTER,
  ...PROMPTS_SPRING,
  ...PROMPTS_SUMMER,
  ...PROMPTS_SCHOOL,
  ...PROMPTS_CHURCH,
  ...PROMPTS_SPORTS,
  ...PROMPTS_FUNDRAISING,
  ...PROMPTS_FAMILY,
  ...PROMPTS_BUSINESS,
  ...PROMPTS_OTHER,
  ...PROMPTS_GENERAL
};

// Final builder (explicit lookup; minimal default if a name is missing)
export function buildPrompt(category, name) {
  const key = `${slugify(category)}::${slugify(name)}`;
  const tone = TONE[slugify(category)] || TONE["other-special-interest"];
  const main = PROMPTS[key];
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
    const categorySlug = slugify(category);
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
        console.log("Generating:", isNana ? "[nana]" : "[default]", "-", category, "-", item.name);

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
      } else {
        console.log("Exists, skipping:", category, "-", item.name);
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

