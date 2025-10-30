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
