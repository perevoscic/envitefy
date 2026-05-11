export type MockDashboardRsvps = {
  yes: number;
  no: number;
  maybe: number;
  noResponse: number;
};

export type MockDashboardEvent = {
  id: string;
  title: string;
  type: string;
  status: "Draft" | "Published" | "Upcoming" | "Past";
  date: string;
  time: string;
  location: string;
  rsvps: MockDashboardRsvps;
  views: number;
  completionScore: number;
  lastUpdated: string;
  needsAttention: string[];
};

export type MockDashboardActivity = {
  id: string;
  type: "rsvp" | "view" | "update" | "concierge";
  message: string;
  timestamp: string;
};

export const shouldUseAdminDashboardMockData = process.env.NODE_ENV !== "production";

export const mockEvents: MockDashboardEvent[] = [
  {
    id: "evt_001",
    title: "Olivia's 7th Birthday Party",
    type: "Birthday",
    status: "Published",
    date: "2026-06-14",
    time: "2:00 PM",
    location: "Panama City Beach, FL",
    rsvps: {
      yes: 18,
      no: 3,
      maybe: 4,
      noResponse: 21,
    },
    views: 142,
    completionScore: 86,
    lastUpdated: "2026-05-10",
    needsAttention: ["Add parking details", "Send reminder to guests"],
  },
  {
    id: "evt_002",
    title: "Judith & David Baby Shower",
    type: "Baby Shower",
    status: "Draft",
    date: "2026-07-02",
    time: "11:00 AM",
    location: "League City, TX",
    rsvps: {
      yes: 8,
      no: 1,
      maybe: 2,
      noResponse: 30,
    },
    views: 67,
    completionScore: 62,
    lastUpdated: "2026-05-09",
    needsAttention: ["Add registry link", "Publish event"],
  },
  {
    id: "evt_003",
    title: "Emerald Coast Gymnastics Meet",
    type: "Gymnastics",
    status: "Published",
    date: "2026-08-18",
    time: "8:00 AM",
    location: "Destin, FL",
    rsvps: {
      yes: 64,
      no: 6,
      maybe: 9,
      noResponse: 18,
    },
    views: 489,
    completionScore: 91,
    lastUpdated: "2026-05-11",
    needsAttention: ["Add live results link"],
  },
];

export const mockActivity: MockDashboardActivity[] = [
  {
    id: "act_001",
    type: "rsvp",
    message: "Sophia RSVP'd Yes to Olivia's 7th Birthday Party",
    timestamp: "10 minutes ago",
  },
  {
    id: "act_002",
    type: "view",
    message: "12 guests viewed Emerald Coast Gymnastics Meet today",
    timestamp: "1 hour ago",
  },
  {
    id: "act_003",
    type: "update",
    message: "Registry link was added to Judith & David Baby Shower",
    timestamp: "Yesterday",
  },
  {
    id: "act_004",
    type: "concierge",
    message: "Concierge suggested adding parking information to Olivia's event",
    timestamp: "Yesterday",
  },
];

export const mockDashboardStats = {
  activeEvents: 3,
  upcomingEvents: 3,
  totalRsvps: 115,
  totalViews: 698,
  needsAttention: 4,
};

export const conciergePromptSuggestions = [
  "Write a reminder message",
  "Suggest missing event details",
  "Create RSVP follow-up text",
  "Generate a parking info section",
  "Create a registry helper message",
  "Improve event description",
  "Create a share caption",
];
