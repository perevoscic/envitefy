import type { LucideIcon } from "lucide-react";

import type { StudioStep } from "./studio-types";

export type { StudioStep };

export type MediaType = "image" | "page";
export type InviteCategory =
  | "Birthday"
  | "Field Trip/Day"
  | "Game Day"
  | "Bridal Shower"
  | "Wedding"
  | "Housewarming"
  | "Baby Shower"
  | "Anniversary"
  | "Custom Invite";

export type ActiveTab = "none" | "location" | "calendar" | "registry" | "share" | "details" | "rsvp";

export type EventDetails = {
  category: InviteCategory;
  sourceMediaMode: "none" | "flyer" | "subjectPhotos";
  sourceFlyerUrl: string;
  sourceFlyerName: string;
  sourceFlyerPreviewUrl: string;
  eventTitle: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  venueName: string;
  location: string;
  rsvpName: string;
  rsvpContact: string;
  rsvpDeadline: string;
  /** Host-written copy shown on the live card Event Details tab. */
  detailsDescription: string;
  /** Optional honoree/event image URLs for invite generation (max 6). */
  guestImageUrls: string[];
  message: string;
  specialInstructions: string;
  orientation: "portrait" | "landscape";
  colors: string;
  style: string;
  visualPreferences: string;
  name: string;
  age: string;
  theme: string;
  invitedWho: string;
  dressCode: string;
  giftNote: string;
  isSurprise: boolean;
  isMilestone: boolean;
  activityNote: string;
  coupleNames: string;
  ceremonyDate: string;
  ceremonyTime: string;
  receptionTime: string;
  ceremonyVenue: string;
  receptionVenue: string;
  registryLink: string;
  weddingWebsite: string;
  adultsOnly: boolean;
  accommodationInfo: string;
  plusOnePolicy: string;
  transportationInfo: string;
  honoreeNames: string;
  babyName: string;
  gender: "Boy" | "Girl" | "Neutral";
  hostedBy: string;
  diaperRaffle: boolean;
  bookInsteadOfCard: boolean;
  bringABookNote: string;
  giftPreferenceNote: string;
  gradeLevel: string;
  teacherName: string;
  chaperonesNeeded: boolean;
  costPerStudent: string;
  permissionSlipRequired: boolean;
  lunchInfo: string;
  transportationType: string;
  emergencyContact: string;
  whatToBring: string;
  sportType: string;
  teamName: string;
  opponentName: string;
  leagueDivision: string;
  ticketsLink: string;
  broadcastInfo: string;
  parkingInfo: string;
  mainPerson: string;
  occasion: string;
  audience: string;
  calloutText: string;
  optionalLink: string;
  customLabel1: string;
  customValue1: string;
  customLabel2: string;
  customValue2: string;
};

export type ButtonPosition = {
  x: number;
  y: number;
};

export type InvitationData = {
  title: string;
  subtitle: string;
  description: string;
  scheduleLine: string;
  locationLine: string;
  callToAction: string;
  socialCaption: string;
  heroTextMode?: "image" | "overlay";
  theme: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    themeStyle: string;
  };
  interactiveMetadata: {
    rsvpMessage: string;
    funFacts: string[];
    ctaLabel: string;
    shareNote: string;
  };
  eventDetails: EventDetails;
};

export type MediaItem = {
  id: string;
  type: MediaType;
  url?: string;
  data?: InvitationData;
  errorMessage?: string;
  publishedEventId?: string;
  sharePath?: string;
  theme: string;
  status: "ready" | "loading" | "error";
  details: EventDetails;
  createdAt: string;
  positions?: {
    rsvp: ButtonPosition;
    location: ButtonPosition;
    share: ButtonPosition;
    calendar: ButtonPosition;
    registry: ButtonPosition;
    details: ButtonPosition;
  };
};

export type FieldConfig = {
  label: string;
  key: keyof EventDetails;
  type: "text" | "number" | "date" | "time" | "checkbox" | "textarea" | "select";
  options?: string[];
  placeholder?: string;
  required?: boolean;
};

export type SharedFieldConfig = {
  label: string;
  key: keyof EventDetails;
  type: "text" | "date" | "time";
  placeholder?: string;
  required?: boolean;
};

export type CategoryCard = {
  name: InviteCategory;
  icon: LucideIcon;
};

export type StudioCategoryTileSizeVariant =
  | "standard"
  | "horizontal"
  | "wide"
  | "feature"
  | "panorama";

export type StudioCategoryTileOverlayStrength = "light" | "medium" | "dark";

export type StudioCategoryTileTextTone = "dark" | "light";

export type StudioCategoryTileDefinition = {
  name: InviteCategory;
  icon: LucideIcon;
  description: string;
  badge: string;
  imagePath: string;
  themeColor: string;
  sizeVariant: StudioCategoryTileSizeVariant;
  overlayStrength: StudioCategoryTileOverlayStrength;
  textTone: StudioCategoryTileTextTone;
  surfaceVariant?: "default" | "dark";
  imagePositionClassName?: string;
  selectedLabel?: string;
};
