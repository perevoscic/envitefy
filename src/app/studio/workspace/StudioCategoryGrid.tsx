"use client";

import type { InviteCategory, StudioCategoryTileDefinition } from "../studio-workspace-types";
import { StudioCategoryTile } from "./StudioCategoryTile";

type StudioCategoryGridProps = {
  categories: StudioCategoryTileDefinition[];
  selectedCategory: InviteCategory;
  onSelect: (categoryName: InviteCategory) => void;
};

const tileSizeVariantClassName = {
  standard: "col-span-1 h-full sm:h-[210px] md:h-[240px]",
  horizontal: "col-span-1 h-full sm:h-[210px] md:h-[240px]",
  wide: "h-full sm:h-[210px] md:h-[240px] lg:col-span-2",
  feature:
    "h-full sm:h-[210px] md:h-[240px] lg:col-span-1 lg:row-span-2 lg:h-full lg:min-h-[500px]",
  panorama: "h-full sm:h-[210px] md:h-[240px] lg:col-span-3",
} as const;

const mobileTileSpanClassNameByCategory: Partial<Record<InviteCategory, string>> = {
  Birthday: "row-span-2 sm:row-span-1",
  Wedding: "row-span-2 sm:row-span-1",
  "Baby Shower": "col-span-2 sm:col-span-1 row-span-1",
};

const mobileTileOrderClassNameByCategory: Partial<Record<InviteCategory, string>> = {
  "Game Day": "order-2 sm:order-none",
  Wedding: "order-3 sm:order-none",
  "Bridal Shower": "order-4 sm:order-none",
  "Baby Shower": "order-5 sm:order-none",
  Anniversary: "order-6 sm:order-none",
  Housewarming: "order-7 sm:order-none",
  "Field Trip/Day": "order-8 sm:order-none",
  "Custom Invite": "order-9 sm:order-none",
};

export function StudioCategoryGrid({
  categories,
  selectedCategory,
  onSelect,
}: StudioCategoryGridProps) {
  return (
    <div className="grid auto-rows-[136px] grid-cols-2 gap-3 sm:auto-rows-auto sm:gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-4">
      {categories.map((category, index) => (
        <div
          key={category.name}
          className={`${mobileTileOrderClassNameByCategory[category.name] ?? ""} ${
            mobileTileSpanClassNameByCategory[category.name] ?? "row-span-1"
          } ${tileSizeVariantClassName[category.sizeVariant]}`}
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
