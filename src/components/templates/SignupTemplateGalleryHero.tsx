import { ArrowRight, CalendarDays, Mail, MapPin, UserRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import "@/components/birthdays/redesign/birthday-fonts.css";
import type { PublicTemplate } from "@/lib/public-template-shared";
import { templateEditorHref } from "@/lib/template-categories";
import { trackTemplateEvent } from "@/lib/template-tracking";
import styles from "./SignupTemplateGalleryHero.module.css";

const heroDesigns = [
  {
    id: "church-and-community--community-garden-workday",
    title: "Community Volunteer Day",
    date: "Sat, Apr 24, 2027",
    venue: "Riverside Park",
    kind: "volunteer",
  },
  {
    id: "fundraising-and-food--potluck-dinner",
    title: "Neighborhood Potluck",
    date: "Sun, May 2, 2027",
    venue: "Maplewood Community Center",
    kind: "potluck",
  },
  {
    id: "school-and-education--school-field-day",
    title: "School Field Day",
    date: "Fri, May 14, 2027",
    venue: "Lincoln Elementary",
    kind: "school",
  },
] as const;

function VolunteerPreview() {
  return (
    <div className={styles.signupBody}>
      <p className={styles.sectionLabel}>Choose a time slot</p>
      <div className={styles.timeSlots}>
        {[
          ["9:00 – 11:00 AM", "6 spots left"],
          ["11:00 AM – 1:00 PM", "4 spots left"],
          ["1:00 – 3:00 PM", "8 spots left"],
        ].map(([time, available]) => (
          <div className={styles.timeSlot} key={time}>
            <span className={styles.checkbox} />
            <span className={styles.slotDetails}>
              <span>{time}</span>
              <span className={styles.availability}>{available}</span>
            </span>
            <span className={styles.slotAction}>Sign up</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PotluckPreview({ artwork }: { artwork: string }) {
  return (
    <div className={styles.signupBody}>
      <p className={styles.sectionLabel}>What would you like to bring?</p>
      <div className={styles.foodChoices}>
        {[
          ["Main dish", "5 of 8 filled", artwork],
          [
            "Side dish",
            "3 of 8 filled",
            "/templates/signup/holidays/july-fourth/tomato-salad-bowl.webp",
          ],
          [
            "Dessert",
            "2 of 8 filled",
            "/templates/signup/photographic/fundraising-and-food/bake-sale.webp",
          ],
        ].map(([name, filled, photo]) => (
          <div className={styles.foodChoice} key={name}>
            <div className={styles.foodPhoto}>
              <Image src={photo} alt="" fill sizes="90px" />
            </div>
            <span>{name}</span>
            <span className={styles.foodFilled}>{filled}</span>
          </div>
        ))}
      </div>
      <div className={styles.previewAction}>
        Join the table <ArrowRight />
      </div>
    </div>
  );
}

function SchoolPreview() {
  return (
    <div className={styles.signupBody}>
      <p className={styles.sectionLabel}>Volunteer for a role</p>
      <div className={styles.roleChoices}>
        <span>Check-in</span>
        <span>Games</span>
        <span>Refreshments</span>
      </div>
      <div className={styles.previewField}>
        <span>Name</span>
        <div>
          <UserRound /> Your name
        </div>
      </div>
      <div className={styles.previewField}>
        <span>Email</span>
        <div>
          <Mail /> you@example.com
        </div>
      </div>
      <div className={styles.previewAction}>
        Join as a volunteer <ArrowRight />
      </div>
    </div>
  );
}

/** Preview links keep their original artwork and authored colors in either app appearance. */
export default function SignupTemplateGalleryHero({
  templates,
  children,
}: {
  templates: PublicTemplate[];
  children?: ReactNode;
}) {
  const designs = heroDesigns.flatMap((sample) => {
    const template = templates.find((candidate) => candidate.id === sample.id);
    return template ? [{ sample, template }] : [];
  });

  return (
    <header className={styles.hero} data-signup-template-hero>
      <div className={styles.heroInner}>
        <div className={styles.copy}>
          <p className={styles.eyebrow}>Sign-up form templates</p>
          <h1 id="signup-templates-title" className={styles.title}>
            Make joining in
            <br />
            feel effortless.
          </h1>
          <p className={styles.description}>
            Share what you’re organizing, the roles or items you need, and your style. Generate a
            sign-up page that welcomes everyone in.
          </p>
          <div className={styles.actions}>{children}</div>
        </div>
        <div
          className={styles.previews}
          role="group"
          aria-label="Featured sign-up form template designs"
        >
          {designs.map(({ template, sample }, index) => (
            <Link
              key={template.id}
              className={styles.previewCard}
              href={templateEditorHref("signup-forms", template.id)}
              prefetch={false}
              aria-label={`Customize ${template.name}`}
              data-signup-hero-template={template.id}
              data-preview-kind={sample.kind}
              onClick={() => trackTemplateEvent("template_selected", "signup-forms", template.id)}
            >
              <div
                className={styles.previewContent}
                data-signup-preview-paper
                data-appearance-scope="authored"
                aria-hidden="true"
              >
                <div className={styles.coverPhoto}>
                  <Image
                    src={template.heroImage}
                    alt=""
                    fill
                    priority={index === 1}
                    sizes="(min-width: 1600px) 310px, (min-width: 700px) 23vw, 47vw"
                  />
                </div>
                <div className={styles.previewIntro}>
                  <p className={styles.previewTitle}>
                    {sample.kind === "volunteer" ? (
                      <>
                        Community
                        <br />
                        Volunteer Day
                      </>
                    ) : sample.kind === "potluck" ? (
                      <>
                        Neighborhood
                        <br />
                        Potluck
                      </>
                    ) : (
                      sample.title
                    )}
                  </p>
                  <div className={styles.eventDetails}>
                    <span>
                      <CalendarDays /> {sample.date}
                    </span>
                    <span>
                      <MapPin /> {sample.venue}
                    </span>
                  </div>
                </div>
                {sample.kind === "volunteer" ? (
                  <VolunteerPreview />
                ) : sample.kind === "potluck" ? (
                  <PotluckPreview artwork={template.heroImage} />
                ) : (
                  <SchoolPreview />
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
