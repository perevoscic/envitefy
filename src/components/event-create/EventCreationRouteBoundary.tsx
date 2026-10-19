"use client";
import { usePathname, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { normalizeCreationCategory } from "@/lib/creation-access";
import CreationAccessBoundary from "./CreationAccessBoundary";
export default function EventCreationRouteBoundary({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const search = useSearchParams();
  const segment = pathname?.split("/")[2] || "";
  let category = normalizeCreationCategory(segment);
  if (segment === "baby-showers" && search?.get("occasion") === "bridal-shower") category = "bridal-showers";
  if (segment === "design") category = normalizeCreationCategory(search?.get("category"));
  if (segment === "sport-events") category = normalizeCreationCategory(search?.get("sport")) || category;
  if (!category && segment !== "design") return children;
  return <CreationAccessBoundary product="event_page" category={category} eventId={search?.get("edit")}>{children}</CreationAccessBoundary>;
}
