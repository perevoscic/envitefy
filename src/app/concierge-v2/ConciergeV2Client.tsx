"use client";

import {
  ArrowUp,
  Bell,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  ExternalLink,
  FileSearch,
  FileText,
  HeartHandshake,
  LinkIcon,
  Loader2,
  MessageSquareText,
  Paperclip,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Users,
  Warehouse,
  WalletCards,
  WandSparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { FormEvent, KeyboardEvent, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ConciergeV2Flags } from "@/config/concierge-v2-flags";
import { runSnapOcrUpload } from "@/lib/snap-upload-pipeline";
import { cn } from "@/lib/utils";
import { createClientAttemptId } from "@/utils/client-log";
import { validateClientUploadFile } from "@/utils/media-upload-client";

type DraftRecord = Record<string, unknown>;

type SessionRecord = {
  id: string;
  status: string;
};

type ApplyResult = {
  eventPath: string;
  legacyEventPath?: string;
  dynamicEventPageId?: string | null;
  eventHistoryId: string;
  occurrenceCount: number;
  formCount: number;
  volunteerSlotCount: number;
  paymentRequestCount: number;
  reminderCount: number;
  checklistCount: number;
};

type SessionApiRecord = SessionRecord & {
  source_kind?: string | null;
  input_text?: string | null;
  status?: string;
  raw_output_json?: Record<string, unknown> | null;
  normalized_output_json?: DraftRecord | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type ChatMessage = {
  id: string;
  role: "assistant" | "user" | "system";
  text: string;
  tone?: "normal" | "progress" | "success" | "error";
  createdAt: number;
};

type FailedUpload = {
  file: File;
  message: string;
};

type RetryRequest = {
  brief: string;
  sourceKind: "text" | "upload";
  userEcho: string;
  progressText: string;
};

const EXAMPLES = [
  {
    label: "Gymnastics season",
    prompt:
      "Lara has gymnastics every Tuesday and Thursday at 5:30, meet on March 12 in Orlando, team dinner the night before, and I need to invite grandparents.",
  },
  {
    label: "Spirit week",
    prompt:
      "Lara has spirit week next week: Monday pajamas, Tuesday crazy hair, Wednesday bring canned food, Thursday team shirt, Friday early dismissal.",
  },
  {
    label: "Birthday party",
    prompt: "Plan Lara's 8th birthday, cat theme, pool party.",
  },
  {
    label: "Class party signup",
    prompt: "We need a Valentine's class party signup for 22 kids.",
  },
];

const CAPABILITY_CARDS = [
  { key: "event_page", label: "Event Page", icon: FileText },
  { key: "schedule", label: "Schedule", icon: CalendarDays },
  { key: "rsvp", label: "RSVP", icon: Users },
  { key: "forms", label: "Forms", icon: ClipboardList },
  { key: "volunteer", label: "Signup", icon: HeartHandshake },
  { key: "payments", label: "Payments", icon: WalletCards },
  { key: "reminders", label: "Reminders", icon: Bell },
  { key: "checklist", label: "Checklist", icon: ClipboardCheck },
];

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  text: "Tell me what is happening. I will turn the details into a guest page, schedule, RSVP setup, reminders, and planning tools.",
  createdAt: 0,
};

function makeMessageId(prefix = "msg") {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function clean(value: unknown): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

function cleanLong(value: unknown, maxLength = 12000): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, maxLength) : "";
}

function list(value: unknown): DraftRecord[] {
  return Array.isArray(value)
    ? value.filter((item): item is DraftRecord => Boolean(item && typeof item === "object"))
    : [];
}

function formatDateTime(value: unknown) {
  const raw = clean(value);
  if (!raw) return "Time to confirm";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatCurrency(cents: unknown, currency = "USD") {
  const amount = Number(cents || 0) / 100;
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: clean(currency) || "USD",
  }).format(amount);
}

function compactJson(value: unknown, maxLength = 2500) {
  if (!value || typeof value !== "object") return "";
  try {
    return JSON.stringify(value).slice(0, maxLength);
  } catch {
    return "";
  }
}

async function readJsonPayload<T extends Record<string, unknown>>(
  response: Response,
): Promise<Partial<T>> {
  const value = await response.json().catch(() => null);
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Partial<T>) : {};
}

function buildRefinementBrief(params: {
  currentDraft: DraftRecord;
  previousBrief: string;
  userMessage: string;
}) {
  return [
    "Update the existing Concierge V2 draft using the user's latest correction.",
    params.previousBrief ? `Original brief:\n${cleanLong(params.previousBrief, 3500)}` : "",
    `Current draft JSON:\n${compactJson(params.currentDraft, 5000)}`,
    `Latest user correction:\n${params.userMessage}`,
    "Return a complete updated draft, preserving existing correct details unless the correction changes them.",
  ]
    .filter(Boolean)
    .join("\n\n");
}

function draftMode(draft: DraftRecord | null) {
  return clean(draft?.mode) || "event";
}

function draftTitle(draft: DraftRecord | null) {
  return clean(draft?.title) || "Untitled event";
}

function sessionTitle(session: SessionApiRecord) {
  const draft = session.normalized_output_json || {};
  const title = clean(draft.title);
  if (title) return title;
  const input = cleanLong(session.input_text, 80);
  if (input) return input;
  return clean(session.source_kind) === "upload" ? "Uploaded event draft" : "Event draft";
}

function draftMissingFields(draft: DraftRecord | null) {
  const value = draft?.missingFields;
  return Array.isArray(value) ? value.map((field) => clean(field)).filter(Boolean) : [];
}

function applyResultFromSession(session: SessionApiRecord | null): ApplyResult | null {
  const value = session?.raw_output_json?.applyResult;
  return value && typeof value === "object" && !Array.isArray(value) ? (value as ApplyResult) : null;
}

function sessionTimestampLabel(value: unknown) {
  const raw = clean(value);
  if (!raw) return "Recent";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "Recent";
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function messagesFromSession(session: SessionApiRecord, draft: DraftRecord): ChatMessage[] {
  const sourceKind = clean(session.source_kind) || "text";
  const inputText = cleanLong(session.input_text, 1200);
  const result = applyResultFromSession(session);
  return [
    WELCOME_MESSAGE,
    {
      id: `resume-user-${session.id}`,
      role: "user",
      text: sourceKind === "upload" ? "Uploaded source material" : inputText || "Started an event brief",
      createdAt: Date.now(),
    },
    {
      id: `resume-assistant-${session.id}`,
      role: "assistant",
      text: result
        ? `Resumed ${draftTitle(draft)}. This event has already been published, and the owner links are available in the review panel.`
        : summarizeDraft(draft),
      tone: result ? "success" : draftMissingFields(draft).length ? "normal" : "success",
      createdAt: Date.now(),
    },
  ];
}

function activeCapabilitiesFromDraft(draft: DraftRecord | null) {
  const active = new Set(["event_page", "rsvp"]);
  if (list(draft?.series).length || list(draft?.occurrences).length) active.add("schedule");
  if (list(draft?.forms).length) active.add("forms");
  if (list(draft?.volunteerSlots).length) active.add("volunteer");
  if (list(draft?.paymentItems).length) active.add("payments");
  if (list(draft?.reminders).length) active.add("reminders");
  if (list(draft?.checklistItems).length) active.add("checklist");
  return active;
}

function summarizeDraft(draft: DraftRecord) {
  const activeCapabilities = activeCapabilitiesFromDraft(draft);
  const capabilities = CAPABILITY_CARDS.filter((card) => activeCapabilities.has(card.key))
    .map((card) => card.label)
    .join(", ");
  const missing = draftMissingFields(draft);
  const title = draftTitle(draft);
  const mode = draftMode(draft).replace(/_/g, " ");
  if (missing.length) {
    return `I built a ${mode} draft for ${title}. I still need ${missing.slice(0, 3).join(", ")} before this feels ready to share.`;
  }
  return `I built a ${mode} draft for ${title}. The package includes ${capabilities || "the event page and RSVP setup"}. Review the details, then publish when it looks right.`;
}

function SectionCard({
  title,
  eyebrow,
  icon: Icon,
  children,
  muted = false,
  className,
}: {
  title: string;
  eyebrow: string;
  icon: LucideIcon;
  children: ReactNode;
  muted?: boolean;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-xl border bg-white p-4 shadow-[0_14px_36px_rgba(31,41,55,0.06)] sm:p-5",
        muted ? "border-slate-200/80" : "border-slate-200",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-700">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            {eyebrow}
          </p>
          <h2 className="mt-1 text-base font-semibold tracking-tight text-slate-950">{title}</h2>
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function TextInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-950 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
      />
    </label>
  );
}

function EmptyLine({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium leading-6 text-slate-500">
      {children}
    </div>
  );
}

function ChatAvatar({ role }: { role: ChatMessage["role"] }) {
  if (role === "user") {
    return (
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-950 text-xs font-semibold text-white">
        You
      </span>
    );
  }
  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-slate-800 shadow-sm">
      <Sparkles className="h-4 w-4" aria-hidden="true" />
    </span>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      <ChatAvatar role={message.role} />
      <div
        className={cn(
          "max-w-[min(42rem,82%)] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm",
          isUser
            ? "rounded-tr-md bg-slate-950 text-white"
            : "rounded-tl-md border border-slate-200 bg-white text-slate-800",
          message.tone === "progress" && "text-slate-600",
          message.tone === "success" && "border-emerald-200 bg-emerald-50 text-emerald-950",
          message.tone === "error" && "border-rose-200 bg-rose-50 text-rose-900",
        )}
      >
        {message.tone === "progress" ? (
          <span className="mr-2 inline-flex align-[-2px]">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          </span>
        ) : null}
        {message.text}
      </div>
    </div>
  );
}

export default function ConciergeV2Client({ flags }: { flags: ConciergeV2Flags }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [draft, setDraft] = useState<DraftRecord | null>(null);
  const [session, setSession] = useState<SessionRecord | null>(null);
  const [recentSessions, setRecentSessions] = useState<SessionApiRecord[]>([]);
  const [result, setResult] = useState<ApplyResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastSubmittedBrief, setLastSubmittedBrief] = useState("");
  const [lastRetryRequest, setLastRetryRequest] = useState<RetryRequest | null>(null);
  const [failedUpload, setFailedUpload] = useState<FailedUpload | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const scheduleItems = list(draft?.occurrences);
  const seriesItems = list(draft?.series);
  const forms = list(draft?.forms);
  const volunteerSlots = list(draft?.volunteerSlots);
  const paymentItems = list(draft?.paymentItems);
  const reminders = list(draft?.reminders);
  const checklistItems = list(draft?.checklistItems);
  const missingFields = draftMissingFields(draft);
  const canApply = Boolean(session?.id && draft && !isApplying);
  const isBusy = isParsing || isApplying;

  const activeCapabilities = useMemo(() => {
    return activeCapabilitiesFromDraft(draft);
  }, [
    draft,
    checklistItems.length,
    forms.length,
    paymentItems.length,
    reminders.length,
    scheduleItems.length,
    seriesItems.length,
    volunteerSlots.length,
  ]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isParsing, isApplying]);

  useEffect(() => {
    let cancelled = false;
    async function loadRecentSessions() {
      setIsLoadingSessions(true);
      try {
        const response = await fetch("/api/concierge/sessions", {
          method: "GET",
          credentials: "include",
        });
        const json = await readJsonPayload<{
          ok?: boolean;
          sessions?: SessionApiRecord[];
        }>(response);
        if (!cancelled && response.ok && json.ok && Array.isArray(json.sessions)) {
          setRecentSessions(json.sessions);
        }
      } catch {
        if (!cancelled) setRecentSessions([]);
      } finally {
        if (!cancelled) setIsLoadingSessions(false);
      }
    }
    void loadRecentSessions();
    return () => {
      cancelled = true;
    };
  }, []);

  function updateDraft(patch: DraftRecord) {
    setDraft((current) => (current ? { ...current, ...patch } : current));
  }

  function updateOccurrence(index: number, patch: DraftRecord) {
    setDraft((current) => {
      if (!current) return current;
      const next = list(current.occurrences).map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item,
      );
      return { ...current, occurrences: next };
    });
  }

  function rememberSession(sessionRecord: SessionApiRecord, draftRecord: DraftRecord) {
    setRecentSessions((current) => {
      const normalized: SessionApiRecord = {
        ...sessionRecord,
        normalized_output_json: draftRecord,
      };
      return [normalized, ...current.filter((item) => item.id !== normalized.id)].slice(0, 10);
    });
  }

  async function resumeSession(sessionId: string) {
    if (isBusy) return;
    setError(null);
    setIsLoadingSessions(true);
    try {
      const response = await fetch(`/api/concierge/sessions/${encodeURIComponent(sessionId)}`, {
        method: "GET",
        credentials: "include",
      });
      const json = await readJsonPayload<{
        ok?: boolean;
        error?: string;
        session?: SessionApiRecord;
        draft?: DraftRecord;
      }>(response);
      if (!response.ok || !json.ok || !json.session || !json.draft) {
        throw new Error(json.error || "Unable to resume this Concierge session.");
      }
      const resumedResult = applyResultFromSession(json.session);
      setDraft(json.draft);
      setSession(json.session);
      setResult(resumedResult);
      setInput("");
      setLastSubmittedBrief(cleanLong(json.session.input_text));
      setMessages(messagesFromSession(json.session, json.draft));
      rememberSession(json.session, json.draft);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to resume this session.";
      setError(message);
      setMessages((current) => [
        ...current,
        {
          id: makeMessageId("resume-error"),
          role: "assistant",
          text: message,
          tone: "error",
          createdAt: Date.now(),
        },
      ]);
    } finally {
      setIsLoadingSessions(false);
    }
  }

  async function createSession(
    briefOverride?: string,
    options: {
      sourceKind?: "text" | "upload";
      userEcho?: string;
      progressId?: string;
      progressText?: string;
    } = {},
  ) {
    const visibleUserText = (briefOverride ?? input).trim();
    if (!visibleUserText) {
      setError("Tell Envitefy what is happening first.");
      inputRef.current?.focus();
      return;
    }
    const shouldRefineExistingDraft = Boolean(draft && !briefOverride && !options.progressId);
    const trimmed =
      shouldRefineExistingDraft && draft
        ? buildRefinementBrief({
            currentDraft: draft,
            previousBrief: lastSubmittedBrief,
            userMessage: visibleUserText,
          })
        : visibleUserText;

    const progressId = options.progressId || makeMessageId("progress");
    const userEcho = options.userEcho ?? visibleUserText;
    const progressText =
      options.progressText ||
      (shouldRefineExistingDraft
        ? "Updating the draft with that detail..."
        : "Reading the brief and building the event workspace...");
    setLastSubmittedBrief(shouldRefineExistingDraft ? lastSubmittedBrief || visibleUserText : trimmed);
    setLastRetryRequest({
      brief: trimmed,
      sourceKind: options.sourceKind || "text",
      userEcho,
      progressText,
    });
    setFailedUpload(null);
    setInput("");
    setIsParsing(true);
    setError(null);
    setResult(null);
    setMessages((current) => {
      const next = options.progressId
        ? current.map((message) =>
            message.id === progressId
              ? {
                  ...message,
                  text: progressText,
                  tone: "progress" as const,
                }
              : message,
          )
        : [
            ...current,
            { id: makeMessageId("user"), role: "user" as const, text: userEcho, createdAt: Date.now() },
            {
              id: progressId,
              role: "assistant" as const,
              text: progressText,
              tone: "progress" as const,
              createdAt: Date.now(),
            },
          ];
      return next;
    });

    try {
      const response = await fetch("/api/concierge/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputText: trimmed, sourceKind: options.sourceKind || "text" }),
      });
      const json = await readJsonPayload<{
        ok?: boolean;
        error?: string;
        draft?: DraftRecord;
        session?: SessionRecord;
      }>(response);
      const parsedDraft = json.draft;
      const parsedSession = json.session;
      if (!response.ok || !json.ok || !parsedDraft || !parsedSession) {
        throw new Error(json.error || "Unable to create draft.");
      }
      setDraft(parsedDraft);
      setSession(parsedSession);
      rememberSession(parsedSession, parsedDraft);
      setMessages((current) => [
        ...current.filter((message) => message.id !== progressId),
        {
          id: makeMessageId("assistant"),
          role: "assistant",
          text: summarizeDraft(parsedDraft),
          tone: draftMissingFields(parsedDraft).length ? "normal" : "success",
          createdAt: Date.now(),
        },
      ]);
      setLastRetryRequest(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to create draft.";
      setError(message);
      setMessages((current) => [
        ...current.filter((item) => item.id !== progressId),
        {
          id: makeMessageId("error"),
          role: "assistant",
          text: `${message} You can retry the brief or simplify it into the main date, place, and guest action.`,
          tone: "error",
          createdAt: Date.now(),
        },
      ]);
    } finally {
      setIsParsing(false);
    }
  }

  async function handleSelectedUpload(file: File | null | undefined) {
    if (!file || isBusy) return;
    const validationError = validateClientUploadFile(file, "attachment");
    if (validationError) {
      setError(validationError);
      setMessages((current) => [
        ...current,
        {
          id: makeMessageId("upload-error"),
          role: "assistant",
          text: validationError,
          tone: "error",
          createdAt: Date.now(),
        },
      ]);
      return;
    }

    const progressId = makeMessageId("upload");
    setError(null);
    setResult(null);
    setIsParsing(true);
    setMessages((current) => [
      ...current,
      {
        id: makeMessageId("user-upload"),
        role: "user",
        text: `Uploaded ${file.name || "1 file"}`,
        createdAt: Date.now(),
      },
      {
        id: progressId,
        role: "assistant",
        text: "Reading the upload...",
        tone: "progress",
        createdAt: Date.now(),
      },
    ]);

    try {
      const scanAttemptId = createClientAttemptId("concierge-v2-upload");
      const ocrResult = await runSnapOcrUpload({ file, scanAttemptId });
      const typedContext = cleanLong(input, 2000);
      const ocrText = cleanLong(ocrResult.ocrText, 10000);
      const fieldSummary = compactJson(ocrResult.fieldsGuess);
      const categoryHint = clean(ocrResult.category);
      const brief = [
        typedContext,
        `Create an event from the uploaded file named ${file.name || "upload"}.`,
        categoryHint ? `Detected category hint: ${categoryHint}.` : "",
        ocrText ? `Text extracted from upload:\n${ocrText}` : "No readable text was extracted from the upload.",
        fieldSummary ? `Structured extraction hints:\n${fieldSummary}` : "",
      ]
        .filter(Boolean)
        .join("\n\n");

      await createSession(brief, {
        sourceKind: "upload",
        userEcho: `Uploaded ${file.name || "1 file"}`,
        progressId,
        progressText: "Building the event workspace from the upload...",
      });
      setFailedUpload(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to read that upload. Try another file.";
      setFailedUpload({ file, message });
      setError(message);
      setMessages((current) => [
        ...current.filter((item) => item.id !== progressId),
        {
          id: makeMessageId("upload-error"),
          role: "assistant",
          text: `${message} You can retry the file, upload a different one, or type the main details manually.`,
          tone: "error",
          createdAt: Date.now(),
        },
      ]);
      setIsParsing(false);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function applyDraft() {
    if (!session?.id || !draft) return;
    const progressId = makeMessageId("publish");
    setIsApplying(true);
    setError(null);
    setMessages((current) => [
      ...current,
      {
        id: progressId,
        role: "assistant",
        text: "Publishing the event page and connecting the operating tools...",
        tone: "progress",
        createdAt: Date.now(),
      },
    ]);
    try {
      const response = await fetch(`/api/concierge/sessions/${session.id}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft }),
      });
      const json = await readJsonPayload<{
        ok?: boolean;
        error?: string;
        result?: ApplyResult;
      }>(response);
      if (!response.ok || !json.ok || !json.result) {
        throw new Error(json.error || "Unable to publish draft.");
      }
      setResult(json.result);
      setRecentSessions((current) =>
        current.map((item) =>
          item.id === session.id
            ? {
                ...item,
                status: "applied",
                raw_output_json: {
                  ...(item.raw_output_json || {}),
                  applyResult: json.result,
                },
                normalized_output_json: draft,
              }
            : item,
        ),
      );
      setMessages((current) => [
        ...current.filter((message) => message.id !== progressId),
        {
          id: makeMessageId("published"),
          role: "assistant",
          text: `Published ${draftTitle(draft)}. The guest page is ready, and the hub links are available in the review panel.`,
          tone: "success",
          createdAt: Date.now(),
        },
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to publish draft.";
      setError(message);
      setMessages((current) => [
        ...current.filter((item) => item.id !== progressId),
        {
          id: makeMessageId("publish-error"),
          role: "assistant",
          text: `${message} Review the draft details and try publishing again.`,
          tone: "error",
          createdAt: Date.now(),
        },
      ]);
    } finally {
      setIsApplying(false);
    }
  }

  function handleExample(prompt: string) {
    setInput(prompt);
    inputRef.current?.focus();
  }

  function askForMissingField(field: string) {
    const label = field.replace(/_/g, " ").toLowerCase();
    setInput(`The ${label} is `);
    inputRef.current?.focus();
  }

  async function retryFailedUpload() {
    if (!failedUpload || isBusy) return;
    const file = failedUpload.file;
    setFailedUpload(null);
    await handleSelectedUpload(file);
  }

  async function retryLastRequest() {
    if (!lastRetryRequest || isBusy) return;
    await createSession(lastRetryRequest.brief, {
      sourceKind: lastRetryRequest.sourceKind,
      userEcho: lastRetryRequest.userEcho,
      progressText: lastRetryRequest.progressText,
    });
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey) return;
    event.preventDefault();
    void createSession();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void createSession();
  }

  const flagEntries = Object.entries(flags);

  return (
    <main className="min-h-screen bg-[#f6f4ef] text-slate-950">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-slate-900" aria-hidden="true" />
              Concierge V2
            </div>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
              Tell Envitefy what is happening.
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
            {flagEntries.slice(0, 3).map(([key, enabled]) => (
              <span
                key={key}
                className={cn(
                  "rounded-full border px-2.5 py-1",
                  enabled
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 bg-white text-slate-500",
                )}
              >
                {key.replace("ENABLE_", "").replaceAll("_", " ")} {enabled ? "on" : "off"}
              </span>
            ))}
          </div>
        </header>

        <section className="grid flex-1 gap-4 py-4 lg:grid-cols-[minmax(0,1fr)_26rem]">
          <div className="flex min-h-[72vh] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_18px_54px_rgba(31,41,55,0.08)]">
            <div
              className="flex-1 space-y-5 overflow-y-auto px-4 py-5 sm:px-6"
              role="log"
              aria-live="polite"
              aria-relevant="additions text"
            >
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}

              {!draft && messages.length === 1 ? (
                <div className="ml-12 grid gap-2 sm:grid-cols-2">
                  {EXAMPLES.map((example) => (
                    <button
                      key={example.label}
                      type="button"
                      onClick={() => handleExample(example.prompt)}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-left text-sm font-medium leading-5 text-slate-700 transition hover:border-slate-300 hover:bg-white"
                    >
                      <span className="block font-semibold text-slate-950">{example.label}</span>
                      <span className="mt-1 block line-clamp-2 text-xs leading-5 text-slate-500">
                        {example.prompt}
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}

              {lastRetryRequest && error && !failedUpload ? (
                <div className="ml-12">
                  <button
                    type="button"
                    onClick={() => void retryLastRequest()}
                    disabled={isBusy}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-rose-200 bg-white px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <RotateCcw className="h-4 w-4" aria-hidden="true" />
                    Retry brief
                  </button>
                </div>
              ) : null}
              <div ref={messagesEndRef} />
            </div>

            <form
              onSubmit={handleSubmit}
              className="border-t border-slate-200 bg-white/95 p-3 backdrop-blur sm:p-4"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(event) => {
                  void handleSelectedUpload(event.currentTarget.files?.[0]);
                  event.currentTarget.value = "";
                }}
              />
              <div className="rounded-xl border border-slate-200 bg-[#fbfaf7] p-2 shadow-[0_10px_30px_rgba(31,41,55,0.06)] focus-within:border-slate-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-slate-100">
                <textarea
                  ref={inputRef}
                  suppressHydrationWarning
                  data-testid="concierge-v2-event-brief"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={handleComposerKeyDown}
                  rows={2}
                  className="max-h-36 min-h-12 w-full resize-none bg-transparent px-3 py-2 text-base font-medium leading-6 text-slate-950 outline-none placeholder:text-slate-400"
                  placeholder="Describe the event, schedule, guests, forms, reminders, or pasted group chat details..."
                  disabled={isBusy}
                />
                <div className="flex items-center justify-between gap-2 px-1 pb-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isBusy}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-full px-3 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                    title="Upload an image or PDF"
                  >
                    <Paperclip className="h-4 w-4" aria-hidden="true" />
                    Upload
                  </button>
                  <button
                    data-testid="concierge-v2-review-draft"
                    type="submit"
                    disabled={isBusy || !input.trim()}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {isParsing ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : input.trim() ? (
                      <ArrowUp className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <WandSparkles className="h-4 w-4" aria-hidden="true" />
                    )}
                    Send
                  </button>
                </div>
              </div>
            </form>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
            {error ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold leading-6 text-rose-800">
                {error}
                {failedUpload ? (
                  <button
                    type="button"
                    onClick={() => void retryFailedUpload()}
                    disabled={isBusy}
                    className="mt-3 inline-flex h-9 items-center justify-center gap-2 rounded-full border border-rose-200 bg-white px-4 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                    Retry file
                  </button>
                ) : null}
              </div>
            ) : null}

            {recentSessions.length || isLoadingSessions ? (
              <SectionCard title="Recent Drafts" eyebrow="Resume" icon={RotateCcw} muted>
                {isLoadingSessions && !recentSessions.length ? (
                  <div className="inline-flex items-center gap-2 text-sm font-medium text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Loading recent drafts
                  </div>
                ) : (
                  <div className="grid gap-2">
                    {recentSessions.slice(0, 4).map((item) => {
                      const itemResult = applyResultFromSession(item);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => void resumeSession(item.id)}
                          disabled={isBusy}
                          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-left transition hover:border-slate-300 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <span className="flex items-center justify-between gap-3">
                            <span className="min-w-0 truncate text-sm font-semibold text-slate-950">
                              {sessionTitle(item)}
                            </span>
                            <span className="shrink-0 text-xs font-medium text-slate-500">
                              {sessionTimestampLabel(item.updated_at || item.created_at)}
                            </span>
                          </span>
                          <span className="mt-1 block truncate text-xs font-medium text-slate-500">
                            {itemResult ? "Published" : clean(item.source_kind) === "upload" ? "Upload draft" : "Text draft"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </SectionCard>
            ) : null}

            {result ? (
              <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-[0_14px_36px_rgba(16,185,129,0.1)]">
                <div className="flex items-start gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                      Ready to share
                    </p>
                    <h2 className="mt-1 text-base font-semibold text-emerald-950">
                      Dynamic event page created.
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-emerald-900">
                      Created {result.occurrenceCount} schedule items, {result.formCount} forms,{" "}
                      {result.volunteerSlotCount} signup slots, {result.paymentRequestCount} payment
                      requests, {result.reminderCount} reminders, and {result.checklistCount}
                      checklist items.
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid gap-2">
                  <Link
                    href={result.eventPath}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800"
                  >
                    View guest page
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  </Link>
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href={`/concierge-v2/events/${encodeURIComponent(result.eventHistoryId)}/hub`}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
                    >
                      <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                      Hub
                    </Link>
                    <Link
                      href={`/concierge-v2/events/${encodeURIComponent(result.eventHistoryId)}/resources`}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
                    >
                      <Warehouse className="h-4 w-4" aria-hidden="true" />
                      Setup
                    </Link>
                    <Link
                      href={`/concierge-v2/events/${encodeURIComponent(result.eventHistoryId)}/imports`}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
                    >
                      <FileSearch className="h-4 w-4" aria-hidden="true" />
                      Imports
                    </Link>
                    <Link
                      href={`/concierge-v2/events/${encodeURIComponent(result.eventHistoryId)}/rsvp`}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
                    >
                      <Users className="h-4 w-4" aria-hidden="true" />
                      RSVP
                    </Link>
                    <Link
                      href={`/concierge-v2/events/${encodeURIComponent(result.eventHistoryId)}/ops`}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
                    >
                      <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
                      Ops
                    </Link>
                    <Link
                      href={`/concierge-v2/events/${encodeURIComponent(result.eventHistoryId)}/schedule`}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
                    >
                      <CalendarDays className="h-4 w-4" aria-hidden="true" />
                      Schedule
                    </Link>
                    <Link
                      href={`/concierge-v2/events/${encodeURIComponent(result.eventHistoryId)}/calendar`}
                      className="col-span-2 inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
                    >
                      <LinkIcon className="h-4 w-4" aria-hidden="true" />
                      Calendar
                    </Link>
                  </div>
                </div>
              </section>
            ) : null}

            <SectionCard title="Live Draft" eyebrow="Review" icon={MessageSquareText}>
              {draft ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-slate-50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                        Mode
                      </p>
                      <p className="mt-1 text-base font-semibold capitalize text-slate-950">
                        {draftMode(draft).replace(/_/g, " ")}
                      </p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                        Confidence
                      </p>
                      <p className="mt-1 text-base font-semibold text-slate-950">
                        {Math.round(Number(draft.confidence || 0) * 100)}%
                      </p>
                    </div>
                  </div>
                  <TextInput
                    label="Page title"
                    value={draftTitle(draft)}
                    onChange={(value) => updateDraft({ title: value })}
                  />
                  <TextInput
                    label="Timezone"
                    value={clean(draft.timezone) || "America/Chicago"}
                    onChange={(value) => updateDraft({ timezone: value })}
                  />
                  {missingFields.length ? (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                      <p className="text-sm font-semibold text-amber-950">Helpful to confirm</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {missingFields.map((field) => (
                          <button
                            key={field}
                            type="button"
                            onClick={() => askForMissingField(field)}
                            disabled={isBusy}
                            className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-amber-900 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {field}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
                      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                      Ready to create the event page.
                    </div>
                  )}
                </div>
              ) : (
                <EmptyLine>
                  Send an event brief to see extracted details, missing fields, and publishing
                  readiness.
                </EmptyLine>
              )}
            </SectionCard>

            <SectionCard title="Creation Package" eyebrow="Included" icon={Sparkles}>
              <div className="grid grid-cols-2 gap-2">
                {CAPABILITY_CARDS.map((card) => {
                  const Icon = card.icon;
                  const active = activeCapabilities.has(card.key);
                  return (
                    <div
                      key={card.key}
                      className={cn(
                        "rounded-lg border px-3 py-3",
                        active
                          ? "border-slate-300 bg-white text-slate-950"
                          : "border-slate-200 bg-slate-50 text-slate-400",
                      )}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                      <p className="mt-2 text-sm font-semibold">{card.label}</p>
                    </div>
                  );
                })}
              </div>
            </SectionCard>

            <SectionCard title="Schedule Hub" eyebrow="Agenda" icon={CalendarDays}>
              {seriesItems.length ? (
                <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-sm font-semibold text-slate-950">Recurring schedule</p>
                  <div className="mt-2 grid gap-2">
                    {seriesItems.map((series, index) => (
                      <div
                        key={`${clean(series.title)}-${index}`}
                        className="text-sm font-medium leading-6 text-slate-700"
                      >
                        {clean(series.title)} at {clean(series.startTimeLocal) || "time to confirm"}{" "}
                        - {clean(series.recurrenceRule)}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              {scheduleItems.length ? (
                <div className="grid gap-3">
                  {scheduleItems.slice(0, 3).map((item, index) => (
                    <div
                      key={`${clean(item.title)}-${index}`}
                      className="rounded-lg border border-slate-200 p-3"
                    >
                      <TextInput
                        label="Schedule title"
                        value={clean(item.title)}
                        onChange={(value) => updateOccurrence(index, { title: value })}
                      />
                      <div className="mt-3 grid gap-3">
                        <TextInput
                          label="When"
                          value={clean(item.startAt)}
                          onChange={(value) => updateOccurrence(index, { startAt: value })}
                        />
                        <TextInput
                          label="Location"
                          value={clean(item.locationText)}
                          onChange={(value) => updateOccurrence(index, { locationText: value })}
                        />
                      </div>
                    </div>
                  ))}
                  {scheduleItems.length > 3 ? (
                    <p className="text-sm font-medium text-slate-500">
                      {scheduleItems.length - 3} more schedule items will be created.
                    </p>
                  ) : null}
                </div>
              ) : (
                <EmptyLine>No dated schedule items yet. You can still create the event page.</EmptyLine>
              )}
            </SectionCard>

            <div className="grid gap-4">
              <SectionCard title="Smart Forms" eyebrow="Questions" icon={FileText}>
                {forms.length ? (
                  <div className="space-y-3">
                    {forms.slice(0, 2).map((form, index) => (
                      <div key={`${clean(form.title)}-${index}`} className="rounded-lg bg-slate-50 p-3">
                        <p className="font-semibold">{clean(form.title)}</p>
                        <p className="mt-1 text-sm leading-6 text-slate-600">
                          {clean(form.description)}
                        </p>
                        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                          {list(form.fields).length} questions
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyLine>No form questions generated for this brief.</EmptyLine>
                )}
              </SectionCard>

              <SectionCard title="Volunteer Signup" eyebrow="Slots" icon={HeartHandshake}>
                {volunteerSlots.length ? (
                  <div className="space-y-2">
                    {volunteerSlots.slice(0, 3).map((slot, index) => (
                      <div
                        key={`${clean(slot.title)}-${index}`}
                        className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 p-3"
                      >
                        <span className="min-w-0">
                          <span className="block truncate font-semibold">{clean(slot.title)}</span>
                          <span className="text-sm text-slate-500">{clean(slot.group)}</span>
                        </span>
                        <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                          {Number(slot.quantityNeeded || 1)} needed
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyLine>No signup slots generated for this brief.</EmptyLine>
                )}
              </SectionCard>

              <SectionCard title="Payment Tracker" eyebrow="Manual" icon={WalletCards}>
                {paymentItems.length ? (
                  <div className="space-y-2">
                    {paymentItems.slice(0, 3).map((item, index) => (
                      <div key={`${clean(item.title)}-${index}`} className="rounded-lg bg-slate-50 p-3">
                        <p className="font-semibold">{clean(item.title)}</p>
                        <p className="mt-1 text-sm text-slate-600">
                          {formatCurrency(item.amountCents, clean(item.currency) || "USD")} -{" "}
                          {clean(item.status) || "unpaid"}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyLine>No payment requests generated. Manual tracking stays hidden.</EmptyLine>
                )}
              </SectionCard>

              <SectionCard title="Reminders" eyebrow="Timeline" icon={Bell}>
                {reminders.length ? (
                  <div className="space-y-2">
                    {reminders.slice(0, 3).map((reminder, index) => (
                      <div
                        key={`${clean(reminder.title)}-${index}`}
                        className="rounded-lg bg-slate-50 p-3"
                      >
                        <p className="font-semibold">{clean(reminder.title)}</p>
                        <p className="mt-1 text-sm text-slate-600">
                          {formatDateTime(reminder.scheduledFor)} -{" "}
                          {clean(reminder.channel) || "email"}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyLine>No reminder dates yet. Add dates to generate a timeline.</EmptyLine>
                )}
              </SectionCard>

              <SectionCard title="Planning Checklist" eyebrow="Next actions" icon={ClipboardList}>
                {checklistItems.length ? (
                  <div className="grid gap-2">
                    {checklistItems.slice(0, 4).map((item, index) => (
                      <div key={`${clean(item.title)}-${index}`} className="rounded-lg bg-slate-50 p-3">
                        <p className="font-semibold">{clean(item.title)}</p>
                        <p className="mt-1 text-sm text-slate-500">{clean(item.category)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyLine>The checklist will appear after Concierge understands the event type.</EmptyLine>
                )}
              </SectionCard>
            </div>

            <div className="sticky bottom-3 z-20 rounded-xl border border-slate-200 bg-white/95 p-3 shadow-[0_18px_54px_rgba(31,41,55,0.12)] backdrop-blur">
              <button
                data-testid="concierge-v2-create-event-page"
                type="button"
                onClick={() => void applyDraft()}
                disabled={!canApply}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
              >
                {isApplying ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                )}
                Create event page
              </button>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
