"use client";
import type { ReactNode } from "react";
import {
  BirthdaySceneCopy as Copy,
  BirthdaySceneFacts as Facts,
  BirthdaySceneRsvp as Rsvp,
} from "./primitives";
import type { BirthdaySceneProps } from "./types";

function Art({ theme, className }: BirthdaySceneProps & { className: string }) {
  return (
    <img
      src={theme.heroImage}
      alt=""
      aria-hidden="true"
      className={`template-hero-image w-full object-cover ${className}`}
    />
  );
}
function Label({ children }: { children: ReactNode }) {
  return <p className="text-xs font-bold uppercase tracking-[.2em]">{children}</p>;
}

export default function Next26BirthdayScenes(p: BirthdaySceneProps) {
  const style = { backgroundColor: p.theme.colors.primary, color: p.theme.colors.secondary };
  switch (p.theme.id) {
    case "pottery-playhouse":
      return (
        <section data-birthday-scene="pottery-playhouse" className="overflow-hidden" style={style}>
          <div className="grid gap-8 p-7 md:grid-cols-[1.1fr_.9fr] md:p-14">
            <Art
              {...p}
              className="aspect-[4/5] rounded-t-[45%] rounded-b-[12%] border-8 border-white rotate-2"
            />
            <div className="space-y-7">
              <Label>Little hands · Big imagination</Label>
              <Copy {...p} />
              <Facts {...p} className="border-y border-current py-5" />
              <Rsvp {...p} />
            </div>

          </div>
        </section>
      );
    case "friendship-bead-club":
      return (
        <section
          data-birthday-scene="friendship-bead-club"
          className="overflow-hidden"
          style={style}
        >
          <div className="p-6 md:p-12">
            <Art {...p} className="aspect-[3/1] rounded-full" />
            <Label>Made by friends, kept forever</Label>
            <div className="my-8 rounded-[3rem] border-4 border-dotted border-current p-6 text-center md:p-10">
              <Copy {...p} className="mx-auto max-w-3xl" storyClassName="mx-auto" />
            </div>

            <Facts {...p} className="justify-center py-7" />
            <Rsvp {...p} className="justify-center" />
          </div>
        </section>
      );
    case "slime-squish-studio":
      return (
        <section
          data-birthday-scene="slime-squish-studio"
          className="overflow-hidden"
          style={style}
        >
          <div className="relative p-6 md:p-12">
            <div className="grid gap-8 md:grid-cols-2">
              <Art {...p} className="aspect-square rounded-[38%_62%_35%_65%]" />
              <div className="self-center space-y-7">
                <Label>Stretch your imagination</Label>
                <Copy {...p} titleClassName="uppercase" />
                <Rsvp {...p} />
              </div>
            </div>
            <Facts {...p} className="mt-7 rounded-[2rem] border-2 border-current p-6" />
          </div>
        </section>
      );
    case "magic-school-owls":
      return (
        <section data-birthday-scene="magic-school-owls" className="overflow-hidden" style={style}>
          <div className="grid gap-6 p-6 md:grid-cols-[.9fr_1.1fr] md:p-12">
            <Art {...p} className="aspect-[3/4] rounded-t-full border-4 border-[#b99755]" />
            <div className="flex flex-col justify-center gap-7 border-y-4 border-double border-current py-9 text-center">
              <Label>Your invitation to the academy</Label>
              <Copy {...p} storyClassName="mx-auto" />
              <Facts {...p} className="justify-center" />
              <Rsvp {...p} className="justify-center" />
            </div>
          </div>
        </section>
      );
    case "roller-rink-rainbow":
      return (
        <section
          data-birthday-scene="roller-rink-rainbow"
          className="overflow-hidden"
          style={style}
        >
          <div className="p-5 md:p-10">
            <div className="border-[10px] border-double border-current rounded-[3rem] overflow-hidden">
              <Art {...p} className="aspect-[5/2]" />
              <div className="p-7 md:p-10">
                <Label>Good times on eight wheels</Label>
                <Copy {...p} className="mt-5" />
                <div className="mt-7 grid gap-5 md:grid-cols-[1fr_auto]">
                  <Facts {...p} />
                  <Rsvp {...p} />
                </div>
              </div>
            </div>
          </div>
        </section>
      );
    case "pixel-builder-world":
      return (
        <section
          data-birthday-scene="pixel-builder-world"
          className="overflow-hidden"
          style={style}
        >
          <div className="p-6 md:p-10">
            <div className="border-4 border-current shadow-[10px_10px_0_currentColor]">
              <div className="border-b-4 border-current p-5">
                <Label>Creative mode: Birthday</Label>
              </div>
              <Art {...p} className="aspect-[2/1]" />
              <div className="grid gap-6 border-t-4 border-current p-7 md:grid-cols-[1.2fr_.8fr]">
                <Copy {...p} />
                <div className="space-y-6 border-l-4 border-current pl-6">
                  <Facts {...p} />
                  <Rsvp {...p} />
                </div>
              </div>
            </div>
          </div>
        </section>
      );
    case "plushie-sleepover":
      return (
        <section data-birthday-scene="plushie-sleepover" className="overflow-hidden" style={style}>
          <div className="p-6 text-center md:p-12">
            <div className="mx-auto max-w-4xl overflow-hidden rounded-t-[45%] rounded-b-[4rem] border-[12px] border-white">
              <Art {...p} className="aspect-[2/1]" />
            </div>
            <Label>A cozy little celebration</Label>
            <Copy {...p} className="mx-auto my-8 max-w-3xl" storyClassName="mx-auto" />

            <Rsvp {...p} className="justify-center my-7" />
            <Facts {...p} className="justify-center border-t border-current pt-6" />
          </div>
        </section>
      );
    case "kpop-stage-stars":
      return (
        <section data-birthday-scene="kpop-stage-stars" className="overflow-hidden" style={style}>
          <div className="relative">
            <Art {...p} className="aspect-[3/2] md:aspect-[2/1]" />
            <div className="relative mx-5 -mt-16 border border-[#dfbcfa] bg-[#251540] p-7 shadow-[8px_8px_0_#986bb0] md:mx-14 md:-mt-28 md:p-10">
              <Label>Tonight, you are the headliner</Label>
              <Copy {...p} className="my-6" titleClassName="uppercase" />
              <Rsvp {...p} />
            </div>
            <Facts {...p} className="px-8 pb-8 pt-10 md:px-14" />
          </div>
        </section>
      );
    case "basketball-court-crew":
      return (
        <section
          data-birthday-scene="basketball-court-crew"
          className="overflow-hidden"
          style={style}
        >
          <div className="grid md:grid-cols-[1fr_1fr]">
            <Art {...p} className="min-h-80 h-full border-l-4 border-current" />
            <div className="relative p-8 md:p-12">
              <Label>The birthday starting lineup</Label>
              <div
                aria-hidden="true"
                className="my-5 text-[8rem] font-black leading-none opacity-20"
              >
                ★
              </div>
              <Copy {...p} className="relative -mt-20" titleClassName="uppercase" />
              <Rsvp {...p} className="mt-8" />
            </div>

            <Facts {...p} className="border-t-4 border-current p-7 md:col-span-2" />
          </div>
        </section>
      );
    case "skatepark-stickers":
      return (
        <section data-birthday-scene="skatepark-stickers" className="overflow-hidden" style={style}>
          <div className="p-6 md:p-12">
            <div className="grid items-center gap-9 md:grid-cols-[1.15fr_.85fr]">
              <div className="relative">
                <Art {...p} className="aspect-[4/3] -rotate-3 border-8 border-white shadow-xl" />
                <p className="absolute -bottom-5 right-0 rotate-6 bg-[#224c50] px-6 py-4 text-white font-bold">
                  GOOD VIBES ONLY
                </p>
              </div>
              <div className="space-y-6">
                <Label>Everyone gets a turn</Label>
                <Copy {...p} />
                <Rsvp {...p} />
              </div>
            </div>
            <Facts {...p} className="mt-12 border-y-4 border-dashed border-current py-6" />
          </div>
        </section>
      );
    case "ninja-obstacle-dojo":
      return (
        <section
          data-birthday-scene="ninja-obstacle-dojo"
          className="overflow-hidden"
          style={style}
        >
          <div>
            <div className="grid md:grid-cols-[1.4fr_.6fr]">
              <Art {...p} className="aspect-[3/2]" />
              <div className="flex flex-col justify-center gap-7 bg-[#862e30] p-7 text-white">
                <Facts {...p} />
                <Rsvp {...p} />
              </div>
            </div>
            <div className="border-b-[14px] border-[#862e30] p-7 md:p-12">
              <Label>Your next birthday mission</Label>
              <Copy {...p} className="mt-6 max-w-4xl" titleClassName="uppercase" />
            </div>

          </div>
        </section>
      );
    case "detective-clue-club":
      return (
        <section
          data-birthday-scene="detective-clue-club"
          className="overflow-hidden"
          style={style}
        >
          <div className="p-6 md:p-12">
            <div className="border-2 border-current p-6 md:p-9">
              <div className="flex items-center justify-between border-b-2 border-current pb-5">
                <Label>Case file: Birthday</Label>
                <span className="rotate-[-8deg] border-2 border-current px-3 py-1 font-mono text-xs">
                  TOP SECRET
                </span>
              </div>
              <div className="grid gap-8 pt-8 md:grid-cols-[.9fr_1.1fr]">
                <Art {...p} className="aspect-[4/3] border-8 border-white rotate-2" />
                <div className="space-y-6">
                  <Copy {...p} />
                  <Rsvp {...p} />
                </div>

              </div>
              <Facts {...p} className="mt-8 border-t-2 border-dashed border-current pt-6" />
            </div>
          </div>
        </section>
      );
    case "dragon-cloud-quest":
      return (
        <section data-birthday-scene="dragon-cloud-quest" className="overflow-hidden" style={style}>
          <div>
            <Art {...p} className="aspect-[2/1]" />
            <div className="relative -mt-10 rounded-t-[50%_3rem] bg-[#dcebe9] px-8 pb-10 pt-16 text-center">
              <Label>An invitation beyond the clouds</Label>
              <Copy {...p} className="mx-auto my-7 max-w-3xl" storyClassName="mx-auto" />
              <Facts {...p} className="justify-center" />
              <Rsvp {...p} className="mt-7 justify-center" />
            </div>
          </div>
        </section>
      );
    case "axolotl-lagoon":
      return (
        <section data-birthday-scene="axolotl-lagoon" className="overflow-hidden" style={style}>
          <div className="grid items-center gap-7 p-6 md:grid-cols-2 md:p-12">
            <div className="order-2 space-y-7 md:order-1">
              <Label>Little smiles, big wonder</Label>
              <Copy {...p} />
              <Facts {...p} className="flex-col !items-start" />
              <Rsvp {...p} />
            </div>
            <Art
              {...p}
              className="order-1 aspect-square rounded-[50%_50%_15%_50%] border-[10px] border-white md:order-2"
            />
          </div>
        </section>
      );
    case "capybara-orange-spa":
      return (
        <section
          data-birthday-scene="capybara-orange-spa"
          className="overflow-hidden"
          style={style}
        >
          <div className="p-6 md:p-12">
            <div className="mx-auto max-w-4xl text-center">
              <Label>Take it slow, celebrate big</Label>
              <Art {...p} className="my-8 aspect-[5/2] rounded-[50%]" />
              <Copy {...p} storyClassName="mx-auto" />
              <div className="my-7 h-px bg-current" />
              <Facts {...p} className="justify-center" />
              <Rsvp {...p} className="mt-7 justify-center" />
            </div>
          </div>
        </section>
      );
    case "bunny-carrot-garden":
      return (
        <section
          data-birthday-scene="bunny-carrot-garden"
          className="overflow-hidden"
          style={style}
        >
          <div className="p-5 md:p-10">
            <div className="rounded-t-[8rem] border-4 border-double border-current p-6 text-center md:p-10">
              <Art {...p} className="aspect-[2/1] rounded-[2rem]" />
              <Label>A little garden gathering</Label>
              <Copy
                {...p}
                className="mx-auto my-7 max-w-2xl"
                titleClassName="italic"
                storyClassName="mx-auto"
              />

              <Facts {...p} className="justify-center py-7" />
              <Rsvp {...p} className="justify-center" />
            </div>
          </div>
        </section>
      );
    case "pony-ribbon-rodeo":
      return (
        <section data-birthday-scene="pony-ribbon-rodeo" className="overflow-hidden" style={style}>
          <div className="p-6 md:p-12">
            <Label>Boots, ribbons & birthday wishes</Label>
            <div className="mt-7 grid gap-8 md:grid-cols-[1.2fr_.8fr]">
              <Art
                {...p}
                className="aspect-[4/3] rounded-t-[6rem] border-4 border-dashed border-current p-2"
              />
              <div className="self-center space-y-7">
                <Copy {...p} />
                <Rsvp {...p} />
              </div>
            </div>
            <Facts {...p} className="mt-8 rounded-full border-2 border-current px-8 py-5" />
          </div>
        </section>
      );
    case "butterfly-conservatory":
      return (
        <section
          data-birthday-scene="butterfly-conservatory"
          className="overflow-hidden"
          style={style}
        >
          <div className="grid gap-0 p-5 md:grid-cols-2 md:p-10">
            <Art {...p} className="h-full min-h-80 rounded-t-full border border-current p-3" />
            <div className="border border-current p-7 md:p-10">
              <Label>Come flutter by</Label>
              <Copy {...p} className="my-8" titleClassName="italic" />
              <Rsvp {...p} />
            </div>

            <Facts {...p} className="border-x border-b border-current p-7 md:col-span-2" />
          </div>
        </section>
      );
    case "jellyfish-glow-garden":
      return (
        <section
          data-birthday-scene="jellyfish-glow-garden"
          className="overflow-hidden"
          style={style}
        >
          <div className="relative">
            <Art {...p} className="aspect-[3/2] opacity-90" />
            <div className="bg-[#101c42] px-7 pb-10 md:px-14">
              <div className="relative -mt-20 rounded-t-[3rem] border-t border-[#a8e4ef] bg-[#101c42] px-5 pt-9">
                <Label>A birthday beneath the waves</Label>
                <Copy {...p} className="my-6" />
                <Facts {...p} className="border-y border-current py-5" />
                <Rsvp {...p} className="mt-7" />
              </div>
            </div>
          </div>
        </section>
      );
    case "pizza-chef-club":
      return (
        <section data-birthday-scene="pizza-chef-club" className="overflow-hidden" style={style}>
          <div className="p-6 md:p-12">
            <div className="border-[12px] border-double border-current">
              <Art {...p} className="aspect-[5/2]" />
              <div className="p-7 text-center">
                <Label>Fresh from the birthday kitchen</Label>
                <Copy {...p} className="my-6" storyClassName="mx-auto" />
              </div>

              <div className="grid gap-5 p-7 md:grid-cols-[1fr_auto]">
                <Facts {...p} />
                <Rsvp {...p} />
              </div>
            </div>
          </div>
        </section>
      );
    case "sushi-roll-studio":
      return (
        <section data-birthday-scene="sushi-roll-studio" className="overflow-hidden" style={style}>
          <div className="grid gap-5 p-6 md:grid-cols-[.8fr_1.2fr] md:p-12">
            <div className="space-y-5">
              <Art {...p} className="aspect-[4/3] rounded-3xl" />
              <Facts {...p} className="rounded-3xl border border-current p-6" />
            </div>
            <div className="flex flex-col gap-7 rounded-3xl border border-current p-7">
              <Label>The little roll workshop</Label>
              <Copy {...p} />
              <Rsvp {...p} />
            </div>

          </div>
        </section>
      );
    case "lemonade-market-day":
      return (
        <section
          data-birthday-scene="lemonade-market-day"
          className="overflow-hidden"
          style={style}
        >
          <div>
            <div
              aria-hidden="true"
              className="h-12 bg-[repeating-linear-gradient(90deg,#776028_0_40px,#fff4c1_40px_80px)]"
            />
            <div className="grid items-center gap-8 p-8 md:grid-cols-2 md:p-12">
              <Art {...p} className="aspect-square rounded-t-[50%]" />
              <div className="space-y-6">
                <Label>Sunny days & sweet little moments</Label>
                <Copy {...p} />
                <Rsvp {...p} />
              </div>
            </div>
            <Facts {...p} className="justify-center border-t-2 border-dashed border-current p-6" />
          </div>
        </section>
      );
    case "cherry-picnic-bows":
      return (
        <section data-birthday-scene="cherry-picnic-bows" className="overflow-hidden" style={style}>
          <div className="p-6 text-center md:p-12">
            <Label>Sweet as a birthday cherry</Label>
            <div className="mx-auto mt-8 max-w-4xl rounded-[3rem] bg-white/65 p-7 md:p-10">
              <Art {...p} className="my-8 aspect-[2/1] rounded-[50%] border-8 border-[#f8dddd]" />
              <Copy {...p} titleClassName="italic" storyClassName="mx-auto" />

              <Facts {...p} className="justify-center" />
              <Rsvp {...p} className="justify-center mt-7" />
            </div>
          </div>
        </section>
      );
    case "storybook-library":
      return (
        <section data-birthday-scene="storybook-library" className="overflow-hidden" style={style}>
          <div className="p-6 md:p-12">
            <div className="grid overflow-hidden rounded-r-[3rem] border-l-[14px] border-[#405941] bg-[#fbf7e9] shadow-xl md:grid-cols-2">
              <Art {...p} className="h-full min-h-80" />
              <div className="space-y-7 border-r border-[#d6ceb6] p-8 md:p-10">
                <Label>A brand-new chapter</Label>
                <Copy {...p} />
                <Rsvp {...p} />
              </div>

            </div>
            <Facts {...p} className="mt-8 justify-center" />
          </div>
        </section>
      );
    case "board-game-bonanza":
      return (
        <section data-birthday-scene="board-game-bonanza" className="overflow-hidden" style={style}>
          <div className="p-6 md:p-12">
            <div className="grid gap-6 md:grid-cols-[1.1fr_.9fr]">
              <Art {...p} className="aspect-square rounded-[20%] border-4 border-current" />
              <div className="rounded-2xl border-4 border-current p-7">
                <Label>Good company. Great games.</Label>
                <Copy {...p} className="mt-6" />
                <Rsvp {...p} className="mt-7" />
              </div>

            </div>
            <Facts {...p} className="mt-7 border-4 border-dotted border-current p-6" />
          </div>
        </section>
      );
    case "mini-olympics-field-day":
      return (
        <section
          data-birthday-scene="mini-olympics-field-day"
          className="overflow-hidden"
          style={style}
        >
          <div>
            <div className="border-b-4 border-current px-8 py-5">
              <Label>A little friendly competition</Label>
            </div>
            <div className="grid md:grid-cols-[.9fr_1.1fr]">
              <Art {...p} className="h-full min-h-80" />
              <div className="space-y-7 p-8 md:p-12">
                <Copy {...p} titleClassName="uppercase" />
                <Rsvp {...p} />
              </div>

            </div>
            <Facts {...p} className="border-y-4 border-current p-7" />
            <p className="px-8 py-4 font-bold tracking-widest text-xs">
              EVERYONE PLAYS · EVERYONE CELEBRATES
            </p>
          </div>
        </section>
      );
    default:
      return null;
  }
}
