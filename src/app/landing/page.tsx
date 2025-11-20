import LandingNav from "./components/LandingNav";
import Hero from "./sections/Hero";
import Verticals from "./sections/Verticals";
import Features from "./sections/Features";
import HowItWorks from "./sections/HowItWorks";
import FAQ from "./sections/FAQ";
import FinalCta from "./sections/FinalCta";

export default async function LandingPage() {
  return (
    <main className="min-h-screen w-full bg-white selection:bg-blue-100 selection:text-blue-900">
      <LandingNav />
      <Hero />
      <Verticals />
      <HowItWorks />
      <Features />
      <FAQ />
      <FinalCta />

      {/* Global Footer is handled in layout.tsx, but we might want a cleaner one for landing. 
          The layout footer is currently visible. */}
    </main>
  );
}
