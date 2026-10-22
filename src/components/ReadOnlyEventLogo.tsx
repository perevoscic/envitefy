"use client";

import Link from "next/link";
import EnvitefyBrandImage from "@/components/branding/EnvitefyBrandImage";
import { ENVITEFY_BRAND_ASSETS } from "@/lib/brand-assets";

export default function ReadOnlyEventLogo() {
  return (
    <div className="mb-6 flex justify-center">
      <Link
        href="/"
        aria-label="Envitefy home"
        className="inline-flex items-center gap-2 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 overflow-visible"
      >
        <EnvitefyBrandImage
          src={ENVITEFY_BRAND_ASSETS.symbol.color}
          whiteSrc={ENVITEFY_BRAND_ASSETS.symbol.white}
          alt="Envitefy emblem"
          width={48}
          height={48}
          className="h-12 w-12"
          quality={100}
          unoptimized
        />
        <EnvitefyBrandImage
          src={ENVITEFY_BRAND_ASSETS.wordmark.color}
          whiteSrc={ENVITEFY_BRAND_ASSETS.wordmark.white}
          alt="Envitefy"
          width={156}
          height={48}
          className="h-8 w-auto"
          quality={100}
          unoptimized
        />
      </Link>
    </div>
  );
}
