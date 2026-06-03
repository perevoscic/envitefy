import { buildGuideMetadata, GuidePageView } from "../guide-content";

export const metadata = buildGuideMetadata("birthday-rsvp-invitation");

export default function BirthdayRsvpInvitationGuide() {
  return <GuidePageView slug="birthday-rsvp-invitation" />;
}
