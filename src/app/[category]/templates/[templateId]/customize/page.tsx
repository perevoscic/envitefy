import { notFound, redirect } from "next/navigation";
import { getTemplateCategory } from "@/lib/template-categories";
import { getPublicTemplate } from "@/lib/public-template-catalog";
import PublicTemplateEditor from "@/components/templates/PublicTemplateEditor";

export const metadata = {
  title: "Make it yours | Envitefy",
  robots: { index: false, follow: false },
};
export default async function CustomizeTemplatePage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string; templateId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { category: slug, templateId } = await params;
  const category = getTemplateCategory(slug);
  if (!category || !getPublicTemplate(category.slug, templateId)) notFound();
  const query = await searchParams;
  if (category.slug === "signup-forms" && query?.customTheme === "1" && !query.edit && !query.draft)
    redirect("/signup-forms/templates?customTheme=1");
  return <PublicTemplateEditor category={category.slug} templateId={templateId} />;
}
