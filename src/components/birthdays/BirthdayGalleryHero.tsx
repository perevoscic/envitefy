import { BIRTHDAY_DESIGN_CATALOG } from "@/data/birthday-design-catalog";
import { CakeSlice, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function BirthdayGalleryHero() {
  return (
    <section className="relative isolate overflow-hidden border-b border-[#eadbd9] bg-[#fff8f5] text-[#382a32]">
      <Image
        src="/templates/birthdays/birthday-gallery-hero-v2.webp"
        alt=""
        fill
        priority
        sizes="100vw"
        className="z-0 object-cover object-[70%_center] opacity-55 sm:object-[66%_center]"
      />
      <div
        className="absolute inset-0 z-10 bg-[linear-gradient(90deg,#fff8f5_0%,rgba(255,248,245,0.98)_34%,rgba(255,248,245,0.82)_54%,rgba(255,248,245,0.2)_80%,rgba(255,248,245,0.08)_100%)]"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 z-10 bg-[linear-gradient(0deg,#fff8f5_0%,rgba(255,248,245,0.2)_45%,rgba(255,248,245,0.3)_100%)]"
        aria-hidden="true"
      />

      <div className="relative z-20 mx-auto max-w-[1500px] px-5 pb-8 pt-10 sm:px-8 sm:pb-10 sm:pt-12 lg:px-12 lg:pb-12 lg:pt-14">
        <Link
          href="/birthdays"
          className="inline-flex items-center gap-3 rounded-sm text-[10px] font-bold uppercase tracking-[0.24em] text-[#755565] transition hover:text-[#382a32] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9b5268] sm:text-xs"
        >
          <Sparkles className="h-5 w-5 text-[#a16b32]" aria-hidden="true" />
          Birthday inspiration
        </Link>

        <div className="mt-10 max-w-[720px] sm:mt-11 lg:mt-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#e4c8b7] bg-white/80 px-4 py-2.5 text-[9px] font-bold uppercase tracking-[0.24em] text-[#87562d] backdrop-blur-sm sm:px-5 sm:text-[10px]">
            <CakeSlice className="h-3.5 w-3.5" aria-hidden="true" />
            {BIRTHDAY_DESIGN_CATALOG.length} complete event-page designs
          </div>
          <h1 className='mt-7 max-w-[720px] [font-family:var(--font-playfair),_"Times_New_Roman",_serif] text-[clamp(3rem,5vw,4.65rem)] font-normal leading-[0.92] tracking-[-0.045em]'>
            Find a design that feels like the
            <span className="mt-1 block italic text-[#9b5268]">celebration</span>
          </h1>
          <p className="mt-6 max-w-[610px] text-sm font-light leading-6 text-[#695660] sm:text-base sm:leading-7 lg:text-lg lg:leading-8">
            Explore playful kids parties, creative workshops, and grown-up celebrations.
            Choose a design inspired by what they love, then make it their own with
            photos, party details, and a personal invitation.
          </p>
        </div>


      </div>
    </section>
  );
}
