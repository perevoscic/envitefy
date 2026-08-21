"use client";

import { ArrowRight, Sparkles, WandSparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { birthdayPromptExamples } from "../birthday-landing-data";

export default function BirthdayPromptStudio({ primaryHref }: { primaryHref: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const example = birthdayPromptExamples[activeIndex];

  return (
    <div className="mt-12 overflow-hidden rounded-[2.5rem] border border-[#e5d8cf] bg-white shadow-[0_26px_80px_rgba(73,48,34,0.1)]">
      <div className="grid lg:grid-cols-[0.82fr_1.18fr]">
        <div className="flex flex-col bg-[#302742] p-6 text-white sm:p-9 lg:min-h-[40rem]">
          <div className="flex items-center justify-between gap-4">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#d5c6f2]">
              <WandSparkles className="h-4 w-4" aria-hidden="true" />
              Birthday prompt
            </p>
            <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold text-white/65">
              {example.occasion}
            </span>
          </div>

          <div className="mt-8 rounded-[1.75rem] rounded-tl-md bg-white px-5 py-5 text-[var(--birthday-ink)] shadow-lg sm:px-6">
            <p className="text-base leading-8 sm:text-lg">“{example.prompt}”</p>
          </div>

          <div className="mt-6 flex items-center gap-3 text-sm text-white/65">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--birthday-yellow)] text-[var(--birthday-green)]">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
            </span>
            <p>
              Envitefy turns the feeling, age, and details into a one-of-one invitation direction.
            </p>
          </div>

          <div className="mt-auto pt-10">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/80">
              Try another example
            </p>
            <div className="mt-3 flex flex-wrap gap-2" role="tablist" aria-label="Birthday prompts">
              {birthdayPromptExamples.map((item, index) => (
                <button
                  key={item.name}
                  type="button"
                  role="tab"
                  aria-selected={index === activeIndex}
                  onClick={() => setActiveIndex(index)}
                  className={`min-h-10 rounded-full px-4 text-xs font-bold transition ${
                    index === activeIndex
                      ? "bg-white text-[#302742]"
                      : "border border-white/15 bg-white/5 text-white/70 hover:bg-white/10"
                  }`}
                >
                  {item.name} · {item.occasion}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="relative min-h-[34rem] overflow-hidden bg-[#e7ddd5] lg:min-h-[40rem]">
          <Image
            key={example.image}
            src={example.image}
            alt={example.imageAlt}
            fill
            sizes="(max-width: 1024px) 100vw, 60vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/72 via-transparent to-black/5" />
          <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-9">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/65">
              Invitation created from the prompt
            </p>
            <h3 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
              {example.resultTitle}
            </h3>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm text-white/72">{example.resultNote}</p>
              <Link
                href={primaryHref}
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-bold text-[var(--birthday-ink)] transition hover:-translate-y-0.5"
              >
                Describe your birthday
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
