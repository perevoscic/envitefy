/** Website text is evidence to extract, never instructions to execute. */
export const WEBSITE_SECTIONS = {
  overview: "Event overview",
  venue: "Venue",
  admission: "Admission & registration",
  hotels: "Host hotels",
  participatingClubs: "Participating clubs",
  attractions: "Things to do",
  schedule: "Schedule",
} as const;
export type WebsiteSection = keyof typeof WEBSITE_SECTIONS;
export type WebsiteCoverage = {
  section: WebsiteSection;
  status: "collected" | "unavailable" | "failed" | "pending" | "not_found";
  sourceUrls: string[];
  reason: string;
};
export type WebsiteClub = {
  name: string;
  location: string;
  year: number | null;
  sourceUrl: string;
};
export type WebsiteAttraction = {
  name: string;
  description: string;
  url: string;
  sourceUrl: string;
  imageUrl?: string;
};
export type WebsitePlaceImage = { name: string; imageUrl: string; sourceUrl: string };
export type WebsiteImport = {
  version: 1;
  eventYear: number | null;
  coverage: WebsiteCoverage[];
  sources: Array<{ url: string; title: string; retrievedAt: string }>;
  participatingClubs: WebsiteClub[];
  attractions: WebsiteAttraction[];
  schedule: {
    status: "available" | "partial" | "not_posted" | "unknown";
    notice: string;
    links: WebsiteLink[];
  };
};
export type WebsiteLink = { label: string; url: string };
export type WebsitePage = {
  url: string;
  html: string;
  title: string;
  text: string;
  sections: WebsiteSection[];
};
export type WebsiteFetch = (
  url: string,
  options: { timeoutMs: number; signal?: AbortSignal },
) => Promise<{ text: string; contentType: string; finalUrl?: string }>;

function decode(text: string): string {
  const entities: Record<string, string> = {
    amp: "&",
    nbsp: " ",
    quot: '"',
    apos: "'",
    lt: "<",
    gt: ">",
    ndash: "–",
    mdash: "—",
    rsquo: "’",
  };
  return text.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
    if (!entity.startsWith("#")) return entities[entity.toLowerCase()] || match;
    const code =
      entity[1].toLowerCase() === "x"
        ? Number.parseInt(entity.slice(2), 16)
        : Number(entity.slice(1));
    return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : "";
  });
}

export function websiteContent(html: string): string {
  const clean = html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style|noscript|nav|footer)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, "");
  return clean.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] || clean;
}

export function websiteText(html: string): string {
  return decode(
    html
      .replace(/<br\s*\/?\s*>|<\/(?:p|h[1-6]|li|div|section|article|tr)>/gi, "\n")
      .replace(/<[^>]*>/g, " "),
  )
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}

export function websiteUrl(value: string, base?: string): string | null {
  try {
    const url = new URL(decode(value), base);
    if (!/^https?:$/.test(url.protocol) || url.username || url.password) return null;
    url.hash = "";
    for (const key of [...url.searchParams.keys()])
      if (/^(utm_.+|fbclid|gclid)$/i.test(key)) url.searchParams.delete(key);
    return url.toString();
  } catch {
    return null;
  }
}

function sameSite(left: string, right: string): boolean {
  const a = new URL(left);
  const b = new URL(right);
  return a.hostname.replace(/^www\./, "") === b.hostname.replace(/^www\./, "") && a.port === b.port;
}

/** Only embed public web photos. No data, script, credentialed or local-network sources. */
export function websitePhotoUrl(value: string, base?: string): string | null {
  const resolved = websiteUrl(value, base);
  if (!resolved) return null;
  const host = new URL(resolved).hostname.toLowerCase();
  if (!host.includes(".") || host.includes(":") || /^(?:localhost|127\.|0\.|10\.|169\.254\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.)/.test(host) || /\.(?:local|internal|test)$/.test(host)) return null;
  return resolved;
}

function photoTags(html: string, base: string): string[] {
  return [...html.matchAll(/<img\b[^>]*>/gi)].flatMap(([tag]) => {
    if (/\b(?:alt|class)=["'][^"']*(?:logo|icon|spacer|tracking|avatar|background|dot-bk)/i.test(tag)) return [];
    const attr = (name: string) => decode(tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']+)["']`, "i"))?.[1] || "");
    const raw = attr("data-src") || attr("data-original") || attr("src") || attr("srcset").split(/\s+/)[0];
    if (/logo|spacer|pixel|dot-bk/i.test(raw)) return [];
    const url = websitePhotoUrl(raw, base);
    return url ? [url] : [];
  });
}

/** Match a photo only inside a named place's own card/row, never by list order. */
export function websiteImagesForNames(page: Pick<WebsitePage, "html" | "url">, names: string[]): WebsitePlaceImage[] {
  const html = websiteContent(page.html);
  const normalize = (value: string) => value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  const fragments = [
    ...[...html.matchAll(/<(figure|article|li)\b[^>]*>([\s\S]*?)<\/\1>/gi)].map((match) => match[2]),
    ...html.split(/<hr\b[^>]*>/gi),
  ];
  const results = new Map<string, WebsitePlaceImage>();
  for (const fragment of fragments) {
    const text = ` ${normalize(websiteText(fragment))} `;
    const spans = names.flatMap((name) => {
      const token = ` ${normalize(name)} `;
      const found: Array<{ name: string; start: number; end: number }> = [];
      for (let start = text.indexOf(token); start >= 0; start = text.indexOf(token, start + 1)) found.push({ name, start, end: start + token.length });
      return found;
    });
    // A brand name can be a suffix of another hotel's full name.
    const matching = [...new Set(spans.filter((span) => !spans.some((other) => other.name !== span.name && other.start <= span.start && other.end >= span.end)).map((span) => span.name))];
    const photos = [...new Set(photoTags(fragment, page.url))];
    if (matching.length !== 1 || photos.length !== 1 || results.has(matching[0])) continue;
    results.set(matching[0], { name: matching[0], imageUrl: photos[0], sourceUrl: page.url });
  }
  return [...results.values()];
}

export function websiteSections(label: string, url: string): WebsiteSection[] {
  const path = new URL(url).pathname;
  const leaf = path.split("/").filter(Boolean).at(-1) || "";
  const text = `${label} ${leaf}`.replace(/[-_]/g, " ");
  const roles: WebsiteSection[] = [];
  if (
    path === "/" ||
    /\b(overview|about(?: the)? (?:meet|event)|meet info(?:rmation)?|event info(?:rmation)?|event details|meet details)\b/i.test(
      text,
    )
  )
    roles.push("overview");
  if (/\b(venue|location|directions)\b/i.test(text)) roles.push("venue");
  if (/\b(admission|registration|spectators?|tickets?)\b/i.test(text)) roles.push("admission");
  if (/\b(hotels?|lodging|accommodations?|where to stay)\b/i.test(text)) roles.push("hotels");
  if (/\b(teams|clubs|entrants|participating organizations|who.s coming)\b/i.test(text))
    roles.push("participatingClubs");
  if (
    /\b(plan your visit|things to do|attractions|local activities|visitor guide|explore(?: the)? (?:area|city))\b/i.test(
      text,
    )
  )
    roles.push("attractions");
  if (/\b(schedule|timetable|sessions?|program(?:me)?|agenda)\b/i.test(text))
    roles.push("schedule");
  return roles;
}

function anchors(html: string, base: string): WebsiteLink[] {
  return [
    ...html
      .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
      .matchAll(/<a\b[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi),
  ].flatMap((match) => {
    const url = websiteUrl(match[1], base);
    return url ? [{ url, label: websiteText(match[2]) }] : [];
  });
}

/** Read hrefs in collapsed menus, without treating menu text as event prose. */
export function eventWebsiteLinks(html: string, base: string): WebsiteLink[] {
  return [
    ...new Map(
      anchors(html, base)
        .filter(
          (link) =>
            sameSite(link.url, base) &&
            websiteSections(link.label, link.url).length &&
            !/\.(pdf|png|jpe?g|webp|zip|ics)$/i.test(new URL(link.url).pathname),
        )
        .map((link) => [link.url, link]),
    ).values(),
  ];
}

function makePage(url: string, html: string, roles: WebsiteSection[]): WebsitePage {
  const title = websiteText(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "");
  const text = websiteText(websiteContent(html)).slice(0, 100_000);
  const sections = new Set(roles);
  if (sections.has("overview")) {
    if (/\b(meet location|venue|convention center|event location)\b/i.test(text))
      sections.add("venue");
    if (/\b(admission|spectator fees|registration fees)\b/i.test(text)) sections.add("admission");
  }
  return { url, html, title, text, sections: [...sections] };
}

function eventYear(pages: WebsitePage[]): number | null {
  for (const page of pages.filter((item) => item.sections.includes("overview"))) {
    const dated = websiteContent(page.html).match(
      /<time\b[^>]*\bdatetime=["'](20\d{2})-\d{2}-\d{2}/i,
    );
    if (dated) return Number(dated[1]);
    const match = `${page.text}\n${page.title}`.match(
      /\b(20\d{2})\s+[^\n]{0,85}\b(?:classic|meet|championship|invitational|tournament|event|festival)\b|\b(?:Jan(?:uary)?\.?|Feb(?:ruary)?\.?|Mar(?:ch)?\.?|Apr(?:il)?\.?|May|Jun(?:e)?\.?|Jul(?:y)?\.?|Aug(?:ust)?\.?|Sep(?:tember)?\.?|Oct(?:ober)?\.?|Nov(?:ember)?\.?|Dec(?:ember)?\.?)\s+\d{1,2}(?:\s*[-–]\s*\d{1,2})?,?\s+(20\d{2})|\b\d{1,2}(?:\s*[-–]\s*\d{1,2})?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+(20\d{2})/i,
    );
    if (match) return Number(match[1] || match[2] || match[3]);
    for (const heading of page.html.matchAll(/<h[12]\b[^>]*>([\s\S]*?)<\/h[12]>/gi)) {
      const years = websiteText(heading[1]).match(/\b20\d{2}\b/g);
      if (years?.length === 1) return Number(years[0]);
    }
  }
  return null;
}

function currentEdition(
  text: string,
  year: number | null,
  section: "clubs" | "schedule",
): string | null {
  const headingTerms =
    section === "clubs"
      ? /\b(teams|clubs|entrants)\b/i
      : /\b(schedule|timetable|program(?:me)?|agenda)\b/i;
  const headings = [...text.matchAll(/[^\n]+/g)].flatMap((line) => {
    const explicitYear = line[0].match(/\b20\d{2}\b/);
    return explicitYear && headingTerms.test(line[0])
      ? [{ year: Number(explicitYear[0]), index: line.index }]
      : [];
  });
  if (!headings.length) return text;
  if (!year || !headings.some((heading) => heading.year === year)) return null;
  const first = headings.find((heading) => heading.year === year);
  if (!first) return null;
  const next = headings.find((heading) => heading.year !== year && heading.index > first.index);
  return text.slice(first.index, next?.index);
}

function clubsFrom(page: WebsitePage, year: number | null): WebsiteClub[] {
  const text = currentEdition(page.text, year, "clubs");
  if (!text) return [];
  const clubs = new Map<string, WebsiteClub>();
  const add = (name: string, location = "") => {
    name = name.trim();
    if (
      name.length < 3 ||
      name.length > 120 ||
      !text.includes(name) ||
      /@|https?:|\b(register|registration|contact|email|coming soon|TBD|click here)\b/i.test(
        name,
      ) ||
      /^(?:20\d{2}\s+)?(?:(?:competing|participating)\s+)?(?:teams|clubs|entrants)\b/i.test(name)
    )
      return;
    clubs.set(name.toLocaleLowerCase(), {
      name,
      location: location.trim(),
      year,
      sourceUrl: page.url,
    });
  };
  // Plain text lists, with locations supplied by the organizer (including non-US locations).
  for (const line of text.split("\n")) {
    const match = line.match(/^(.{3,120}?)\s+[-–—|]\s+(.{2,90})$/);
    if (match) add(match[1], match[2]);
  }
  const html = websiteContent(page.html);
  for (const table of html.matchAll(/<table\b[^>]*>([\s\S]*?)<\/table>/gi)) {
    let nameColumn = -1;
    let locationColumns: number[] = [];
    for (const row of table[1].matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
      const cells = [...row[1].matchAll(/<(td|th)\b[^>]*>([\s\S]*?)<\/\1>/gi)].map((cell) =>
        websiteText(cell[2]),
      );
      const header = cells.findIndex((cell) =>
        /^(?:(?:gymnastics|participating|competing)\s+)?(?:club|team|gym)(?:\s+name)?$/i.test(cell),
      );
      if (header >= 0) {
        nameColumn = header;
        locationColumns = cells.flatMap((cell, index) =>
          /^(location|city|state|province|country|town)$/i.test(cell) ? [index] : [],
        );
      } else if (nameColumn >= 0 && cells[nameColumn]) {
        add(
          cells[nameColumn],
          locationColumns
            .map((index) => cells[index])
            .filter(Boolean)
            .join(", "),
        );
      }
    }
  }
  for (const list of html.matchAll(/<(ul|ol)\b[^>]*>([\s\S]*?)<\/\1>/gi)) {
    for (const item of list[2].matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)) {
      const line = websiteText(item[1]);
      // A short named entry is useful even when the organizer supplies no location.
      if (!/[.!?]|\n/.test(line) && !/\s[-–—|]\s/.test(line)) add(line);
    }
  }
  return [...clubs.values()];
}

function attractionsFrom(page: WebsitePage): WebsiteAttraction[] {
  const html = websiteContent(page.html);
  const items = new Map<string, WebsiteAttraction>();
  const add = (name: string, description: string, url: string) => {
    if (
      name.length >= 3 &&
      name.length <= 100 &&
      !sameSite(url, page.url) &&
      !/facebook|instagram|twitter/i.test(new URL(url).hostname)
    )
      items.set(`${name}|${url}`, {
        name,
        description: description.slice(0, 1200),
        url,
        sourceUrl: page.url,
      });
  };
  for (const match of html.matchAll(/<figure\b[^>]*>([\s\S]*?)<\/figure>/gi)) {
    const card = match[1];
    const name = websiteText(
      card.match(/<div\b[^>]*class=["'][^"']*image-title[^"']*["'][^>]*>([\s\S]*?)<\/div>/i)?.[1] ||
        "",
    );
    const description = websiteText(
      card.match(
        /<div\b[^>]*class=["'][^"']*image-subtitle[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
      )?.[1] || "",
    );
    const link = anchors(card, page.url)[0];
    if (link && name) add(name, description, link.url);
  }
  // Semantic cards used by ordinary CMSs, independent of their class names.
  for (const match of html.matchAll(/<(article|li)\b[^>]*>([\s\S]*?)<\/\1>/gi)) {
    const card = match[2];
    const heading = card.match(/<h[2-6]\b[^>]*>([\s\S]*?)<\/h[2-6]>/i)?.[1];
    const link = anchors(card, page.url).find((item) => !sameSite(item.url, page.url));
    if (heading && link)
      add(
        websiteText(heading),
        [...card.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)]
          .map((paragraph) => websiteText(paragraph[1].replace(/<a\b[^>]*>[\s\S]*?<\/a>/gi, "")))
          .filter(Boolean)
          .join(" "),
        link.url,
      );
  }
  const blocks = [...html.matchAll(/<(p|h[2-4])\b[^>]*>([\s\S]*?)<\/\1>/gi)];
  for (let index = 0; index < blocks.length; index++) {
    const link = anchors(blocks[index][2], page.url)[0];
    if (!link || [...items.values()].some((item) => item.url === link.url)) continue;
    const own = websiteText(blocks[index][2].replace(/<a\b[^>]*>[\s\S]*?<\/a>/gi, ""));
    const lines = (own.length > 4 ? own : websiteText(blocks[index - 1]?.[2] || "")).split("\n");
    if (/[.!?]|\b(for more|visit our|we want|learn more)\b/i.test(lines[0] || "")) continue;
    add(lines[0] || "", lines.slice(1).join(" "), link.url);
  }
  const places = [...items.values()].slice(0, 30);
  const images = websiteImagesForNames(page, places.map((item) => item.name));
  return places.map((item) => ({ ...item, ...(images.find((image) => image.name === item.name) ? { imageUrl: images.find((image) => image.name === item.name)!.imageUrl } : {}) }));
}

/** Preserve hotel CTAs in their source order; image URLs never become booking links. */
export function websiteHotelText(page: Pick<WebsitePage, "html" | "url">): string {
  return `Host Hotels\n${websiteText(
    websiteContent(page.html).replace(
      /<a\b[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi,
      (_match, href: string, content: string) => {
        const url = websiteUrl(href, page.url) ? new URL(decode(href), page.url).href : null;
        const label = websiteText(content);
        return url && label && !/\.(?:png|jpe?g|webp|gif|svg)(?:$|\?)/i.test(url)
          ? `[${label}](${url})`
          : label;
      },
    ),
  )}`.slice(0, 30_000);
}

function scheduleFrom(pages: WebsitePage[], year: number | null): WebsiteImport["schedule"] {
  const sources = pages.filter((page) => page.sections.includes("schedule"));
  const current = sources.filter((page) => currentEdition(page.text, year, "schedule") !== null);
  const texts = current.map((page) => currentEdition(page.text, year, "schedule") || "");
  const notPosted = texts.some((text) =>
    /\b(TBD|coming soon|not (?:yet )?(?:posted|published|available)|will be (?:posted|published|available))\b/i.test(
      text,
    ),
  );
  const resources = current.flatMap((page) =>
    anchors(websiteContent(page.html), page.url).filter((link) => {
      const suppliedYears: string[] =
        `${link.label} ${new URL(link.url).pathname}`.match(/\b20\d{2}\b/g) || [];
      return (
        /\.pdf(?:\?|$)|schedule|session/i.test(`${link.label} ${link.url}`) &&
        link.url !== page.url &&
        (!year || !suppliedYears.length || suppliedYears.includes(String(year)))
      );
    }),
  );
  const hasTimes = texts.some((text) =>
    /\b(?:\d{1,2}(?::\d{2})?\s*(?:am|pm)|(?:[01]?\d|2[0-3]):[0-5]\d)\b/i.test(text),
  );
  const available = resources.length > 0 || hasTimes;
  const status = notPosted
    ? available
      ? "partial"
      : "not_posted"
    : available
      ? "available"
      : "unknown";
  const links = [
    ...new Map(
      [...resources, ...sources.map((page) => ({ label: "Official schedule", url: page.url }))].map(
        (link) => [link.url, link],
      ),
    ).values(),
  ];
  const notice =
    status === "not_posted"
      ? `${year || "Event"} schedule not yet published.`
      : status === "partial"
        ? "Part of the schedule is published; some sessions are still to be announced."
        : status === "available"
          ? "View the official schedule for session details."
          : "Schedule publication could not be confirmed. Check the official source.";
  return { status, notice, links };
}

export function isEventCorePage(page: WebsitePage): boolean {
  return page.sections.some((section) =>
    ["overview", "venue", "admission", "schedule"].includes(section),
  );
}

export async function collectEventWebsite(
  seedUrl: string,
  seedHtml: string,
  options: {
    fetchPage: WebsiteFetch;
    signal?: AbortSignal;
    budgetMs?: number;
    maxPages?: number;
    onPage?: (page: WebsitePage) => void;
  },
): Promise<WebsiteImport> {
  const seed = websiteUrl(seedUrl);
  if (!seed) throw new Error("Invalid event source URL");
  const deadline = Date.now() + Math.max(0, options.budgetMs ?? 20_000);
  const maxPages = Math.max(1, Math.min(12, options.maxPages ?? 10));
  const path = new URL(seed).pathname;
  const directory = `${path.replace(/\/$/, "")}/`;
  // A landing page may omit its trailing slash. Child hrefs establish that directory;
  // otherwise treat the pasted URL as a document and discover its siblings.
  const hasChildren = eventWebsiteLinks(seedHtml, seed).some((link) =>
    new URL(link.url).pathname.startsWith(directory),
  );
  const scope = path.endsWith("/") || hasChildren ? directory : new URL(".", seed).pathname;
  const canonical = (value: string) => {
    const url = new URL(value);
    url.hostname = new URL(seed).hostname;
    if (new URL(seed).protocol === "https:") url.protocol = "https:";
    url.hash = "";
    return url.toString();
  };
  const roles = websiteSections("", seed);
  const pages = [makePage(seed, seedHtml, roles.length ? roles : ["overview"])];
  const queue = new Map<string, { link: WebsiteLink; sections: WebsiteSection[]; depth: number }>();
  const visited = new Set([canonical(seed)]);
  const failures: Array<{ url: string; sections: WebsiteSection[]; reason: string }> = [];
  const discover = (html: string, base: string, depth: number) => {
    for (const link of eventWebsiteLinks(html, base)) {
      if (!new URL(link.url).pathname.startsWith(scope)) continue;
      const url = canonical(link.url);
      if (!visited.has(url) && (!queue.has(url) || depth < queue.get(url)!.depth))
        queue.set(url, {
          link: { ...link, url },
          sections: websiteSections(link.label, url),
          depth,
        });
    }
  };
  discover(seedHtml, seed, 1);
  const home = canonical(new URL(scope, seed).toString());
  if (!visited.has(home))
    queue.set(home, {
      link: { url: home, label: "Event overview" },
      sections: ["overview"],
      depth: 1,
    });
  while (queue.size && visited.size < maxPages && Date.now() < deadline) {
    options.signal?.throwIfAborted();
    const covered = new Set(pages.flatMap((page) => page.sections));
    const priority = (sections: WebsiteSection[]) =>
      sections.includes("overview")
        ? 100
        : sections.some((section) => !covered.has(section))
          ? 50
          : 0;
    const batch = [...queue.values()]
      .filter((item) => item.depth <= 2)
      .sort(
        (a, b) =>
          priority(b.sections) - priority(a.sections) || a.link.url.localeCompare(b.link.url),
      )
      .slice(0, Math.min(2, maxPages - visited.size));
    if (!batch.length) break;
    for (const item of batch) {
      queue.delete(item.link.url);
      visited.add(item.link.url);
    }
    const results = await Promise.all(
      batch.map(async (item) => {
        try {
          const remote = await options.fetchPage(item.link.url, {
            signal: options.signal,
            timeoutMs: Math.max(1, Math.min(8_000, deadline - Date.now())),
          });
          options.signal?.throwIfAborted();
          const finalUrl = websiteUrl(remote.finalUrl || item.link.url);
          if (
            !finalUrl ||
            !sameSite(finalUrl, seed) ||
            !new URL(finalUrl).pathname.startsWith(scope)
          )
            throw new Error("The source redirected outside this event website.");
          if (
            !/text\/html/i.test(remote.contentType) ||
            websiteText(websiteContent(remote.text)).length < 20
          )
            throw new Error("The source returned no readable event page.");
          return {
            page: makePage(canonical(finalUrl), remote.text, item.sections),
            depth: item.depth,
          };
        } catch (error) {
          options.signal?.throwIfAborted();
          failures.push({
            url: item.link.url,
            sections: item.sections,
            reason: error instanceof Error ? error.message : "Source could not be loaded.",
          });
          return null;
        }
      }),
    );
    for (const result of results)
      if (result) {
        const existing = pages.find((page) => canonical(page.url) === canonical(result.page.url));
        if (!existing) {
          pages.push(result.page);
          options.onPage?.(result.page);
        }
        visited.add(canonical(result.page.url));
        queue.delete(canonical(result.page.url));
        discover(result.page.html, result.page.url, result.depth + 1);
      }
  }
  options.signal?.throwIfAborted();
  const year = eventYear(pages);
  const clubs = pages
    .filter((page) => page.sections.includes("participatingClubs"))
    .flatMap((page) => clubsFrom(page, year));
  const attractions = pages
    .filter((page) => page.sections.includes("attractions"))
    .flatMap(attractionsFrom);
  const schedule = scheduleFrom(pages, year);
  const coverage = (Object.keys(WEBSITE_SECTIONS) as WebsiteSection[]).map(
    (section): WebsiteCoverage => {
      const sources = pages.filter((page) => page.sections.includes(section));
      const urls = sources.map((page) => page.url);
      if (urls.length) {
        if (section === "schedule" && schedule.status === "not_posted")
          return { section, status: "unavailable", sourceUrls: urls, reason: schedule.notice };
        const mapped =
          section === "participatingClubs"
            ? clubs.length > 0
            : section === "attractions"
              ? attractions.length > 0
              : section === "schedule"
                ? schedule.status !== "unknown"
                : sources.some((page) => page.text.length >= 20);
        return {
          section,
          status: mapped ? "collected" : "pending",
          sourceUrls: urls,
          reason:
            section === "schedule"
              ? schedule.notice
              : mapped
                ? "Collected from the event website."
                : "The source was read, but this section needs review.",
        };
      }
      const failed = failures.filter((item) => item.sections.includes(section));
      if (failed.length)
        return {
          section,
          status: "failed",
          sourceUrls: failed.map((item) => item.url),
          reason: failed.map((item) => item.reason).join("; "),
        };
      const pending = [...queue.values()].filter((item) => item.sections.includes(section));
      return {
        section,
        status: pending.length ? "pending" : "not_found",
        sourceUrls: pending.map((item) => item.link.url),
        reason: pending.length
          ? "The page, depth or time limit was reached before this source was read."
          : "No source was found in this event's links.",
      };
    },
  );
  return {
    version: 1,
    eventYear: year,
    coverage,
    sources: pages.map((page) => ({
      url: page.url,
      title: page.title,
      retrievedAt: new Date().toISOString(),
    })),
    participatingClubs: [
      ...new Map(clubs.map((item) => [`${item.name}|${item.location}`, item])).values(),
    ],
    attractions: [
      ...new Map(attractions.map((item) => [`${item.name}|${item.url}`, item])).values(),
    ],
    schedule,
  };
}

export function readWebsiteImport(value: unknown): WebsiteImport | null {
  if (!value || typeof value !== "object") return null;
  const item = value as WebsiteImport;
  const safeLink = (link: WebsiteLink) =>
    link && typeof link.label === "string" && typeof link.url === "string" && websiteUrl(link.url);
  if (
    item.version !== 1 ||
    (item.eventYear !== null && !Number.isInteger(item.eventYear)) ||
    !Array.isArray(item.coverage) ||
    !Array.isArray(item.sources) ||
    !Array.isArray(item.participatingClubs) ||
    !Array.isArray(item.attractions) ||
    !item.schedule
  )
    return null;
  if (
    item.coverage.some(
      (entry) =>
        !entry ||
        !Object.hasOwn(WEBSITE_SECTIONS, entry.section) ||
        !["collected", "unavailable", "failed", "pending", "not_found"].includes(entry.status) ||
        typeof entry.reason !== "string" ||
        !Array.isArray(entry.sourceUrls) ||
        entry.sourceUrls.some((url) => !websiteUrl(url)),
    )
  )
    return null;
  if (
    item.participatingClubs.some(
      (club) =>
        !club ||
        typeof club.name !== "string" ||
        typeof club.location !== "string" ||
        !websiteUrl(club.sourceUrl),
    )
  )
    return null;
  if (
    item.attractions.some(
      (attraction) =>
        !attraction ||
        typeof attraction.name !== "string" ||
        typeof attraction.description !== "string" ||
        !websiteUrl(attraction.url) ||
        !websiteUrl(attraction.sourceUrl),
    )
  )
    return null;
  if (
    typeof item.schedule.notice !== "string" ||
    !["available", "partial", "not_posted", "unknown"].includes(item.schedule.status) ||
    !Array.isArray(item.schedule.links) ||
    !item.schedule.links.every(safeLink)
  )
    return null;
  return item;
}

export function websitePublicSections(
  website: WebsiteImport | null,
): Record<string, import("./types").DiscoveryPublicSection> {
  if (!website) return {};
  const sections: Record<string, import("./types").DiscoveryPublicSection> = {};
  if (website.participatingClubs.length)
    sections.participatingClubs = {
      title: "Participating clubs",
      visibility: "visible",
      body: website.eventYear ? `${website.eventYear} participating clubs` : "Participating clubs",
      bullets: website.participatingClubs.map((club) =>
        [club.name, club.location].filter(Boolean).join(" — "),
      ),
      links: [...new Set(website.participatingClubs.map((club) => club.sourceUrl))].map((url) => ({
        label: "Official competing teams",
        url,
      })),
      provenance: "website_grounded",
      confidence: 0.9,
    };
  if (website.attractions.length)
    sections.attractions = {
      title: "Things to do",
      visibility: "visible",
      body: "Local attractions listed by the event organizer.",
      bullets: website.attractions.map((item) =>
        [item.name, item.description].filter(Boolean).join(": "),
      ),
      links: website.attractions.map((item) => ({ label: item.name, url: item.url })),
      provenance: "website_grounded",
      confidence: 0.9,
    };
  if (website.schedule.links.length)
    sections.scheduleAvailability = {
      title: "Schedule",
      visibility: "visible",
      body: website.schedule.notice,
      links: website.schedule.links,
      provenance: "website_grounded",
      confidence: website.schedule.status === "unknown" ? 0.5 : 0.9,
    };
  return sections;
}
