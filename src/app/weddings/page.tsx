import { notFound } from "next/navigation";
import { buildUseCaseCategoryMetadata } from "../category-pages/category-page";
import { getUseCasePageByPath } from "../category-pages/category-page-data";
import WeddingsLandingView from "./WeddingsLandingView";

const CATEGORY_PATH = "/weddings";

export function generateMetadata() {
  return buildUseCaseCategoryMetadata(CATEGORY_PATH);
}

export default function WeddingsPage() {
  const page = getUseCasePageByPath(CATEGORY_PATH);
  if (!page) notFound();
  return <WeddingsLandingView page={page} />;
}
