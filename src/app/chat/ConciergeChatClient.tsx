"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUp,
  Cake,
  ExternalLink,
  FileImage,
  Gift,
  Globe,
  IdCard,
  LayoutDashboard,
  Loader2,
  MessageCircle,
  Mic,
  Sparkles,
  Trophy,
  Upload,
  X,
} from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  type ComponentType,
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
import { createInitialDetails } from "@/app/studio/studio-workspace-sanitize";
import type {
  EventDetails,
  InvitationData,
  InviteCategory,
} from "@/app/studio/studio-workspace-types";
import conciergeLogo from "@/assets/envitefy-concierge-logo.png";
import userConciergeLogo from "@/assets/user-concierge-logo.png";
import {
  cn,
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/ui/ai-prompt-box";
import BottomNavBar, { type BottomNavItem } from "@/components/ui/bottom-nav-bar";
import { skinLabelForCategoryName, skinLabelForConciergeDraft } from "@/lib/concierge/skins";
import type {
  ConciergeActiveContext,
  ConciergeEventDraft,
  ConciergeEventMessageResponse,
  ConciergeEventType,
  ConciergeMessageResponse,
  ConciergeOcrContext,
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
  revokeObjectUrl,
  validateClientUploadFile,
} from "@/utils/media-upload-client";
import { getAmazonRegistryCreateUrlForCategory } from "@/utils/registry-links";

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

type StarterIconComponent = ComponentType<{ className?: string }>;

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

function BridalShowerIcon({ className }: { className?: string }) {
  return (
    <span className={cn("relative flex items-center justify-center", className)}>
      <Gift className="h-full w-full" aria-hidden="true" />
      <Sparkles
        className="absolute -right-1 -top-1 h-[45%] w-[45%] animate-pulse text-inherit"
        aria-hidden="true"
      />
    </span>
  );
}

function BabyCarriageIcon({ className }: { className?: string }) {
  return (
    <span className={cn("relative flex items-center justify-center", className)}>
      <svg
        viewBox="0 0 32 32"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-full w-full"
        aria-hidden="true"
      >
        <path d="M23.6,27H8.4c-3,0-5.4-2.4-5.4-5.4V17h26v4.6C29,24.6,26.6,27,23.6,27z" />
        <path d="M23.3,17c1.1-0.7,1.9-1.8,2.4-3c0.1,0,0.2,0,0.3,0c1.1,0,2-0.9,2-2s-0.9-2-2-2c-0.1,0-0.2,0-0.3,0 c-0.8-2.3-3-4-5.7-4s-4.8,1.7-5.7,4c-0.1,0-0.2,0-0.3,0c-1.1,0-2,0.9-2,2s0.9,2,2,2c0.1,0,0.2,0,0.3,0c0.4,1.2,1.2,2.2,2.2,2.9" />
        <path d="M18,3L18,3c0,1.2,0.7,2.3,1.9,2.7L20.6,6" />
        <line x1="18" y1="11" x2="18" y2="13" />
        <line x1="22" y1="11" x2="22" y2="13" />
        <line x1="5" y1="29" x2="6" y2="26.8" />
        <line x1="27" y1="29" x2="26" y2="26.8" />
        <path d="M5,17V5.8C5,4.3,6.3,3,7.8,3h0c0.8,0,1.5,0.3,2,0.8L11,5" />
        <line x1="13" y1="4" x2="9" y2="7" />
      </svg>
      <Sparkles
        className="absolute -right-1 -top-1 h-[40%] w-[40%] animate-pulse text-inherit"
        aria-hidden="true"
      />
    </span>
  );
}

function RingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 512 512" fill="currentColor" aria-hidden="true">
      <path d="M371.769,176.364l30.47-30.47l-21.71-25.265h-52.305l-21.71,25.265l30.47,30.47 c-29.557,3.279-57.658,14.863-80.982,33.507c-23.324-18.644-51.425-30.228-80.982-33.507l30.47-30.47l-21.71-25.265h-52.305 l-21.71,25.265l30.47,30.47C61.471,185.049,0,251.988,0,333.024c0,86.914,70.71,157.625,157.625,157.625 c35.834,0,70.513-12.2,98.375-34.472c27.862,22.272,62.542,34.472,98.375,34.472C441.29,490.649,512,419.938,512,333.024 C512,251.988,450.529,185.049,371.769,176.364z M327.237,145.11l7.97-9.275h38.337l7.969,9.275l-27.138,27.138L327.237,145.11z M130.486,145.11l7.97-9.275h38.337l7.969,9.275l-27.138,27.138L130.486,145.11z M157.625,475.441 c-78.529,0-142.417-63.888-142.417-142.417s63.888-142.417,142.417-142.417c34.337,0,67.503,12.392,93.387,34.894 c8.035,6.984,15.308,14.898,21.618,23.522c17.933,24.508,27.412,53.555,27.412,84.002c0,27.573-7.775,54-22.563,76.946 c-0.192-0.192-0.376-0.39-0.566-0.583c-0.834-0.847-1.659-1.702-2.465-2.574c-0.357-0.386-0.705-0.781-1.055-1.172 c-0.661-0.736-1.315-1.479-1.955-2.233c-0.368-0.433-0.731-0.869-1.092-1.308c-0.618-0.751-1.225-1.513-1.823-2.28 c-0.337-0.432-0.675-0.863-1.005-1.3c-0.655-0.867-1.293-1.748-1.921-2.636c-0.195-0.275-0.396-0.545-0.589-0.823 c10.887-18.81,16.619-40.153,16.619-62.037c0-21.925-5.759-43.301-16.685-62.137l0.061-0.096l-2.58-4.072 c-4.983-7.859-10.817-15.117-17.407-21.662c-2.197-2.182-4.478-4.285-6.839-6.304l-6.234-5.332l-0.161,0.22 c-21.339-15.929-47.37-24.62-74.156-24.62c-68.375,0-124.002,55.628-124.002,124.002s55.627,124.001,124.002,124.001 c26.853,0,52.947-8.733,74.315-24.737c0.095,0.118,0.196,0.231,0.291,0.348c0.539,0.661,1.092,1.311,1.641,1.964 c0.423,0.501,0.841,1.007,1.269,1.503c0.586,0.677,1.185,1.342,1.782,2.01c0.409,0.457,0.812,0.92,1.226,1.372 c0.656,0.716,1.326,1.418,1.995,2.122c0.37,0.389,0.734,0.787,1.108,1.172c0.815,0.841,1.646,1.666,2.48,2.488 c0.228,0.225,0.449,0.456,0.677,0.68C219.606,465.022,189.107,475.441,157.625,475.441z M289.077,246.04 c18.767-14.095,41.689-21.81,65.298-21.81c59.989,0,108.794,48.805,108.794,108.794c0,59.989-48.805,108.792-108.794,108.792 c-23.608,0-46.531-7.715-65.298-21.81c17.142-25.819,26.172-55.735,26.172-86.984C315.249,301.775,306.22,271.858,289.077,246.04z M256,379.489c-6.834-14.454-10.418-30.285-10.418-46.465c0-16.18,3.584-32.012,10.418-46.465 c6.834,14.454,10.418,30.285,10.418,46.465C266.418,349.204,262.834,365.035,256,379.489z M222.923,246.04 c-17.142,25.819-26.172,55.735-26.172,86.984c0,31.248,9.029,61.165,26.172,86.984c-18.767,14.095-41.69,21.81-65.298,21.81 c-59.989,0-108.794-48.804-108.794-108.793S97.636,224.23,157.625,224.23C181.234,224.23,204.156,231.945,222.923,246.04z M354.375,475.441c-34.337,0-67.503-12.392-93.387-34.894c-8.034-6.983-15.308-14.898-21.618-23.522 c-17.933-24.508-27.412-53.555-27.412-84.001c0-27.573,7.775-54.001,22.562-76.946c0.194,0.194,0.38,0.394,0.572,0.589 c0.833,0.845,1.656,1.698,2.46,2.569c0.355,0.384,0.701,0.778,1.05,1.167c0.664,0.739,1.32,1.485,1.964,2.243 c0.364,0.429,0.724,0.862,1.082,1.296c0.622,0.756,1.233,1.522,1.835,2.294c0.334,0.428,0.669,0.855,0.997,1.289 c0.655,0.867,1.292,1.748,1.921,2.635c0.196,0.277,0.398,0.548,0.591,0.827c-10.887,18.81-16.619,40.153-16.619,62.038 c0,21.925,5.759,43.3,16.685,62.136l-0.062,0.096l2.581,4.072c6.643,10.478,14.8,19.888,24.245,27.966l6.234,5.332l0.161-0.221 c21.34,15.929,47.369,24.62,74.156,24.62c68.375,0,124.002-55.626,124.002-124.001s-55.626-124.001-124.002-124.001 c-26.853,0-52.947,8.733-74.315,24.738c-0.095-0.118-0.196-0.231-0.291-0.348c-0.538-0.66-1.089-1.309-1.638-1.96 c-0.424-0.503-0.844-1.011-1.274-1.508c-0.58-0.67-1.173-1.329-1.764-1.989c-0.416-0.464-0.825-0.935-1.246-1.394 c-0.642-0.701-1.298-1.387-1.951-2.075c-0.385-0.406-0.763-0.818-1.153-1.221c-0.781-0.805-1.577-1.594-2.373-2.382 c-0.262-0.259-0.516-0.525-0.78-0.783c24.804-19.075,55.302-29.493,86.786-29.493c78.529,0,142.417,63.888,142.417,142.417 C496.792,411.554,432.904,475.441,354.375,475.441z" />
      <rect x="248.396" y="21.351" width="15.208" height="47.344" />
      <rect
        x="294.983"
        y="52.217"
        transform="matrix(0.4198 -0.9076 0.9076 0.4198 130.5873 323.9224)"
        width="47.343"
        height="15.207"
      />
      <rect
        x="185.738"
        y="36.156"
        transform="matrix(0.9076 -0.4198 0.4198 0.9076 -7.2537 86.6932)"
        width="15.207"
        height="47.343"
      />
    </svg>
  );
}

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

function chatProductNavItem(option: ProductOption): BottomNavItem {
  return {
    label: option.label,
    value: option.output,
    icon: option.icon,
    labelWidth: Math.max(72, Math.ceil(option.label.length * 7)),
  };
}

const CREATION_INTAKE_URL = "/api/creation/intake";
const CREATION_INTAKE_STREAM_URL = "/api/creation/intake/stream";
const ENABLE_CONCIERGE_TIMING = process.env.NEXT_PUBLIC_CONCIERGE_TIMING === "1";

const BUILDING_STEPS = [
  "Checking the event details",
  "Generating the invite artwork",
  "Creating RSVP and sharing links",
  "Finalizing the public invite",
];

const PREVIEW_UPDATE_STEPS = [
  "Reading your change",
  "Updating the invite artwork",
  "Refreshing the draft details",
  "Finalizing the draft",
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
  error: string;
};

type FailedSnapUploadRequest = {
  file: File;
  source: "camera" | "upload";
  error: string;
};

function withConciergeTiming(url: string) {
  if (!ENABLE_CONCIERGE_TIMING) return url;
  return `${url}${url.includes("?") ? "&" : "?"}timing=1`;
}

function isUnsupportedExternalConciergeRequest(message: string) {
  const cleaned = message.replace(/\s+/g, " ").trim();
  if (!cleaned) return false;
  const platform =
    "(?:facebook|instagram|tiktok|tik\\s*tok|x|twitter|linkedin|youtube|whats\\s*app|whatsapp|messenger)";
  const audience =
    "(?:everyone|everybody|anyone|people|guests?|attendees?|contacts?|friends?|followers?|group)";
  return (
    new RegExp(
      `\\b(?:post|publish|upload|share)\\b[\\s\\S]{0,80}\\b(?:on|to|through|via)?\\s*${platform}\\b`,
      "i",
    ).test(cleaned) ||
    new RegExp(
      `\\b(?:send|message|dm|text|email|invite|notify|contact|forward|distribute)\\b[\\s\\S]{0,100}\\b(?:${audience}|${platform})\\b`,
      "i",
    ).test(cleaned) ||
    new RegExp(`\\b${platform}\\b[\\s\\S]{0,80}\\b${audience}\\b`, "i").test(cleaned) ||
    new RegExp(
      `\\b(?:create|make|set\\s+up|put)\\b[\\s\\S]{0,60}\\b${platform}\\b[\\s\\S]{0,30}\\b(?:event|event\\s+page|page|post)\\b`,
      "i",
    ).test(cleaned) ||
    new RegExp(`\\b${platform}\\b[\\s\\S]{0,40}\\b(?:event\\s+page|event)\\b`, "i").test(cleaned)
  );
}

const UNSUPPORTED_EXTERNAL_CONCIERGE_MESSAGE =
  "I can help with that, but I can't post to Facebook, create social media event pages, or contact people for you.\nI can write the post copy or help create an Envitefy event link you can share yourself.";

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

function formatAssistantBubbleText(text: string, detailsDraft?: ConciergeEventDraft | null) {
  const sanitized = sanitizeAssistantBubbleText(text, detailsDraft);
  const lines = (optionalGiftQuestionText(sanitized) || sanitized).split(/\n/);
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

async function readConciergeIntakeStream(
  response: Response,
  handlers: ConciergeStreamHandlers,
): Promise<ConciergeStreamStatePayload | null> {
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

function buildInitialAssistantPrompt() {
  return EMPTY_ASSISTANT_PROMPT;
}

function isOpeningAssistantPrompt(text: string, initialAssistantPrompt: string) {
  return text === initialAssistantPrompt || text === EMPTY_ASSISTANT_PROMPT;
}

const CHAT_STARTER_PROMPTS = [
  "Birthday",
  "Bridal Shower",
  "Wedding",
  "Baby Shower",
  "Game Day",
  "Upload",
];

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

function skinLabelForDraft(draft: ConciergeEventDraft | null) {
  return skinLabelForConciergeDraft(draft);
}

const CELEBRATION_STARTER_TILES = [
  {
    label: "Birthday",
    prompt: CHAT_STARTER_PROMPTS[0],
    icon: Cake,
    color: "text-pink-600",
  },
  {
    label: "Bridal Shower",
    prompt: CHAT_STARTER_PROMPTS[1],
    icon: BridalShowerIcon,
    color: "text-amber-600",
  },
  {
    label: "Wedding",
    prompt: CHAT_STARTER_PROMPTS[2],
    icon: RingsIcon,
    color: "text-rose-600",
  },
  {
    label: "Baby Shower",
    prompt: CHAT_STARTER_PROMPTS[3],
    icon: BabyCarriageIcon,
    color: "text-sky-600",
  },
  {
    label: "Game Day",
    prompt: CHAT_STARTER_PROMPTS[4],
    icon: Trophy,
    color: "text-emerald-600",
  },
  {
    label: "Upload",
    prompt: CHAT_STARTER_PROMPTS[5],
    icon: Upload,
    color: "text-zinc-600",
    action: "upload",
  },
] as const satisfies readonly {
  label: string;
  prompt: string;
  icon: StarterIconComponent;
  color: string;
  action?: "upload";
}[];

type CelebrationStarterTile = (typeof CELEBRATION_STARTER_TILES)[number];

function starterSelectionLabel(tile: CelebrationStarterTile | null | undefined) {
  return tile?.prompt || null;
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
  return isReceivedInviteDraft(draft) && isReadyCreationDraft(draft);
}

function isGenerateConfirmationMessage(value: string) {
  return /^(yes|yep|yeah|sure|please|go ahead|generate|generate it|create it|make it|do it|let'?s go)$/i.test(
    value.trim(),
  );
}

function isReadyCreationDraft(draft: ConciergeEventDraft | null) {
  return Boolean(
    draft?.requestedOutputs.length &&
      draft.draftStatus === "preview_ready" &&
      !draft.currentQuestion &&
      draft.missingFields.length === 0,
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
      isReadyCreationDraft(draft) &&
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

function publicActionLabelForOutput(selectedOutput: RequestedOutput) {
  if (selectedOutput === "live_card") return "Open Live Card";
  if (selectedOutput === "event_page") return "Open Event Page";
  if (selectedOutput === "signup_form") return "Open Sign-up";
  if (selectedOutput === "digital_flyer" || selectedOutput === "printable_flyer") {
    return "Open Flyer/Invitation";
  }
  if (selectedOutput === "invitation") return "Open Flyer/Invitation";
  return "Open Product";
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
  const skinInstruction = `Use the ${skinLabel} Envitefy template family.`;
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
    additionalLocations: draft.additionalLocations || [],
    detailsDescription: [body, locationNarrative].filter(Boolean).join(" "),
    message: draftSubheadline(draft),
    specialInstructions: [
      skinInstruction,
      locationNarrative
        ? `Preserve the full event flow in the generated live card and guest-facing details. ${locationNarrative}`
        : null,
      isEventPageProduct
        ? "Generate website hero/background artwork for the event page. Do not bake large title text, date/time, address, faux buttons, phone chrome, or website UI into the image because the event page renders real navigation, headings, schedule, location, RSVP form, calendar actions, and registry links in HTML."
        : null,
    ]
      .filter(Boolean)
      .join(" "),
    theme,
    style: stringValue(draft.tone) || "",
    visualPreferences: `${skinLabel}. ${theme}`,
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

  const requestedEdit = stringValue(args.userMessage);
  if (requestedEdit) instructions.push(`User requested: ${requestedEdit}.`);
  instructions.push(
    "Treat this as a localized correction to the current generated card, not a new design request.",
  );
  instructions.push(
    "If the old and new visible text differ by only one or two characters, modify only those characters inside the existing label.",
  );
  instructions.push(
    "Keep all unrelated artwork, characters, props, colors, typography style, layout, chips, icons, and text exactly the same.",
  );

  return instructions.join(" ");
}

function isMetadataOnlyLocationEdit(message: string) {
  const text = message.trim().toLowerCase();
  if (!text) return false;
  if (
    /\b(?:image|artwork|picture|poster|design|visible|printed|card text|invite text)\b/.test(text)
  ) {
    return false;
  }
  return /\b(?:address|map|directions?|location\s+(?:tab|tile)|hide\s+(?:the\s+)?address)\b/.test(
    text,
  );
}

function shouldRegenerateGeneratedDraftImageForEdit(args: {
  userMessage: string;
  previousDraft: ConciergeEventDraft;
  nextDraft: ConciergeEventDraft;
}) {
  const previousTime = stringValue(args.previousDraft.timeText);
  const nextTime = stringValue(args.nextDraft.timeText);
  if (previousTime && nextTime && previousTime !== nextTime) return true;

  const previousDate = stringValue(args.previousDraft.dateText);
  const nextDate = stringValue(args.nextDraft.dateText);
  if (previousDate && nextDate && previousDate !== nextDate) return true;

  const previousTitle = stringValue(args.previousDraft.title);
  const nextTitle = stringValue(args.nextDraft.title);
  if (previousTitle && nextTitle && previousTitle !== nextTitle) return true;

  const previousTheme = [
    stringValue(args.previousDraft.theme),
    stringValue(args.previousDraft.tone),
  ]
    .filter(Boolean)
    .join(" ");
  const nextTheme = [stringValue(args.nextDraft.theme), stringValue(args.nextDraft.tone)]
    .filter(Boolean)
    .join(" ");
  if (previousTheme && nextTheme && previousTheme !== nextTheme) return true;

  const previousLocation =
    stringValue(args.previousDraft.venue) || stringValue(args.previousDraft.location);
  const nextLocation = stringValue(args.nextDraft.venue) || stringValue(args.nextDraft.location);
  if (previousLocation && nextLocation && previousLocation !== nextLocation) {
    return !isMetadataOnlyLocationEdit(args.userMessage);
  }

  return false;
}

function refreshGeneratedDraftInviteMetadata(
  existingInvite: GeneratedInvitePayload,
  updatedDraft: ConciergeEventDraft,
): GeneratedInvitePayload {
  const details = buildStudioDetailsFromDraft(updatedDraft);
  return {
    imageUrl: existingInvite.imageUrl,
    invitationData: refreshLiveCardInvitationData(details, existingInvite.invitationData),
  };
}

function isGeneratedDraftFullRedesignRequest(message: string): boolean {
  const text = message.trim().toLowerCase();
  if (!text) return false;
  if (/\b(?:keep|preserve|reuse|use)\s+(?:the\s+)?same\s+image\b/.test(text)) return false;

  return [
    /\b(?:new|nme|fresh|different|another|alternate|alternative)\s+(?:design|image|invite|invitation|card|look|layout|style|version)\b/,
    /\b(?:completely|totally|entirely|brand)\s+(?:new|different)\b/,
    /\b(?:from scratch|start over|start again|redo|redesign|re[-\s]?design|regenerate|re[-\s]?generate|remake|rebuild)\b/,
    /\b(?:nothing|nothin|not)\s+(?:the\s+)?same\b/,
    /\bsame\s+image\b/,
  ].some((pattern) => pattern.test(text));
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
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const shouldRefocusComposerRef = useRef(false);
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
  const [chatUploadStage, setChatUploadStage] = useState<ChatUploadStage>("idle");
  const [buildProgress, setBuildProgress] = useState(0);
  const [liveCardEventId, setLiveCardEventId] = useState<string | null>(null);
  const [liveCardTitle, setLiveCardTitle] = useState<string | null>(null);
  const [liveCardSummary, setLiveCardSummary] = useState<LiveCardSummary | null>(null);
  const [generatedInviteImageUrl, setGeneratedInviteImageUrl] = useState<string | null>(null);
  const [draftStudioInvite, setDraftStudioInvite] = useState<GeneratedInvitePayload | null>(null);
  const [uploadedPreviewImageUrl, setUploadedPreviewImageUrl] = useState<string | null>(null);
  const [uploadedPreviewFileName, setUploadedPreviewFileName] = useState<string | null>(null);
  const [pendingChatUpload, setPendingChatUpload] = useState<PendingChatUpload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [failedRequest, setFailedRequest] = useState<FailedConciergeRequest | null>(null);
  const [failedSnapUpload, setFailedSnapUpload] = useState<FailedSnapUploadRequest | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isComposerFocused, setIsComposerFocused] = useState(false);
  const [isReadyChatComposerOpen, setIsReadyChatComposerOpen] = useState(false);
  const scanStatusFromQuery = searchParams.get("scanStatus");
  const scanErrorFromQuery = searchParams.get("scanError");

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
  const busyLabel = isUploading
    ? chatUploadStage === "creating_event"
      ? "Creating event"
      : chatUploadStage === "ocr_ready"
        ? "Reading upload"
        : chatUploadStage === "scanning"
          ? "Scanning upload"
          : "Preparing upload"
    : isEditingGeneratedCard
      ? "Updating draft"
      : isGeneratingCard
        ? "Generating invite"
        : isPublishingCard
          ? "Publishing invite"
          : "Concierge is thinking...";
  const isThinking = busyLabel === "Concierge is thinking..." && !isStreamingAssistant;
  const isCompactEmptyComposer =
    isEmptyState && !input.trim() && !isComposerFocused && !isListening;
  const activeBuildSteps = isUpdatingPreview ? PREVIEW_UPDATE_STEPS : BUILDING_STEPS;
  const currentBuildStep = Math.min(
    Math.floor((buildProgress / 100) * activeBuildSteps.length),
    activeBuildSteps.length - 1,
  );
  const effectiveSelectedProductOutput = selectedProductOutput || "live_card";
  const effectiveSelectedProductLabel = productActionLabel(draft, effectiveSelectedProductOutput);
  const hasGeneratedDraftProduct = Boolean(draftStudioInvite);
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
  const rsvpDashboardHref = generatedRsvpDashboardHref(liveCardEventId, draft?.rsvpEnabled);
  const liveCardPublicHref = generatedProductHref(
    liveCardEventId,
    effectiveSelectedProductOutput,
    rsvpDashboardHref,
  );
  const threadId = searchParams.get("thread")?.trim() || null;
  const selectedCategoryLabel =
    starterSelectionLabel(selectedStarterCategory) || categoryLabelForDraft(draft);
  const selectedProductOption = selectedProductOutput
    ? PRODUCT_OPTIONS.find((option) => option.output === selectedProductOutput) || null
    : null;
  const selectedProductPillOption =
    selectedProductOption && (isEmptyState || selectedStarterCategory)
      ? selectedProductOption
      : null;
  const hasComposerSelection = Boolean(selectedStarterCategory || selectedProductOutput);
  const canSubmitComposer = Boolean(input.trim() || hasComposerSelection);
  const selectedSkinLabel =
    skinLabelForCategoryName(selectedCategoryLabel) || skinLabelForDraft(draft);
  const hasInitialEventContext =
    Boolean(draft) || visibleMessages.some((message) => message.role === "user");
  const isWaitingForEventPurpose =
    draft?.currentQuestion === "what_are_we_celebrating" ||
    draft?.missingFields[0] === "eventPurpose";
  const shouldShowProductFormatTiles =
    !liveCardEventId &&
    Boolean(draft) &&
    !isReceivedInviteDraft(draft) &&
    !draft?.requestedOutputs.length &&
    !isWaitingForEventPurpose &&
    !isBusy &&
    !isEmptyState &&
    hasInitialEventContext;
  const shouldShowReadyActions =
    ((hasReadyDraftProduct && !shouldShowGiftRegistryPrompt) || isGeneratingCard) &&
    (!isReadyChatComposerOpen || isGeneratingCard);
  const shouldShowReceivedInviteActions = hasReadyReceivedInvite && !isReadyChatComposerOpen;
  const publicProductActionLabel = publicActionLabelForOutput(effectiveSelectedProductOutput);
  const shouldShowDraftProductAction = hasGeneratedDraftProduct && !liveCardPublicHref;
  const shouldShowPublishedProductActions = Boolean(liveCardPublicHref);
  const shouldShowThreadProductActions =
    isGeneratingCard ||
    isUpdatingPreview ||
    shouldShowDraftProductAction ||
    shouldShowPublishedProductActions;
  const shouldShowGiftRegistryActions = shouldShowGiftRegistryPrompt && !isReadyChatComposerOpen;
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
    setDraftStudioInvite(null);
    setUploadedPreviewImageUrl(null);
    setUploadedPreviewFileName(null);
    setPendingChatUpload(null);
    setBuildProgress(0);
    setSelectedProductOutput(null);
    setSelectedStarterCategory(null);
    setFailedRequest(null);
    setFailedSnapUpload(null);
    setIsUploading(false);
    setChatUploadStage("idle");
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
    if (draft.giftPromptDismissed || draft.conversationState?.registrySkipped) {
      setIsReadyChatComposerOpen(false);
      setMessages((prev) => [
        ...prev,
        newMessage("user", "Skip gift link"),
        newMessage("assistant", "Already skipped — we’re good there."),
      ]);
      return;
    }
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
      starterSelectionLabel(selectedStarterCategory) || categoryLabelForDraft(draft),
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

  function handleProductChoice(option: ProductOption) {
    if (isBusy) return;
    setSelectedProductOutput(option.output);
    updateComposerSelection();
  }

  function removeSelectedStarterCategory() {
    if (isBusy || !selectedStarterCategory) return;
    updateComposerSelection();
    setSelectedStarterCategory(null);
  }

  function removeSelectedProductOutput() {
    if (isBusy || !selectedProductOutput) return;
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

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const previousRootOverflow = root.style.overflow;
    const previousBodyOverflow = body.style.overflow;

    const updateChatViewportMetrics = () => {
      const visualViewport = window.visualViewport;
      const layoutHeight = window.innerHeight;
      const visualHeight = visualViewport?.height ?? layoutHeight;
      const visualTop = visualViewport?.offsetTop ?? 0;
      const keyboardInset = Math.max(0, layoutHeight - visualHeight - visualTop);

      if (layoutHeight > 0) {
        root.style.setProperty("--envitefy-chat-layout-height", `${layoutHeight}px`);
      }
      root.style.setProperty("--envitefy-chat-keyboard-inset", `${Math.round(keyboardInset)}px`);
    };

    root.style.overflow = "hidden";
    body.style.overflow = "hidden";
    updateChatViewportMetrics();
    window.visualViewport?.addEventListener("resize", updateChatViewportMetrics);
    window.visualViewport?.addEventListener("scroll", updateChatViewportMetrics);
    window.addEventListener("resize", updateChatViewportMetrics);
    window.addEventListener("orientationchange", updateChatViewportMetrics);

    return () => {
      window.visualViewport?.removeEventListener("resize", updateChatViewportMetrics);
      window.visualViewport?.removeEventListener("scroll", updateChatViewportMetrics);
      window.removeEventListener("resize", updateChatViewportMetrics);
      window.removeEventListener("orientationchange", updateChatViewportMetrics);
      root.style.overflow = previousRootOverflow;
      body.style.overflow = previousBodyOverflow;
      root.style.removeProperty("--envitefy-chat-layout-height");
      root.style.removeProperty("--envitefy-chat-keyboard-inset");
    };
  }, []);

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
        setDraftStudioInvite(null);
        setGeneratedInviteImageUrl(null);
        setLiveCardEventId(savedEventId);
        setLiveCardTitle(savedEventId ? draftHeadline(restoredDraft) : null);
        setLiveCardSummary(
          liveCardSummaryFromDraft(restoredDraft, restoredOutput || effectiveSelectedProductOutput),
        );
        setBuildProgress(savedEventId ? 100 : 0);
        setIsReadyChatComposerOpen(false);
        setPhase(
          savedEventId
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
    if (!isGeneratingCard && !isUpdatingPreview) return;
    const interval = window.setInterval(() => {
      setBuildProgress((current) => {
        if (current >= 92) return current;
        return Math.min(92, current + Math.random() * 10 + 4);
      });
    }, 420);
    return () => window.clearInterval(interval);
  }, [isGeneratingCard, isUpdatingPreview]);

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
    } = {},
  ): Promise<GeneratedInvitePayload> {
    const details = buildStudioDetailsFromDraft(draftToGenerate);
    const sourceImageUrl = stringValue(options.sourceImageUrl);
    const editPrompt = stringValue(options.editPrompt);
    const previousDetails = options.previousDraft
      ? buildStudioDetailsFromDraft(options.previousDraft)
      : undefined;
    const response = await requestStudioGeneration(
      details,
      sourceImageUrl ? "image" : "both",
      "page",
      editPrompt || undefined,
      sourceImageUrl || undefined,
      previousDetails,
    );
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

  async function uploadedLiveCardSourceImageUrl() {
    if (effectiveSelectedProductOutput !== "live_card" || !uploadedPreviewImageUrl) return null;
    return persistImageMediaValue({
      value: uploadedPreviewImageUrl,
      fileName: uploadedPreviewFileName || "uploaded-live-card-source.png",
    });
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
      `Your ${effectiveSelectedProductLabel.toLowerCase()} is generated. Use the button below to save/publish, or tell me what to change.`,
    );
    try {
      const sourceImageUrl = await uploadedLiveCardSourceImageUrl();
      const studioInvite = await generateStudioInviteForDraft(productDraft, {
        sourceImageUrl,
      });
      await preloadGeneratedPreviewImage(studioInvite.imageUrl);
      setDraft(productDraft);
      setDraftStudioInvite(studioInvite);
      setGeneratedInviteImageUrl(studioInvite.imageUrl);
      setLiveCardEventId(null);
      setLiveCardTitle(draftHeadline(productDraft));
      setLiveCardSummary(liveCardSummaryFromDraft(productDraft, effectiveSelectedProductOutput));
      setBuildProgress(100);
      setPhase("card_ready");
      setMessages((prev) => [...prev, generatedMessage]);
      notifyCreationThreadsChanged();
    } catch (err) {
      setBuildProgress(0);
      setPhase(draftToGenerate.canPersist ? "ready_to_generate" : "collecting_details");
      setError(err instanceof Error ? err.message : "Unable to generate invite.");
    }
  }

  async function publishGeneratedDraft() {
    if (isBusy || !draft || !draftStudioInvite) return;
    const productDraft = normalizeDraftProductOutputs(draft);
    if (!isReadyProductDraft(productDraft)) {
      setError("Add the missing event details before publishing the invite.");
      return;
    }

    setError(null);
    setPhase("publishing_card");
    setBuildProgress(92);
    try {
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
        throw new Error(json && !json.ok ? json.error : "Unable to publish invite.");
      }
      const savedEventId = json.savedEventId;
      if (!savedEventId) throw new Error("Invite was published without an event id.");
      setBuildProgress(100);
      setDraft(json.draft);
      setLiveCardEventId(savedEventId);
      setLiveCardTitle(draftHeadline(json.draft || productDraft));
      setLiveCardSummary(
        liveCardSummaryFromDraft(json.draft || productDraft, effectiveSelectedProductOutput),
      );
      setPhase("card_ready");
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

    const fullRedesign = isGeneratedDraftFullRedesignRequest(trimmed);
    const userMessage = newMessage("user", trimmed);
    setError(null);
    setFailedRequest(null);
    setIsSending(true);
    setPhase(fullRedesign ? "generating_card" : "editing_card");
    setBuildProgress(8);
    setMessages((prev) => [...prev, userMessage]);
    try {
      const response = await fetch(withConciergeTiming(CREATION_INTAKE_URL), {
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
        throw new Error(json && !json.ok ? json.error : "Draft update failed.");
      }

      const updatedDraft = normalizeDraftProductOutputs(json.draft);
      const existingDraftImageUrl = draftStudioInvite?.imageUrl || generatedInviteImageUrl;
      const canReuseCurrentImage =
        !fullRedesign &&
        Boolean(draftStudioInvite) &&
        !shouldRegenerateGeneratedDraftImageForEdit({
          userMessage: trimmed,
          previousDraft: draft,
          nextDraft: updatedDraft,
        });
      const studioInvite =
        canReuseCurrentImage && draftStudioInvite
          ? refreshGeneratedDraftInviteMetadata(draftStudioInvite, updatedDraft)
          : await generateStudioInviteForDraft(updatedDraft, {
              editPrompt: fullRedesign
                ? buildGeneratedDraftFullRedesignPrompt(trimmed)
                : buildGeneratedDraftImageEditPrompt({
                    userMessage: trimmed,
                    previousDraft: draft,
                    nextDraft: updatedDraft,
                  }),
              sourceImageUrl: fullRedesign ? null : existingDraftImageUrl,
              previousDraft: fullRedesign ? null : draft,
            });
      if (!canReuseCurrentImage) {
        await preloadGeneratedPreviewImage(studioInvite.imageUrl);
      }
      setDraft(updatedDraft);
      setDraftStudioInvite(studioInvite);
      setGeneratedInviteImageUrl(studioInvite.imageUrl);
      setLiveCardEventId(null);
      setLiveCardTitle(draftHeadline(updatedDraft));
      setLiveCardSummary(liveCardSummaryFromDraft(updatedDraft, effectiveSelectedProductOutput));
      setBuildProgress(100);
      setPhase("card_ready");
      setMessages((prev) => [
        ...prev,
        newMessage(
          "assistant",
          fullRedesign
            ? "I generated a completely new draft design from scratch. Keep chatting or save/publish when it looks right."
            : "I updated that part of the draft. Keep chatting or save/publish when it looks right.",
        ),
      ]);
      notifyCreationThreadsChanged();
    } catch (err) {
      setBuildProgress(0);
      setPhase("card_ready");
      setError(err instanceof Error ? err.message : "Draft update failed.");
    } finally {
      setIsSending(false);
      refocusComposerAfterResponse();
    }
  }

  async function sendGeneratedCardEdit(message: string) {
    const trimmed = message.trim();
    if (!trimmed || !liveCardEventId) return;

    setError(null);
    setFailedRequest(null);
    setIsSending(true);
    setPhase("editing_card");
    setBuildProgress(8);
    setMessages((prev) => [...prev, newMessage("user", trimmed)]);
    if (isUnsupportedExternalConciergeRequest(trimmed)) {
      setBuildProgress(0);
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
        throw new Error(json && !json.ok ? json.error : "Draft update failed.");
      }
      const fallbackSummary =
        liveCardSummary || liveCardSummaryFromDraft(draft, effectiveSelectedProductOutput);
      setLiveCardTitle(json.event.title || liveCardTitle || draftHeadline(draft));
      setLiveCardSummary(liveCardSummaryFromEvent(json.event, fallbackSummary));
      setBuildProgress(100);
      setPhase("card_ready");
      setMessages((prev) => [...prev, newMessage("assistant", json.assistantMessage)]);
    } catch (err) {
      setBuildProgress(0);
      setPhase("card_ready");
      setError(err instanceof Error ? err.message : "Draft update failed.");
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
  }): Promise<ConciergeStreamStatePayload | null> {
    const message = params.message.trim();
    if (!message && !params.ocrContext) return null;

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
    if (isUnsupportedExternalConciergeRequest(message)) {
      setMessages((prev) => [
        ...prev,
        newMessage("assistant", UNSUPPORTED_EXTERNAL_CONCIERGE_MESSAGE),
      ]);
      setPhase(
        draft
          ? isReadyProductDraft(draft)
            ? "ready_to_generate"
            : "collecting_details"
          : "intake_empty",
      );
      setIsSending(false);
      refocusComposerAfterResponse();
      return null;
    }
    let streamAssistantId: string | null = null;
    let streamedAssistantText = "";
    try {
      const contextCategory =
        params.starterCategory ||
        starterSelectionLabel(selectedStarterCategory) ||
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
        if (!finalState) throw new Error("Concierge stream ended before draft state arrived.");
        return finalState;
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
      notifyCreationThreadsChanged();
      const assistantMessage = newMessage("assistant", json.assistantMessage);
      if (json.chatMessages?.length) {
        setMessages(chatMessagesFromSnapshots(json.chatMessages));
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
      const errorMessage = err instanceof Error ? err.message : "Concierge request failed.";
      setPhase(draft ? "collecting_details" : "intake_empty");
      if (streamAssistantId) {
        setMessages((prev) => prev.filter((item) => item.id !== streamAssistantId));
      }
      setError(null);
      setFailedRequest({ ...params, error: errorMessage });
      return null;
    } finally {
      setIsStreamingAssistant(false);
      setIsSending(false);
      refocusComposerAfterResponse();
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
      throw new Error(json && !json.ok ? json.error : "Unable to create event from upload.");
    }
    const savedEventId = json.savedEventId;
    if (!savedEventId) throw new Error("Event was created without an event id.");

    const savedDraft = normalizeDraftProductOutputs(json.draft || params.draft);
    const savedOutput =
      savedDraft.requestedOutputs
        .map(visibleProductOutput)
        .find((output) => PRODUCT_OPTIONS.some((option) => option.output === output)) || null;
    setBuildProgress(100);
    setDraft(savedDraft);
    setSelectedProductOutput(savedOutput);
    setLiveCardEventId(savedEventId);
    setLiveCardTitle(draftHeadline(savedDraft));
    setLiveCardSummary(
      liveCardSummaryFromDraft(savedDraft, savedOutput || effectiveSelectedProductOutput),
    );
    setPhase("card_ready");
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
    const { file, source } = failedSnapUpload;
    setFailedSnapUpload(null);
    await routeSelectedSnapFile(file, source);
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

  async function submitComposerInput() {
    if (isBusy) return;
    const typedValue = input.trim();
    const value = typedValue || selectionPrefix(selectedCategoryLabel, selectedProductOutput);
    if (!value) return;
    setInput("");
    shouldRefocusComposerRef.current = true;
    if (canSaveReceivedInvite && isGenerateConfirmationMessage(value)) {
      await saveReceivedInviteDraft();
      return;
    }
    if (canGenerateProduct && draft && isGenerateConfirmationMessage(value)) {
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
      action: selectedStarterCategory ? "starter_category" : undefined,
      requestedOutputs:
        selectedProductOutput && !draft?.requestedOutputs?.length
          ? [selectedProductOutput]
          : undefined,
      starterCategory: starterSelectionLabel(selectedStarterCategory),
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitComposerInput();
  }

  function handleStarterPrompt(tile: CelebrationStarterTile) {
    if (isBusy) return;
    setError(null);
    if ("action" in tile && tile.action === "upload") {
      setSelectedStarterCategory(null);
      openSnapUploadPicker();
      return;
    }
    setPendingChatUpload(null);
    const isSelected = selectedStarterCategory?.label === tile.label;
    setSelectedStarterCategory(isSelected ? null : tile);
    updateComposerSelection();
  }

  function handleStarterProductChoice(option: ProductOption) {
    if (isBusy) return;
    setSelectedProductOutput(option.output);
    if (pendingChatUpload) {
      const upload = pendingChatUpload;
      setPendingChatUpload(null);
      void routeSelectedSnapFile(upload.file, upload.source, option.output);
      return;
    }
    updateComposerSelection();
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

  function handleSelectedSnapFile(file: File | null | undefined, source: "camera" | "upload") {
    if (!file || isBusy) return;
    const validationError = validateClientUploadFile(file, "attachment");
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setFailedRequest(null);
    setFailedSnapUpload(null);
    if (!selectedProductOutput && isEmptyState) {
      setPendingChatUpload({ file, source });
      return;
    }

    setPendingChatUpload(null);
    void routeSelectedSnapFile(file, source);
  }

  async function routeSelectedSnapFile(
    file: File | null | undefined,
    source: "camera" | "upload",
    requestedOutputOverride?: RequestedOutput,
  ) {
    if (!file || isBusy) return;
    const validationError = validateClientUploadFile(file, "attachment");
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setFailedRequest(null);
    setFailedSnapUpload(null);
    setIsUploading(true);
    setChatUploadStage("preparing_upload");
    const uploadPreviewUrl = createObjectUrlPreview(file);
    setUploadedPreviewImageUrl(uploadPreviewUrl);
    setUploadedPreviewFileName(uploadPreviewUrl ? uploadedFileLabel(file) : null);
    const scanAttemptId = createClientAttemptId("scan");
    const uploadRequestedOutput = requestedOutputOverride || selectedProductOutput || "live_card";
    const statusMessage = newMessage("assistant", "Preparing upload...", "upload_status");
    setMessages((prev) => [...prev, newMessage("user", "Uploaded 1 file"), statusMessage]);
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
      const ocrResult = await runSnapOcrUpload({ file, scanAttemptId });
      setChatUploadStage("ocr_ready");
      updateUploadStatus("Reading upload...");
      const intakeResult = await sendToConcierge({
        message: "Create an event from this uploaded file.",
        action: "ocr_result",
        ocrContext: buildChatOcrContext(ocrResult, scanAttemptId),
        requestedOutputs: [uploadRequestedOutput],
        suppressUserEcho: true,
      });
      if (!intakeResult?.ok) {
        throw new Error("I scanned the file, but couldn't turn it into event details.");
      }
      const scannedDraft = normalizeDraftProductOutputs(intakeResult.draft);
      if (isReadyProductDraft(scannedDraft)) {
        clearUploadStatus();
        setChatUploadStage("success");
        setMessages((prev) => [
          ...prev,
          newMessage(
            "assistant",
            isReceivedInviteDraft(scannedDraft)
              ? "I read this as an invite you received. The extracted event details are locked to the upload; save it to Invited events when it looks right."
              : `I read the upload and drafted ${draftHeadline(scannedDraft)}. Keep editing, or generate it when you're ready.`,
          ),
        ]);
      } else {
        clearUploadStatus();
        setChatUploadStage("success");
      }
    } catch (err) {
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
      setFailedSnapUpload({ file, source, error: errorMessage });
      setError(errorMessage);
      setMessages((prev) => [
        ...prev,
        newMessage(
          "assistant",
          "I couldn't finish creating your event from that upload. Retry it, upload a different file, or keep going manually.",
        ),
      ]);
    } finally {
      setIsUploading(false);
      setChatUploadStage((current) =>
        current === "error" || current === "success" ? current : "idle",
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function openSnapUploadPicker() {
    if (isBusy) return;
    setError(null);
    setFailedSnapUpload(null);
    try {
      fileInputRef.current?.click();
    } catch (err) {
      console.error("Failed to open file picker:", err);
      setError("Unable to open the file picker. Please try again.");
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
                <Loader2 className="size-4 animate-spin text-[#5c5be5]" aria-hidden="true" />
                {message.text}
              </div>
            ) : message.role === "user" ? (
              <div className="flex max-w-[94%] items-start justify-end gap-2 sm:max-w-[88%]">
                <div className="min-w-0 whitespace-pre-line rounded-3xl rounded-tr-md bg-[#5c5be5] px-4 py-3 text-sm leading-6 text-white shadow-sm shadow-[#5c5be5]/15">
                  {message.text}
                </div>
                <UserChatAvatar initials={userAvatarInitials} />
              </div>
            ) : (
              <div className="flex max-w-[94%] items-start gap-2 sm:max-w-[88%]">
                <ConciergeChatAvatar />
                <div className="min-w-0 whitespace-pre-line rounded-3xl rounded-tl-md border border-[#eadfff] bg-white/88 px-4 py-3 text-sm leading-6 text-[#24183e] shadow-sm">
                  {message.role === "assistant"
                    ? formatAssistantBubbleText(message.text, draft)
                    : message.text}
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {shouldShowThreadProductActions ? (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="flex items-start gap-2"
        >
          <ConciergeChatAvatar />
          <div className="min-w-0 max-w-[94%] rounded-3xl rounded-tl-md border border-[#d8caff] bg-white/92 px-4 py-3 text-sm leading-6 text-[#24183e] shadow-sm sm:max-w-[88%]">
            {isGeneratingCard || isUpdatingPreview ? (
              <div className="min-w-0">
                <div className="flex items-center gap-2 font-bold text-[#2d1b36]">
                  <Loader2 className="size-4 shrink-0 animate-spin text-[#5c5be5]" aria-hidden="true" />
                  <span className="truncate">{activeBuildSteps[currentBuildStep]}</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#eadfff]">
                  <div
                    className="h-full rounded-full bg-[#5c5be5] transition-[width] duration-300"
                    style={{ width: `${buildProgress}%` }}
                  />
                </div>
              </div>
            ) : null}
            {shouldShowDraftProductAction ? (
              <button
                type="button"
                onClick={() => void publishGeneratedDraft()}
                disabled={isPublishingCard || !draftStudioInvite}
                className="inline-flex h-11 max-w-full items-center justify-center gap-2 rounded-2xl bg-[#3b2468] px-5 text-sm font-bold text-[#f6efff] shadow-lg shadow-[#3b2468]/20 transition hover:bg-[#2f1a55] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a98dff] disabled:cursor-wait disabled:opacity-70"
              >
                {isPublishingCard ? (
                  <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden="true" />
                ) : (
                  <ExternalLink className="size-4 shrink-0" aria-hidden="true" />
                )}
                <span className="truncate">{isPublishingCard ? "Publishing..." : "Save / Publish"}</span>
              </button>
            ) : null}
            {liveCardPublicHref ? (
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={liveCardPublicHref}
                  className="inline-flex h-11 max-w-full items-center justify-center gap-2 rounded-2xl bg-[#3b2468] px-5 text-sm font-bold text-[#f6efff] shadow-lg shadow-[#3b2468]/20 transition hover:bg-[#2f1a55] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a98dff]"
                >
                  <ExternalLink className="size-4 shrink-0" aria-hidden="true" />
                  <span className="truncate">{publicProductActionLabel}</span>
                </a>
                {rsvpDashboardHref ? (
                  <a
                    href={rsvpDashboardHref}
                    className="inline-flex h-11 max-w-full items-center justify-center gap-2 rounded-2xl border border-[#d8caff] bg-white px-5 text-sm font-bold text-[#3b2468] shadow-sm shadow-[#3b2468]/10 transition hover:border-[#c2aef3] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a98dff]"
                  >
                    <LayoutDashboard className="size-4 shrink-0" aria-hidden="true" />
                    <span className="truncate">Open Dashboard</span>
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>
        </motion.div>
      ) : null}

      {failedRequest ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-2"
        >
          <ConciergeChatAvatar />
          <div className="min-w-0 max-w-[94%] rounded-3xl rounded-tl-md border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-800 shadow-sm sm:max-w-[88%]">
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

      {failedSnapUpload ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-2"
        >
          <ConciergeChatAvatar />
          <div className="min-w-0 max-w-[94%] rounded-3xl rounded-tl-md border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-800 shadow-sm sm:max-w-[88%]">
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

      {shouldShowProductFormatTiles ? (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="w-full max-w-full self-start"
        >
          <BottomNavBar
            items={PRODUCT_OPTIONS.map(chatProductNavItem)}
            activeValue={selectedProductOutput}
            defaultIndex={-1}
            spreadItems
            autoOpenOnMount
            autoOpenIntervalMs={2000}
            autoOpenCycles={3}
            ariaLabel="Choose product format"
            className="w-full !min-w-0 !border !border-white/70 !bg-white/62 !shadow-[0_18px_46px_rgba(92,91,229,0.12)] !backdrop-blur-xl"
            onValueChange={(value) => {
              const option = PRODUCT_OPTIONS.find((item) => item.output === value);
              if (option) handleProductChoice(option);
            }}
          />
        </motion.div>
      ) : null}

      {isBusy && !isUploading && !isGeneratingCard && !isStreamingAssistant ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex max-w-[94%] self-start items-start gap-2 sm:max-w-[88%]"
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
      <div ref={messagesEndRef} />
    </div>
  );

  const emptyProductFormatSelector = (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="mx-auto mb-8 flex w-full max-w-3xl justify-center sm:mb-10 sm:max-w-4xl"
    >
      <div className="flex w-full justify-center sm:hidden">
        <BottomNavBar
          items={PRODUCT_OPTIONS.map(chatProductNavItem)}
          activeValue={selectedProductOutput}
          defaultIndex={-1}
          spreadItems
          autoOpenOnMount
          autoOpenIntervalMs={2000}
          autoOpenCycles={3}
          ariaLabel={
            selectedStarterCategory
              ? `Choose product format for ${selectedStarterCategory.label}`
              : "Choose product format"
          }
          className="w-[calc((clamp(5.65rem,16dvh,7.5rem)*2)+clamp(0.7rem,1.8dvh,1.1rem))] !min-w-0 !max-w-full !border !border-white/70 !bg-white/62 !shadow-[0_18px_46px_rgba(92,91,229,0.12)] !backdrop-blur-xl"
          onValueChange={(value) => {
            const option = PRODUCT_OPTIONS.find((item) => item.output === value);
            if (option) handleStarterProductChoice(option);
          }}
        />
      </div>
      <div
        className="hidden max-w-full items-center justify-center gap-2 rounded-full border border-white/70 bg-white/62 p-2 shadow-[0_18px_46px_rgba(92,91,229,0.12)] backdrop-blur-xl sm:flex"
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
                "group relative inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 text-xs font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a98dff] disabled:cursor-not-allowed disabled:opacity-55 sm:px-8 sm:py-4 sm:text-sm",
                isSelected
                  ? "bg-white/72 text-[#5c5be5] shadow-[0_10px_24px_rgba(92,91,229,0.1)]"
                  : "text-[#747684] hover:text-[#5d6070]",
              )}
            >
              <Icon
                size={18}
                strokeWidth={2}
                aria-hidden="true"
                className={cn(
                  "transition-transform duration-300",
                  isSelected ? "scale-110" : "group-hover:scale-105",
                )}
              />
              <span className="whitespace-nowrap transition-colors">{option.label}</span>
              {isSelected ? (
                <motion.span
                  layoutId="chatProductActiveUnderline"
                  className="absolute bottom-2 left-1/2 h-[2px] w-8 -translate-x-1/2 rounded-full bg-[#5c5be5] opacity-40"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.4 }}
                />
              ) : null}
            </button>
          );
        })}
      </div>
    </motion.div>
  );

  const selectionPills =
    selectedStarterCategory || selectedProductPillOption ? (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex min-w-0 max-w-full flex-wrap items-center gap-2"
        aria-label="Selected chat filters"
      >
        {selectedStarterCategory ? (
          <ChatSelectionPill
            label={selectedStarterCategory.label}
            onRemove={removeSelectedStarterCategory}
            disabled={isBusy}
            ariaLabel={`Remove ${selectedStarterCategory.label} category`}
            textClassName={selectedStarterCategory.color}
          />
        ) : null}
        {selectedProductPillOption ? (
          <ChatSelectionPill
            label={selectedProductPillOption.label}
            onRemove={removeSelectedProductOutput}
            disabled={isBusy}
            ariaLabel={`Remove ${selectedProductPillOption.label} product`}
            textClassName="text-[#5c5be5]"
          />
        ) : null}
      </motion.div>
    ) : null;

  const composer = (
    <div
      className={cn(
        "pointer-events-none z-30 mx-auto flex w-full max-w-3xl shrink-0 flex-col items-stretch px-2 pb-[calc(env(safe-area-inset-bottom)+var(--envitefy-chat-keyboard-inset,0px)+0.75rem)] pt-4 sm:px-6 sm:pb-[calc(env(safe-area-inset-bottom)+var(--envitefy-chat-keyboard-inset,0px)+2rem)]",
        isEmptyState &&
          "max-md:px-3 max-md:pb-[calc(env(safe-area-inset-bottom)+var(--envitefy-chat-keyboard-inset,0px)+0.45rem)] max-md:pt-2 max-h-[700px]:max-md:pb-[calc(env(safe-area-inset-bottom)+var(--envitefy-chat-keyboard-inset,0px)+0.3rem)] max-h-[700px]:max-md:pt-1",
      )}
    >
      <div ref={composerCardRef} className="pointer-events-auto w-full">
        {isEmptyState ? emptyProductFormatSelector : null}
        <form onSubmit={handleSubmit}>
          <input
            ref={fileInputRef}
            type="file"
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
            onSubmit={() => void submitComposerInput()}
            disabled={isBusy}
            className={cn(
              "w-full border-[#d8caff] bg-[#fbf9ff] p-2 text-[#25183a] shadow-[0_18px_46px_rgba(93,63,155,0.18),inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-white/75 backdrop-blur transition-all duration-300",
              isCompactEmptyComposer && "max-md:rounded-[1.4rem] max-md:p-1.5",
              isListening &&
                "border-[#8b5cf6] shadow-[0_18px_46px_rgba(124,77,255,0.24),inset_0_1px_0_rgba(255,255,255,0.95)]",
            )}
          >
            <div
              className={cn(
                "flex min-h-[52px] flex-col gap-2",
                isCompactEmptyComposer && "max-md:min-h-[42px]",
              )}
            >
              {selectionPills}
              <div className="flex min-w-0 items-center gap-2">
                <PromptInputTextarea
                  placeholder={
                    liveCardEventId
                      ? "Tell me what to change..."
                      : isCompactEmptyComposer
                        ? "Type instead..."
                        : "Or just start typing and let's get going..."
                  }
                  aria-label={liveCardEventId ? "Refine invite" : "Start planning from scratch"}
                  onFocus={() => setIsComposerFocused(true)}
                  onBlur={() => setIsComposerFocused(false)}
                  className={cn(
                    "min-h-[44px] min-w-0 flex-1 px-3 py-2.5 text-base !text-[#25183a] caret-[#5c5be5] selection:bg-[#d8caff] selection:text-[#25183a] !placeholder:text-[#8b7ca6] [&::placeholder]:text-[0.82rem] sm:min-w-[12rem] sm:[&::placeholder]:text-base",
                    isCompactEmptyComposer &&
                      "max-md:min-h-[34px] max-md:px-2 max-md:py-1.5 max-md:text-sm max-md:[&::placeholder]:text-[0.78rem]",
                  )}
                />
                <PromptInputActions className="ml-auto shrink-0 justify-end gap-2">
                  <PromptInputAction
                    tooltip={
                      isBusy
                        ? busyLabel
                        : canSubmitComposer
                          ? "Send message"
                          : isListening
                            ? "Listening"
                            : "Voice message"
                    }
                  >
                    <button
                      type={canSubmitComposer ? "submit" : "button"}
                      disabled={isBusy || (!canSubmitComposer && isListening)}
                      onClick={(event) => {
                        if (canSubmitComposer) return;
                        event.preventDefault();
                        void handleVoiceInput();
                      }}
                      className={cn(
                        "inline-flex h-9 w-9 items-center justify-center rounded-full text-[#76648f] transition hover:bg-[#f1ebff] hover:text-[#5c5be5] disabled:pointer-events-none disabled:opacity-50",
                        (canSubmitComposer || isListening) && "text-[#5c5be5]",
                        isCompactEmptyComposer && "max-md:h-8 max-md:w-8",
                      )}
                      aria-label={canSubmitComposer ? "Send" : "Use voice input"}
                    >
                      {isBusy ? (
                        <Loader2
                          className={cn(
                            "size-5 animate-spin text-[#5c5be5]",
                            isCompactEmptyComposer && "max-md:size-4",
                          )}
                          aria-hidden="true"
                        />
                      ) : canSubmitComposer ? (
                        <ArrowUp
                          className={cn(
                            "size-6 text-current",
                            isCompactEmptyComposer && "max-md:size-5",
                          )}
                          strokeWidth={2.5}
                          aria-hidden="true"
                        />
                      ) : (
                        <Mic
                          className={cn(
                            "size-6 text-current",
                            isCompactEmptyComposer && "max-md:size-5",
                          )}
                          strokeWidth={2.4}
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  </PromptInputAction>
                </PromptInputActions>
              </div>
            </div>
          </PromptInput>
        </form>
        {error ? <p className="mt-3 text-sm font-medium text-red-600">{error}</p> : null}
      </div>
    </div>
  );

  const readyActions = (
    <div className="pointer-events-none z-30 mx-auto flex w-full max-w-3xl shrink-0 flex-col items-stretch px-2 pb-[calc(env(safe-area-inset-bottom)+var(--envitefy-chat-keyboard-inset,0px)+0.75rem)] pt-4 sm:px-6 sm:pb-[calc(env(safe-area-inset-bottom)+var(--envitefy-chat-keyboard-inset,0px)+2rem)]">
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
        {!shouldShowGiftRegistryPrompt && !shouldShowReceivedInviteActions ? (
          <div className="mx-auto grid w-full max-w-[22rem] grid-cols-2 gap-1.5 rounded-2xl border border-[#d8caff] bg-[#fbf9ff]/96 p-1.5 shadow-[0_18px_46px_rgba(93,63,155,0.18),inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-white/75 backdrop-blur">
            <button
              type="button"
              onClick={() => setIsReadyChatComposerOpen(true)}
              disabled={isGeneratingCard}
              className="inline-flex h-10 min-w-0 items-center justify-center gap-1.5 rounded-xl border border-[#ded2f5] bg-white px-2.5 text-sm font-bold text-[#4f3a73] transition hover:border-[#c7b4ee] hover:bg-[#f5f0ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a98dff] disabled:cursor-not-allowed disabled:opacity-55"
            >
              <MessageCircle className="size-4 shrink-0" aria-hidden="true" />
              <span className="truncate">Keep editing</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (draft) void generateProductForDraft(draft);
              }}
              className="inline-flex h-10 min-w-0 items-center justify-center gap-1.5 rounded-xl bg-[#5c5be5] px-2.5 text-sm font-bold text-white shadow-[0_14px_30px_rgba(92,91,229,0.24)] transition hover:bg-[#4f4ed2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a98dff] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isGeneratingCard || !canGenerateProduct}
              aria-label={
                isGeneratingCard
                  ? `Generating ${effectiveSelectedProductLabel.toLowerCase()}`
                  : `Generate now: ${effectiveSelectedProductLabel.toLowerCase()}`
              }
            >
              {isGeneratingCard ? (
                <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden="true" />
              ) : (
                <Sparkles className="size-4 shrink-0" aria-hidden="true" />
              )}
              <span className="truncate">{isGeneratingCard ? "Generating" : "Generate now"}</span>
            </button>
          </div>
        ) : null}
        {error ? <p className="mt-3 text-sm font-medium text-red-600">{error}</p> : null}
      </div>
    </div>
  );

  return (
    <div
      className="flex h-full min-h-0 w-full overflow-hidden bg-transparent text-[#161129]"
      style={{ height: "var(--envitefy-chat-layout-height, 100dvh)" }}
    >
      <main
        ref={mainRef}
        className="relative flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
      >
        <div className="relative z-10 flex min-h-0 flex-1 flex-col">
          <section className="flex min-h-0 flex-1 flex-col">
            <div className="grid h-full min-h-0 md:grid-cols-1">
              <div
                ref={chatPaneRef}
                className={cn(
                  "min-h-0 w-full flex-col overflow-hidden",
                  isEmptyState ? "bg-transparent" : "bg-white/28 backdrop-blur-sm",
                  "flex md:border-r-0",
                )}
              >
                <div
                  className={cn(
                    "min-h-0 flex-1 overflow-y-auto [overscroll-behavior-y:contain] [touch-action:pan-y] [-webkit-overflow-scrolling:touch]",
                    isEmptyState && "max-md:overflow-y-auto",
                  )}
                >
                  {isEmptyState ? (
                    <div className="mx-auto flex min-h-full w-full max-w-[90rem] flex-col justify-start px-4 pb-3 pt-[calc(max(0.35rem,env(safe-area-inset-top))+1.5rem)] text-center sm:px-6 sm:pt-[calc(max(0.35rem,env(safe-area-inset-top))+2.75rem)] lg:pt-12 max-md:min-h-full max-md:overflow-visible max-md:px-3 max-md:pb-1 max-md:pt-[calc(max(0.35rem,env(safe-area-inset-top))+0.7rem)] max-h-[700px]:max-md:pt-[calc(max(0.35rem,env(safe-area-inset-top))+0.45rem)]">
                      <motion.h1
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mx-auto max-w-3xl text-2xl font-medium leading-tight tracking-normal text-[#2d1b36] sm:text-4xl lg:text-5xl max-h-[700px]:max-md:text-[1.45rem]"
                      >
                        What are we celebrating?
                      </motion.h1>
                      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#6f608c] sm:mt-3 sm:text-base max-md:mt-1.5 max-md:text-xs max-md:leading-5 max-h-[620px]:max-md:hidden">
                        Choose a category, pick a product, or describe the event in your own words.
                      </p>
                      <nav
                        className="mx-auto mt-6 grid w-full max-w-[39rem] flex-1 grid-cols-2 content-center justify-items-center gap-8 text-center sm:mt-8 sm:gap-12 md:grid-cols-3 max-md:mt-2.5 max-md:gap-[clamp(0.7rem,1.8dvh,1.1rem)] max-h-[700px]:max-md:mt-1.5"
                        aria-label="Choose celebration category"
                      >
                        {CELEBRATION_STARTER_TILES.map((tile) => {
                          const Icon = tile.icon;
                          const isUploadTile = "action" in tile && tile.action === "upload";
                          const isSelected =
                            selectedStarterCategory?.label === tile.label ||
                            Boolean(isUploadTile && pendingChatUpload);
                          return (
                            <button
                              key={tile.label}
                              type="button"
                              onClick={() => handleStarterPrompt(tile)}
                              disabled={isBusy}
                              aria-label={
                                isUploadTile && pendingChatUpload
                                  ? "Choose Upload, 1 upload selected"
                                  : `Choose ${tile.label}`
                              }
                              aria-pressed={isSelected}
                              className={cn(
                                "group relative flex h-28 w-28 flex-col items-center justify-center rounded-3xl border border-white/70 bg-white/58 backdrop-blur-xl transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a98dff] focus-visible:ring-offset-4 focus-visible:ring-offset-transparent disabled:cursor-not-allowed disabled:opacity-55 sm:h-40 sm:w-40 sm:rounded-[2.5rem] max-md:h-[clamp(5.65rem,16dvh,7.5rem)] max-md:w-[clamp(5.65rem,16dvh,7.5rem)]",
                                isSelected &&
                                  cn(
                                    "scale-95 shadow-[inset_0_0_0_999px_rgba(255,255,255,0.18),0_16px_38px_rgba(92,91,229,0.12)]",
                                    tile.color,
                                  ),
                                !isSelected &&
                                  "text-[#807a96] shadow-[0_16px_38px_rgba(92,91,229,0.1)] hover:bg-white/72 hover:text-[#5c5be5] active:scale-95",
                              )}
                            >
                              {isSelected && !(isUploadTile && pendingChatUpload) ? (
                                <span className="absolute right-3 top-3 opacity-40 sm:right-4 sm:top-4">
                                  <X size={14} aria-hidden="true" />
                                </span>
                              ) : null}
                              {isUploadTile && pendingChatUpload ? (
                                <span
                                  className="absolute right-3 top-3 inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-[#5c5be5] px-2 text-[11px] font-black leading-none text-white shadow-[0_10px_20px_rgba(92,91,229,0.24)] sm:right-4 sm:top-4"
                                  aria-hidden="true"
                                >
                                  +1
                                </span>
                              ) : null}
                              <Icon
                                className={cn(
                                  "h-8 w-8 transition-transform duration-300 sm:h-10 sm:w-10 max-h-[620px]:max-md:h-7 max-h-[620px]:max-md:w-7",
                                  isSelected ? "scale-110" : "group-hover:scale-105",
                                )}
                              />
                              <span className="relative mt-2 flex max-w-[6.75rem] justify-center sm:mt-4 sm:max-w-[8.5rem] max-h-[620px]:max-md:mt-1.5">
                                <span
                                  className={cn(
                                    "text-center text-[10px] font-bold uppercase leading-[1.35] tracking-widest transition-colors sm:text-xs",
                                    isSelected ? "text-current" : "text-[#9a9daa]",
                                  )}
                                >
                                  {tile.label}
                                </span>
                                {isSelected ? (
                                  <motion.span
                                    layoutId="chatStarterActiveUnderline"
                                    className="absolute -bottom-1 left-0 right-0 h-[2px] rounded-full bg-current"
                                    initial={{ opacity: 0, scaleX: 0 }}
                                    animate={{ opacity: 1, scaleX: 1 }}
                                    transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                                  />
                                ) : null}
                              </span>
                            </button>
                          );
                        })}
                      </nav>
                    </div>
                  ) : (
                    chatThread
                  )}
                </div>
                {shouldShowGiftRegistryActions || shouldShowReceivedInviteActions ? (
                  readyActions
                ) : (
                  <>
                    {shouldShowReadyActions ? readyActions : null}
                    {composer}
                  </>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
