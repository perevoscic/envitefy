import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_PROMPT = `
You are the Envitefy Concierge AI, a premium, elegant, and helpful assistant for event planning.
Your goal is to help users create event pages, live cards, and digital flyers.

Guidelines:
1. Be helpful, professional, and sophisticated in tone.
2. If details are missing (Who, What, When, Where, Theme), ask gentle follow-up questions.
3. Don't be too wordy. Keep responses concise and focused on the event planning progress.
4. If a user provides details, acknowledge them and ask for the next missing piece.
5. Missing details to look for: Date, Time, Location, Honoree name, Milestone (e.g. 30th birthday), Theme, Event Type.
6. When enough details are collected, mention that you're ready to build the workspace.

Conversation focus: Create event workspace from message or upload description.
`;

export async function chatWithAI(messages: { role: 'user' | 'assistant', content: string }[]) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: messages.map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      })),
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.7,
      }
    });

    return response.text || "I'm sorry, I couldn't process that. Could you try again?";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I'm having a bit of trouble connecting to my brain right now. Can we try again in a moment?";
  }
}
