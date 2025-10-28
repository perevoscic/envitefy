import LoginHero from "./LoginHero";
import Hero from "./sections/Hero";
import CreateShare from "./sections/CreateShare";
import HowItWorks from "./sections/HowItWorks";
import FeatureGrid from "./sections/FeatureGrid";
import Integrations from "./sections/Integrations";
import Testimonials from "./sections/Testimonials";
import FinalCta from "./sections/FinalCta";
import FAQ from "./sections/FAQ";
import UseCases from "./sections/UseCases";
import Link from "next/link";

export default async function LandingPage() {
  return (
    <main className="min-h-screen w-full bg-background text-foreground landing-dark-gradient">
      <LoginHero />
      <Hero />

      {/* Public purpose and Google data use sections for OAuth review */}
      <section aria-labelledby="what-is-envitefy" className="w-full">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h2 id="what-is-envitefy" className="text-2xl sm:text-3xl font-bold">
            What is Envitefy?
          </h2>
          <p className="mt-2 text-foreground/80 max-w-3xl">
            Envitefy turns invitations and flyers into real calendar events.
            Upload a photo or PDF and we extract the title, date, time, and
            location, then let you download an ICS file or add the event
            directly to Google Calendar or Microsoft Outlook.
          </p>
        </div>
      </section>

      <section aria-labelledby="google-data-use" className="w-full">
        <div className="max-w-7xl mx-auto px-6 pb-4">
          <h3
            id="google-data-use"
            className="text-xl sm:text-2xl font-semibold"
          >
            How Envitefy uses your Google data
          </h3>
          <ul className="mt-2 list-disc pl-5 text-foreground/80 space-y-1 max-w-3xl">
            <li>
              When you choose “Continue with Google,” we request Calendar
              permission to create and update events you save with Envitefy.
            </li>
            <li>We do not read your email, contacts, or other Google data.</li>
            <li>
              We store a Google refresh token only to add events on your behalf;
              you can disconnect anytime in your account or at
              myaccount.google.com.
            </li>
          </ul>
          <p className="mt-2 text-foreground/70 max-w-3xl">
            Questions? Contact us at{" "}
            <a href="mailto:contact@envitefy.com" className="underline">
              contact@envitefy.com
            </a>
            . See our{" "}
            <Link href="https://envitefy.com/privacy" className="underline">
              Privacy Policy
            </Link>{" "}
            and{" "}
            <Link href="https://envitefy.com/terms" className="underline">
              Terms
            </Link>
            .
          </p>
        </div>
      </section>
      <CreateShare />
      <HowItWorks />
      <FeatureGrid />
      <Integrations />
      <Testimonials />
      <UseCases />
      <FAQ />
      <FinalCta />
    </main>
  );
}
