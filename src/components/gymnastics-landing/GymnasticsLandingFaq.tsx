import styles from "@/components/marketing/ProductSportsLanding.module.css";

const items = [
  {
    q: "Can Envitefy turn our gymnastics meet packet or schedule into a live page?",
    a: "Yes. Upload meet packets, rundowns, venue sheets, and supporting PDFs. Envitefy structures the details into a single mobile-friendly meet page so families are not hunting through attachments and group chats.",
  },
  {
    q: "How do rotations, warm-ups, and awards show up for parents?",
    a: "Meet blocks can include check-in, warm-up windows, rotation context, and awards timing in scannable sections. The goal is a clear timeline parents can read on a phone at the venue, not a zoomed-in spreadsheet.",
  },
  {
    q: "Can hotel blocks, maps, and parking live on the same page as the schedule?",
    a: "Yes. Travel details like hotel booking links and deadlines, maps, parking notes, and shuttle info can sit alongside the competition timeline so the whole weekend is one link.",
  },
  {
    q: "Do spectators and families need to install an app?",
    a: "No. Shared meet pages open in the browser on phones, tablets, and desktops. You distribute one link by text, email, or team channels.",
  },
  {
    q: "What happens when the schedule changes at the last minute?",
    a: "You can update the published page and share the same link. Posting a change once helps every family see the latest version instead of resending PDFs.",
  },
  {
    q: "How is Gymnastics on Envitefy different from Snap?",
    a: "Gymnastics is built around meet pages: schedules, venues, hotels, team coordination, and updates in one hosted page. Snap is the broader capture flow for invites, flyers, and many other event types. Gymnastics accounts include both workflows.",
  },
  {
    q: "Who typically publishes the page: a club, meet director, or team parent?",
    a: "Anyone organizing or communicating the meet can build the page: meet directors, club admins, booster reps, or coaches. The important part is one authoritative link for athletes, parents, and staff.",
  },
] as const;

export default function GymnasticsLandingFaq() {
  return (
    <section id="faq" className={styles.section} aria-labelledby="gymnastics-faq-heading">
      <p className={styles.eyebrow}>Good to know</p>
      <h2 id="gymnastics-faq-heading">Gymnastics meet pages, answered.</h2>
      <div className={styles.faq}>
        {items.map((item) => (
          <details key={item.q}>
            <summary>{item.q}</summary>
            <p>{item.a}</p>
          </details>
        ))}
      </div>
      <p className={styles.note}>
        More questions?{" "}
        <a href="/faq" className="underline underline-offset-4">
          Read the Envitefy FAQ.
        </a>
      </p>
    </section>
  );
}
