import { Sparkles } from "lucide-react";
import CategoryGalleryBackdrop from "@/components/events/CategoryGalleryBackdrop";

export default function GymnasticsGalleryHeader({ count }: { count: number }) {
  return (
    <header className="relative isolate overflow-hidden border-b border-[#e4ddea] bg-[#fffcfa] px-5 py-9 text-[#40324f] sm:px-8 lg:px-12 lg:py-12">
      <CategoryGalleryBackdrop category="gymnastics" />
      <div className="relative z-10 mx-auto max-w-[1500px]">
        <p className="inline-flex items-center gap-2 rounded-full border border-[#e1d6e9] bg-white/90 px-4 py-2 text-xs font-semibold text-[#796189]">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          {count} meet designs
        </p>
        <h1 className="mt-5 text-4xl font-normal tracking-tight [font-family:var(--font-playfair),Georgia,serif] sm:text-5xl lg:text-6xl">
          Gymnastics
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-[#716179]">
          First, find your meet’s style. Then upload a packet, paste a meet link, or add your
          details by hand. We’ll bring it all together in your chosen design.
        </p>
      </div>
    </header>
  );
}
