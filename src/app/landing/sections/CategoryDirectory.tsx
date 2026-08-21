import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { landingHeroGalleries } from "@/lib/landing-hero-galleries";
import { landingCategoryCards } from "../landing-data";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function HeroCategoryStrip() {
  return (
    <nav aria-label="Event categories" className="mt-6">
      <Link
        href="#categories"
        className="inline-flex h-11 cursor-pointer items-center justify-center rounded-md border border-white/28 bg-black/24 px-4 text-xs font-semibold text-white backdrop-blur transition hover:border-white/45 hover:bg-white/14 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#21170e] motion-reduce:transition-none sm:hidden"
      >
        Browse event types
      </Link>
      <ul className="hidden flex-wrap gap-2 sm:flex">
        {landingCategoryCards.map((card) => (
          <li key={card.id}>
            <Link
              href={card.href}
              className="inline-flex h-9 cursor-pointer items-center rounded-full border border-white/22 bg-black/28 px-3.5 text-[11px] font-semibold tracking-[0.04em] text-white backdrop-blur transition hover:border-white/45 hover:bg-white/16 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white motion-reduce:transition-none"
            >
              {card.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default function CategoryDirectory() {
  return (
    <section
      id="categories"
      className="scroll-mt-0 border-b border-[#ded2bd] bg-[#fcfbf7] px-4 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24"
    >
      <div className="mx-auto max-w-[90rem]">
        <div className="max-w-3xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#765524]">
            Event types
          </p>
          <h2
            className="mt-4 text-4xl font-light leading-tight text-[#201a23] sm:text-5xl"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
          >
            Pick the gathering. We will make the page guests actually use.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-8 text-[#665d68]">
            Every category has its own invitation page, RSVP flow, and host tools. Start where you
            are hosting, then share one link.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-12">
          {landingCategoryCards.map((card) => {
            const image = landingHeroGalleries[card.id][0];
            if (!image) return null;

            return (
              <Link
                key={card.id}
                href={card.href}
                data-category={card.id}
                className={cx(
                  "group relative isolate overflow-hidden rounded-lg border border-[#e4d8c4] bg-[#201a23] shadow-[0_24px_60px_rgba(32,26,35,0.12)] transition hover:-translate-y-0.5 hover:border-[#c9b48a] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#a16207]/50 focus-visible:ring-offset-4 motion-reduce:transform-none motion-reduce:transition-none",
                  card.featured
                    ? "min-h-[22rem] sm:col-span-2 lg:col-span-6 lg:min-h-[32rem]"
                    : "min-h-[18rem] lg:col-span-4 lg:min-h-[22rem]",
                )}
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  sizes={
                    card.featured
                      ? "(min-width: 1024px) 50vw, 100vw"
                      : "(min-width: 1024px) 33vw, 50vw"
                  }
                  className="object-cover transition duration-700 group-hover:scale-105 motion-reduce:transform-none motion-reduce:transition-none"
							style={{
								objectPosition:
									"objectPosition" in image ? image.objectPosition : "center",
							}}
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(18,12,20,0.08)_0%,rgba(18,12,20,0.28)_42%,rgba(18,12,20,0.88)_100%)]" />
                <div className="relative z-10 flex h-full flex-col justify-end p-5 sm:p-7">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f0d58f]">
                    Event page
                  </p>
                  <h3
                    className={cx(
                      "mt-2 font-light leading-tight text-white",
                      card.featured ? "text-4xl sm:text-5xl" : "text-3xl",
                    )}
                    style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
                  >
                    {card.label}
                  </h3>
                  <p className="mt-3 max-w-md text-sm leading-6 text-white/84 sm:text-base sm:leading-7">
                    {card.promise}
                  </p>
                  <span className="mt-5 inline-flex w-fit items-center gap-2 rounded-md bg-white px-4 py-2.5 text-xs font-semibold text-[#201a23] transition group-hover:bg-[#f0d58f]">
                    {card.cta}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
