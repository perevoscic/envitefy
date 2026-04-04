export type EventOcrLlmResult = {
  title?: string;
  start?: string | null;
  end?: string | null;
  address?: string;
  description?: string;
  category?: string;
  rsvp?: string | null;
  yearVisible?: boolean | null;
  birthdayAudience?: "girl" | "boy" | "neutral" | null;
  birthdaySignals?: string[] | null;
  birthdayName?: string | null;
  birthdayAge?: number | string | null;
};

export type GymnasticsScheduleEvent = {
  title: string;
  start: string;
  end: string;
  allDay?: boolean;
  timezone?: string;
  location?: string | null;
  description?: string | null;
};

export type GymnasticsScheduleLlmResult = {
  season?: string | null;
  homeTeam?: string | null;
  homeAddress?: string | null;
  events?: GymnasticsScheduleEvent[];
};

export type PracticeScheduleLLMGroup = {
  name?: string;
  note?: string | null;
  sessions?: Array<{
    day?: string;
    startTime?: string;
    endTime?: string;
    note?: string | null;
  }>;
};

export type PracticeScheduleLLMResponse = {
  title?: string | null;
  timeframe?: string | null;
  timezoneHint?: string | null;
  groups?: PracticeScheduleLLMGroup[];
};

export type PracticeSessionOutput = {
  day: string;
  display: string;
  hasPractice: boolean;
  start?: string;
  end?: string;
  startTime?: string;
  endTime?: string;
  note: string | null;
};

export type PracticeGroupOutput = {
  name: string;
  note: string | null;
  sessions: PracticeSessionOutput[];
  events: any[];
};

export type PracticeScheduleOutput = {
  detected: boolean;
  title: string | null;
  timeframe: string | null;
  timezone: string;
  groups: PracticeGroupOutput[];
};

export type OcrStageTimings = {
  preprocessMs: number;
  primaryOcrMs: number;
  fallbackOcrMs: number;
  rewriteMs: number;
  scheduleMs: number;
};
