import type { PublicTemplate } from "@/lib/public-template-shared";
export type CategoryThumbnailProps = { category: import("@/lib/template-categories").TemplateCategory; template: Pick<PublicTemplate, "id" | "name" | "heroImage"> };
