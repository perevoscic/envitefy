import { buildGuideMetadata, GuidePageView } from "../guide-content";

export const metadata = buildGuideMetadata("gymnastics-meet-page");

export default function GymnasticsMeetPageGuide() {
  return <GuidePageView slug="gymnastics-meet-page" />;
}
