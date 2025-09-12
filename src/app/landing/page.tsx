import LoginHero from "./LoginHero";
import Hero from "./sections/Hero";
import HowItWorks from "./sections/HowItWorks";
import FeatureGrid from "./sections/FeatureGrid";
import Integrations from "./sections/Integrations";
import Testimonials from "./sections/Testimonials";
import FinalCta from "./sections/FinalCta";
import FAQ from "./sections/FAQ";
import UseCases from "./sections/UseCases";

export default async function LandingPage() {
  return (
    <main className="min-h-screen w-full bg-background text-foreground landing-dark-gradient">
      <LoginHero />
      <Hero />
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
