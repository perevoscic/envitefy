import { buildUseCaseCategoryMetadata, UseCaseCategoryPage } from "../category-pages/category-page";

const CATEGORY_PATH = "/birthdays";

export function generateMetadata() {
  return buildUseCaseCategoryMetadata(CATEGORY_PATH);
}

export default function BirthdaysPage() {
  return <UseCaseCategoryPage path={CATEGORY_PATH} />;
}
