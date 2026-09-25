"use client";

import type { HolidayCollectionId } from "@/lib/holiday-collections";
import type { GalleryOrder } from "@/lib/seasonal-template-order";

type Props = {
  available: boolean;
  order: GalleryOrder;
  setOrder: (order: GalleryOrder) => void;
  occasion: HolidayCollectionId | "";
  setOccasion: (occasion: HolidayCollectionId | "") => void;
  options: { id: HolidayCollectionId; name: string; kind: string }[];
  onChange: () => void;
};
const selectClass = "h-12 w-full max-w-full rounded-full border border-[#dcd0dc] bg-white px-4 text-sm text-[#342d38] outline-none focus-visible:ring-2 focus-visible:ring-[#785779] sm:w-auto sm:max-w-64";

export default function SeasonalGalleryControls({ available, order, setOrder, occasion, setOccasion, options, onChange }: Props) {
  if (!available) return null;
  return <>
    {options.length > 0 && <label className="block min-w-0 max-w-full">
      <span className="sr-only">Holiday or occasion</span>
      <select aria-label="Holiday or occasion" value={occasion} onChange={(event) => {
        const selected = options.find(({ id }) => id === event.target.value);
        setOccasion(selected?.id || "");
        onChange();
      }} className={selectClass}>
        <option value="">All holidays & occasions</option>
        {[...new Set(options.map(({ kind }) => kind))].map((kind) => <optgroup label={kind} key={kind}>
          {options.filter((option) => option.kind === kind).map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
        </optgroup>)}
      </select>
    </label>}
    <label className="block min-w-0 max-w-full">
      <span className="sr-only">Template order</span>
      <select aria-label="Template order" value={order} onChange={(event) => {
        setOrder(event.target.value === "original" ? "original" : "seasonal");
        onChange();
      }} className={selectClass}>
        <option value="seasonal">Seasonal picks</option>
        <option value="original">Original order</option>
      </select>
    </label>
  </>;
}
