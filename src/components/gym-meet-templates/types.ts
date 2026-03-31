/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-explicit-any */
// @ts-nocheck
import React from "react";

export type GymMeetTemplateId =
  | "launchpad-editorial"
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
  | "glitch-sport"
  | "organic-flow"
  | "pixel-arena"
  | "architect-clean"
  | "noir-silhouette"
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

export type GymMeetTitleTypographyId =
  | "anton"
  | "audiowide"
  | "barlow-condensed"
  | "bungee"
  | "cormorant"
  | "exo2"
  | "ibm-plex-mono"
  | "kanit"
  | "league-spartan"
  | "manrope"
  | "montserrat"
  | "orbitron"
  | "oswald"
  | "playfair"
  | "poppins"
  | "press-start-2p"
  | "sora"
  | "space-mono";

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
  titleTypographyId?: GymMeetTitleTypographyId;
  previewTitleClassName?: string;
};

export type GymMeetNavItem = {
  id: string;
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

export type GymMeetScheduleClub = {
  id: string;
  name: string;
  teamAwardEligible?: boolean | null;
  athleteCount?: number | null;
  divisionLabel?: string;
};

export type GymMeetScheduleAnnotation = {
  id?: string;
  kind?: string;
  level?: string;
  sessionCode?: string;
  date?: string;
  time?: string;
  text: string;
};

export type GymMeetScheduleAssignment = {
  id?: string;
  level?: string;
  groupLabel?: string;
  sessionCode?: string;
  birthDateRange?: string;
  divisionLabel?: string;
  note?: string;
};

export type GymMeetScheduleSession = {
  id: string;
  code?: string;
  label: string;
  group: string;
  startTime: string;
  warmupTime?: string;
  note?: string;
  clubs: GymMeetScheduleClub[];
};

export type GymMeetScheduleDay = {
  id: string;
  date: string;
  shortDate: string;
  isoDate?: string;
  sessions: GymMeetScheduleSession[];
};

export type GymMeetScheduleInfo = {
  enabled: boolean;
  venueLabel?: string;
  supportEmail?: string;
  notes?: string[];
  annotations?: GymMeetScheduleAnnotation[];
  assignments?: GymMeetScheduleAssignment[];
  days: GymMeetScheduleDay[];
};

export type GymMeetDiscoverySectionKind =
  | "meet_overview"
  | "registration"
  | "admission"
  | "results"
  | "coaches"
  | "schedule"
  | "session_assignments"
  | "venue"
  | "venue_map"
  | "traffic_parking"
  | "hotels"
  | "safety"
  | "documents"
  | "announcements";

export type GymMeetDiscoveryCard = {
  key: string;
  label?: string;
  value?: string;
  body?: string;
  meta?: string;
  items?: string[];
  imageUrl?: string;
  action?: GymMeetLinkAction;
};

export type GymMeetDiscoveryBlock =
  | {
      id: string;
      type: "line-list";
      title?: string;
      lines: GymMeetInlineLinkLine[];
    }
  | {
      id: string;
      type: "text";
      title?: string;
      text: string;
      tone?: "default" | "warning";
    }
  | {
      id: string;
      type: "card-grid";
      title?: string;
      columns?: 2 | 3 | 4;
      cards: GymMeetDiscoveryCard[];
    }
  | {
      id: string;
      type: "link-list";
      title?: string;
      links: GymMeetLink[];
    }
  | {
      id: string;
      type: "cta";
      title?: string;
      text?: string;
      action: GymMeetLinkAction;
    }
  | {
      id: string;
      type: "image";
      title?: string;
      imageUrl: string;
      alt?: string;
    }
  | {
      id: string;
      type: "map";
      title?: string;
      address: string;
      text?: string;
    }
  | {
      id: string;
      type: "schedule-board";
      data: GymMeetScheduleInfo;
    };

export type GymMeetDiscoverySection = {
  id: string;
  label: string;
  navLabel?: string;
  kind: GymMeetDiscoverySectionKind | string;
  priority: number;
  hasContent: boolean;
  blocks: GymMeetDiscoveryBlock[];
  hideSectionHeading?: boolean;
};

export type GymMeetDiscoveryContent = {
  sections: GymMeetDiscoverySection[];
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
  suppressActionStrip?: boolean;
  onShare: () => void;
  onCalendar: () => void;
  onGoogleCalendar: () => void;
  onAppleCalendar: () => void;
  onOutlookCalendar: () => void;
};
