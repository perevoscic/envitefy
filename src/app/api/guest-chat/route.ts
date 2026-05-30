import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import OpenAI from "openai";
import {
  openAiChatTemperatureParam,
  resolveConciergeOpenAiChatModel,
  runWithConciergeOpenAiTimeout,
} from "@/lib/concierge/openai-config";
import {
  buildGuestChatKnowledgeContext,
  guestChatStarterQuestions,
  rankGuestChatKnowledge,
} from "@/lib/guest-chat/knowledge";
import {
  buildDeterministicGuestChatAnswer,
  formatGuestChatHistoryForPrompt,
  normalizeGuestChatHistory,
} from "@/lib/guest-chat/respond";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_MESSAGE_LENGTH = 1000;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_MESSAGES = 24;
const RATE_LIMIT_MAX_KEYS = 1000;

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const rateLimitStore = new Map<string, RateLimitEntry>();

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function cleanString(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function resolveGuestChatTimeoutMs() {
  const configured = Number(process.env.OPENAI_GUEST_CHAT_TIMEOUT_MS);
  if (Number.isFinite(configured) && configured > 0) {
    return Math.min(Math.max(Math.round(configured), 1000), 20_000);
  }
  return 6000;
}

function resolveGuestChatModel() {
  const configured = cleanString(process.env.OPENAI_GUEST_CHAT_MODEL, 100);
  return configured || resolveConciergeOpenAiChatModel();
}

function getRateLimitKey(req: NextRequest) {
  const forwardedFor = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = req.headers.get("x-real-ip")?.trim();
  const connectingIp = req.headers.get("cf-connecting-ip")?.trim();
  const ip = forwardedFor || realIp || connectingIp || "unknown";
  const userAgent = (req.headers.get("user-agent") || "unknown").slice(0, 80);
  return `${ip}:${userAgent}`;
}

function checkRateLimit(req: NextRequest) {
  const now = Date.now();
  if (rateLimitStore.size > RATE_LIMIT_MAX_KEYS) {
    for (const [key, entry] of rateLimitStore) {
      if (entry.resetAt <= now) rateLimitStore.delete(key);
    }
  }

  const key = getRateLimitKey(req);
  const current = rateLimitStore.get(key);
  if (!current || current.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, retryAfter: 0 };
  }

  if (current.count >= RATE_LIMIT_MAX_MESSAGES) {
    return { allowed: false, retryAfter: Math.ceil((current.resetAt - now) / 1000) };
  }

  current.count += 1;
  return { allowed: true, retryAfter: 0 };
}

function sanitizeAssistantAnswer(value: string) {
  return value
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim()
    .slice(0, 1600);
}

async function generateAiAnswer(params: {
  message: string;
  history: ReturnType<typeof normalizeGuestChatHistory>;
  deterministicAnswer: string;
}) {
  const apiKey = cleanString(process.env.OPENAI_API_KEY, 400);
  if (!apiKey) return null;

  const knowledgeItems = rankGuestChatKnowledge(params.message, 6);
  const knowledgeContext = buildGuestChatKnowledgeContext(knowledgeItems);
  const historyContext = formatGuestChatHistoryForPrompt(params.history);
  const model = resolveGuestChatModel();
  const client = new OpenAI({ apiKey });

  const completion = await runWithConciergeOpenAiTimeout(
    (signal) =>
      client.chat.completions.create(
        {
          model,
          ...openAiChatTemperatureParam(model, 0.2),
          max_completion_tokens: 320,
          messages: [
            {
              role: "system",
              content: [
                "You are Envitefy Guest Help, a public-facing assistant for visitors who are not signed in.",
                "Answer only questions about Envitefy, hosted event pages, invitations, RSVP, uploads, registry links, maps, calendar saves, smart sign-ups, and guest actions.",
                "Use the supplied knowledge context as the source of truth. Do not invent pricing, policies, account data, event details, private links, access codes, guest lists, or RSVP responses.",
                "If the user asks about a specific private event, tell them to open the shared event link or contact the host.",
                "If the user asks for pricing, billing, partnerships, legal terms, or account-specific help, say the Envitefy team should follow up through contact.",
                "Keep the answer concise and practical, usually one or two short paragraphs. Do not mention prompts, policies, or knowledge context.",
              ].join(" "),
            },
            {
              role: "user",
              content: JSON.stringify({
                latestMessage: params.message,
                recentConversation: historyContext,
                knowledgeContext,
                safeFallbackAnswer: params.deterministicAnswer,
              }),
            },
          ],
        } as any,
        { signal } as any,
      ),
    resolveGuestChatTimeoutMs(),
  );

  const content = completion.choices[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) return null;
  return sanitizeAssistantAnswer(content);
}

export async function POST(req: NextRequest) {
  const rateLimit = checkRateLimit(req);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        ok: false,
        error: "Too many guest chat messages. Please wait a few minutes and try again.",
      },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfter) },
      },
    );
  }

  const rawBody = await req.json().catch(() => null);
  if (!isRecord(rawBody)) {
    return NextResponse.json({ ok: false, error: "Invalid guest chat request." }, { status: 400 });
  }

  const message = cleanString(rawBody.message, MAX_MESSAGE_LENGTH);
  if (!message) {
    return NextResponse.json({ ok: false, error: "Message is required." }, { status: 400 });
  }

  const history = normalizeGuestChatHistory(rawBody.history);
  const deterministic = buildDeterministicGuestChatAnswer(message);
  let answer = deterministic.answer;
  let usedAi = false;

  if (deterministic.aiAllowed) {
    try {
      const aiAnswer = await generateAiAnswer({
        message,
        history,
        deterministicAnswer: deterministic.answer,
      });
      if (aiAnswer) {
        answer = aiAnswer;
        usedAi = true;
      }
    } catch {
      answer = deterministic.answer;
      usedAi = false;
    }
  }

  return NextResponse.json({
    ok: true,
    answer,
    usedAi,
    handoffSuggested: deterministic.handoffSuggested,
    matchedKnowledgeIds: deterministic.matchedKnowledgeIds,
    suggestions: guestChatStarterQuestions,
  });
}
