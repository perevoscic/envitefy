import { buildUseCaseCategoryMetadata } from "../category-pages/category-page";
import BabyShowersLandingView from "./BabyShowersLandingView";

const CATEGORY_PATH = "/baby-showers";

export function generateMetadata() {
  return buildUseCaseCategoryMetadata(CATEGORY_PATH);
}

export default function BabyShowersPage() {
  return <BabyShowersLandingView />;
}
