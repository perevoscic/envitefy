import { notFound } from "next/navigation";
import { buildUseCaseCategoryMetadata } from "../category-pages/category-page";
import { getUseCasePageByPath } from "../category-pages/category-page-data";
import BirthdaysLandingView from "./BirthdaysLandingView";

const CATEGORY_PATH = "/birthdays";

export function generateMetadata() {
  return buildUseCaseCategoryMetadata(CATEGORY_PATH);
}

export default function BirthdaysPage() {
  const page = getUseCasePageByPath(CATEGORY_PATH);
  if (!page) notFound();
  return <BirthdaysLandingView page={page} />;
}
