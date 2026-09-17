import Image from "next/image";
import type { ReactNode } from "react";
import type { LandingHeroFrame } from "@/lib/landing-hero-galleries";
import HeroImageScrim from "./HeroImageScrim";
import LandingHeroCarousel from "./LandingHeroCarousel";

export default function LandingHeroMedia({
  images,
  carousel = false,
  children,
}: {
  images: readonly LandingHeroFrame[];
  carousel?: boolean;
  children?: (activeIndex: number) => ReactNode;
}) {
  if (carousel && images.length > 1)
    return <LandingHeroCarousel images={images}>{children}</LandingHeroCarousel>;
  const activeImage = images[0];

  if (!activeImage)
    return (
      <>
        <HeroImageScrim />
        {children?.(0)}
      </>
    );

  return (
    <>
      <div className="pointer-events-none absolute inset-0 z-0">
        <Image
          src={activeImage.src}
          alt={activeImage.alt}
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
          style={{ objectPosition: activeImage.objectPosition ?? "center" }}
        />
      </div>
      <HeroImageScrim />
      {children?.(0)}
    </>
  );
}
