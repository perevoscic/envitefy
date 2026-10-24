import { createRoot } from "react-dom/client";
import LandingGuestBenefits from "@/app/landing/sections/LandingGuestBenefits";
import ThemeProvider from "@/components/AppearanceProvider";
import MarketingPage from "@/components/marketing/MarketingPage";

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <MarketingPage>
      <div style={{ height: "20vh" }} aria-hidden="true" />
      <LandingGuestBenefits />
      <div style={{ height: "100vh" }} aria-hidden="true" />
    </MarketingPage>
  </ThemeProvider>,
);
