"use client";

import { usePathname } from "next/navigation";
import type { ComponentProps } from "react";
import { ENVITEFY_BRAND_ASSETS, isGymnasticsBrand } from "@/lib/brand-assets";
import EnvitefyBrandImage from "./EnvitefyBrandImage";
import EnvitefyGymnasticsLogo from "./EnvitefyGymnasticsLogo";
import EnvitefyWordmark from "./EnvitefyWordmark";

/** Navigation follows its category route; general pages retain the canonical mark. */
export default function EnvitefyRouteBrand({
  raster = false,
  priority = false,
  gymnasticsWidth = 150,
  ...props
}: ComponentProps<typeof EnvitefyWordmark> & {
  raster?: boolean;
  priority?: boolean;
  gymnasticsWidth?: number;
}) {
  const pathname = usePathname();
  if (isGymnasticsBrand(pathname))
    return <EnvitefyGymnasticsLogo displayWidth={gymnasticsWidth} priority={priority} />;
  if (raster) return <EnvitefyBrandImage src={ENVITEFY_BRAND_ASSETS.wordmark.color}
    whiteSrc={ENVITEFY_BRAND_ASSETS.wordmark.white} alt="Envitefy" width={150} height={55} priority={priority} className={props.className} />;
  return <EnvitefyWordmark {...props} />;
}
