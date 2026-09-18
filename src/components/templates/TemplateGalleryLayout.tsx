"use client";

import type { ReactNode } from "react";
import { categoryGalleryPageClassName } from "@/components/events/category-gallery-page";
import SignedOutPageChrome from "@/components/navigation/SignedOutPageChrome";
import { useMenuOptional } from "@/contexts/MenuContext";
import type { TemplateCategory } from "@/lib/template-categories";

export default function TemplateGalleryLayout({
  category,
  children,
}: {
  category: TemplateCategory;
  children: ReactNode;
}) {
  const appMenu = useMenuOptional();

  return (
    <>
      {!appMenu && (
        <SignedOutPageChrome
          activeBottomNavLabel="Templates"
          brandHref="/"
          topNavVariant="transparent-light"
        />
      )}
      <main
        data-category-gallery-page="true"
        className={`${categoryGalleryPageClassName(category)} ${appMenu ? "" : "pt-24"}`}
      >
        {children}
      </main>
    </>
  );
}
