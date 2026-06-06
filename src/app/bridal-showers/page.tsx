import { buildUseCaseCategoryMetadata, UseCaseCategoryPage } from "../category-pages/category-page";

const CATEGORY_PATH = "/bridal-showers";

export function generateMetadata() {
  return buildUseCaseCategoryMetadata(CATEGORY_PATH);
}

export default function BridalShowersPage() {
  return <UseCaseCategoryPage path={CATEGORY_PATH} />;
}
