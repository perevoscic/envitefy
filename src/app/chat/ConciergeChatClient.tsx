"use client";

import { useEventProgress } from "@/components/UnsavedProgressProvider";
import { fallbackExtractConciergeDraft } from "@/lib/concierge/fallback";
import { isArtworkRedesignRequest } from "@/lib/concierge/artwork-redesign-intent";
import { shouldRegenerateGeneratedDraftImageForEdit } from "@/lib/concierge/artwork-change";
import { normalizeArtworkEditLanguage, requestedArtworkRequirements } from "@/lib/concierge/visual-direction";
import { GENERATION_STAGE_LABELS, type GenerationStage } from "@/lib/studio/generation-progress";
import { getCreationReadiness } from "@/lib/concierge/readiness";
import { resolveStudioProduct } from "@/lib/studio/product-contract";
import { resolveProductEditPlan, type PageTypography } from "@/lib/studio/product-edit-plan";
import { publicContentForDraft } from "@/lib/concierge/public-content";
import { buildPersonaTurnReceipt, guardPersonaSentence } from "@/lib/concierge/persona-contract";
import { conciergeCapabilityAnswer } from "@/lib/concierge/capabilities";
import { SIGNUP_FORM_GALLERY_HREF, signupFormHandoff } from "@/lib/concierge/signup-handoff";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUp,
  FileImage,
  Gift,
  Globe,
  IdCard,
  Loader2,
  type LucideIcon,
  Plus,
  Sparkles,
  X,
} from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { requestStudioGeneration } from "@/app/studio/studio-workspace-api";
import {
  buildInvitationData,
  refreshLiveCardInvitationData,
} from "@/app/studio/studio-workspace-builders";
import { createInitialDetails, sanitizeInvitationData } from "@/app/studio/studio-workspace-sanitize";
import type {
  EventDetails,
  InvitationData,
  InviteCategory,
} from "@/app/studio/studio-workspace-types";
import { STUDIO_CATEGORY_TILES } from "@/app/studio/workspace/studio-category-tile-data";
import conciergeLogo from "@/assets/envitefy-concierge-logo.png";
import userConciergeLogo from "@/assets/user-concierge-logo.png";
import {
  cn,
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/ui/ai-prompt-box";
import { useVisualViewportInsets } from "@/hooks/useVisualViewportInsets";
import { isExternalPlatformActionRequest as isUnsupportedExternalConciergeRequest } from "@/lib/concierge/creation-intent";
import { skinLabelForCategoryName, skinLabelForConciergeDraft } from "@/lib/concierge/skins";
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
import { runSnapOcrUpload, type SnapOcrUploadResult } from "@/lib/snap-upload-pipeline";
import { getUploadAcceptAttribute } from "@/lib/upload-config";
import { createClientAttemptId, reportClientLog } from "@/utils/client-log";
import { buildEventProductPath } from "@/utils/event-product-route";
import { buildEventPath, buildEventSlug } from "@/utils/event-url";
import {
  createObjectUrlPreview,
  persistImageMediaValue,
  uploadMediaFile,
  revokeObjectUrl,
  validateClientUploadFile,
} from "@/utils/media-upload-client";
import { getAmazonRegistryCreateUrlForCategory } from "@/utils/registry-links";
import ChatProductPreview from "./ChatProductPreview";
import ChatWorkspace from "./ChatWorkspace";

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
  icon: LucideIcon;
};

type ConciergePhase =
  | "intake_empty"
  | "collecting_details"
  | "ready_to_generate"
  | "generating_card"
  | "publishing_card"
  | "card_ready"
  | "editing_card";

type ChatUploadStage =
  | "idle"
  | "preparing_upload"
  | "scanning"
  | "ocr_ready"
  | "creating_event"
  | "success"
  | "error";

type PendingChatUpload = {
  file: File;
  source: "camera" | "upload";
};

function canUploadFlyerToOutput(output: RequestedOutput | null | undefined): output is "live_card" | "event_page" {
  return output === "live_card" || output === "event_page";
}

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

function ConciergeChatAvatar({ className }: { className?: string }) {
  return (
    <span
      className={cn("mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center", className)}
      aria-hidden="true"
    >
      <Image
        src={conciergeLogo}
        alt=""
        width={40}
        height={40}
        className="h-full w-full object-contain drop-shadow-[0_8px_16px_rgba(93,63,155,0.2)]"
        draggable={false}
      />
    </span>
  );
}

function normalizeUserInitials(value?: string | null) {
  const cleaned =
    typeof value === "string"
      ? value
          .replace(/[^\p{L}\p{N}]/gu, "")
          .slice(0, 2)
          .toUpperCase()
      : "";
  return cleaned || "U";
}

function UserChatAvatar({ initials, className }: { initials: string; className?: string }) {
  return (
    <span
      className={cn(
        "relative mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center",
        className,
      )}
      aria-hidden="true"
    >
      <Image
        src={userConciergeLogo}
        alt=""
        width={40}
        height={40}
        className="absolute inset-0 h-full w-full object-contain drop-shadow-[0_8px_16px_rgba(93,63,155,0.22)]"
        draggable={false}
      />
      <span className="relative z-10 text-[12px] font-black leading-none text-white drop-shadow-[0_1px_3px_rgba(35,24,72,0.9)]">
        {initials}
      </span>
    </span>
  );
}

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
    description: "A simple shareable card with event details and quick buttons.",
    prompt: "Create a live card",
    icon: IdCard,
  },
  {
    label: "Flyer/Invitation",
    output: "digital_flyer",
    description: "A designed invite image you can send or download.",
    prompt: "Create a flyer invitation",
    icon: FileImage,
  },
  {
    label: "Event Page",
    output: "event_page",
    description: "A full live page with RSVP, location, registry, and sharing.",
    prompt: "Let's create",
    icon: Globe,
  },
];

const CREATION_INTAKE_URL = "/api/creation/intake";
const CREATION_INTAKE_STREAM_URL = "/api/creation/intake/stream";
const ENABLE_CONCIERGE_TIMING = process.env.NEXT_PUBLIC_CONCIERGE_TIMING === "1";

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
  userInitials?: string | null;
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
  retryReply?: boolean;
  error: string;
};

type FailedSnapUploadRequest = {
  file: File;
  source: "camera" | "upload";
  requestedOutput: "live_card" | "event_page";
  uploadPrompt: string;
  userEchoOverride?: string;
  error: string;
};

function withConciergeTiming(url: string) {
  if (!ENABLE_CONCIERGE_TIMING) return url;
  return `${url}${url.includes("?") ? "&" : "?"}timing=1`;
}

const UNSUPPORTED_EXTERNAL_CONCIERGE_MESSAGE =
  "I can prepare the event link and message for you to share. I can't post to your social accounts or contact guests from this chat.";

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function publicizeAssistantBubbleText(text: string) {
  return Object.entries(OUTPUT_LABELS).filter(([output]) => output.includes("_")).reduce(
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

function optionalGiftQuestionText(text: string) {
  const match = text.match(/\bOptional:\s*(do you have [^?\n]+\?)/i);
  if (!match?.[1]) return null;
  return `${match[1][0]?.toUpperCase() || ""}${match[1].slice(1)}`;
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

function renderSignupGalleryLine(line: string, onOpenGallery?: () => void) {
  return line.split(SIGNUP_FORM_GALLERY_HREF).map((part, index) => (
    <span key={`${index}-${part}`}>
      {index > 0 ? (
        <a
          href={SIGNUP_FORM_GALLERY_HREF}
          className="font-semibold text-[#5c3bd6] underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
          onClick={(event) => {
            if (!onOpenGallery || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            event.preventDefault();
            onOpenGallery();
          }}
        >
          Browse sign-up templates
        </a>
      ) : null}
      {part}
    </span>
  ));
}

function formatAssistantBubbleText(
  text: string,
  detailsDraft?: ConciergeEventDraft | null,
  onOpenGallery?: () => void,
) {
  const sanitized = sanitizeAssistantBubbleText(text, detailsDraft);
  const paragraphs = (optionalGiftQuestionText(sanitized) || sanitized).trim().split(/\n\s*\n/);
  return paragraphs.map((paragraph, paragraphIndex) => (
    <p key={`${paragraphIndex}-${paragraph}`} className={paragraphIndex ? "mt-2.5" : undefined}>
      {paragraph.split("\n").map((line, index) => {
        const detail = line.match(DETAIL_CONFIRMATION_LINE);
        return (
          <span key={`${line}-${index}`} className="block">
            {line.includes(SIGNUP_FORM_GALLERY_HREF)
              ? renderSignupGalleryLine(line, onOpenGallery)
              : detail ? <><span className="font-medium text-[#5f5289]">{detail[1]}:</span>{" "}<strong className="font-semibold text-[#150d2b]">{detail[2]}</strong></> : renderHighlightedAssistantLine(line, detailsDraft)}
          </span>
        );
      })}
    </p>
  ));
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

function conciergeClientErrorMessage(value: unknown, fallback: string): string {
  if (value instanceof Error) return conciergeClientErrorMessage(value.message, fallback);
  if (typeof value === "string") {
    const cleaned = value.trim();
    return cleaned && cleaned !== "[object Object]" ? cleaned : fallback;
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return conciergeClientErrorMessage(
      record.error || record.message || record.detail || record.reason,
      fallback,
    );
  }
  return fallback;
}

async function readConciergeIntakeStream(
  response: Response,
  handlers: ConciergeStreamHandlers,
): Promise<ConciergeStreamStatePayload | null> {
  if (!response.body) throw new Error("Envitefy Create stream did not include a response body.");
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
      throw new Error(conciergeClientErrorMessage(data?.error, "Envitefy Create stream failed."));
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

function buildInitialAssistantPrompt() {
  return EMPTY_ASSISTANT_PROMPT;
}

function isOpeningAssistantPrompt(text: string, initialAssistantPrompt: string) {
  return text === initialAssistantPrompt || text === EMPTY_ASSISTANT_PROMPT;
}

const PREVIEW_CATEGORY_BY_EVENT_TYPE: Partial<Record<ConciergeEventType, string>> = {
  birthday: "Birthday",
  wedding: "Wedding",
  anniversary: "Anniversary",
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

function skinLabelForDraft(draft: ConciergeEventDraft | null) {
  return skinLabelForConciergeDraft(draft);
}

function ChatSelectionPill({
  label,
  onRemove,
  disabled,
  ariaLabel,
  textClassName,
}: {
  label: string;
  onRemove: () => void;
  disabled: boolean;
  ariaLabel: string;
  textClassName?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full min-w-0 items-center gap-2 rounded-full border border-[#ded2f5] bg-white/78 px-3 py-1.5 text-sm font-semibold shadow-[0_8px_18px_rgba(93,63,155,0.08),inset_0_1px_0_rgba(255,255,255,0.92)]",
        textClassName || "text-[#5c5be5]",
      )}
    >
      <span className="truncate">{label}</span>
      <button
        type="button"
        onClick={onRemove}
        disabled={disabled}
        aria-label={ariaLabel}
        className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-current/70 transition hover:bg-[#f1ebff] hover:text-current focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a98dff] disabled:pointer-events-none disabled:opacity-50"
      >
        <X className="size-4" strokeWidth={2.4} aria-hidden="true" />
      </button>
    </span>
  );
}

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

function chatMessagesFromSnapshots(
  messages: CreationChatMessageSnapshot[],
  options: { preserveLastAssistantId?: string | null } = {},
): ChatMessage[] {
  const mapped = messages.map(chatMessageFromSnapshot);
  const preserveLastAssistantId = options.preserveLastAssistantId?.trim();
  if (!preserveLastAssistantId) return mapped;
  let latestAssistantIndex = -1;
  for (let index = mapped.length - 1; index >= 0; index -= 1) {
    if (mapped[index]?.role === "assistant") {
      latestAssistantIndex = index;
      break;
    }
  }
  if (latestAssistantIndex < 0) return mapped;
  mapped[latestAssistantIndex] = {
    ...mapped[latestAssistantIndex],
    id: preserveLastAssistantId,
  };
  return mapped;
}

function mergePendingMessagesIntoSnapshots(
  snapshots: CreationChatMessageSnapshot[],
  pendingMessages: ChatMessage[] = [],
): ChatMessage[] {
  const mapped = chatMessagesFromSnapshots(snapshots);
  if (!pendingMessages.length) return mapped;
  const seenIds = new Set(mapped.map((message) => message.id));
  const seenBodies = new Set(mapped.map((message) => `${message.role}:${message.text.trim()}`));
  const missingPendingMessages = pendingMessages.filter((message) => {
    if (message.type === "upload_status" || !message.text.trim()) return false;
    if (seenIds.has(message.id)) return false;
    return !seenBodies.has(`${message.role}:${message.text.trim()}`);
  });
  return missingPendingMessages.length ? [...missingPendingMessages, ...mapped] : mapped;
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

function uploadedFileLabel(file: File) {
  const name = file.name.replace(/\s+/g, " ").trim();
  return name || "uploaded file";
}

function birthdayHintRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function stringFromKnownValue(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) return String(Math.round(value));
  return stringValue(value);
}

function buildChatFieldsGuess(result: SnapOcrUploadResult): Record<string, unknown> | null {
  const fieldsGuess = result.fieldsGuess ? { ...result.fieldsGuess } : {};
  const birthdayHint = birthdayHintRecord(result.birthdayTemplateHint);
  const honoreeName = stringFromKnownValue(birthdayHint.honoreeName);
  const ageOrMilestone = stringFromKnownValue(birthdayHint.age);

  if (honoreeName && !stringFromKnownValue(fieldsGuess.honoreeName)) {
    fieldsGuess.honoreeName = honoreeName;
  }
  if (ageOrMilestone && !stringFromKnownValue(fieldsGuess.ageOrMilestone)) {
    fieldsGuess.ageOrMilestone = ageOrMilestone;
  }

  return Object.keys(fieldsGuess).length ? fieldsGuess : null;
}

function buildChatOcrContext(
  result: SnapOcrUploadResult,
  scanAttemptId: string,
): ConciergeOcrContext {
  return {
    ocrText: result.ocrText || null,
    scanSchedule: result.scanSchedule || null,
    sourceEvidence: result.sourceEvidence || null,
    fieldsGuess: buildChatFieldsGuess(result),
    category: result.category || null,
    birthdayTemplateHint: result.birthdayTemplateHint ?? null,
    ocrSkin: result.ocrSkin || null,
    metadata: {
      scanAttemptId,
      sourceRoute: "/chat",
      thumbnailFocus: result.thumbnailFocus ?? null,
      openHouse: result.openHouse || null,
    },
  };
}

function chatUploadFailureMessage(error: string) {
  const trimmed = error.trim();
  return trimmed || "Upload scan failed before event creation. Please try again.";
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

function isReceivedInviteDraft(draft: ConciergeEventDraft | null) {
  return Boolean(
    draft &&
      (draft.ownership === "invited" ||
        draft.sourceContext.detectedSourceIntent === "received_invite"),
  );
}

function isReadyReceivedInviteDraft(draft: ConciergeEventDraft | null) {
  return isReceivedInviteDraft(draft) && getCreationReadiness(draft).canPublish;
}

function isAffirmativeReply(value: string) {
  return /^(yes|yep|yeah|sure|please|go ahead|do it|let'?s go)$/i.test(value.trim());
}

function isGenerateConfirmationMessage(value: string) {
  return /^(generate(?:\s+(?:it|now))?|create it|make it)$/i.test(value.trim());
}

function isReadyCreationDraft(draft: ConciergeEventDraft | null) {
  return Boolean(
    getCreationReadiness(draft).canPreview,
  );
}

const GIFT_FRIENDLY_DRAFT_EVENT_TYPES = new Set<ConciergeEventType>([
  "birthday",
  "wedding",
  "baby_shower",
  "gender_reveal",
  "bridal_shower",
  "graduation",
  "housewarming",
]);
const GIFT_REGISTRY_DRAFT_OUTPUTS = new Set<RequestedOutput>([
  "event_page",
  "live_card",
  "digital_flyer",
  "invitation",
  "printable_flyer",
]);
const GIFT_LIST_DRAFT_EVENT_TYPES = new Set<ConciergeEventType>([
  "birthday",
  "graduation",
  "housewarming",
]);

function draftHasGiftDetails(draft: ConciergeEventDraft | null) {
  return Boolean(
    draft?.registryLink || draft?.giftRegistryLink || draft?.giftPreferenceNote || draft?.giftNote,
  );
}

function shouldOfferGiftRegistryForDraft(draft: ConciergeEventDraft | null) {
  return Boolean(
    draft &&
      getCreationReadiness(draft).canPublish &&
      !draft.currentQuestion &&
      draft.missingFields.length === 0 &&
      draft.ownership !== "invited" &&
      GIFT_FRIENDLY_DRAFT_EVENT_TYPES.has(draft.eventType) &&
      draft.requestedOutputs.some((output) => GIFT_REGISTRY_DRAFT_OUTPUTS.has(output)) &&
      !draftHasGiftDetails(draft) &&
      !draft.giftPromptDismissed,
  );
}

function giftRegistryNounForDraft(draft: ConciergeEventDraft | null) {
  return draft && GIFT_LIST_DRAFT_EVENT_TYPES.has(draft.eventType) ? "gift list" : "registry";
}

function giftRegistryComposerPrefix(draft: ConciergeEventDraft | null) {
  return draft && GIFT_LIST_DRAFT_EVENT_TYPES.has(draft.eventType)
    ? "Gift list link"
    : "Registry link";
}

function draftHeadline(draft: ConciergeEventDraft | null) {
  if (draft?.titleConfirmed && draft.title) return draft.title;
  return draft?.previewCopy.headline || draft?.title || draft?.eventPurpose || "Event draft";
}

function draftSubheadline(draft: ConciergeEventDraft | null) {
  return draft?.previewCopy.subheadline || "Details coming together";
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

async function preloadGeneratedPreviewImage(imageUrl: string | null) {
  const url = stringValue(imageUrl);
  if (!url || typeof window === "undefined") return;

  await new Promise<void>((resolve) => {
    const image = new window.Image();
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      resolve();
    };
    const timeoutId = window.setTimeout(finish, 7_000);
    image.onload = async () => {
      try {
        await image.decode?.();
      } catch {}
      finish();
    };
    image.onerror = finish;
    image.src = url;
    if (image.complete) {
      const decodePromise = image.decode ? image.decode() : Promise.resolve();
      void decodePromise.catch(() => null).finally(finish);
    }
  });
}

function generatedProductHref(
  eventId: string | null,
  selectedOutput: RequestedOutput,
  returnHref?: string | null,
) {
  if (!eventId) return null;
  const href = buildEventProductPath({ eventId, output: selectedOutput });
  const visibleOutput = visibleProductOutput(selectedOutput);
  if (
    visibleOutput !== "live_card" &&
    visibleOutput !== "digital_flyer" &&
    visibleOutput !== "printable_flyer"
  ) {
    return href;
  }

  const [pathWithSearch, hash = ""] = href.split("#", 2);
  const [path, search = ""] = pathWithSearch.split("?", 2);
  const params = new URLSearchParams(search);
  params.set("preview", "owner");
  if (returnHref) params.set("returnTo", returnHref);
  const query = params.toString();
  return `${path}${query ? `?${query}` : ""}${hash ? `#${hash}` : ""}`;
}

function generatedRsvpDashboardHref(eventId: string | null, rsvpEnabled?: boolean | null) {
  if (!eventId || rsvpEnabled !== true) return null;
  return buildEventPath(eventId, null, { tab: "dashboard" });
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

function additionalLocationLine(location: ConciergeEventDraft["additionalLocations"][number]) {
  return uniqueDisplayLine(location.venue, location.location || location.address);
}

function additionalLocationNarrative(draft: ConciergeEventDraft) {
  const lines = (draft.additionalLocations || [])
    .map((location) => {
      const place = additionalLocationLine(location);
      if (!place) return null;
      const label = stringValue(location.label);
      const timeText = stringValue(location.timeText);
      const description = stringValue(location.description);
      const heading = label ? `${label} at ${place}` : place;
      return [heading, timeText ? `at ${timeText}` : null, description].filter(Boolean).join(" ");
    })
    .filter((value): value is string => Boolean(value));
  if (!lines.length) return null;
  return lines.length === 1 ? `${lines[0]}.` : `Event flow: ${lines.join("; ")}.`;
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
  if (draft.eventType === "anniversary") return "Anniversary";
  if (draft.eventType === "baby_shower" || draft.eventType === "gender_reveal") {
    return "Baby Shower";
  }
  if (draft.eventType === "bridal_shower") return "Bridal Shower";
  if (draft.eventType === "field_trip") return "Field Trip/Day";
  if (draft.eventType === "open_house") return draft.semanticKind === "school_open_house" ? "Custom Invite" : "Open House";
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

function timeInputFromDraft(value: string | null, timezone = "UTC"): string {
  const raw = stringValue(value);
  if (!raw) return "";
  const date = new Date(raw);
  if (!Number.isNaN(date.getTime()) && /^\d{4}-\d{2}-\d{2}/.test(raw)) {
    try {
      return new Intl.DateTimeFormat("en-GB", { timeZone: timezone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(date);
    } catch {
      return date.toISOString().slice(11, 16);
    }
  }
  return raw;
}

function draftVisualDirection(draft: ConciergeEventDraft, fallback: string): string {
  const theme = stringValue(draft.theme);
  const tone = stringValue(draft.tone);
  if (theme && tone) {
    return tone.toLowerCase().includes(theme.toLowerCase()) ? tone : `${theme}. ${tone}`;
  }
  return theme || tone || fallback;
}

function buildStudioDetailsFromDraft(draft: ConciergeEventDraft): EventDetails {
  const category = studioCategoryForDraft(draft);
  const details = createInitialDetails();
  const headline = draftHeadline(draft);
  const body =
    stringValue(draft.previewCopy.body) ||
    stringValue(draft.eventPurpose) ||
    `Join us for ${headline}.`;
  const locationNarrative = additionalLocationNarrative(draft);
  const venueName = stringValue(draft.venue) || "";
  const location = stringValue(draft.location) || venueName;
  const honoreeName = stringValue(draft.honoreeName) || "";
  const theme = draftVisualDirection(draft, `${category} invite`);
  const skinLabel = skinLabelForDraft(draft);
  const skinInstruction = draft.theme || draft.tone ? "" : `Use ${skinLabel} as optional style inspiration. Compose an original invitation around the user’s specific visual direction.`;
  const registryLink = stringValue(draft.registryLink) || stringValue(draft.giftRegistryLink) || "";
  const giftPreferenceNote =
    stringValue(draft.giftPreferenceNote) || stringValue(draft.giftNote) || "";
  const rsvpEnabled = draft.rsvpEnabled === true;
  const rsvpContact = stringValue(draft.rsvpContact) || "";
  const rsvpName = stringValue(draft.rsvpName) || (rsvpEnabled ? "Host" : "");
  const isEventPageProduct = draft.requestedOutputs.includes("event_page");

  return {
    ...details,
    ...publicContentForDraft(draft),
    category,
    eventKind: draft.eventType,
    eventTitle: headline,
    eventDate: dateInputFromDraft(draft),
    startTime: timeInputFromDraft(draft.startISO, draft.timezone) || stringValue(draft.timeText) || "",
    endTime: timeInputFromDraft(draft.endISO, draft.timezone),
    calendarStartISO: draft.startISO || undefined,
    calendarEndISO: draft.endISO || undefined,
    timezone: draft.timezone,
    rsvpEnabled,
    venueName,
    location,
    additionalLocations: draft.additionalLocations || [],
    detailsDescription: body,
    message: draftSubheadline(draft),
    specialInstructions: [
      skinInstruction,
      locationNarrative
        ? `Keep this event flow in Overview and Location button dialogs only; do not paint it on the artwork. ${locationNarrative}`
        : null,
      isEventPageProduct
        ? "Generate website hero/background artwork for the event page. Do not bake large title text, date/time, address, faux buttons, phone chrome, or website UI into the image because the event page renders real navigation, headings, schedule, location, RSVP form, calendar actions, and registry links in HTML."
        : draft.requestedOutputs.includes("live_card")
          ? "Live Card artwork may paint only the celebration title. Put when, where, movie, dinner, time, venue, RSVP and calendar facts in the guest-action buttons. Do not paint those facts or RSVP, Overview, Location, Calendar, or Registry labels. Use normal English word spacing; never glue words together."
          : null,
    ]
      .filter(Boolean)
      .join(" "),
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

function quoteDraftEditValue(value: string) {
  return `"${value.replace(/"/g, "'")}"`;
}

function buildGeneratedDraftImageEditPrompt(args: {
  userMessage: string;
  previousDraft: ConciergeEventDraft;
  nextDraft: ConciergeEventDraft;
}) {
  const instructions: string[] = [];
  const previousTime = stringValue(args.previousDraft.timeText);
  const nextTime = stringValue(args.nextDraft.timeText);
  const previousDate = stringValue(args.previousDraft.dateText);
  const nextDate = stringValue(args.nextDraft.dateText);
  const previousLocation =
    stringValue(args.previousDraft.venue) || stringValue(args.previousDraft.location);
  const nextLocation = stringValue(args.nextDraft.venue) || stringValue(args.nextDraft.location);
  const previousTitle = stringValue(args.previousDraft.title);
  const nextTitle = stringValue(args.nextDraft.title);

  if (previousTime && nextTime && previousTime !== nextTime) {
    instructions.push(
      `Replace only the visible time text ${quoteDraftEditValue(previousTime)} with ${quoteDraftEditValue(nextTime)}.`,
    );
  }
  if (previousDate && nextDate && previousDate !== nextDate) {
    instructions.push(
      `Replace only the visible date text ${quoteDraftEditValue(previousDate)} with ${quoteDraftEditValue(nextDate)}.`,
    );
  }
  if (previousLocation && nextLocation && previousLocation !== nextLocation) {
    instructions.push(
      `Replace only the visible venue/location text ${quoteDraftEditValue(previousLocation)} with ${quoteDraftEditValue(nextLocation)}.`,
    );
  }
  if (previousTitle && nextTitle && previousTitle !== nextTitle) {
    instructions.push(
      `Replace only the visible title text ${quoteDraftEditValue(previousTitle)} with ${quoteDraftEditValue(nextTitle)}.`,
    );
  }

  const requestedEdit = stringValue(normalizeArtworkEditLanguage(args.userMessage));
  if (requestedEdit) instructions.push(`User requested: ${requestedEdit}.`);
  instructions.push(...requestedArtworkRequirements(args.userMessage));
  instructions.push("The latest requested subject removals and lettering changes take priority over the source image and preservation rules. Apply every part of the request before returning the edited image.");
  instructions.push(
    "Treat this as a localized correction to the current generated card, not a new design request.",
  );
  instructions.push(
    "If the old and new visible text differ by only one or two characters, modify only those characters inside the existing label, unless a new lettering style was requested; then restyle the full requested headline.",
  );
  instructions.push(
    "Keep unrelated approved artwork, characters, props, colors, typography style and event text. Remove any fake interactive buttons, toolbars or phone chrome; do not preserve those defects.",
  );

  return instructions.join(" ");
}

function refreshGeneratedDraftInviteMetadata(
  existingInvite: GeneratedInvitePayload,
  updatedDraft: ConciergeEventDraft,
  pageTypography?: PageTypography,
): GeneratedInvitePayload {
  const details = { ...buildStudioDetailsFromDraft(updatedDraft),
    product: resolveStudioProduct(updatedDraft.requestedOutputs[0]),
    approvedWording: updatedDraft.copyStatus === "ready" ? updatedDraft.previewCopy.body : undefined,
    pageTypography: pageTypography || existingInvite.invitationData.eventDetails.pageTypography,
  };
  return {
    imageUrl: existingInvite.imageUrl,
    invitationData: refreshLiveCardInvitationData(details, existingInvite.invitationData),
  };
}

function isGeneratedDraftFullRedesignRequest(message: string): boolean {
  return isArtworkRedesignRequest(message);
}

function buildGeneratedDraftFullRedesignPrompt(userMessage: string): string {
  const requestedEdit = stringValue(userMessage);
  const instruction =
    "Create a completely new invitation design from scratch. Do not use, preserve, trace, copy, or edit the previous generated image, artwork, characters, props, layout, colors, typography, lighting, framing, or composition. Keep only the event facts and guest-facing intent.";
  return requestedEdit ? `${instruction} User requested: ${requestedEdit}.` : instruction;
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

export default function ConciergeChatClient({ userInitials = null }: ConciergeChatClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialAssistantPrompt = buildInitialAssistantPrompt();
  const userAvatarInitials = normalizeUserInitials(userInitials);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mainRef = useRef<HTMLElement | null>(null);
  const chatPaneRef = useRef<HTMLDivElement | null>(null);
  const composerCardRef = useRef<HTMLDivElement | null>(null);
  const messagesViewportRef = useRef<HTMLDivElement | null>(null);
  const isChatAtBottomRef = useRef(true);
  const chatViewportSizeRef = useRef({ width: 0, height: 0 });
  const shouldRefocusComposerRef = useRef(false);
  const responseAbortRef = useRef<AbortController | null>(null);
  const uploadAbortRef = useRef<AbortController | null>(null);
  const conversationVersionRef = useRef(0);
  useEffect(() => () => {
    conversationVersionRef.current += 1;
    responseAbortRef.current?.abort();
    generationAbortRef.current?.abort();
    uploadAbortRef.current?.abort();
    responseAbortRef.current = null;
  }, []);
  const unsentDraftId = useRef<string | null>(null);
  const messagesRef = useRef<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [selectedProductOutput, setSelectedProductOutput] = useState<RequestedOutput | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    newMessage("assistant", initialAssistantPrompt),
  ]);
  const [phase, setPhase] = useState<ConciergePhase>("intake_empty");
  const [draft, setDraft] = useState<ConciergeEventDraft | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isStreamingAssistant, setIsStreamingAssistant] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [chatUploadStage, setChatUploadStage] = useState<ChatUploadStage>("idle");
  const [generationStage, setGenerationStage] = useState<GenerationStage>("preparing");
  const [streamingPreviewImage, setStreamingPreviewImage] = useState<string | null>(null);
  const generationAbortRef = useRef<AbortController | null>(null);
  const [liveCardEventId, setLiveCardEventId] = useState<string | null>(null);
  const [liveCardTitle, setLiveCardTitle] = useState<string | null>(null);
  const [liveCardSummary, setLiveCardSummary] = useState<LiveCardSummary | null>(null);
  const [generatedInviteImageUrl, setGeneratedInviteImageUrl] = useState<string | null>(null);
  const [draftStudioInvite, setDraftStudioInvite] = useState<GeneratedInvitePayload | null>(null);
  const [restoringProgress, setRestoringProgress] = useState(Boolean(searchParams.get("thread")));
  const [uploadedPreviewImageUrl, setUploadedPreviewImageUrl] = useState<string | null>(null);
  const [uploadedPreviewFileName, setUploadedPreviewFileName] = useState<string | null>(null);
  const [pendingChatUpload, setPendingChatUpload] = useState<PendingChatUpload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [failedRequest, setFailedRequest] = useState<FailedConciergeRequest | null>(null);
  const [failedSnapUpload, setFailedSnapUpload] = useState<FailedSnapUploadRequest | null>(null);
  const [isComposerFocused, setIsComposerFocused] = useState(false);
  const [mobileView, setMobileView] = useState<"chat" | "preview">("chat");
  const [rsvpPreview, setRsvpPreview] = useState<RsvpPreviewState>(EMPTY_RSVP_PREVIEW);
  const [weatherContext, setWeatherContext] = useState<ConciergeWeatherContext | null>(null);
  const [isReadyChatComposerOpen, setIsReadyChatComposerOpen] = useState(false);
  const scanStatusFromQuery = searchParams.get("scanStatus");
  const scanErrorFromQuery = searchParams.get("scanError");

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (!scanStatusFromQuery) return;
    if (scanStatusFromQuery === "failed") {
      const errorMessage =
        typeof scanErrorFromQuery === "string" && scanErrorFromQuery.trim()
          ? scanErrorFromQuery
          : "Upload scan failed before event creation. Please try again.";
      setError(errorMessage);
      setMessages((prev) => [
        ...prev,
        newMessage(
          "assistant",
          "I couldn't finish creating your event from that upload. Please retry or upload a clearer image.",
        ),
      ]);
    }
    const next = new URLSearchParams(searchParams.toString());
    next.delete("scanStatus");
    next.delete("scanError");
    const query = next.toString();
    router.replace(query ? `/chat?${query}` : "/chat");
  }, [router, scanErrorFromQuery, scanStatusFromQuery, searchParams]);

  const isGeneratingCard = phase === "generating_card";
  const isPublishingCard = phase === "publishing_card";
  const isEditingGeneratedCard = phase === "editing_card";
  const isUpdatingPreview = isEditingGeneratedCard && isSending;
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
  const isBusy = isSending || isUploading || isGeneratingCard || isPublishingCard;
  const progress = useEventProgress({
    snapshot: { draft, studioInvite: draftStudioInvite, messages: chatMessagesForPersistence(messages), input, selectedProductOutput, pendingUpload: pendingChatUpload ? { name: pendingChatUpload.file.name, size: pendingChatUpload.file.size, modified: pendingChatUpload.file.lastModified, source: pendingChatUpload.source } : null },
    ready: !restoringProgress,
    enabled: !liveCardEventId && Boolean(draft || input.trim() || selectedProductOutput || pendingChatUpload || messages.some((message) => message.role === "user" && !signupFormHandoff(message.text))),
    busy: isBusy,
    save: async () => {
      await saveChatProgress();
    },
    discard: () => { resetConversation(); },
  });
  const busyLabel = isUploading
    ? chatUploadStage === "creating_event"
      ? "Creating event"
      : chatUploadStage === "ocr_ready"
        ? "Reading upload"
        : chatUploadStage === "scanning"
          ? "Scanning upload"
          : "Preparing upload"
    : isEditingGeneratedCard
      ? "Updating preview"
      : isGeneratingCard
        ? "Generating invite"
        : isPublishingCard
          ? "Publishing invite"
          : "Envitefy Create is thinking...";
  const isThinking = busyLabel === "Envitefy Create is thinking..." && !isStreamingAssistant;
  const isCompactEmptyComposer =
    isEmptyState && !input.trim() && !isComposerFocused;
  const effectiveSelectedProductOutput = selectedProductOutput || "live_card";
  const effectiveSelectedProductLabel = productActionLabel(draft, effectiveSelectedProductOutput);
  const hasGeneratedDraftProduct = Boolean(draftStudioInvite);
  const currentLiveCardSummary =
    liveCardSummary || liveCardSummaryFromDraft(draft, effectiveSelectedProductOutput);
  const previewTitle = liveCardTitle || currentLiveCardSummary.headline;
  const hasReadyReceivedInvite = isReadyReceivedInviteDraft(draft) && !liveCardEventId;
  const hasReadyDraftProduct =
    isReadyProductDraft(draft) &&
    !isReceivedInviteDraft(draft) &&
    !liveCardEventId &&
    !hasGeneratedDraftProduct;
  const canGenerateProduct = hasReadyDraftProduct && !isBusy;
  const canSaveReceivedInvite = hasReadyReceivedInvite && !isBusy;
  const shouldShowGiftRegistryPrompt = shouldOfferGiftRegistryForDraft(draft);
  const giftRegistryNoun = giftRegistryNounForDraft(draft);
  const giftRegistryPrefix = giftRegistryComposerPrefix(draft);
  const giftRegistryCreateUrl = shouldShowGiftRegistryPrompt
    ? getAmazonRegistryCreateUrlForCategory(draft?.eventType)
    : null;
  const shouldShowProductPanel =
    hasGeneratedDraftProduct ||
    phase === "generating_card" ||
    phase === "card_ready" ||
    phase === "editing_card" ||
    Boolean(liveCardEventId);
  const rsvpDashboardHref = generatedRsvpDashboardHref(liveCardEventId, draft?.rsvpEnabled);
  const liveCardPublicHref = generatedProductHref(
    liveCardEventId,
    effectiveSelectedProductOutput,
    rsvpDashboardHref,
  );
  const threadId = searchParams.get("thread")?.trim() || null;
  const currentPreviewImage =
    streamingPreviewImage ||
    draftStudioInvite?.imageUrl ||
    generatedInviteImageUrl ||
    (canUploadFlyerToOutput(effectiveSelectedProductOutput) ? uploadedPreviewImageUrl : null) ||
    previewImageForDraft(draft);
  const selectedCategoryLabel =
    categoryLabelForDraft(draft);
  const hasComposerSelection = Boolean(selectedProductOutput);
  const canAttachFlyer = !isBusy && canUploadFlyerToOutput(selectedProductOutput);
  const canSubmitComposer = Boolean(input.trim() || hasComposerSelection || pendingChatUpload) &&
    (!pendingChatUpload || canAttachFlyer);
  const selectedSkinLabel =
    skinLabelForCategoryName(selectedCategoryLabel) || skinLabelForDraft(draft);
  const rsvpResponseNames = rsvpPreview.responses.map(
    (response) => response.name || response.email || "Guest",
  );
  const rsvpResponseCount =
    rsvpPreview.stats.yes + rsvpPreview.stats.no + rsvpPreview.stats.maybe ||
    rsvpResponseNames.length ||
    rsvpPreview.filled;
  const shouldShowReceivedInviteActions = hasReadyReceivedInvite && !isReadyChatComposerOpen;
  const shouldShowGiftRegistryActions = shouldShowGiftRegistryPrompt && !isReadyChatComposerOpen &&
    !hasGeneratedDraftProduct && !isGeneratingCard && !liveCardEventId;
  const shouldShowGenerateReply = Boolean(
    hasReadyDraftProduct &&
      (canGenerateProduct || isGeneratingCard) &&
      draft &&
      getCreationReadiness(draft).canPublish &&
      !failedRequest &&
      !failedSnapUpload &&
      visibleMessages[visibleMessages.length - 1]?.role === "assistant" &&
      !visibleMessages[visibleMessages.length - 1]?.text.includes(SIGNUP_FORM_GALLERY_HREF),
  );
  function selectProductOutputForDraft(nextDraft: ConciergeEventDraft) {
    const restoredOutput = nextDraft.requestedOutputs
      .map(visibleProductOutput)
      .find((output) => PRODUCT_OPTIONS.some((option) => option.output === output));
    setSelectedProductOutput(restoredOutput || null);
  }

  function resetConversation() {
    unsentDraftId.current = null;
    conversationVersionRef.current += 1;
    responseAbortRef.current?.abort();
    generationAbortRef.current?.abort();
    uploadAbortRef.current?.abort();
    responseAbortRef.current = null;
    setStreamingPreviewImage(null);
    setGenerationStage("preparing");
    setIsSending(false);
    setInput("");
    setError(null);
    setDraft(null);
    setPhase("intake_empty");
    setIsStreamingAssistant(false);
    setLiveCardEventId(null);
    setLiveCardTitle(null);
    setLiveCardSummary(null);
    setGeneratedInviteImageUrl(null);
    setDraftStudioInvite(null);
    setUploadedPreviewImageUrl(null);
    setUploadedPreviewFileName(null);
    setPendingChatUpload(null);

    setRsvpPreview(EMPTY_RSVP_PREVIEW);
    setSelectedProductOutput(null);
    setFailedRequest(null);
    setFailedSnapUpload(null);
    setIsUploading(false);
    setChatUploadStage("idle");
    setWeatherContext(null);
    setMobileView("chat");
    setIsReadyChatComposerOpen(false);
    setMessages([newMessage("assistant", initialAssistantPrompt)]);
  }

  function focusComposerAtEnd() {
    window.requestAnimationFrame(() => {
      const textarea = composerCardRef.current?.querySelector("textarea");
      if (!textarea) return;
      textarea.focus({ preventScroll: true });
      const end = textarea.value.length;
      textarea.setSelectionRange(end, end);
    });
  }

  function openGiftRegistryComposer() {
    setIsReadyChatComposerOpen(true);
    setInput((current) => (current.trim() ? current : `${giftRegistryPrefix}: `));
    shouldRefocusComposerRef.current = true;
    focusComposerAtEnd();
  }

  function handleCreateAmazonGiftRegistry() {
    if (giftRegistryCreateUrl) {
      window.open(giftRegistryCreateUrl, "_blank", "noopener,noreferrer");
    }
    openGiftRegistryComposer();
  }

  async function handleSkipGiftRegistry() {
    if (isBusy || !draft) return;
    const draftBeforeSkip = draft;
    setDraft((current) =>
      current?.creationSessionId === draftBeforeSkip.creationSessionId
        ? { ...current, giftPromptDismissed: true }
        : current,
    );
    setIsReadyChatComposerOpen(false);
    await sendToConcierge({
      message: "Skip gift link",
      action: "chip",
      echo: "Skip gift link",
    });
  }

  function refocusComposerAfterResponse() {
    if (!shouldRefocusComposerRef.current) return;
    shouldRefocusComposerRef.current = false;
    focusComposerAtEnd();
  }

  function selectionPrefix(categoryLabel: string | null, productOutput: RequestedOutput | null) {
    return [categoryLabel, productOutput ? productOptionLabel(productOutput) : null]
      .filter(Boolean)
      .join(" ");
  }

  function updateComposerSelection() {
    const previousPrefix = selectionPrefix(
      categoryLabelForDraft(draft),
      selectedProductOutput,
    );

    setInput((current) => {
      const trimmed = current.trimStart();
      const previousMatches =
        previousPrefix && trimmed.toLowerCase().startsWith(previousPrefix.toLowerCase());
      const suffix = previousMatches ? trimmed.slice(previousPrefix.length).trimStart() : trimmed;
      return suffix;
    });
  }

  function handleComposerValueChange(nextValue: string) {
    setInput(nextValue);
  }

  function removeSelectedProductOutput() {
    if (isBusy || !selectedProductOutput) return;
    if (draft?.requestedOutputs.includes(selectedProductOutput)) {
      void sendToConcierge({ message: `Remove the ${OUTPUT_LABELS[selectedProductOutput]}.` });
      return;
    }
    updateComposerSelection();
    setSelectedProductOutput(null);
  }

  useEffect(() => {
    if (!canGenerateProduct) setIsReadyChatComposerOpen(false);
  }, [canGenerateProduct]);

  useEffect(() => {
    return () => {
      revokeObjectUrl(uploadedPreviewImageUrl);
    };
  }, [uploadedPreviewImageUrl]);

  useEffect(() => {
    if (isReadyChatComposerOpen) focusComposerAtEnd();
  }, [isReadyChatComposerOpen]);

  useVisualViewportInsets({
    keyboardInsetVariable: "--envitefy-chat-keyboard-inset",
    layoutHeightVariable: "--envitefy-chat-layout-height",
    layoutTopVariable: "--envitefy-chat-layout-top",
    fitVisualViewport: true,
    lockPageScroll: true,
  });

  useEffect(() => {
    function handleNewChatSession() {
      progress.requestLeave(() => {
        resetConversation();
        progress.markSaved();
        progress.allowNavigation(() => router.replace("/chat"));
      });
    }

    window.addEventListener("envitefy:chat:new", handleNewChatSession);
    return () => {
      window.removeEventListener("envitefy:chat:new", handleNewChatSession);
    };
  }, [progress.requestLeave, progress.allowNavigation, progress.markSaved, router]);

  useEffect(() => {
    let cancelled = false;
    conversationVersionRef.current += 1;
    responseAbortRef.current?.abort();
    responseAbortRef.current = null;
    generationAbortRef.current?.abort();
    uploadAbortRef.current?.abort();
    setStreamingPreviewImage(null);
    setGenerationStage("preparing");

    if (!threadId) {
      resetConversation();
      setRestoringProgress(false);
      progress.markSaved();
      return () => {
        cancelled = true;
      };
    }
    const targetThreadId = threadId;
    const restoreController = new AbortController();
    responseAbortRef.current = restoreController;
    setRestoringProgress(true);

    async function restoreThread() {
      setError(null);
      setIsSending(true);
      try {
        const response = await fetch(
          `/api/creation/intake?threadId=${encodeURIComponent(targetThreadId)}`,
          {
            signal: restoreController.signal,
            credentials: "include",
          },
        );
        const json = (await response
          .json()
          .catch(() => null)) as CreationSessionResumeResponse | null;
        if (cancelled || restoreController.signal.aborted || !response.ok || !json?.ok || !json.draft) return;

        const metadata = json.creationSession?.metadata;
        const pending = metadata?.pendingUpload;
        setPendingChatUpload(null);
        if (pending && typeof pending === "object" && !Array.isArray(pending)) {
          const file = pending as Record<string, unknown>;
          if (typeof file.url === "string" && typeof file.name === "string" && typeof file.type === "string") {
            const response = await fetch(file.url, { signal: restoreController.signal });
            if (!response.ok) throw new Error("Your saved upload could not be opened. Please retry opening this draft.");
            const blob = await response.blob();
            if (cancelled || restoreController.signal.aborted) return;
            setPendingChatUpload({ file: new File([blob], file.name, { type: file.type }), source: file.source === "camera" ? "camera" : "upload" });
          }
        }
        setUploadedPreviewImageUrl(typeof metadata?.sourceImageUrl === "string" ? metadata.sourceImageUrl : null);
        const restoredDraft = normalizeDraftProductOutputs(json.draft);
        const savedEventId = json.savedEventId || null;
        const invitationData = json.studioInvite
          ? sanitizeInvitationData(json.studioInvite.invitationData, buildStudioDetailsFromDraft(restoredDraft))
          : undefined;
        const restoredPreview = json.studioInvite && invitationData
          ? { imageUrl: json.studioInvite.imageUrl, invitationData }
          : null;
        const hasPreview = Boolean(savedEventId || restoredPreview);
        const restoredOutput =
          restoredDraft.requestedOutputs
            .map(visibleProductOutput)
            .find((output) => PRODUCT_OPTIONS.some((option) => option.output === output)) || null;
        setInput(typeof json.creationSession?.metadata.composerText === "string" ? json.creationSession.metadata.composerText : "");
        setDraft(restoredDraft);
        setSelectedProductOutput(restoredOutput);
        setDraftStudioInvite(savedEventId ? null : restoredPreview);
        setGeneratedInviteImageUrl(restoredPreview?.imageUrl || null);
                setLiveCardEventId(savedEventId);
        setLiveCardTitle(hasPreview ? draftHeadline(restoredDraft) : null);
        setLiveCardSummary(
          liveCardSummaryFromDraft(restoredDraft, restoredOutput || effectiveSelectedProductOutput),
        );

        setMobileView(hasPreview ? "preview" : "chat");
        setWeatherContext(json.weatherContext || null);
        setIsReadyChatComposerOpen(false);
        setPhase(
          hasPreview
            ? "card_ready"
            : isReadyProductDraft(restoredDraft)
              ? "ready_to_generate"
              : "collecting_details",
        );
        setMessages(
          json.chatMessages?.length
            ? chatMessagesFromSnapshots(json.chatMessages)
            : [
                newMessage(
                  "assistant",
                  hasPreview
                    ? "Thread opened. Your generated invite is ready to refine."
                    : "Thread opened. We can keep collecting the details from here.",
                ),
              ],
        );
      } catch (err) {
        if (!cancelled && !restoreController.signal.aborted) {
          setError(err instanceof Error ? err.message : "Unable to open AI thread.");
        }
      } finally {
        if (!cancelled && !restoreController.signal.aborted) { setIsSending(false); setRestoringProgress(false); }
        if (responseAbortRef.current === restoreController) responseAbortRef.current = null;
      }
    }

    void restoreThread();
    return () => {
      cancelled = true;
      restoreController.abort();
    };
  }, [threadId]);

  useEffect(() => {
    const viewport = messagesViewportRef.current;
    if (viewport) viewport.scrollTop = viewport.scrollHeight;
  }, [messages, isBusy]);

  useEffect(() => {
    const viewport = messagesViewportRef.current;
    if (!viewport) return;
    const observer = new ResizeObserver(() => {
      if (isChatAtBottomRef.current) viewport.scrollTop = viewport.scrollHeight;
      chatViewportSizeRef.current = { width: viewport.clientWidth, height: viewport.clientHeight };
    });
    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);

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
          throw new Error(
            conciergeClientErrorMessage(payload?.error || payload, "Unable to load RSVP responses."),
          );
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
    options: {
      editPrompt?: string | null;
      sourceImageUrl?: string | null;
      previousDraft?: ConciergeEventDraft | null;
      pageTypography?: PageTypography;
    } = {},
  ): Promise<GeneratedInvitePayload> {
    const conversationVersion = conversationVersionRef.current;
    const controller = new AbortController();
    generationAbortRef.current?.abort();
    generationAbortRef.current = controller;
    const details = { ...buildStudioDetailsFromDraft(draftToGenerate),
      product: resolveStudioProduct(draftToGenerate.requestedOutputs.find((output) => ["live_card", "digital_flyer", "printable_flyer", "event_page", "invitation"].includes(output))),
      approvedWording: draftToGenerate.copyStatus === "ready" ? draftToGenerate.previewCopy.body : undefined,
      rsvpEnabled: draftToGenerate.rsvpEnabled === true,
      timezone: draftToGenerate.timezone,
      pageTypography: options.pageTypography || draftStudioInvite?.invitationData.eventDetails.pageTypography,
    };
    const sourceImageUrl = stringValue(options.sourceImageUrl);
    const editPrompt = stringValue(options.editPrompt);
    const previousDetails = options.previousDraft
      ? buildStudioDetailsFromDraft(options.previousDraft)
      : undefined;
    const response = await requestStudioGeneration(
      details,
      sourceImageUrl ? "image" : "both",
      details.product === "digital_flyer" || details.product === "printable_flyer" ? "image" : "page",
      editPrompt || undefined,
      sourceImageUrl || undefined,
      previousDetails,
      {
        signal: controller.signal,
        onProgress: (event) => {
          if (conversationVersion !== conversationVersionRef.current) return;
          if (event.type === "stage") setGenerationStage(event.stage);
          if (event.type === "preview") setStreamingPreviewImage(event.imageDataUrl);
        },
      },
    ).finally(() => { if (generationAbortRef.current === controller) generationAbortRef.current = null; });
    controller.signal.throwIfAborted();
    if (conversationVersion !== conversationVersionRef.current) throw new DOMException("Cancelled", "AbortError");
    const generatedDetails = response.preparedDetails || details;
    const rawImageUrl = response.imageUrl || response.imageDataUrl;
    if (!rawImageUrl) {
      throw new Error("Studio did not return an invite image.");
    }

    const fileName = `${buildEventSlug(draftHeadline(draftToGenerate)) || "envitefy-invite"}.png`;
    const imageUrl = await persistImageMediaValue({
      value: rawImageUrl,
      preferOriginal: details.product === "digital_flyer" || details.product === "printable_flyer",
      fileName,
    });
    if (!imageUrl) {
      throw new Error("The generated invite image could not be saved.");
    }

    return {
      imageUrl,
      invitationData: {
        ...buildInvitationData(generatedDetails, response),
        diagnostics: response.diagnostics,
        artworkContract: response.artworkContract,
        artworkTextMode: response.artworkTextMode || (sourceImageUrl ? draftStudioInvite?.invitationData.artworkTextMode : undefined),
        artworkNotice: response.qualityCheck === "unavailable"
          ? "Automatic artwork review was unavailable. Please check the lettering and event details before sharing."
          : response.qualityCheck === "needs_review"
            ? "Please check the artwork framing before sharing."
            : undefined,
      },
    };
  }

  async function uploadedFlyerSourceImageUrl() {
    if (!canUploadFlyerToOutput(effectiveSelectedProductOutput) || !uploadedPreviewImageUrl) return null;
    return persistImageMediaValue({
      value: uploadedPreviewImageUrl,
      fileName: uploadedPreviewFileName || "uploaded-flyer-source.png",
    });
  }

  async function saveChatProgress(draftToSave = draft) {
    const snapshotDraft = draftToSave || fallbackExtractConciergeDraft({ message: "", requestedOutputs: selectedProductOutput ? [selectedProductOutput] : null });
    if (!draftToSave) {
      unsentDraftId.current ||= snapshotDraft.creationSessionId;
      snapshotDraft.creationSessionId = unsentDraftId.current;
    }
    let pendingUpload = null;
    if (pendingChatUpload) {
      const uploaded = await uploadMediaFile({ file: pendingChatUpload.file, usage: "attachment" });
      const stored = uploaded.stored.source || uploaded.stored.display;
      if (!stored?.url) throw new Error("Your selected upload could not be saved. Please retry.");
      pendingUpload = { url: stored.url, name: pendingChatUpload.file.name, type: stored.mimeType, source: pendingChatUpload.source };
    }
    const sourceImageUrl = uploadedPreviewImageUrl ? await persistImageMediaValue({ value: uploadedPreviewImageUrl, fileName: uploadedPreviewFileName || "event-source" }) : null;
    const response = await fetch("/api/creation/draft", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        draft: snapshotDraft,
        studioInvite: draftStudioInvite,
        composerText: input,
        pendingUpload,
        sourceImageUrl,
        chatMessages: chatMessagesForPersistence(messages),
      }),
    });
    const result = await response.json();
    if (!response.ok || !result.ok) throw new Error(result.error || "Unable to save your progress.");
    if (!draftToSave) setDraft(snapshotDraft);
    notifyCreationThreadsChanged();
  }

  async function generateProductForDraft(draftToGenerate: ConciergeEventDraft) {
    const conversationVersion = conversationVersionRef.current;
    const productDraft = normalizeDraftProductOutputs(draftToGenerate);
    if (!isReadyProductDraft(productDraft)) {
      setError("Add the missing event details before generating the invite.");
      return;
    }
    setError(null);
    setPhase("generating_card");
    setGenerationStage("preparing");
    setStreamingPreviewImage(null);
    setMobileView("preview");

    try {
      const sourceImageUrl = await uploadedFlyerSourceImageUrl();
      if (conversationVersion !== conversationVersionRef.current) return;
      const studioInvite = await generateStudioInviteForDraft(productDraft, {
        sourceImageUrl,
      });
      if (conversationVersion !== conversationVersionRef.current) return;
      const generatedMessage = newMessage(
        "assistant",
        `Your ${effectiveSelectedProductLabel.toLowerCase()} is generated. You can review it in the preview or tell me what to change.`,
      );
      await preloadGeneratedPreviewImage(studioInvite.imageUrl);
      if (conversationVersion !== conversationVersionRef.current) return;
      setDraft(productDraft);
      setDraftStudioInvite(studioInvite);
      setStreamingPreviewImage(null);
      setGeneratedInviteImageUrl(studioInvite.imageUrl);
      setLiveCardEventId(null);
      setLiveCardTitle(draftHeadline(productDraft));
      setLiveCardSummary(liveCardSummaryFromDraft(productDraft, effectiveSelectedProductOutput));

      setPhase("card_ready");
      setMessages((prev) => [...prev, generatedMessage]);
      notifyCreationThreadsChanged();
    } catch (err) {
      if (conversationVersion !== conversationVersionRef.current) return;
      setStreamingPreviewImage(null);

      setPhase(draftToGenerate.canPersist ? "ready_to_generate" : "collecting_details");
      setMobileView("chat");
      setError(err instanceof Error ? err.message : "Unable to generate invite.");
    }
  }

  async function publishGeneratedDraft() {
    if (isBusy || !draft || !draftStudioInvite) return;
    const productDraft = normalizeDraftProductOutputs(draft);
    if (!getCreationReadiness(productDraft).canPublish) {
      setError("Add the missing event details before publishing the invite.");
      return;
    }

    setError(null);
    setPhase("publishing_card");

    try {
      await saveChatProgress(productDraft);
      const response = await fetch("/api/creation/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          message: "",
          action: "save",
          draft: productDraft,
          studioInvite: draftStudioInvite,
          persistSession: true,
          chatMessages: chatMessagesForPersistence(messages),
        }),
      });
      const json = (await response.json().catch(() => null)) as ConciergeMessageResponse | null;
      if (!response.ok || !json?.ok) {
        throw new Error(
          conciergeClientErrorMessage(json && !json.ok ? json.error : json, "Unable to publish invite."),
        );
      }
      const savedEventId = json.savedEventId;
      if (!savedEventId) throw new Error("Invite was published without an event id.");
  
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
        setMessages(chatMessagesFromSnapshots(json.chatMessages));
      } else {
        setMessages((prev) => [
          ...prev,
          newMessage(
            "assistant",
            "Your invite is published. You can open the live card or dashboard now.",
          ),
        ]);
      }
      notifyCreationThreadsChanged();
    } catch (err) {
      setPhase("card_ready");
      setError(err instanceof Error ? err.message : "Unable to publish invite.");
    }
  }

  async function sendGeneratedDraftEdit(message: string) {
    const trimmed = message.trim();
    if (!trimmed || !draft) return;
    const conversationVersion = conversationVersionRef.current;
    const responseController = new AbortController();
    responseAbortRef.current?.abort();
    responseAbortRef.current = responseController;

    const fullRedesign = isGeneratedDraftFullRedesignRequest(trimmed);
    const userMessage = newMessage("user", trimmed);
    setError(null);
    setFailedRequest(null);
    setIsSending(true);
    setPhase(fullRedesign ? "generating_card" : "editing_card");
    setGenerationStage("preparing");
    setStreamingPreviewImage(null);

    setMessages((prev) => [...prev, userMessage]);
    try {
      const response = await fetch(withConciergeTiming(CREATION_INTAKE_URL), {
        signal: responseController.signal,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          message: trimmed,
          draft,
          activeContext: {
            route: "/chat",
            currentEventId: null,
            currentDraftId: draft.creationSessionId || null,
            selectedUploadId: null,
            selectedTemplateId: null,
            currentAssetId: null,
            lastUserAction: "message",
          },
          requestedOutputs: draft.requestedOutputs.length
            ? draft.requestedOutputs
            : [effectiveSelectedProductOutput],
          action: "message",
          chatMessages: chatMessagesForPersistence(messages, [userMessage]),
        }),
      });
      const json = (await response.json().catch(() => null)) as ConciergeMessageResponse | null;
      if (!response.ok || !json?.ok) {
        throw new Error(
          conciergeClientErrorMessage(json && !json.ok ? json.error : json, "Draft update failed."),
        );
      }

      const updatedDraft = normalizeDraftProductOutputs(json.draft);
      if (conversationVersion !== conversationVersionRef.current || responseController.signal.aborted || responseAbortRef.current !== responseController) return;
      const existingDraftImageUrl = draftStudioInvite?.imageUrl || generatedInviteImageUrl;
      const product = resolveStudioProduct(updatedDraft.requestedOutputs[0]);
      const productEdit = resolveProductEditPlan(product, trimmed);
      if (productEdit.unsupportedPageChanges.length) {
        throw new Error("That page font or layout change is not supported yet. You can request larger lettering, clearer contrast, or light or dark text. Your current page is unchanged.");
      }
      const previousTypography = draftStudioInvite?.invitationData.eventDetails.pageTypography || {};
      const pageTypography = { ...previousTypography, ...productEdit.pageTypography };
      if (productEdit.pageTypography.scale) {
        pageTypography.scale = Math.min(1.5, (previousTypography.scale || 1) * productEdit.pageTypography.scale);
      }
      const typographyChanged = JSON.stringify(previousTypography) !== JSON.stringify(pageTypography);
      const turnReceipt = buildPersonaTurnReceipt(updatedDraft, draft);
      const typographyOnly = product === "event_page" && Object.keys(productEdit.pageTypography).length > 0 && !productEdit.hasRasterChanges;
      const outputChanged = product !== resolveStudioProduct(draft.requestedOutputs[0]);
      const canReuseCurrentImage =
        !fullRedesign &&
        !outputChanged &&
        Boolean(draftStudioInvite) &&
        (typographyOnly || !shouldRegenerateGeneratedDraftImageForEdit({
          userMessage: product === "event_page" ? productEdit.rasterInstruction : trimmed,
          previousDraft: draft,
          nextDraft: updatedDraft,
          artworkTextMode: product === "event_page" ? "none" : draftStudioInvite?.invitationData.artworkTextMode,
        }));
      const studioInvite =
        canReuseCurrentImage && draftStudioInvite
          ? refreshGeneratedDraftInviteMetadata(draftStudioInvite, updatedDraft, pageTypography)
          : await generateStudioInviteForDraft(updatedDraft, {
              editPrompt: fullRedesign
                ? buildGeneratedDraftFullRedesignPrompt(trimmed)
                : product === "event_page" ? productEdit.rasterInstruction : buildGeneratedDraftImageEditPrompt({
                    userMessage: trimmed,
                    previousDraft: draft,
                    nextDraft: updatedDraft,
                  }),
              sourceImageUrl: fullRedesign ? null : existingDraftImageUrl,
              previousDraft: fullRedesign ? null : draft,
              pageTypography,
            });
      const updatedMessage = newMessage(
        "assistant",
        fullRedesign
          ? "I generated a completely new draft design from scratch. Review it in the preview, then keep chatting or save/publish when it looks right."
          : canReuseCurrentImage
            ? typographyOnly
              ? typographyChanged ? "I updated the page lettering in the preview. Your artwork is unchanged." : "The page already has these lettering settings. The supported text-size limit is 150%."
              : turnReceipt.changedFields.length
                ? "I updated the event details. The artwork is unchanged."
                : conciergeCapabilityAnswer(trimmed) || guardPersonaSentence(json.assistantMessage || "The event details are unchanged in this chat.", updatedDraft, turnReceipt)
            : "I updated the artwork in the draft preview. Review it, then keep chatting or save/publish when it looks right.",
      );
      if (conversationVersion !== conversationVersionRef.current || responseController.signal.aborted || responseAbortRef.current !== responseController) return;
      if (!canReuseCurrentImage) {
        await preloadGeneratedPreviewImage(studioInvite.imageUrl);
      }
      if (conversationVersion !== conversationVersionRef.current || responseController.signal.aborted || responseAbortRef.current !== responseController) return;
      setDraft(updatedDraft);
      selectProductOutputForDraft(updatedDraft);
      setDraftStudioInvite(studioInvite);
      setStreamingPreviewImage(null);
      setGeneratedInviteImageUrl(studioInvite.imageUrl);
      setLiveCardEventId(null);
      setLiveCardTitle(draftHeadline(updatedDraft));
      setLiveCardSummary(liveCardSummaryFromDraft(updatedDraft, updatedDraft.requestedOutputs[0] || effectiveSelectedProductOutput));
      setWeatherContext(json.weatherContext || null);

      setPhase("card_ready");
      setMobileView("preview");
      setMessages((prev) => [...prev, updatedMessage]);
      notifyCreationThreadsChanged();
    } catch (err) {
      if (conversationVersion !== conversationVersionRef.current || responseController.signal.aborted || responseAbortRef.current !== responseController) return;
      setStreamingPreviewImage(null);

      setPhase("card_ready");
      setError(err instanceof Error ? err.message : "Draft update failed.");
    } finally {
      if (conversationVersion === conversationVersionRef.current && responseAbortRef.current === responseController) {
        if (responseAbortRef.current === responseController) responseAbortRef.current = null;
        setIsSending(false);
        refocusComposerAfterResponse();
      }
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
    if (isUnsupportedExternalConciergeRequest(trimmed)) {

      setPhase("card_ready");
      setMessages((prev) => [
        ...prev,
        newMessage("assistant", UNSUPPORTED_EXTERNAL_CONCIERGE_MESSAGE),
      ]);
      setIsSending(false);
      refocusComposerAfterResponse();
      return;
    }
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
        throw new Error(
          conciergeClientErrorMessage(json && !json.ok ? json.error : json, "Preview update failed."),
        );
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
      refocusComposerAfterResponse();
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
    retryReply?: boolean;
    pendingMessages?: ChatMessage[];
  }): Promise<ConciergeStreamStatePayload | null> {
    const message = params.message.trim();
    if (!message && !params.ocrContext) return null;
    const conversationVersion = conversationVersionRef.current;

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
    const responseController = new AbortController();
    responseAbortRef.current?.abort();
    responseAbortRef.current = responseController;
    let streamAssistantId: string | null = null;
    let streamedAssistantText = "";
    try {
      const contextCategory =
        params.starterCategory ||
        categoryLabelForDraft(draft);
      const contextSkin =
        skinLabelForCategoryName(contextCategory) ||
        params.activeContext?.selectedSkin ||
        selectedSkinLabel;
      const baseActiveContext: ConciergeActiveContext = params.activeContext || {
        route: "/chat",
        currentEventId: liveCardEventId,
        currentDraftId: draft?.creationSessionId || null,
        selectedUploadId: params.ocrContext ? `upload_${Date.now()}` : null,
        selectedTemplateId: null,
        currentAssetId: null,
        lastUserAction: params.action || "message",
      };
      const activeContext: ConciergeActiveContext = {
        ...baseActiveContext,
        selectedCategory: baseActiveContext.selectedCategory ?? contextCategory,
        selectedProduct:
          baseActiveContext.selectedProduct ??
          params.requestedOutputs?.[0] ??
          selectedProductOutput,
        inputMethod:
          baseActiveContext.inputMethod ?? (params.ocrContext ? "upload" : message ? "text" : null),
        selectedSkin: baseActiveContext.selectedSkin ?? contextSkin,
        previewStatus:
          baseActiveContext.previewStatus ??
          (draft ? (isReadyProductDraft(draft) ? "preview_ready" : "review") : "empty"),
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
        persistSession: false,
        message,
        draft,
        ocrContext: params.ocrContext || null,
        activeContext,
        requestedOutputs,
        starterCategory: params.starterCategory || null,
        action,
        retryReply: params.retryReply === true,
        chatMessages: chatMessagesForPersistence(messagesRef.current, [
          ...(params.pendingMessages || []),
          ...(userMessage ? [userMessage] : []),
        ]),
      };
      const isExplicitProductChoice =
        Boolean(params.requestedOutputs?.length) &&
        (action === "chip" || action === "starter_category");
      const isDateConfirmationReply = draft?.currentQuestion === "date_confirmation";
      const shouldStream =
        !params.ocrContext &&
        (!isDateConfirmationReply || params.retryReply) &&
        !isExplicitProductChoice &&
        (action === "message" || action === "chip" || action === "starter_category");

      if (shouldStream) {
        const assistantPlaceholder = newMessage("assistant", "");
        streamAssistantId = assistantPlaceholder.id;
        setMessages((prev) => [...prev, assistantPlaceholder]);
        const response = await fetch(withConciergeTiming(CREATION_INTAKE_STREAM_URL), {
          signal: responseController.signal,
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(requestBody),
        });
        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(conciergeClientErrorMessage(payload?.error || payload, "Envitefy Create request failed."));
        }
        const finalState = await readConciergeIntakeStream(response, {
          onDelta: (text) => {
            if (responseController.signal.aborted || responseAbortRef.current !== responseController || conversationVersion !== conversationVersionRef.current) return;
            streamedAssistantText += text;
            setIsStreamingAssistant(true);
            setMessages((prev) =>
              prev.map((item) =>
                item.id === streamAssistantId ? { ...item, text: streamedAssistantText } : item,
              ),
            );
          },
          onAssistantDone: (assistantMessage) => {
            if (responseController.signal.aborted || responseAbortRef.current !== responseController || conversationVersion !== conversationVersionRef.current) return;
            streamedAssistantText = assistantMessage;
            setMessages((prev) =>
              prev.map((item) =>
                item.id === streamAssistantId ? { ...item, text: assistantMessage } : item,
              ),
            );
          },
          onState: (json) => {
            if (responseController.signal.aborted || responseAbortRef.current !== responseController || conversationVersion !== conversationVersionRef.current) return;
            setDraft(json.draft);
            selectProductOutputForDraft(json.draft);
            setWeatherContext(json.weatherContext || null);
            notifyCreationThreadsChanged();
            if (json.chatMessages?.length) {
              setMessages(
                chatMessagesFromSnapshots(json.chatMessages, {
                  preserveLastAssistantId: streamAssistantId,
                }),
              );
            }
            const isReady = isReadyProductDraft(json.draft);
            if (isReady) setIsReadyChatComposerOpen(false);
            setPhase(isReady ? "ready_to_generate" : "collecting_details");
          },
        });
        if (responseController.signal.aborted || responseAbortRef.current !== responseController || conversationVersion !== conversationVersionRef.current) return null;
        if (!finalState) throw new Error("Envitefy Create stream ended before draft state arrived.");
        return finalState;
      }

      const response = await fetch(withConciergeTiming(CREATION_INTAKE_URL), {
        signal: responseController.signal,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(requestBody),
      });
      const json = (await response.json().catch(() => null)) as ConciergeMessageResponse | null;
      if (conversationVersion !== conversationVersionRef.current || responseController.signal.aborted || responseAbortRef.current !== responseController) return null;
      if (!response.ok || !json?.ok) {
        throw new Error(
          conciergeClientErrorMessage(json && !json.ok ? json.error : json, "Envitefy Create request failed."),
        );
      }
      setDraft(json.draft);
      selectProductOutputForDraft(json.draft);
      setWeatherContext(json.weatherContext || null);
      notifyCreationThreadsChanged();
      const assistantMessage = newMessage("assistant", json.assistantMessage);
      if (json.chatMessages?.length) {
        setMessages(mergePendingMessagesIntoSnapshots(json.chatMessages, params.pendingMessages));
      }
      if (isReadyProductDraft(json.draft)) {
        setIsReadyChatComposerOpen(false);
        setPhase("ready_to_generate");
        if (!json.chatMessages?.length) setMessages((prev) => [...prev, assistantMessage]);
        return json;
      }
      setPhase("collecting_details");
      if (!json.chatMessages?.length) setMessages((prev) => [...prev, assistantMessage]);
      return json;
    } catch (err) {
      if (conversationVersion !== conversationVersionRef.current) return null;
      if (responseController.signal.aborted) {
        if (responseAbortRef.current !== responseController) return null;
        setMessages((prev) => [
          ...prev.filter((item) => item.id !== streamAssistantId),
          newMessage("system", "Response stopped. You can edit your message or continue chatting."),
        ]);
        setPhase(draft && isReadyProductDraft(draft) ? "ready_to_generate" : draft ? "collecting_details" : "intake_empty");
        return null;
      }
      const errorMessage = conciergeClientErrorMessage(err, "Envitefy Create request failed.");
      setPhase(draft ? "collecting_details" : "intake_empty");
      if (streamAssistantId) {
        setMessages((prev) => prev.filter((item) => item.id !== streamAssistantId));
      }
      setError(null);
      setFailedRequest({ ...params, error: errorMessage });
      return null;
    } finally {
      if (conversationVersion === conversationVersionRef.current && responseAbortRef.current === responseController) {
        if (responseAbortRef.current === responseController) responseAbortRef.current = null;
        setIsStreamingAssistant(false);
        setIsSending(false);
        refocusComposerAfterResponse();
      }
    }
  }

  async function retryFailedRequest() {
    if (!failedRequest || isBusy) return;
    await sendToConcierge({
      message: failedRequest.message,
      retryReply: failedRequest.retryReply,
      action: failedRequest.action,
      ocrContext: failedRequest.ocrContext,
      activeContext: failedRequest.activeContext,
      requestedOutputs: failedRequest.requestedOutputs,
      starterCategory: failedRequest.starterCategory,
      echo: failedRequest.echo,
      suppressUserEcho: true,
    });
  }

  async function saveReadyDraftToEvent(params: {
    draft: ConciergeEventDraft;
    statusMessageId?: string | null;
  }) {
    setPhase("publishing_card");
    setChatUploadStage("creating_event");
    if (params.statusMessageId) {
      setMessages((prev) =>
        prev.map((message) =>
          message.id === params.statusMessageId
            ? { ...message, text: "Saving invite..." }
            : message,
        ),
      );
    }
    await saveChatProgress(params.draft);
    const response = await fetch("/api/creation/intake", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        message: "",
        action: "save",
        draft: params.draft,
        persistSession: true,
        chatMessages: chatMessagesForPersistence(messages),
      }),
    });
    const json = (await response.json().catch(() => null)) as ConciergeMessageResponse | null;
    if (!response.ok || !json?.ok) {
      throw new Error(
        conciergeClientErrorMessage(json && !json.ok ? json.error : json, "Unable to create event from upload."),
      );
    }
    const savedEventId = json.savedEventId;
    if (!savedEventId) throw new Error("Event was created without an event id.");

    const savedDraft = normalizeDraftProductOutputs(json.draft || params.draft);
    const savedOutput =
      savedDraft.requestedOutputs
        .map(visibleProductOutput)
        .find((output) => PRODUCT_OPTIONS.some((option) => option.output === output)) || null;

    setDraft(savedDraft);
    setSelectedProductOutput(savedOutput);
    setLiveCardEventId(savedEventId);
    setLiveCardTitle(draftHeadline(savedDraft));
    setLiveCardSummary(
      liveCardSummaryFromDraft(savedDraft, savedOutput || effectiveSelectedProductOutput),
    );
    setWeatherContext(json.weatherContext || null);
    setPhase("card_ready");
    setMobileView("preview");
    setChatUploadStage("success");
    setMessages((prev) => {
      const withoutStatus = params.statusMessageId
        ? prev.filter((message) => message.id !== params.statusMessageId)
        : prev;
      const persisted = json.chatMessages?.length
        ? chatMessagesFromSnapshots(json.chatMessages)
        : withoutStatus;
      return [
        ...persisted,
        newMessage(
          "assistant",
          isReceivedInviteDraft(savedDraft)
            ? `Saved ${draftHeadline(savedDraft)} to Invited events. You can open it now.`
            : `I created ${draftHeadline(savedDraft)}. You can open it now.`,
        ),
      ];
    });
    notifyCreationThreadsChanged();
  }

  async function retryFailedSnapUpload() {
    if (!failedSnapUpload || isBusy) return;
    const { file, source, requestedOutput, uploadPrompt, userEchoOverride } = failedSnapUpload;
    await routeSelectedSnapFile(file, source, requestedOutput, uploadPrompt, userEchoOverride);
  }

  async function saveReceivedInviteDraft() {
    if (!draft || !canSaveReceivedInvite) return;
    setError(null);
    try {
      await saveReadyDraftToEvent({
        draft: normalizeDraftProductOutputs(draft),
      });
    } catch (err) {
      setPhase("ready_to_generate");
      setChatUploadStage("error");
      setError(err instanceof Error ? err.message : "Unable to save invite.");
    }
  }

  function openSignupFormGallery() {
    progress.requestLeave(() => router.push(SIGNUP_FORM_GALLERY_HREF));
  }

  async function submitComposerInput() {
    if (isBusy) return;
    const typedValue = input.trim();
    const signupHandoff = signupFormHandoff(typedValue);
    if (signupHandoff) {
      setInput("");
      setMessages((current) => [
        ...current,
        newMessage("user", typedValue),
        newMessage("assistant", signupHandoff),
      ]);
      focusComposerAtEnd();
      return;
    }
    if (pendingChatUpload) {
      if (!canAttachFlyer) return;
      const upload = pendingChatUpload;
      setPendingChatUpload(null);
      setInput("");
      await routeSelectedSnapFile(upload.file, upload.source, selectedProductOutput || undefined, typedValue, typedValue || undefined);
      return;
    }
    const value = typedValue || selectionPrefix(selectedCategoryLabel, selectedProductOutput);
    if (!value) return;

    setInput("");
    shouldRefocusComposerRef.current = true;
    if (canSaveReceivedInvite && (isGenerateConfirmationMessage(value) || isAffirmativeReply(value))) {
      await saveReceivedInviteDraft();
      return;
    }
    if (
      canGenerateProduct &&
      draft &&
      draft.currentQuestion !== "date_confirmation" &&
      isGenerateConfirmationMessage(value)
    ) {
      setIsReadyChatComposerOpen(false);
      await generateProductForDraft(draft);
      return;
    }
    if (draftStudioInvite && !liveCardEventId) {
      await sendGeneratedDraftEdit(value);
      return;
    }
    if (liveCardEventId) {
      await sendGeneratedCardEdit(value);
      return;
    }
    await sendToConcierge({
      message: value,
      requestedOutputs:
        selectedProductOutput && !draft?.requestedOutputs?.length
          ? [selectedProductOutput]
          : undefined,
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitComposerInput();
  }

  function handleStarterProductChoice(option: ProductOption) {
    if (isBusy) return;
    setSelectedProductOutput(option.output);
    if (pendingChatUpload) {
      updateComposerSelection();
      shouldRefocusComposerRef.current = true;
      focusComposerAtEnd();
      return;
    }
    updateComposerSelection();
  }

  function handleSelectedSnapFile(file: File | null | undefined, source: "camera" | "upload") {
    if (!file || !canAttachFlyer) return;
    const validationError = validateClientUploadFile(file, "attachment");
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setFailedRequest(null);
    setFailedSnapUpload(null);
    setPendingChatUpload({ file, source });
    focusComposerAtEnd();
  }

  async function routeSelectedSnapFile(
    file: File | null | undefined,
    source: "camera" | "upload",
    requestedOutputOverride?: RequestedOutput,
    uploadPrompt = "",
    userEchoOverride?: string,
  ) {
    const uploadRequestedOutput = requestedOutputOverride || selectedProductOutput;
    if (!file || isBusy || !canUploadFlyerToOutput(uploadRequestedOutput)) return;
    const conversationVersion = conversationVersionRef.current;
    const validationError = validateClientUploadFile(file, "attachment");
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setFailedRequest(null);
    setFailedSnapUpload(null);
    setIsUploading(true);
    const uploadController = new AbortController();
    uploadAbortRef.current = uploadController;
    setChatUploadStage("preparing_upload");
    const uploadPreviewUrl = createObjectUrlPreview(file);
    setUploadedPreviewImageUrl(uploadPreviewUrl);
    setUploadedPreviewFileName(uploadPreviewUrl ? uploadedFileLabel(file) : null);
    const scanAttemptId = createClientAttemptId("scan");
    const userEcho = userEchoOverride?.trim()
      ? `${userEchoOverride.trim()} - Uploaded 1 file`
      : "Uploaded 1 file";
    const uploadUserMessage = newMessage("user", userEcho);
    const statusMessage = newMessage("assistant", "Preparing upload...", "upload_status");
    setMessages((prev) => [...prev, uploadUserMessage, statusMessage]);
    const updateUploadStatus = (text: string) => {
      setMessages((prev) =>
        prev.map((message) => (message.id === statusMessage.id ? { ...message, text } : message)),
      );
    };
    const clearUploadStatus = () => {
      setMessages((prev) => prev.filter((message) => message.id !== statusMessage.id));
    };
    try {
      setChatUploadStage("scanning");
      updateUploadStatus("Scanning image...");
      reportClientLog({
        area: "snap-upload",
        stage: "chat-ocr-start",
        scanAttemptId,
        details: {
          route: "/chat",
          source,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
        },
      });
      const ocrResult = await runSnapOcrUpload({ file, scanAttemptId, signal: uploadController.signal });
      if (conversationVersion !== conversationVersionRef.current) return;
      setChatUploadStage("ocr_ready");
      updateUploadStatus("Reading upload...");
      const uploadInstruction = uploadPrompt.trim()
        ? `Create an event from this uploaded file. User note: ${uploadPrompt.trim()}`
        : "Create an event from this uploaded file.";
      const intakeResult = await sendToConcierge({
        message: uploadInstruction,
        action: "ocr_result",
        ocrContext: buildChatOcrContext(ocrResult, scanAttemptId),
        requestedOutputs: [uploadRequestedOutput],
        suppressUserEcho: true,
        pendingMessages: [uploadUserMessage],
      });
      if (conversationVersion !== conversationVersionRef.current) return;
      if (!intakeResult?.ok) {
        throw new Error("I scanned the file, but couldn't turn it into event details.");
      }
      const scannedDraft = normalizeDraftProductOutputs(intakeResult.draft);
      if (isReadyProductDraft(scannedDraft)) {
        clearUploadStatus();
        setChatUploadStage("success");
        setMobileView("preview");
        setMessages((prev) => [
          ...prev,
          newMessage(
            "assistant",
            isReceivedInviteDraft(scannedDraft)
              ? "I read this as an invite you received. The extracted event details are locked to the upload; save it to Invited events when it looks right."
              : `I read the upload and drafted ${draftHeadline(scannedDraft)}. Review it, keep editing, or generate a preview when you're ready.`,
          ),
        ]);
      } else {
        clearUploadStatus();
        setChatUploadStage("success");
      }
    } catch (err) {
      if (conversationVersion !== conversationVersionRef.current) return;
      clearUploadStatus();
      setChatUploadStage("error");
      reportClientLog({
        area: "snap-upload",
        stage: "chat-upload-failed",
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
      const errorMessage = chatUploadFailureMessage(
        err instanceof Error ? err.message : "Failed to scan file. Please try again.",
      );
      setFailedRequest(null);
      setFailedSnapUpload({ file, source, requestedOutput: uploadRequestedOutput, uploadPrompt, userEchoOverride, error: errorMessage });
      setError(errorMessage);
      setMessages((prev) => [
        ...prev,
        newMessage(
          "assistant",
          "I couldn't finish creating your event from that upload. Retry it, upload a different file, or keep going manually.",
        ),
      ]);
    } finally {
      if (uploadAbortRef.current === uploadController) uploadAbortRef.current = null;
      if (conversationVersion === conversationVersionRef.current) {
        setIsUploading(false);
        setChatUploadStage((current) =>
          current === "error" || current === "success" ? current : "idle",
        );
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    }
  }

  function openSnapUploadPicker() {
    if (!canAttachFlyer) return;
    try {
      fileInputRef.current?.click();
    } catch (err) {
      console.error("Failed to open file picker:", err);
      setError("Unable to open the file picker. Please try again.");
    }
  }

  const generateReplyAction = shouldShowGenerateReply ? (
    <button
      type="button"
      disabled={!canGenerateProduct}
      onClick={() => {
        if (!draft || !canGenerateProduct) return;
        setIsReadyChatComposerOpen(false);
        void generateProductForDraft(draft);
      }}
      className="inline-flex min-h-11 shrink-0 self-start items-center justify-center gap-1.5 rounded-2xl rounded-bl-md border border-[#c8b8fb] bg-[#eee7ff] px-2.5 py-3 text-xs font-semibold text-[#5c5be5] shadow-sm transition hover:border-[#b29bed] hover:bg-[#e5dbff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a98dff] focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70 sm:px-4 sm:text-sm"
    >
      {isGeneratingCard ? (
        <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
      ) : (
        <Sparkles className="size-4" aria-hidden="true" />
      )}
      <span>{isGeneratingCard ? "Generating…" : "Generate now"}</span>
    </button>
  ) : null;

  const chatThread = (
    <div
      className="mx-auto flex min-h-full w-full max-w-3xl min-w-0 flex-col justify-start gap-5 py-5 lg:py-8 [&_p]:[overflow-wrap:anywhere]"
      role="log"
      aria-live="polite"
      aria-relevant="additions text"
    >
      <AnimatePresence initial={false}>
        {visibleMessages.map((message, messageIndex) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6 }}
            className={`flex flex-col ${message.role === "user" ? "items-end" : "items-start"}`}
          >
            {message.type === "upload_status" ? (
              <div className="flex max-w-[70.5%] items-start gap-2 sm:max-w-[min(66%,36rem)]">
                <ConciergeChatAvatar />
                <div
                  className="min-w-0 rounded-3xl rounded-tl-md border border-[#eadfff] bg-white/88 px-4 py-3 text-sm leading-6 text-[#24183e] shadow-sm"
                  role="status"
                  aria-live="polite"
                >
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin text-[#5c5be5]" aria-hidden="true" />
                    {message.text}
                  </span>
                </div>
              </div>
            ) : message.role === "user" ? (
              <div className="flex max-w-[70.5%] items-start justify-end gap-2 sm:max-w-[min(66%,36rem)]">
                <div className="min-w-0 whitespace-pre-line [overflow-wrap:anywhere] rounded-3xl rounded-tr-md bg-[#5c5be5] px-4 py-3 text-sm leading-6 text-white shadow-sm shadow-[#5c5be5]/15">
                  {message.text}
                </div>
                <UserChatAvatar initials={userAvatarInitials} />
              </div>
            ) : (
              <div className="flex max-w-[70.5%] items-start gap-2 sm:max-w-[min(66%,36rem)]">
                <ConciergeChatAvatar />
                <div className="flex min-w-0 flex-col items-start gap-2">
                <div className="min-w-0 [overflow-wrap:anywhere] rounded-3xl rounded-tl-md border border-[#eadfff] bg-white/88 px-4 py-3 text-sm leading-6 text-[#24183e] shadow-sm">
                  {message.role === "assistant"
                    ? formatAssistantBubbleText(message.text, draft, openSignupFormGallery)
                    : message.text}
                </div>
                {messageIndex === visibleMessages.length - 1 ? generateReplyAction : null}
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {draft?.pendingReply && !failedRequest ? (
        <button
          type="button"
          disabled={isBusy}
          className="ml-10 min-h-11 self-start rounded-lg px-3 text-sm font-semibold text-[#5c5be5] hover:bg-[#eee7ff] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a98dff]"
          onClick={() => {
            if (draft.pendingReply) void sendToConcierge({ message: draft.pendingReply.message, retryReply: true, suppressUserEcho: true });
          }}
        >
          Try answer again
        </button>
      ) : null}

      {failedRequest ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-2"
        >
          <ConciergeChatAvatar />
          <div className="min-w-0 max-w-[94%] rounded-3xl rounded-tl-md border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-800 shadow-sm sm:max-w-[min(88%,48rem)]">
            <p className="font-semibold">Envitefy Create could not finish that request.</p>
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

      {failedSnapUpload ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-2"
        >
          <ConciergeChatAvatar />
          <div className="min-w-0 max-w-[94%] rounded-3xl rounded-tl-md border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-800 shadow-sm sm:max-w-[min(88%,48rem)]">
            <p className="font-semibold">Upload could not be turned into an event.</p>
            <p>{failedSnapUpload.error}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void retryFailedSnapUpload()}
                disabled={isBusy}
                className="inline-flex h-9 items-center justify-center rounded-full border border-red-200 bg-white px-4 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Retry file
              </button>
              <button
                type="button"
                onClick={openSnapUploadPicker}
                disabled={isBusy}
                className="inline-flex h-9 items-center justify-center rounded-full border border-red-200 bg-white px-4 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Upload different
              </button>
              <button
                type="button"
                onClick={() => {
                  setFailedSnapUpload(null);
                  setError(null);
                  focusComposerAtEnd();
                }}
                disabled={isBusy}
                className="inline-flex h-9 items-center justify-center rounded-full border border-red-200 bg-white px-4 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Continue manually
              </button>
            </div>
          </div>
        </motion.div>
      ) : null}

      {isBusy && !isUploading && !isGeneratingCard && !isStreamingAssistant ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex max-w-[94%] self-start items-start gap-2 sm:max-w-[min(88%,48rem)]"
          role="status"
          aria-live="polite"
        >
          <ConciergeChatAvatar className={isThinking ? "animate-pulse" : undefined} />
          <div
            className={cn(
              "inline-flex w-fit items-center gap-2 rounded-full border border-[#eadfff] bg-white/86 px-4 py-2 text-sm text-[#5f5289] shadow-sm",
              isThinking && "animate-pulse",
            )}
          >
            {isThinking ? null : (
              <Loader2 className="size-4 animate-spin text-[#5c5be5]" aria-hidden="true" />
            )}
            {busyLabel}
          </div>
        </motion.div>
      ) : null}
    </div>
  );

  const selectionPills =
    pendingChatUpload ? (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex min-w-0 max-w-full flex-wrap items-center gap-2"
        aria-label="Selected chat filters"
      >
        {pendingChatUpload ? (
          <ChatSelectionPill
            label={pendingChatUpload.file.name}
            onRemove={() => setPendingChatUpload(null)}
            disabled={isBusy}
            ariaLabel="Remove attached file"
            textClassName="text-[#5c5be5]"
          />
        ) : null}
      </motion.div>
    ) : null;

  const composer = (
    <div
      className="pointer-events-none z-30 flex w-full min-w-0 shrink-0 flex-col items-stretch px-3 pb-[max(env(safe-area-inset-bottom),3rem)] pt-2 sm:px-6 lg:px-8"
    >
      <div ref={composerCardRef} className="pointer-events-auto relative mx-auto w-full max-w-3xl">
        {isEmptyState ? (
          <div
            role="group"
            aria-label="Choose product format"
            className="mx-auto mb-3 grid w-full max-w-lg grid-cols-3 gap-2"
          >
            {PRODUCT_OPTIONS.map((option) => {
              const Icon = option.icon;
              const isSelected = selectedProductOutput === option.output;
              return (
                <button
                  key={option.output}
                  type="button"
                  disabled={isBusy}
                  aria-pressed={isSelected}
                  title={option.description}
                  onClick={() => {
                    if (isSelected) removeSelectedProductOutput();
                    else handleStarterProductChoice(option);
                    focusComposerAtEnd();
                  }}
                  className={cn(
                    "inline-flex min-h-11 min-w-0 items-center justify-center gap-1.5 rounded-full border px-2 py-2 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a98dff] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:gap-2 sm:px-4 sm:text-sm",
                    isSelected
                      ? "border-[#c8b8fb] bg-[#eee7ff] text-[#5c5be5] shadow-sm"
                      : "border-white/80 bg-white/65 text-[#746589] hover:border-[#d8caff] hover:bg-white/90 hover:text-[#5c5be5]",
                  )}
                >
                  <Icon size={14} aria-hidden="true" className="shrink-0" />
                  {option.label}
                </button>
              );
            })}
          </div>
        ) : null}
        <form onSubmit={handleSubmit}>
          <input
            ref={fileInputRef}
            type="file"
            disabled={!canAttachFlyer}
            accept={getUploadAcceptAttribute("attachment")}
            className="hidden"
            onChange={(event) => {
              handleSelectedSnapFile(event.currentTarget.files?.[0], "upload");
              event.currentTarget.value = "";
            }}
          />
          <PromptInput
            value={input}
            onValueChange={handleComposerValueChange}
            isLoading={isBusy}
            maxHeight="max(44px, min(11rem, calc(var(--envitefy-chat-layout-height, 100dvh) * 0.25)))"
            onSubmit={() => void submitComposerInput()}
            disabled={isUploading || isGeneratingCard || isPublishingCard}
            className={cn(
              "w-full rounded-[1.75rem] border-[#e2d9ef] bg-[#fbf9ff] p-1.5 text-[#25183a] shadow-[0_4px_20px_rgba(64,43,96,0.08)] transition-[border-color,box-shadow] duration-200 focus-within:border-[#b6a0e6] focus-within:shadow-[0_4px_24px_rgba(93,63,155,0.12)]",
              isCompactEmptyComposer && "max-md:rounded-[1.4rem]",
              isBusy && "!border-[#c4b5fd]",
            )}
          >
            <div
              className={cn(
                "flex min-h-11 flex-col justify-center gap-2",
                isCompactEmptyComposer && "max-md:min-h-[42px]",
              )}
            >
              {selectionPills}
              {pendingChatUpload && !canUploadFlyerToOutput(selectedProductOutput) ? (
                <p role="status" className="px-3 text-xs text-[#746589]">
                  Select Live Card or Event Page to use this upload, or remove the file.
                </p>
              ) : null}
              <div className="flex min-w-0 items-end gap-1 sm:gap-2">
                <PromptInputAction tooltip={canAttachFlyer ? "Upload your flyer" : isBusy ? busyLabel : "Select Live Card or Event Page to upload a flyer"}>
                  <button
                    type="button"
                    disabled={!canAttachFlyer}
                    onClick={openSnapUploadPicker}
                    aria-label="Upload your flyer"
                    aria-describedby="chat-upload-help"
                    className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-[#a98dff] text-[#7151d8] transition-colors hover:bg-[#eee7ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a98dff] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Plus className="size-6" aria-hidden="true" />
                  </button>
                </PromptInputAction>
                <span id="chat-upload-help" className="sr-only">
                  Upload a flyer to create a Live Card or Event Page. Select one of those formats to enable uploads.
                </span>
                <PromptInputTextarea
                  placeholder={
                    liveCardEventId
                      ? "Tell me what to change..."
                      : draft
                        ? "Ask a question or change a detail..."
                        : "Tell me what you're planning..."
                  }
                  aria-label={liveCardEventId ? "Refine invite" : "Start planning from scratch"}
                  onFocus={() => setIsComposerFocused(true)}
                  onBlur={() => setIsComposerFocused(false)}
                  className={cn(
                    "min-h-[44px] min-w-0 flex-1 px-3 py-2.5 text-base !text-[#25183a] caret-[#5c5be5] selection:bg-[#d8caff] selection:text-[#25183a] !placeholder:text-[#8b7ca6] [&::placeholder]:text-[0.82rem] sm:[&::placeholder]:text-base",
                    isCompactEmptyComposer &&
                      "max-md:min-h-11 max-md:px-2 max-md:py-2.5 max-md:text-base max-md:[&::placeholder]:text-[0.78rem]",
                  )}
                />
                <PromptInputActions className="ml-auto shrink-0 justify-end gap-1">
                  <PromptInputAction tooltip={isBusy ? busyLabel : "Send message"}>
                    <button
                      type="submit"
                      disabled={isBusy || !canSubmitComposer}
                      className="inline-flex size-11 items-center justify-center rounded-full bg-[#5c5be5] text-white transition-colors hover:bg-[#4f4ed2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a98dff] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-[#eee8f6] disabled:text-[#8b7ca6]"
                      aria-label="Send"
                    >
                      {isBusy ? (
                        <Loader2 className="size-5 animate-spin" aria-hidden="true" />
                      ) : (
                        <ArrowUp className="size-6" strokeWidth={2.5} aria-hidden="true" />
                      )}
                    </button>
                  </PromptInputAction>
                </PromptInputActions>
              </div>
            </div>
          </PromptInput>
        </form>
        {error ? <p role="alert" className="mt-2 max-h-[15dvh] overflow-y-auto [overflow-wrap:anywhere] text-sm font-medium text-red-600">{error}</p> : null}
      </div>
    </div>
  );

  const readyActions = (
    <div className="pointer-events-none mx-auto flex w-full max-w-3xl min-w-0 shrink-0 flex-col items-stretch py-2">
      <div className="pointer-events-auto w-full">
        {shouldShowGiftRegistryPrompt ? (
          <div className="mb-2 rounded-[1.35rem] border border-[#ded2f5] bg-white/96 p-3 text-[#4f3a73] shadow-[0_14px_34px_rgba(93,63,155,0.12)] ring-1 ring-white/80 backdrop-blur">
            <div className="flex items-center gap-2 text-sm font-bold">
              <Gift className="size-4 shrink-0 text-[#5c5be5]" aria-hidden="true" />
              <span>Optional {giftRegistryNoun}</span>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
              <button
                type="button"
                onClick={openGiftRegistryComposer}
                className="inline-flex h-10 min-w-0 items-center justify-center rounded-2xl border border-[#ded2f5] bg-white px-3 text-sm font-bold text-[#4f3a73] transition hover:border-[#c7b4ee] hover:bg-[#f5f0ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a98dff]"
              >
                <span className="truncate">Paste link</span>
              </button>
              <button
                type="button"
                onClick={handleCreateAmazonGiftRegistry}
                className="inline-flex h-10 min-w-0 items-center justify-center rounded-2xl bg-[#231f20] px-3 text-sm font-bold text-white transition hover:bg-[#3a3336] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a98dff]"
              >
                <span className="truncate">Create on Amazon</span>
              </button>
              <button
                type="button"
                onClick={() => void handleSkipGiftRegistry()}
                disabled={isBusy}
                className="inline-flex h-10 min-w-0 items-center justify-center rounded-2xl border border-[#ded2f5] bg-white px-3 text-sm font-bold text-[#4f3a73] transition hover:border-[#c7b4ee] hover:bg-[#f5f0ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a98dff] disabled:cursor-not-allowed disabled:opacity-55"
              >
                <span className="truncate">Skip for now</span>
              </button>
            </div>
          </div>
        ) : null}
        {shouldShowReceivedInviteActions ? (
          <div className="rounded-[1.35rem] border border-[#d8caff] bg-[#fbf9ff]/96 p-3 shadow-[0_18px_46px_rgba(93,63,155,0.18),inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-white/75 backdrop-blur">
            <p className="mb-3 text-sm font-semibold text-[#4f3a73]">
              This is saved as a received invite. Event details stay locked to the upload.
            </p>
            <button
              type="button"
              onClick={() => void saveReceivedInviteDraft()}
              className="inline-flex h-12 w-full min-w-0 items-center justify-center gap-2 rounded-2xl bg-[#5c5be5] px-3 text-sm font-bold text-white shadow-[0_14px_30px_rgba(92,91,229,0.24)] transition hover:bg-[#4f4ed2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a98dff] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!canSaveReceivedInvite}
            >
              {isPublishingCard ? (
                <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden="true" />
              ) : (
                <IdCard className="size-4 shrink-0" aria-hidden="true" />
              )}
              <span className="truncate">{isPublishingCard ? "Saving" : "Save invite"}</span>
            </button>
          </div>
        ) : null}
        {error ? <p className="mt-3 text-sm font-medium text-red-600">{error}</p> : null}
      </div>
    </div>
  );

  const productPanel = (
    <ChatProductPreview
      draft={draft}
      summary={{ ...currentLiveCardSummary, headline: previewTitle }}
      selectedOutput={effectiveSelectedProductOutput}
      previewImageUrl={currentPreviewImage}
      artworkNotice={draftStudioInvite?.invitationData.artworkNotice}
      pageTypography={draftStudioInvite?.invitationData.eventDetails.pageTypography}
      isGenerating={isGeneratingCard || isUpdatingPreview}
      hasStreamingPreview={Boolean(streamingPreviewImage)}
      currentBuildStep={GENERATION_STAGE_LABELS[generationStage]}
      liveEventId={liveCardEventId}
      publicHref={liveCardPublicHref}
      rsvpDashboardHref={rsvpDashboardHref}
      hasDraftProduct={hasGeneratedDraftProduct || hasReadyReceivedInvite}
      isReceivedInviteDraft={isReceivedInviteDraft(draft)}
      publishActionLabel={hasReadyReceivedInvite ? "Save invite" : "Publish"}
      publishBusyLabel={hasReadyReceivedInvite ? "Saving..." : "Publishing..."}
      skinLabel={selectedSkinLabel}
      isPublishing={isPublishingCard}
      onPublish={() => {
        if (hasReadyReceivedInvite) {
          void saveReceivedInviteDraft();
          return;
        }
        void publishGeneratedDraft();
      }}
      onEdit={() => {
        setMobileView("chat");
        setIsReadyChatComposerOpen(true);
        focusComposerAtEnd();
      }}
      rsvp={{
        count: rsvpResponseCount,
        isLoading: rsvpPreview.isLoading,
        error: rsvpPreview.error,
      }}
      weatherContext={weatherContext}
    />
  );

  return (
    <div
      className="flex h-full min-h-0 w-full overflow-hidden bg-transparent text-[#161129]"
      data-chat-viewport="true"
      style={{
        height: "var(--envitefy-chat-layout-height, 100dvh)",
        transform: "translateY(var(--envitefy-chat-layout-top, 0px))",
        paddingLeft: "env(safe-area-inset-left)",
        paddingRight: "env(safe-area-inset-right)",
      }}
    >
      <main
        ref={mainRef}
        className="relative flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
      >
        <div className="relative z-10 flex min-h-0 flex-1 flex-col">
          <ChatWorkspace
            view={mobileView}
            onViewChange={setMobileView}
            preview={shouldShowProductPanel ? productPanel : null}
            chat={(
              <div
                ref={chatPaneRef}
                className={cn(
                  "flex h-full min-h-0 min-w-0 w-full flex-col overflow-hidden",
                  isEmptyState ? "bg-transparent" : "bg-white/28 backdrop-blur-sm",
                )}
              >
                <div
                  ref={messagesViewportRef}
                  onScroll={(event) => {
                    const viewport = event.currentTarget;
                    // A resize can emit scroll before ResizeObserver. Only user
                    // scrolling in the same-sized pane changes the pinned state.
                    const size = chatViewportSizeRef.current;
                    if (size.width !== viewport.clientWidth || size.height !== viewport.clientHeight) return;
                    isChatAtBottomRef.current = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight < 48;
                  }}
                  data-chat-messages="true"
                  className={cn(
                    "min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 sm:px-6 lg:px-8 [-webkit-overflow-scrolling:touch]",
                    isEmptyState && "flex flex-col",
                  )}
                >
                  {isEmptyState ? (
                    <div className="m-auto w-full max-w-3xl shrink-0 px-6 py-8 text-center">
                      <motion.h1
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-3xl font-medium leading-tight tracking-tight text-[#2d1b36] sm:text-4xl"
                      >
                        What are we celebrating?
                      </motion.h1>
                      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#6f608c] sm:text-base">
                        Tell me what you have in mind. We'll bring it to life together.
                      </p>
                    </div>
                  ) : (
                    chatThread
                  )}
                  {shouldShowGiftRegistryActions || shouldShowReceivedInviteActions
                    ? readyActions
                    : null}
                </div>
                {composer}
              </div>
            )}
          />
        </div>
      </main>
    </div>
  );
}
