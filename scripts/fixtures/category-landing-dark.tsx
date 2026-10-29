import { createRoot } from "react-dom/client";
import AnniversariesLandingPage from "../../src/app/anniversaries/page";
import BabyShowersLandingView from "../../src/app/baby-showers/BabyShowersLandingView";
import BirthdaysLandingView from "../../src/app/birthdays/BirthdaysLandingView";
import BridalShowersLandingView from "../../src/app/bridal-showers/BridalShowersLandingView";
import UseCaseLandingView from "../../src/app/category-pages/CategoryLandingView";
import { getUseCasePage } from "../../src/app/category-pages/category-page-data";
import WeddingsLandingView from "../../src/app/weddings/WeddingsLandingView";
import FootballLanding from "../../src/components/football-landing/FootballLanding";
import GymnasticsLanding from "../../src/components/gymnastics-landing/GymnasticsLanding";
import SportsLandingPage from "../../src/components/sports-landing/SportsLandingPage";
import { applyAppearance } from "../../src/lib/appearance";
import { SidebarProvider } from "../../src/app/sidebar-context";
import { MainContentWrapper } from "../../src/components/MainContentWrapper";

declare global {
  interface Window {
    __setLandingAppearance: (theme: "light" | "dark") => void;
  }
}
window.__setLandingAppearance = (theme) => {
  applyAppearance(theme, false);
};
window.__setLandingAppearance("light");

const category = new URLSearchParams(location.search).get("category") || "baby-showers";
const page = getUseCasePage(category)!;
const views = {
  "baby-showers": <BabyShowersLandingView />,
  birthdays: <BirthdaysLandingView page={page} />,
  "bridal-showers": <BridalShowersLandingView />,
  weddings: <WeddingsLandingView page={page} />,
  anniversaries: <AnniversariesLandingPage />,
  "gender-reveal": <UseCaseLandingView page={page} />,
  "signup-forms": <UseCaseLandingView page={page} />,
  gymnastics: <GymnasticsLanding />,
  football: <FootballLanding />,
  sports: <SportsLandingPage />,
};
createRoot(document.getElementById("root")!).render(
  <SidebarProvider>
    <MainContentWrapper isAuthenticated={false} reserveSidebarSpace={false}>
      {views[category as keyof typeof views]}
    </MainContentWrapper>
  </SidebarProvider>,
);
