import { ArrowRight, CalendarClock, Gift, MapPin, Palette, Share2, Users } from "lucide-react";
import Link from "next/link";
import LiveCardIntroVideo from "./LiveCardIntroVideo";
import styles from "./livecard-intro.module.css";

const features = [
  {
    icon: Palette,
    title: "A design that’s yours",
    description:
      "Describe the look, explore ideas or add a reference image. Make a card that feels like your event.",
  },
  {
    icon: CalendarClock,
    title: "Room for changing plans",
    description:
      "Edit dates, times, locations and wording. Save your updates and keep the same card link.",
  },
  {
    icon: Users,
    title: "RSVPs made easy",
    description:
      "Let guests reply right from your card, with responses together in your host dashboard.",
  },
  {
    icon: Gift,
    title: "Your registry, a tap away",
    description:
      "Add a gift registry or wish list link, along with a personal note for your guests.",
  },
  {
    icon: MapPin,
    title: "Help guests get there",
    description:
      "Keep directions and online meeting links handy. Guests can add the event to their calendar, too.",
  },
  {
    icon: Share2,
    title: "Share it your way",
    description: "Send your card link, choose a custom URL or download a JPEG invitation to share.",
  },
];

export default function LiveCardIntro() {
  return (
    <main className={styles.page}>
      <section className={styles.hero} aria-labelledby="live-card-intro-title">
        <div className={styles.copy}>
          <p className={styles.eyebrow}>LIVE CARD</p>
          <h1 id="live-card-intro-title">
            An invitation that <em>keeps up with you.</em>
          </h1>
          <p className={styles.description}>
            Create your own design, share one link, and update the details whenever plans change.
            Everything your guests need, in one beautiful card.
          </p>
        </div>

        <figure className={styles.showcase}>
          <LiveCardIntroVideo />
          <figcaption id="live-card-demo-caption">
            See a Live Card in action. A short, silent walkthrough.
          </figcaption>
        </figure>

        <div className={styles.actions}>
          <Link href="/live-cards?create=1" className={styles.cta}>
            Create your Live Card <ArrowRight size={19} aria-hidden="true" />
          </Link>
          <p className={styles.ctaNote}>Start with your design. Publish when you’re ready.</p>
        </div>
      </section>

      <section className={styles.features} aria-label="Live Card features">
        {features.map(({ icon: Icon, title, description }) => (
          <div className={styles.feature} key={title}>
            <span className={styles.featureIcon}>
              <Icon size={21} aria-hidden="true" />
            </span>
            <div>
              <h2>{title}</h2>
              <p>{description}</p>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
