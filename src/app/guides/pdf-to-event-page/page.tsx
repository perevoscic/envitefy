import { buildGuideMetadata, GuidePageView } from "../guide-content";

export const metadata = buildGuideMetadata("pdf-to-event-page");

export default function PdfToEventPageGuide() {
  return <GuidePageView slug="pdf-to-event-page" />;
}
