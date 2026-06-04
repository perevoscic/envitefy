export type ConciergeEventMode = "birthday" | "social" | "school" | "class" | "team" | "gymnastics" | "business" | "general";

export type ModeInput = {
  mode?: string | null;
  hubMode?: string | null;
  category?: string | null;
  title?: string | null;
  eventType?: string | null;
};

export type ResourceTypeOption = {
  key: string;
  label: string;
};

export type ResourceModeCopy = {
  mode: ConciergeEventMode;
  badge: string;
  navLabel: string;
  pageEyebrow: string;
  pageTitleFallback: string;
  pageSubtitle: string;
  boardTitle: string;
  boardSubtitle: string;
  assignmentTitle: string;
  assignmentSubtitle: string;
  addTitle: string;
  addSubtitle: string;
  addButton: string;
  assignButton: string;
  itemLabel: string;
  itemPlaceholder: string;
  typeLabel: string;
  capacityLabel: string;
  capacityPlaceholder: string;
  locationLabel: string;
  locationPlaceholder: string;
  notesLabel: string;
  emptyItemsTitle: string;
  emptyItemsDescription: string;
  emptyAssignmentsTitle: string;
  emptyAssignmentsDescription: string;
  attendanceTitle: string;
  attendanceSubtitle: string;
  emptyAttendanceTitle: string;
  emptyAttendanceDescription: string;
  metrics: {
    items: string;
    assignments: string;
    conflicts: string;
    attendance: string;
  };
  options: ResourceTypeOption[];
};

function normalizedText(value: string | null | undefined): string {
  return String(value || "")
    .trim()
    .toLowerCase();
}

export function resolveConciergeEventMode(input: ModeInput): ConciergeEventMode {
  const values = [input.mode, input.hubMode, input.category, input.eventType, input.title].map(normalizedText).join(" ");
  if (/\b(birthday|party|baby shower|bridal shower|wedding|gender reveal|anniversary|graduation)\b/.test(values)) {
    return values.includes("birthday") || values.includes("party") ? "birthday" : "social";
  }
  if (/\b(gymnastics|apparatus|meet|session|coach|roster)\b/.test(values)) return "gymnastics";
  if (/\b(team|sport|football|soccer|cheer|dance|practice)\b/.test(values)) return "team";
  if (/\b(class|school|teacher|student|field trip|spirit week|permission|classroom)\b/.test(values)) return "class";
  if (/\b(business|conference|workshop|speaker|registration|attendee)\b/.test(values)) return "business";
  return "general";
}

const socialOptions: ResourceTypeOption[] = [
  { key: "food", label: "Food" },
  { key: "decoration", label: "Decoration" },
  { key: "seating", label: "Tables and chairs" },
  { key: "helper", label: "Helper" },
  { key: "location", label: "Location" },
  { key: "parking", label: "Parking" },
  { key: "pool_access", label: "Pool access" },
  { key: "setup_item", label: "Setup item" },
  { key: "other", label: "Other" },
];

const gymnasticsOptions: ResourceTypeOption[] = [
  { key: "coach", label: "Coach" },
  { key: "room", label: "Room" },
  { key: "apparatus", label: "Apparatus" },
  { key: "equipment", label: "Equipment" },
  { key: "warmup_area", label: "Warmup area" },
  { key: "bus", label: "Bus" },
  { key: "hotel", label: "Hotel" },
  { key: "other", label: "Other" },
];

const schoolOptions: ResourceTypeOption[] = [
  { key: "snack", label: "Snack" },
  { key: "supply", label: "Supply" },
  { key: "volunteer", label: "Volunteer" },
  { key: "chaperone", label: "Chaperone" },
  { key: "classroom", label: "Classroom" },
  { key: "form", label: "Permission form" },
  { key: "other", label: "Other" },
];

const businessOptions: ResourceTypeOption[] = [
  { key: "venue", label: "Venue" },
  { key: "speaker", label: "Speaker" },
  { key: "materials", label: "Materials" },
  { key: "check_in", label: "Check-in" },
  { key: "catering", label: "Catering" },
  { key: "follow_up", label: "Follow-up" },
  { key: "other", label: "Other" },
];

export function getResourceModeCopy(mode: ConciergeEventMode): ResourceModeCopy {
  if (mode === "gymnastics" || mode === "team") {
    return {
      mode,
      badge: mode === "gymnastics" ? "Gymnastics / team" : "Team event",
      navLabel: "Resources",
      pageEyebrow: "Resources",
      pageTitleFallback: "Coaches, Equipment & Rooms",
      pageSubtitle: "Assign coaches, rooms, equipment, travel details, and track day-of check-in.",
      boardTitle: "Coaches, equipment, rooms, and travel",
      boardSubtitle: "Keep every coach, apparatus, room, bus, hotel, and day-of resource in one organized board.",
      assignmentTitle: "Assigned to schedule",
      assignmentSubtitle: "Match resources to practices, sessions, warmups, travel, and meet-day blocks.",
      addTitle: "Add resource",
      addSubtitle: "Add a coach, room, apparatus, bus, hotel, or equipment item this event needs.",
      addButton: "Add resource",
      assignButton: "Assign to schedule",
      itemLabel: "Resource name",
      itemPlaceholder: "Coach, vault, warmup room, bus, hotel",
      typeLabel: "Resource type",
      capacityLabel: "Capacity",
      capacityPlaceholder: "Athletes, seats, or room limit",
      locationLabel: "Location",
      locationPlaceholder: "Gym, room, hotel, or venue",
      notesLabel: "Notes",
      emptyItemsTitle: "No resources added yet",
      emptyItemsDescription:
        "Add coaches, rooms, equipment, apparatus, travel, or other resources before assigning them to sessions or meet-day blocks.",
      emptyAssignmentsTitle: "No resources assigned yet",
      emptyAssignmentsDescription:
        "Once resources exist, assign them to schedule items so everyone knows what is needed and when.",
      attendanceTitle: "Day-of check-in",
      attendanceSubtitle: "Track athlete or participant attendance for the selected session.",
      emptyAttendanceTitle: "No roster yet",
      emptyAttendanceDescription: "Add athletes or participants in the Hub before marking attendance.",
      metrics: {
        items: "Resources",
        assignments: "Assigned",
        conflicts: "Needs attention",
        attendance: "Checked in",
      },
      options: gymnasticsOptions,
    };
  }

  if (mode === "school" || mode === "class") {
    return {
      mode,
      badge: "School / class",
      navLabel: "Supplies",
      pageEyebrow: "Class Setup",
      pageTitleFallback: "Supplies & Volunteers",
      pageSubtitle: "Manage volunteers, supplies, forms, classroom details, and parent tasks.",
      boardTitle: "Supplies, volunteers, and classroom needs",
      boardSubtitle: "Track snacks, supplies, chaperones, permission forms, and parent helper roles.",
      assignmentTitle: "Assigned helpers and supplies",
      assignmentSubtitle: "Connect each item or helper to the right class activity, trip, or deadline.",
      addTitle: "Add class item or helper",
      addSubtitle: "Add anything families, teachers, or chaperones need to bring, complete, or cover.",
      addButton: "Add class item",
      assignButton: "Assign to schedule",
      itemLabel: "Item or helper name",
      itemPlaceholder: "Snacks, chaperone, permission slip, classroom supplies",
      typeLabel: "Type",
      capacityLabel: "Quantity",
      capacityPlaceholder: "How many are needed",
      locationLabel: "Classroom or location",
      locationPlaceholder: "Room 204, cafeteria, bus lane",
      notesLabel: "Parent notes",
      emptyItemsTitle: "No supplies or helpers added yet",
      emptyItemsDescription:
        "Add snacks, supplies, volunteers, chaperones, permission forms, or classroom notes so families know what is still needed.",
      emptyAssignmentsTitle: "No helpers or supplies assigned yet",
      emptyAssignmentsDescription:
        "After adding class needs, assign who is responsible and when it is needed.",
      attendanceTitle: "Student check-in",
      attendanceSubtitle: "Track student or participant attendance for the selected activity.",
      emptyAttendanceTitle: "No students added yet",
      emptyAttendanceDescription: "Add students or participants in the Hub before marking attendance.",
      metrics: {
        items: "Items needed",
        assignments: "Claimed",
        conflicts: "Needs attention",
        attendance: "Checked in",
      },
      options: schoolOptions,
    };
  }

  if (mode === "business") {
    return {
      mode,
      badge: "Business event",
      navLabel: "Setup",
      pageEyebrow: "Event Setup",
      pageTitleFallback: "Venue, Materials & Check-in",
      pageSubtitle: "Track event materials, venue needs, attendee check-in, and follow-up tasks.",
      boardTitle: "Event materials and venue needs",
      boardSubtitle: "Keep speakers, materials, catering, check-in, and follow-up items organized.",
      assignmentTitle: "Assigned to agenda",
      assignmentSubtitle: "Connect setup items to the right session, arrival window, or follow-up moment.",
      addTitle: "Add setup item",
      addSubtitle: "Add a venue need, material, speaker support item, check-in role, or follow-up task.",
      addButton: "Add setup item",
      assignButton: "Assign to agenda",
      itemLabel: "Setup item",
      itemPlaceholder: "Name badges, speaker kit, catering, check-in desk",
      typeLabel: "Type",
      capacityLabel: "Quantity",
      capacityPlaceholder: "How many are needed",
      locationLabel: "Location",
      locationPlaceholder: "Room, booth, venue area",
      notesLabel: "Notes",
      emptyItemsTitle: "No setup items added yet",
      emptyItemsDescription:
        "Add materials, venue needs, speakers, catering, check-in, or follow-up tasks so the event team can track readiness.",
      emptyAssignmentsTitle: "No setup items assigned yet",
      emptyAssignmentsDescription:
        "Assign setup items to agenda blocks so owners know what is needed and when.",
      attendanceTitle: "Check-in",
      attendanceSubtitle: "Track attendee check-in for the selected agenda item.",
      emptyAttendanceTitle: "No attendees added yet",
      emptyAttendanceDescription: "Add attendees or participants in the Hub before marking check-in.",
      metrics: {
        items: "Setup items",
        assignments: "Assigned",
        conflicts: "Needs attention",
        attendance: "Checked in",
      },
      options: businessOptions,
    };
  }

  return {
    mode,
    badge: mode === "birthday" ? "Birthday / social" : "Social event",
    navLabel: "Setup",
    pageEyebrow: "Party Setup",
    pageTitleFallback: "What This Event Needs",
    pageSubtitle: "Track the things you need for the party, who is helping, and what is ready.",
    boardTitle: "Party setup items",
    boardSubtitle: "Keep food, decorations, seating, helpers, parking, pool access, and setup notes in one place.",
    assignmentTitle: "Assigned helpers and setup items",
    assignmentSubtitle: "Connect each item to the right time so setup feels calm on event day.",
    addTitle: "Add setup item",
    addSubtitle: "Add anything the party needs, from food and decorations to helpers, parking, or pool access.",
    addButton: "Add setup item",
    assignButton: "Assign setup item",
    itemLabel: "Item name",
    itemPlaceholder: "Pizza, balloons, chairs, parking note, pool wristbands",
    typeLabel: "Category",
    capacityLabel: "Quantity",
    capacityPlaceholder: "How many are needed",
    locationLabel: "Location",
    locationPlaceholder: "Pool gate, patio, kitchen, parking area",
    notesLabel: "Notes",
    emptyItemsTitle: "No party setup items yet",
    emptyItemsDescription:
      "Add food, decorations, tables, chairs, helpers, parking notes, pool access, or setup tasks so everyone knows what is ready.",
    emptyAssignmentsTitle: "No helpers or setup items assigned yet",
    emptyAssignmentsDescription:
      "Once you add party supplies, helpers, rooms, or setup tasks, assign who is responsible and when it is needed.",
    attendanceTitle: "Guest check-in",
    attendanceSubtitle: "Track guest arrivals for the selected part of the event if you need day-of visibility.",
    emptyAttendanceTitle: "No guests or participants added yet",
    emptyAttendanceDescription: "Add guests, helpers, or participants in the Hub before using check-in.",
    metrics: {
      items: "Setup items",
      assignments: "Assigned",
      conflicts: "Needs attention",
      attendance: "Ready for day-of",
    },
    options: socialOptions,
  };
}

