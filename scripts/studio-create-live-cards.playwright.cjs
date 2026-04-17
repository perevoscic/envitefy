#!/usr/bin/env node

const path = require("path");
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
      "Birthday Person's Name": "Lara Bennett",
      "Age Turning": "7",
      "RSVP Phone or Email": "850-960-1214",
      "Event Date": "2026-05-23",
      "Start Time": "12:00",
      "Location / Address": "AMC Boulevard 10, Franklin, TN",
      "Event description":
        "Join Lara for a polished movie-party birthday with cat-themed treats, popcorn towers, and a private screening feel.",
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
      "Event description":
        "A high-energy home game with student section turnout, gates opening early, and bold matchup graphics.",
    },
    prompt: "friday night football under the lights, blue and gold",
  },
  {
    category: "Wedding",
    fields: {
      "Couple Names": "Ava Collins & James Porter",
      "Event Title": "Our Wedding Weekend",
      "RSVP Phone or Email": "wedding@collinsporter.com",
      "Event Date": "2026-10-10",
      "Start Time": "16:30",
      "Location / Address": "The Conservatory, 125 Garden Terrace, Charleston, SC",
      "Event description":
        "Celebrate an elegant garden ceremony followed by dinner, candlelight, and dancing under the glass atrium.",
    },
    prompt: "elegant garden wedding with white flowers and candles",
  },
  {
    category: "Bridal Shower",
    fields: {
      "Bride's Name": "Madeline Rivers",
      "Hosted By": "Sofia and Chloe",
      "RSVP Phone or Email": "sofia@example.com",
      "Event Date": "2026-08-08",
      "Start Time": "11:00",
      "Location / Address": "Willow House, 44 Magnolia Street, Savannah, GA",
      "Event description":
        "A floral brunch shower with champagne, fresh pastries, and soft garden-party details for Madeline.",
    },
    prompt: "bridal shower garden brunch with blush flowers",
  },
  {
    category: "Baby Shower",
    fields: {
      "Honoree / Parent Name(s)": "Elena Martinez",
      'Baby Name or "Baby of"': "Baby Mateo",
      "RSVP Phone or Email": "elena.shower@example.com",
      "Event Date": "2026-07-19",
      "Start Time": "13:00",
      "Location / Address": "Olive Room, 212 Harbor Avenue, Tampa, FL",
      "Event description":
        "A warm baby shower with florals, gifting tables, soft blue details, and a welcoming family atmosphere.",
    },
    prompt: "baby shower with soft blue balloons and teddy bears",
  },
  {
    category: "Field Trip/Day",
    fields: {
      "Event Title": "Lincoln Memorial Discovery Day",
      "Grade / Class Level": "3rd Grade",
      "RSVP Phone or Email": "mrs.harper@school.org",
      "Event Date": "2026-04-30",
      "Start Time": "08:15",
      "Location / Address": "Lincoln Memorial, 2 Lincoln Memorial Circle NW, Washington, DC",
      "Event description":
        "A school field trip in Washington, DC focused on civic landmarks, history, and a polished class outing at the Lincoln Memorial.",
    },
    prompt:
      "photorealistic school field trip at the Lincoln Memorial in Washington DC, documentary-style, natural student group, civic landmark, realistic lighting",
  },
  {
    category: "Anniversary",
    fields: {
      "Couple Names": "Naomi & Daniel Brooks",
      "Years Celebrating": "25",
      "RSVP Phone or Email": "brooksanniversary@example.com",
      "Event Date": "2026-06-14",
      "Start Time": "18:30",
      "Location / Address": "The Marlowe Room, 17 Crescent Avenue, Chicago, IL",
      "Event description":
        "A silver-anniversary dinner with candlelit toasts, live jazz, and a romantic evening with close friends.",
    },
    prompt: "25th anniversary dinner with candles and roses",
  },
  {
    category: "Housewarming",
    fields: {
      "Host Name(s)": "The Carter Family",
      "RSVP Phone or Email": "hello@carterhome.com",
      "New Address Note":
        "Come tour our new place, enjoy appetizers on the patio, and help us celebrate the move.",
      "Event Date": "2026-05-16",
      "Start Time": "15:00",
      "Location / Address": "58 Cedar Park Drive, Nashville, TN",
      "Event description":
        "A modern open-house gathering with snacks, music, and a relaxed neighborhood welcome.",
    },
    prompt: "modern housewarming party at our new home",
  },
  {
    category: "Custom Invite",
    fields: {
      "Event Title": "Founder Appreciation Night",
      "Main Person / Host / Honoree": "North Shore Creative",
      "RSVP Phone or Email": "events@northshorecreative.com",
      "Event Date": "2026-11-05",
      "Start Time": "18:00",
      "Location / Address": "Pier 9 Loft, 90 Harbor Way, Seattle, WA",
      "Event description":
        "A bespoke appreciation event for collaborators and partners with drinks, short remarks, and gallery-style ambiance.",
    },
    prompt: "founder appreciation night in a modern loft",
  },
];

function parseArgs(argv) {
  const options = {
    baseUrl: DEFAULT_BASE_URL,
    edgeProfileDirectory: null,
    edgeUserDataDir: DEFAULT_EDGE_USER_DATA_DIR,
    headed: false,
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
    if (arg === "--headed") {
      options.headed = true;
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
  --headed                Run with a visible browser window.
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
  const tagName = await control.evaluate((node) => node.tagName.toLowerCase());
  if (tagName === "select") {
    await control.selectOption(String(value));
    return;
  }
  await control.fill(String(value));
}

async function fillFixtureDetails(page, fixture) {
  for (const [label, value] of Object.entries(fixture.fields)) {
    if (label === "Event description") {
      await page.locator("#studio-details-description").fill(String(value));
      continue;
    }
    const control = await fieldControl(page, label);
    await fillControl(control, value);
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
    name: /Save to Library|Save Changes|Saved to Library/i,
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
  const startedAt = Date.now();
  const savedButtons = page.getByRole("button", { name: /^Saved to Library$/i });
  while (Date.now() - startedAt < timeoutMs) {
    const savedButton = await findVisibleEnabledButton(savedButtons);
    if (savedButton) {
      return;
    }
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

async function waitForLibraryCount(page, baseUrl, minimumCount, timeoutMs) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const count = await countLibraryLiveCards(page, baseUrl);
    if (count >= minimumCount) {
      return count;
    }
    await sleep(1500);
  }
  throw new Error(
    `Timed out waiting for the library count to reach ${minimumCount} after ${timeoutMs}ms.`,
  );
}

async function createLiveCard(page, baseUrl, fixture, timeoutMs, expectedLibraryCount) {
  await goToTypeStep(page, baseUrl);
  await clickVisibleEnabledButton(
    page.getByRole("button", { name: `Select ${fixture.category}` }),
    `Could not find a visible selector button for ${fixture.category}.`,
  );
  await page.getByRole("button", { name: /^Details$/i }).first().waitFor({ state: "visible" });
  await clickVisibleEnabledButton(
    page.getByRole("button", { name: /^Details$/i }),
    "Could not find a visible Details step button.",
  );
  await page.locator("#studio-details-description").waitFor({ state: "visible" });
  await fillFixtureDetails(page, fixture);
  await clickVisibleEnabledButton(
    page.getByRole("button", { name: /^Editor$/i }),
    "Could not find a visible Editor step button.",
  );

  const promptBox = page.locator("aside textarea:visible").first();
  await promptBox.waitFor({ state: "visible" });
  await promptBox.fill(fixture.prompt);

  await clickVisibleEnabledButton(
    page.getByRole("button", { name: /Create Live Card|Update Invitation/i }),
    "Could not find a visible live-card generation button.",
  );

  const saveButton = await waitForSaveReady(page, timeoutMs);
  await saveButton.click();
  return waitForLibraryCount(page, baseUrl, expectedLibraryCount, 45000);
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
  const { browser, context, page } = await openStudioPage(options);

  try {
    const email = await ensureAuthenticated(page, options.baseUrl);
    console.log(`Authenticated as ${email}`);

    let libraryCount = await verifyLibrary(page, options.baseUrl);
    console.log(`Library starts with ${libraryCount} live card item(s).`);

    for (const fixture of CATEGORY_FIXTURES) {
      console.log(`Creating ${fixture.category}...`);
      libraryCount = await createLiveCard(
        page,
        options.baseUrl,
        fixture,
        options.timeoutMs,
        libraryCount + 1,
      );
      console.log(`Saved ${fixture.category}. Library now shows ${libraryCount} item(s).`);
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
