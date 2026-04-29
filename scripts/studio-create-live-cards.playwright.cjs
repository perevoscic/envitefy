#!/usr/bin/env node

const fs = require("node:fs/promises");
const path = require("node:path");
const { chromium } = require("playwright");

const DEFAULT_BASE_URL = "http://localhost:3000";
const DEFAULT_TIMEOUT_MS = 240000;
const DEFAULT_EDGE_USER_DATA_DIR = process.env.LOCALAPPDATA
  ? path.join(process.env.LOCALAPPDATA, "Microsoft", "Edge", "User Data")
  : null;

const CATEGORY_FIXTURES = [
  {
    category: "Birthday",
    fields: {
      "Person's Name": "Lara Bennett",
      "Age Turning": "7",
      RSVP: "850-960-1214",
      "Event Date": "2026-05-23",
      "Start Time": "12:00",
      "Location / Address": "AMC Boulevard 10, Franklin, TN",
      "Event description": "Lara's fun movie birthday",
    },
    prompt: "dinosaurs theme at the adventure park",
  },
  {
    category: "Game Day",
    fields: {
      "Event Title": "Friday Night Lights",
      Sport: "Football",
      "Team / Host": "Varsity Panthers",
      Opponent: "Central City Tigers",
      "Event Date": "2026-09-18",
      "Start Time": "19:00",
      "Location / Address": "Panther Stadium, 800 Victory Lane, Austin, TX",
      "Event description": "Big home game tonight",
    },
    prompt: "friday night football under the lights, blue and gold",
  },
  {
    category: "Wedding",
    fields: {
      "Couple Names": "Ava Collins & James Porter",
      "Event Title": "Our Wedding Weekend",
      RSVP: "wedding@collinsporter.com",
      "Event Date": "2026-10-10",
      "Start Time": "16:30",
      "Location / Address": "The Conservatory, 125 Garden Terrace, Charleston, SC",
      "Event description": "Garden wedding with dinner",
    },
    prompt: "elegant garden wedding with white flowers and candles",
  },
  {
    category: "Bridal Shower",
    fields: {
      "Bride's Name": "Madeline Rivers",
      "Hosted By": "Sofia and Chloe",
      RSVP: "sofia@example.com",
      "Event Date": "2026-08-08",
      "Start Time": "11:00",
      "Location / Address": "Willow House, 44 Magnolia Street, Savannah, GA",
      "Event description": "Brunch shower for Madeline",
    },
    prompt: "bridal shower garden brunch with blush flowers",
  },
  {
    category: "Baby Shower",
    fields: {
      "Honoree / Parent Name(s)": "Elena Martinez",
      'Baby Name or "Baby of"': "Baby Mateo",
      RSVP: "elena.shower@example.com",
      "Event Date": "2026-07-19",
      "Start Time": "13:00",
      "Location / Address": "Olive Room, 212 Harbor Avenue, Tampa, FL",
      "Event description": "Baby shower for Elena",
    },
    prompt: "baby shower with soft blue balloons and teddy bears",
  },
  {
    category: "Field Trip/Day",
    fields: {
      "Event Title": "Lincoln Memorial Discovery Day",
      "Grade / Class Level": "3rd Grade",
      RSVP: "mrs.harper@school.org",
      "Event Date": "2026-04-30",
      "Start Time": "08:15",
      "Location / Address": "Lincoln Memorial, 2 Lincoln Memorial Circle NW, Washington, DC",
      "Event description": "Class trip to Lincoln Memorial",
    },
    prompt:
      "photorealistic school field trip at the Lincoln Memorial in Washington DC, documentary-style, natural student group, civic landmark, realistic lighting",
  },
  {
    category: "Anniversary",
    fields: {
      "Couple Names": "Naomi & Daniel Brooks",
      "Years Celebrating": "25",
      RSVP: "brooksanniversary@example.com",
      "Event Date": "2026-06-14",
      "Start Time": "18:30",
      "Location / Address": "The Marlowe Room, 17 Crescent Avenue, Chicago, IL",
      "Event description": "25th anniversary dinner party",
    },
    prompt: "25th anniversary dinner with candles and roses",
  },
  {
    category: "Housewarming",
    fields: {
      "Host Name(s)": "The Carter Family",
      RSVP: "hello@carterhome.com",
      "New Address Note":
        "Come tour our new place, enjoy appetizers on the patio, and help us celebrate the move.",
      "Event Date": "2026-05-16",
      "Start Time": "15:00",
      "Location / Address": "58 Cedar Park Drive, Nashville, TN",
      "Event description": "Come see our new home",
    },
    prompt: "modern housewarming party at our new home",
  },
  {
    category: "Custom Invite",
    fields: {
      "Event Title": "Founder Appreciation Night",
      "Main Person / Host / Honoree": "North Shore Creative",
      RSVP: "events@northshorecreative.com",
      "Event Date": "2026-11-05",
      "Start Time": "18:00",
      "Location / Address": "Pier 9 Loft, 90 Harbor Way, Seattle, WA",
      "Event description": "Thank you night for partners",
    },
    prompt: "founder appreciation night in a modern loft",
  },
];

const OPEN_HOUSE_FIXTURES = [
  {
    category: "Open House",
    id: "open-house-high-meadow",
    fields: {
      "Property Address": "4593 High Meadow Lane, Franklin, TN",
      Price: "$624,000",
      Bedrooms: "4",
      Bathrooms: "3.5",
      "Square Feet": "2,850",
      RSVP: "carla@highmeadowrealty.example",
      "Event Date": "2026-05-03",
      "Start Time": "13:00",
      "Location / Address": "4593 High Meadow Lane, Franklin, TN",
      "Event description":
        "Bright High Meadow family home with renovated chef's kitchen, vaulted great room, finished basement, covered patio, walkable schools, and street parking. Listed by Carla Mira, High Meadow Realty.",
    },
    prompt:
      "premium suburban listing flyer with bright exterior hero photo, crisp specs, polished realtor branding for Carla Mira at High Meadow Realty",
  },
  {
    category: "Open House",
    id: "open-house-riverstone-loft",
    fields: {
      "Property Address": "812 Riverstone Loft #4B, Austin, TX",
      Price: "$875,000",
      Bedrooms: "2",
      Bathrooms: "2",
      "Square Feet": "1,640",
      RSVP: "nina@riverstonecollective.example",
      "Event Date": "2026-05-10",
      "Start Time": "14:00",
      "Location / Address": "812 Riverstone Loft #4B, Austin, TX",
      "Event description":
        "Modern East Riverside city loft with floor-to-ceiling windows, skyline balcony, chef's island, secure garage parking, elevator access, and lobby intercom. Listed by Nina Patel, Riverstone Collective.",
    },
    prompt:
      "modern urban condo open house flyer with luxury editorial layout, skyline energy, clean black-and-white typography for Nina Patel at Riverstone Collective",
  },
  {
    category: "Open House",
    id: "open-house-oak-harbor",
    fields: {
      "Property Address": "27 Oak Harbor Court, Charleston, SC",
      Price: "$1,245,000",
      Bedrooms: "5",
      Bathrooms: "4",
      "Square Feet": "3,980",
      RSVP: "evelyn@harborhearth.example",
      "Event Date": "2026-05-17",
      "Start Time": "11:00",
      "Location / Address": "27 Oak Harbor Court, Charleston, SC",
      "Event description":
        "Oak Harbor coastal luxury residence with coastal kitchen, screened porch, guest suite, three-car garage, mature live oaks, nearby water access, and driveway parking. Listed by Evelyn Ross, Harbor & Hearth Realty.",
    },
    prompt:
      "coastal luxury real-estate flyer with warm sunlight, refined serif typography, premium brokerage polish for Evelyn Ross at Harbor & Hearth Realty",
  },
  {
    category: "Open House",
    id: "open-house-maple-terrace",
    fields: {
      "Property Address": "118 Maple Terrace, Denver, CO",
      Price: "$548,000",
      Bedrooms: "3",
      Bathrooms: "2",
      "Square Feet": "1,925",
      RSVP: "marcus@summitkey.example",
      "Event Date": "2026-05-24",
      "Start Time": "12:30",
      "Location / Address": "118 Maple Terrace, Denver, CO",
      "Event description":
        "Updated Sloan's Lake bungalow with mountain-view deck, finished attic studio, fenced backyard, two-car garage, and front porch check-in. Listed by Marcus Lee, Summit Key Properties.",
    },
    prompt:
      "warm neighborhood bungalow open house poster, approachable but premium, mountain-view lifestyle cues, clean listing facts for Marcus Lee at Summit Key Properties",
  },
];

const OPEN_HOUSE_MORE_FIXTURES = [
  {
    category: "Open House",
    id: "open-house-cypress-glen",
    fields: {
      "Property Address": "640 Cypress Glen Drive, Tampa, FL",
      Price: "$719,000",
      Bedrooms: "4",
      Bathrooms: "3",
      "Square Feet": "2,710",
      RSVP: "olivia@suncoastkey.example",
      "Event Date": "2026-06-07",
      "Start Time": "13:30",
      "Location / Address": "640 Cypress Glen Drive, Tampa, FL",
      "Event description":
        "Cypress Glen pool home with updated kitchen, split-bedroom layout, screened lanai, three-car garage, and neighborhood trail access. Listed by Olivia Grant, Suncoast Key Realty.",
    },
    prompt:
      "bright Florida pool-home open house flyer with polished resort warmth, clean listing facts, and premium Suncoast Key Realty branding",
  },
  {
    category: "Open House",
    id: "open-house-cedar-park-modern",
    fields: {
      "Property Address": "2290 Cedar Park Modern, Seattle, WA",
      Price: "$1,085,000",
      Bedrooms: "3",
      Bathrooms: "2.5",
      "Square Feet": "2,240",
      RSVP: "jamie@northlinehomes.example",
      "Event Date": "2026-06-14",
      "Start Time": "12:00",
      "Location / Address": "2290 Cedar Park Modern, Seattle, WA",
      "Event description":
        "Architect-designed Cedar Park home with clerestory windows, rooftop terrace, EV-ready garage, custom millwork, and lake access nearby. Listed by Jamie Chen, Northline Homes.",
    },
    prompt:
      "Pacific Northwest modern architecture open house poster with editorial photography, restrained typography, rooftop terrace cues, and Northline Homes polish",
  },
  {
    category: "Open House",
    id: "open-house-magnolia-row",
    fields: {
      "Property Address": "516 Magnolia Row, Savannah, GA",
      Price: "$932,000",
      Bedrooms: "4",
      Bathrooms: "4",
      "Square Feet": "3,120",
      RSVP: "bea@magnoliabrokerage.example",
      "Event Date": "2026-06-21",
      "Start Time": "10:30",
      "Location / Address": "516 Magnolia Row, Savannah, GA",
      "Event description":
        "Historic Magnolia Row residence with restored heart pine floors, double verandas, garden courtyard, carriage-house studio, and off-street parking. Listed by Beatrice Cole, Magnolia Brokerage.",
    },
    prompt:
      "historic Savannah open house flyer with elegant veranda architecture, soft garden light, refined serif hierarchy, and premium Magnolia Brokerage styling",
  },
  {
    category: "Open House",
    id: "open-house-desert-ridge",
    fields: {
      "Property Address": "9038 Desert Ridge Vista, Scottsdale, AZ",
      Price: "$1,395,000",
      Bedrooms: "5",
      Bathrooms: "4.5",
      "Square Feet": "4,050",
      RSVP: "mateo@sonoranestate.example",
      "Event Date": "2026-06-28",
      "Start Time": "15:00",
      "Location / Address": "9038 Desert Ridge Vista, Scottsdale, AZ",
      "Event description":
        "Desert Ridge estate with mountain-view great room, chef's kitchen, casita, pool courtyard, fire feature, and gated cul-de-sac setting. Listed by Mateo Ruiz, Sonoran Estate Group.",
    },
    prompt:
      "Scottsdale luxury estate open house flyer with desert sunset architecture, mountain-view pool courtyard, dramatic premium listing composition, and Sonoran Estate Group branding",
  },
];

function parseArgs(argv) {
  const options = {
    baseUrl: DEFAULT_BASE_URL,
    edgeProfileDirectory: null,
    edgeUserDataDir: DEFAULT_EDGE_USER_DATA_DIR,
    fixtureSet: "default",
    headed: false,
    resetProgress: false,
    storageState: null,
    slowMo: 0,
    timeoutMs: DEFAULT_TIMEOUT_MS,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--base-url") {
      options.baseUrl = argv[index + 1] || options.baseUrl;
      index += 1;
      continue;
    }
    if (arg === "--storage-state") {
      options.storageState = argv[index + 1] || null;
      index += 1;
      continue;
    }
    if (arg === "--edge-profile-directory") {
      options.edgeProfileDirectory = argv[index + 1] || null;
      index += 1;
      continue;
    }
    if (arg === "--edge-user-data-dir") {
      options.edgeUserDataDir = argv[index + 1] || null;
      index += 1;
      continue;
    }
    if (arg === "--fixture-set") {
      options.fixtureSet = argv[index + 1] || options.fixtureSet;
      index += 1;
      continue;
    }
    if (arg === "--headed") {
      options.headed = true;
      continue;
    }
    if (arg === "--reset-progress") {
      options.resetProgress = true;
      continue;
    }
    if (arg === "--slow-mo") {
      options.slowMo = Number.parseInt(argv[index + 1] || "0", 10) || 0;
      index += 1;
      continue;
    }
    if (arg === "--timeout-ms") {
      options.timeoutMs = Number.parseInt(argv[index + 1] || `${DEFAULT_TIMEOUT_MS}`, 10) || DEFAULT_TIMEOUT_MS;
      index += 1;
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
  }

  return options;
}

function printHelp() {
  console.log(`
Usage:
  node scripts/studio-create-live-cards.playwright.cjs [options]

Options:
  --base-url <url>        Studio base URL. Default: ${DEFAULT_BASE_URL}
  --storage-state <file>  Playwright storage state JSON for an authenticated Studio session.
  --edge-profile-directory <name>
                          Launch against a local Edge profile directory (for example: "Profile 1").
  --edge-user-data-dir <dir>
                          Edge user data directory. Default: ${DEFAULT_EDGE_USER_DATA_DIR || "not detected"}
  --fixture-set <name>     Fixture set to generate: default, open-house, open-house-more.
                          Default: default.
  --headed                Run with a visible browser window.
  --reset-progress        Ignore saved progress and run a fresh set for this account.
  --slow-mo <ms>          Slow actions for easier observation.
  --timeout-ms <ms>       Per-generation wait timeout. Default: ${DEFAULT_TIMEOUT_MS}
  --help                  Show this message.
`);
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sanitizeSegment(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "default";
}

function getFixtures(fixtureSet) {
  if (fixtureSet === "default") return CATEGORY_FIXTURES;
  if (fixtureSet === "open-house") return OPEN_HOUSE_FIXTURES;
  if (fixtureSet === "open-house-more") return OPEN_HOUSE_MORE_FIXTURES;
  throw new Error(
    `Unknown fixture set "${fixtureSet}". Expected "default", "open-house", or "open-house-more".`,
  );
}

function fixtureKey(fixture) {
  return fixture.id || fixture.category;
}

function buildFixtureSignature(fixtures) {
  return JSON.stringify(
    fixtures.map((fixture) => ({
      category: fixture.category,
      id: fixture.id || null,
      fields: fixture.fields,
      prompt: fixture.prompt,
    })),
  );
}

function getProgressFilePath(email, baseUrl, fixtureSet) {
  const account = sanitizeSegment(email);
  const target = sanitizeSegment(baseUrl.replace(/^https?:\/\//i, ""));
  const suffix = fixtureSet === "default" ? "" : `-${sanitizeSegment(fixtureSet)}`;
  return path.join(
    process.cwd(),
    "qa-artifacts",
    `studio-live-card-progress-${account}-${target}${suffix}.json`,
  );
}

async function loadProgress(progressPath, fixtureSignature, resetProgress) {
  if (resetProgress) {
    await fs.rm(progressPath, { force: true }).catch(() => {});
    return { completedCategories: [] };
  }

  try {
    const raw = await fs.readFile(progressPath, "utf8");
    const parsed = JSON.parse(raw);
    if (parsed?.fixtureSignature !== fixtureSignature) {
      return { completedCategories: [] };
    }
    return {
      completedCategories: Array.isArray(parsed?.completedCategories) ? parsed.completedCategories : [],
    };
  } catch {
    return { completedCategories: [] };
  }
}

async function saveProgress(progressPath, payload) {
  await fs.mkdir(path.dirname(progressPath), { recursive: true });
  await fs.writeFile(progressPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

async function readSession(page, baseUrl) {
  const response = await page.request.get(`${baseUrl}/api/auth/session`);
  if (!response.ok()) {
    throw new Error(`Session check failed with status ${response.status()}.`);
  }
  return response.json();
}

async function ensureAuthenticated(page, baseUrl) {
  const session = await readSession(page, baseUrl);
  const email = session?.user?.email;
  if (!email) {
    throw new Error(
      "Studio generation is auth-gated. Run again with an authenticated Playwright storage state file.",
    );
  }
  return email;
}

async function goToTypeStep(page, baseUrl) {
  await page.goto(`${baseUrl}/studio?view=create&step=type`, {
    waitUntil: "networkidle",
  });
  await page.getByText("What are we celebrating?").waitFor({ state: "visible" });
}

async function fieldControl(page, labelText) {
  const label = page
    .locator("label")
    .filter({ hasText: new RegExp(`^${escapeRegex(labelText)}(?:\\s*\\*)?$`) })
    .first();
  await label.waitFor({ state: "visible" });
  const fieldRoot = label.locator("xpath=..");
  const control = fieldRoot.locator("input, textarea, select").first();
  await control.waitFor({ state: "visible" });
  return control;
}

async function fillControl(control, value) {
  const meta = await control.evaluate((node) => ({
    tag: node.tagName.toLowerCase(),
    type: node.type || "",
    inputMode: node.getAttribute("inputmode") || "",
    maxLength: node.getAttribute("maxlength") || "",
  }));
  if (meta.tag === "select") {
    await control.selectOption(String(value));
    return;
  }
  let next = String(value);
  // Studio renders non-Wedding eventDate as a text input expecting MM/DD
  // (inputmode=numeric, maxlength=5). An ISO YYYY-MM-DD otherwise gets mangled
  // to "20/26" by the normalizer.
  const isMonthDayInput =
    meta.tag === "input" &&
    meta.type === "text" &&
    meta.inputMode === "numeric" &&
    meta.maxLength === "5";
  if (isMonthDayInput) {
    const isoMatch = next.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) next = `${isoMatch[2]}/${isoMatch[3]}`;
  }
  await control.fill(next);
}

async function fillFixtureDetails(page, fixture) {
  for (const [label, value] of Object.entries(fixture.fields)) {
    if (label === "Event description") {
      await page.locator("#studio-event-details").fill(String(value));
      continue;
    }
    try {
      const control = await fieldControl(page, label);
      await fillControl(control, value);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed filling field "${label}" with "${value}": ${message}`);
    }
  }
}

async function findVisibleEnabledButton(locator) {
  const count = await locator.count();
  for (let index = 0; index < count; index += 1) {
    const button = locator.nth(index);
    if ((await button.isVisible()) && (await button.isEnabled())) {
      return button;
    }
  }
  return null;
}

async function clickVisibleEnabledButton(locator, missingMessage) {
  const button = await findVisibleEnabledButton(locator);
  if (!button) {
    throw new Error(missingMessage);
  }
  await button.click();
}

async function waitForSaveReady(page, timeoutMs) {
  const startedAt = Date.now();
  const failureHeading = page.getByText("Generation Failed");
  const saveButtons = page.getByRole("button", {
    name: /^Save to Library$/i,
  });

  while (Date.now() - startedAt < timeoutMs) {
    if ((await failureHeading.count()) > 0) {
      const message = await page.locator("text=Generation Failed").first().textContent();
      throw new Error(message || "Generation failed.");
    }
    const saveButton = await findVisibleEnabledButton(saveButtons);
    if (saveButton) {
      return saveButton;
    }
    await sleep(1000);
  }

  throw new Error(`Timed out waiting for the live card to finish generating after ${timeoutMs}ms.`);
}

async function waitForSavedState(page, timeoutMs) {
  // After saving, the "Save to Library" button stays mounted but becomes disabled.
  const startedAt = Date.now();
  const saveButtons = page.getByRole("button", { name: /^Save to Library$/i });
  while (Date.now() - startedAt < timeoutMs) {
    const count = await saveButtons.count();
    let allDisabled = count > 0;
    for (let i = 0; i < count; i += 1) {
      const button = saveButtons.nth(i);
      if (!(await button.isVisible())) continue;
      if (await button.isEnabled()) {
        allDisabled = false;
        break;
      }
    }
    if (allDisabled) return;
    await sleep(500);
  }
  throw new Error(`Timed out waiting for the library save state after ${timeoutMs}ms.`);
}

async function countLibraryLiveCards(page, baseUrl) {
  await page.goto(`${baseUrl}/studio?view=library`, {
    waitUntil: "networkidle",
  });
  await page.getByText("Library").first().waitFor({ state: "visible" });
  const openButtons = page.getByRole("button", { name: /Open live card/i });
  return openButtons.count();
}

async function createLiveCard(page, baseUrl, fixture, timeoutMs) {
  await goToTypeStep(page, baseUrl);
  await clickVisibleEnabledButton(
    page.getByRole("button", { name: `Select ${fixture.category}` }),
    `Could not find a visible selector button for ${fixture.category}.`,
  );

  await page.locator("#studio-event-details").waitFor({ state: "visible" });
  await fillFixtureDetails(page, fixture);
  await page.locator("#studio-design-idea").fill(fixture.prompt);

  // Diagnostic: report which generation buttons currently exist and snapshot field state.
  const candidateButtons = page.getByRole("button", {
    name: /(Preview|Update|Regenerate)\s+Live\s+Card/i,
  });
  const candidateCount = await candidateButtons.count();
  if (candidateCount === 0) {
    const allButtons = await page.locator("button:visible").allInnerTexts();
    throw new Error(
      `No 'Preview/Update/Regenerate Live Card' button found. Visible buttons: ${JSON.stringify(allButtons)}`,
    );
  }

  const button = await findVisibleEnabledButton(candidateButtons);
  if (!button) {
    const inputSnapshot = await page.evaluate(() => {
      const labelOf = (el) => {
        if (el.id) {
          const lbl = document.querySelector(`label[for="${el.id}"]`);
          if (lbl) return lbl.textContent?.trim();
        }
        const wrap = el.closest("div");
        const sibLabel = wrap?.querySelector("label");
        return sibLabel?.textContent?.trim() || el.name || el.placeholder || el.type;
      };
      return Array.from(document.querySelectorAll("input, textarea, select")).map((el) => ({
        label: labelOf(el),
        type: el.type || el.tagName.toLowerCase(),
        value: el.value,
      }));
    });
    throw new Error(
      `Generation button still disabled (form invalid). Field state:\n${JSON.stringify(inputSnapshot, null, 2)}`,
    );
  }
  await button.click();

  const saveButton = await waitForSaveReady(page, timeoutMs);
  await saveButton.click();
  await waitForSavedState(page, 45000);
  return countLibraryLiveCards(page, baseUrl);
}

async function verifyLibrary(page, baseUrl) {
  return countLibraryLiveCards(page, baseUrl);
}

async function openStudioPage(options) {
  if (options.edgeProfileDirectory) {
    if (!options.edgeUserDataDir) {
      throw new Error("Edge user data directory is not configured.");
    }

    const context = await chromium.launchPersistentContext(options.edgeUserDataDir, {
      channel: "msedge",
      headless: !options.headed,
      slowMo: options.slowMo,
      args: [`--profile-directory=${options.edgeProfileDirectory}`],
    });
    const page = context.pages()[0] || (await context.newPage());
    return { context, page };
  }

  const browser = await chromium.launch({
    headless: !options.headed,
    slowMo: options.slowMo,
  });
  const context = await browser.newContext(
    options.storageState ? { storageState: options.storageState } : undefined,
  );
  const page = await context.newPage();
  return { browser, context, page };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const fixtures = getFixtures(options.fixtureSet);
  const { browser, context, page } = await openStudioPage(options);

  try {
    const email = await ensureAuthenticated(page, options.baseUrl);
    const fixtureSignature = buildFixtureSignature(fixtures);
    const progressPath = getProgressFilePath(email, options.baseUrl, options.fixtureSet);
    const progress = await loadProgress(progressPath, fixtureSignature, options.resetProgress);
    const completedCategories = new Set(progress.completedCategories);
    const pendingFixtures = fixtures.filter((fixture) => !completedCategories.has(fixtureKey(fixture)));

    console.log(`Authenticated as ${email}`);
    console.log(`Fixture set: ${options.fixtureSet}`);
    console.log(`Progress file: ${progressPath}`);

    if (pendingFixtures.length === 0) {
      console.log("This account already completed the current fixture set. Nothing to do.");
      return;
    }

    let libraryCount = await verifyLibrary(page, options.baseUrl);
    console.log(`Library starts with ${libraryCount} live card item(s).`);
    if (completedCategories.size > 0) {
      console.log(`Resuming run. Already completed: ${[...completedCategories].join(", ")}.`);
    }

    for (const fixture of pendingFixtures) {
      const key = fixtureKey(fixture);
      console.log(`Creating ${key}...`);
      libraryCount = await createLiveCard(page, options.baseUrl, fixture, options.timeoutMs);
      completedCategories.add(key);
      await saveProgress(progressPath, {
        email,
        baseUrl: options.baseUrl,
        fixtureSet: options.fixtureSet,
        fixtureSignature,
        completedCategories: [...completedCategories],
        updatedAt: new Date().toISOString(),
      });
      console.log(`Saved ${key}. Library now shows ${libraryCount} item(s).`);
    }

    const count = await verifyLibrary(page, options.baseUrl);
    console.log(`Done. Library currently shows ${count} live card item(s) in the active session.`);
  } finally {
    await context.close();
    if (browser) {
      await browser.close();
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
