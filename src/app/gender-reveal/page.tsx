import { buildUseCaseCategoryMetadata, UseCaseCategoryPage } from "../category-pages/category-page";

const CATEGORY_PATH = "/gender-reveal";

export function generateMetadata() {
  return buildUseCaseCategoryMetadata(CATEGORY_PATH);
}

export default function GenderRevealPage() {
  return <UseCaseCategoryPage path={CATEGORY_PATH} />;
}
