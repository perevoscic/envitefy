"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUp,
  Calendar,
  Camera,
  ExternalLink,
  Info,
  Loader2,
  MapPin,
  Mic,
  MoreVertical,
  PanelTopDashed,
  Paperclip,
  RefreshCw,
  Share2,
  Sparkles,
  Upload,
  Users,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import {
  type ComponentType,
  type FormEvent,
  type SVGProps,
  useEffect,
  useRef,
  useState,
} from "react";
import type { StudioCategoryTileDefinition } from "@/app/studio/studio-workspace-types";
import { STUDIO_CATEGORY_TILES } from "@/app/studio/workspace/studio-category-tile-data";
import {
  cn,
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/ui/ai-prompt-box";
import type {
  ConciergeActiveContext,
  ConciergeEventDraft,
  ConciergeEventMessageResponse,
  ConciergeMessageResponse,
  ConciergeOcrContext,
  CreationSessionResumeResponse,
  RequestedOutput,
} from "@/lib/concierge/types";
import { getUploadAcceptAttribute } from "@/lib/upload-config";
import { validateClientUploadFile } from "@/utils/media-upload-client";

type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  text: string;
  type?: "text" | "upload_status";
};

type ProductIcon = ComponentType<SVGProps<SVGSVGElement>>;

type ProductOption = {
  label: string;
  description: string;
  output: RequestedOutput;
  icon: ProductIcon;
  iconClassName: string;
  activeClassName: string;
  choiceClassName: string;
  choiceIconClassName: string;
};

function PartyFlyerIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 318.601 318.6" fill="currentColor" {...props}>
      <path d="M45.296 318.6h228.007V0H45.296v318.6Zm172.062-57.559H101.255V248.97h116.103v12.071Zm15.525-25.192H85.73v-12.076h147.152v12.076ZM101.255 212.44v-12.07h116.103v12.07H101.255ZM57.38 12.15h203.853v121.5L57.38 182.25V12.15Zm38.064 93.459c-2.413-1.258-5.297-1.475-8.644-.654l-14.518 3.552 8.279 33.806 7.014-1.717-2.975-12.155 7.043-1.725c3.67-.901 6.296-2.418 7.873-4.551 1.572-2.139 1.872-5.2.896-9.191-.894-3.656-2.548-6.108-4.968-7.365ZM93 118.924c-.699 1.03-1.854 1.745-3.462 2.138l-6.368 1.562-2.434-9.951 6.365-1.566c1.608-.396 2.958-.329 4.034.203 1.081.53 1.83 1.674 2.262 3.436.433 1.76.299 3.152-.397 4.178Zm16.653-19.57-3.792 36.764 7.388-1.809.588-7.512 12.453-3.051 3.929 6.404 7.665-1.875L117.646 97.4l-7.993 1.954Zm4.68 21.146 1.128-14.375 7.528 12.258-8.656 2.117Zm53.57-2.52c-.253-.52-.569-1.55-.949-3.096l-.563-2.268c-.575-2.37-1.34-4.05-2.268-5.049-.929-.994-2.252-1.614-3.964-1.856 1.706-1.097 2.774-2.523 3.207-4.277.432-1.75.448-3.43.055-5.034-.324-1.329-.822-2.462-1.497-3.401-.67-.941-1.469-1.745-2.397-2.431-1.117-.825-2.37-1.355-3.741-1.587s-3.225-.087-5.547.438l-16.166 3.957 8.276 33.803 6.903-1.682-3.246-13.258 6.9-1.69c1.967-.483 3.396-.448 4.287.092.891.543 1.622 1.888 2.178 4.037l.815 3.132c.258.989.593 1.938 1.01 2.84.205.438.506 1.005.901 1.703l7.789-1.911-.2-.849c-.797-.287-1.382-.828-1.784-1.653Zm-12.405-14.586c-.67.551-1.753 1.015-3.262 1.381l-7.602 1.864-2.226-9.083 7.797-1.912c1.453-.355 2.592-.422 3.412-.205 1.463.39 2.447 1.605 2.95 3.657.465 1.901.11 3.33-1.069 4.298Zm38.356-18.317-10.114 2.479 6.818 27.822-7.108 1.738-6.824-27.816-10.156 2.484-1.467-5.983 27.391-6.708 1.46 5.984ZM223.808 71.4l-6.128 23.899 3.096 12.674-7.066 1.727-3.101-12.675-16.875-18.262 8.332-2.041 10.626 13.004 3.105-16.369 8.011-1.957Zm19.29 24.094 1.619 6.631-6.855 1.68-1.624-6.632 6.86-1.679Zm-5.78-1.49-5.765-15.298-2.099-8.572 7.178-1.754 2.104 8.569 2.004 16.216-3.422.839Zm-49.66-53.298H72.278v-8.517h115.38v8.517Z" />
    </svg>
  );
}

function LandingPageIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <line x1="3" y1="11" x2="29" y2="11" />
      <line x1="7" y1="8" x2="7" y2="8" />
      <line x1="10" y1="8" x2="10" y2="8" />
      <line x1="13" y1="8" x2="13" y2="8" />
      <rect x="3" y="5" width="26" height="22" />
      <rect x="6" y="14" width="10" height="10" />
      <rect x="19" y="21" width="7" height="3" />
      <line x1="20" y1="15" x2="26" y2="15" />
      <line x1="23" y1="18" x2="26" y2="18" />
      <polyline points="6,22 12,19 16,22" />
      <line x1="9" y1="17" x2="9" y2="17" />
    </svg>
  );
}

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

const PRODUCT_OPTIONS: ProductOption[] = [
  {
    label: "Live Card",
    description: "Public card with RSVP",
    output: "live_card",
    icon: PanelTopDashed,
    iconClassName: "rotate-180",
    activeClassName: "border-[#a11cf5] bg-[#a11cf5]/15 text-[#d8b4fe]",
    choiceClassName:
      "border-[#d9cff8] bg-[linear-gradient(135deg,#ffffff,#f7f2ff)] text-[#2f2147] shadow-[0_14px_30px_rgba(93,63,155,0.12)] hover:border-[#a11cf5]/45 hover:shadow-[0_18px_38px_rgba(93,63,155,0.18)]",
    choiceIconClassName: "border-[#a11cf5]/20 bg-[#a11cf5]/10 text-[#8b5cf6]",
  },
  {
    label: "Flyer / Invite",
    description: "Shareable invite graphic",
    output: "digital_flyer",
    icon: PartyFlyerIcon,
    iconClassName: "",
    activeClassName: "border-[#db246f] bg-[#db246f]/15 text-[#f9a8d4]",
    choiceClassName:
      "border-[#efd0dd] bg-[linear-gradient(135deg,#ffffff,#fff3f7)] text-[#3d2230] shadow-[0_14px_30px_rgba(178,59,104,0.11)] hover:border-[#db246f]/45 hover:shadow-[0_18px_38px_rgba(178,59,104,0.16)]",
    choiceIconClassName: "border-[#db246f]/20 bg-[#db246f]/10 text-[#db246f]",
  },
  {
    label: "Event Page",
    description: "Full public website",
    output: "event_page",
    icon: LandingPageIcon,
    iconClassName: "",
    activeClassName: "border-[#19a992] bg-[#19a992]/15 text-[#5eead4]",
    choiceClassName:
      "border-[#c7e8e2] bg-[linear-gradient(135deg,#ffffff,#effdfa)] text-[#153d39] shadow-[0_14px_30px_rgba(24,132,116,0.1)] hover:border-[#19a992]/45 hover:shadow-[0_18px_38px_rgba(24,132,116,0.15)]",
    choiceIconClassName: "border-[#19a992]/20 bg-[#19a992]/10 text-[#19a992]",
  },
];

const FAST_UPLOAD_OCR_URL = "/api/ocr?fast=1&turbo=1&timing=1";
const DEFAULT_UPLOAD_OCR_URL = "/api/ocr?fast=0";
const ENABLE_FAST_UPLOAD_OCR = process.env.NEXT_PUBLIC_CONCIERGE_FAST_UPLOADS === "1";

const BUILDING_STEPS = [
  "Checking the event details",
  "Generating the product",
  "Creating RSVP and sharing links",
  "Finalizing the event workspace",
];

const PRODUCT_CHOICE_PROMPT = "What kind of product would you like to create?";

const OUTPUT_LABELS: Record<RequestedOutput, string> = {
  event_page: "Event page",
  live_card: "Live card",
  digital_flyer: "Digital flyer",
  invitation: "Invitation",
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

type ChatStudioCategoryTileKey = Exclude<StudioCategoryTileDefinition["name"], "Anniversary">;

type ChatStudioGridTileKey = ChatStudioCategoryTileKey | "upload";

type ChatStudioGridItem =
  | {
      kind: "category";
      key: ChatStudioCategoryTileKey;
      category: StudioCategoryTileDefinition;
    }
  | {
      kind: "upload";
      key: "upload";
    };

const CHAT_STUDIO_GRID_COMPOSITION: ChatStudioGridTileKey[] = [
  "Birthday",
  "upload",
  "Wedding",
  "Bridal Shower",
  "Baby Shower",
  "Game Day",
  "Field Trip/Day",
  "Open House",
  "Housewarming",
  "Custom Invite",
];

const CHAT_STUDIO_GRID_PLACEMENT_CLASS: Record<ChatStudioGridTileKey, string> = {
  Birthday: "col-span-2 col-start-1 row-start-1 sm:col-span-2 sm:col-start-1 sm:row-start-1",
  upload: "hidden sm:block sm:col-start-3 sm:row-start-1",
  Wedding: "col-start-1 row-start-3 sm:col-start-6 sm:row-span-2 sm:row-start-1",
  "Bridal Shower": "col-start-2 row-start-3 sm:col-start-4 sm:row-start-1",
  "Baby Shower": "col-start-1 row-start-4 sm:col-start-5 sm:row-start-1",
  "Game Day": "col-start-1 row-start-2",
  "Field Trip/Day": "col-start-2 row-start-2",
  "Open House": "col-start-2 row-start-4 sm:col-start-3 sm:row-start-2",
  Housewarming: "col-start-1 row-start-5 sm:col-start-4 sm:row-start-2",
  "Custom Invite": "col-start-2 row-start-5 sm:col-start-5 sm:row-start-2",
};

const CHAT_STUDIO_GRID_ITEMS: ChatStudioGridItem[] = (() => {
  const categoriesByName = new Map(
    STUDIO_CATEGORY_TILES.map((category) => [category.name, category] as const),
  );
  const items: ChatStudioGridItem[] = [];
  for (const tileKey of CHAT_STUDIO_GRID_COMPOSITION) {
    if (tileKey === "upload") {
      items.push({ kind: "upload", key: "upload" });
      continue;
    }
    const category = categoriesByName.get(tileKey);
    if (category) items.push({ kind: "category", key: tileKey, category });
  }
  return items;
})();

const CHAT_STUDIO_TILE_OVERLAY_CLASS = {
  light: "bg-gradient-to-t from-black/58 via-black/18 to-transparent",
  medium: "bg-gradient-to-t from-black/68 via-black/28 to-transparent",
  dark: "bg-gradient-to-t from-black/78 via-black/42 to-black/12",
} as const;

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

function ChatStudioCategoryTile({
  category,
  index,
  isSelected,
  onSelect,
}: {
  category: StudioCategoryTileDefinition;
  index: number;
  isSelected: boolean;
  onSelect: (label: string) => void;
}) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.06 + index * 0.025 }}
      whileHover={{ scale: 1.012 }}
      whileTap={{ scale: 0.99 }}
      onClick={() => void onSelect(category.name)}
      aria-label={`Start with ${category.name}`}
      className={`group relative isolate h-full w-full overflow-hidden rounded-[1.1rem] border bg-white/80 text-left shadow-[0_14px_34px_-24px_rgba(84,61,140,0.28)] transition focus:outline-none focus-visible:ring-4 focus-visible:ring-[#cbb7ff]/55 sm:rounded-[1.35rem] ${
        isSelected ? "border-[#c7b7ff] ring-4 ring-[#d6caff]/70" : "border-white/60"
      } ${category.surfaceVariant === "dark" ? "bg-[#20192d]" : ""}`}
    >
      <img
        src={category.imagePath}
        alt=""
        aria-hidden="true"
        className={`absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 ${
          category.imagePositionClassName || "object-center"
        }`}
      />
      <div
        className={`absolute inset-0 ${CHAT_STUDIO_TILE_OVERLAY_CLASS[category.overlayStrength]}`}
      />
      <div className="absolute inset-x-0 bottom-0 p-2.5 text-left sm:p-3">
        <p className="font-[var(--font-josefin-sans)] text-[0.56rem] font-bold uppercase leading-tight tracking-[0.09em] text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.34)] sm:text-[0.68rem] md:text-[0.76rem]">
          {category.name}
        </p>
        <p className="mt-0.5 hidden truncate text-[0.62rem] leading-tight text-white/82 sm:block md:text-[0.68rem]">
          {category.description}
        </p>
      </div>
    </motion.button>
  );
}

function ChatStudioUploadTile({
  index,
  isUploading,
  onUpload,
}: {
  index: number;
  isUploading: boolean;
  onUpload: () => void;
}) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.06 + index * 0.025 }}
      whileHover={{ scale: 1.012 }}
      whileTap={{ scale: 0.99 }}
      onClick={onUpload}
      disabled={isUploading}
      aria-label={isUploading ? "Uploading invite" : "Upload your invite"}
      className="group relative isolate h-full w-full overflow-hidden rounded-[1.1rem] border border-white/50 bg-[#1d1330] text-left shadow-[0_14px_34px_-24px_rgba(84,61,140,0.28)] transition focus:outline-none focus-visible:ring-4 focus-visible:ring-[#cbb7ff]/55 disabled:cursor-not-allowed disabled:opacity-80 sm:rounded-[1.35rem]"
    >
      <img
        src="/studio/upload-your-own.webp"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(24,14,42,0.08),rgba(22,14,38,0.3)_34%,rgba(18,12,32,0.62))]" />
      <div className="absolute inset-x-0 bottom-0 p-2.5 text-left sm:p-3">
        <p className="font-[var(--font-josefin-sans)] text-[0.56rem] font-bold uppercase leading-tight tracking-[0.09em] text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.34)] sm:text-[0.68rem] md:text-[0.76rem]">
          {isUploading ? "Uploading" : "Upload Your Invite"}
        </p>
        <p className="mt-0.5 hidden truncate text-[0.62rem] leading-tight text-white/82 sm:block md:text-[0.68rem]">
          Turn an existing invite into a live card
        </p>
      </div>
    </motion.button>
  );
}

function ChatStudioStarterGrid({
  selectedCategory,
  onSelectCategory,
  onUploadInvite,
  isUploading,
}: {
  selectedCategory: string | null;
  onSelectCategory: (label: string) => void;
  onUploadInvite: () => void;
  isUploading: boolean;
}) {
  return (
    <div className="grid auto-rows-[118px] grid-cols-2 gap-2.5 sm:auto-rows-[135px] sm:grid-cols-6 md:auto-rows-[155px]">
      {CHAT_STUDIO_GRID_ITEMS.map((item, index) => (
        <div key={item.key} className={CHAT_STUDIO_GRID_PLACEMENT_CLASS[item.key]}>
          {item.kind === "upload" ? (
            <ChatStudioUploadTile
              index={index}
              isUploading={isUploading}
              onUpload={onUploadInvite}
            />
          ) : (
            <ChatStudioCategoryTile
              category={item.category}
              index={index}
              isSelected={item.category.name === selectedCategory}
              onSelect={onSelectCategory}
            />
          )}
        </div>
      ))}
    </div>
  );
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

function normalizeOcrContext(payload: any): ConciergeOcrContext {
  return {
    ocrText: typeof payload?.ocrText === "string" ? payload.ocrText : null,
    fieldsGuess:
      payload?.fieldsGuess && typeof payload.fieldsGuess === "object" ? payload.fieldsGuess : null,
    category: typeof payload?.category === "string" ? payload.category : null,
    birthdayTemplateHint: payload?.birthdayTemplateHint || null,
    ocrSkin: payload?.ocrSkin && typeof payload.ocrSkin === "object" ? payload.ocrSkin : null,
    metadata: {
      thumbnailFocus: payload?.thumbnailFocus || null,
      openHouse: payload?.openHouse || null,
    },
  };
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

function productLabel(output: RequestedOutput | null | undefined) {
  return (
    PRODUCT_OPTIONS.find((option) => option.output === output)?.label ||
    outputLabel(output || "live_card")
  );
}

function categoryLabelFromDraft(draft: ConciergeEventDraft | null, fallback: string | null) {
  if (fallback) return fallback;
  if (draft?.eventType === "birthday") return "Birthday";
  if (draft?.eventType === "wedding") return "Wedding";
  if (draft?.eventType === "baby_shower") return "Baby Shower";
  if (draft?.eventType === "graduation") return "Graduation";
  if (draft?.eventType && draft.eventType !== "unknown") return "Custom Invite";
  return "Celebration";
}

function previewImageForDraft(draft: ConciergeEventDraft | null, fallbackCategory: string | null) {
  const categoryLabel = categoryLabelFromDraft(draft, fallbackCategory);
  return (
    STUDIO_CATEGORY_TILES.find((category) => category.name === categoryLabel)?.imagePath ||
    "/studio/upload-your-own.webp"
  );
}

function guestLineFromDraft(draft: ConciergeEventDraft | null) {
  const record = recordValue(draft);
  return (
    firstStringValue(record.guestCount, record.numberOfGuests, record.inviteCount) ||
    "Guest list coming soon"
  );
}

function draftOutputLabels(draft: ConciergeEventDraft | null, selectedOutput: RequestedOutput) {
  const outputs = draft?.requestedOutputs?.length ? draft.requestedOutputs : [selectedOutput];
  return Array.from(new Set(outputs)).map(outputLabel);
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

export default function ConciergeChatClient() {
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const mainRef = useRef<HTMLElement | null>(null);
  const chatPaneRef = useRef<HTMLDivElement | null>(null);
  const composerCardRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [input, setInput] = useState("");
  const [selectedProductOutput, setSelectedProductOutput] = useState<RequestedOutput | null>(null);
  const [starterCategory, setStarterCategory] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    newMessage("assistant", "What are we celebrating?"),
  ]);
  const [phase, setPhase] = useState<ConciergePhase>("intake_empty");
  const [draft, setDraft] = useState<ConciergeEventDraft | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [buildProgress, setBuildProgress] = useState(0);
  const [liveCardEventId, setLiveCardEventId] = useState<string | null>(null);
  const [liveCardTitle, setLiveCardTitle] = useState<string | null>(null);
  const [liveCardSummary, setLiveCardSummary] = useState<LiveCardSummary | null>(null);
  const [lastGeneratedAt, setLastGeneratedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [mobileView, setMobileView] = useState<"chat" | "preview">("chat");
  const [previewTab, setPreviewTab] = useState<"preview" | "rsvp">("preview");
  const [composerCenterLeft, setComposerCenterLeft] = useState("50vw");
  const [composerBottomPadding, setComposerBottomPadding] = useState(224);

  const isGeneratingCard = phase === "generating_card";
  const isEditingGeneratedCard = phase === "editing_card";
  const isEmptyState =
    phase === "intake_empty" &&
    messages.length === 1 &&
    messages[0]?.role === "assistant" &&
    !draft &&
    !isSending &&
    !isUploading;
  const shouldShowProductChoice =
    Boolean(starterCategory) && !selectedProductOutput && !draft && !isSending && !isUploading;
  const visibleMessages = messages.filter(
    (message, index) =>
      !(index === 0 && message.role === "assistant" && message.text === "What are we celebrating?"),
  );
  const isBusy = isSending || isUploading || isGeneratingCard;
  const busyLabel = isUploading
    ? "Reading upload"
    : isEditingGeneratedCard
      ? "Updating workspace"
      : isGeneratingCard
        ? "Generating product"
        : "Envitefy is thinking...";
  const isThinking = busyLabel === "Envitefy is thinking...";
  const currentBuildStep = Math.min(
    Math.floor((buildProgress / 100) * BUILDING_STEPS.length),
    BUILDING_STEPS.length - 1,
  );
  const effectiveSelectedProductOutput = selectedProductOutput || "live_card";
  const currentLiveCardSummary =
    liveCardSummary || liveCardSummaryFromDraft(draft, effectiveSelectedProductOutput);
  const workspaceTitle = liveCardTitle || currentLiveCardSummary.headline;
  const detailsComplete = isReadyProductDraft(draft);
  const canGenerateProduct = Boolean(draft?.canPersist) && !isBusy && !liveCardEventId;
  const shouldShowWorkspacePanel =
    Boolean(draft) ||
    phase === "ready_to_generate" ||
    phase === "generating_card" ||
    phase === "card_ready" ||
    phase === "editing_card" ||
    Boolean(liveCardEventId);
  const liveCardPublicHref = liveCardEventId ? `/event/${liveCardEventId}` : null;
  const liveCardWorkspaceHref = liveCardEventId ? `/events/${liveCardEventId}/workspace` : null;
  const threadId = searchParams.get("thread")?.trim() || null;
  const selectedProductLabel = productLabel(effectiveSelectedProductOutput);
  const currentCategoryLabel = categoryLabelFromDraft(draft, starterCategory);
  const currentPreviewImage = previewImageForDraft(draft, starterCategory);

  function selectProductOutputForDraft(nextDraft: ConciergeEventDraft) {
    const restoredOutput = nextDraft.requestedOutputs.find((output) =>
      PRODUCT_OPTIONS.some((option) => option.output === output),
    );
    if (restoredOutput) setSelectedProductOutput(restoredOutput);
  }

  function resetConversation() {
    setInput("");
    setError(null);
    setDraft(null);
    setPhase("intake_empty");
    setLiveCardEventId(null);
    setLiveCardTitle(null);
    setLiveCardSummary(null);
    setLastGeneratedAt(null);
    setBuildProgress(0);
    setSelectedProductOutput(null);
    setStarterCategory(null);
    setMobileView("chat");
    setPreviewTab("preview");
    setMessages([newMessage("assistant", "What are we celebrating?")]);
  }

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
          restoredDraft.requestedOutputs.find((output) =>
            PRODUCT_OPTIONS.some((option) => option.output === output),
          ) || effectiveSelectedProductOutput;
        setDraft(restoredDraft);
        setSelectedProductOutput(restoredOutput);
        setStarterCategory(null);
        setLiveCardEventId(savedEventId);
        setLiveCardTitle(savedEventId ? draftHeadline(restoredDraft) : null);
        setLiveCardSummary(liveCardSummaryFromDraft(restoredDraft, restoredOutput));
        setLastGeneratedAt(json.creationSession?.updated_at || null);
        setBuildProgress(savedEventId ? 100 : 0);
        setMobileView(savedEventId ? "preview" : "chat");
        setPreviewTab("preview");
        setPhase(
          savedEventId
            ? "card_ready"
            : isReadyProductDraft(restoredDraft)
              ? "ready_to_generate"
              : "collecting_details",
        );
        setMessages([
          newMessage(
            "assistant",
            savedEventId
              ? "Thread opened. Your generated workspace is ready to refine."
              : "Thread opened. We can keep collecting the details from here.",
          ),
        ]);
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
    function updateComposerCenter() {
      const target = shouldShowWorkspacePanel
        ? chatPaneRef.current || mainRef.current
        : mainRef.current;
      const rect = target?.getBoundingClientRect();
      if (!rect) {
        setComposerCenterLeft("50vw");
        return;
      }
      setComposerCenterLeft(`${rect.left + rect.width / 2}px`);
    }

    updateComposerCenter();
    const frame = window.requestAnimationFrame(updateComposerCenter);
    const timeout = window.setTimeout(updateComposerCenter, 260);
    window.addEventListener("resize", updateComposerCenter);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
      window.removeEventListener("resize", updateComposerCenter);
    };
  }, [shouldShowWorkspacePanel]);

  useEffect(() => {
    const composer = composerCardRef.current;
    if (!composer || typeof ResizeObserver === "undefined") return;
    const updatePadding = () => {
      setComposerBottomPadding(Math.ceil(composer.getBoundingClientRect().height + 28));
    };
    updatePadding();
    const observer = new ResizeObserver(updatePadding);
    observer.observe(composer);
    return () => observer.disconnect();
  }, []);

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

  async function generateProductForDraft(draftToGenerate: ConciergeEventDraft) {
    if (!draftToGenerate.canPersist) {
      setError("Add an event or source before generating the workspace.");
      return;
    }
    setError(null);
    setPhase("generating_card");
    setBuildProgress(8);
    try {
      const response = await fetch("/api/creation/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          message: "",
          action: "save",
          draft: draftToGenerate,
          persistSession: true,
        }),
      });
      const json = (await response.json().catch(() => null)) as ConciergeMessageResponse | null;
      if (!response.ok || !json?.ok) {
        throw new Error(json && !json.ok ? json.error : "Unable to generate product.");
      }
      const savedEventId = json.savedEventId;
      if (!savedEventId) throw new Error("Product was generated without an event id.");
      setBuildProgress(100);
      setDraft(json.draft);
      setLiveCardEventId(savedEventId);
      setLiveCardTitle(draftHeadline(json.draft || draftToGenerate));
      setLiveCardSummary(
        liveCardSummaryFromDraft(json.draft || draftToGenerate, effectiveSelectedProductOutput),
      );
      setLastGeneratedAt(new Date().toISOString());
      setPhase("card_ready");
      setMobileView("preview");
      setPreviewTab("preview");
      setMessages((prev) => [
        ...prev,
        newMessage(
          "assistant",
          "Your product is generated. You can review it in the workspace or tell me what to change.",
        ),
      ]);
      notifyCreationThreadsChanged();
    } catch (err) {
      setBuildProgress(0);
      setPhase(draftToGenerate.canPersist ? "ready_to_generate" : "collecting_details");
      setError(err instanceof Error ? err.message : "Unable to generate product.");
    }
  }

  async function sendGeneratedCardEdit(message: string) {
    const trimmed = message.trim();
    if (!trimmed || !liveCardEventId) return;

    setError(null);
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
        throw new Error(json && !json.ok ? json.error : "Workspace update failed.");
      }
      const fallbackSummary =
        liveCardSummary || liveCardSummaryFromDraft(draft, effectiveSelectedProductOutput);
      setLiveCardTitle(json.event.title || liveCardTitle || draftHeadline(draft));
      setLiveCardSummary(liveCardSummaryFromEvent(json.event, fallbackSummary));
      setLastGeneratedAt(new Date().toISOString());
      setPhase("card_ready");
      setMessages((prev) => [...prev, newMessage("assistant", json.assistantMessage)]);
    } catch (err) {
      setPhase("card_ready");
      setError(err instanceof Error ? err.message : "Workspace update failed.");
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
    echo?: string;
  }) {
    const message = params.message.trim();
    if (!message && !params.ocrContext) return;

    setError(null);
    setIsSending(true);
    if (!liveCardEventId && phase !== "ready_to_generate") {
      setPhase("collecting_details");
    }
    if (params.echo || message) {
      setMessages((prev) => [...prev, newMessage("user", params.echo || message)]);
    }
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
      const response = await fetch("/api/creation/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          message,
          draft,
          ocrContext: params.ocrContext || null,
          activeContext,
          requestedOutputs: params.requestedOutputs || [effectiveSelectedProductOutput],
          action: params.action || "message",
        }),
      });
      const json = (await response.json().catch(() => null)) as ConciergeMessageResponse | null;
      if (!response.ok || !json?.ok) {
        throw new Error(json && !json.ok ? json.error : "Concierge request failed.");
      }
      setDraft(json.draft);
      selectProductOutputForDraft(json.draft);
      notifyCreationThreadsChanged();
      if (isReadyProductDraft(json.draft)) {
        setPhase("ready_to_generate");
        setMessages((prev) => [...prev, newMessage("assistant", json.assistantMessage)]);
        return;
      }
      setPhase("collecting_details");
      setMessages((prev) => [...prev, newMessage("assistant", json.assistantMessage)]);
    } catch (err) {
      setPhase(draft ? "collecting_details" : "intake_empty");
      setError(err instanceof Error ? err.message : "Concierge request failed.");
    } finally {
      setIsSending(false);
    }
  }

  async function submitComposerInput() {
    if (isBusy) return;
    const value = input.trim();
    if (!value) return;
    if (!draft && !selectedProductOutput) {
      setError(
        starterCategory
          ? "Choose Live card, Flyer / Invite, or Event page first."
          : "Choose a category first.",
      );
      return;
    }
    setInput("");
    if (liveCardEventId) {
      await sendGeneratedCardEdit(value);
      return;
    }
    await sendToConcierge({ message: value });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitComposerInput();
  }

  async function startStarterConversation(categoryLabel: string, productOutput: RequestedOutput) {
    setStarterCategory(categoryLabel);
    setSelectedProductOutput(productOutput);
    const productText =
      PRODUCT_OPTIONS.find((option) => option.output === productOutput)?.label ||
      outputLabel(productOutput);
    await sendToConcierge({
      message: categoryLabel === "Custom Invite" ? "Custom invite" : categoryLabel,
      action: "starter_category",
      requestedOutputs: [productOutput],
      echo: productText,
    });
  }

  async function handleStarterCategory(label: string) {
    if (isBusy) return;
    setStarterCategory(label);
    setSelectedProductOutput(null);
    setError(null);
    setMessages([
      newMessage("assistant", "What are we celebrating?"),
      newMessage("user", label),
      newMessage("assistant", PRODUCT_CHOICE_PROMPT),
    ]);
  }

  async function handleProductOption(option: ProductOption) {
    if (isBusy) return;
    if (!starterCategory) {
      setError("Choose a category first.");
      return;
    }
    await startStarterConversation(starterCategory, option.output);
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

  async function handleUpload(file: File | null | undefined) {
    if (!file) return;
    const validationError = validateClientUploadFile(file, "attachment");
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setIsUploading(true);
    setMessages((prev) => [
      ...prev,
      newMessage("user", `Uploaded ${file.name}`),
      newMessage("assistant", "Reading upload...", "upload_status"),
    ]);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("scanAttemptId", `concierge-${Date.now()}`);
      const response = await fetch(
        ENABLE_FAST_UPLOAD_OCR ? FAST_UPLOAD_OCR_URL : DEFAULT_UPLOAD_OCR_URL,
        {
          method: "POST",
          body: form,
          credentials: "include",
        },
      );
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || `Upload failed (${response.status})`);
      }
      setMessages((prev) => prev.filter((message) => message.type !== "upload_status"));
      await sendToConcierge({
        message: "Seed a draft from this upload.",
        action: "ocr_result",
        ocrContext: normalizeOcrContext(payload),
        echo: "Use this upload to start the event.",
      });
    } catch (err) {
      setMessages((prev) => prev.filter((message) => message.type !== "upload_status"));
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (cameraInputRef.current) cameraInputRef.current.value = "";
    }
  }

  const chatThread = (
    <div
      className="mx-auto flex min-h-full w-full max-w-3xl flex-col justify-end gap-5 px-4 pb-56 pt-8 sm:px-6 sm:pb-60"
      style={{ paddingBottom: composerBottomPadding }}
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
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
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
                {message.text}
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {shouldShowProductChoice ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-[94%] self-start sm:max-w-[88%]"
        >
          <div className="grid gap-2 sm:grid-cols-3">
            {PRODUCT_OPTIONS.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.output}
                  type="button"
                  onClick={() => void handleProductOption(option)}
                  disabled={isBusy}
                  aria-label={`Choose product: ${option.label}`}
                  className={cn(
                    "group inline-flex min-h-14 items-center gap-3 rounded-2xl border px-3.5 py-2.5 text-left transition duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-55",
                    option.choiceClassName,
                  )}
                >
                  <Icon
                    className={cn(
                      "size-8 shrink-0 rounded-xl border p-1.5 transition duration-200 group-hover:scale-105",
                      option.choiceIconClassName,
                      option.iconClassName,
                    )}
                    aria-hidden="true"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-bold leading-tight">{option.label}</span>
                    <span className="mt-0.5 block text-[0.68rem] font-semibold leading-tight text-current/62">
                      {option.description}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </motion.div>
      ) : null}

      {isBusy && !isGeneratingCard ? (
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
          <Loader2 className="size-4 animate-spin text-[#7c4dff]" aria-hidden="true" />
          {busyLabel}
        </motion.div>
      ) : null}
      <div ref={messagesEndRef} />
    </div>
  );

  const workspacePanel = (
    <aside
      className={`min-h-0 flex-col overflow-y-auto border-l border-[#e5dff0] bg-[#fbfbfe] ${
        mobileView === "preview" ? "flex" : "hidden md:flex"
      }`}
    >
      <div className="flex min-h-full flex-col px-4 pb-24 pt-4 sm:px-6 sm:pb-8">
        <div className="flex items-center justify-between border-b border-[#f0ebf7] pb-4">
          <div>
            <h2 className="flex items-center gap-2 text-base font-bold text-[#221a35]">
              <Sparkles className="size-4 text-[#7c4dff]" aria-hidden="true" />
              Workspace Preview
            </h2>
            {lastGeneratedAt ? (
              <p className="mt-1 text-[0.68rem] font-semibold text-[#9a90aa]">
                Updated{" "}
                {new Date(lastGeneratedAt).toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="grid size-9 place-items-center rounded-lg text-[#8b8298] transition hover:bg-[#f3eff8] hover:text-[#4b3d64]"
              aria-label="Share preview"
              title="Share preview"
            >
              <Share2 className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              className="grid size-9 place-items-center rounded-lg text-[#8b8298] transition hover:bg-[#f3eff8] hover:text-[#4b3d64]"
              aria-label="More preview actions"
              title="More preview actions"
            >
              <MoreVertical className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto py-5">
          {liveCardEventId ? (
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-[#f1edf7] p-1">
              <button
                type="button"
                onClick={() => setPreviewTab("preview")}
                className={`h-10 rounded-lg text-xs font-bold transition ${
                  previewTab === "preview"
                    ? "bg-white text-[#7c4dff] shadow-sm"
                    : "text-[#867a99] hover:text-[#4b3d64]"
                }`}
              >
                Invitation
              </button>
              <button
                type="button"
                onClick={() => setPreviewTab("rsvp")}
                className={`h-10 rounded-lg text-xs font-bold transition ${
                  previewTab === "rsvp"
                    ? "bg-white text-[#7c4dff] shadow-sm"
                    : "text-[#867a99] hover:text-[#4b3d64]"
                }`}
              >
                RSVP
              </button>
            </div>
          ) : null}

          {previewTab === "rsvp" && liveCardEventId ? (
            <div className="space-y-5">
              <div className="grid grid-cols-3 gap-3">
                {[
                  ["Attending", "0", "bg-[#edf9f1] text-[#197052] border-[#d7efd9]"],
                  ["Maybe", "0", "bg-[#fff8e8] text-[#966a16] border-[#f4dfab]"],
                  ["Declined", "0", "bg-[#fff0f3] text-[#b4234b] border-[#f2c9d3]"],
                ].map(([label, value, className]) => (
                  <div key={label} className={`rounded-2xl border p-4 ${className}`}>
                    <p className="text-[0.62rem] font-bold uppercase tracking-[0.12em]">{label}</p>
                    <p className="mt-1 text-2xl font-bold">{value}</p>
                  </div>
                ))}
              </div>

              <section className="overflow-hidden rounded-2xl border border-[#eee8f6] bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-[#f4eff8] bg-[#faf8fd] px-4 py-3">
                  <h3 className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[#8b8298]">
                    Guest List
                  </h3>
                  <span className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[#7c4dff]">
                    0 Total
                  </span>
                </div>
                <div className="px-4 py-12 text-center text-xs italic text-[#9a90aa]">
                  Responses will appear here once guests reply.
                </div>
              </section>

              <section className="rounded-2xl border border-dashed border-[#ddd3ea] bg-[#f5f2f9] p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Info className="size-3.5 text-[#8b8298]" aria-hidden="true" />
                  <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[#8b8298]">
                    RSVP Link
                  </p>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-[#eee8f6] bg-white p-2">
                  <p className="min-w-0 flex-1 truncate text-xs text-[#675b78]">
                    {liveCardPublicHref || "Generated link appears here"}
                  </p>
                  {liveCardPublicHref ? (
                    <a
                      href={liveCardPublicHref}
                      target="_blank"
                      rel="noreferrer"
                      className="grid size-8 place-items-center rounded-lg text-[#7c4dff] transition hover:bg-[#f6f1ff]"
                      aria-label="Open RSVP link"
                    >
                      <ExternalLink className="size-3.5" aria-hidden="true" />
                    </a>
                  ) : null}
                </div>
              </section>
            </div>
          ) : (
            <>
              <section className="rounded-[1.3rem] border border-[#eee8f6] bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-[0.12em] ${
                      liveCardEventId
                        ? "bg-[#e8f8ed] text-[#197052]"
                        : isGeneratingCard
                          ? "bg-[#f5f0ff] text-[#7c4dff]"
                          : detailsComplete
                            ? "bg-[#edf9f1] text-[#197052]"
                            : "bg-[#f5f0ff] text-[#7c4dff]"
                    }`}
                  >
                    {isGeneratingCard
                      ? "Generating"
                      : liveCardEventId
                        ? "Generated"
                        : detailsComplete
                          ? "Ready"
                          : "Drafting"}
                  </span>
                  <span className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[#9a90aa]">
                    {currentCategoryLabel}
                  </span>
                </div>

                <h3 className="mb-5 font-serif text-2xl font-bold italic text-[#221a35]">
                  {workspaceTitle}
                </h3>

                <div className="space-y-4">
                  <div
                    className={`flex items-center gap-3 ${
                      currentLiveCardSummary.scheduleLine === "Date TBD"
                        ? "text-[#b7afc3]"
                        : "text-[#62546f]"
                    }`}
                  >
                    <span className="grid size-9 place-items-center rounded-lg bg-[#fff3e8] text-[#e5751f]">
                      <Calendar className="size-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm">
                      {currentLiveCardSummary.scheduleLine}
                    </span>
                  </div>
                  <div
                    className={`flex items-center gap-3 ${
                      currentLiveCardSummary.locationLine === "Location TBD"
                        ? "text-[#b7afc3]"
                        : "text-[#62546f]"
                    }`}
                  >
                    <span className="grid size-9 place-items-center rounded-lg bg-[#eaf3ff] text-[#3477d2]">
                      <MapPin className="size-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm">
                      {currentLiveCardSummary.locationLine}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[#62546f]">
                    <span className="grid size-9 place-items-center rounded-lg bg-[#f3ecff] text-[#7c4dff]">
                      <Users className="size-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm">
                      {guestLineFromDraft(draft)}
                    </span>
                  </div>
                </div>
              </section>

              <section
                className={`relative overflow-hidden border border-[#eee8f6] bg-white p-6 text-center shadow-xl shadow-[#3f275f]/10 ${
                  effectiveSelectedProductOutput === "event_page"
                    ? "aspect-video rounded-[1.2rem]"
                    : "aspect-[4/5] rounded-[1.4rem]"
                }`}
              >
                {isGeneratingCard ? (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-white/76 text-[#8b8298] backdrop-blur-[2px]">
                    <Loader2 className="size-11 animate-spin text-[#7c4dff]" aria-hidden="true" />
                    <div className="w-full max-w-[18rem] px-4">
                      <p className="text-sm font-bold text-[#2d1b36]">
                        {BUILDING_STEPS[currentBuildStep]}
                      </p>
                      <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#eadfff]">
                        <motion.div
                          className="h-full bg-[#7c4dff]"
                          initial={{ width: "0%" }}
                          animate={{ width: `${buildProgress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ) : null}

                <img
                  src={currentPreviewImage}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 h-full w-full object-cover opacity-20 grayscale"
                />

                {effectiveSelectedProductOutput === "digital_flyer" ? (
                  <div className="relative z-10 flex h-full flex-col items-center justify-center">
                    <div className="mb-6 grid aspect-square w-full max-w-[13rem] place-items-center rounded-2xl border-2 border-dashed border-[#dfd6ea] bg-[#f8f5fb] shadow-inner">
                      <Upload className="size-8 text-[#b9b0c5]" aria-hidden="true" />
                    </div>
                    <h3 className="font-serif text-3xl font-bold italic text-[#221a35]">
                      {workspaceTitle}
                    </h3>
                    <p className="mt-3 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#7c4dff]">
                      {currentLiveCardSummary.scheduleLine}
                    </p>
                  </div>
                ) : effectiveSelectedProductOutput === "event_page" ? (
                  <div className="relative z-10 flex h-full flex-col text-left">
                    <div className="mb-8 flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="mb-1 text-[0.65rem] font-black uppercase tracking-[0.12em] text-[#7c4dff]">
                          Live Event Web
                        </p>
                        <h3 className="truncate font-serif text-3xl font-bold italic text-[#221a35]">
                          {workspaceTitle}
                        </h3>
                      </div>
                      <span className="shrink-0 rounded-full bg-[#221a35] px-4 py-2 text-[0.62rem] font-bold uppercase tracking-[0.12em] text-white">
                        RSVP
                      </span>
                    </div>
                    <div className="flex-1 border-t border-[#eee8f6] pt-5">
                      <p className="max-w-sm text-xs leading-6 text-[#675b78]">
                        {draft?.previewCopy.body ||
                          "A full public event experience for your guests."}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="relative z-10 flex h-full flex-col items-center justify-between py-4">
                    <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-[#7c4dff]">
                      Celebration Invitation
                    </p>
                    <div>
                      <h3 className="font-serif text-4xl font-bold italic text-[#221a35]">
                        {workspaceTitle}
                      </h3>
                      <div className="mx-auto my-7 h-px w-12 bg-[#ded2ff]" />
                      <p className="mx-auto max-w-[15rem] text-sm italic leading-6 text-[#675b78]">
                        {draft?.previewCopy.body ||
                          "Describe your event vision and see it come to life here."}
                      </p>
                    </div>
                    <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-[#9a90aa]">
                      {draft?.theme || selectedProductLabel}
                    </p>
                  </div>
                )}
              </section>

              <div className="space-y-3">
                {liveCardPublicHref ? (
                  <a
                    href={liveCardPublicHref}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#197052] px-5 text-sm font-bold text-white shadow-lg shadow-[#197052]/15 transition hover:bg-[#145f46]"
                  >
                    <ExternalLink className="size-4" aria-hidden="true" />
                    View product
                  </a>
                ) : null}
                {liveCardWorkspaceHref ? (
                  <a
                    href={liveCardWorkspaceHref}
                    className="inline-flex h-12 w-full items-center justify-center rounded-2xl border border-[#d8caff] bg-white px-5 text-sm font-bold text-[#5f5289] transition hover:bg-[#f7f3ff]"
                  >
                    Open workspace
                  </a>
                ) : null}
                {!liveCardEventId ? (
                  <button
                    type="button"
                    disabled={!canGenerateProduct}
                    onClick={() => {
                      if (draft) void generateProductForDraft(draft);
                    }}
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#7c4dff] px-5 text-sm font-bold text-white shadow-lg shadow-[#7c4dff]/20 transition hover:bg-[#6f43f0] disabled:cursor-not-allowed disabled:bg-[#d8caff] disabled:shadow-none"
                  >
                    <Sparkles className="size-4" aria-hidden="true" />
                    Generate workspace
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() =>
                      void sendGeneratedCardEdit(
                        "Regenerate the product with the latest event details.",
                      )
                    }
                    className="inline-flex h-10 w-full items-center justify-center gap-2 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#8b8298] transition hover:text-[#7c4dff] disabled:cursor-not-allowed disabled:opacity-55"
                  >
                    <RefreshCw className="size-3.5" aria-hidden="true" />
                    Regenerate version
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#f8f9fc] text-[#161129]">
      <main ref={mainRef} className="relative flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        <div className="relative z-10 flex min-h-0 flex-1 flex-col">
          <header className="flex h-14 shrink-0 items-center justify-between border-b border-[#eee8f6] bg-white px-4 md:hidden">
            {shouldShowWorkspacePanel ? (
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
            ) : (
              <span className="text-sm font-bold text-[#221a35]">Envitefy Chat</span>
            )}
            <span className="grid size-9 place-items-center rounded-lg bg-[#7c4dff] text-white">
              <Sparkles className="size-4" aria-hidden="true" />
            </span>
          </header>

          <section className="min-h-0 flex-1">
            <div
              className={`grid h-full min-h-0 ${
                shouldShowWorkspacePanel
                  ? "md:grid-cols-[minmax(0,1fr)_minmax(24rem,30rem)]"
                  : "md:grid-cols-1"
              }`}
            >
              <div
                ref={chatPaneRef}
                className={`min-h-0 w-full bg-white/48 backdrop-blur-sm md:flex md:flex-col md:overflow-hidden ${
                  shouldShowWorkspacePanel ? "md:border-r md:border-[#e5dff0]" : ""
                } ${
                  mobileView === "chat"
                    ? isEmptyState
                      ? "flex flex-col overflow-y-auto"
                      : "flex flex-col overflow-hidden"
                    : "hidden md:flex"
                } ${shouldShowWorkspacePanel ? "" : "md:border-r-0"}`}
              >
                {isEmptyState ? (
                  <div className="mx-auto flex min-h-full w-full max-w-[90rem] flex-col justify-end px-4 pb-56 pt-8 text-center sm:px-6 sm:pb-60">
                    <motion.h1
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mx-auto max-w-3xl text-5xl font-medium tracking-normal text-[#2d1b36] sm:text-6xl"
                    >
                      What are we celebrating?
                    </motion.h1>
                    <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[#6f608c] sm:text-base">
                      Choose a category and product to start, or upload an invite.
                    </p>
                    <div className="mt-6 w-full">
                      <ChatStudioStarterGrid
                        selectedCategory={starterCategory}
                        onSelectCategory={handleStarterCategory}
                        onUploadInvite={() => fileInputRef.current?.click()}
                        isUploading={isUploading}
                      />
                    </div>
                    <p className="mx-auto mt-5 text-sm font-medium text-[#8b7ca6]">
                      or just start chatting
                    </p>
                  </div>
                ) : (
                  chatThread
                )}
              </div>
              {shouldShowWorkspacePanel ? workspacePanel : null}
            </div>
          </section>

          <div
            className={`pointer-events-none fixed bottom-0 z-30 w-[calc(100vw-1rem)] -translate-x-1/2 flex-col items-stretch pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-10 sm:w-[calc(100vw-3rem)] sm:pb-8 ${
              shouldShowWorkspacePanel && mobileView === "preview" ? "hidden md:flex" : "flex"
            } max-w-3xl`}
            style={{ left: composerCenterLeft }}
          >
            <div ref={composerCardRef} className="pointer-events-auto w-full">
              <form onSubmit={handleSubmit}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={getUploadAcceptAttribute("attachment")}
                  className="hidden"
                  onChange={(event) => void handleUpload(event.currentTarget.files?.[0])}
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(event) => void handleUpload(event.currentTarget.files?.[0])}
                />
                <PromptInput
                  value={input}
                  onValueChange={setInput}
                  isLoading={isBusy}
                  onSubmit={() => void submitComposerInput()}
                  disabled={isBusy || shouldShowProductChoice}
                  className={cn(
                    "w-full border-[#d8caff] bg-[#fbf9ff] p-2 text-[#25183a] shadow-[0_18px_46px_rgba(93,63,155,0.18),inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-white/75 backdrop-blur transition-all duration-300",
                    isListening &&
                      "border-[#8b5cf6] shadow-[0_18px_46px_rgba(124,77,255,0.24),inset_0_1px_0_rgba(255,255,255,0.95)]",
                  )}
                >
                  <PromptInputTextarea
                    placeholder={
                      shouldShowProductChoice
                        ? "Choose a product above..."
                        : liveCardEventId
                          ? "Refine workspace..."
                          : "Describe your event..."
                    }
                    aria-label={
                      shouldShowProductChoice
                        ? "Choose a product"
                        : liveCardEventId
                          ? "Refine workspace"
                          : "Describe your event"
                    }
                    className="min-h-[44px] px-3 py-2.5 text-base !text-[#25183a] caret-[#7c4dff] selection:bg-[#d8caff] selection:text-[#25183a] !placeholder:text-[#8b7ca6]"
                  />
                  <PromptInputActions className="justify-between gap-2 pt-2">
                    <div className="flex min-w-0 items-center gap-1">
                      <PromptInputAction tooltip="Upload file">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#76648f] transition hover:bg-[#f1ebff] hover:text-[#7c4dff]"
                          aria-label="Upload file"
                        >
                          <Paperclip className="size-6" aria-hidden="true" />
                        </button>
                      </PromptInputAction>

                      <PromptInputAction tooltip="Use camera">
                        <button
                          type="button"
                          onClick={() => cameraInputRef.current?.click()}
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#76648f] transition hover:bg-[#f1ebff] hover:text-[#7c4dff]"
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
                          : shouldShowProductChoice
                            ? "Choose a product above"
                            : input.trim()
                              ? "Send message"
                              : isListening
                                ? "Listening"
                                : "Voice message"
                      }
                    >
                      <button
                        type={input.trim() ? "submit" : "button"}
                        disabled={
                          isBusy || shouldShowProductChoice || (!input.trim() && isListening)
                        }
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
                          <Loader2
                            className="size-5 animate-spin text-[#7c4dff]"
                            aria-hidden="true"
                          />
                        ) : input.trim() ? (
                          <ArrowUp
                            className="size-6 text-current"
                            strokeWidth={2.5}
                            aria-hidden="true"
                          />
                        ) : (
                          <Mic
                            className="size-6 text-current"
                            strokeWidth={2.4}
                            aria-hidden="true"
                          />
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
        </div>
      </main>
    </div>
  );
}
