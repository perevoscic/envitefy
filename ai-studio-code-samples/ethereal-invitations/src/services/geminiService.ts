import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface EventData {
  eventType: 'wedding' | 'birthday' | 'graduation' | 'corporate' | 'other';
  names: string;
  date: string;
  time: string;
  location: string;
  description: string;
  rsvp?: {
    contact: string;
    phone?: string;
  };
  calendarData: {
    title: string;
    startIso: string;
    endIso: string;
    location: string;
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  style: string;
}

export async function extractEventData(base64Image: string): Promise<EventData | null> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Image.split(",")[1],
          },
        },
        {
          text: "Analyze this event invitation flyer. Identify the event type (wedding, birthday, etc.), the main subject/names, date, time, and full location. Also find any RSVP instructions (who to contact and their phone number/method). Provide a machine-readable object for a calendar event: 'title', 'startIso' and 'endIso' (ISO 8601 strings, assume duration is 3 hours for birthdays and 5 hours for weddings if not specified), and 'location'. CRITICAL: Extract the EXACT dominant color palette from the image. For vibrant flyers (like kids birthdays), capture those saturated pinks, cyans, oranges or purples. Use hex codes for primary, secondary, accent, background (a complementary light tone), and text. Return the result in JSON format.",
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            eventType: { 
              type: Type.STRING,
              enum: ['wedding', 'birthday', 'graduation', 'corporate', 'other']
            },
            names: { type: Type.STRING },
            date: { type: Type.STRING },
            time: { type: Type.STRING },
            location: { type: Type.STRING },
            description: { type: Type.STRING },
            rsvp: {
              type: Type.OBJECT,
              properties: {
                contact: { type: Type.STRING },
                phone: { type: Type.STRING },
              },
              required: ["contact"]
            },
            calendarData: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                startIso: { type: Type.STRING },
                endIso: { type: Type.STRING },
                location: { type: Type.STRING },
              },
              required: ["title", "startIso", "endIso", "location"],
            },
            colors: {
              type: Type.OBJECT,
              properties: {
                primary: { type: Type.STRING },
                secondary: { type: Type.STRING },
                accent: { type: Type.STRING },
                background: { type: Type.STRING },
                text: { type: Type.STRING },
              },
              required: ["primary", "secondary", "accent", "background", "text"],
            },
            style: { type: Type.STRING },
          },
          required: ["eventType", "names", "date", "time", "location", "description", "calendarData", "colors", "style"],
        },
      },
    });

    if (!response.text) return null;
    return JSON.parse(response.text) as EventData;
  } catch (error) {
    console.error("Error extracting event data:", error);
    return null;
  }
}
