import { MoonStar } from "lucide-react";
import CategoryGalleryBackdrop from "./CategoryGalleryBackdrop";

export default function BabyShowerGalleryHeader({ count }: { count: number }) {
  return (
    <header className="relative isolate overflow-hidden border-b border-[#e2e5d7] bg-[#fffdf7] px-5 py-9 text-[#454e3d] sm:px-8 lg:px-12 lg:py-12">
      <CategoryGalleryBackdrop category="baby-showers" />
      <div className="relative z-10 mx-auto max-w-[1500px]">
        <p className="inline-flex items-center gap-2 rounded-full border border-[#dfe4d4] bg-white/90 px-4 py-2 text-xs font-semibold text-[#647453]">
          <MoonStar className="h-4 w-4" aria-hidden="true" />
          {count} designs for a little one
        </p>
        <h1 className="mt-5 text-4xl font-normal tracking-tight [font-family:var(--font-playfair),Georgia,serif] sm:text-5xl lg:text-6xl">
          Baby showers
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-[#68705e]">
          A little one, a lot of love. Find your baby shower design, then add your celebration
          details, registry, and RSVP.
        </p>
      </div>
    </header>
  );
}
