export type LandingHeroFrame = {
  src: string;
  alt: string;
  objectPosition?: string;
};

export const LANDING_HERO_ROTATE_MS = 7000;

export const landingHeroGalleries = {
  weddings: [
    {
      src: "/images/landing/hero/garden-vows-desktop.webp",
      alt: "Garden wedding ceremony at golden hour",
      objectPosition: "center",
    },
    {
      src: "/images/landing/hero/galleries/weddings-hero-2.webp",
      alt: "Bride and groom walking a flower-lined garden aisle",
    },
    {
      src: "/images/landing/hero/galleries/weddings-hero-3.webp",
      alt: "Candlelit luxury wedding reception tables in a garden estate",
    },
    {
      src: "/images/landing/hero/galleries/weddings-hero-4.webp",
      alt: "Destination wedding cocktail hour on a villa terrace",
    },
  ],
  "bridal-showers": [
    {
      src: "/images/landing/hero/garden-brunch-desktop.webp",
      alt: "Garden brunch bridal shower gathering",
      objectPosition: "center",
    },
    {
      src: "/images/landing/hero/galleries/bridal-hero-2.webp",
      alt: "Sunlit garden bridal shower brunch table",
    },
    {
      src: "/images/landing/hero/galleries/bridal-hero-3.webp",
      alt: "Elegant bridal shower gift table on a garden patio",
    },
    {
      src: "/images/landing/hero/galleries/bridal-hero-4.webp",
      alt: "High-tea bridal shower under a garden tent",
    },
  ],
  "baby-showers": [
    {
      src: "/images/landing/hero/baby-shower-desktop.webp",
      alt: "Teddy-bear baby shower celebration",
      objectPosition: "center",
    },
    {
      src: "/images/landing/hero/galleries/baby-hero-2.webp",
      alt: "Backyard baby shower table with greenery and cake",
    },
    {
      src: "/images/landing/hero/galleries/baby-hero-3.webp",
      alt: "Terracotta floral baby shower picnic",
    },
    {
      src: "/images/landing/hero/galleries/baby-hero-4.webp",
      alt: "Moon and stars evening baby shower",
    },
  ],
  gymnastics: [
    {
      src: "/images/landing/hero/galleries/gymnastics-hero-1.webp",
      alt: "Gymnastics meet arena with a beam routine in progress",
    },
    {
      src: "/images/landing/hero/galleries/gymnastics-hero-2.webp",
      alt: "Gymnast mid-air during a floor routine",
    },
    {
      src: "/images/landing/hero/galleries/gymnastics-hero-3.webp",
      alt: "Uneven bars release at a packed gymnastics meet",
    },
    {
      src: "/images/landing/hero/galleries/gymnastics-hero-4.webp",
      alt: "Families watching a gymnastics meet from the stands",
    },
  ],
  sports: [
    {
      src: "/images/landing/hero/friday-night-lights-desktop.webp",
      alt: "Friday night football lights over a packed stadium",
      objectPosition: "center",
    },
    {
      src: "/images/landing/hero/galleries/sports-hero-2.webp",
      alt: "Youth soccer match at dusk",
    },
    {
      src: "/images/landing/hero/galleries/sports-hero-3.webp",
      alt: "High school basketball game under gym lights",
    },
    {
      src: "/images/landing/hero/galleries/sports-hero-4.webp",
      alt: "Night baseball game under stadium lights",
    },
  ],
  "signup-forms": [
    {
      src: "/images/landing/hero/lincoln-discovery-desktop.webp",
      alt: "School and community event gathering",
      objectPosition: "center",
    },
    {
      src: "/images/landing/hero/galleries/signup-hero-2.webp",
      alt: "Community volunteers organizing a school carnival",
    },
    {
      src: "/images/landing/hero/galleries/signup-hero-3.webp",
      alt: "Potluck dishes on a community hall table",
    },
    {
      src: "/images/landing/hero/galleries/signup-hero-4.webp",
      alt: "Parents volunteering at a classroom event",
    },
  ],
  "gender-reveal": [
    {
      src: "/images/landing/template-proof/generated/gender-reveal.webp",
      alt: "Gender reveal celebration",
      objectPosition: "center",
    },
    {
      src: "/images/landing/hero/galleries/gender-hero-2.webp",
      alt: "Backyard gender reveal with pink and blue balloons",
    },
    {
      src: "/images/landing/hero/galleries/gender-hero-3.webp",
      alt: "Colored smoke gender reveal in a backyard",
    },
    {
      src: "/images/landing/hero/galleries/gender-hero-4.webp",
      alt: "Pastel gender reveal cake at an outdoor party",
    },
  ],
  birthdays: [
    {
      src: "/images/landing/hero/birthday-dino-desktop.webp",
      alt: "Birthday party celebration",
      objectPosition: "center",
    },
    {
      src: "/images/landing/hero/galleries/birthdays-hero-2.webp",
      alt: "Outdoor birthday dessert table at golden hour",
    },
    {
      src: "/images/landing/hero/galleries/birthdays-hero-3.webp",
      alt: "Indoor birthday cake celebration",
    },
    {
      src: "/images/landing/hero/galleries/birthdays-hero-4.webp",
      alt: "Evening patio birthday party under string lights",
    },
  ],
} as const satisfies Record<string, LandingHeroFrame[]>;
