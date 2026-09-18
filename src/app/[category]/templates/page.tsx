import { notFound, redirect } from "next/navigation";
import PublicTemplateGallery from "@/components/templates/PublicTemplateGallery";
import TemplateGalleryLayout from "@/components/templates/TemplateGalleryLayout";
import { getTemplateCategory } from "@/lib/template-categories";

type Props = {
  params: Promise<{ category: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};
export async function generateMetadata({ params }: Props) {
  const category = getTemplateCategory((await params).category);
  if (!category) return {};
  return {
    title: `${category.name} templates | Envitefy`,
    description: `Browse ${category.name.toLowerCase()} templates and customize your own. Create an account when you’re ready to save and share.`,
    alternates: { canonical: `/${category.slug}/templates` },
  };
}
export default async function TemplatesPage({ params, searchParams }: Props) {
  const { category: slug } = await params;
  const category = getTemplateCategory(slug);
  if (!category) notFound();
  if (slug !== category.slug) redirect(`/${category.slug}/templates`);
  const query = await searchParams;
  return (
    <TemplateGalleryLayout category={category.slug}>
      <PublicTemplateGallery
        category={category.slug}
        customThemeRequested={query?.customTheme === "1"}
        customThemeExpired={query?.themeExpired === "1"}
      />
    </TemplateGalleryLayout>
  );
}
