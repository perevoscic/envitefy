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
  maxGuestsPerSignup: number;
  waitlistEnabled: boolean;
  lockWhenFull: boolean;
  collectPhone: boolean;
  collectEmail: boolean;
  showRemainingSpots: boolean;
  autoRemindersHoursBefore: number[];
};

export type SignupForm = {
  version: 1;
  enabled: boolean;
  title: string;
  description?: string | null;
  sections: SignupFormSection[];
  questions: SignupQuestion[];
  settings: SignupFormSettings;
  responses: SignupResponse[];
};
