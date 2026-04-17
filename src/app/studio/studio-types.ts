import type {
  LucideIcon,
  StudioGenerateMode,
  StudioGenerateRequest,
  StudioGenerateResponse,
} from "@/lib/studio/types";

export type StudioWorkspaceView = "create" | "library";

export type StudioCreateStep = "type" | "details" | "editor";

export type StudioCategoryId =
  | "birthday"
  | "field-trip-day"
  | "bridal-shower"
  | "wedding"
  | "housewarming"
  | "baby-shower"
  | "anniversary"
  | "custom-invite";

export type StudioDynamicField = {
  id: string;
  label: string;
  placeholder: string;
  helperText?: string;
};

export type StudioCategoryDefinition = {
  id: StudioCategoryId;
  label: string;
  icon: LucideIcon;
  description: string;
  pill: string;
  suggestedTone: string;
  suggestedStyle: string;
  dynamicFields: StudioDynamicField[];
};

export type StudioLinkField = {
  label: string;
  url: string;
};

export type StudioEventFormState = {
  title: string;
  occasion: string;
  hostName: string;
  honoreeName: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  timezone: string;
  venueName: string;
  venueAddress: string;
  dressCode: string;
  rsvpBy: string;
  rsvpContact: string;
  registryNote: string;
  links: StudioLinkField[];
};

export type StudioGuidanceFormState = {
  tone: string;
  style: string;
  audience: string;
  colorPalette: string;
  includeEmoji: boolean;
};

export type StudioFormState = {
  event: StudioEventFormState;
  guidance: StudioGuidanceFormState;
  dynamicFields: Record<string, string>;
};

export type StudioResultBundle = {
  mode: StudioGenerateMode;
  request: StudioGenerateRequest;
  response: StudioGenerateResponse;
};

export type StudioLibraryItem = {
  id: string;
  createdAt: string;
  categoryId: StudioCategoryId;
  title: string;
  formState: StudioFormState;
  result: StudioResultBundle;
};
