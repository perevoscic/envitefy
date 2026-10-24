"use client";

import { Fragment, type ReactNode } from "react";
import { categoryGalleryPageClassName } from "@/components/events/category-gallery-page";
import MarketingPage from "@/components/marketing/MarketingPage";
import SignedOutPageChrome from "@/components/navigation/SignedOutPageChrome";
import { useMenuOptional } from "@/contexts/MenuContext";
import type { TemplateCategory } from "@/lib/template-categories";
import styles from "./public-gallery.module.css";

export default function TemplateGalleryLayout({
  category,
  children,
}: {
  category: TemplateCategory;
  children: ReactNode;
}) {
  const appMenu = useMenuOptional();
  const Wrapper = appMenu ? Fragment : MarketingPage;

  return (
    <Wrapper>
      {!appMenu && (
        <SignedOutPageChrome
          activeBottomNavLabel="Templates"
          brandHref="/"
          topNavVariant="transparent-light"
        />
      )}
      <main
        data-category-gallery-page="true"
        className={`${categoryGalleryPageClassName(category)} ${appMenu ? "" : styles.gallery}`}
      >
        {children}
      </main>
    </Wrapper>
  );
}
