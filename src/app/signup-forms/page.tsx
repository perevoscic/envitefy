import { buildUseCaseCategoryMetadata, UseCaseCategoryPage } from "../category-pages/category-page";

const CATEGORY_PATH = "/signup-forms";

export function generateMetadata() {
  return buildUseCaseCategoryMetadata(CATEGORY_PATH);
}

export default function SignupFormsPage() {
  return <UseCaseCategoryPage path={CATEGORY_PATH} />;
}
