import Image from "next/image";
import type { LandingHeroFrame } from "@/lib/landing-hero-galleries";
import HeroImageScrim from "./HeroImageScrim";

export default function LandingHeroMedia({ images }: { images: readonly LandingHeroFrame[] }) {
  const activeImage = images[0];

  if (!activeImage) return <HeroImageScrim />;

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
    </>
  );
}
