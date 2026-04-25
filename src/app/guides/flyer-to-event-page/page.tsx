import { buildGuideMetadata, GuidePageView } from "../guide-content";

export const metadata = buildGuideMetadata("flyer-to-event-page");

export default function FlyerToEventPageGuide() {
  return <GuidePageView slug="flyer-to-event-page" />;
}
