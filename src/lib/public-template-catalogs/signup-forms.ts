import { SIGNUP_TEMPLATES } from "@/assets/signup-templates";
import { SIGNUP_THEMES } from "../signup-themes";
import { schoolSignupKeywords } from "../public-template-shared";
import type { PublicTemplate } from "../public-template-shared";

export function getTemplates(): PublicTemplate[] {
      return [
        ...SIGNUP_THEMES.map((theme) => ({
          id: `editorial--${theme.id}`,
          name: theme.name,
          description: theme.description,
          style: "Editorial collection",
          ...(theme.id === "school-days"
            ? {
                audience: "School & Education",
                keywords: schoolSignupKeywords,
              }
            : {}),
          heroImage: theme.artwork,
        })),
        ...Object.entries(SIGNUP_TEMPLATES)
          .flatMap(([group, designs]) =>
            designs.map((design) => ({
              id: design.path
                .replace("/templates/signup/", "")
                .replace(/\.webp$/, "")
                .replaceAll("/", "--"),
              name: design.name,
              description:
                design.description ||
                `Make ${design.name.toLowerCase()} your own with signup sections, questions, and slots.`,
              style: group,
              ...(design.audience
                ? { audience: design.audience }
                : /school|classroom|teacher|field.day|pta|pto|recess|conference/i.test(design.name)
                  ? {
                      audience: "School & Education",
                      keywords: schoolSignupKeywords,
                    }
                  : {}),
              ...(design.keywords ? { keywords: design.keywords } : {}),
              ...(design.occasion ? { occasion: design.occasion } : {}),
              heroImage: design.artworkPath || design.path,
            })),
          )
          .filter(
            (template, index, templates) =>
              templates.findIndex((candidate) => candidate.id === template.id) === index,
          ),
      ];
}
