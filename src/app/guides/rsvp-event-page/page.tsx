import { buildGuideMetadata, GuidePageView } from "../guide-content";

export const metadata = buildGuideMetadata("rsvp-event-page");

export default function RsvpEventPageGuide() {
  return <GuidePageView slug="rsvp-event-page" />;
}
