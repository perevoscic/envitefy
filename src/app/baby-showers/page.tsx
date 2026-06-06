import { buildUseCaseCategoryMetadata, UseCaseCategoryPage } from "../category-pages/category-page";

const CATEGORY_PATH = "/baby-showers";

export function generateMetadata() {
  return buildUseCaseCategoryMetadata(CATEGORY_PATH);
}

export default function BabyShowersPage() {
  return <UseCaseCategoryPage path={CATEGORY_PATH} />;
}
