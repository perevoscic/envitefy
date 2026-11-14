import {
  addCalendarDays,
  formatCalendarDateTimeInTimeZone,
  parseCalendarDateTimeToIso,
} from "./calendar-date-time";

type RecordValue = Record<string, any>;
export type SourceUpdateState = {
  version: 1;
  url: string;
  facts?: RecordValue;
  lastCheckedAt?: string;
  hostNotes?: string;
};
export type SourceChange = {
  id: string;
  path: string[];
  label: string;
  before: any;
  after: any;
  kind: "added" | "updated" | "removed";
  conflict: boolean;
  manualReview?: boolean;
};
export const sourceRecord = (value: unknown): RecordValue =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as RecordValue) : {};
const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");
const blocked = new Set([
  "__proto__",
  "prototype",
  "constructor",
  "id",
  "createdAt",
  "updatedAt",
  "retrievedAt",
  "enabled",
  "source",
  "sources",
  "coverage",
  "importSources",
  "shortDate",
  "dateLabel",
  "periods",
  "imageUrl",
  "photoUrl",
  "image",
  "map",
  "status",
  "confidence",
  "provenance",
  "version",
  "eventYear",
]);
const ignored = (key: string) =>
  blocked.has(key) ||
  [
    "_sourceUpdateKey",
    "lastCheckedAt",
    "reviewReasons",
    "attempts",
    "candidates",
    "resolution",
    "pdfHotels",
    "narrative",
    "hotelSource",
    "evidence",
    "conflicts",
    "visibility",
    "hideReason",
  ].includes(key) ||
  /^(?:show|hide|font|color|style|theme|layout)/i.test(key);
const fields = [
  "title",
  "date",
  "time",
  "endDate",
  "endTime",
  "venue",
  "address",
  "city",
  "state",
  "hostGym",
  "details",
  "host",
  "rsvpName",
  "rsvpEmail",
  "rsvpPhone",
];

/** A source can propose factual content, never access settings, design, media or identity. */
export function sourceFacts(data: RecordValue): RecordValue {
  const result: RecordValue = {};
  for (const key of fields) if (data[key] !== undefined) result[key] = data[key];
  const advanced = sourceRecord(data.advancedSections);
  if (Object.keys(advanced).length) result.advancedSections = advanced;
  const source = sourceRecord(data.discoverySource);
  if (source.websiteImport || data.websiteImport)
    result.websiteImport = source.websiteImport || data.websiteImport;
  if (source.travelAccommodation || data.travelAccommodation)
    result.travelAccommodation = source.travelAccommodation || data.travelAccommodation;
  if (source.publicPageSections || data.publicPageSections)
    result.publicPageSections = source.publicPageSections || data.publicPageSections;
  if (Array.isArray(data.sections)) result.sections = data.sections;
  if (Array.isArray(data.registryLinks)) result.registryLinks = data.registryLinks;
  return result;
}

export function informationSourceFacts(details: RecordValue): RecordValue {
  return sourceFacts({ ...details, address: details.location, details: details.description });
}

export function readSourceUpdateState(value: unknown): SourceUpdateState | undefined {
  const state = sourceRecord(value);
  const url = publicSourceUrl(state.url);
  return state.version === 1 && url
    ? {
        version: 1,
        url,
        ...(state.facts ? { facts: sourceFacts(state.facts) } : {}),
        ...(text(state.lastCheckedAt) ? { lastCheckedAt: text(state.lastCheckedAt) } : {}),
        ...(text(state.hostNotes) ? { hostNotes: text(state.hostNotes).slice(0, 12000) } : {}),
      }
    : undefined;
}
function publicSourceUrl(value: unknown): string {
  try {
    const url = new URL(text(value));
    return /^https?:$/.test(url.protocol) && !url.username && !url.password ? url.href : "";
  } catch {
    return "";
  }
}
export function eventSourceUrl(data: RecordValue): string {
  const input = sourceRecord(data.discoverySource?.input);
  return (
    (input.type === "url" ? publicSourceUrl(input.url) : "") ||
    readSourceUpdateState(data.sourceUpdates)?.url ||
    (data.importedTheme?.origin === "website" ? publicSourceUrl(data.importedTheme.sourceUrl) : "")
  );
}

/** Unknown dates/zones remain checkable. Never use the device zone to end an event. */
export function sourceUpdateCutoff(
  data: RecordValue,
  now = Date.now(),
): { ended: boolean; reason?: string } {
  const details = sourceRecord(data.customEventPage?.details || data.customEventPageDraft?.details);
  const values = { ...data, ...details };
  const end = text(values.endAt || values.endISO || values.end);
  const start = text(values.startAt || values.startISO || values.start);
  const zone = text(values.timezone || values.tz);
  const dateOnlyEnd = /^\d{4}-\d{2}-\d{2}$/.test(end);
  const exclusiveEnd =
    values.allDay === true &&
    (values.gymnasticsDateVersion === 1 ||
      Boolean(data.customEventPage || data.customEventPageDraft));
  const endDate =
    text(values.endDate) ||
    (dateOnlyEnd ? (exclusiveEnd ? addCalendarDays(end, -1) || "" : end) : "");
  const localStart =
    zone && start.includes("T") ? formatCalendarDateTimeInTimeZone(start, zone) || start : start;
  const date = endDate || text(values.date) || localStart.slice(0, 10);
  let cutoff: string | null = null;
  if (end && /T.*(?:Z|[+-]\d{2}:?\d{2})$/i.test(end) && (values.allDay !== true || !endDate))
    cutoff = parseCalendarDateTimeToIso(end, zone);
  else if (date && zone) {
    try {
      new Intl.DateTimeFormat("en", { timeZone: zone }).format(0);
      cutoff = values.endTime
        ? parseCalendarDateTimeToIso(`${date}T${values.endTime}`, zone)
        : parseCalendarDateTimeToIso(addCalendarDays(date, 1), zone);
    } catch {
      /* The location zone still needs verification. */
    }
  }
  const ended = Boolean(cutoff && now >= Date.parse(cutoff));
  return { ended, ...(ended ? { reason: "Updates are available until the event ends." } : {}) };
}

// Match by source identity, never array position or generated database IDs.
function identity(value: any): string {
  const item = sourceRecord(value);
  const key =
    item._sourceUpdateKey ||
    item.isoDate ||
    (item.sessions ? item.date : "") ||
    (item.opponent ? `${item.date}|${item.opponent}` : "") ||
    (item.code ? `${item.code}|${text(item.label).match(/gym\s+[a-z0-9]+/i)?.[0] || ""}` : "") ||
    (item.group ? `${item.label || ""}|${item.group}` : "") ||
    item.name ||
    item.title ||
    item.label ||
    item.role ||
    item.section ||
    item.url ||
    (item.group ? `${item.group}|${item.label || ""}` : "");
  return text(key).toLowerCase().replace(/\s+/g, " ");
}
function keyed(values: any[]): Map<string, any> | null {
  const entries = values.map((value) => [identity(value), value] as const);
  if (entries.some(([key]) => !key) || new Set(entries.map(([key]) => key)).size !== entries.length)
    return null;
  return new Map(entries);
}
function comparable(value: any): any {
  if (Array.isArray(value)) return value.map(comparable);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.keys(value)
        .filter((key) => !ignored(key))
        .sort()
        .map((key) => [key, comparable(value[key])]),
    );
  return value ?? "";
}
function factual(value: any): any {
  if (Array.isArray(value)) return value.map(factual);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value)
        .filter(
          ([key]) =>
            !ignored(key) ||
            [
              "id",
              "source",
              "importSources",
              "shortDate",
              "status",
              "visibility",
              "version",
              "sources",
              "coverage",
              "eventYear",
              "retrievedAt",
            ].includes(key),
        )
        .map(([key, item]) => [key, factual(item)]),
    );
  return value;
}
const equal = (left: any, right: any) =>
  JSON.stringify(comparable(left)) === JSON.stringify(comparable(right));
const empty = (value: any) =>
  value == null || value === "" || (Array.isArray(value) && !value.length);
function at(value: any, path: string[]): any {
  for (const key of path)
    value = key.startsWith("@")
      ? Array.isArray(value)
        ? value.find((item) => identity(item) === key.slice(1))
        : undefined
      : value?.[key];
  return value;
}

export function reviewSourceChanges(
  previous: RecordValue | undefined,
  current: RecordValue,
  incoming: RecordValue,
): SourceChange[] {
  const changes: SourceChange[] = [];
  const visit = (old: any, next: any, path: string[]) => {
    let manualReview = false;
    if (equal(old, next)) return;
    if (Array.isArray(next) && (old === undefined || Array.isArray(old))) {
      const before = keyed(old || []),
        after = keyed(next);
      if (before && after) {
        for (const key of new Set([...before.keys(), ...after.keys()]))
          visit(before.get(key), after.get(key), [...path, `@${key}`]);
        return;
      }
      manualReview =
        next.some((item) => item && typeof item === "object") ||
        (old || []).some((item: any) => item && typeof item === "object");
    }
    const mounted = at(current, path);
    if (
      next &&
      typeof next === "object" &&
      !Array.isArray(next) &&
      ((old && typeof old === "object" && !Array.isArray(old)) ||
        (mounted && typeof mounted === "object" && !Array.isArray(mounted)))
    ) {
      for (const key of new Set([...Object.keys(old || {}), ...Object.keys(next)]))
        if (!ignored(key)) visit(old?.[key], next[key], [...path, key]);
      return;
    }
    // A newly discovered object is one reviewable addition. Existing host content
    // is a conflict even on older imports with no trustworthy baseline.
    const value = at(current, path);
    if (equal(value, next)) return;
    const kind = empty(next) ? "removed" : empty(old) ? "added" : "updated";
    const labels: Record<string, string> = {
      publicPageSections: "Event sections",
      advancedSections: "Event information",
      websiteImport: "Website information",
      travelAccommodation: "Hotels",
      startTime: "Start time",
      warmupTime: "Warm-up time",
      days: "Days",
      sessions: "Sessions",
      details: "Description",
      hostGym: "Host gym",
      rsvpName: "RSVP contact",
      rsvpEmail: "RSVP email",
      rsvpPhone: "RSVP phone",
    };
    changes.push({
      id: JSON.stringify(path),
      path,
      label: path
        .map((key) =>
          (labels[key] || key.replace(/^@/, "").replace(/([a-z])([A-Z])/g, "$1 $2")).replace(
            /^./,
            (letter) => letter.toUpperCase(),
          ),
        )
        .join(" › "),
      before: value,
      after: factual(next),
      kind,
      conflict: manualReview || (old === undefined ? !empty(value) : !equal(value, old)),
      ...(manualReview ? { manualReview: true } : {}),
    });
  };
  for (const key of new Set([...Object.keys(previous || {}), ...Object.keys(incoming)]))
    if (!ignored(key)) visit(previous?.[key], incoming[key], [key]);
  return changes;
}

/** Apply against the latest mounted value; reject changes edited since review. */
export function applySourceChanges<T extends RecordValue>(
  current: T,
  changes: SourceChange[],
  incoming?: RecordValue,
): T {
  const result = structuredClone(current);
  for (const change of changes) {
    if (change.kind === "removed") continue;
    if (change.manualReview)
      throw new Error(
        "These source rows cannot be matched reliably. Edit this collection manually to preserve existing items.",
      );
    if (!equal(at(result, change.path), change.before))
      throw new Error(
        "An event field changed while you reviewed updates. Review the latest changes again.",
      );
    let target: any = result;
    change.path.forEach((key, index) => {
      if (blocked.has(key) || key === "__proto__") throw new Error("Unsupported source field.");
      const last = index === change.path.length - 1;
      if (key.startsWith("@")) {
        if (!Array.isArray(target))
          throw new Error("The event collection changed. Check for updates again.");
        const found = target.findIndex((item) => identity(item) === key.slice(1));
        if (last) {
          if (found < 0) target.push(structuredClone(change.after));
          else
            target[found] = {
              ...target[found],
              ...structuredClone(change.after),
              id: target[found].id,
            };
        } else {
          if (found < 0) throw new Error("The event item changed. Check for updates again.");
          target = target[found];
        }
      } else if (last) target[key] = structuredClone(change.after);
      else target = target[key] ??= change.path[index + 1].startsWith("@") ? [] : {};
    });
  }
  // Accepted schedule fields retain the actual document evidence. Fresh parser
  // IDs must resolve to a retained source rather than a dangling importId.
  const schedule = result.advancedSections?.schedule;
  const fresh = incoming?.advancedSections?.schedule;
  if (schedule && fresh) {
    for (const change of changes) {
      if (
        change.kind === "removed" ||
        change.path[0] !== "advancedSections" ||
        change.path[1] !== "schedule"
      )
        continue;
      const collection = change.path.includes("sessions") ? "sessions" : "days";
      const position = change.path.indexOf(collection);
      if (position < 0 || !change.path[position + 1]?.startsWith("@")) continue;
      const prefix = change.path.slice(0, position + 2);
      const target = at(result, prefix),
        sourceItem = at(incoming, prefix);
      if (target && sourceItem?.source) target.source = { ...target.source, ...sourceItem.source };
    }
    const sources = [...(schedule.importSources || [])];
    const referenced = [
      ...(schedule.days || []),
      ...(schedule.days || []).flatMap((day: RecordValue) => day.sessions || []),
    ];
    for (const source of fresh.importSources || []) {
      const rows = referenced.filter((item: RecordValue) => item.source?.importId === source.id);
      if (!rows.length) continue;
      const retained = sources.find(
        (item) =>
          item.fileName === source.fileName && item.text === source.text && item.url === source.url,
      );
      if (retained) for (const row of rows) row.source = { ...row.source, importId: retained.id };
      else sources.push(structuredClone(source));
    }
    schedule.importSources = sources;
  }
  return result;
}

export function acceptedSourceBaseline(
  previous: RecordValue | undefined,
  changes: SourceChange[],
): RecordValue {
  const baseline = structuredClone(previous || {});
  for (const change of changes) {
    if (change.kind === "removed") continue;
    let target: any = baseline;
    change.path.forEach((key, index) => {
      if (blocked.has(key)) throw new Error("Unsupported source field.");
      const last = index === change.path.length - 1;
      if (key.startsWith("@")) {
        let item = target.find((entry: any) => identity(entry) === key.slice(1));
        if (!item) {
          item = { _sourceUpdateKey: key.slice(1) };
          target.push(item);
        }
        if (last) Object.assign(item, structuredClone(change.after));
        else target = item;
      } else if (last) target[key] = structuredClone(change.after);
      else target = target[key] ??= change.path[index + 1].startsWith("@") ? [] : {};
    });
  }
  return baseline;
}

/** Canonical facts from the actual mounted editor, including unsaved edits. */
export function snapshotSourceFacts(snapshot: RecordValue): RecordValue {
  if (snapshot.page) return informationSourceFacts(snapshot.page.details || {});
  const data = sourceRecord(snapshot.data);
  const facts = sourceFacts({
    ...data,
    title:
      data.eventTitle ??
      data.headlineTitle ??
      ("partner1" in data
        ? [data.partner1, data.partner2].filter(Boolean).join(" & ")
        : data.title),
    details:
      data.partyDetails?.notes ??
      data.babyDetails?.notes ??
      data.eventDetails?.notes ??
      data.story ??
      data.details,
    host: Array.isArray(data.hosts)
      ? data.hosts
          .map((host: RecordValue) => host.name)
          .filter(Boolean)
          .join(" & ")
      : (data.host ?? data.hostName),
    rsvpPhone: sourceRecord(data.rsvp).phone ?? data.rsvpPhone,
    rsvpEmail: sourceRecord(data.rsvp).email ?? data.rsvpEmail,
    registryLinks: data.registryLinks ?? data.registries ?? data.registry,
    advancedSections: snapshot.advancedState,
    discoverySource: snapshot.discoverySource,
  });
  if (snapshot.publicArtifacts?.sections)
    facts.publicPageSections = snapshot.publicArtifacts.sections;
  if (snapshot.pageComposition?.sections) facts.sections = snapshot.pageComposition.sections;
  return facts;
}

export function snapshotWithSourceFacts<T extends RecordValue>(snapshot: T, facts: RecordValue): T {
  const next: RecordValue = structuredClone(snapshot);
  const current = snapshotSourceFacts(snapshot);
  const changed = (key: string) => Object.hasOwn(facts, key) && !equal(current[key], facts[key]);
  if (next.page) {
    const details = next.page.details;
    for (const key of [...fields, "sections", "registryLinks"])
      if (changed(key) && !["address", "details", "hostGym", "city", "state"].includes(key))
        details[key] = facts[key];
    if (changed("address")) details.location = facts.address;
    if (changed("details")) details.description = facts.details;
  } else {
    const data = next.data;
    for (const key of fields) if (changed(key) && Object.hasOwn(data, key)) data[key] = facts[key];
    for (const key of ["eventTitle", "headlineTitle"])
      if (key in data && changed("title")) data[key] = facts.title;
    if ("partner1" in data && changed("title")) {
      data.partner1 = facts.title;
      data.partner2 = "";
    }
    if (changed("details")) {
      for (const key of ["partyDetails", "babyDetails", "eventDetails"])
        if (data[key]) data[key].notes = facts.details;
      if ("story" in data) data.story = facts.details;
    }
    if (changed("host")) {
      if ("hostName" in data) data.hostName = facts.host;
      if (Array.isArray(data.hosts)) {
        if (data.hosts.length > 1)
          throw new Error("This event has multiple hosts. Update their names in Event details.");
        data.hosts = [
          {
            ...data.hosts[0],
            id: data.hosts[0]?.id ?? crypto.randomUUID(),
            name: facts.host,
            role: data.hosts[0]?.role || "Host",
          },
        ];
      }
    }
    for (const [key, alias] of [
      ["rsvpPhone", "phone"],
      ["rsvpEmail", "email"],
    ])
      if (changed(key) && data.rsvp && typeof data.rsvp === "object") data.rsvp[alias] = facts[key];
    if (changed("registryLinks"))
      for (const key of ["registryLinks", "registry", "registries"])
        if (Array.isArray(data[key]))
          data[key] = facts.registryLinks.map((item: RecordValue) => ({
            ...item,
            ...(key !== "registryLinks" ? { id: item.id ?? crypto.randomUUID() } : {}),
          }));
    if (changed("advancedSections") && next.advancedState)
      next.advancedState = facts.advancedSections;
    if (next.discoverySource) {
      for (const key of ["websiteImport", "travelAccommodation", "publicPageSections"])
        if (changed(key)) next.discoverySource[key] = facts[key];
    }
    if (next.publicArtifacts && changed("publicPageSections"))
      next.publicArtifacts.sections = facts.publicPageSections;
    if (changed("sections")) {
      next.pageComposition ||= { version: 1, sections: [] };
      next.pageComposition.sections = facts.sections.map((section: RecordValue, index: number) => ({
        ...section,
        id: section.id || `info:source-${index}`,
      }));
    }
  }
  return next as T;
}
