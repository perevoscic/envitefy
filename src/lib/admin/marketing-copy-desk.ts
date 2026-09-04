export const COPY_DESK_CHANNELS = ["instagram", "facebook", "tiktok", "youtube"] as const;

export type CopyDeskChannel = (typeof COPY_DESK_CHANNELS)[number];

export type CopyDeskField = {
  key: string;
  label: string;
  value: string;
};

export type CopyDeskPack = {
  channel: CopyDeskChannel;
  label: string;
  shortLabel: string;
  fields: CopyDeskField[];
  copyAll: string;
};

export type MarketingCopyDesk = {
  available: boolean;
  source: "adapted" | "platform-packs";
  packs: CopyDeskPack[];
};

export type MarketingCopyDeskSource = {
  channels?: readonly string[] | null;
  socialCopy?: object | null;
  request?: object | null;
  brief?: object | null;
  frames?: object | null;
  preferStoredPacks?: boolean;
};

type JsonRecord = Record<string, string | number | boolean | object | null>;

const CHANNEL_META: Record<CopyDeskChannel, { label: string; shortLabel: string }> = {
  instagram: { label: "Instagram", shortLabel: "IG" },
  facebook: { label: "Facebook", shortLabel: "FB" },
  tiktok: { label: "TikTok", shortLabel: "TT" },
  youtube: { label: "YouTube", shortLabel: "YT" },
};

const VERTICAL_HASHTAGS: Record<string, string[]> = {
  birthday: ["#birthdayparty", "#birthdayinvite", "#partyplanning"],
  wedding: ["#weddingplanning", "#weddinginvite", "#rsvp"],
  gymnastics: ["#gymnastics", "#meetday", "#teamupdate"],
  football: ["#youthfootball", "#gameday", "#fridaynight"],
  dance: ["#dancestudio", "#recital", "#dancefamily"],
  ballet: ["#ballet", "#recital", "#dancestudio"],
  general: ["#eventplanning", "#rsvp"],
};

function clean(value: string | number | boolean | object | null | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

function asRecord(value: object | string | number | boolean | null | undefined): JsonRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as JsonRecord;
}

function asList(value: object | string | number | boolean | null | undefined): object[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is object => Boolean(entry) && typeof entry === "object");
}

function asStringArray(
  value: object | string | number | boolean | null | undefined | readonly string[],
) {
  if (!Array.isArray(value)) return [] as string[];
  const result: string[] = [];
  for (const entry of value) {
    if (typeof entry === "string" && entry.trim()) result.push(entry.trim());
  }
  return result;
}

function firstNonEmpty(values: string[]) {
  return values.find((value) => value.length > 0) || "";
}

export function isCopyDeskChannel(value: string): value is CopyDeskChannel {
  return (COPY_DESK_CHANNELS as readonly string[]).includes(value);
}

function uniqueStrings(values: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const normalized = value.trim();
    if (!normalized) continue;
    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(normalized);
  }
  return result;
}

function clipAtWord(text: string, max: number) {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  const slice = trimmed.slice(0, Math.max(0, max - 1));
  const lastSpace = slice.lastIndexOf(" ");
  const clipped = (lastSpace > Math.floor(max * 0.45) ? slice.slice(0, lastSpace) : slice).trim();
  return `${clipped.replace(/[,:;.-]+$/, "")}…`;
}

function sentenceCase(text: string) {
  const trimmed = text.trim().replace(/\s+/g, " ");
  if (!trimmed) return "";
  const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  return /[.!?]$/.test(capitalized) ? capitalized : `${capitalized}.`;
}

function titleCase(text: string) {
  return text
    .trim()
    .replace(/[^\w\s|/&:-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      if (/^envitefy$/i.test(word)) return "Envitefy";
      if (word === "|" || word === "-" || word === "&") return word;
      if (word.length <= 2 && word === word.toUpperCase()) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

function slugHashtag(value: string) {
  const compact = value.toLowerCase().replace(/[^a-z0-9]+/g, "");
  return compact ? `#${compact}` : "";
}

function splitHashtags(value: string) {
  return uniqueStrings(
    value
      .split(/[\s,]+/)
      .map((part) => {
        const tag = part.trim();
        if (!tag) return "";
        return tag.startsWith("#") ? tag : slugHashtag(tag);
      })
      .filter(Boolean),
  );
}

function campaignInputFrom(source: MarketingCopyDeskSource) {
  const request = asRecord(source.request);
  const input = asRecord(request?.input) || request || {};
  const brief = asRecord(source.brief) || {};
  const requestedChannels = asStringArray(source.channels).length
    ? asStringArray(source.channels)
    : asStringArray(input.channels);

  return {
    campaignName: clean(input.campaignName) || clean(input.jobLabel),
    channels: requestedChannels.map((value) => value.toLowerCase()),
    audience: clean(input.audience) || clean(brief.singleAudience) || clean(brief.audience),
    objective: clean(input.objective),
    productName: clean(input.productName) || "Envitefy",
    targetVertical: clean(input.targetVertical) || clean(brief.targetVertical),
    callToAction: clean(input.callToAction) || clean(brief.callToAction),
  };
}

function frameRecords(source: MarketingCopyDeskSource) {
  const framesRoot = asRecord(source.frames);
  const socialCopy = asRecord(source.socialCopy);
  const fromFrames = asList(framesRoot?.frames);
  const fromSocial = asList(socialCopy?.frames);
  const count = Math.max(fromFrames.length, fromSocial.length);
  const records: JsonRecord[] = [];
  for (let index = 0; index < count; index += 1) {
    const frame = asRecord(fromFrames[index]) || {};
    const socialFrame = asRecord(fromSocial[index]) || {};
    const caption = asRecord(frame.caption) || {};
    records.push({
      frameNumber: Number(frame.frameNumber || socialFrame.frameNumber || index + 1),
      title: clean(frame.title) || clean(socialFrame.title),
      actionBeat: clean(frame.actionBeat),
      text: clean(caption.text) || clean(socialFrame.text),
      voiceover: clean(caption.voiceover) || clean(socialFrame.voiceover),
      altText:
        clean(caption.altText) ||
        clean(frame.altText) ||
        clean(socialFrame.altText) ||
        clean(caption.alt) ||
        clean(frame.alt),
    });
  }
  return records;
}

function resolveChannels(requested: string[]): CopyDeskChannel[] {
  const selected = uniqueStrings(requested).filter(isCopyDeskChannel);
  return selected.length ? selected : [...COPY_DESK_CHANNELS];
}

function storedPackMap(socialCopy: JsonRecord | null) {
  const raw = asRecord(socialCopy?.platformPacks) || asRecord(socialCopy?.copyDesk);
  if (!raw) return null;
  const packs = new Map<CopyDeskChannel, Record<string, string>>();
  for (const channel of COPY_DESK_CHANNELS) {
    const pack = asRecord(raw[channel]);
    if (!pack) continue;
    const fields: Record<string, string> = {};
    for (const [key, value] of Object.entries(pack)) {
      const text = Array.isArray(value)
        ? uniqueStrings(value.map((entry) => clean(entry))).join(" ")
        : clean(value);
      if (text) fields[key] = text;
    }
    if (Object.keys(fields).length) packs.set(channel, fields);
  }
  return packs.size ? packs : null;
}

function verticalKey(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return "general";
  if (normalized.includes("birthday")) return "birthday";
  if (normalized.includes("wedding")) return "wedding";
  if (normalized.includes("gym")) return "gymnastics";
  if (normalized.includes("football")) return "football";
  if (normalized.includes("ballet")) return "ballet";
  if (normalized.includes("dance")) return "dance";
  return normalized.replace(/[^a-z0-9]+/g, "") || "general";
}

function buildHashtags(input: {
  campaignName: string;
  audience: string;
  targetVertical: string;
  productName: string;
  stored: string;
}) {
  if (input.stored) return splitHashtags(input.stored).join(" ");
  const vertical = verticalKey(input.targetVertical);
  const tags = [
    slugHashtag(input.productName) || "#envitefy",
    "#eventplanning",
    ...(VERTICAL_HASHTAGS[vertical] || VERTICAL_HASHTAGS.general),
    ...input.audience
      .split(/[,/]| and /i)
      .slice(0, 2)
      .map((part) => slugHashtag(part)),
    slugHashtag(input.campaignName),
  ];
  return uniqueStrings(tags).slice(0, 8).join(" ");
}

function buildYoutubeTags(input: {
  campaignName: string;
  audience: string;
  targetVertical: string;
  productName: string;
  stored: string;
}) {
  if (input.stored) {
    return uniqueStrings(
      input.stored
        .split(/[,]+/)
        .map((part) => part.replace(/^#/, "").trim())
        .filter(Boolean),
    ).join(", ");
  }
  return "";
}

function joinCopyAll(fields: CopyDeskField[]) {
  return fields
    .filter((field) => field.value)
    .map((field) => {
      if (field.key === "hashtags" || field.key === "tags") {
        return `${field.label}:\n${field.value}`;
      }
      if (field.key === "altText") return `Alt text:\n${field.value}`;
      return field.value;
    })
    .join("\n\n");
}

function makePack(
  channel: CopyDeskChannel,
  fieldMap: Array<{ key: string; label: string; value: string }>,
): CopyDeskPack {
  const fields = fieldMap.filter((field) => field.value);
  return {
    channel,
    label: CHANNEL_META[channel].label,
    shortLabel: CHANNEL_META[channel].shortLabel,
    fields,
    copyAll: joinCopyAll(fields),
  };
}

export function storedPlatformPacksFromCopyDesk(desk: MarketingCopyDesk) {
  const packs: Record<string, Record<string, string>> = {};
  for (const pack of desk.packs) {
    const fields: Record<string, string> = {};
    for (const field of pack.fields) {
      if (field.value) fields[field.key] = field.value;
    }
    packs[pack.channel] = fields;
  }
  return packs;
}

export function buildMarketingCopyDesk(source: MarketingCopyDeskSource = {}): MarketingCopyDesk {
  const campaign = campaignInputFrom(source);
  const socialCopy = asRecord(source.socialCopy);
  const storedPacks = source.preferStoredPacks === false ? null : storedPackMap(socialCopy);
  const frames = frameRecords(source);
  const hook = clean(socialCopy?.hook);
  const endCard = clean(socialCopy?.endCard);
  const headlines = uniqueStrings(frames.map((frame) => clean(frame.text)));
  const voiceovers = uniqueStrings(frames.map((frame) => clean(frame.voiceover)));
  const generatedAltText = firstNonEmpty([
    clean(socialCopy?.altText),
    clean(socialCopy?.alt),
    ...frames.map((frame) => clean(frame.altText)),
  ]);
  const generatedYoutubeTags = firstNonEmpty([
    clean(socialCopy?.youtubeTags),
    clean(socialCopy?.tags),
    Array.isArray(socialCopy?.youtubeTags)
      ? socialCopy.youtubeTags
          .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
          .filter(Boolean)
          .join(", ")
      : "",
  ]);
  const publishCaption = firstNonEmpty([
    voiceovers[0] || "",
    hook,
    headlines[0] || "",
    campaign.callToAction,
    endCard,
  ]);
  const cta = campaign.callToAction || endCard || "Start your event page at envitefy.com";
  const channels = resolveChannels(campaign.channels);
  const hasSourceCopy = Boolean(publishCaption || hook || endCard || storedPacks);
  if (!hasSourceCopy) {
    return { available: false, source: "adapted", packs: [] };
  }

  const instagramCaption = firstNonEmpty([
    clean(storedPacks?.get("instagram")?.caption),
    [
      hook && hook !== publishCaption ? hook : "",
      publishCaption,
      cta && !publishCaption.toLowerCase().includes(cta.toLowerCase()) ? cta : "",
    ]
      .filter(Boolean)
      .join("\n\n"),
  ]);

  const facebookBody = firstNonEmpty([
    clean(storedPacks?.get("facebook")?.postBody),
    uniqueStrings([
      sentenceCase(hook || headlines[0] || campaign.campaignName),
      ...voiceovers.map((line) => sentenceCase(line)),
      campaign.audience ? `Made for ${campaign.audience.replace(/\.$/, "")}.` : "",
      campaign.objective ? sentenceCase(campaign.objective) : "",
      `${sentenceCase(cta)} https://envitefy.com`,
    ]).join("\n\n"),
  ]);

  const tiktokCaption = firstNonEmpty([
    clean(storedPacks?.get("tiktok")?.caption),
    clipAtWord(
      uniqueStrings([hook || headlines[0] || publishCaption, cta]).join(" · "),
      150,
    ),
  ]);

  const youtubeTitle = clipAtWord(
    firstNonEmpty([
      clean(storedPacks?.get("youtube")?.title),
      `${titleCase(hook || campaign.campaignName || headlines[0] || "Envitefy")} | Envitefy`,
    ]),
    70,
  );

  const youtubeDescription = firstNonEmpty([
    clean(storedPacks?.get("youtube")?.description),
    uniqueStrings([
      sentenceCase(hook || campaign.campaignName),
      ...voiceovers.map((line) => sentenceCase(line)),
      sentenceCase(cta),
      "Create and share the event at https://envitefy.com",
    ]).join("\n\n"),
  ]);

  const instagramHashtags = buildHashtags({
    campaignName: campaign.campaignName,
    audience: campaign.audience,
    targetVertical: campaign.targetVertical,
    productName: campaign.productName,
    stored: clean(storedPacks?.get("instagram")?.hashtags),
  });

  const youtubeTags = buildYoutubeTags({
    campaignName: campaign.campaignName,
    audience: campaign.audience,
    targetVertical: campaign.targetVertical,
    productName: campaign.productName,
    stored: generatedYoutubeTags || clean(storedPacks?.get("youtube")?.tags),
  });

  const builders: Record<CopyDeskChannel, () => CopyDeskPack> = {
    instagram: () =>
      makePack("instagram", [
        { key: "caption", label: "Caption", value: instagramCaption },
        { key: "hashtags", label: "Hashtags", value: instagramHashtags },
        {
          key: "altText",
          label: "Alt text",
          value: generatedAltText || clean(storedPacks?.get("instagram")?.altText),
        },
      ]),
    facebook: () =>
      makePack("facebook", [{ key: "postBody", label: "Post body", value: facebookBody }]),
    tiktok: () => makePack("tiktok", [{ key: "caption", label: "Caption", value: tiktokCaption }]),
    youtube: () =>
      makePack("youtube", [
        { key: "title", label: "Title", value: youtubeTitle },
        { key: "description", label: "Description", value: youtubeDescription },
        { key: "tags", label: "Tags", value: youtubeTags },
      ]),
  };

  const packs = channels.map((channel) => builders[channel]()).filter((pack) => pack.fields.length);
  const usedStoredPrimary = Boolean(
    storedPacks &&
      packs.some((pack) => {
        const stored = storedPacks.get(pack.channel);
        if (!stored) return false;
        return pack.fields.some((field) => stored[field.key] && stored[field.key] === field.value);
      }),
  );

  return {
    available: packs.length > 0,
    source: usedStoredPrimary ? "platform-packs" : "adapted",
    packs,
  };
}
