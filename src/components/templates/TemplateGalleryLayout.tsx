"use client";

import { Fragment, type ReactNode } from "react";
import { categoryGalleryPageClassName } from "@/components/events/category-gallery-page";
import MarketingPage from "@/components/marketing/MarketingPage";
import SignedOutPageChrome from "@/components/navigation/SignedOutPageChrome";
import { useMenuOptional } from "@/contexts/MenuContext";
import type { TemplateCategory } from "@/lib/template-categories";
import babyShowerStyles from "./BabyShowerTemplateGalleryHero.module.css";
import birthdayStyles from "./BirthdayTemplateGalleryHero.module.css";
import bridalShowerStyles from "./BridalShowerTemplateGalleryHero.module.css";
import styles from "./public-gallery.module.css";
import signupStyles from "./SignupTemplateGalleryHero.module.css";
import weddingStyles from "./WeddingTemplateGalleryHero.module.css";

export default function TemplateGalleryLayout({
  category,
  children,
}: {
  category: TemplateCategory;
  children: ReactNode;
}) {
  const appMenu = useMenuOptional();
  const Wrapper = appMenu ? Fragment : MarketingPage;
  const heroStyles =
    category === "weddings"
      ? weddingStyles
      : category === "birthdays"
        ? birthdayStyles
        : category === "baby-showers"
          ? babyShowerStyles
          : category === "bridal-showers"
            ? bridalShowerStyles
            : category === "signup-forms"
              ? signupStyles
              : undefined;

  return (
    <Wrapper {...(!appMenu && heroStyles ? { className: heroStyles.page } : {})}>
      {!appMenu && (
        <SignedOutPageChrome
          activeBottomNavLabel="Templates"
          brandHref="/"
          topNavVariant="transparent-light"
        />
      )}
      <main
        data-category-gallery-page="true"
        className={`${categoryGalleryPageClassName(category)} ${appMenu ? "" : styles.gallery} ${!appMenu && heroStyles ? heroStyles.layout : ""}`}
      >
        {children}
      </main>
    </Wrapper>
  );
}
