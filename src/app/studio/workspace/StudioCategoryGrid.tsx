"use client";

import type { InviteCategory, StudioCategoryTileDefinition } from "../studio-workspace-types";
import { StudioCategoryTile } from "./StudioCategoryTile";
import { StudioCategoryUploadTile } from "./StudioCategoryUploadTile";

type StudioCategoryGridProps = {
  categories: StudioCategoryTileDefinition[];
  selectedCategory: InviteCategory;
  onSelect: (categoryName: InviteCategory) => void;
  onUploadAction: () => void;
  isUploadActionPending: boolean;
};

type StudioCategoryGridTileKey = InviteCategory | "upload";

type StudioCategoryGridItem =
  | {
      kind: "category";
      key: InviteCategory;
      category: StudioCategoryTileDefinition;
    }
  | {
      kind: "upload";
      key: "upload";
    };

const tileSizeVariantClassName = {
  standard: "col-span-1 h-full sm:h-[210px] md:h-[240px]",
  horizontal: "col-span-1 h-full sm:h-[210px] md:h-[240px]",
  wide: "h-full sm:h-[210px] md:h-[240px] lg:col-span-2",
  feature:
    "h-full sm:h-[210px] md:h-[240px] lg:col-span-1 lg:row-span-2 lg:h-full lg:min-h-[500px]",
  panorama: "h-full sm:h-[210px] md:h-[240px] lg:col-span-3",
} as const;

const EDITORIAL_GRID_COMPOSITION: StudioCategoryGridTileKey[] = [
  "Birthday",
  "upload",
  "Wedding",
  "Bridal Shower",
  "Baby Shower",
  "Game Day",
] as const;

const desktopTilePlacementClassNameByKey: Partial<Record<StudioCategoryGridTileKey, string>> = {
  Birthday: "lg:col-start-1 lg:row-start-1",
  upload: "lg:col-start-3 lg:row-start-1",
  Wedding: "lg:col-start-4 lg:row-start-1",
  "Bridal Shower": "lg:col-start-1 lg:row-start-2",
  "Baby Shower": "lg:col-start-2 lg:row-start-2",
  "Game Day": "lg:col-start-3 lg:row-start-2",
};

const mobileTileSpanClassNameByKey: Partial<Record<StudioCategoryGridTileKey, string>> = {
  Birthday: "row-span-2 sm:row-span-1",
  Wedding: "row-span-2 sm:row-span-1",
};

const mobileTileOrderClassNameByKey: Partial<Record<StudioCategoryGridTileKey, string>> = {
  upload: "order-2 sm:order-none",
  Wedding: "order-3 sm:order-none",
  "Game Day": "order-4 sm:order-none",
  "Bridal Shower": "order-5 sm:order-none",
  "Baby Shower": "order-6 sm:order-none",
  Anniversary: "order-7 sm:order-none",
  Housewarming: "order-8 sm:order-none",
  "Field Trip/Day": "order-9 sm:order-none",
  "Custom Invite": "order-10 sm:order-none",
};

export function StudioCategoryGrid({
  categories,
  selectedCategory,
  onSelect,
  onUploadAction,
  isUploadActionPending,
}: StudioCategoryGridProps) {
  const categoriesByName = new Map(categories.map((category) => [category.name, category] as const));
  const editorialCategoryKeys = new Set(
    EDITORIAL_GRID_COMPOSITION.filter(
      (tileKey): tileKey is InviteCategory => tileKey !== "upload",
    ),
  );

  const gridItems: StudioCategoryGridItem[] = [
    ...EDITORIAL_GRID_COMPOSITION.flatMap((tileKey) => {
      if (tileKey === "upload") {
        return [{ kind: "upload", key: "upload" } satisfies StudioCategoryGridItem];
      }

      const category = categoriesByName.get(tileKey);
      return category
        ? [{ kind: "category", key: tileKey, category } satisfies StudioCategoryGridItem]
        : [];
    }),
    ...categories
      .filter((category) => !editorialCategoryKeys.has(category.name))
      .map(
        (category) =>
          ({
            kind: "category",
            key: category.name,
            category,
          }) satisfies StudioCategoryGridItem,
      ),
  ];

  return (
    <div className="grid auto-rows-[136px] grid-cols-2 gap-3 sm:auto-rows-auto sm:gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-4">
      {gridItems.map((item, index) => {
        const tileKey = item.key;
        const sizeVariant = item.kind === "upload" ? "standard" : item.category.sizeVariant;

        return (
          <div
            key={tileKey}
            className={`${mobileTileOrderClassNameByKey[tileKey] ?? ""} ${
              mobileTileSpanClassNameByKey[tileKey] ?? "row-span-1"
            } ${desktopTilePlacementClassNameByKey[tileKey] ?? ""} ${
              tileSizeVariantClassName[sizeVariant]
            }`}
          >
            {item.kind === "upload" ? (
              <StudioCategoryUploadTile
                index={index}
                isUploading={isUploadActionPending}
                onTrigger={onUploadAction}
              />
            ) : (
              <StudioCategoryTile
                category={item.category}
                index={index}
                active={selectedCategory === item.category.name}
                onSelect={onSelect}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
