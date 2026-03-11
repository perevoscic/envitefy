/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-explicit-any */
// @ts-nocheck
import React from "react";

export type GymMeetTemplateId =
  | "elite-athlete"
  | "bento-box"
  | "parent-command"
  | "varsity-classic"
  | "weekend-journey"
  | "scouting-report"
  | "cyber-athlete"
  | "paper-proto"
  | "sunset-arena"
  | "pop-art"
  | "swiss-grid"
  | "art-deco"
  | "concrete-gym"
  | "midnight-frost"
  | "eco-motion"
  | "holo-elite"
  | "vaporwave-grid"
  | "heavy-impact"
  | "blueprint-tech"
  | "toxic-kinetic"
  | "luxe-magazine"
  | "chalk-strike"
  | "podium-lights"
  | "judges-sheet"
  | "spring-energy"
  | "club-classic"
  | "aurora-lift"
  | "ribbon-editorial"
  | "medal-poster"
  | "vault-grid"
  | "travel-briefing";

export type GymMeetTemplateGroup =
  | "current"
  | "showcase"
  | "bold"
  | "classic"
  | "editorial"
  | "dashboard";

export type GymMeetTemplateLayoutFamily =
  | "standard"
  | "editorial"
  | "dashboard";

export type GymMeetPageTemplateMeta = {
  id: GymMeetTemplateId;
  name: string;
  style: string;
  description: string;
  group: GymMeetTemplateGroup;
  layoutFamily: GymMeetTemplateLayoutFamily;
  thumbnailMode: "rendered-card";
  previewTitle: string;
  previewKicker: string;
  previewClassName: string;
  previewAccentClassName: string;
  previewTitleClassName?: string;
};

export type GymMeetNavItem = {
  id: string;
  label: string;
};

export type GymMeetDiscoveryTabId =
  | "meet-details"
  | "coaches"
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

export type GymMeetCoachContact = {
  role: string;
  name?: string;
  email?: string;
  phone?: string;
};

export type GymMeetCoachDeadline = {
  label: string;
  date?: string;
  note?: string;
};

export type GymMeetCoachFee = {
  label: string;
  amount: string;
  note?: string;
};

export type GymMeetCoachLateFee = {
  label: string;
  amount: string;
  trigger?: string;
  note?: string;
};

export type GymMeetDiscoveryContent = {
  tabs: GymMeetDiscoveryTab[];
  meetDetails: {
    lines: GymMeetInlineLinkLine[];
    hasContent: boolean;
  };
  coaches: {
    contacts: GymMeetCoachContact[];
    deadlines: GymMeetCoachDeadline[];
    attire: string[];
    notes: string[];
    entryFees: GymMeetCoachFee[];
    teamFees: GymMeetCoachFee[];
    lateFees: GymMeetCoachLateFee[];
    links: GymMeetLink[];
    signIn?: string;
    hospitality?: string;
    floorAccess?: string;
    scratches?: string;
    floorMusic?: string;
    rotationSheets?: string;
    awards?: string;
    regionalCommitment?: string;
    qualification?: string;
    meetFormat?: string;
    equipment?: string;
    refundPolicy?: string;
    paymentInstructions?: string;
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
    parkingLinks: GymMeetLinkAction[];
    parkingPricingLinks: GymMeetLinkAction[];
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

export type GymMeetTitleSize = "small" | "medium" | "large";

export type GymMeetRenderModel = {
  pageTemplateId: GymMeetTemplateId;
  title: string;
  titleSize: GymMeetTitleSize;
  heroImage?: string;
  hostGym?: string;
  venue?: string;
  address?: string;
  headerLocation?: string;
  dateLabel?: string;
  timeLabel?: string;
  detailsText?: string;
  heroSummary?: string;
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
  onCalendar: () => void;
  onGoogleCalendar: () => void;
  onAppleCalendar: () => void;
  onOutlookCalendar: () => void;
};
