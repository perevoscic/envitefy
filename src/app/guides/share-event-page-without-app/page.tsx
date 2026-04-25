import { buildGuideMetadata, GuidePageView } from "../guide-content";

export const metadata = buildGuideMetadata("share-event-page-without-app");

export default function ShareEventPageWithoutAppGuide() {
  return <GuidePageView slug="share-event-page-without-app" />;
}
