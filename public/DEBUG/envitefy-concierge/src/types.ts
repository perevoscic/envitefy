export enum CelebrationType {
  BIRTHDAY = "Birthday",
  WEDDING = "Wedding",
  BRIDAL_SHOWER = "Bridal Shower",
  BABY_SHOWER = "Baby Shower",
  GAME_DAY = "Game Day",
  FIELD_TRIP = "Field Trip/Day",
  OPEN_HOUSE = "Open House",
  HOUSEWARMING = "Housewarming",
  CUSTOM = "Custom Invite",
  UPLOAD = "Upload Your Invite"
}

export enum ProductType {
  LIVE_CARD = "Live Card",
  FLYER = "Flyer",
  EVENT_PAGE = "Event Page",
  RSVP_PAGE = "RSVP Page",
  WHATSAPP = "WhatsApp",
  TEXT_MESSAGE = "Text Message",
  PRINTABLE_FLYER = "Printable Flyer"
}

export interface RSVP {
  id: string;
  name: string;
  email: string;
  status: "attending" | "not_attending" | "maybe";
  timestamp: string;
}

export interface ConciergeEventDraft {
  id?: string;
  category?: CelebrationType;
  title?: string;
  description?: string;
  date?: string;
  time?: string;
  location?: string;
  guestCount?: string;
  vibe?: string;
  productType?: ProductType;
  rsvps?: RSVP[];
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface Thread {
  id: string;
  title: string;
  createdAt: string;
  messages: Message[];
  status: "idle" | "chatting" | "generating" | "generated";
  draft?: ConciergeEventDraft;
  generatedEventId?: string;
}
