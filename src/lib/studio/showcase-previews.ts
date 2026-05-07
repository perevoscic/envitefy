import type { InviteCategory } from "@/app/studio/studio-workspace-types";
import { landingLiveCardSnapshots } from "@/components/landing/landing-live-card-snapshots";
import type {
  LiveCardActiveTab,
  LiveCardButtonPositions,
  LiveCardInvitationData,
} from "@/components/studio/StudioLiveCardActionSurface";
import { buildLandingShowcasePath } from "@/lib/landing-showcase";

export type StudioShowcasePreview = {
  id: string;
  title: string;
  imageUrl: string;
  invitationData: LiveCardInvitationData;
  positions?: LiveCardButtonPositions;
  initialActiveTab?: LiveCardActiveTab;
  sharePath?: string;
};

const landingShowcasePreviewBySlug = new Map(
  landingLiveCardSnapshots.map((snapshot) => [
    snapshot.slug,
    {
      id: snapshot.id,
      title: snapshot.title,
      imageUrl: snapshot.imageUrl,
      invitationData: snapshot.invitationData,
      positions: snapshot.positions,
      initialActiveTab: snapshot.initialActiveTab,
      sharePath: buildLandingShowcasePath(snapshot.slug),
    } satisfies StudioShowcasePreview,
  ]),
);

function requireLandingShowcasePreview(slug: string): StudioShowcasePreview {
  const preview = landingShowcasePreviewBySlug.get(slug);
  if (!preview) {
    throw new Error(`Missing landing showcase preview for slug: ${slug}`);
  }
  return preview;
}

const anniversaryFallbackPreview: StudioShowcasePreview = {
  id: "studio-anniversary-silver-soiree",
  title: "Silver Anniversary Soirée",
  imageUrl: "/api/blob/event-media/upload-767b4cbd-a67b-43b4-8339-1b2afe60016b/header/display.webp",
  invitationData: {
    title: "Silver Anniversary Soirée",
    subtitle: "Our 25th Anniversary Dinner",
    description:
      "An elegant 25th-anniversary dinner for Naomi & Daniel Brooks featuring candlelit tables, deep red roses, and live jazz at The Marlowe Room.",
    scheduleLine: "Sunday June 14th at 6:30 PM",
    locationLine: "The Marlowe Room, Chicago",
    heroTextMode: "image",
    theme: {
      themeStyle: "studio-marketing",
    },
    interactiveMetadata: {
      rsvpMessage: "Reply to Anniversary Hosts to let them know you're in.",
      ctaLabel: "RSVP",
      shareNote:
        "An elegant 25th-anniversary dinner for Naomi & Daniel Brooks featuring candlelit tables, deep red roses, and live jazz at The Marlowe Room.",
    },
    eventDetails: {
      category: "Anniversary",
      occasion: "Anniversary Dinner",
      eventDate: "2026-06-14",
      startTime: "18:30",
      endTime: "22:00",
      venueName: "The Marlowe Room",
      location: "The Marlowe Room, 17 Crescent Avenue, Chicago, IL",
      rsvpName: "Anniversary Hosts",
      rsvpContact: "anniversary@brooks.example.com",
      detailsDescription:
        "An elegant 25th-anniversary dinner for Naomi & Daniel Brooks featuring candlelit tables, deep red roses, and live jazz at The Marlowe Room.",
      message: "Our 25th Anniversary Dinner",
    },
  },
};

const openHouseFallbackPreview: StudioShowcasePreview = {
  id: "studio-open-house-high-meadow",
  title: "Open House at High Meadow Lane",
  imageUrl: "/studio/open-house.webp",
  invitationData: {
    title: "Open House",
    subtitle: "4593 High Meadow Lane",
    description:
      "Tour a bright four-bedroom home with renovated living spaces, a finished basement, and a walkable High Meadow location.",
    scheduleLine: "Saturday June 13th, 1:00 PM - 4:00 PM",
    locationLine: "4593 High Meadow Lane",
    heroTextMode: "image",
    theme: {
      themeStyle: "premium-real-estate",
    },
    interactiveMetadata: {
      rsvpMessage: "Contact the listing agent for showing details.",
      ctaLabel: "Tour Details",
      shareNote:
        "Tour a bright four-bedroom home with renovated living spaces, a finished basement, and a walkable High Meadow location.",
    },
    eventDetails: {
      category: "Open House",
      occasion: "Real Estate Open House",
      eventTitle: "4593 High Meadow Lane",
      eventDate: "2026-06-13",
      startTime: "13:00",
      endTime: "16:00",
      venueName: "4593 High Meadow Lane",
      location: "4593 High Meadow Lane",
      detailsDescription:
        "Four bedrooms, three and a half baths, renovated kitchen, finished basement, and walkable neighborhood amenities.",
      message: "Premium realtor marketing",
      realtorName: "Carla Mira",
      brokerageName: "High Meadow Realty",
    },
  },
};

export const landingShowcasePreviews: StudioShowcasePreview[] = landingLiveCardSnapshots.map(
  (snapshot) => requireLandingShowcasePreview(snapshot.slug),
);

const studioCategoryShowcasePreviewByCategory: Record<InviteCategory, StudioShowcasePreview> = {
  Birthday: requireLandingShowcasePreview("lara-s-7th-dino-quest"),
  Wedding: requireLandingShowcasePreview("garden-vows"),
  "Bridal Shower": requireLandingShowcasePreview("madeline-s-garden-brunch"),
  "Baby Shower": requireLandingShowcasePreview("elena-s-beary-sweet-shower"),
  "Field Trip/Day": requireLandingShowcasePreview("lincoln-memorial-discovery-day"),
  "Game Day": requireLandingShowcasePreview("friday-night-lights-a"),
  "Open House": openHouseFallbackPreview,
  Housewarming: requireLandingShowcasePreview("the-carter-housewarming"),
  "Custom Invite": requireLandingShowcasePreview("founder-appreciation-night"),
  Anniversary: anniversaryFallbackPreview,
};

export function getStudioCategoryShowcasePreview(category: InviteCategory): StudioShowcasePreview {
  return studioCategoryShowcasePreviewByCategory[category];
}
