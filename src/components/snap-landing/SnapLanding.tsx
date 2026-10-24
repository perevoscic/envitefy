"use client";

import {
  ArrowRight,
  CalendarDays,
  Camera,
  FileImage,
  MapPin,
  ScanLine,
  Share2,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import AuthModal from "@/components/auth/AuthModal";
import MarketingPage from "@/components/marketing/MarketingPage";
import styles from "@/components/marketing/ProductSportsLanding.module.css";
import HeroTopNav from "@/components/navigation/HeroTopNav";
import PublicConciergeWidget from "@/components/navigation/PublicConciergeWidget";
import { marketingPageNavLinks } from "@/config/navigation";

const steps = [
  {
    icon: Camera,
    title: "Snap or upload",
    copy: "Take a photo of a flyer, upload a screenshot, or bring in a PDF schedule.",
  },
  {
    icon: ScanLine,
    title: "Check the details",
    copy: "Envitefy reads the date, time, location and links. Review and edit the details before saving.",
  },
  {
    icon: Share2,
    title: "Share a useful page",
    copy: "Publish when you’re ready. Send one mobile-friendly link with the information your guests need.",
  },
];
const faqs = [
  {
    q: "What can I upload?",
    a: "Start with an invitation image, a flyer, a screenshot or a PDF. A clear, readable source gives Envitefy more useful information to work with.",
  },
  {
    q: "Can I check the extracted details?",
    a: "Yes. You can review and edit the extracted title, date, time, location and other details before explicitly saving or publishing.",
  },
  {
    q: "Does taking a photo publish my event?",
    a: "No. Reading an upload, saving a draft and publishing a page are separate steps. You choose when to publish and share.",
  },
  {
    q: "Do my guests need an app?",
    a: "No. Guests can open your published link in a web browser on their phone, tablet or computer.",
  },
];

export default function SnapLanding() {
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
    <Link href="/snap" className={styles.primary}>
      Snap your invitation <ArrowRight aria-hidden="true" />
    </Link>
  ) : (
    <button type="button" onClick={() => openAuth("signup")} className={styles.primary}>
      Snap your invitation <ArrowRight aria-hidden="true" />
    </button>
  );

  return (
    <MarketingPage tone="product" className={styles.editorial}>
      <HeroTopNav
        editorialTone="product"
        navLinks={marketingPageNavLinks("/snap")}
        variant="transparent-light"
        primaryCtaLabel="Let's create"
        authenticatedPrimaryHref="/snap"
        brandHref="/"
        loginSuccessRedirectUrl="/"
        onGuestLoginAction={() => openAuth("login")}
        onGuestPrimaryAction={() => openAuth("signup")}
      />
      <main>
        <section id="snap" className={styles.hero}>
          <div>
            <p className={styles.eyebrow}>Envitefy Snap · From paper to plans</p>
            <h1 className={styles.title}>
              Keep the invite. <em>Bring it to life.</em>
            </h1>
            <p className={styles.description}>
              A flyer, a screenshot, a lovely paper invitation. Turn what you already have into a
              guest page with dates, directions and the details all together.
            </p>
            <div className={styles.actions}>
              {startAction}
              <a href="#how-it-works" className={styles.secondary}>
                See how it works
              </a>
            </div>
            <p className={styles.note}>Upload. Review. Publish when you’re ready.</p>
          </div>
          <figure className={styles.visual}>
            <div className="relative mx-auto aspect-[4/5] max-w-[22rem] overflow-hidden rounded-t-[45%] rounded-b-2xl">
              <Image
                src="/images/snap-hero-after.webp"
                alt="Envitefy Snap interface after upload conversion"
                fill
                priority
                sizes="(max-width: 767px) 85vw, 352px"
                className="object-cover"
              />
            </div>
            <figcaption className={styles.caption}>
              An existing invitation, organized into a shareable page.
            </figcaption>
          </figure>
        </section>
        <section id="problem-section" className={styles.section}>
          <p className={styles.eyebrow}>A little less searching</p>
          <h2>Stop sharing screenshots. Start sharing events.</h2>
          <p className={styles.intro}>
            Keep the original invitation close, then give guests the useful details in a format that
            works on their phone.
          </p>
          <div className={styles.grid}>
            {[
              {
                icon: CalendarDays,
                title: "The date, easy to find",
                copy: "Keep dates and times together so guests can save the plan to their calendar.",
              },
              {
                icon: MapPin,
                title: "The way there, one tap away",
                copy: "Bring the address, directions and useful arrival notes into the same page.",
              },
              {
                icon: Users,
                title: "The details, ready to share",
                copy: "Give guests a single place to return to when they need the current plan.",
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
        <section id="how-it-works" className={styles.section}>
          <p className={styles.eyebrow}>Three simple steps</p>
          <h2>From the invitation you have to a page you can share.</h2>
          <ol className={styles.grid}>
            {steps.map(({ icon: Icon, title, copy }, index) => (
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
        <section id="use-cases" className={styles.section}>
          <div className={styles.split}>
            <div>
              <p className={styles.eyebrow}>For the things you’re invited to</p>
              <h2>One tool. So many occasions.</h2>
              <p className={styles.intro}>
                Birthday invitations, school flyers, sports schedules and community gatherings.
                Start with the information you already have.
              </p>
            </div>
            <div className={styles.grid} style={{ marginTop: 0 }}>
              {[
                ["Celebrations", "/birthdays"],
                ["Sports & teams", "/sport-events"],
                ["Create your own", "/envitefy-create"],
              ].map(([label, href]) => (
                <Link className={styles.item} href={href} key={href}>
                  <FileImage className="mb-3" aria-hidden="true" />
                  <span className="font-semibold">{label}</span>
                  <ArrowRight className="mt-4" aria-hidden="true" />
                </Link>
              ))}
            </div>
          </div>
        </section>
        <section id="faq" className={styles.section}>
          <p className={styles.eyebrow}>Good to know</p>
          <h2>Snap, explained.</h2>
          <div className={styles.faq}>
            {faqs.map(({ q, a }) => (
              <details key={q}>
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>
        <section className={styles.closing}>
          <h2 className={styles.sectionTitle}>Your invitation already has a beginning.</h2>
          <p className={styles.intro}>Give it a useful home for everything that comes next.</p>
          <div className={styles.actions}>{startAction}</div>
        </section>
      </main>
      <PublicConciergeWidget onSignupSelect={() => openAuth("signup")} />
      <AuthModal
        open={authModalOpen}
        mode={authMode}
        onClose={() => setAuthModalOpen(false)}
        onModeChange={setAuthMode}
        signupSource="snap"
        successRedirectUrl={authMode === "signup" ? "/snap" : "/"}
      />
    </MarketingPage>
  );
}
