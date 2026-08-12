import { buildUseCaseCategoryMetadata } from "../category-pages/category-page";
import BridalShowersLandingView from "./BridalShowersLandingView";

const CATEGORY_PATH = "/bridal-showers";

export function generateMetadata() {
  return buildUseCaseCategoryMetadata(CATEGORY_PATH);
}

export default function BridalShowersPage() {
  return <BridalShowersLandingView />;
}
