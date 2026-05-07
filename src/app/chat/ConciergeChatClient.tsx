"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUp,
  Camera,
  Check,
  FileImage,
  Globe,
  IdCard,
  Loader2,
  MessageCircle,
  Mic,
  Paperclip,
  Sparkles,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, type ReactNode, useEffect, useRef, useState } from "react";
import { requestStudioGeneration } from "@/app/studio/studio-workspace-api";
import { buildInvitationData } from "@/app/studio/studio-workspace-builders";
import { createInitialDetails } from "@/app/studio/studio-workspace-sanitize";
import type {
  EventDetails,
  InvitationData,
  InviteCategory,
} from "@/app/studio/studio-workspace-types";
import { STUDIO_CATEGORY_TILES } from "@/app/studio/workspace/studio-category-tile-data";
import {
  cn,
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/ui/ai-prompt-box";
import BottomNavBar, { type BottomNavItem } from "@/components/ui/bottom-nav-bar";
import type {
  ConciergeActiveContext,
  ConciergeEventDraft,
  ConciergeEventMessageResponse,
  ConciergeEventType,
  ConciergeMessageResponse,
  ConciergeOcrContext,
  ConciergeWeatherContext,
  CreationChatMessageSnapshot,
  CreationSessionResumeResponse,
  RequestedOutput,
} from "@/lib/concierge/types";
import { savePendingSnapUpload } from "@/lib/pending-snap-upload";
import { getUploadAcceptAttribute } from "@/lib/upload-config";
import { createClientAttemptId, reportClientLog } from "@/utils/client-log";
import { buildEventProductPath } from "@/utils/event-product-route";
import { buildEventSlug } from "@/utils/event-url";
import { persistImageMediaValue, validateClientUploadFile } from "@/utils/media-upload-client";
import ChatProductPreview from "./ChatProductPreview";

type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  text: string;
  type?: "text" | "upload_status";
};

type ProductOption = {
  label: string;
  output: RequestedOutput;
  description: string;
  prompt: string;
  icon: BottomNavItem["icon"];
};

type ConciergePhase =
  | "intake_empty"
  | "collecting_details"
  | "ready_to_generate"
  | "generating_card"
  | "card_ready"
  | "editing_card";

type LiveCardSummary = {
  headline: string;
  subheadline: string;
  scheduleLine: string;
  locationLine: string;
  outputs: string[];
};

type GeneratedInvitePayload = {
  imageUrl: string;
  invitationData: InvitationData;
};

type RsvpPreviewResponse = {
  name: string | null;
  email: string | null;
  response: "yes" | "no" | "maybe" | string;
  updatedAt: string | null;
};

type RsvpPreviewState = {
  stats: {
    yes: number;
    no: number;
    maybe: number;
  };
  filled: number;
  remaining: number;
  numberOfGuests: number;
  responses: RsvpPreviewResponse[];
  isLoading: boolean;
  error: string | null;
};

const EMPTY_RSVP_PREVIEW: RsvpPreviewState = {
  stats: { yes: 0, no: 0, maybe: 0 },
  filled: 0,
  remaining: 0,
  numberOfGuests: 0,
  responses: [],
  isLoading: false,
  error: null,
};

const PRODUCT_OPTIONS: ProductOption[] = [
  {
    label: "Live Card",
    output: "live_card",
    description: "Animated invite with RSVP and guest actions.",
    prompt: "Create a live card",
    icon: IdCard,
  },
  {
    label: "Flyer/Invitation",
    output: "digital_flyer",
    description: "Shareable flyer invitation from typed details.",
    prompt: "Create a flyer invitation",
    icon: FileImage,
  },
  {
    label: "Event Page",
    output: "event_page",
    description: "Hosted page for details, links, and updates.",
    prompt: "Create an event page",
    icon: Globe,
  },
];

const CREATION_INTAKE_URL = "/api/creation/intake";
const CREATION_INTAKE_STREAM_URL = "/api/creation/intake/stream";
const ENABLE_CONCIERGE_TIMING = process.env.NEXT_PUBLIC_CONCIERGE_TIMING === "1";

const BUILDING_STEPS = [
  "Checking the event details",
  "Generating the invite artwork",
  "Creating RSVP and sharing links",
  "Finalizing the public invite",
];

const OUTPUT_LABELS: Record<RequestedOutput, string> = {
  event_page: "Event page",
  live_card: "Live card",
  digital_flyer: "Flyer/Invitation",
  signup_form: "Smart sign-up",
  invitation: "Flyer/Invitation",
  rsvp_page: "RSVP page",
  whatsapp: "WhatsApp",
  text_message: "Text message",
  printable_flyer: "Printable flyer",
  instagram_story: "Story",
  reminder: "Reminder",
  thank_you_card: "Thank you card",
  menu: "Menu",
  welcome_sign: "Welcome sign",
};

const EMPTY_ASSISTANT_PROMPT = "What are we celebrating?";

type ConciergeChatClientProps = {
  userFirstName?: string | null;
};

type ConciergeStreamStatePayload = Extract<ConciergeMessageResponse, { ok: true }>;

type ConciergeStreamHandlers = {
  onDelta: (text: string) => void;
  onAssistantDone: (message: string) => void;
  onState: (state: ConciergeStreamStatePayload) => void;
};

type FailedConciergeRequest = {
  message: string;
  action?: "message" | "chip" | "starter_category" | "ocr_result";
  ocrContext?: ConciergeOcrContext | null;
  activeContext?: ConciergeActiveContext | null;
  requestedOutputs?: RequestedOutput[];
  starterCategory?: string | null;
  echo?: string;
  suppressUserEcho?: boolean;
  error: string;
};

function withConciergeTiming(url: string) {
  if (!ENABLE_CONCIERGE_TIMING) return url;
  return `${url}${url.includes("?") ? "&" : "?"}timing=1`;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function publicizeAssistantBubbleText(text: string) {
  return Object.entries(OUTPUT_LABELS).reduce(
    (current, [output, label]) =>
      current.replace(new RegExp(`\\b${escapeRegExp(output)}\\b`, "g"), label),
    text,
  );
}

function stripAssistantTestNamePrefixes(text: string, detailsDraft?: ConciergeEventDraft | null) {
  const name = detailsDraft?.honoreeName?.replace(/\s+/g, " ").trim();
  if (!name) return text;
  return text.replace(new RegExp(`\\b(?:QA|test)\\s+(${escapeRegExp(name)})\\b`, "gi"), "$1");
}

function sanitizeAssistantBubbleText(text: string, detailsDraft?: ConciergeEventDraft | null) {
  return publicizeAssistantBubbleText(stripAssistantTestNamePrefixes(text, detailsDraft))
    .replace(/^\s*\*{3,}\s*$/gm, "")
    .replace(/\*{1,3}([^*\n]+?)\*{1,3}/g, "$1")
    .replace(/\*{2,}/g, "")
    .replace(/__([^_\n]+?)__/g, "$1")
    .replace(
      /([.!])\s+(?=(?:Who|What|When|Where|Which|Why|How|Do|Does|Did|Can|Could|Would|Will|Should|Is|Are|Was|Were|Have|Has)\b)/g,
      "$1\n",
    )
    .replace(/\?\s+(?=\S)/g, "?\n")
    .replace(/\n{3,}/g, "\n\n");
}

const DETAIL_CONFIRMATION_LINE =
  /^(Selected products?|Products?|Captured details?|Event|Title|Names|Couple|Honoree|Date|Time|Location|Venue|Theme|Vibe|RSVP(?: guest count| by| deadline| line)?|Guest count):\s*(.+)$/i;

function assistantDetailHighlightValues(detailsDraft?: ConciergeEventDraft | null) {
  if (!detailsDraft) return [];
  const themeValue =
    typeof detailsDraft.theme === "string" ? detailsDraft.theme.replace(/\s+/g, " ").trim() : "";
  const toneValue =
    typeof detailsDraft.tone === "string" ? detailsDraft.tone.replace(/\s+/g, " ").trim() : "";
  const values = [
    detailsDraft.honoreeName,
    detailsDraft.title,
    detailsDraft.dateText,
    detailsDraft.dateText?.replace(/^on\s+/i, ""),
    detailsDraft.timeText,
    detailsDraft.location,
    detailsDraft.venue,
    themeValue,
    themeValue && !/\btheme$/i.test(themeValue) ? `${themeValue} theme` : null,
    toneValue,
    toneValue && !/\btheme$/i.test(toneValue) ? `${toneValue} theme` : null,
    typeof detailsDraft.numberOfGuests === "number" ? String(detailsDraft.numberOfGuests) : null,
  ]
    .map((value) => (typeof value === "string" ? value.replace(/\s+/g, " ").trim() : null))
    .filter((value): value is string => Boolean(value && value.length >= 3))
    .filter((value) => !/^(?:yes|no|rsvp|tbd|date tbd|location tbd)$/i.test(value));

  return Array.from(new Set(values)).sort((left, right) => right.length - left.length);
}

function renderHighlightedAssistantLine(
  line: string,
  detailsDraft?: ConciergeEventDraft | null,
): ReactNode {
  const values = assistantDetailHighlightValues(detailsDraft);
  if (!values.length) return line;
  const lowerValues = new Set(values.map((value) => value.toLowerCase()));
  const parts = line.split(new RegExp(`(${values.map(escapeRegExp).join("|")})`, "gi"));
  return parts.map((part, index) =>
    lowerValues.has(part.toLowerCase()) ? (
      <strong key={`${part}-${index}`} className="font-semibold text-[#150d2b]">
        {part}
      </strong>
    ) : (
      part
    ),
  );
}

function formatAssistantBubbleText(text: string, detailsDraft?: ConciergeEventDraft | null) {
  const lines = sanitizeAssistantBubbleText(text, detailsDraft).split(/\n/);
  return lines.map((line, index) => {
    if (!line.trim()) return <br key={`break-${index}`} />;
    const detail = line.match(DETAIL_CONFIRMATION_LINE);
    if (detail) {
      return (
        <span key={`${line}-${index}`} className="block">
          <span className="font-medium text-[#5f5289]">{detail[1]}:</span>{" "}
          <strong className="font-semibold text-[#150d2b]">{detail[2]}</strong>
        </span>
      );
    }
    return (
      <span key={`${line}-${index}`} className="block">
        {renderHighlightedAssistantLine(line, detailsDraft)}
      </span>
    );
  });
}

function parseConciergeStreamEvent(rawEvent: string) {
  let event = "message";
  const dataLines: string[] = [];
  for (const line of rawEvent.split(/\r?\n/)) {
    if (line.startsWith("event:")) {
      event = line.slice("event:".length).trim();
    } else if (line.startsWith("data:")) {
      dataLines.push(line.slice("data:".length).trimStart());
    }
  }
  const dataText = dataLines.join("\n");
  if (!dataText) return { event, data: null };
  try {
    return { event, data: JSON.parse(dataText) as Record<string, any> };
  } catch {
    return { event, data: null };
  }
}

async function readConciergeIntakeStream(response: Response, handlers: ConciergeStreamHandlers) {
  if (!response.body) throw new Error("Concierge stream did not include a response body.");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let finalState: ConciergeStreamStatePayload | null = null;

  const processRawEvent = (rawEvent: string) => {
    const parsed = parseConciergeStreamEvent(rawEvent);
    const data = parsed.data;
    if (parsed.event === "assistant_delta" && typeof data?.text === "string") {
      handlers.onDelta(data.text);
      return;
    }
    if (parsed.event === "assistant_done" && typeof data?.assistantMessage === "string") {
      handlers.onAssistantDone(data.assistantMessage);
      return;
    }
    if (parsed.event === "state" && data?.ok === true && data.draft) {
      finalState = data as ConciergeStreamStatePayload;
      handlers.onState(finalState);
      return;
    }
    if (parsed.event === "error") {
      throw new Error(typeof data?.error === "string" ? data.error : "Concierge stream failed.");
    }
  };

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split(/\n\n/);
    buffer = events.pop() || "";
    for (const rawEvent of events) {
      if (rawEvent.trim()) processRawEvent(rawEvent);
    }
  }
  buffer += decoder.decode();
  if (buffer.trim()) processRawEvent(buffer);
  return finalState;
}

function buildInitialAssistantPrompt(userFirstName?: string | null) {
  const cleaned = typeof userFirstName === "string" ? userFirstName.trim() : "";
  if (!cleaned) return EMPTY_ASSISTANT_PROMPT;
  return `Hi ${cleaned}, what are we celebrating?`;
}

function isOpeningAssistantPrompt(text: string, initialAssistantPrompt: string) {
  return text === initialAssistantPrompt || text === EMPTY_ASSISTANT_PROMPT;
}

const CHAT_STARTER_PROMPTS = ["Birthday", "Wedding", "Baby Shower", "Game Day", "Bridal Shower"];

const PREVIEW_CATEGORY_BY_EVENT_TYPE: Partial<Record<ConciergeEventType, string>> = {
  birthday: "Birthday",
  wedding: "Wedding",
  baby_shower: "Baby Shower",
  gender_reveal: "Baby Shower",
  bridal_shower: "Bridal Shower",
  gym_meet: "Game Day",
  game_day: "Game Day",
  football: "Game Day",
  sport_event: "Game Day",
  field_trip: "Field Trip/Day",
  open_house: "Open House",
  housewarming: "Housewarming",
  graduation: "Custom Invite",
  appointment: "Custom Invite",
  workshop: "Custom Invite",
  special_event: "Custom Invite",
  smart_signup: "Custom Invite",
  general: "Custom Invite",
};

function studioStarterImagePath(categoryName: string) {
  return (
    STUDIO_CATEGORY_TILES.find((category) => category.name === categoryName)?.imagePath ||
    "/studio/custom-invite.webp"
  );
}

const CELEBRATION_STARTER_TILES = [
  {
    label: "Birthday",
    prompt: CHAT_STARTER_PROMPTS[0],
    imagePath: studioStarterImagePath("Birthday"),
    size: "wide",
  },
  {
    label: "Wedding",
    prompt: CHAT_STARTER_PROMPTS[1],
    imagePath: studioStarterImagePath("Wedding"),
    size: "desktopWide",
  },
  {
    label: "Game Day",
    prompt: CHAT_STARTER_PROMPTS[3],
    imagePath: studioStarterImagePath("Game Day"),
    size: "square",
  },
  {
    label: "Baby Shower",
    prompt: CHAT_STARTER_PROMPTS[2],
    imagePath: studioStarterImagePath("Baby Shower"),
    size: "desktopWide",
  },
  {
    label: "Bridal Shower",
    prompt: CHAT_STARTER_PROMPTS[4],
    imagePath: studioStarterImagePath("Bridal Shower"),
    size: "square",
  },
] as const;

type CelebrationStarterTile = (typeof CELEBRATION_STARTER_TILES)[number];

function newMessage(
  role: ChatMessage["role"],
  text: string,
  type: ChatMessage["type"] = "text",
): ChatMessage {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role,
    text,
    type,
  };
}

function chatMessageFromSnapshot(message: CreationChatMessageSnapshot): ChatMessage {
  return {
    id: message.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role: message.role,
    text: message.text,
    type: "text",
  };
}

function chatMessagesForPersistence(
  current: ChatMessage[],
  pending: ChatMessage[] = [],
): CreationChatMessageSnapshot[] {
  return [...current, ...pending]
    .filter((message) => message.type !== "upload_status" && message.text.trim())
    .slice(-50)
    .map((message) => ({
      id: message.id,
      role: message.role,
      text: message.text.slice(0, 4000),
      type: "text",
    }));
}

function cleanNumber(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function normalizeRsvpPreview(payload: any): RsvpPreviewState {
  const statsRecord = payload?.stats && typeof payload.stats === "object" ? payload.stats : {};
  const responses = Array.isArray(payload?.responses) ? payload.responses : [];
  return {
    stats: {
      yes: cleanNumber(statsRecord.yes),
      no: cleanNumber(statsRecord.no),
      maybe: cleanNumber(statsRecord.maybe),
    },
    filled: cleanNumber(payload?.filled),
    remaining: cleanNumber(payload?.remaining),
    numberOfGuests: cleanNumber(payload?.numberOfGuests),
    responses: responses.slice(0, 20).map((row: any) => ({
      name: stringValue(row?.name) || stringValue(row?.firstName) || null,
      email: stringValue(row?.email),
      response: typeof row?.response === "string" ? row.response : "maybe",
      updatedAt: stringValue(row?.updatedAt) || stringValue(row?.updated_at),
    })),
    isLoading: false,
    error: null,
  };
}

function isReadyProductDraft(draft: ConciergeEventDraft | null) {
  return isReadyCreationDraft(draft);
}

function isReadyCreationDraft(draft: ConciergeEventDraft | null) {
  return Boolean(
    draft?.requestedOutputs.length &&
      draft.draftStatus === "preview_ready" &&
      !draft.currentQuestion &&
      draft.missingFields.length === 0,
  );
}

function draftHeadline(draft: ConciergeEventDraft | null) {
  return draft?.previewCopy.headline || draft?.title || draft?.eventPurpose || "Event draft";
}

function draftSubheadline(draft: ConciergeEventDraft | null) {
  return draft?.previewCopy.subheadline || draft?.theme || "Details coming together";
}

function draftScheduleLine(draft: ConciergeEventDraft | null) {
  return draft?.previewCopy.scheduleLine || draft?.dateText || draft?.startISO || "Date TBD";
}

function draftLocationLine(draft: ConciergeEventDraft | null) {
  return draft?.previewCopy.locationLine || draft?.venue || draft?.location || "Location TBD";
}

function outputLabel(output: RequestedOutput) {
  return OUTPUT_LABELS[output] || output;
}

function visibleProductOutput(output: RequestedOutput): RequestedOutput {
  return output === "invitation" ? "digital_flyer" : output;
}

function visibleDraftOutput(output: ConciergeEventDraft["outputs"][number]) {
  return output === "invitation" ? "digital_flyer" : output;
}

function normalizeDraftProductOutputs(draft: ConciergeEventDraft): ConciergeEventDraft {
  const requestedOutputs = Array.from(new Set(draft.requestedOutputs.map(visibleProductOutput)));
  const outputs = Array.from(new Set(draft.outputs.map(visibleDraftOutput)));
  const changed =
    requestedOutputs.length !== draft.requestedOutputs.length ||
    requestedOutputs.some((output, index) => output !== draft.requestedOutputs[index]) ||
    outputs.length !== draft.outputs.length ||
    outputs.some((output, index) => output !== draft.outputs[index]);

  return changed
    ? {
        ...draft,
        requestedOutputs,
        outputs,
      }
    : draft;
}

function productOptionLabel(output: RequestedOutput) {
  const visibleOutput = visibleProductOutput(output);
  return (
    PRODUCT_OPTIONS.find((option) => option.output === visibleOutput)?.label ||
    outputLabel(visibleOutput)
  );
}

function categoryLabelForDraft(draft: ConciergeEventDraft | null) {
  if (!draft || draft.eventType === "unknown" || draft.eventType === "general") return null;
  return PREVIEW_CATEGORY_BY_EVENT_TYPE[draft.eventType] || null;
}

function previewImageForDraft(draft: ConciergeEventDraft | null) {
  const categoryLabel =
    (draft?.eventType && PREVIEW_CATEGORY_BY_EVENT_TYPE[draft.eventType]) || "Custom Invite";
  return (
    STUDIO_CATEGORY_TILES.find((category) => category.name === categoryLabel)?.imagePath ||
    "/studio/upload-your-own.webp"
  );
}

function generatedProductHref(
  eventId: string | null,
  selectedOutput: RequestedOutput,
  _rsvpEnabled?: boolean | null,
) {
  if (!eventId) return null;
  return buildEventProductPath({ eventId, output: selectedOutput });
}

function draftOutputLabels(draft: ConciergeEventDraft | null, selectedOutput: RequestedOutput) {
  const outputs = draft?.requestedOutputs?.length ? draft.requestedOutputs : [selectedOutput];
  return Array.from(new Set(outputs.map(outputLabel)));
}

function hasMultipleRequestedProducts(draft: ConciergeEventDraft | null) {
  return Boolean(
    draft?.requestedOutputs && new Set(draft.requestedOutputs.map(visibleProductOutput)).size > 1,
  );
}

function productActionLabel(draft: ConciergeEventDraft | null, selectedOutput: RequestedOutput) {
  return hasMultipleRequestedProducts(draft) ? "products" : outputLabel(selectedOutput);
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function recordValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function firstStringValue(...values: unknown[]) {
  for (const value of values) {
    const text = stringValue(value);
    if (text) return text;
  }
  return null;
}

function uniqueDisplayLine(...values: unknown[]) {
  const parts = values.map(stringValue).filter((value): value is string => Boolean(value));
  return parts.filter((value, index) => parts.indexOf(value) === index).join(", ") || null;
}

function outputLabelsFromUnknown(value: unknown, fallback: string[]) {
  const raw = Array.isArray(value) ? value : [];
  const labels = raw
    .map((item) => stringValue(item))
    .filter((item): item is string => Boolean(item))
    .map((item) => outputLabel(item as RequestedOutput));
  return labels.length ? Array.from(new Set(labels)) : fallback;
}

function studioCategoryForDraft(draft: ConciergeEventDraft): InviteCategory {
  if (draft.eventType === "birthday") return "Birthday";
  if (draft.eventType === "wedding") return "Wedding";
  if (draft.eventType === "baby_shower" || draft.eventType === "gender_reveal") {
    return "Baby Shower";
  }
  if (draft.eventType === "bridal_shower") return "Bridal Shower";
  if (draft.eventType === "field_trip") return "Field Trip/Day";
  if (draft.eventType === "open_house") return "Open House";
  if (draft.eventType === "housewarming") return "Housewarming";
  if (
    draft.eventType === "gym_meet" ||
    draft.eventType === "game_day" ||
    draft.eventType === "football" ||
    draft.eventType === "sport_event"
  ) {
    return "Game Day";
  }
  return "Custom Invite";
}

function dateInputFromDraft(draft: ConciergeEventDraft): string {
  const startISO = stringValue(draft.startISO);
  const localDate = localDateInputFromIso(startISO, draft.timezone);
  if (localDate) return localDate;
  return stringValue(draft.dateText) || "";
}

function localDateInputFromIso(value: string | null, timeZone?: string | null): string {
  const raw = stringValue(value);
  if (!raw || !/^\d{4}-\d{2}-\d{2}/.test(raw)) return "";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw.slice(0, 10);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: stringValue(timeZone) || undefined,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  return year && month && day ? `${year}-${month}-${day}` : raw.slice(0, 10);
}

function timeInputFromDraft(value: string | null): string {
  const raw = stringValue(value);
  if (!raw) return "";
  const date = new Date(raw);
  if (!Number.isNaN(date.getTime()) && /^\d{4}-\d{2}-\d{2}/.test(raw)) {
    return date.toTimeString().slice(0, 5);
  }
  return raw;
}

function buildStudioDetailsFromDraft(draft: ConciergeEventDraft): EventDetails {
  const category = studioCategoryForDraft(draft);
  const details = createInitialDetails();
  const headline = draftHeadline(draft);
  const body =
    stringValue(draft.previewCopy.body) ||
    stringValue(draft.eventPurpose) ||
    `Join us for ${headline}.`;
  const venueName = stringValue(draft.venue) || "";
  const location = stringValue(draft.location) || venueName;
  const honoreeName = stringValue(draft.honoreeName) || "";
  const theme = stringValue(draft.theme) || stringValue(draft.tone) || `${category} invite`;
  const registryLink = stringValue(draft.registryLink) || stringValue(draft.giftRegistryLink) || "";
  const giftPreferenceNote =
    stringValue(draft.giftPreferenceNote) || stringValue(draft.giftNote) || "";
  const rsvpEnabled = draft.rsvpEnabled === true;
  const rsvpContact = stringValue(draft.rsvpContact) || "";
  const rsvpName = stringValue(draft.rsvpName) || (rsvpEnabled ? "Host" : "");
  const isEventPageProduct = draft.requestedOutputs.includes("event_page");

  return {
    ...details,
    category,
    eventTitle: headline,
    eventDate: dateInputFromDraft(draft),
    startTime: stringValue(draft.timeText) || timeInputFromDraft(draft.startISO),
    endTime: timeInputFromDraft(draft.endISO),
    venueName,
    location,
    detailsDescription: body,
    message: draftSubheadline(draft),
    specialInstructions: isEventPageProduct
      ? "Generate website hero/background artwork for the event page. Do not bake large title text, date/time, address, faux buttons, phone chrome, or website UI into the image because the event page renders real navigation, headings, schedule, location, RSVP form, calendar actions, and registry links in HTML."
      : "",
    theme,
    style: stringValue(draft.tone) || "",
    visualPreferences: theme,
    name: category === "Birthday" ? honoreeName : "",
    age: category === "Birthday" ? stringValue(draft.ageOrMilestone) || "" : "",
    honoreeNames: category !== "Birthday" ? honoreeName : "",
    coupleNames: category === "Wedding" ? honoreeName : "",
    mainPerson: honoreeName,
    occasion: stringValue(draft.eventPurpose) || category,
    audience: "Guests",
    rsvpName,
    rsvpContact,
    rsvpDeadline: stringValue(draft.rsvpDeadline) || "",
    registryLink,
    giftPreferenceNote,
  };
}

function historyInviteImageFromEventData(data: Record<string, unknown>): string | null {
  const studioCard = recordValue(data.studioCard);
  return firstStringValue(
    studioCard.imageUrl,
    data.coverImageUrl,
    data.thumbnail,
    data.heroImage,
    data.customHeroImage,
  );
}

function liveCardSummaryFromDraft(
  draft: ConciergeEventDraft | null,
  selectedOutput: RequestedOutput,
): LiveCardSummary {
  return {
    headline: draftHeadline(draft),
    subheadline: draftSubheadline(draft),
    scheduleLine: draftScheduleLine(draft),
    locationLine: draftLocationLine(draft),
    outputs: draftOutputLabels(draft, selectedOutput),
  };
}

function liveCardSummaryFromEvent(
  event: { title: string; data: Record<string, unknown> },
  fallback: LiveCardSummary,
): LiveCardSummary {
  const data = recordValue(event.data);
  const liveCard = recordValue(data.liveCard);
  const publicEvent = recordValue(data.publicEvent);
  const previewCopy = recordValue(data.previewCopy);
  const theme = stringValue(data.theme);
  const dateText = firstStringValue(data.dateText, data.date);
  const timeText = firstStringValue(data.timeText, data.time);
  const scheduleLine =
    firstStringValue(
      liveCard.scheduleLine,
      publicEvent.scheduleLine,
      previewCopy.scheduleLine,
      data.whenLabel,
      data.scheduleLine,
    ) ||
    (dateText && timeText && !dateText.toLowerCase().includes(timeText.toLowerCase())
      ? `${dateText} at ${timeText}`
      : dateText || timeText || fallback.scheduleLine);
  const locationLine =
    firstStringValue(
      liveCard.locationLine,
      publicEvent.locationLine,
      previewCopy.locationLine,
      data.locationLabel,
    ) ||
    uniqueDisplayLine(data.venue ?? data.placeName, data.location ?? data.address) ||
    fallback.locationLine;

  return {
    headline:
      firstStringValue(liveCard.headline, publicEvent.headline, event.title) || fallback.headline,
    subheadline:
      firstStringValue(
        liveCard.subheadline,
        publicEvent.subheadline,
        previewCopy.subheadline,
        theme ? `${theme} theme` : null,
      ) || fallback.subheadline,
    scheduleLine,
    locationLine,
    outputs: outputLabelsFromUnknown(data.requestedOutputs ?? data.outputs, fallback.outputs),
  };
}

function notifyCreationThreadsChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("envitefy:creation-threads-changed"));
}

export default function ConciergeChatClient({ userFirstName = null }: ConciergeChatClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialAssistantPrompt = buildInitialAssistantPrompt(userFirstName);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const mainRef = useRef<HTMLElement | null>(null);
  const chatPaneRef = useRef<HTMLDivElement | null>(null);
  const composerCardRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [input, setInput] = useState("");
  const [selectedProductOutput, setSelectedProductOutput] = useState<RequestedOutput | null>(null);
  const [selectedStarterCategory, setSelectedStarterCategory] =
    useState<CelebrationStarterTile | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    newMessage("assistant", initialAssistantPrompt),
  ]);
  const [phase, setPhase] = useState<ConciergePhase>("intake_empty");
  const [draft, setDraft] = useState<ConciergeEventDraft | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isStreamingAssistant, setIsStreamingAssistant] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [buildProgress, setBuildProgress] = useState(0);
  const [liveCardEventId, setLiveCardEventId] = useState<string | null>(null);
  const [liveCardTitle, setLiveCardTitle] = useState<string | null>(null);
  const [liveCardSummary, setLiveCardSummary] = useState<LiveCardSummary | null>(null);
  const [generatedInviteImageUrl, setGeneratedInviteImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [failedRequest, setFailedRequest] = useState<FailedConciergeRequest | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [mobileView, setMobileView] = useState<"chat" | "preview">("chat");
  const [rsvpPreview, setRsvpPreview] = useState<RsvpPreviewState>(EMPTY_RSVP_PREVIEW);
  const [weatherContext, setWeatherContext] = useState<ConciergeWeatherContext | null>(null);
  const [isReadyChatComposerOpen, setIsReadyChatComposerOpen] = useState(false);

  const isGeneratingCard = phase === "generating_card";
  const isEditingGeneratedCard = phase === "editing_card";
  const isEmptyState =
    phase === "intake_empty" &&
    messages.length === 1 &&
    messages[0]?.role === "assistant" &&
    !draft &&
    !isSending &&
    !isUploading;
  const visibleMessages = messages.filter((message, index) => {
    if (message.type !== "upload_status" && !message.text.trim()) {
      return false;
    }

    return !(
      index === 0 &&
      message.role === "assistant" &&
      isOpeningAssistantPrompt(message.text, initialAssistantPrompt)
    );
  });
  const isBusy = isSending || isUploading || isGeneratingCard;
  const busyLabel = isUploading
    ? "Preparing upload"
    : isEditingGeneratedCard
      ? "Updating preview"
      : isGeneratingCard
        ? "Generating invite"
        : "Concierge is thinking...";
  const isThinking = busyLabel === "Concierge is thinking..." && !isStreamingAssistant;
  const selectedStarterLabel = selectedStarterCategory?.label || null;
  const hasStarterCategorySelection = Boolean(selectedStarterLabel);
  const currentBuildStep = Math.min(
    Math.floor((buildProgress / 100) * BUILDING_STEPS.length),
    BUILDING_STEPS.length - 1,
  );
  const effectiveSelectedProductOutput = selectedProductOutput || "live_card";
  const effectiveSelectedProductLabel = productActionLabel(draft, effectiveSelectedProductOutput);
  const currentLiveCardSummary =
    liveCardSummary || liveCardSummaryFromDraft(draft, effectiveSelectedProductOutput);
  const previewTitle = liveCardTitle || currentLiveCardSummary.headline;
  const canGenerateProduct = isReadyProductDraft(draft) && !isBusy && !liveCardEventId;
  const shouldShowProductPanel =
    Boolean(draft) ||
    phase === "ready_to_generate" ||
    phase === "generating_card" ||
    phase === "card_ready" ||
    phase === "editing_card" ||
    Boolean(liveCardEventId);
  const liveCardPublicHref = generatedProductHref(
    liveCardEventId,
    effectiveSelectedProductOutput,
    draft?.rsvpEnabled,
  );
  const threadId = searchParams.get("thread")?.trim() || null;
  const currentPreviewImage = generatedInviteImageUrl || previewImageForDraft(draft);
  const hasInitialEventContext =
    Boolean(draft) || visibleMessages.some((message) => message.role === "user");
  const shouldShowProductFormatTiles =
    !liveCardEventId &&
    Boolean(draft) &&
    !draft?.requestedOutputs.length &&
    !isBusy &&
    !isEmptyState &&
    hasInitialEventContext;
  const rsvpResponseNames = rsvpPreview.responses.map(
    (response) => response.name || response.email || "Guest",
  );
  const rsvpResponseCount =
    rsvpPreview.stats.yes + rsvpPreview.stats.no + rsvpPreview.stats.maybe ||
    rsvpResponseNames.length ||
    rsvpPreview.filled;
  const shouldShowReadyActions =
    (canGenerateProduct || isGeneratingCard) && (!isReadyChatComposerOpen || isGeneratingCard);
  function selectProductOutputForDraft(nextDraft: ConciergeEventDraft) {
    const restoredOutput = nextDraft.requestedOutputs
      .map(visibleProductOutput)
      .find((output) => PRODUCT_OPTIONS.some((option) => option.output === output));
    if (restoredOutput) setSelectedProductOutput(restoredOutput);
  }

  function resetConversation() {
    setInput("");
    setError(null);
    setDraft(null);
    setPhase("intake_empty");
    setIsStreamingAssistant(false);
    setLiveCardEventId(null);
    setLiveCardTitle(null);
    setLiveCardSummary(null);
    setGeneratedInviteImageUrl(null);
    setBuildProgress(0);
    setRsvpPreview(EMPTY_RSVP_PREVIEW);
    setSelectedProductOutput(null);
    setSelectedStarterCategory(null);
    setFailedRequest(null);
    setWeatherContext(null);
    setMobileView("chat");
    setIsReadyChatComposerOpen(false);
    setMessages([newMessage("assistant", initialAssistantPrompt)]);
  }

  function focusComposerAtEnd() {
    window.requestAnimationFrame(() => {
      const textarea = composerCardRef.current?.querySelector("textarea");
      if (!textarea) return;
      textarea.focus();
      const end = textarea.value.length;
      textarea.setSelectionRange(end, end);
    });
  }

  function selectionPrefix(categoryLabel: string | null, productOutput: RequestedOutput | null) {
    return [categoryLabel, productOutput ? productOptionLabel(productOutput) : null]
      .filter(Boolean)
      .join(" ");
  }

  function updateComposerSelection(
    nextCategoryLabel: string | null,
    nextProductOutput: RequestedOutput | null,
  ) {
    const previousPrefix = selectionPrefix(
      selectedStarterCategory?.label || categoryLabelForDraft(draft),
      selectedProductOutput,
    );
    const nextPrefix = selectionPrefix(nextCategoryLabel, nextProductOutput);
    if (!nextPrefix) return;

    setInput((current) => {
      const trimmed = current.trimStart();
      const previousMatches =
        previousPrefix && trimmed.toLowerCase().startsWith(previousPrefix.toLowerCase());
      const suffix = previousMatches ? trimmed.slice(previousPrefix.length).trimStart() : trimmed;
      return [nextPrefix, suffix].filter(Boolean).join(" ");
    });
  }

  function handleComposerValueChange(nextValue: string) {
    setInput(nextValue);
    if (nextValue.trim()) return;
    setSelectedStarterCategory(null);
    setSelectedProductOutput(null);
  }

  function handleProductChoice(option: ProductOption) {
    if (isBusy) return;
    const nextCategoryLabel = selectedStarterCategory?.label || categoryLabelForDraft(draft);
    setSelectedProductOutput(option.output);
    updateComposerSelection(nextCategoryLabel, option.output);
  }

  useEffect(() => {
    if (!canGenerateProduct) setIsReadyChatComposerOpen(false);
  }, [canGenerateProduct]);

  useEffect(() => {
    if (isReadyChatComposerOpen) focusComposerAtEnd();
  }, [isReadyChatComposerOpen]);

  useEffect(() => {
    function handleNewChatSession() {
      resetConversation();
    }

    window.addEventListener("envitefy:chat:new", handleNewChatSession);
    return () => {
      window.removeEventListener("envitefy:chat:new", handleNewChatSession);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!threadId) {
      resetConversation();
      return () => {
        cancelled = true;
      };
    }
    const targetThreadId = threadId;

    async function restoreThread() {
      setError(null);
      setIsSending(true);
      try {
        const response = await fetch(
          `/api/creation/intake?threadId=${encodeURIComponent(targetThreadId)}`,
          {
            credentials: "include",
          },
        );
        const json = (await response
          .json()
          .catch(() => null)) as CreationSessionResumeResponse | null;
        if (cancelled || !response.ok || !json?.ok || !json.draft) return;

        const restoredDraft = json.draft;
        const savedEventId = json.savedEventId || null;
        const restoredOutput =
          restoredDraft.requestedOutputs
            .map(visibleProductOutput)
            .find((output) => PRODUCT_OPTIONS.some((option) => option.output === output)) || null;
        setDraft(restoredDraft);
        setSelectedProductOutput(restoredOutput);
        setSelectedStarterCategory(null);
        setLiveCardEventId(savedEventId);
        setLiveCardTitle(savedEventId ? draftHeadline(restoredDraft) : null);
        setLiveCardSummary(
          liveCardSummaryFromDraft(restoredDraft, restoredOutput || effectiveSelectedProductOutput),
        );
        setBuildProgress(savedEventId ? 100 : 0);
        setMobileView(savedEventId ? "preview" : "chat");
        setWeatherContext(json.weatherContext || null);
        setPhase(
          savedEventId
            ? "card_ready"
            : isReadyProductDraft(restoredDraft)
              ? "ready_to_generate"
              : "collecting_details",
        );
        setMessages(
          json.chatMessages?.length
            ? json.chatMessages.map(chatMessageFromSnapshot)
            : [
                newMessage(
                  "assistant",
                  savedEventId
                    ? "Thread opened. Your generated invite is ready to refine."
                    : "Thread opened. We can keep collecting the details from here.",
                ),
              ],
        );
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to open AI thread.");
        }
      } finally {
        if (!cancelled) setIsSending(false);
      }
    }

    void restoreThread();
    return () => {
      cancelled = true;
    };
  }, [threadId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isBusy]);

  useEffect(() => {
    if (!isGeneratingCard) return;
    const interval = window.setInterval(() => {
      setBuildProgress((current) => {
        if (current >= 92) return current;
        return Math.min(92, current + Math.random() * 10 + 4);
      });
    }, 420);
    return () => window.clearInterval(interval);
  }, [isGeneratingCard]);

  useEffect(() => {
    if (!liveCardEventId) {
      setRsvpPreview(EMPTY_RSVP_PREVIEW);
      return;
    }

    const eventId = liveCardEventId;
    let cancelled = false;
    async function loadRsvpPreview() {
      setRsvpPreview((current) => ({ ...current, isLoading: true, error: null }));
      try {
        const response = await fetch(`/api/events/${encodeURIComponent(eventId)}/rsvp`, {
          credentials: "include",
        });
        const payload = await response.json().catch(() => null);
        if (cancelled) return;
        if (!response.ok || !payload?.ok) {
          throw new Error(payload?.error || "Unable to load RSVP responses.");
        }
        setRsvpPreview(normalizeRsvpPreview(payload));
      } catch (err) {
        if (!cancelled) {
          setRsvpPreview((current) => ({
            ...current,
            isLoading: false,
            error: err instanceof Error ? err.message : "Unable to load RSVP responses.",
          }));
        }
      }
    }

    void loadRsvpPreview();
    return () => {
      cancelled = true;
    };
  }, [liveCardEventId]);

  useEffect(() => {
    if (!liveCardEventId) {
      setGeneratedInviteImageUrl(null);
      return;
    }

    const eventId = liveCardEventId;
    let cancelled = false;
    async function loadGeneratedInviteImage() {
      try {
        const response = await fetch(`/api/history/${encodeURIComponent(eventId)}`, {
          credentials: "include",
        });
        const row = await response.json().catch(() => null);
        if (cancelled || !response.ok) return;
        const data = recordValue(row?.data);
        const imageUrl = historyInviteImageFromEventData(data);
        if (imageUrl) setGeneratedInviteImageUrl(imageUrl);
      } catch {}
    }

    void loadGeneratedInviteImage();
    return () => {
      cancelled = true;
    };
  }, [liveCardEventId]);

  async function generateStudioInviteForDraft(
    draftToGenerate: ConciergeEventDraft,
  ): Promise<GeneratedInvitePayload> {
    const details = buildStudioDetailsFromDraft(draftToGenerate);
    const response = await requestStudioGeneration(details, "both", "page");
    const generatedDetails = response.preparedDetails || details;
    const rawImageUrl = response.imageUrl || response.imageDataUrl;
    if (!rawImageUrl) {
      throw new Error("Studio did not return an invite image.");
    }

    const fileName = `${buildEventSlug(draftHeadline(draftToGenerate)) || "envitefy-invite"}.png`;
    const imageUrl = await persistImageMediaValue({
      value: rawImageUrl,
      fileName,
    });
    if (!imageUrl) {
      throw new Error("The generated invite image could not be saved.");
    }

    return {
      imageUrl,
      invitationData: buildInvitationData(generatedDetails, response),
    };
  }

  async function generateProductForDraft(draftToGenerate: ConciergeEventDraft) {
    const productDraft = normalizeDraftProductOutputs(draftToGenerate);
    if (!isReadyProductDraft(productDraft)) {
      setError("Add the missing event details before generating the invite.");
      return;
    }
    setError(null);
    setPhase("generating_card");
    setBuildProgress(8);
    const generatedMessage = newMessage(
      "assistant",
      `Your ${effectiveSelectedProductLabel.toLowerCase()} is generated. You can review it in the preview or tell me what to change.`,
    );
    try {
      const studioInvite = await generateStudioInviteForDraft(productDraft);
      setGeneratedInviteImageUrl(studioInvite.imageUrl);
      setBuildProgress(72);
      const response = await fetch("/api/creation/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          message: "",
          action: "save",
          draft: productDraft,
          studioInvite,
          persistSession: true,
          chatMessages: chatMessagesForPersistence(messages, [generatedMessage]),
        }),
      });
      const json = (await response.json().catch(() => null)) as ConciergeMessageResponse | null;
      if (!response.ok || !json?.ok) {
        throw new Error(json && !json.ok ? json.error : "Unable to generate invite.");
      }
      const savedEventId = json.savedEventId;
      if (!savedEventId) throw new Error("Invite was generated without an event id.");
      setBuildProgress(100);
      setDraft(json.draft);
      setLiveCardEventId(savedEventId);
      setLiveCardTitle(draftHeadline(json.draft || productDraft));
      setLiveCardSummary(
        liveCardSummaryFromDraft(json.draft || productDraft, effectiveSelectedProductOutput),
      );
      setWeatherContext(json.weatherContext || null);
      setPhase("card_ready");
      setMobileView("preview");
      if (json.chatMessages?.length) {
        setMessages(json.chatMessages.map(chatMessageFromSnapshot));
      } else {
        setMessages((prev) => [...prev, generatedMessage]);
      }
      notifyCreationThreadsChanged();
    } catch (err) {
      setBuildProgress(0);
      setPhase(draftToGenerate.canPersist ? "ready_to_generate" : "collecting_details");
      setError(err instanceof Error ? err.message : "Unable to generate invite.");
    }
  }

  async function sendGeneratedCardEdit(message: string) {
    const trimmed = message.trim();
    if (!trimmed || !liveCardEventId) return;

    setError(null);
    setFailedRequest(null);
    setIsSending(true);
    setPhase("editing_card");
    setMessages((prev) => [...prev, newMessage("user", trimmed)]);
    try {
      const response = await fetch(`/api/concierge/events/${liveCardEventId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: trimmed }),
      });
      const json = (await response
        .json()
        .catch(() => null)) as ConciergeEventMessageResponse | null;
      if (!response.ok || !json?.ok) {
        throw new Error(json && !json.ok ? json.error : "Preview update failed.");
      }
      const fallbackSummary =
        liveCardSummary || liveCardSummaryFromDraft(draft, effectiveSelectedProductOutput);
      setLiveCardTitle(json.event.title || liveCardTitle || draftHeadline(draft));
      setLiveCardSummary(liveCardSummaryFromEvent(json.event, fallbackSummary));
      setWeatherContext(json.weatherContext || null);
      setPhase("card_ready");
      setMessages((prev) => [...prev, newMessage("assistant", json.assistantMessage)]);
    } catch (err) {
      setPhase("card_ready");
      setError(err instanceof Error ? err.message : "Preview update failed.");
    } finally {
      setIsSending(false);
    }
  }

  async function sendToConcierge(params: {
    message: string;
    action?: "message" | "chip" | "starter_category" | "ocr_result";
    ocrContext?: ConciergeOcrContext | null;
    activeContext?: ConciergeActiveContext | null;
    requestedOutputs?: RequestedOutput[];
    starterCategory?: string | null;
    echo?: string;
    suppressUserEcho?: boolean;
  }) {
    const message = params.message.trim();
    if (!message && !params.ocrContext) return;

    setError(null);
    setFailedRequest(null);
    setIsSending(true);
    if (!liveCardEventId && phase !== "ready_to_generate") {
      setPhase("collecting_details");
    }
    const shouldShowUserEcho = !params.suppressUserEcho && Boolean(params.echo || message);
    const userMessage = shouldShowUserEcho ? newMessage("user", params.echo || message) : null;
    if (shouldShowUserEcho) {
      setMessages((prev) => (userMessage ? [...prev, userMessage] : prev));
    }
    setSelectedStarterCategory(null);
    let streamAssistantId: string | null = null;
    let streamedAssistantText = "";
    try {
      const activeContext: ConciergeActiveContext = params.activeContext || {
        route: "/chat",
        currentEventId: liveCardEventId,
        currentDraftId: draft?.creationSessionId || null,
        selectedUploadId: params.ocrContext ? `upload_${Date.now()}` : null,
        selectedTemplateId: null,
        currentAssetId: null,
        lastUserAction: params.action || "message",
      };
      const draftRequestedOutputs = draft?.requestedOutputs?.length ? draft.requestedOutputs : null;
      const shouldPreserveDraftOutputs = Boolean(
        draftRequestedOutputs &&
          (!selectedProductOutput ||
            draftRequestedOutputs.includes(selectedProductOutput) ||
            draftRequestedOutputs.length > 1),
      );
      const requestedOutputs =
        params.requestedOutputs ||
        (shouldPreserveDraftOutputs
          ? draftRequestedOutputs
          : selectedProductOutput
            ? [selectedProductOutput]
            : null);
      const action = params.action || "message";
      const requestBody = {
        message,
        draft,
        ocrContext: params.ocrContext || null,
        activeContext,
        requestedOutputs,
        starterCategory: params.starterCategory || null,
        action,
        chatMessages: chatMessagesForPersistence(messages, userMessage ? [userMessage] : []),
      };
      const isExplicitProductChoice =
        Boolean(params.requestedOutputs?.length) &&
        (action === "chip" || action === "starter_category");
      const shouldStream =
        !params.ocrContext &&
        !isExplicitProductChoice &&
        (action === "message" || action === "chip" || action === "starter_category");

      if (shouldStream) {
        const assistantPlaceholder = newMessage("assistant", "");
        streamAssistantId = assistantPlaceholder.id;
        setMessages((prev) => [...prev, assistantPlaceholder]);
        const response = await fetch(withConciergeTiming(CREATION_INTAKE_STREAM_URL), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(requestBody),
        });
        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(payload?.error || "Concierge request failed.");
        }
        const finalState = await readConciergeIntakeStream(response, {
          onDelta: (text) => {
            streamedAssistantText += text;
            setIsStreamingAssistant(true);
            setMessages((prev) =>
              prev.map((item) =>
                item.id === streamAssistantId ? { ...item, text: streamedAssistantText } : item,
              ),
            );
          },
          onAssistantDone: (assistantMessage) => {
            streamedAssistantText = assistantMessage;
            setMessages((prev) =>
              prev.map((item) =>
                item.id === streamAssistantId ? { ...item, text: assistantMessage } : item,
              ),
            );
          },
          onState: (json) => {
            setDraft(json.draft);
            selectProductOutputForDraft(json.draft);
            setWeatherContext(json.weatherContext || null);
            notifyCreationThreadsChanged();
            if (json.chatMessages?.length) {
              setMessages(json.chatMessages.map(chatMessageFromSnapshot));
            }
            setPhase(isReadyProductDraft(json.draft) ? "ready_to_generate" : "collecting_details");
          },
        });
        if (!finalState) throw new Error("Concierge stream ended before draft state arrived.");
        return;
      }

      const response = await fetch(withConciergeTiming(CREATION_INTAKE_URL), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(requestBody),
      });
      const json = (await response.json().catch(() => null)) as ConciergeMessageResponse | null;
      if (!response.ok || !json?.ok) {
        throw new Error(json && !json.ok ? json.error : "Concierge request failed.");
      }
      setDraft(json.draft);
      selectProductOutputForDraft(json.draft);
      setWeatherContext(json.weatherContext || null);
      notifyCreationThreadsChanged();
      const assistantMessage = newMessage("assistant", json.assistantMessage);
      if (json.chatMessages?.length) {
        setMessages(json.chatMessages.map(chatMessageFromSnapshot));
      }
      if (isReadyProductDraft(json.draft)) {
        setPhase("ready_to_generate");
        if (!json.chatMessages?.length) setMessages((prev) => [...prev, assistantMessage]);
        return;
      }
      setPhase("collecting_details");
      if (!json.chatMessages?.length) setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Concierge request failed.";
      setPhase(draft ? "collecting_details" : "intake_empty");
      if (streamAssistantId && !streamedAssistantText.trim()) {
        setMessages((prev) => prev.filter((item) => item.id !== streamAssistantId));
      }
      setError(errorMessage);
      setFailedRequest({ ...params, error: errorMessage });
    } finally {
      setIsStreamingAssistant(false);
      setIsSending(false);
    }
  }

  async function retryFailedRequest() {
    if (!failedRequest || isBusy) return;
    await sendToConcierge({
      message: failedRequest.message,
      action: failedRequest.action,
      ocrContext: failedRequest.ocrContext,
      activeContext: failedRequest.activeContext,
      requestedOutputs: failedRequest.requestedOutputs,
      starterCategory: failedRequest.starterCategory,
      echo: failedRequest.echo,
      suppressUserEcho: true,
    });
  }

  async function submitComposerInput() {
    if (isBusy) return;
    const value = input.trim();
    if (!value) return;
    setInput("");
    if (liveCardEventId) {
      await sendGeneratedCardEdit(value);
      return;
    }
    await sendToConcierge({
      message: value,
      action: selectedStarterCategory ? "starter_category" : undefined,
      requestedOutputs:
        selectedProductOutput && !draft?.requestedOutputs?.length
          ? [selectedProductOutput]
          : undefined,
      starterCategory: selectedStarterCategory?.label || null,
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitComposerInput();
  }

  function handleStarterPrompt(tile: CelebrationStarterTile) {
    if (isBusy) return;
    setError(null);
    setSelectedStarterCategory(tile);
    updateComposerSelection(tile.label, selectedProductOutput);
  }

  function handleStarterProductChoice(option: ProductOption) {
    if (isBusy) return;
    const nextCategoryLabel = selectedStarterCategory?.label || categoryLabelForDraft(draft);
    setSelectedProductOutput(option.output);
    updateComposerSelection(nextCategoryLabel, option.output);
  }

  function handleVoiceInput() {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Voice input is not supported in this browser.");
      return;
    }

    setError(null);
    setIsListening(true);
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = window.navigator.language || "en-US";
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results || [])
        .map((result: any) => result?.[0]?.transcript)
        .filter(Boolean)
        .join(" ")
        .trim();
      if (!transcript) return;
      setInput((current) => (current.trim() ? `${current.trim()} ${transcript}` : transcript));
    };
    recognition.onerror = () => {
      setError("Voice input was not captured.");
    };
    recognition.onend = () => {
      setIsListening(false);
    };
    recognition.start();
  }

  async function routeSelectedSnapFile(file: File | null | undefined, source: "camera" | "upload") {
    if (!file || isBusy) return;
    const validationError = validateClientUploadFile(file, "attachment");
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setIsUploading(true);
    const scanAttemptId = createClientAttemptId("scan");
    let didRoute = false;
    try {
      await savePendingSnapUpload({ file, scanAttemptId });
      router.push("/?action=upload");
      didRoute = true;
    } catch (err) {
      reportClientLog({
        area: "snap-upload",
        stage: "pending-save",
        scanAttemptId,
        error: err,
        details: {
          route: "/chat",
          source,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
        },
      });
      setError("Unable to prepare this upload. Please try again.");
    } finally {
      if (!didRoute) setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (cameraInputRef.current) cameraInputRef.current.value = "";
    }
  }

  function openSnapUploadPicker() {
    if (isBusy) return;
    setError(null);
    try {
      fileInputRef.current?.click();
    } catch (err) {
      console.error("Failed to open file picker:", err);
      setError("Unable to open the file picker. Please try again.");
    }
  }

  function openSnapCameraPicker() {
    if (isBusy) return;
    setError(null);
    try {
      cameraInputRef.current?.click();
    } catch (err) {
      console.error("Failed to open camera picker:", err);
      setError("Unable to open the camera. Please try again.");
    }
  }

  const chatThread = (
    <div
      className="mx-auto flex min-h-full w-full max-w-3xl flex-col justify-end gap-5 px-4 py-8 sm:px-6"
      role="log"
      aria-live="polite"
      aria-relevant="additions text"
    >
      <AnimatePresence initial={false}>
        {visibleMessages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6 }}
            className={`flex flex-col ${message.role === "user" ? "items-end" : "items-start"}`}
          >
            {message.type === "upload_status" ? (
              <div
                className="inline-flex items-center gap-2 rounded-full border border-[#eadfff] bg-white/86 px-4 py-2 text-sm text-[#5f5289] shadow-sm"
                role="status"
                aria-live="polite"
              >
                <Loader2 className="size-4 animate-spin text-[#7c4dff]" aria-hidden="true" />
                {message.text}
              </div>
            ) : (
              <div
                className={`max-w-[94%] whitespace-pre-line rounded-3xl px-4 py-3 text-sm leading-6 shadow-sm sm:max-w-[88%] ${
                  message.role === "user"
                    ? "rounded-tr-md bg-[#6f4cff] text-white shadow-[#6f4cff]/15"
                    : "rounded-tl-md border border-[#eadfff] bg-white/88 text-[#24183e]"
                }`}
              >
                {message.role === "assistant"
                  ? formatAssistantBubbleText(message.text, draft)
                  : message.text}
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {failedRequest ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-start"
        >
          <div className="max-w-[94%] rounded-3xl rounded-tl-md border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-800 shadow-sm sm:max-w-[88%]">
            <p className="font-semibold">Concierge could not finish that request.</p>
            <p>{failedRequest.error}</p>
            <button
              type="button"
              onClick={() => void retryFailedRequest()}
              disabled={isBusy}
              className="mt-3 inline-flex h-9 items-center justify-center rounded-full border border-red-200 bg-white px-4 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Try again
            </button>
          </div>
        </motion.div>
      ) : null}

      {shouldShowProductFormatTiles ? (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="w-fit max-w-full self-start"
        >
          <BottomNavBar
            items={PRODUCT_OPTIONS.map((option) => ({
              label: option.label,
              value: option.output,
              icon: option.icon,
            }))}
            activeValue={selectedProductOutput}
            defaultIndex={-1}
            ariaLabel="Choose product format"
            className="min-w-[304px] border-[#e9e3f2] bg-white/96"
            onValueChange={(value) => {
              const option = PRODUCT_OPTIONS.find((item) => item.output === value);
              if (option) handleProductChoice(option);
            }}
          />
        </motion.div>
      ) : null}

      {isBusy && !isGeneratingCard && !isStreamingAssistant ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "inline-flex w-fit max-w-[94%] self-start items-center gap-2 rounded-full border border-[#eadfff] bg-white/86 px-4 py-2 text-sm text-[#5f5289] shadow-sm sm:max-w-[88%]",
            isThinking && "animate-pulse",
          )}
          role="status"
          aria-live="polite"
        >
          {isThinking ? null : (
            <Loader2 className="size-4 animate-spin text-[#7c4dff]" aria-hidden="true" />
          )}
          {busyLabel}
        </motion.div>
      ) : null}
      <div ref={messagesEndRef} />
    </div>
  );

  const composer = (
    <div className="pointer-events-none z-30 mx-auto flex w-full max-w-3xl shrink-0 flex-col items-stretch px-2 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-4 sm:px-6 sm:pb-8">
      <div ref={composerCardRef} className="pointer-events-auto w-full">
        <form onSubmit={handleSubmit}>
          <input
            ref={fileInputRef}
            type="file"
            accept={getUploadAcceptAttribute("attachment")}
            className="hidden"
            onChange={(event) => {
              void routeSelectedSnapFile(event.currentTarget.files?.[0], "upload");
              event.currentTarget.value = "";
            }}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept={getUploadAcceptAttribute("header")}
            capture="environment"
            className="hidden"
            onChange={(event) => {
              void routeSelectedSnapFile(event.currentTarget.files?.[0], "camera");
              event.currentTarget.value = "";
            }}
          />
          <PromptInput
            value={input}
            onValueChange={handleComposerValueChange}
            isLoading={isBusy}
            onSubmit={() => void submitComposerInput()}
            disabled={isBusy}
            className={cn(
              "w-full border-[#d8caff] bg-[#fbf9ff] p-2 text-[#25183a] shadow-[0_18px_46px_rgba(93,63,155,0.18),inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-white/75 backdrop-blur transition-all duration-300",
              isListening &&
                "border-[#8b5cf6] shadow-[0_18px_46px_rgba(124,77,255,0.24),inset_0_1px_0_rgba(255,255,255,0.95)]",
            )}
          >
            <PromptInputTextarea
              placeholder={
                liveCardEventId
                  ? "Tell me what to change..."
                  : "Or just start typing and let's get going..."
              }
              aria-label={liveCardEventId ? "Refine invite" : "Start planning from scratch"}
              className="min-h-[44px] px-3 py-2.5 text-base !text-[#25183a] caret-[#7c4dff] selection:bg-[#d8caff] selection:text-[#25183a] !placeholder:text-[#8b7ca6] [&::placeholder]:text-[0.82rem] sm:[&::placeholder]:text-base"
            />
            <PromptInputActions className="justify-between gap-2 pt-2">
              <div className="flex min-w-0 items-center gap-1">
                <PromptInputAction tooltip="Upload file">
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={openSnapUploadPicker}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#76648f] transition hover:bg-[#f1ebff] hover:text-[#7c4dff] disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Upload file"
                  >
                    <Paperclip className="size-6" aria-hidden="true" />
                  </button>
                </PromptInputAction>

                <PromptInputAction tooltip="Use camera">
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={openSnapCameraPicker}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#76648f] transition hover:bg-[#f1ebff] hover:text-[#7c4dff] disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Use camera"
                  >
                    <Camera className="size-6" aria-hidden="true" />
                  </button>
                </PromptInputAction>
              </div>

              <PromptInputAction
                tooltip={
                  isBusy
                    ? busyLabel
                    : input.trim()
                      ? "Send message"
                      : isListening
                        ? "Listening"
                        : "Voice message"
                }
              >
                <button
                  type={input.trim() ? "submit" : "button"}
                  disabled={isBusy || (!input.trim() && isListening)}
                  onClick={(event) => {
                    if (input.trim()) return;
                    event.preventDefault();
                    void handleVoiceInput();
                  }}
                  className={cn(
                    "inline-flex h-9 w-9 items-center justify-center rounded-full text-[#76648f] transition hover:bg-[#f1ebff] hover:text-[#7c4dff] disabled:pointer-events-none disabled:opacity-50",
                    (input.trim() || isListening) && "text-[#7c4dff]",
                  )}
                  aria-label={input.trim() ? "Send" : "Use voice input"}
                >
                  {isBusy ? (
                    <Loader2 className="size-5 animate-spin text-[#7c4dff]" aria-hidden="true" />
                  ) : input.trim() ? (
                    <ArrowUp className="size-6 text-current" strokeWidth={2.5} aria-hidden="true" />
                  ) : (
                    <Mic className="size-6 text-current" strokeWidth={2.4} aria-hidden="true" />
                  )}
                </button>
              </PromptInputAction>
            </PromptInputActions>
          </PromptInput>
        </form>
        {error ? <p className="mt-3 text-sm font-medium text-red-600">{error}</p> : null}
        <p className="mt-4 text-center text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#8d7daf]">
          Envitefy Concierge - Beta
        </p>
      </div>
    </div>
  );

  const readyActions = (
    <div className="pointer-events-none z-30 mx-auto flex w-full max-w-3xl shrink-0 flex-col items-stretch px-2 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-4 sm:px-6 sm:pb-8">
      <div className="pointer-events-auto w-full">
        <div className="grid grid-cols-2 gap-2 rounded-[1.35rem] border border-[#d8caff] bg-[#fbf9ff]/96 p-2 shadow-[0_18px_46px_rgba(93,63,155,0.18),inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-white/75 backdrop-blur">
          <button
            type="button"
            onClick={() => setIsReadyChatComposerOpen(true)}
            disabled={isGeneratingCard}
            className="inline-flex h-12 min-w-0 items-center justify-center gap-2 rounded-2xl border border-[#ded2f5] bg-white px-3 text-sm font-bold text-[#4f3a73] transition hover:border-[#c7b4ee] hover:bg-[#f5f0ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a98dff] disabled:cursor-not-allowed disabled:opacity-55"
          >
            <MessageCircle className="size-4 shrink-0" aria-hidden="true" />
            <span className="truncate">Keep chatting</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (draft) void generateProductForDraft(draft);
            }}
            className="inline-flex h-12 min-w-0 items-center justify-center gap-2 rounded-2xl bg-[#6f4cff] px-3 text-sm font-bold text-white shadow-[0_14px_30px_rgba(111,76,255,0.24)] transition hover:bg-[#5f3ff0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a98dff] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isGeneratingCard || !canGenerateProduct}
            aria-label={
              isGeneratingCard
                ? `Generating ${effectiveSelectedProductLabel.toLowerCase()}`
                : `Generate ${effectiveSelectedProductLabel.toLowerCase()}`
            }
          >
            {isGeneratingCard ? (
              <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden="true" />
            ) : (
              <Sparkles className="size-4 shrink-0" aria-hidden="true" />
            )}
            <span className="truncate">{isGeneratingCard ? "Generating" : "Generate"}</span>
          </button>
        </div>
        {error ? <p className="mt-3 text-sm font-medium text-red-600">{error}</p> : null}
        <p className="mt-4 text-center text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#8d7daf]">
          Envitefy Concierge - Beta
        </p>
      </div>
    </div>
  );

  const productPanel = (
    <ChatProductPreview
      draft={draft}
      summary={{ ...currentLiveCardSummary, headline: previewTitle }}
      selectedOutput={effectiveSelectedProductOutput}
      previewImageUrl={currentPreviewImage}
      isGenerating={isGeneratingCard}
      buildProgress={buildProgress}
      currentBuildStep={BUILDING_STEPS[currentBuildStep]}
      liveEventId={liveCardEventId}
      publicHref={liveCardPublicHref}
      rsvp={{
        count: rsvpResponseCount,
        isLoading: rsvpPreview.isLoading,
        error: rsvpPreview.error,
      }}
      weatherContext={weatherContext}
      mobileView={mobileView}
    />
  );

  return (
    <div className="flex h-full min-h-0 w-full overflow-hidden bg-transparent text-[#161129]">
      <main
        ref={mainRef}
        className="relative flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
      >
        <div className="relative z-10 flex min-h-0 flex-1 flex-col">
          <section className="flex min-h-0 flex-1 flex-col">
            {shouldShowProductPanel ? (
              <div className="shrink-0 border-b border-[#eee8f6] bg-white pb-2 pl-14 pr-3 pt-[max(0.35rem,env(safe-area-inset-top))] md:hidden">
                <div className="grid grid-cols-2 rounded-lg bg-[#f1edf7] p-1">
                  <button
                    type="button"
                    onClick={() => setMobileView("chat")}
                    className={`h-8 rounded-md px-4 text-xs font-bold transition ${
                      mobileView === "chat" ? "bg-white text-[#7c4dff] shadow-sm" : "text-[#8b8298]"
                    }`}
                  >
                    Chat
                  </button>
                  <button
                    type="button"
                    onClick={() => setMobileView("preview")}
                    className={`h-8 rounded-md px-4 text-xs font-bold transition ${
                      mobileView === "preview"
                        ? "bg-white text-[#7c4dff] shadow-sm"
                        : "text-[#8b8298]"
                    }`}
                  >
                    Preview
                  </button>
                </div>
              </div>
            ) : null}
            <div
              className={`grid h-full min-h-0 ${
                shouldShowProductPanel
                  ? "md:grid-cols-[minmax(0,1fr)_minmax(24rem,30rem)]"
                  : "md:grid-cols-1"
              }`}
            >
              <div
                ref={chatPaneRef}
                className={`min-h-0 w-full flex-col overflow-hidden bg-white/28 backdrop-blur-sm ${
                  shouldShowProductPanel ? "md:border-r md:border-[#e5dff0]" : ""
                } ${
                  mobileView === "chat" ? "flex" : "hidden md:flex"
                } ${shouldShowProductPanel ? "" : "md:border-r-0"}`}
              >
                <div className="min-h-0 flex-1 overflow-y-auto [overscroll-behavior-y:contain] [touch-action:pan-y] [-webkit-overflow-scrolling:touch]">
                  {isEmptyState ? (
                    <div className="mx-auto flex min-h-full w-full max-w-[90rem] flex-col justify-start px-4 pb-44 pt-8 text-center sm:px-6 md:justify-end md:py-8">
                      <motion.h1
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mx-auto max-w-3xl text-4xl font-medium tracking-normal text-[#2d1b36] sm:text-6xl"
                      >
                        {initialAssistantPrompt}
                      </motion.h1>
                      <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[#6f608c] sm:text-base">
                        Pick a category or describe it in your own words.
                      </p>
                      <div className="mx-auto mt-6 grid w-full max-w-3xl grid-cols-2 gap-3 text-left sm:max-w-4xl sm:grid-cols-4">
                        {CELEBRATION_STARTER_TILES.map((tile) => {
                          const isWide = tile.size === "wide";
                          const isDesktopWide = tile.size === "desktopWide";
                          const isSelected = selectedStarterCategory?.label === tile.label;
                          const isDimmed = hasStarterCategorySelection && !isSelected;
                          return (
                            <button
                              key={tile.label}
                              type="button"
                              onClick={() => handleStarterPrompt(tile)}
                              disabled={isBusy}
                              aria-label={`Choose ${tile.label}`}
                              aria-pressed={isSelected}
                              className={cn(
                                "group relative isolate overflow-hidden rounded-2xl border border-white/80 bg-[#f6f1ff] text-left shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a98dff] disabled:cursor-not-allowed disabled:opacity-55",
                                isSelected &&
                                  "z-10 border-[#8f68ff] bg-white shadow-[0_18px_46px_rgba(111,76,255,0.24)] ring-2 ring-[#8f68ff]/70",
                                isDimmed && "border-[#d8d3df] bg-[#ece9f1] shadow-none",
                                isWide
                                  ? "col-span-2 aspect-[2.055/1]"
                                  : cn(
                                      "aspect-square min-h-[8.25rem]",
                                      isDesktopWide && "sm:col-span-2 sm:aspect-[2.055/1]",
                                    ),
                              )}
                            >
                              <img
                                src={tile.imagePath}
                                alt=""
                                aria-hidden="true"
                                className={cn(
                                  "absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105",
                                  isSelected && "saturate-110",
                                  isDimmed &&
                                    "grayscale saturate-0 opacity-45 group-hover:grayscale-0 group-hover:saturate-100 group-hover:opacity-75",
                                )}
                              />
                              <span
                                className={cn(
                                  "absolute inset-0 bg-gradient-to-t",
                                  isDimmed
                                    ? "from-[#171023]/78 via-[#edeaf3]/34 to-[#f8f6fb]/28"
                                    : "from-[#171023]/80 via-[#241735]/28 to-white/10",
                                )}
                                aria-hidden="true"
                              />
                              {isSelected ? (
                                <span className="absolute right-3 top-3 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#6f4cff] shadow-[0_8px_20px_rgba(45,27,54,0.24)]">
                                  <Check size={15} strokeWidth={3} aria-hidden="true" />
                                </span>
                              ) : null}
                              <span className="relative z-10 flex h-full flex-col justify-end p-3 sm:p-4">
                                <span className="max-w-[11rem] text-balance break-words text-base font-bold leading-tight text-white sm:text-lg">
                                  {tile.label}
                                </span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className="mx-auto mt-4 flex w-full max-w-3xl justify-center pb-5 sm:max-w-4xl sm:pb-6"
                      >
                        <div className="flex w-full justify-center sm:hidden">
                          <BottomNavBar
                            items={PRODUCT_OPTIONS.map((option) => ({
                              label: option.label,
                              value: option.output,
                              icon: option.icon,
                            }))}
                            activeValue={selectedProductOutput}
                            defaultIndex={-1}
                            ariaLabel={
                              selectedStarterCategory
                                ? `Choose product format for ${selectedStarterCategory.label}`
                                : "Choose product format"
                            }
                            className="w-full !min-w-0 !max-w-[21rem] border-[#e9e3f2] bg-white/96"
                            onValueChange={(value) => {
                              const option = PRODUCT_OPTIONS.find((item) => item.output === value);
                              if (option) handleStarterProductChoice(option);
                            }}
                          />
                        </div>
                        <div
                          className="hidden max-w-full flex-wrap justify-center gap-2 rounded-[1.6rem] border border-[#e9e3f2] bg-white/96 p-2 shadow-[0_16px_36px_rgba(35,27,55,0.12)] sm:flex"
                          aria-label={
                            selectedStarterCategory
                              ? `Choose product format for ${selectedStarterCategory.label}`
                              : "Choose product format"
                          }
                          role="group"
                        >
                          {PRODUCT_OPTIONS.map((option) => {
                            const Icon = option.icon;
                            const isSelected = selectedProductOutput === option.output;
                            const productLabel = selectedStarterCategory
                              ? `${selectedStarterCategory.label} ${option.label}`
                              : option.label;
                            return (
                              <button
                                key={option.output}
                                type="button"
                                onClick={() => handleStarterProductChoice(option)}
                                disabled={isBusy}
                                aria-label={`Use ${productLabel}`}
                                aria-pressed={isSelected}
                                className={cn(
                                  "inline-flex h-10 min-w-[8.25rem] items-center justify-center gap-2 rounded-full px-3 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a98dff] disabled:cursor-not-allowed disabled:opacity-55 sm:min-w-[7.4rem]",
                                  isSelected
                                    ? "bg-[#ede8f7] text-[#3d2769]"
                                    : "text-[#5f4b82] hover:bg-[#f3eefb] hover:text-[#3d2769]",
                                )}
                              >
                                <Icon size={18} strokeWidth={2} aria-hidden="true" />
                                <span className="truncate">{option.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    </div>
                  ) : (
                    chatThread
                  )}
                </div>
                {shouldShowReadyActions ? readyActions : composer}
              </div>
              {shouldShowProductPanel ? productPanel : null}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
