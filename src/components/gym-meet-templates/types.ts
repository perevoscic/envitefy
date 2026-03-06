/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-explicit-any */
// @ts-nocheck
import React from "react";

export type GymMeetTemplateId =
  | "elite-athlete"
  | "bento-box"
  | "parent-command"
  | "varsity-classic"
  | "weekend-journey"
  | "scouting-report";

export type GymMeetPageTemplateMeta = {
  id: GymMeetTemplateId;
  name: string;
  style: string;
  description: string;
  thumbnailMode: "rendered-card";
  previewTitle: string;
  previewKicker: string;
  previewClassName: string;
  previewAccentClassName: string;
};

export type GymMeetNavItem = {
  id: string;
  label: string;
};

export type GymMeetDiscoveryTabId =
  | "meet-details"
  | "venue-details"
  | "admission-sales"
  | "traffic-parking"
  | "safety-policy";

export type GymMeetDiscoveryTab = {
  id: GymMeetDiscoveryTabId;
  label: string;
};

export type GymMeetSummaryItem = {
  label: string;
  value: string;
};

export type GymMeetAnnouncement = {
  id: string;
  title: string;
  body: string;
  date?: string;
};

export type GymMeetLink = {
  label: string;
  url: string;
};

export type GymMeetInlineLinkLine = {
  text: string;
  href?: string;
};

export type GymMeetAdmissionCard = {
  label: string;
  price: string;
  note?: string;
};

export type GymMeetInfoCard = {
  key: string;
  label: string;
  value: string;
};

export type GymMeetLinkAction = {
  label: string;
  url: string;
};

export type GymMeetDiscoveryContent = {
  tabs: GymMeetDiscoveryTab[];
  meetDetails: {
    lines: GymMeetInlineLinkLine[];
    hasContent: boolean;
  };
  venueDetails: {
    lines: GymMeetInlineLinkLine[];
    registrationDeskNote?: string;
    awardsAreaItems: string[];
    assignedGymLabel?: string;
    gymLayoutImageUrl?: string;
    hasContent: boolean;
  };
  admissionSales: {
    admissionCards: GymMeetAdmissionCard[];
    primaryNote?: string;
    logisticsItems: GymMeetInfoCard[];
    merchandiseText?: string;
    merchandiseLink?: GymMeetLinkAction;
    rotationLink?: GymMeetLinkAction;
    resultsText?: string;
    resultsLinks: string[];
    hasContent: boolean;
  };
  trafficParking: {
    alertText?: string;
    alertSlots: Array<{ date: string; times: string }>;
    daylightSavingsNote?: string;
    parkingText?: string;
    mapDashboardLink?: GymMeetLinkAction;
    ratesInfoLink?: GymMeetLinkAction;
    rideShareNote?: string;
    hotelInfo?: string;
    mapAddress?: string;
    hasContent: boolean;
  };
  safetyPolicy: {
    foodBeverage?: string;
    hydration?: string;
    serviceAnimals?: string;
    safetyPolicy?: string;
    hasContent: boolean;
  };
};

export type GymMeetRenderModel = {
  pageTemplateId: GymMeetTemplateId;
  title: string;
  heroImage?: string;
  hostGym?: string;
  venue?: string;
  address?: string;
  headerLocation?: string;
  dateLabel?: string;
  timeLabel?: string;
  description?: string;
  team?: string;
  season?: string;
  coach?: string;
  assistantCoach?: string;
  coachPhone?: string;
  heroBadges: string[];
  navItems: GymMeetNavItem[];
  summaryItems: GymMeetSummaryItem[];
  quickLinks: GymMeetLink[];
  rosterAthletes: any[];
  meet: any;
  practiceBlocks: any[];
  logistics: any;
  gear: any;
  volunteers: any;
  announcements: GymMeetAnnouncement[];
  rsvpEnabled: boolean;
  rsvpDeadline?: string;
  mapAddress?: string;
  venueFacts: string[];
  spectatorNotes: string[];
  rulesNotes: string[];
  logisticsNotes: string[];
  discovery: GymMeetDiscoveryContent;
  assignedGym?: string;
};

export type GymMeetRsvpProps = {
  enabled: boolean;
  submitted: boolean;
  attending: string;
  setAttending: (value: string) => void;
  rosterAthletes: any[];
  selectedAthleteId: string;
  setSelectedAthleteId: (value: string) => void;
  nameInput: string;
  setNameInput: (value: string) => void;
  guestEmailInput: string;
  setGuestEmailInput: (value: string) => void;
  guestPhoneInput: string;
  setGuestPhoneInput: (value: string) => void;
  isSignedIn: boolean;
  allowGuestAttendanceRsvp: boolean;
  submitting: boolean;
  error?: string | null;
  onSubmit: () => void;
  onReset: () => void;
};

export type GymMeetTemplateRendererProps = {
  model: GymMeetRenderModel;
  ownerToolbar?: React.ReactNode;
  rsvpProps: GymMeetRsvpProps;
  isOwner: boolean;
  isReadOnly: boolean;
  hideOwnerActions?: boolean;
  onShare: () => void;
  onGoogleCalendar: () => void;
  onAppleCalendar: () => void;
  onOutlookCalendar: () => void;
};
