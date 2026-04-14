"use client";

import type { InviteCategory, StudioCategoryTileDefinition } from "../studio-workspace-types";
import { StudioCategoryTile } from "./StudioCategoryTile";

type StudioCategoryGridProps = {
  categories: StudioCategoryTileDefinition[];
  selectedCategory: InviteCategory;
  onSelect: (categoryName: InviteCategory) => void;
};

const tileSizeVariantClassName = {
  standard: "col-span-1 row-span-1 h-[280px]",
  horizontal: "col-span-1 row-span-1 h-[280px]",
  wide: "row-span-1 h-[280px] lg:col-span-2",
  feature: "h-[280px] lg:col-span-1 lg:row-span-2 lg:h-full lg:min-h-[580px]",
  panorama: "row-span-1 h-[240px] lg:col-span-3",
} as const;

export function StudioCategoryGrid({
  categories,
  selectedCategory,
  onSelect,
}: StudioCategoryGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-4">
      {categories.map((category, index) => (
        <div
          key={category.name}
          className={tileSizeVariantClassName[category.sizeVariant]}
        >
          <StudioCategoryTile
            category={category}
            index={index}
            active={selectedCategory === category.name}
            onSelect={onSelect}
          />
        </div>
      ))}
    </div>
  );
}
