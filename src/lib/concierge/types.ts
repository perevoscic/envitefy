export type CreationIntent =
  | "create_output"
  | "create_event"
  | "edit_event"
  | "convert_source"
  | "unknown";

export type ConciergeIntent = CreationIntent;

export type ConciergeEventType =
  | "unknown"
  | "birthday"
  | "wedding"
  | "baby_shower"
  | "gender_reveal"
  | "bridal_shower"
  | "graduation"
  | "gym_meet"
  | "game_day"
  | "football"
  | "sport_event"
  | "field_trip"
  | "open_house"
  | "housewarming"
  | "appointment"
  | "workshop"
  | "special_event"
  | "smart_signup"
  | "general";

export type RequestedOutput =
  | "event_page"
  | "live_card"
  | "digital_flyer"
  | "signup_form"
  | "invitation"
  | "rsvp_page"
  | "whatsapp"
  | "text_message"
  | "printable_flyer"
  | "instagram_story"
  | "reminder"
  | "thank_you_card"
  | "menu"
  | "welcome_sign";

export type ConciergeOutput = RequestedOutput | "printable" | "story";

export type SourceContextType =
  | "none"
  | "current_event"
  | "current_draft"
  | "upload"
  | "snap"
  | "ocr_text"
  | "selected_template"
  | "pasted_text"
  | "existing_asset";

export type SourceContextAmbiguity = "none" | "multiple" | "missing";

export type DetectedSourceIntent =
  | "received_invite"
  | "authoring_source"
  | "reference_material"
  | "unknown";

export type SourceIntentConfidence = "high" | "medium" | "low";

export type SourceIntentSignal = {
  code: string;
  label: string;
};

export type SourceIntentResolution = {
  detectedSourceIntent: DetectedSourceIntent;
  confidence: SourceIntentConfidence;
  signals: SourceIntentSignal[];
  requiresUserConfirmation: boolean;
};

export type CreationDraftStatus =
  | "needs_source_or_event"
  | "needs_event_details"
  | "drafting"
  | "preview_ready"
  | "published";

export type CreationSourceContext = {
  type: SourceContextType;
  hasUsableContext: boolean;
  ambiguity: SourceContextAmbiguity;
  detectedSourceIntent?: DetectedSourceIntent;
  confidence?: SourceIntentConfidence;
  signals?: SourceIntentSignal[];
  requiresUserConfirmation?: boolean;
  originalCategory?: string | null;
  boundary?: "private_data" | "non_creation" | null;
  resolvedId?: string | null;
  candidates?: Array<{
    type: SourceContextType;
    id: string;
    label: string;
  }>;
};

export type ConciergeActiveContext = {
  route?: string | null;
  currentEventId?: string | null;
  currentDraftId?: string | null;
  selectedUploadId?: string | null;
  selectedTemplateId?: string | null;
  currentAssetId?: string | null;
  lastUserAction?: string | null;
};

export type EventAssetType =
  | "event_page"
  | "live_card"
  | "signup_form"
  | "invitation"
  | "rsvp_page"
  | "whatsapp"
  | "instagram_story"
  | "printable_flyer"
  | "reminder_message"
  | "thank_you_card"
  | "menu"
  | "welcome_sign";

export type EventAssetStatus = "draft" | "published" | "archived";

export type EventAsset = {
  id: string;
  user_id: string;
  event_id: string;
  asset_type: EventAssetType;
  title: string;
  status: EventAssetStatus | string;
  content: Record<string, unknown>;
  design: Record<string, unknown>;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type ConversationThread = {
  id: string;
  user_id: string;
  event_id: string | null;
  thread_type: string;
  title: string | null;
  created_at: string;
  updated_at: string;
};

export type ConversationMessageRole = "user" | "assistant" | "system";

export type ConversationMessage = {
  id: string;
  thread_id: string;
  user_id: string | null;
  role: ConversationMessageRole;
  content: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type ConciergeEventAction =
  | { type: "update_event"; patch: Record<string, unknown> }
  | { type: "create_asset"; assetType: EventAssetType; brief: string }
  | { type: "update_asset"; assetId: string; patch: Record<string, unknown> }
  | { type: "ask_question"; question: string; suggestedReplies: string[] };

export type ConciergeEventMessageRequest = {
  message?: string;
  assetId?: string;
};

export type ConciergeEventMessageResponse =
  | {
      ok: true;
      event: {
        id: string;
        title: string;
        data: Record<string, unknown>;
      };
      assets: EventAsset[];
      assistantMessage: string;
      actions: ConciergeEventAction[];
      suggestedReplies: string[];
      weatherContext?: ConciergeWeatherContext | null;
      timings?: Record<string, unknown>;
    }
  | {
      ok: false;
      error: string;
      timings?: Record<string, unknown>;
    };

export type ConciergeSource = "text" | "upload" | "mixed";

export type ConciergePreviewCopy = {
  headline: string;
  subheadline: string;
  body: string;
  scheduleLine: string;
  locationLine: string;
  cta: string;
};

export type ConciergeWeatherContextStatus =
  | "available"
  | "missing_event_details"
  | "outside_forecast_window"
  | "unconfigured"
  | "unavailable";

export type ConciergeWeatherContext = {
  status: ConciergeWeatherContextStatus;
  location: string | null;
  eventIso: string | null;
  summary: string | null;
  tempF: number | null;
  checkedAt: string | null;
  source: "weatherapi" | null;
  message: string;
};

export type ConciergeEventDraft = {
  intent: ConciergeIntent;
  creationSessionId: string;
  requestedOutputs: RequestedOutput[];
  sourceContext: CreationSourceContext;
  eventPurpose: string | null;
  eventType: ConciergeEventType;
  title: string | null;
  ownership: "owned" | "invited" | "unknown";
  draftStatus: CreationDraftStatus;
  currentQuestion: string | null;
  canPersist: boolean;
  honoreeName: string | null;
  relationship: string | null;
  ageOrMilestone: string | null;
  dateText: string | null;
  timeText: string | null;
  startISO: string | null;
  endISO: string | null;
  timezone: string;
  location: string | null;
  venue: string | null;
  rsvpEnabled: boolean | null;
  rsvpDeadline?: string | null;
  rsvpName?: string | null;
  rsvpContact?: string | null;
  numberOfGuests: number | null;
  registryLink?: string | null;
  giftRegistryLink?: string | null;
  giftNote?: string | null;
  giftPreferenceNote?: string | null;
  theme: string | null;
  tone: string | null;
  outputs: ConciergeOutput[];
  missingFields: string[];
  previewCopy: ConciergePreviewCopy;
  source: ConciergeSource;
};

export type CreationSession = {
  id: string;
  user_id: string;
  status: CreationDraftStatus | string;
  draft: ConciergeEventDraft;
  active_context: Record<string, unknown>;
  source_context: Record<string, unknown>;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type CreationChatMessageSnapshot = {
  id?: string;
  role: "user" | "assistant" | "system";
  text: string;
  createdAt?: string;
};

export type ConciergeStudioInvite = {
  imageUrl?: string | null;
  invitationData?: Record<string, unknown> | null;
  positions?: Record<string, unknown> | null;
};

export type CreationThreadSummary = {
  id: string;
  title: string;
  status: string;
  updatedAt: string;
  createdAt: string;
  savedEventId: string | null;
};

export type ConciergeOcrContext = {
  ocrText?: string | null;
  fieldsGuess?: Record<string, unknown> | null;
  category?: string | null;
  birthdayTemplateHint?: unknown;
  ocrSkin?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
};

export type ConciergeAction = "message" | "chip" | "starter_category" | "ocr_result" | "save";

export type ConciergeMessageRequest = {
  message?: string;
  draft?: ConciergeEventDraft | null;
  ocrContext?: ConciergeOcrContext | null;
  activeContext?: ConciergeActiveContext | null;
  requestedOutputs?: RequestedOutput[] | null;
  starterCategory?: string | null;
  action?: ConciergeAction;
};

export type CreationIntakeRequest = ConciergeMessageRequest & {
  creationSessionId?: string | null;
  persistSession?: boolean;
  chatMessages?: CreationChatMessageSnapshot[] | null;
  studioInvite?: ConciergeStudioInvite | null;
};

export type ConciergeMessageResponse =
  | {
      ok: true;
      draft: ConciergeEventDraft;
      creationSession?: CreationSession | null;
      assistantMessage: string;
      suggestedReplies: string[];
      canSave: boolean;
      savedEventId?: string | null;
      chatMessages?: CreationChatMessageSnapshot[];
      weatherContext?: ConciergeWeatherContext | null;
      timings?: Record<string, unknown>;
    }
  | {
      ok: false;
      error: string;
      timings?: Record<string, unknown>;
    };

export type CreationSessionResumeResponse =
  | {
      ok: true;
      draft: ConciergeEventDraft | null;
      creationSession: CreationSession | null;
      assistantMessage: string;
      suggestedReplies: string[];
      canSave: boolean;
      savedEventId?: string | null;
      chatMessages?: CreationChatMessageSnapshot[];
      weatherContext?: ConciergeWeatherContext | null;
      timings?: Record<string, unknown>;
    }
  | {
      ok: false;
      error: string;
      timings?: Record<string, unknown>;
    };

export type CreationThreadsResponse =
  | {
      ok: true;
      threads: CreationThreadSummary[];
    }
  | {
      ok: false;
      error: string;
    };
