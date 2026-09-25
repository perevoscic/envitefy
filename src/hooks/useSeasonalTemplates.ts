"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { HOLIDAY_COLLECTIONS, type HolidayCollectionId } from "@/lib/holiday-collections";
import { localGalleryDay, orderSeasonalTemplates, templateOccasion, templateSeasonKey, type GalleryOrder, type SeasonalTemplate } from "@/lib/seasonal-template-order";

export function useSeasonalTemplates<T extends SeasonalTemplate>(templates: readonly T[]) {
  // Null on the server and first client render keeps hydration deterministic.
  const [day, setDay] = useState<string | null>(null);
  const [order, setOrder] = useState<GalleryOrder>("seasonal");
  const [occasion, setOccasion] = useState<HolidayCollectionId | "">("");
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const update = () => {
      clearTimeout(timer);
      const now = new Date();
      setDay(localGalleryDay(now));
      const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      timer = setTimeout(update, midnight.getTime() - now.getTime() + 100);
    };
    update();
    window.addEventListener("focus", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("focus", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, []);
  const options = useMemo(() => {
    const included = new Set(templates.map(templateOccasion).filter(Boolean));
    return HOLIDAY_COLLECTIONS.filter((collection) => included.has(collection.id))
      .map(({ id, name, kind }) => ({ id, name, kind }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [templates]);
  const activeOccasion = options.some(({ id }) => id === occasion) ? occasion : "";
  const apply = useCallback((items: readonly T[]) => orderSeasonalTemplates(
    activeOccasion ? items.filter((item) => templateOccasion(item) === activeOccasion) : items,
    day, order,
  ), [activeOccasion, day, order]);
  return { day, order, setOrder, occasion: activeOccasion, setOccasion, options, apply,
    available: templates.some((template) => Boolean(templateSeasonKey(template))) };
}
