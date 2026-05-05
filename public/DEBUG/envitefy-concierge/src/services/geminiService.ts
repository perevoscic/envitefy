import { GoogleGenAI, Type } from "@google/genai";
import { ConciergeEventDraft, Message } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const conciergeService = {
  async extractEventDetails(message: string, currentDraft: ConciergeEventDraft): Promise<ConciergeEventDraft> {
    if (!process.env.GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY missing, skipping extraction");
      return currentDraft;
    }

    const systemInstruction = `You are an expert event information extraction agent.
Analyze the user's message and update the event draft.
If a field is already present in the current draft and not mentioned in the new message, preserve it.

FIELDS TO EXTRACT:
- category: The type of event.
- title: The name of the event.
- description: A concise event description if mentioned or clearly implied.
- date: Date if mentioned.
- time: Time if mentioned.
- location: Venue or address.
- guestCount: Number of people or description of guest list.
- mood: Emotional vibe or visual style, such as elegant, wild, professional, playful, luxury, modern, or romantic.
- productType: Requested output such as Live Card, Flyer, Event Page, RSVP Page, WhatsApp, Text Message, or Printable Flyer.

CURRENT DRAFT: ${JSON.stringify(currentDraft)}`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: message }] }],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING },
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            date: { type: Type.STRING },
            time: { type: Type.STRING },
            location: { type: Type.STRING },
            guestCount: { type: Type.STRING },
            mood: { type: Type.STRING },
            vibe: { type: Type.STRING },
            productType: { type: Type.STRING },
          }
        }
      }
    });

    try {
      const extracted = JSON.parse(response.text || "{}") as Partial<ConciergeEventDraft> & {
        mood?: string;
      };
      const { mood, ...draftPatch } = extracted;
      return {
        ...currentDraft,
        ...draftPatch,
        vibe: draftPatch.vibe || mood || currentDraft.vibe,
      };
    } catch (e) {
      console.error("Failed to parse Gemini response", e);
      return currentDraft;
    }
  },

  async getConciergeResponse(
    messages: Message[],
    currentDraft: ConciergeEventDraft
  ): Promise<string> {
    if (!process.env.GEMINI_API_KEY) {
      return buildFallbackConciergeReply(currentDraft);
    }

    const systemInstruction = `You are the Envitefy Concierge, a world-class AI event architect.
Your mission is to help users design stunning, high-end digital invitations and event hubs.

PERSONA:
- Sophisticated, enthusiastic, and highly professional.
- Use terms like "spectacular," "masterpiece," "vision," and "flawless" when they fit naturally.
- Be brief but warm. Avoid corporate jargon; use lifestyle and event-planning language instead.

GOAL:
- Acknowledge the details the user has shared.
- If details are missing (Title, Date, Location, Time), gently ask for them one or two at a time.
- Once the draft has a title, date, and location, encourage them to Generate the masterpiece.

CONTEXT:
Current Event Draft: ${JSON.stringify(currentDraft)}

Respond as the Concierge to the latest user message.`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: messages.map((message) => ({
          role: message.role === "assistant" ? "model" : "user",
          parts: [{ text: message.content }],
        })),
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      return response.text || buildFallbackConciergeReply(currentDraft);
    } catch (error) {
      console.error("Gemini persona response failed", error);
      return buildFallbackConciergeReply(currentDraft);
    }
  }
};

function buildFallbackConciergeReply(draft: ConciergeEventDraft) {
  const missing = [
    !draft.title ? "title" : null,
    !draft.date ? "date" : null,
    !draft.time ? "time" : null,
    !draft.location ? "location" : null,
  ].filter(Boolean);

  if (!missing.length) {
    return `Spectacular. The ${draft.productType || "Live Card"} vision has the essentials in place. Generate the masterpiece when you're ready.`;
  }

  const nextDetails = missing.slice(0, 2).join(" and ");
  return `Beautiful, I have the vision coming together. What ${nextDetails} should we use so the invitation feels flawless?`;
}
