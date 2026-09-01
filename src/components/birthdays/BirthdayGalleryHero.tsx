import { CakeSlice, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import TemplateShowroom from "@/components/events/TemplateShowroom";

export default function BirthdayGalleryHero({
  buildCustomizeHref,
}: {
  buildCustomizeHref: (templateId: string) => string;
}) {
  return (
    <section className="relative isolate overflow-hidden border-b border-[#4f2a40] bg-[#2a1725] text-white">
      <Image
        src="/templates/birthdays/birthday-gallery-hero-v2.webp"
        alt=""
        fill
        priority
        sizes="100vw"
        className="z-0 object-cover object-[70%_center] sm:object-[66%_center]"
      />
      <div
        className="absolute inset-0 z-10 bg-[linear-gradient(90deg,rgba(35,17,31,0.99)_0%,rgba(40,20,35,0.96)_34%,rgba(43,21,37,0.7)_54%,rgba(35,17,30,0.12)_80%,rgba(35,17,30,0.04)_100%)]"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 z-10 bg-[linear-gradient(0deg,rgba(28,11,23,0.76)_0%,rgba(28,11,23,0.05)_45%,rgba(28,11,23,0.16)_100%)]"
        aria-hidden="true"
      />

      <div className="relative z-20 mx-auto max-w-[1500px] px-5 pb-8 pt-10 sm:px-8 sm:pb-10 sm:pt-12 lg:px-12 lg:pb-12 lg:pt-14">
        <Link
          href="/birthdays"
          className="inline-flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.24em] text-white/80 transition hover:text-white sm:text-xs"
        >
          <Sparkles className="h-5 w-5 text-[#f5c978]" aria-hidden="true" />
          Birthday inspiration
        </Link>

        <div className="mt-10 max-w-[720px] sm:mt-11 lg:mt-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#f4c471]/70 bg-[#4a263b]/72 px-4 py-2.5 text-[9px] font-bold uppercase tracking-[0.24em] text-[#ffd796] backdrop-blur-sm sm:px-5 sm:text-[10px]">
            <CakeSlice className="h-3.5 w-3.5" aria-hidden="true" />
            104 complete event-page designs
          </div>
          <h1 className='mt-7 max-w-[720px] [font-family:var(--font-playfair),_"Times_New_Roman",_serif] text-[clamp(3rem,5vw,4.65rem)] font-normal leading-[0.92] tracking-[-0.045em]'>
            Find a design that feels like the
            <span className="mt-1 block italic text-[#f4c273]">celebration</span>
          </h1>
          <p className="mt-6 max-w-[610px] text-sm font-light leading-6 text-white/82 sm:text-base sm:leading-7 lg:text-lg lg:leading-8">
            Start with the original 24, explore 30 new kids events, or choose from 40 adult
            birthdays and 10 anniversary celebrations. Every design is a complete, theme-matched
            event page with its own composition, typography, image treatment, and guest-facing
            rhythm.
          </p>
        </div>

        <div className="mt-9 sm:mt-11 lg:mt-14">
          <TemplateShowroom
            ariaLabel="Four selectable birthday event-page designs, including three kids templates"
            items={[
              {
                alt: "a blush princess garden party",
                audience: "Kids",
                href: buildCustomizeHref("princess-garden-ball"),
                label: "Princess",
                src: "/templates/birthdays/generated/kids/princess-garden-ball.webp",
              },
              {
                alt: "a deep-blue outer-space mission party",
                audience: "Kids",
                href: buildCustomizeHref("outer-space-mission-control"),
                label: "Outer space",
                src: "/templates/birthdays/generated/kids/outer-space-mission-control.webp",
              },
              {
                alt: "a sophisticated modern milestone dinner",
                audience: "Adults",
                href: buildCustomizeHref("modern-minimal-fifty"),
                label: "Milestone",
                src: "/templates/birthdays/generated/adults/modern-minimal-fifty.webp",
              },
              {
                alt: "a colorful rainbow art-studio birthday",
                audience: "Kids",
                href: buildCustomizeHref("rainbow-art-studio"),
                label: "Rainbow art",
                src: "/templates/birthdays/generated/kids/rainbow-art-studio.webp",
              },
            ]}
          />
        </div>
      </div>
    </section>
  );
}
