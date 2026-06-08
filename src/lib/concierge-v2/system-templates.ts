export type ConciergeV2SystemTemplate = {
  mode: string;
  eventType: string;
  name: string;
  description: string;
  titleTemplate: string;
  defaultFormSchema: Record<string, any>;
  defaultRsvpSchema: Record<string, any>;
  defaultReminders: Array<Record<string, any>>;
  defaultChecklist: Array<Record<string, any>>;
  defaultTheme: Record<string, any>;
};

function checklist(...items: string[]) {
  return items.map((title, index) => ({
    title,
    status: "todo",
    sortOrder: index + 1,
  }));
}

function reminders(...items: Array<{ title: string; offset: string }>) {
  return items.map((item) => ({
    title: item.title,
    offset: item.offset,
    channel: "email",
    status: "draft",
  }));
}

function rsvpSchema() {
  return {
    enabled: true,
    questions: [
      { key: "attending", label: "Can you attend?", type: "yes_no", required: true },
      { key: "notes", label: "Anything we should know?", type: "textarea", required: false },
    ],
  };
}

function signupForm(title: string, questions: Array<Record<string, any>> = []) {
  return {
    title,
    fields: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "email", label: "Email", type: "email", required: false },
      ...questions,
    ],
  };
}

export const CONCIERGE_V2_SYSTEM_TEMPLATES: ConciergeV2SystemTemplate[] = [
  {
    mode: "social",
    eventType: "birthday",
    name: "Birthday party",
    description: "RSVP, gift notes, food notes, reminders, and day-of checklist.",
    titleTemplate: "{{name}} birthday party",
    defaultFormSchema: signupForm("Birthday details", [
      { key: "food_allergies", label: "Food allergies", type: "textarea", required: false },
    ]),
    defaultRsvpSchema: rsvpSchema(),
    defaultReminders: reminders({ title: "RSVP reminder", offset: "-5d" }, { title: "Party day reminder", offset: "-1d" }),
    defaultChecklist: checklist("Confirm headcount", "Order cake or dessert", "Prepare favor bags", "Send day-before reminder"),
    defaultTheme: { accent: "violet", tone: "celebration" },
  },
  {
    mode: "social",
    eventType: "baby_shower",
    name: "Baby shower",
    description: "Guest RSVP, registry links, host notes, games, and gift tracking.",
    titleTemplate: "{{name}} baby shower",
    defaultFormSchema: signupForm("Shower guest notes"),
    defaultRsvpSchema: rsvpSchema(),
    defaultReminders: reminders({ title: "Registry reminder", offset: "-10d" }, { title: "Shower reminder", offset: "-2d" }),
    defaultChecklist: checklist("Add registry link", "Confirm host assignments", "Plan games", "Prepare thank-you list"),
    defaultTheme: { accent: "rose", tone: "warm" },
  },
  {
    mode: "social",
    eventType: "graduation",
    name: "Graduation celebration",
    description: "Ceremony details, party RSVP, parking notes, and family updates.",
    titleTemplate: "{{name}} graduation",
    defaultFormSchema: signupForm("Graduation RSVP"),
    defaultRsvpSchema: rsvpSchema(),
    defaultReminders: reminders({ title: "Ceremony details reminder", offset: "-3d" }),
    defaultChecklist: checklist("Add ceremony time", "Add party location", "Confirm parking notes", "Share photo instructions"),
    defaultTheme: { accent: "emerald", tone: "milestone" },
  },
  {
    mode: "social",
    eventType: "wedding_weekend",
    name: "Wedding weekend",
    description: "Weekend timeline, travel and hotel block notes, registry links, RSVP, reminders, and guest checklist.",
    titleTemplate: "{{coupleName}} wedding weekend",
    defaultFormSchema: signupForm("Wedding RSVP", [
      { key: "attending", label: "Can you attend?", type: "yes_no", required: true },
      { key: "guest_count", label: "Guest count", type: "number", required: false },
      { key: "meal_choice", label: "Meal choice", type: "select", required: false },
      { key: "travel_notes", label: "Travel or accessibility notes", type: "textarea", required: false },
    ]),
    defaultRsvpSchema: rsvpSchema(),
    defaultReminders: reminders({ title: "RSVP reminder", offset: "-14d" }, { title: "Weekend reminder", offset: "-3d" }),
    defaultChecklist: checklist("Add ceremony time", "Add reception time", "Add hotel block", "Add registry links", "Set RSVP deadline"),
    defaultTheme: { accent: "rose", tone: "formal" },
  },
  {
    mode: "school",
    eventType: "school_field_trip",
    name: "School field trip",
    description: "Permission forms, chaperone signup, payment notes, packing list, and reminders.",
    titleTemplate: "{{className}} field trip",
    defaultFormSchema: signupForm("Permission form", [
      { key: "emergency_contact", label: "Emergency contact", type: "text", required: true },
      { key: "permission", label: "I give permission", type: "checkbox", required: true },
    ]),
    defaultRsvpSchema: rsvpSchema(),
    defaultReminders: reminders({ title: "Permission form reminder", offset: "-7d" }, { title: "Pack list reminder", offset: "-1d" }),
    defaultChecklist: checklist("Collect permission forms", "Confirm chaperones", "Share lunch instructions", "Share bus timing"),
    defaultTheme: { accent: "sky", tone: "school" },
  },
  {
    mode: "school",
    eventType: "spirit_week",
    name: "Spirit week",
    description: "Daily themes, bring items, early dismissal notes, and parent reminders.",
    titleTemplate: "{{schoolName}} spirit week",
    defaultFormSchema: signupForm("Spirit week notes"),
    defaultRsvpSchema: { enabled: false, questions: [] },
    defaultReminders: reminders({ title: "Weekly overview", offset: "-2d" }, { title: "Daily theme reminder", offset: "-1d" }),
    defaultChecklist: checklist("Add each daily theme", "Add bring-item notes", "Confirm early dismissal", "Send weekly overview"),
    defaultTheme: { accent: "amber", tone: "school" },
  },
  {
    mode: "school",
    eventType: "class_party",
    name: "Class party",
    description: "Snack signup, volunteer roles, RSVP, allergy notes, and teacher reminders.",
    titleTemplate: "{{className}} class party",
    defaultFormSchema: signupForm("Class party signup", [
      { key: "can_bring", label: "What can you bring?", type: "textarea", required: false },
    ]),
    defaultRsvpSchema: rsvpSchema(),
    defaultReminders: reminders({ title: "Signup reminder", offset: "-5d" }, { title: "Party day reminder", offset: "-1d" }),
    defaultChecklist: checklist("Create snack slots", "Create volunteer slots", "Review allergy notes", "Send teacher update"),
    defaultTheme: { accent: "violet", tone: "classroom" },
  },
  {
    mode: "community",
    eventType: "fundraiser",
    name: "Fundraiser",
    description: "Donation links, volunteer shifts, RSVP, sponsor notes, and reminders.",
    titleTemplate: "{{organization}} fundraiser",
    defaultFormSchema: signupForm("Fundraiser volunteer form"),
    defaultRsvpSchema: rsvpSchema(),
    defaultReminders: reminders({ title: "Volunteer reminder", offset: "-3d" }),
    defaultChecklist: checklist("Add donation instructions", "Create volunteer shifts", "Confirm sponsor notes", "Send final reminder"),
    defaultTheme: { accent: "emerald", tone: "community" },
  },
  {
    mode: "gymnastics",
    eventType: "gymnastics_practice",
    name: "Gymnastics practice",
    description: "Recurring practice times, coaches, room/apparatus assignments, and attendance.",
    titleTemplate: "{{teamName}} practice",
    defaultFormSchema: signupForm("Practice attendance"),
    defaultRsvpSchema: { enabled: false, questions: [] },
    defaultReminders: reminders({ title: "Practice reminder", offset: "-1d" }),
    defaultChecklist: checklist("Confirm coach coverage", "Assign room or apparatus", "Track attendance", "Share gear notes"),
    defaultTheme: { accent: "violet", tone: "athletic" },
  },
  {
    mode: "gymnastics",
    eventType: "gymnastics_meet",
    name: "Gymnastics meet",
    description: "Sessions, travel, roster, coach notes, fees, reminders, and meet-day checklist.",
    titleTemplate: "{{meetName}}",
    defaultFormSchema: signupForm("Meet availability", [
      { key: "athlete_level", label: "Athlete level", type: "text", required: false },
    ]),
    defaultRsvpSchema: rsvpSchema(),
    defaultReminders: reminders({ title: "Meet packet reminder", offset: "-7d" }, { title: "Meet day reminder", offset: "-1d" }),
    defaultChecklist: checklist("Add sessions", "Add travel notes", "Confirm roster", "Assign coach coverage", "Share packing list"),
    defaultTheme: { accent: "violet", tone: "meet" },
  },
  {
    mode: "team",
    eventType: "team_dinner",
    name: "Team dinner",
    description: "Dinner RSVP, headcount, payment notes, allergy notes, and parent updates.",
    titleTemplate: "{{teamName}} team dinner",
    defaultFormSchema: signupForm("Dinner notes", [
      { key: "dietary_notes", label: "Dietary notes", type: "textarea", required: false },
    ]),
    defaultRsvpSchema: rsvpSchema(),
    defaultReminders: reminders({ title: "Dinner RSVP reminder", offset: "-3d" }),
    defaultChecklist: checklist("Confirm restaurant", "Collect headcount", "Share menu/payment notes", "Send reminder"),
    defaultTheme: { accent: "amber", tone: "team" },
  },
  {
    mode: "sports",
    eventType: "football_game_day",
    name: "Football game day",
    description: "Game schedule, field details, family RSVP, volunteer coverage, booster notes, and reminders.",
    titleTemplate: "{{teamName}} football schedule",
    defaultFormSchema: signupForm("Football family RSVP", [
      { key: "player_name", label: "Player name", type: "text", required: true },
      { key: "family_attending", label: "Family attending?", type: "yes_no", required: false },
      { key: "volunteer_interest", label: "Can you volunteer?", type: "yes_no", required: false },
    ]),
    defaultRsvpSchema: rsvpSchema(),
    defaultReminders: reminders({ title: "Game week reminder", offset: "-5d" }, { title: "Game day reminder", offset: "-1d" }),
    defaultChecklist: checklist("Add game dates and opponents", "Confirm field details", "Create volunteer roles", "Send family reminder"),
    defaultTheme: { accent: "emerald", tone: "team" },
  },
  {
    mode: "sports",
    eventType: "sports_team_schedule",
    name: "Team sports schedule",
    description: "Season schedule, attendance, volunteer roles, venue notes, and family reminders.",
    titleTemplate: "{{teamName}} team schedule",
    defaultFormSchema: signupForm("Team family RSVP", [
      { key: "player_name", label: "Player name", type: "text", required: true },
      { key: "family_attending", label: "Family attending?", type: "yes_no", required: false },
      { key: "volunteer_interest", label: "Can you volunteer?", type: "yes_no", required: false },
    ]),
    defaultRsvpSchema: rsvpSchema(),
    defaultReminders: reminders({ title: "Schedule reminder", offset: "-5d" }, { title: "Game day reminder", offset: "-1d" }),
    defaultChecklist: checklist("Add schedule dates", "Confirm venues", "Create volunteer roles", "Send family reminder"),
    defaultTheme: { accent: "emerald", tone: "team" },
  },
  {
    mode: "team",
    eventType: "uniform_pickup",
    name: "Uniform pickup",
    description: "Pickup windows, size notes, volunteer coverage, and reminder messages.",
    titleTemplate: "{{teamName}} uniform pickup",
    defaultFormSchema: signupForm("Uniform pickup notes", [
      { key: "size_notes", label: "Size notes", type: "textarea", required: false },
    ]),
    defaultRsvpSchema: { enabled: true, questions: [{ key: "pickup_window", label: "Preferred pickup window", type: "text", required: false }] },
    defaultReminders: reminders({ title: "Uniform pickup reminder", offset: "-2d" }),
    defaultChecklist: checklist("Add pickup windows", "Confirm inventory", "Assign volunteer coverage", "Send pickup reminder"),
    defaultTheme: { accent: "slate", tone: "team" },
  },
  {
    mode: "team",
    eventType: "fee_deadline",
    name: "Fee deadline",
    description: "Manual payment tracking, due date reminders, waiver notes, and status review.",
    titleTemplate: "{{programName}} fee deadline",
    defaultFormSchema: signupForm("Fee notes"),
    defaultRsvpSchema: { enabled: false, questions: [] },
    defaultReminders: reminders({ title: "Fee due reminder", offset: "-5d" }, { title: "Final fee reminder", offset: "-1d" }),
    defaultChecklist: checklist("Add payment request", "Confirm due date", "Review unpaid families", "Send final reminder"),
    defaultTheme: { accent: "rose", tone: "operations" },
  },
  {
    mode: "business",
    eventType: "workshop_open_house",
    name: "Workshop or open house",
    description: "Registration, room/resources, attendee reminders, check-in, and follow-up.",
    titleTemplate: "{{businessName}} workshop",
    defaultFormSchema: signupForm("Workshop registration", [
      { key: "organization", label: "Organization", type: "text", required: false },
    ]),
    defaultRsvpSchema: rsvpSchema(),
    defaultReminders: reminders({ title: "Registration reminder", offset: "-7d" }, { title: "Workshop reminder", offset: "-1d" }),
    defaultChecklist: checklist("Add registration form", "Assign room", "Prepare check-in list", "Send follow-up note"),
    defaultTheme: { accent: "slate", tone: "professional" },
  },
];
