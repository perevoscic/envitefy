"use client";

import FAQs, { type FAQItem } from "@/components/ui/faqs-component";

const qs: FAQItem[] = [
  {
    id: "gymnastics-pdf",
    question: "Can Envitefy turn a gymnastics meet PDF into a live page?",
    answer:
      "Yes. Gymnastics is the flagship workflow here. Envitefy is designed to turn meet packets, schedules, and supporting documents into one mobile-friendly event page families and coaches can actually use.",
  },
  {
    id: "gymnastics-page-content",
    question: "What can I keep on the gymnastics page?",
    answer:
      "The page can hold meet schedules, venue details, parking notes, maps, documents, updates, announcements, and results links so the weekend information stays centralized.",
  },
  {
    id: "upload-flyer-schedule",
    question: "Can I upload a flyer or schedule instead of snapping it?",
    answer:
      "Yes. Snap works with both uploads and camera capture. It is meant for invites, flyers, schedules, screenshots, and other event images that need a cleaner digital output.",
  },
  {
    id: "edit-after-upload",
    question: "Can I edit the details after upload?",
    answer:
      "Yes. The goal is faster setup, not locking you into raw extraction. You can review, refine, and publish the details before sharing the page.",
  },
  {
    id: "guest-app-install",
    question: "Do guests or families need to install an app?",
    answer:
      "No. Envitefy pages open in the browser, which keeps the experience lightweight, faster to share, and easier to access on mobile.",
  },
  {
    id: "beyond-gymnastics",
    question: "Can I use it for events beyond gymnastics?",
    answer:
      "Yes. Gymnastics is the clearest flagship use case today, but Snap is intentionally broader. It can start from invites, flyers, schedules, and event images across many event types.",
  },
] satisfies FAQItem[];

export default function FAQ({ showHeader = true }: { showHeader?: boolean }) {
  return (
    <FAQs
      items={qs}
      title="Clear answers before someone commits to the workflow."
      description="Gymnastics is the flagship workflow, and Snap supports broader event uploads, flyers, schedules, and invites."
      showHeader={showHeader}
      className="bg-[linear-gradient(180deg,#faf7ff_0%,#ffffff_100%)]"
    />
  );
}
