import { buildUseCaseCategoryMetadata, UseCaseCategoryPage } from "../category-pages/category-page";

const CATEGORY_PATH = "/weddings";

export function generateMetadata() {
  return buildUseCaseCategoryMetadata(CATEGORY_PATH);
}

export default function WeddingsPage() {
  return <UseCaseCategoryPage path={CATEGORY_PATH} />;
}
