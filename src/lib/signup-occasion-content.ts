import type { SignupFormSlot } from "@/types/signup";

// Fictional preview examples only; new builders continue to start empty.
export type SignupOccasionContent = {
  profile:
    | "volunteers"
    | "supplies"
    | "potluck"
    | "team"
    | "meeting"
    | "celebration"
    | "fundraiser";
  school: boolean;
  welcome: string;
  section: string;
  instructions: string;
  slots: Omit<SignupFormSlot, "id">[];
  question: string;
  multiple: boolean;
  date: string;
  startTime: string;
  endTime: string;
};

export const SIGNUP_OCCASION_CONTENT: Record<string, SignupOccasionContent> = {
  "school-and-education--parent-teacher-conferences": {
    profile: "meeting",
    school: true,
    welcome:
      "Choose one appointment to meet with your teacher and talk about your student's progress.",
    section: "Conference appointments",
    instructions:
      "Reserve one appointment per family. Contact the teacher if you need a different time.",
    slots: [
      {
        label: "1:00–1:15 PM appointment",
        capacity: 1,
        notes: "A 15-minute conversation with the teacher.",
        startTime: "13:00",
        endTime: "13:15",
      },
      {
        label: "2:00–2:15 PM appointment",
        capacity: 1,
        notes: "A 15-minute conversation with the teacher.",
        startTime: "14:00",
        endTime: "14:15",
      },
      {
        label: "3:00–3:15 PM appointment",
        capacity: 1,
        notes: "A 15-minute conversation with the teacher.",
        startTime: "15:00",
        endTime: "15:15",
      },
      {
        label: "4:00–4:15 PM appointment",
        capacity: 1,
        notes: "A 15-minute conversation with the teacher.",
        startTime: "16:00",
        endTime: "16:15",
      },
    ],
    question: "What would you like to discuss with the teacher?",
    multiple: false,
    date: "2028-09-16",
    startTime: "13:00",
    endTime: "17:00",
  },
  "school-and-education--classroom-reading-volunteers": {
    profile: "volunteers",
    school: true,
    welcome:
      "Help make classroom reading volunteers a shared effort. Choose a contribution or helping role below.",
    section: "Read with our class",
    instructions:
      "Choose an item or role below. The organizing team will confirm arrival times, quantities, and any role requirements.",
    slots: [
      {
        label: "Morning read-aloud helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Afternoon reading buddy",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Book basket organizer",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Reading corner helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
    ],
    question: "Is there anything the organizing team should know about your contribution or role?",
    multiple: true,
    date: "2028-09-16",
    startTime: "09:00",
    endTime: "12:00",
  },
  "school-and-education--school-book-fair": {
    profile: "volunteers",
    school: true,
    welcome:
      "Help make school book fair a shared effort. Choose a contribution or helping role below.",
    section: "Book fair helpers",
    instructions:
      "Choose an item or role below. The organizing team will confirm arrival times, quantities, and any role requirements.",
    slots: [
      {
        label: "Morning checkout helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Afternoon checkout helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Restock book displays",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Pack up the fair",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
    ],
    question: "Is there anything the organizing team should know about your contribution or role?",
    multiple: true,
    date: "2028-09-16",
    startTime: "09:00",
    endTime: "12:00",
  },
  "school-and-education--school-field-day": {
    profile: "volunteers",
    school: true,
    welcome:
      "Help make school field day a shared effort. Choose a contribution or helping role below.",
    section: "Field day stations",
    instructions:
      "Choose an item or role below. The organizing team will confirm arrival times, quantities, and any role requirements.",
    slots: [
      {
        label: "Relay station helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Beanbag game helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Water station helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Equipment cleanup",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
    ],
    question: "Is there anything the organizing team should know about your contribution or role?",
    multiple: true,
    date: "2028-09-16",
    startTime: "09:00",
    endTime: "12:00",
  },
  "school-and-education--teacher-appreciation-breakfast": {
    profile: "potluck",
    school: true,
    welcome:
      "Help make teacher appreciation breakfast a shared effort. Choose a contribution or helping role below.",
    section: "Treat our teachers",
    instructions:
      "Choose a contribution or helping role. Label food ingredients and follow the host's serving and drop-off instructions.",
    slots: [
      {
        label: "Bagels and spreads",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Fresh fruit platter",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Coffee and tea supplies",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Breakfast setup helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
    ],
    question: "What will you bring, and which ingredients should guests know about?",
    multiple: true,
    date: "2028-09-16",
    startTime: "09:00",
    endTime: "12:00",
  },
  "school-and-education--classroom-supply-drive": {
    profile: "supplies",
    school: true,
    welcome:
      "Help make classroom supply drive a shared effort. Choose a contribution or helping role below.",
    section: "Classroom supplies",
    instructions:
      "Choose an item or role below. The organizing team will confirm arrival times, quantities, and any role requirements.",
    slots: [
      {
        label: "Pencils, one box",
        capacity: 5,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Glue sticks, one pack",
        capacity: 5,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Drawing paper, one ream",
        capacity: 5,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Tissues, two boxes",
        capacity: 5,
        notes: "The organizer will share the details before the event.",
      },
    ],
    question: "Is there anything the organizing team should know about your contribution or role?",
    multiple: true,
    date: "2028-09-16",
    startTime: "09:00",
    endTime: "12:00",
  },
  "school-and-education--field-trip-chaperones": {
    profile: "volunteers",
    school: true,
    welcome:
      "Help make field trip chaperones a shared effort. Choose a contribution or helping role below.",
    section: "Field trip helpers",
    instructions:
      "Choose an item or role below. The organizing team will confirm arrival times, quantities, and any role requirements.",
    slots: [
      {
        label: "Morning check-in helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Chaperone interest list",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Lunch distribution helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Return check-in helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
    ],
    question: "Is there anything the organizing team should know about your contribution or role?",
    multiple: true,
    date: "2028-09-16",
    startTime: "09:00",
    endTime: "12:00",
  },
  "school-and-education--school-science-fair": {
    profile: "volunteers",
    school: true,
    welcome:
      "Help make school science fair a shared effort. Choose a contribution or helping role below.",
    section: "Science fair team",
    instructions:
      "Choose an item or role below. The organizing team will confirm arrival times, quantities, and any role requirements.",
    slots: [
      {
        label: "Display setup helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Project welcome desk",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Judge interest list",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Room cleanup helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
    ],
    question: "Is there anything the organizing team should know about your contribution or role?",
    multiple: true,
    date: "2028-09-16",
    startTime: "09:00",
    endTime: "12:00",
  },
  "school-and-education--school-art-show": {
    profile: "volunteers",
    school: true,
    welcome:
      "Help make school art show a shared effort. Choose a contribution or helping role below.",
    section: "Art show helpers",
    instructions:
      "Choose an item or role below. The organizing team will confirm arrival times, quantities, and any role requirements.",
    slots: [
      {
        label: "Hang artwork",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Welcome families",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Refreshment table helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Take down displays",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
    ],
    question: "Is there anything the organizing team should know about your contribution or role?",
    multiple: true,
    date: "2028-09-16",
    startTime: "09:00",
    endTime: "12:00",
  },
  "school-and-education--school-carnival": {
    profile: "volunteers",
    school: true,
    welcome:
      "Help make school carnival a shared effort. Choose a contribution or helping role below.",
    section: "Carnival booths",
    instructions:
      "Choose an item or role below. The organizing team will confirm arrival times, quantities, and any role requirements.",
    slots: [
      {
        label: "Ring toss booth helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Prize table helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Ticket table helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Carnival cleanup",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
    ],
    question: "Is there anything the organizing team should know about your contribution or role?",
    multiple: true,
    date: "2028-09-16",
    startTime: "09:00",
    endTime: "12:00",
  },
  "school-and-education--school-talent-show": {
    profile: "volunteers",
    school: true,
    welcome:
      "Help make school talent show a shared effort. Choose a contribution or helping role below.",
    section: "Talent show crew",
    instructions:
      "Choose an item or role below. The organizing team will confirm arrival times, quantities, and any role requirements.",
    slots: [
      {
        label: "Performer check-in",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Backstage helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Audience welcome helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Stage reset crew",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
    ],
    question: "Is there anything the organizing team should know about your contribution or role?",
    multiple: true,
    date: "2028-09-16",
    startTime: "09:00",
    endTime: "12:00",
  },
  "school-and-education--school-musical-backstage-crew": {
    profile: "volunteers",
    school: true,
    welcome:
      "Help make school musical backstage crew a shared effort. Choose a contribution or helping role below.",
    section: "Backstage roles",
    instructions:
      "Choose an item or role below. The organizing team will confirm arrival times, quantities, and any role requirements.",
    slots: [
      {
        label: "Costume helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Props table helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Stage crew interest list",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Lobby welcome helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
    ],
    question: "Is there anything the organizing team should know about your contribution or role?",
    multiple: true,
    date: "2028-09-16",
    startTime: "09:00",
    endTime: "12:00",
  },
  "school-and-education--school-band-concert": {
    profile: "volunteers",
    school: true,
    welcome:
      "Help make school band concert a shared effort. Choose a contribution or helping role below.",
    section: "Concert helpers",
    instructions:
      "Choose an item or role below. The organizing team will confirm arrival times, quantities, and any role requirements.",
    slots: [
      {
        label: "Chair and stand setup",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Program table helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Refreshment helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Instrument loading helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
    ],
    question: "Is there anything the organizing team should know about your contribution or role?",
    multiple: true,
    date: "2028-09-16",
    startTime: "09:00",
    endTime: "12:00",
  },
  "school-and-education--school-robotics-tournament": {
    profile: "volunteers",
    school: true,
    welcome:
      "Help make school robotics tournament a shared effort. Choose a contribution or helping role below.",
    section: "Robotics tournament crew",
    instructions:
      "Choose an item or role below. The organizing team will confirm arrival times, quantities, and any role requirements.",
    slots: [
      {
        label: "Team check-in",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Practice area helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Field reset volunteer",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Parts and supplies helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
    ],
    question: "Is there anything the organizing team should know about your contribution or role?",
    multiple: true,
    date: "2028-09-16",
    startTime: "09:00",
    endTime: "12:00",
  },
  "school-and-education--school-stem-night": {
    profile: "volunteers",
    school: true,
    welcome:
      "Help make school stem night a shared effort. Choose a contribution or helping role below.",
    section: "STEM activity stations",
    instructions:
      "Choose an item or role below. The organizing team will confirm arrival times, quantities, and any role requirements.",
    slots: [
      {
        label: "Bridge building helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Circuit station helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Building challenge helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Family welcome desk",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
    ],
    question: "Is there anything the organizing team should know about your contribution or role?",
    multiple: true,
    date: "2028-09-16",
    startTime: "09:00",
    endTime: "12:00",
  },
  "school-and-education--family-math-night": {
    profile: "volunteers",
    school: true,
    welcome:
      "Help make family math night a shared effort. Choose a contribution or helping role below.",
    section: "Math night stations",
    instructions:
      "Choose an item or role below. The organizing team will confirm arrival times, quantities, and any role requirements.",
    slots: [
      {
        label: "Shape puzzle helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Counting game helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Measurement station helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Welcome families",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
    ],
    question: "Is there anything the organizing team should know about your contribution or role?",
    multiple: true,
    date: "2028-09-16",
    startTime: "09:00",
    endTime: "12:00",
  },
  "school-and-education--school-multicultural-night": {
    profile: "potluck",
    school: true,
    welcome:
      "Help make school multicultural night a shared effort. Choose a contribution or helping role below.",
    section: "Share a family tradition",
    instructions:
      "Choose a contribution or helping role. Label food ingredients and follow the host's serving and drop-off instructions.",
    slots: [
      {
        label: "Family dish to share",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Table display helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Welcome desk helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Room setup and cleanup",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
    ],
    question: "What will you bring, and which ingredients should guests know about?",
    multiple: true,
    date: "2028-09-16",
    startTime: "09:00",
    endTime: "12:00",
  },
  "school-and-education--school-picture-day": {
    profile: "volunteers",
    school: true,
    welcome:
      "Help make school picture day a shared effort. Choose a contribution or helping role below.",
    section: "Picture day helpers",
    instructions:
      "Choose an item or role below. The organizing team will confirm arrival times, quantities, and any role requirements.",
    slots: [
      {
        label: "Morning class escort",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Afternoon class escort",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Check-in table helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Backdrop setup helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
    ],
    question: "Is there anything the organizing team should know about your contribution or role?",
    multiple: true,
    date: "2028-09-16",
    startTime: "09:00",
    endTime: "12:00",
  },
  "school-and-education--school-library-helpers": {
    profile: "volunteers",
    school: true,
    welcome:
      "Help make school library helpers a shared effort. Choose a contribution or helping role below.",
    section: "Library helping hands",
    instructions:
      "Choose an item or role below. The organizing team will confirm arrival times, quantities, and any role requirements.",
    slots: [
      {
        label: "Morning book shelving",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Afternoon book shelving",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Book repair helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Reading display helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
    ],
    question: "Is there anything the organizing team should know about your contribution or role?",
    multiple: true,
    date: "2028-09-16",
    startTime: "09:00",
    endTime: "12:00",
  },
  "school-and-education--school-garden-volunteers": {
    profile: "volunteers",
    school: true,
    welcome:
      "Help make school garden volunteers a shared effort. Choose a contribution or helping role below.",
    section: "School garden jobs",
    instructions:
      "Choose an item or role below. The organizing team will confirm arrival times, quantities, and any role requirements.",
    slots: [
      {
        label: "Planting helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Watering helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Weeding helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Tool cleanup helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
    ],
    question: "Is there anything the organizing team should know about your contribution or role?",
    multiple: true,
    date: "2028-09-16",
    startTime: "09:00",
    endTime: "12:00",
  },
  "school-and-education--school-lunchroom-volunteers": {
    profile: "volunteers",
    school: true,
    welcome:
      "Help make school lunchroom volunteers a shared effort. Choose a contribution or helping role below.",
    section: "Lunchroom helpers",
    instructions:
      "Choose an item or role below. The organizing team will confirm arrival times, quantities, and any role requirements.",
    slots: [
      {
        label: "Early lunch helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Late lunch helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Tray return helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Table reset helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
    ],
    question: "Is there anything the organizing team should know about your contribution or role?",
    multiple: true,
    date: "2028-09-16",
    startTime: "09:00",
    endTime: "12:00",
  },
  "school-and-education--school-pta-meeting": {
    profile: "meeting",
    school: true,
    welcome:
      "Help make school pta meeting a shared effort. Choose a contribution or helping role below.",
    section: "PTA meeting roles",
    instructions:
      "Choose an item or role below. The organizing team will confirm arrival times, quantities, and any role requirements.",
    slots: [
      {
        label: "Welcome and check-in",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Notes volunteer",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Refreshment helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Room setup helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
    ],
    question: "Is there anything the organizing team should know about your contribution or role?",
    multiple: true,
    date: "2028-09-16",
    startTime: "09:00",
    endTime: "12:00",
  },
  "school-and-education--school-family-bingo-night": {
    profile: "volunteers",
    school: true,
    welcome:
      "Help make school family bingo night a shared effort. Choose a contribution or helping role below.",
    section: "Bingo night helpers",
    instructions:
      "Choose an item or role below. The organizing team will confirm arrival times, quantities, and any role requirements.",
    slots: [
      {
        label: "Welcome table helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Game supply helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Prize table helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Snack table helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
    ],
    question: "Is there anything the organizing team should know about your contribution or role?",
    multiple: true,
    date: "2028-09-16",
    startTime: "09:00",
    endTime: "12:00",
  },
  "school-and-education--school-graduation-reception": {
    profile: "celebration",
    school: true,
    welcome:
      "Help make school graduation reception a shared effort. Choose a contribution or helping role below.",
    section: "Reception contributions",
    instructions:
      "Choose an item or role below. The organizing team will confirm arrival times, quantities, and any role requirements.",
    slots: [
      {
        label: "Dessert tray",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Drinks and cups",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Reception setup helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Reception cleanup helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
    ],
    question: "Is there anything the organizing team should know about your contribution or role?",
    multiple: true,
    date: "2028-09-16",
    startTime: "09:00",
    endTime: "12:00",
  },
  "school-and-education--school-uniform-swap": {
    profile: "volunteers",
    school: true,
    welcome:
      "Help make school uniform swap a shared effort. Choose a contribution or helping role below.",
    section: "Uniform swap helpers",
    instructions:
      "Choose an item or role below. The organizing team will confirm arrival times, quantities, and any role requirements.",
    slots: [
      {
        label: "Sort donated uniforms",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Welcome families",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Organize size tables",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Pack remaining uniforms",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
    ],
    question: "Is there anything the organizing team should know about your contribution or role?",
    multiple: true,
    date: "2028-09-16",
    startTime: "09:00",
    endTime: "12:00",
  },
  "church-and-community--community-park-cleanup": {
    profile: "volunteers",
    school: false,
    welcome:
      "Help make community park cleanup a shared effort. Choose a contribution or helping role below.",
    section: "Park cleanup roles",
    instructions:
      "Choose an item or role below. The organizing team will confirm arrival times, quantities, and any role requirements.",
    slots: [
      {
        label: "Path cleanup team",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Playground cleanup team",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Supply table helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Bag collection helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
    ],
    question: "Is there anything the organizing team should know about your contribution or role?",
    multiple: true,
    date: "2028-09-16",
    startTime: "09:00",
    endTime: "12:00",
  },
  "church-and-community--community-garden-workday": {
    profile: "volunteers",
    school: false,
    welcome:
      "Help make community garden workday a shared effort. Choose a contribution or helping role below.",
    section: "Garden workday jobs",
    instructions:
      "Choose an item or role below. The organizing team will confirm arrival times, quantities, and any role requirements.",
    slots: [
      {
        label: "Bed preparation",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Planting team",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Watering team",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Tool cleanup",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
    ],
    question: "Is there anything the organizing team should know about your contribution or role?",
    multiple: true,
    date: "2028-09-16",
    startTime: "09:00",
    endTime: "12:00",
  },
  "church-and-community--neighborhood-meal-train": {
    profile: "potluck",
    school: false,
    welcome:
      "Help make neighborhood meal train a shared effort. Choose a contribution or helping role below.",
    section: "Meals and delivery help",
    instructions:
      "Choose a contribution or helping role. Label food ingredients and follow the host's serving and drop-off instructions.",
    slots: [
      {
        label: "Main meal contribution",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Side dish contribution",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Fruit and snack contribution",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Meal delivery helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
    ],
    question: "What will you bring, and which ingredients should guests know about?",
    multiple: true,
    date: "2028-09-16",
    startTime: "09:00",
    endTime: "12:00",
  },
  "church-and-community--winter-coat-drive": {
    profile: "supplies",
    school: false,
    welcome:
      "Help make winter coat drive a shared effort. Choose a contribution or helping role below.",
    section: "Warm clothing contributions",
    instructions:
      "Choose an item or role below. The organizing team will confirm arrival times, quantities, and any role requirements.",
    slots: [
      {
        label: "Clean child coat",
        capacity: 5,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Clean adult coat",
        capacity: 5,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "New hat and mittens",
        capacity: 5,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Sorting volunteer",
        capacity: 5,
        notes: "The organizer will share the details before the event.",
      },
    ],
    question: "Is there anything the organizing team should know about your contribution or role?",
    multiple: true,
    date: "2028-11-18",
    startTime: "09:00",
    endTime: "12:00",
  },
  "church-and-community--community-blood-drive-helpers": {
    profile: "volunteers",
    school: false,
    welcome:
      "Help make community blood drive helpers a shared effort. Choose a contribution or helping role below.",
    section: "Support the donor welcome team",
    instructions:
      "Choose an item or role below. The organizing team will confirm arrival times, quantities, and any role requirements.",
    slots: [
      {
        label: "Morning welcome helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Afternoon welcome helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Refreshment table helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Room setup helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
    ],
    question: "Is there anything the organizing team should know about your contribution or role?",
    multiple: true,
    date: "2028-09-16",
    startTime: "09:00",
    endTime: "12:00",
  },
  "church-and-community--animal-shelter-volunteers": {
    profile: "volunteers",
    school: false,
    welcome:
      "Help make animal shelter volunteers a shared effort. Choose a contribution or helping role below.",
    section: "Shelter support roles",
    instructions:
      "Choose an item or role below. The organizing team will confirm arrival times, quantities, and any role requirements.",
    slots: [
      {
        label: "Laundry helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Donation sorting helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Toy preparation helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Approved handler interest list",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
    ],
    question: "Is there anything the organizing team should know about your contribution or role?",
    multiple: true,
    date: "2028-09-16",
    startTime: "09:00",
    endTime: "12:00",
  },
  "church-and-community--library-summer-reading": {
    profile: "volunteers",
    school: false,
    welcome:
      "Help make library summer reading a shared effort. Choose a contribution or helping role below.",
    section: "Summer reading helpers",
    instructions:
      "Choose an item or role below. The organizing team will confirm arrival times, quantities, and any role requirements.",
    slots: [
      {
        label: "Reading session helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Book table helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Craft table helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Welcome desk helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
    ],
    question: "Is there anything the organizing team should know about your contribution or role?",
    multiple: true,
    date: "2028-06-10",
    startTime: "09:00",
    endTime: "12:00",
  },
  "church-and-community--community-repair-cafe": {
    profile: "volunteers",
    school: false,
    welcome:
      "Help make community repair cafe a shared effort. Choose a contribution or helping role below.",
    section: "Repair cafe helpers",
    instructions:
      "Choose an item or role below. The organizing team will confirm arrival times, quantities, and any role requirements.",
    slots: [
      {
        label: "Welcome and item check-in",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Mending helper interest list",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Repair volunteer interest list",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Refreshment helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
    ],
    question: "Is there anything the organizing team should know about your contribution or role?",
    multiple: true,
    date: "2028-09-16",
    startTime: "09:00",
    endTime: "12:00",
  },
  "church-and-community--school-backpack-packing": {
    profile: "supplies",
    school: true,
    welcome:
      "Help make school backpack packing a shared effort. Choose a contribution or helping role below.",
    section: "Pack a backpack",
    instructions:
      "Choose an item or role below. The organizing team will confirm arrival times, quantities, and any role requirements.",
    slots: [
      {
        label: "New backpack",
        capacity: 5,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Notebook and pencil pack",
        capacity: 5,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Packing table helper",
        capacity: 5,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Distribution helper",
        capacity: 5,
        notes: "The organizer will share the details before the event.",
      },
    ],
    question: "Is there anything the organizing team should know about your contribution or role?",
    multiple: true,
    date: "2028-09-16",
    startTime: "09:00",
    endTime: "12:00",
  },
  "church-and-community--community-senior-luncheon": {
    profile: "potluck",
    school: false,
    welcome:
      "Help make community senior luncheon a shared effort. Choose a contribution or helping role below.",
    section: "Luncheon contributions",
    instructions:
      "Choose a contribution or helping role. Label food ingredients and follow the host's serving and drop-off instructions.",
    slots: [
      {
        label: "Soup or main dish",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Bread and salad",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Serving helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Table setup helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
    ],
    question: "What will you bring, and which ingredients should guests know about?",
    multiple: true,
    date: "2028-09-16",
    startTime: "09:00",
    endTime: "12:00",
  },
  "clubs-and-groups--scout-campout-helpers": {
    profile: "volunteers",
    school: false,
    welcome:
      "Help make scout campout helpers a shared effort. Choose a contribution or helping role below.",
    section: "Campout support",
    instructions:
      "Choose an item or role below. The organizing team will confirm arrival times, quantities, and any role requirements.",
    slots: [
      {
        label: "Meal preparation helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Equipment check helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Campsite setup helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Cleanup crew",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
    ],
    question: "Is there anything the organizing team should know about your contribution or role?",
    multiple: true,
    date: "2028-09-16",
    startTime: "09:00",
    endTime: "12:00",
  },
  "clubs-and-groups--youth-sports-concessions": {
    profile: "volunteers",
    school: false,
    welcome:
      "Help make youth sports concessions a shared effort. Choose a contribution or helping role below.",
    section: "Concession stand shifts",
    instructions:
      "Choose an item or role below. The organizing team will confirm arrival times, quantities, and any role requirements.",
    slots: [
      {
        label: "Opening setup crew",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Early concession shift",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Late concession shift",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Closing cleanup crew",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
    ],
    question: "Is there anything the organizing team should know about your contribution or role?",
    multiple: true,
    date: "2028-09-16",
    startTime: "09:00",
    endTime: "12:00",
  },
  "clubs-and-groups--youth-club-snack-rotation": {
    profile: "team",
    school: false,
    welcome:
      "Help make youth club snack rotation a shared effort. Choose a contribution or helping role below.",
    section: "Club snacks and supplies",
    instructions:
      "Choose a contribution or helping role. Label food ingredients and follow the host's serving and drop-off instructions.",
    slots: [
      {
        label: "Fresh fruit",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Individually wrapped snacks",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Water and cups",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Snack table helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
    ],
    question: "What will you bring, and which ingredients should guests know about?",
    multiple: true,
    date: "2028-09-16",
    startTime: "09:00",
    endTime: "12:00",
  },
  "clubs-and-groups--youth-service-day": {
    profile: "volunteers",
    school: false,
    welcome:
      "Help make youth service day a shared effort. Choose a contribution or helping role below.",
    section: "Service day teams",
    instructions:
      "Choose an item or role below. The organizing team will confirm arrival times, quantities, and any role requirements.",
    slots: [
      {
        label: "Supply packing team",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Garden helper team",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Donation sorting team",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Check-in helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
    ],
    question: "Is there anything the organizing team should know about your contribution or role?",
    multiple: true,
    date: "2028-09-16",
    startTime: "09:00",
    endTime: "12:00",
  },
  "clubs-and-groups--booster-club-pancake-breakfast": {
    profile: "fundraiser",
    school: false,
    welcome:
      "Help make booster club pancake breakfast a shared effort. Choose a contribution or helping role below.",
    section: "Breakfast volunteer team",
    instructions:
      "Choose an item or role below. The organizing team will confirm arrival times, quantities, and any role requirements.",
    slots: [
      {
        label: "Kitchen helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Serving line helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Coffee table helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Dining room cleanup",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
    ],
    question: "Is there anything the organizing team should know about your contribution or role?",
    multiple: true,
    date: "2028-09-16",
    startTime: "09:00",
    endTime: "12:00",
  },
  "winter-and-holidays--classroom-christmas-party": {
    profile: "celebration",
    school: true,
    welcome:
      "Help make classroom christmas party a shared effort. Choose a contribution or helping role below.",
    section: "Class party contributions",
    instructions:
      "Choose an item or role below. The organizing team will confirm arrival times, quantities, and any role requirements.",
    slots: [
      {
        label: "Fruit and snack tray",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Craft supplies",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Party activity helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Classroom cleanup helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
    ],
    question: "Is there anything the organizing team should know about your contribution or role?",
    multiple: true,
    date: "2028-12-16",
    startTime: "09:00",
    endTime: "12:00",
  },
  "winter-and-holidays--school-winter-celebration": {
    profile: "celebration",
    school: true,
    welcome:
      "Help make school winter celebration a shared effort. Choose a contribution or helping role below.",
    section: "Winter celebration helpers",
    instructions:
      "Choose an item or role below. The organizing team will confirm arrival times, quantities, and any role requirements.",
    slots: [
      {
        label: "Winter craft supplies",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Snack contribution",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Activity station helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Cleanup helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
    ],
    question: "Is there anything the organizing team should know about your contribution or role?",
    multiple: true,
    date: "2028-12-16",
    startTime: "09:00",
    endTime: "12:00",
  },
  "winter-and-holidays--community-christmas-dinner": {
    profile: "potluck",
    school: false,
    welcome:
      "Help make community christmas dinner a shared effort. Choose a contribution or helping role below.",
    section: "Christmas dinner contributions",
    instructions:
      "Choose a contribution or helping role. Label food ingredients and follow the host's serving and drop-off instructions.",
    slots: [
      {
        label: "Main dish to share",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Vegetable side dish",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Dessert to share",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Serving and cleanup helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
    ],
    question: "What will you bring, and which ingredients should guests know about?",
    multiple: true,
    date: "2028-12-16",
    startTime: "09:00",
    endTime: "12:00",
  },
  "winter-and-holidays--holiday-cookie-exchange": {
    profile: "potluck",
    school: false,
    welcome:
      "Help make holiday cookie exchange a shared effort. Choose a contribution or helping role below.",
    section: "Cookie exchange contributions",
    instructions:
      "Choose a contribution or helping role. Label food ingredients and follow the host's serving and drop-off instructions.",
    slots: [
      {
        label: "Cookie batch, two dozen",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Ingredient label supplies",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Take-home boxes",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Table setup helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
    ],
    question: "What will you bring, and which ingredients should guests know about?",
    multiple: true,
    date: "2028-12-16",
    startTime: "09:00",
    endTime: "12:00",
  },
  "winter-and-holidays--christmas-toy-drive": {
    profile: "supplies",
    school: false,
    welcome:
      "Help make christmas toy drive a shared effort. Choose a contribution or helping role below.",
    section: "Toy drive contributions",
    instructions:
      "Choose an item or role below. The organizing team will confirm arrival times, quantities, and any role requirements.",
    slots: [
      {
        label: "New toy for ages 3–5",
        capacity: 5,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "New toy for ages 6–8",
        capacity: 5,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "New toy for ages 9–12",
        capacity: 5,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Sorting and packing helper",
        capacity: 5,
        notes: "The organizer will share the details before the event.",
      },
    ],
    question: "Is there anything the organizing team should know about your contribution or role?",
    multiple: true,
    date: "2028-12-16",
    startTime: "09:00",
    endTime: "12:00",
  },
  "winter-and-holidays--holiday-gift-wrapping": {
    profile: "volunteers",
    school: false,
    welcome:
      "Help make holiday gift wrapping a shared effort. Choose a contribution or helping role below.",
    section: "Gift wrapping helpers",
    instructions:
      "Choose an item or role below. The organizing team will confirm arrival times, quantities, and any role requirements.",
    slots: [
      {
        label: "Early wrapping shift",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Late wrapping shift",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Paper and ribbon supplies",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Welcome desk helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
    ],
    question: "Is there anything the organizing team should know about your contribution or role?",
    multiple: true,
    date: "2028-12-16",
    startTime: "09:00",
    endTime: "12:00",
  },
  "winter-and-holidays--hanukkah-community-potluck": {
    profile: "potluck",
    school: false,
    welcome:
      "Help make hanukkah community potluck a shared effort. Choose a contribution or helping role below.",
    section: "Potluck contributions",
    instructions:
      "Choose a contribution or helping role. Label food ingredients and follow the host's serving and drop-off instructions.",
    slots: [
      {
        label: "Main dish to share",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Side dish to share",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Dessert to share",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Table setup helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
    ],
    question: "What will you bring, and which ingredients should guests know about?",
    multiple: true,
    date: "2028-12-16",
    startTime: "09:00",
    endTime: "12:00",
  },
  "winter-and-holidays--school-valentine-party": {
    profile: "celebration",
    school: true,
    welcome:
      "Help make school valentine party a shared effort. Choose a contribution or helping role below.",
    section: "Valentine party helpers",
    instructions:
      "Choose an item or role below. The organizing team will confirm arrival times, quantities, and any role requirements.",
    slots: [
      {
        label: "Paper and craft supplies",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Class snack contribution",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Craft station helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Classroom cleanup helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
    ],
    question: "Is there anything the organizing team should know about your contribution or role?",
    multiple: true,
    date: "2028-02-14",
    startTime: "09:00",
    endTime: "12:00",
  },
  "fall-and-seasonal--school-trunk-or-treat": {
    profile: "volunteers",
    school: true,
    welcome:
      "Help make school trunk-or-treat a shared effort. Choose a contribution or helping role below.",
    section: "Trunk-or-treat helpers",
    instructions:
      "Choose an item or role below. The organizing team will confirm arrival times, quantities, and any role requirements.",
    slots: [
      {
        label: "Decorated trunk space",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Wrapped candy donation",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Welcome table helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Cleanup team",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
    ],
    question: "Is there anything the organizing team should know about your contribution or role?",
    multiple: true,
    date: "2028-10-28",
    startTime: "09:00",
    endTime: "12:00",
  },
  "church-and-community--community-egg-hunt": {
    profile: "volunteers",
    school: false,
    welcome:
      "Help make community egg hunt a shared effort. Choose a contribution or helping role below.",
    section: "Egg hunt helpers",
    instructions:
      "Choose an item or role below. The organizing team will confirm arrival times, quantities, and any role requirements.",
    slots: [
      {
        label: "Egg filling helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Egg hiding helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Welcome table helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
      {
        label: "Park cleanup helper",
        capacity: 2,
        notes: "The organizer will share the details before the event.",
      },
    ],
    question: "Is there anything the organizing team should know about your contribution or role?",
    multiple: true,
    date: "2028-04-08",
    startTime: "09:00",
    endTime: "12:00",
  },
};
