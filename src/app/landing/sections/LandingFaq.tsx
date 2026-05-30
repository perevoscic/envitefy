"use client";

import FAQs, { type FAQItem } from "@/components/ui/faqs-component";
import { landingFaqItems } from "../faq-data";

const faqItems: FAQItem[] = landingFaqItems.map((item, index) => ({
  id: `landing-faq-${index + 1}`,
  question: item.q,
  answer: item.a,
}));

export default function LandingFaq() {
  return (
    <FAQs
      items={faqItems}
      title="Questions before you try it"
      description="Quick answers about Concierge, uploads, event pages, RSVP tracking, smart sign-ups, sharing, and guests."
      className="hash-anchor-below-fixed-nav bg-[#fffafd]"
      accordionClassName="border-[#eadcf5] shadow-[0_28px_90px_rgba(116,87,166,0.09)]"
      supportText="Need the complete product FAQ?"
      supportHref="/faq"
      supportLinkLabel="Open the full Envitefy FAQ"
    />
  );
}
