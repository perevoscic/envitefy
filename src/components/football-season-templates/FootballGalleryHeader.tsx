import { Trophy } from "lucide-react";
import CategoryGalleryBackdrop from "@/components/events/CategoryGalleryBackdrop";

export default function FootballGalleryHeader({ count }: { count: number }) {
  return (
    <header className="relative isolate overflow-hidden border-b border-[#dde5d9] bg-[#fffcfa] px-5 py-9 text-[#2e4034] sm:px-8 lg:px-12 lg:py-12">
      <CategoryGalleryBackdrop category="football" />
      <div className="relative z-10 mx-auto max-w-[1500px]">
        <p className="inline-flex items-center gap-2 rounded-full border border-[#d6dfd0] bg-white/90 px-4 py-2 text-xs font-semibold text-[#526b52]">
          <Trophy className="h-4 w-4" aria-hidden="true" />
          {count} designs to make your own
        </p>
        <h1 className="mt-5 text-4xl font-normal tracking-tight [font-family:var(--font-playfair),Georgia,serif] sm:text-5xl lg:text-6xl">
          Football
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-[#59675b]">
          Find your team’s style. Then add your game schedule, roster, travel plans, and attendance
          details to bring the season together.
        </p>
      </div>
    </header>
  );
}
