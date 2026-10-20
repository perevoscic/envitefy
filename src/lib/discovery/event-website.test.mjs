import assert from "node:assert/strict";
import fs from "node:fs";
import Module from "node:module";
import test from "node:test";
import ts from "typescript";

const filename = new URL("./event-website.ts", import.meta.url);
const loaded = new Module(filename.pathname);
loaded._compile(
  ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText,
  filename.pathname,
);
const {
  collectEventWebsite,
  eventWebsiteLinks,
  websitePublicSections,
  readWebsiteImport,
  isEventCorePage,
  websiteSections,
  websiteImagesForNames,
  websitePhotoUrl,
} = loaded.exports;
const origin = "https://www.meet.test";

test("place photos stay with their named source cards, including lazy images and reordered hotels", () => {
  const page = { url: "https://organizer.example.org/stay", html: `<main><img src="/logo.png" alt="logo"><article><h3>River Hotel</h3><img src="/placeholder.gif" data-src="//cdn.example.org/river.jpg?size=large&amp;quality=90"></article><article><h3>Harbor Suites</h3><img src="/harbor.webp"></article><article><h3>No Photo Inn</h3></article></main>` };
  assert.deepEqual(websiteImagesForNames(page, ["Harbor Suites", "No Photo Inn", "River Hotel"]), [
    { name: "River Hotel", imageUrl: "https://cdn.example.org/river.jpg?size=large&quality=90", sourceUrl: page.url },
    { name: "Harbor Suites", imageUrl: "https://organizer.example.org/harbor.webp", sourceUrl: page.url },
  ]);
  assert.equal(websiteImagesForNames({ ...page, html: '<main><h3>River Hotel</h3><h3>Harbor Suites</h3><img src="/unassigned.jpg"></main>' }, ["River Hotel", "Harbor Suites"]).length, 0);
  assert.deepEqual(websiteImagesForNames({ ...page, html: '<main><article><img src="/suites.jpg"><h3>Spring Suites Airport Hotel</h3></article></main>' }, ["Airport Hotel", "Spring Suites Airport Hotel"]).map(item => item.name), ["Spring Suites Airport Hotel"]);
});

test("place photos support separated CMS columns without assigning a shared page image", () => {
  const page = { url: "https://organizer.example.org/visit", html: '<main><img src="/logo.png" alt="logo"><hr><div><figure><img data-src="/aquarium.jpg"></figure></div><div><h3>City Aquarium</h3><p>Explore the exhibits.</p></div><hr><div><img src="/park.jpg"></div><div><h3>River Park</h3></div></main>' };
  assert.deepEqual(websiteImagesForNames(page, ["River Park", "City Aquarium"]).map(({name,imageUrl}) => [name,imageUrl]), [["City Aquarium","https://organizer.example.org/aquarium.jpg"],["River Park","https://organizer.example.org/park.jpg"]]);
  for (const url of ['javascript:alert(1)', 'data:image/png;base64,abc', 'http://127.0.0.1/a.jpg', 'http://192.168.1.5/a.jpg', 'https://user:pass@cdn.example.org/a.jpg']) assert.equal(websitePhotoUrl(url), null);
});

test("an organizer's parent folder does not classify every linked page as a club list", () => {
  assert.deepEqual(
    websiteSections("Host hotels", "https://organizer.test/clubs/spring-open/stay.html"),
    ["hotels"],
  );
  assert.deepEqual(
    websiteSections("Overview", "https://organizer.test/programs/spring-open/about.html"),
    ["overview"],
  );
  for (const label of ["Program", "Programme", "Timetable", "Agenda"])
    assert.deepEqual(websiteSections(label, "https://organizer.test/running-order"), ["schedule"]);
});
const routes = [
  "/",
  "/overview",
  "/host-hotels",
  "/plan-your-visit",
  "/schedule",
  "/competing-teams",
];
const menu = `<header><nav><a href="/">Home</a><div hidden><a href="/overview">Overview</a><a href="/host-hotels">Host hotels</a><a href="http://meet.test/plan-your-visit">Plan your visit</a></div><a href="/schedule">Schedule</a><a href="/competing-teams">Competing teams</a></nav></header>`;
const bodies = {
  "/": "<h1>2027 Atlanta Centennial Classic</h1><p>January 29-31, 2027</p><h2>Meet location</h2><p>Georgia International Convention Center<br>2000 Convention Center Concourse</p>",
  "/overview":
    "<h1>Meet Overview</h1><p>The 2027 Atlanta Centennial Classic takes place January 29-31, 2027.</p><h2>Spectator fees</h2><p>Adults $20. Registration deadline November 20, 2026.</p>",
  "/host-hotels":
    "<h1>Host hotels</h1><p>Book by January 7, 2027.</p><p>Airport Hotel<br>2091 Hotel Concourse<br>Room rates $194</p>",
  "/plan-your-visit": `<h1>Plan Your Visit</h1><p>For more ideas, visit <a href="https://tourism.test">the tourism bureau</a>.</p><p>Georgia Aquarium<br>Explore the exhibits.</p><p><a href="https://aquarium.test/tickets?offer=meet">Learn more</a></p><figure><figcaption><div class="image-title-wrapper"><div class="image-title"><p>Zoo Atlanta</p></div></div><div class="image-subtitle-wrapper"><div class="image-subtitle"><p>Plan a family visit.</p></div></div><div><a href="https://zoo.test">Learn more</a></div></figcaption></figure>`,
  "/schedule":
    "<h1>Meet Schedule</h1><p>2027 Atlanta Centennial Classic Schedule will be posted here when available</p><p>2027 Girls Schedule - TBD</p><p>2027 Boys Schedule - TBD</p>",
  "/competing-teams":
    "<h1>Competing Teams</h1><h3>2027 Competing Teams (13 states!)</h3><p>Gymnastix Training Center - Buford, GA</p><p>Coastal Gym - Panama City, FL</p><h3>2026 Competing Teams</h3><p>Old Year Gym - Old City, NY</p>",
};
const htmlFor = (path) =>
  `<html><title>Atlanta Centennial Classic</title>${menu}<main>${bodies[path]}</main><footer><a href="/privacy">Privacy</a></footer></html>`;
const fetchPage = async (url) => ({
  text: htmlFor(new URL(url).pathname),
  contentType: "text/html",
});

for (const path of routes)
  test(`one pasted ${path} discovers and maps the same current event sections`, async () => {
    const requested = [];
    const pages = [];
    const result = await collectEventWebsite(`${origin}${path}`, htmlFor(path), {
      fetchPage: async (url) => {
        requested.push(url);
        return fetchPage(url);
      },
      onPage: (page) => pages.push(page),
    });
    assert.equal(result.eventYear, 2027);
    assert.equal(result.sources.length, 6);
    assert.equal(new Set(requested).size, requested.length);
    assert.equal(result.coverage.find((item) => item.section === "schedule").status, "unavailable");
    assert.ok(
      result.coverage
        .filter((item) => item.section !== "schedule")
        .every((item) => item.status === "collected"),
    );
    assert.deepEqual(
      result.participatingClubs.map((item) => item.name),
      ["Gymnastix Training Center", "Coastal Gym"],
    );
    assert.deepEqual(result.attractions.map((item) => item.name).sort(), [
      "Georgia Aquarium",
      "Zoo Atlanta",
    ]);
    assert.ok(
      result.attractions.some((item) => item.url === "https://aquarium.test/tickets?offer=meet"),
    );
    assert.ok(
      pages
        .filter(isEventCorePage)
        .every(
          (page) =>
            !page.sections.some((section) =>
              ["participatingClubs", "attractions", "hotels"].includes(section),
            ),
        ),
    );
    const sections = websitePublicSections(result);
    assert.match(sections.scheduleAvailability.body, /2027 schedule not yet published/);
    assert.ok(sections.participatingClubs.bullets.every((line) => !line.includes("Old Year")));
    assert.equal(readWebsiteImport(JSON.parse(JSON.stringify(result))).version, 1);
  });

test("source failures preserve other sections and differ from an unpublished schedule", async () => {
  const result = await collectEventWebsite(`${origin}/overview`, htmlFor("/overview"), {
    fetchPage: async (url) => {
      if (url.endsWith("host-hotels")) throw new Error("Fetch failed (503)");
      return fetchPage(url);
    },
  });
  assert.equal(result.coverage.find((item) => item.section === "hotels").status, "failed");
  assert.equal(result.coverage.find((item) => item.section === "schedule").status, "unavailable");
  assert.equal(
    result.coverage.find((item) => item.section === "participatingClubs").status,
    "collected",
  );
});

test("page/time limits report pending sources; absent links remain not_found", async () => {
  const result = await collectEventWebsite(`${origin}/overview`, htmlFor("/overview"), {
    maxPages: 2,
    fetchPage,
  });
  assert.equal(result.sources.length, 2);
  assert.equal(result.coverage.find((item) => item.section === "schedule").status, "pending");
  const zero = await collectEventWebsite(`${origin}/overview`, htmlFor("/overview"), {
    budgetMs: 0,
    fetchPage: () => assert.fail("no remaining time"),
  });
  assert.equal(zero.sources.length, 1);
  assert.equal(zero.coverage.find((item) => item.section === "hotels").status, "pending");
  const absent = await collectEventWebsite(
    `${origin}/`,
    "<h1>2027 Example Meet</h1><p>Event details are here.</p>",
    { fetchPage },
  );
  assert.equal(absent.coverage.find((item) => item.section === "schedule").status, "not_found");
});

test("shared-host event scope excludes other events and external booking sites", async () => {
  const fetched = [];
  const html =
    '<h1>2027 Club Meet</h1><a href="/events/ours/schedule">Schedule</a><a href="/events/other/schedule">Other schedule</a><a href="https://booking.test/hotel">Host hotel</a>';
  await collectEventWebsite(`${origin}/events/ours/overview`, html, {
    fetchPage: async (url) => {
      fetched.push(url);
      return {
        contentType: "text/html",
        text: "<p>2027 Schedule coming soon. More information will be posted.</p>",
      };
    },
  });
  assert.ok(fetched.includes(`${origin}/events/ours/schedule`));
  assert.ok(fetched.every((url) => url.startsWith(`${origin}/events/ours/`)));
});

test("a redirect to a different event is recorded as a failed source", async () => {
  const result = await collectEventWebsite(
    `${origin}/events/ours/overview`,
    '<h1>2027 Meet</h1><a href="/events/ours/schedule">Schedule</a>',
    {
      fetchPage: async () => ({
        contentType: "text/html",
        text: "<p>Different event schedule</p>",
        finalUrl: `${origin}/events/other/schedule`,
      }),
    },
  );
  assert.equal(result.coverage.find((item) => item.section === "schedule").status, "failed");
});

test("menu discovery retains useful query parameters and rejects non-HTTP links", () => {
  assert.deepEqual(
    eventWebsiteLinks(
      '<nav hidden><a href="/schedule?group=boys&utm_source=mail#top">Schedule</a><a href="javascript:alert(1)">Hotels</a></nav>',
      origin,
    ).map((item) => item.url),
    [`${origin}/schedule?group=boys`],
  );
});

test("mixed schedule availability preserves a published PDF and a pending group", async () => {
  const html = `<h1>2027 Meet Schedule</h1><p><a href="/2027-girls-schedule.pdf">Girls schedule</a></p><p>Boys schedule TBD</p><p><a href="/2026-schedule.pdf">2026 archive schedule</a></p>`;
  const result = await collectEventWebsite(`${origin}/schedule`, html, { fetchPage });
  assert.equal(result.schedule.status, "partial");
  assert.ok(result.schedule.links.some((link) => link.url.endsWith("2027-girls-schedule.pdf")));
  assert.ok(result.schedule.links.every((link) => !link.url.includes("2026")));
});

test("an unknown event edition cannot silently merge historical club lists", async () => {
  const html = htmlFor("/competing-teams");
  const result = await collectEventWebsite(`${origin}/competing-teams`, html, {
    budgetMs: 0,
    fetchPage,
  });
  assert.equal(result.eventYear, null);
  assert.equal(result.participatingClubs.length, 0);
  assert.equal(
    result.coverage.find((item) => item.section === "participatingClubs").status,
    "pending",
  );
});

test("cancellation propagates without turning it into source failures", async () => {
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(
    collectEventWebsite(`${origin}/overview`, htmlFor("/overview"), {
      signal: controller.signal,
      fetchPage: () => assert.fail("must not fetch"),
    }),
    /abort/i,
  );
});

test("malformed saved metadata cannot introduce executable source links", async () => {
  const result = await collectEventWebsite(`${origin}/overview`, htmlFor("/overview"), {
    fetchPage,
  });
  result.schedule.links[0].url = "javascript:alert(1)";
  assert.equal(readWebsiteImport(result), null);
});

test("discovered sources beyond the link-depth limit remain pending", async () => {
  const pages = {
    "/": "<h1>2027 Example Meet</h1><p>Information for families.</p>",
    "/one": '<h1>2027 Meet overview</h1><a href="/two">Host hotels</a>',
    "/two":
      '<h1>Host hotels</h1><p>Published hotel information.</p><a href="/three">Competing teams</a>',
  };
  const result = await collectEventWebsite(
    `${origin}/overview`,
    '<h1>2027 Meet overview</h1><a href="/one">Meet information</a>',
    {
      fetchPage: async (url) => {
        const pathname = new URL(url).pathname;
        assert.notEqual(pathname, "/three");
        return { contentType: "text/html", text: pages[pathname] };
      },
    },
  );
  assert.equal(
    result.coverage.find((item) => item.section === "participatingClubs").status,
    "pending",
  );
});

test("a UK meet uses arbitrary sibling document names, club tables, semantic attraction cards and a 24-hour programme", async () => {
  const root = "https://fixtures.example.org/meets/spring-open/";
  const nav = `<nav><a href="about-the-meet.html">About the meet</a><a href="stay.aspx">Where to stay</a><a href="entrants.html">Clubs</a><a href="guide.html">Visitor guide</a><a href="running-order.html">Programme</a><a href="/meets/other/entrants.html">Other clubs</a></nav>`;
  const documents = {
    "": "<h1>Spring Open 2028</h1><p>14–16 May 2028. Venue: Riverside Sports Centre.</p>",
    "about-the-meet.html":
      "<h1>Spring Open 2028</h1><p>14–16 May 2028. Venue: Riverside Sports Centre.</p><p>Admission £12.</p>",
    "stay.aspx": "<h1>Where to stay</h1><p>Riverside Lodge, room blocks for visiting clubs.</p>",
    "entrants.html": `<h1>Clubs — 2028</h1><table><tr><th>Club name</th><th>City</th><th>Country</th></tr><tr><td>Étoile Gymnastique</td><td>Lyon</td><td>France</td></tr><tr><td>Riverside Gymnastics</td><td>York</td><td>United Kingdom</td></tr></table><h2>Clubs — 2027</h2><table><tr><th>Club</th><th>Location</th></tr><tr><td>Archived Club</td><td>Old city</td></tr></table>`,
    "guide.html": `<h1>Explore the city</h1><article><h3><a href="https://museum.example.org/visit?offer=spring">City Railway Museum</a></h3><p>Explore historic locomotives with the family.</p><a href="https://museum.example.org/visit?offer=spring">Plan a visit</a></article>`,
    "running-order.html":
      "<h1>Programme — 2028</h1><p>Saturday: 09:00 doors, 10:30 competition.</p>",
  };
  const requested = [];
  const html = (name) =>
    `<html><title>Spring Open</title>${nav}<main>${documents[name]}</main></html>`;
  const result = await collectEventWebsite(
    `${root}about-the-meet.html`,
    html("about-the-meet.html"),
    {
      fetchPage: async (url) => {
        assert.ok(url.startsWith(root), "must remain inside the selected meet directory");
        requested.push(url);
        const name = url.slice(root.length);
        assert.ok(Object.hasOwn(documents, name));
        return { contentType: "text/html", text: html(name) };
      },
    },
  );
  assert.equal(result.eventYear, 2028);
  assert.equal(result.sources.length, 6);
  assert.ok(requested.includes(`${root}stay.aspx`));
  assert.deepEqual(
    result.participatingClubs.map(({ name, location }) => ({ name, location })),
    [
      { name: "Étoile Gymnastique", location: "Lyon, France" },
      { name: "Riverside Gymnastics", location: "York, United Kingdom" },
    ],
  );
  assert.deepEqual(
    result.attractions.map(({ name, description }) => ({ name, description })),
    [{ name: "City Railway Museum", description: "Explore historic locomotives with the family." }],
  );
  assert.equal(result.attractions[0].url, "https://museum.example.org/visit?offer=spring");
  assert.equal(result.schedule.status, "available");
  assert.ok(result.coverage.every((section) => section.status === "collected"));
});

test("a Canadian event landing without a trailing slash discovers its children and retains a partial schedule", async () => {
  const root = "https://tournaments.example.ca/events/northern-cup";
  const html = `<h1>Northern Cup</h1><time datetime="2029-02-15">15 February 2029</time><p>Club tournament information.</p><nav><a href="${root}/teams">Teams</a><a href="${root}/agenda">Agenda</a><a href="/events/another-cup/teams">Other teams</a></nav>`;
  const requested = [];
  const result = await collectEventWebsite(root, html, {
    fetchPage: async (url) => {
      requested.push(url);
      assert.ok(url.startsWith(`${root}/`));
      return {
        contentType: "text/html",
        text: url.endsWith("/teams")
          ? "<h1>Teams 2029</h1><ul><li>Québec Élite</li><li>North Shore Club</li></ul><h2>Teams 2028</h2><ul><li>Archived Team</li></ul>"
          : url.endsWith("/agenda")
            ? '<h1>Agenda 2029</h1><p>Women: 9 AM start.</p><p>Men: coming soon.</p><a href="/files/2029-order.pdf">Competition order</a>'
            : "<h1>Northern Cup</h1><p>15 February 2029. Details for visiting clubs.</p>",
      };
    },
  });
  assert.equal(result.eventYear, 2029);
  assert.deepEqual(
    result.participatingClubs.map((club) => club.name),
    ["Québec Élite", "North Shore Club"],
  );
  assert.ok(result.participatingClubs.every((club) => club.location === ""));
  assert.deepEqual(websitePublicSections(result).participatingClubs.bullets, [
    "Québec Élite",
    "North Shore Club",
  ]);
  assert.equal(result.schedule.status, "partial");
  assert.ok(result.schedule.links.some((link) => link.url.endsWith("2029-order.pdf")));
  assert.equal(result.coverage.find((section) => section.section === "hotels").status, "not_found");
  assert.equal(requested.filter((url) => url.endsWith("/teams")).length, 1);
});

test("a root event site discovers descriptive links even when page URLs have no section keywords", async () => {
  const root = "https://community-open.example.net";
  const html =
    '<h1>2028 Community Invitational</h1><p>Information for visiting families.</p><nav><a href="/a">Accommodations</a><a href="/b">Participating clubs</a><a href="/c">Local activities</a><a href="/d">Timetable</a></nav>';
  const result = await collectEventWebsite(`${root}/welcome.php`, html, {
    fetchPage: async (url) => ({
      contentType: "text/html",
      text: {
        "/": "<h1>2028 Community Invitational</h1><p>Event overview.</p>",
        "/a": "<h1>Accommodations</h1><p>Garden Hotel welcomes visiting clubs.</p>",
        "/b": "<h1>Participating clubs</h1><p>Meadow Gym — Dublin, Ireland</p>",
        "/c": '<h1>Local activities</h1><ul><li><h3>Botanic Garden</h3><p>Outdoor trails and glasshouses.</p><a href="https://garden.example.net">Explore</a></li></ul>',
        "/d": "<h1>Timetable</h1><p>Session assignments are not yet available.</p>",
      }[new URL(url).pathname],
    }),
  });
  assert.equal(result.participatingClubs[0].location, "Dublin, Ireland");
  assert.equal(result.attractions[0].name, "Botanic Garden");
  assert.equal(result.schedule.status, "not_posted");
  assert.equal(result.coverage.find((section) => section.section === "hotels").status, "collected");
});
