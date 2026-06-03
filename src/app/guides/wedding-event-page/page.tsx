import { buildGuideMetadata, GuidePageView } from "../guide-content";

export const metadata = buildGuideMetadata("wedding-event-page");

export default function WeddingEventPageGuide() {
  return <GuidePageView slug="wedding-event-page" />;
}
