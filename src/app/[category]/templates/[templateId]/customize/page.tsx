import { notFound } from "next/navigation";
import { getTemplateCategory } from "@/lib/template-categories";
import { getPublicTemplate } from "@/lib/public-template-catalog";
import PublicTemplateEditor from "@/components/templates/PublicTemplateEditor";

export const metadata = { title: "Make it yours | Envitefy", robots: { index: false, follow: false } };
export default async function CustomizeTemplatePage({ params }: { params: Promise<{ category: string; templateId: string }> }) {
  const { category: slug, templateId } = await params;
  const category = getTemplateCategory(slug);
  if (!category || !getPublicTemplate(category.slug, templateId)) notFound();
  return <PublicTemplateEditor category={category.slug} templateId={templateId} />;
}
