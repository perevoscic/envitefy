import { buildGuideMetadata, GuidePageView } from "../guide-content";

export const metadata = buildGuideMetadata("smart-signup-forms");

export default function SmartSignupFormsGuide() {
  return <GuidePageView slug="smart-signup-forms" />;
}
