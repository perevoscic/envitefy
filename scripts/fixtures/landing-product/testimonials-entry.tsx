import { createRoot } from "react-dom/client";
import LandingTestimonials from "@/app/landing/sections/LandingTestimonials";
import ThemeProvider from "@/components/AppearanceProvider";
import MarketingPage from "@/components/marketing/MarketingPage";

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <MarketingPage>
      <div style={{ height: "100vh" }} aria-hidden="true" />
      <LandingTestimonials />
      <div style={{ height: "100vh" }} aria-hidden="true" />
    </MarketingPage>
  </ThemeProvider>,
);
