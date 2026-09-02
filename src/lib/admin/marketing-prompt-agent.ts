import OpenAI from "openai";
import { buildEnvitefyMarketingCatalogPrompt } from "@/lib/product-marketing-catalog";

export const MARKETING_CHANNELS = ["facebook", "instagram", "youtube", "tiktok"] as const;

export type MarketingChannel = (typeof MARKETING_CHANNELS)[number];
export type MarketingAssetType = "social-image" | "short-video";

export type MarketingPromptIdeaRequest = {
  idea: string;
  campaignName: string;
  audience: string;
  objective: string;
  channels: MarketingChannel[];
  assetType: MarketingAssetType;
  targetVertical: string;
  tone: string;
  callToAction: string;
};

export type MarketingPromptIdea = {
  campaignName: string;
  campaignAngle: string;
  generatedPrompt: string;
  audience: string;
  tone: string;
  callToAction: string;
  visualStyle: string;
  composition: string;
  mood: string;
  rationale: string;
};

type PromptAgentDependencies = {
  apiKey?: string | null;
  model?: string;
  createClient?: (apiKey: string) => OpenAI;
};

function cleanString(value: unknown, maximum = 2_000): string {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

function isMarketingChannel(value: string): value is MarketingChannel {
  return MARKETING_CHANNELS.includes(value as MarketingChannel);
}

export function parseMarketingPromptIdeaRequest(
  value: unknown,
): { ok: true; value: MarketingPromptIdeaRequest } | { ok: false; error: string } {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ok: false, error: "A marketing idea is required." };
  }

  const source = value as Record<string, unknown>;
  const idea = cleanString(source.idea, 4_000);
  if (!idea) return { ok: false, error: "Tell the marketing agent what you want to promote." };

  const channels = Array.from(
    new Set(
      (Array.isArray(source.channels) ? source.channels : [])
        .map((channel) => cleanString(channel, 40).toLowerCase())
        .filter(isMarketingChannel),
    ),
  );

  if (!channels.length) {
    return { ok: false, error: "Choose at least one campaign channel." };
  }

  return {
    ok: true,
    value: {
      idea,
      campaignName: cleanString(source.campaignName, 120),
      audience: cleanString(source.audience, 500),
      objective: cleanString(source.objective, 500),
      channels,
      assetType: source.assetType === "short-video" ? "short-video" : "social-image",
      targetVertical: cleanString(source.targetVertical, 120) || "General",
      tone: cleanString(source.tone, 240),
      callToAction: cleanString(source.callToAction, 240),
    },
  };
}

function buildPromptAgentInstructions(): string {
  return [
    "You are Envitefy's senior AI Marketing Director.",
    "You combine the judgment of an experienced growth marketer, social-first image creator, editorial flyer designer, and credible creator/influencer strategist.",
    "Turn a rough request into one decisive, production-ready campaign idea for the requested image or video workflow.",
    "Choose one audience, one pain or desire, one promise, one visual hook, and one conversion action.",
    "For static images, think like a premium flyer and social-ad designer: distinctive composition, clear subject, campaign-safe negative space, and one concise headline opportunity.",
    "For short video, think like a creator: an immediate first-second hook, natural performance, visual progression, product proof, and a satisfying final payoff.",
    "Adapt the concept to the selected channels without making it generic. Never invent product capabilities, pricing, guarantees, or integrations.",
    "The generatedPrompt will be passed to another creative pipeline. Make it a cohesive brief, not a list of disconnected tips. Do not include camera metadata syntax or JSON inside generatedPrompt.",
    `Verified Envitefy product catalog: ${buildEnvitefyMarketingCatalogPrompt()}`,
  ].join("\n");
}

function buildPromptAgentInput(input: MarketingPromptIdeaRequest): string {
  return [
    `Rough idea: ${input.idea}`,
    input.campaignName ? `Working campaign name: ${input.campaignName}` : "",
    input.audience ? `Audience: ${input.audience}` : "",
    input.objective ? `Business objective: ${input.objective}` : "",
    `Channels: ${input.channels.join(", ")}`,
    `Deliverable: ${input.assetType === "social-image" ? "static social images" : "short-form video"}`,
    `Event vertical: ${input.targetVertical}`,
    input.tone ? `Requested tone: ${input.tone}` : "",
    input.callToAction ? `Requested CTA: ${input.callToAction}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function cleanIdea(value: MarketingPromptIdea): MarketingPromptIdea {
  return {
    campaignName: cleanString(value.campaignName, 120) || "Envitefy social campaign",
    campaignAngle: cleanString(value.campaignAngle, 500),
    generatedPrompt: cleanString(value.generatedPrompt, 4_000),
    audience: cleanString(value.audience, 500),
    tone: cleanString(value.tone, 240),
    callToAction: cleanString(value.callToAction, 240),
    visualStyle: cleanString(value.visualStyle, 500),
    composition: cleanString(value.composition, 500),
    mood: cleanString(value.mood, 300),
    rationale: cleanString(value.rationale, 800),
  };
}

export async function generateMarketingPromptIdea(
  input: MarketingPromptIdeaRequest,
  dependencies: PromptAgentDependencies = {},
): Promise<{ idea: MarketingPromptIdea; model: string }> {
  const apiKey = dependencies.apiKey ?? process.env.OPENAI_API_KEY ?? null;
  if (!apiKey) throw new Error("OpenAI is not configured. Set OPENAI_API_KEY.");

  const model =
    dependencies.model ||
    process.env.ADMIN_MARKETING_PROMPT_MODEL ||
    process.env.STORYBOARD_OPENAI_TEXT_MODEL ||
    "gpt-5.6-luna";
  const client = dependencies.createClient?.(apiKey) || new OpenAI({ apiKey });
  const completion = await client.chat.completions.create({
    model,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "envitefy_marketing_prompt_idea",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          required: [
            "campaignName",
            "campaignAngle",
            "generatedPrompt",
            "audience",
            "tone",
            "callToAction",
            "visualStyle",
            "composition",
            "mood",
            "rationale",
          ],
          properties: {
            campaignName: { type: "string" },
            campaignAngle: { type: "string" },
            generatedPrompt: { type: "string" },
            audience: { type: "string" },
            tone: { type: "string" },
            callToAction: { type: "string" },
            visualStyle: { type: "string" },
            composition: { type: "string" },
            mood: { type: "string" },
            rationale: { type: "string" },
          },
        },
      },
    },
    messages: [
      { role: "developer", content: buildPromptAgentInstructions() },
      { role: "user", content: buildPromptAgentInput(input) },
    ],
  });

  const raw = completion.choices[0]?.message?.content || "";
  const parsed = JSON.parse(raw) as MarketingPromptIdea;
  const idea = cleanIdea(parsed);
  if (!idea.generatedPrompt) throw new Error("The marketing agent returned an empty prompt.");
  return { idea, model };
}
