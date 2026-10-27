import Link from "next/link";
import ArrowFillLink from "@/components/ui/ArrowFillLink";
import styles from "./GymnasticsLandingFaq.module.css";

const items = [
  {
    q: "Can I start with the meet packet we already have?",
    a: "Yes. Upload your meet packet or supporting PDFs, then review the imported sessions, times and notes. Choose a design, make your changes and publish when the page is ready to share.",
  },
  {
    q: "What can families find on the page?",
    a: "Keep your session schedule, check-in and warm-up times, venue directions, parking notes, hotel links and supporting documents together. You choose the sections and information your meet needs.",
  },
  {
    q: "Do families need to download an app?",
    a: "No. The shared page opens in a browser on phones, tablets and computers. Send the link by text, email or your usual team channel.",
  },
  {
    q: "What if the schedule changes after sharing?",
    a: "Edit the page and save your changes. Families who open the same link will see the updated details. You can keep the page current throughout the meet weekend.",
  },
  {
    q: "Can families confirm an athlete’s attendance?",
    a: "When you enable attendance for a meet with a team roster, families can confirm a listed athlete’s attendance. Attendance is optional and off by default.",
  },
  {
    q: "Can families add the meet to their calendar?",
    a: "When calendar actions are available on your published page, families can choose Google Calendar, Outlook or an ICS calendar file. Each person chooses whether to add the event; calendar changes do not sync automatically.",
  },
  {
    q: "Can I organize volunteers or what people bring?",
    a: (
      <>
        Create a separate <Link href="/signup-forms">Sign-up Form</Link> for volunteer roles,
        supplies or time slots. Share its own link with your team so families can choose how to
        help.
      </>
    ),
  },
] as const;

export default function GymnasticsLandingFaq() {
  return (
    <section id="faq" className={styles.section} aria-labelledby="gymnastics-faq-heading">
      <div className={styles.introduction}>
        <p className={styles.eyebrow}>Before your first meet page</p>
        <h2 id="gymnastics-faq-heading" className={styles.heading}>
          Good questions. <strong>Clear answers.</strong>
        </h2>
        <p className={styles.helpCopy}>
          From your first upload to the link you send families, here’s what to expect.
        </p>
        <ArrowFillLink href="/faq" className={styles.helpLink} label="Visit the Envitefy FAQ" />
      </div>
      <div className={styles.questions}>
        {items.map(({ q, a }) => (
          <details key={q} className={styles.question}>
            <summary>
              <span>{q}</span>
              <span className={styles.toggle} aria-hidden="true" />
            </summary>
            <p>{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
