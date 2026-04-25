import { buildGuideMetadata, GuidePageView } from "../guide-content";

export const metadata = buildGuideMetadata("live-card-invitations");

export default function LiveCardInvitationsGuide() {
  return <GuidePageView slug="live-card-invitations" />;
}
