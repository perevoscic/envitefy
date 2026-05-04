import { GoogleGenAI, Type } from "@google/genai";
import { ConciergeEventDraft } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const conciergeService = {
  async extractEventDetails(message: string, currentDraft: ConciergeEventDraft): Promise<ConciergeEventDraft> {
    if (!process.env.GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY missing, skipping extraction");
      return currentDraft;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Extract event details from this message: "${message}". 
      Current known details: ${JSON.stringify(currentDraft)}.
      Return ONLY the updated JSON of the event details.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            date: { type: Type.STRING },
            time: { type: Type.STRING },
            location: { type: Type.STRING },
            guestCount: { type: Type.STRING },
            vibe: { type: Type.STRING },
            category: { type: Type.STRING },
          }
        }
      }
    });

    try {
      const extracted = JSON.parse(response.text || "{}");
      return { ...currentDraft, ...extracted };
    } catch (e) {
      console.error("Failed to parse Gemini response", e);
      return currentDraft;
    }
  }
};
