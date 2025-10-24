export type SignupFormSlot = {
  id: string;
  label: string;
  capacity: number | null;
  startTime?: string | null;
  endTime?: string | null;
  notes?: string | null;
};

export type SignupFormSection = {
  id: string;
  title: string;
  description?: string | null;
  slots: SignupFormSlot[];
};

export type SignupQuestion = {
  id: string;
  prompt: string;
  required?: boolean;
  multiline?: boolean;
};

export type SignupResponseSlot = {
  sectionId: string;
  slotId: string;
  quantity: number;
};

export type SignupResponseAnswer = {
  questionId: string;
  value: string;
};

export type SignupResponseStatus = "confirmed" | "waitlisted" | "cancelled";

export type SignupResponse = {
  id: string;
  userId?: string | null;
  name: string;
  email?: string | null;
  phone?: string | null;
  guests?: number | null;
  note?: string | null;
  slots: SignupResponseSlot[];
  answers?: SignupResponseAnswer[];
  status: SignupResponseStatus;
  createdAt: string;
  updatedAt: string;
};

export type SignupFormSettings = {
  allowMultipleSlotsPerPerson: boolean;
  maxSlotsPerPerson?: number | null;
  maxGuestsPerSignup: number;
  waitlistEnabled: boolean;
  lockWhenFull: boolean;
  collectPhone: boolean;
  collectEmail: boolean;
  showRemainingSpots: boolean;
  autoRemindersHoursBefore: number[];
  hideParticipantNames?: boolean;
  signupOpensAt?: string | null;
  signupClosesAt?: string | null;
};

export type SignupForm = {
  version: 1;
  enabled: boolean;
  title: string;
  description?: string | null;
  header?: SignupFormHeader | null;
  sections: SignupFormSection[];
  questions: SignupQuestion[];
  settings: SignupFormSettings;
  responses: SignupResponse[];
  venue?: string | null;
  location?: string | null;
  start?: string | null; // ISO (local clock preserved)
  end?: string | null;   // ISO (local clock preserved)
  timezone?: string | null;
  allDay?: boolean | null;
};

export type SignupFormHeader = {
  backgroundColor?: string | null;
  backgroundImage?: { name: string; type: string; dataUrl: string } | null;
  backgroundCss?: string | null;
  groupName?: string | null;
  creatorName?: string | null;
  templateId?:
    | "header-1"
    | "header-2"
    | "header-3"
    | "header-4"
    | "header-5"
    | "header-6"
    | "header-7"
    | "header-8"
    | "header-9"
    | "header-10"
    | null;
  themeId?: string | null;
  textColor1?: string | null;
  textColor2?: string | null;
  buttonColor?: string | null;
  buttonTextColor?: string | null;
  images?: Array<{ id: string; name: string; type: string; dataUrl: string }> | null;
  designTheme?: SignupDesignTheme | null;
};

export type SignupDesignTheme =
  | "Spring"
  | "Summer"
  | "School & Education"
  | "Fall & Seasonal"
  | "Winter & Holidays"
  | "Church & Community"
  | "Sports & Recreation"
  | "Fundraising, Food, & Events"
  | "Family & Personal"
  | "Business & Professional"
  | "Parties & Events"
  | "Health & Fitness"
  | "Clubs & Groups"
  | "General"
  | "Other / Special Interest";
