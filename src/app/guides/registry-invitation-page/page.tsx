import { buildGuideMetadata, GuidePageView } from "../guide-content";

export const metadata = buildGuideMetadata("registry-invitation-page");

export default function RegistryInvitationPageGuide() {
  return <GuidePageView slug="registry-invitation-page" />;
}
