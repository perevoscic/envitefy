"use client";

import {
  ArrowRight,
  CalendarDays,
  Hotel,
  MapPinned,
  Share2,
  Smartphone,
  Trophy,
  Upload,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import AuthModal from "@/components/auth/AuthModal";
import MarketingPage from "@/components/marketing/MarketingPage";
import styles from "@/components/marketing/ProductSportsLanding.module.css";
import HeroTopNav from "@/components/navigation/HeroTopNav";
import PublicTemplateGallery from "@/components/templates/PublicTemplateGallery";
import { marketingPageNavLinks } from "@/config/navigation";
import GymnasticsLandingFaq from "./GymnasticsLandingFaq";

const features = [
  {
    icon: CalendarDays,
    title: "A clear competition day",
    copy: "Sessions, check-in, warm-ups and awards timing in sections families can scan.",
  },
  {
    icon: MapPinned,
    title: "An easier arrival",
    copy: "Venue directions, parking, entrances and spectator guidance close at hand.",
  },
  {
    icon: Hotel,
    title: "A weekend in one place",
    copy: "Hotel blocks, booking links, deadlines and travel notes beside the meet details.",
  },
  {
    icon: Users,
    title: "One plan for your people",
    copy: "Share the same current page with families, coaches, athletes and spectators.",
  },
];

function MeetPreview() {
  return (
    <div className={styles.sample} data-authored-preview data-appearance-scope="authored">
      <p className={styles.sampleLabel}>Sample meet page</p>
      <h2>Summit Invitational</h2>
      <p className={styles.sampleMeta}>April 18–20 · Aurora Convention Hall</p>
      <div className={styles.sampleTabs}>
        {["Sessions", "Venue", "Hotels", "Documents"].map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
      <p className={styles.sampleLabel}>Session 3 · Level 7 & Xcel Platinum</p>
      <div className={styles.sampleRows}>
        {[
          ["Coach check-in", "7:20 AM"],
          ["Warm-up", "7:45 AM"],
          ["Awards", "11:40 AM"],
        ].map(([label, time]) => (
          <div className={styles.sampleRow} key={label}>
            <span>{label}</span>
            <strong>{time}</strong>
          </div>
        ))}
      </div>
      <p className={styles.sampleFooter}>
        East entrance · Parking in lots B and C<br />
        The weekend plan, ready for your phone.
      </p>
    </div>
  );
}

export default function GymnasticsLanding() {
  const searchParams = useSearchParams();
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");
  useEffect(() => {
    if (isAuthenticated) return;
    const auth = searchParams?.get("auth");
    if (auth === "signup" || auth === "login") {
      setAuthMode(auth);
      setAuthModalOpen(true);
    }
  }, [isAuthenticated, searchParams]);
  const openAuth = (mode: "login" | "signup") => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };
  const startAction = isAuthenticated ? (
    <Link href="/event/gymnastics" className={styles.primary}>
      Create your meet page <ArrowRight aria-hidden="true" />
    </Link>
  ) : (
    <button className={styles.primary} type="button" onClick={() => openAuth("signup")}>
      Create your meet page <ArrowRight aria-hidden="true" />
    </button>
  );
  return (
    <MarketingPage tone="sports" className={styles.editorial}>
      <HeroTopNav
        navLinks={marketingPageNavLinks("/gymnastics")}
        variant="transparent-light"
        primaryCtaLabel="Browse templates"
        authenticatedPrimaryHref="/event/gymnastics"
        brandHref="/"
        loginSuccessRedirectUrl="/"
        onGuestLoginAction={() => openAuth("login")}
        onGuestPrimaryAction={() =>
          document.getElementById("templates")?.scrollIntoView({
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
              ? "auto"
              : "smooth",
          })
        }
      />
      <main>
        <section id="hero" className={styles.hero}>
          <div>
            <p className={styles.eyebrow}>Gymnastics meet pages</p>
            <h1 className={styles.title}>
              The whole meet. <em>A little clearer.</em>
            </h1>
            <p className={styles.description}>
              Turn a meet packet into one polished page. Sessions, venue notes, hotel blocks and
              updates, ready for every family’s phone.
            </p>
            <div className={styles.actions}>
              <a href="#templates" className={styles.primary}>
                Start your meet page <ArrowRight aria-hidden="true" />
              </a>
              <a href="#how-it-works" className={styles.secondary}>
                See how it works
              </a>
            </div>
            <p className={styles.note}>One link. No app for families to install.</p>
          </div>
          <figure className={styles.visual}>
            <MeetPreview />
            <figcaption className={styles.caption}>
              Illustrative meet details · Your schedule, your event.
            </figcaption>
          </figure>
        </section>
        <PublicTemplateGallery category="gymnastics" featured />
        <section id="features" className={styles.section}>
          <p className={styles.eyebrow}>Made for meet weekends</p>
          <h2>Less packet hunting. More time for the moment.</h2>
          <div className={`${styles.grid} ${styles.four}`}>
            {features.map(({ icon: Icon, title, copy }) => (
              <article key={title} className={styles.item}>
                <Icon aria-hidden="true" />
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </section>
        <section id="how-it-works" className={styles.section}>
          <p className={styles.eyebrow}>From packet to page</p>
          <h2>Bring the information. Make the weekend easy to follow.</h2>
          <ol className={styles.grid}>
            {[
              {
                icon: Upload,
                title: "Bring in the meet details",
                copy: "Upload the meet packet, schedule, venue notes or supporting documents. You can also start from a design.",
              },
              {
                icon: CalendarDays,
                title: "Review the plan",
                copy: "Check sessions, times, locations and useful links. Make the wording and design your own before saving.",
              },
              {
                icon: Share2,
                title: "Publish and share",
                copy: "Send the finished page to families and coaches. Save later updates to the same link when plans change.",
              },
            ].map(({ icon: Icon, title, copy }, index) => (
              <li className={styles.item} key={title}>
                <span className={styles.number}>0{index + 1}</span>
                <h3>
                  <Icon className="mr-2 inline h-4 w-4" aria-hidden="true" />
                  {title}
                </h3>
                <p>{copy}</p>
              </li>
            ))}
          </ol>
        </section>
        <section id="preview" className={styles.section}>
          <div className={styles.split}>
            <div>
              <p className={styles.eyebrow}>A useful transformation</p>
              <h2>The same information. A much friendlier format.</h2>
              <p className={styles.intro}>
                Keep the important details from your packet and give them a home families can read
                without zooming into a PDF. Preview the page before publishing.
              </p>
              <div className={styles.actions}>
                <a href="#templates" className={styles.secondary}>
                  Find your meet’s look <ArrowRight aria-hidden="true" />
                </a>
              </div>
            </div>
            <div className={styles.packetPair}>
              <figure>
                <img
                  src="/images/gymanstic-1-landing.png"
                  alt="Gymnastics meet packet preview"
                  loading="lazy"
                  width="692"
                  height="794"
                />
                <figcaption className={styles.caption}>Your meet packet</figcaption>
              </figure>
              <figure>
                <img
                  src="/images/gymanstic-2-landing.png"
                  alt="Gymnastics meet page preview"
                  loading="lazy"
                  width="200"
                  height="402"
                />
                <figcaption className={styles.caption}>Your organized page</figcaption>
              </figure>
            </div>
          </div>
        </section>
        <section id="use-cases" className={styles.section}>
          <p className={styles.eyebrow}>For everyone showing up</p>
          <h2>Give your people a clear plan.</h2>
          <div className={styles.grid}>
            {[
              {
                icon: Smartphone,
                title: "For families",
                copy: "Find arrival times, parking and spectator information on the way to the venue.",
              },
              {
                icon: Share2,
                title: "For coaches",
                copy: "Keep the latest schedule and team notes in one familiar place.",
              },
              {
                icon: Trophy,
                title: "For organizers",
                copy: "Present sessions, venue guidance, hotels and documents together in a polished meet page.",
              },
            ].map(({ icon: Icon, title, copy }) => (
              <article className={styles.item} key={title}>
                <Icon aria-hidden="true" />
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </section>
        <section id="why-envitefy" className={styles.section}>
          <p className={styles.eyebrow}>A home for the whole weekend</p>
          <h2>One link that stays with the meet.</h2>
          <p className={styles.intro}>
            Guests open the page in their browser. You keep control of what’s on it, choose when to
            publish, and save changes when the schedule needs an update.
          </p>
        </section>
        <GymnasticsLandingFaq />
        <section className={styles.closing}>
          <h2 className={styles.sectionTitle}>A polished welcome for your next meet.</h2>
          <div className={styles.actions}>
            {startAction}
            <Link href="/snap" className={styles.secondary}>
              Explore Snap
            </Link>
          </div>
        </section>
      </main>
      <AuthModal
        open={authModalOpen}
        mode={authMode}
        onClose={() => setAuthModalOpen(false)}
        onModeChange={setAuthMode}
        signupSource="gymnastics"
        successRedirectUrl={authMode === "signup" ? "/event/gymnastics" : "/"}
      />
    </MarketingPage>
  );
}
