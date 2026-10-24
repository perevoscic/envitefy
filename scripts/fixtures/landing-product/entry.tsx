import { createRoot } from "react-dom/client";
import LandingExperience from "@/app/landing/LandingExperience";
import ThemeProvider from "@/components/AppearanceProvider";
import PwaInstallToast from "@/components/PWAInstallToast";
import ConditionalFooter from "@/components/ConditionalFooter";

window.__landingProductNavigation = [];
window.__landingProductAuth = [];
(window as any).__snapInstallDeferredPrompt = {
  prompt: () => {
    throw new Error("The landing page must not request installation.");
  },
  userChoice: Promise.resolve({ outcome: "dismissed", platform: "fixture" }),
};

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <PwaInstallToast />
    <LandingExperience />
    <ConditionalFooter serverSession={null} />
  </ThemeProvider>,
);
