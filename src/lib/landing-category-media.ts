import type { LandingCategoryId } from "@/app/landing/landing-data";

type LandingCategoryMedia = {
  src: string;
  alt: string;
  objectPosition?: string;
};

export const landingCategoryMedia: Record<LandingCategoryId, LandingCategoryMedia> = {
  weddings: {
    src: "/images/landing/categories/stories-2026/weddings.webp",
    alt: "Bride and groom sharing a candid moment in a stone courtyard",
  },
  birthdays: {
    src: "/images/landing/categories/stories-2026/birthdays.webp",
    alt: "Children celebrating together around a birthday cake",
  },
  gymnastics: {
    src: "/images/landing/categories/editorial-2026/gymnastics.webp",
    alt: "Adult gymnast in a navy leotard on a balance beam in a sunlit training gym",
  },
  "baby-showers": {
    src: "/images/landing/categories/stories-2026/baby-showers.webp",
    alt: "Wrapped baby gifts with tiny knit clothes and booties",
  },
  "bridal-showers": {
    src: "/images/landing/categories/stories-2026/bridal-showers.webp",
    alt: "Adult women friends celebrating a bride at an indoor bridal shower",
    objectPosition: "center 30%",
  },
  "gender-reveal": {
    src: "/images/landing/categories/stories-2026/gender-reveal.webp",
    alt: "Adult couple celebrating beneath vivid pink and blue confetti and balloons",
  },
  "signup-forms": {
    src: "/images/landing/categories/stories-2026/signup-forms.webp",
    alt: "Adults at a community volunteer sign-up table with a clipboard in a bright community center",
  },
  sports: {
    src: "/images/landing/categories/stories-2026/sports.webp",
    alt: "Basketball, soccer, American football, volleyball and tennis gear together on a sports court",
  },
};
