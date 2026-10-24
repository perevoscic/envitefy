import { ArrowRight, MessageCircle } from "lucide-react";
import Link from "next/link";
import styles from "./LandingQuestions.module.css";

const questions = [
  {
    question: "Do my guests need an app?",
    answer:
      "No. Your shared invitation or event page opens in a browser on phones, tablets and computers. Guests can find the details and use the actions you’ve enabled from that link.",
  },
  {
    question: "Can I change the details after sharing?",
    answer:
      "Yes. Edit your event and save your changes. Guests opening the same link will see the updated details, so you can keep the plan current without sending a replacement invitation.",
  },
  {
    question: "Can I start with a flyer, PDF or event link?",
    answer:
      "Yes. The event creation workspace offers Upload, Paste URL and Start from scratch. Review the imported information, choose your design and make any changes before explicitly saving or publishing.",
  },
  {
    question: "Can I explore designs before creating an account?",
    answer:
      "Yes. Browse the public template galleries and try a design first. Sign in or create an account when you’re ready to save your work and keep editing.",
  },
  {
    question: "How do I share my invitation?",
    answer:
      "Publish your invitation when it’s ready, then copy its guest link into a text, email or group chat. Guests open that same link to see the details and actions you’ve enabled.",
  },
  {
    question: "Can guests RSVP directly from the page?",
    answer:
      "Yes, when RSVP is enabled for your event. Guests can respond from the shared page, and you can keep their replies and headcounts together with your event.",
  },
  {
    question: "Can I ask about plus-ones or dietary needs?",
    answer:
      "Supported RSVP forms can collect party size, plus-ones, dietary needs, meal choices and guest messages. Available fields depend on your event type and settings.",
  },
  {
    question: "Can I include directions and a schedule?",
    answer:
      "Yes. Supported event pages can keep venue information, maps, parking or arrival notes and event schedules beside your invitation, so guests can find the plan in one place.",
  },
  {
    question: "Can guests save the event to their calendar?",
    answer:
      "When you include calendar actions, guests can use Google Calendar or Outlook links, or download an ICS file for Apple Calendar. Guests choose whether to save the event.",
  },
  {
    question: "Can I add registry or gift links?",
    answer:
      "Yes. Supported events can include registry, wishlist, gift or fund links alongside the invitation, so guests can find your gift guidance without searching through messages.",
  },
  {
    question: "Can I organize a potluck or volunteer sign-up?",
    answer:
      "Yes. Create a Sign-up Form for food, supplies, volunteer roles or time slots. Set quantities and capacity limits, then share the form so guests can claim what they’re bringing or how they’ll help.",
  },
  {
    question: "Can someone help me manage the event?",
    answer:
      "On supported Event Pages, Live Cards and Sign-up Forms, you can invite co-hosts to help edit details, publish and manage responses. They sign in and accept your invitation, while you stay in control of co-host access.",
  },
] as const;

export default function LandingQuestions({ onHelp }: { onHelp: () => void }) {
  return (
    <section className={styles.section} aria-labelledby="faq-heading" data-landing-faq>
      <div className={styles.introduction}>
        <div data-motion-reveal>
          <p className={styles.eyebrow}>Good to know</p>
          <h2 id="faq-heading" className={styles.heading}>
            Good <strong>questions.</strong>
          </h2>
          <p className={styles.helpCopy}>
            A few useful answers before you bring everyone together. Anything else? We’re here to
            help.
          </p>
          <button type="button" onClick={onHelp} className={styles.helpLink}>
            <MessageCircle size={17} aria-hidden="true" /> Ask Concierge
          </button>
          <Link href="/faq" className={styles.faqLink}>
            Visit our FAQ <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </div>
      <div className={styles.questions}>
        {questions.map(({ question, answer }) => (
          <details key={question} className={styles.question}>
            <summary>
              <span>{question}</span>
              <span className={styles.toggle} data-faq-toggle aria-hidden="true" />
            </summary>
            <p>{answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
