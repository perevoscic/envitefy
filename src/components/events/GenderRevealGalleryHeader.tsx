import { PartyPopper } from "lucide-react";
import CategoryGalleryBackdrop from "./CategoryGalleryBackdrop";

export default function GenderRevealGalleryHeader({ count }: { count: number }) {
  return (
    <header className="relative isolate overflow-hidden border-b border-[#e6ddeb] bg-[#fffcfa] px-5 py-9 text-[#55415e] sm:px-8 lg:px-12 lg:py-12">
      <CategoryGalleryBackdrop category="gender-reveal" />
      <div className="relative z-10 mx-auto max-w-[1500px]">
        <p className="inline-flex items-center gap-2 rounded-full border border-[#e5d9eb] bg-white/90 px-4 py-2 text-xs font-semibold text-[#856486]">
          <PartyPopper className="h-4 w-4" aria-hidden="true" />
          {count} ways to share the surprise
        </p>
        <h1 className="mt-5 text-4xl font-normal tracking-tight [font-family:var(--font-playfair),Georgia,serif] sm:text-5xl lg:text-6xl">
          Gender reveals
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-[#78647e]">
          Make the moment yours. Choose a reveal design, add your party details, and invite everyone
          to share the surprise.
        </p>
      </div>
    </header>
  );
}
