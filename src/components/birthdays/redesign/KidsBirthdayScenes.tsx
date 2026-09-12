"use client";

import type { ReactNode } from "react";
import { BIRTHDAY_KIDS_ART } from "@/data/birthday-kids-art";
import {
  BirthdaySceneCopy as Copy,
  BirthdaySceneFacts as Facts,
  BirthdaySceneRsvp as Rsvp,
} from "./primitives";
import type { BirthdaySceneProps } from "./types";

function Art({ id, src, className = "" }: { id: string; src?: string; className?: string }) {
  return (
    <img
      src={src || BIRTHDAY_KIDS_ART[id]}
      alt=""
      aria-hidden="true"
      className={`template-hero-image h-full w-full object-cover ${className}`}
    />
  );
}
function Label({ children }: { children: ReactNode }) {
  return <p className="text-xs font-bold uppercase tracking-[.24em]">{children}</p>;
}

/** Each invitation is composed separately; shared primitives only carry guest behavior. */
export default function KidsBirthdayScenes(p: BirthdaySceneProps) {
  const id = p.theme.id;
  switch (id) {
    case "backyard-bug-explorer":
      return (
        <section
          data-birthday-scene={id}
          className="relative overflow-hidden bg-[#f3f0dd] text-[#30412d]"
        >
          <div className="grid md:grid-cols-[.8fr_1.2fr]">
            <div className="min-h-72 border-l border-[#bec59c]">
              <Art id={id} src={p.theme.heroImage} />
            </div>
            <div className="relative z-10 space-y-7 p-8 md:p-14">
              <Label>Field notes · A birthday expedition</Label>
              <Copy {...p} titleClassName="italic" />
              <Facts {...p} className="flex-col !items-start border-y border-[#7d8c58] py-5" />
              <Rsvp {...p} />
            </div>

          </div>
          <p className="border-t border-[#bec59c] px-8 py-4 font-mono text-xs tracking-widest">
            PACK YOUR CURIOSITY. A LITTLE ADVENTURE AWAITS.
          </p>
        </section>
      );
    case "junior-baker-studio":
      return (
        <section data-birthday-scene={id} className="bg-[#fff1cc] p-5 text-[#963e49] md:p-10">
          <div className="border-[10px] border-double border-[#dc8092] bg-[#fff9ed] px-7 pt-9 text-center">
            <div className="mx-auto h-64 max-w-3xl overflow-hidden rounded-t-[50%]">
              <Art id={id} src={p.theme.heroImage} />
            </div>
            <Label>The birthday bake shop</Label>
            <Copy {...p} className="mx-auto mt-5 max-w-2xl" titleClassName="italic" />
            <Rsvp {...p} className="my-7 justify-center" />

            <Facts
              {...p}
              className="justify-center border-t-2 border-dashed border-[#dc8092] py-6"
            />
          </div>
        </section>
      );
    case "little-firehouse":
      return (
        <section data-birthday-scene={id} className="bg-[#f4e8cd] text-[#b32928]">
          <div className="flex items-center justify-between bg-[#b32928] px-7 py-4 text-[#fff1d1]">
            <Label>Birthday rescue crew</Label>
            <span aria-hidden="true" className="text-3xl">
              ✦
            </span>
          </div>
          <div className="p-8 md:p-12">
            <div className="mt-8 grid gap-8 md:grid-cols-[1.5fr_1fr]">
              <div className="h-80 -rotate-2 border-8 border-[#fff9e8] shadow-lg">
                <Art id={id} src={p.theme.heroImage} />
              </div>
              <div className="flex flex-col justify-center gap-8 border-y-4 border-[#b32928] py-8">
                <Facts {...p} />
                <Rsvp {...p} />
              </div>
            </div>
            <Copy {...p} className="max-w-3xl" titleClassName="uppercase !leading-[.87]" />

          </div>
        </section>
      );
    case "dinosaur-dig-lab":
      return (
        <section data-birthday-scene={id} className="bg-[#c87844] text-[#382c20]">
          <div className="grid md:grid-cols-2">
            <div className="relative min-h-96">
              <Art id={id} src={p.theme.heroImage} />
              <span className="absolute left-6 top-6 rounded-full border border-[#382c20] bg-[#f6dfae] px-4 py-2 font-mono text-xs">
                EXPEDITION / BIRTHDAY
              </span>
            </div>
            <div className="space-y-7 bg-[#f6dfae] p-8 md:p-14 [clip-path:polygon(0_0,100%_0,100%_100%,3%_98%,0_85%,2%_70%,0_55%,3%_40%,0_25%)]">
              <Label>Something prehistoric is happening</Label>
              <Copy {...p} />
              <div className="border-y border-[#382c20] py-5">
                <Facts {...p} />
              </div>
              <Rsvp {...p} />
            </div>
          </div>
          <div className="h-8 bg-[repeating-linear-gradient(0deg,#754d30_0px,#754d30_3px,#c87844_3px,#c87844_8px)]" />
        </section>
      );
    case "enchanted-forest-tea":
      return (
        <section
          data-birthday-scene={id}
          className="relative isolate overflow-hidden bg-[#133e2d] px-7 py-14 text-[#fff3d3]"
        >
          <div className="absolute inset-0 -z-10">
            <Art id={id} src={p.theme.heroImage} />
            <div className="absolute inset-0 bg-[#082c22]/65" />
          </div>
          <div className="mx-auto max-w-xl rounded-t-[50%] border border-[#d5d9a6]/65 bg-[#163e2e]/85 px-7 pb-10 pt-20 text-center">
            <Label>You are invited to a little wonder</Label>
            <Copy {...p} className="my-7" titleClassName="italic" />
            <Facts {...p} className="justify-center" />
            <Rsvp {...p} className="mt-8 justify-center" />
          </div>
        </section>
      );
    case "outer-space-mission-control":
      return (
        <section data-birthday-scene={id} className="bg-[#10172e] text-[#ffecd1]">
          <div className="flex justify-between border-b border-[#9fa8bb]/40 px-7 py-4 font-mono text-xs tracking-widest">
            <span>MISSION / CELEBRATE</span>
            <span>ALL SYSTEMS GO</span>
          </div>
          <div className="grid gap-8 p-8 md:grid-cols-[1.15fr_1fr] md:p-12">
            <div className="relative aspect-square overflow-hidden rounded-full border-[14px] border-[#596677] shadow-[0_0_0_4px_#ed6b35]">
              <Art id={id} src={p.theme.heroImage} />
            </div>
            <div className="space-y-8">
              <Copy {...p} titleClassName="uppercase" />
              <Facts {...p} inverse className="border-l-4 border-[#ed6b35] pl-5" />
              <Rsvp {...p} inverse />
            </div>

          </div>
          <div className="bg-[#ed6b35] px-8 py-4 text-xs font-bold tracking-[.25em] text-[#10172e]">
            COUNTDOWN TO AN OUT-OF-THIS-WORLD BIRTHDAY
          </div>
        </section>
      );
    case "rainbow-art-studio":
      return (
        <section
          data-birthday-scene={id}
          className="overflow-hidden bg-[#fbf2e6] p-7 text-[#2728a0] md:p-12"
        >
          <div className="flex gap-3" aria-hidden="true">
            {["#fa6338", "#f1c53d", "#1b6f4b", "#262cb0", "#b05997"].map((c) => (
              <span key={c} className="h-5 flex-1 rounded-full" style={{ background: c }} />
            ))}
          </div>
          <div className="relative mt-9 grid items-center gap-5 md:grid-cols-2">
            <div className="h-80 rotate-3">
              <Art id={id} src={p.theme.heroImage} />
            </div>
            <div className="z-10 -rotate-2 bg-[#fffdf4] p-6 shadow-[8px_8px_0_#f8c441]">
              <Label>Make a little birthday magic</Label>
              <Copy {...p} className="mt-6" titleClassName="!leading-[.9]" />
            </div>

          </div>
          <div className="mt-12 flex flex-wrap items-center justify-between gap-7">
            <Facts {...p} />
            <Rsvp {...p} />
          </div>
        </section>
      );
    case "construction-crew-yard":
      return (
        <section data-birthday-scene={id} className="bg-[#f6c62d] text-[#202d30]">
          <div className="h-5 bg-[repeating-linear-gradient(135deg,#202d30_0px,#202d30_15px,#f6c62d_15px,#f6c62d_30px)]" />
          <div className="grid md:grid-cols-[1fr_1.15fr]">
            <div className="min-h-80">
              <Art id={id} src={p.theme.heroImage} />
            </div>
            <div className="p-8 md:p-12">
              <Label>Birthday project / Crew wanted</Label>
              <Copy {...p} className="my-8" titleClassName="uppercase" />
              <Rsvp {...p} />
            </div>

          </div>
          <Facts {...p} className="border-t-4 border-[#202d30] bg-[#f9e7b5] p-7" />
        </section>
      );
    case "undersea-mermaid-cove":
      return (
        <section
          data-birthday-scene={id}
          className="relative overflow-hidden bg-[#d9f0ef] text-[#345773]"
        >
          <div className="h-72 md:h-96">
            <Art id={id} src={p.theme.heroImage} />
          </div>
          <div className="relative mx-5 -mt-20 rounded-t-[50%] bg-[#f3edfb] px-7 pb-10 pt-16 text-center md:mx-20">
            <Label>A little birthday enchantment</Label>
            <Copy {...p} className="mx-auto mt-5 max-w-2xl" titleClassName="italic" />
            <Facts {...p} className="mt-7 justify-center" />
            <Rsvp {...p} className="mt-7 justify-center" />
          </div>
        </section>
      );
    case "soccer-goal-celebration":
      return (
        <section data-birthday-scene={id} className="bg-[#134d34] p-5 text-[#f3f1c9] md:p-9">
          <div className="border-2 border-[#f3f1c9]">
            <div className="grid md:grid-cols-[1fr_1.3fr]">
              <div className="min-h-72 border-l-2 border-[#f3f1c9]">
                <Art id={id} src={p.theme.heroImage} />
              </div>
              <div className="space-y-7 p-7">
                <Label>Birthday match day</Label>
                <Copy {...p} titleClassName="uppercase italic" />
                <Rsvp {...p} inverse />
              </div>

            </div>
            <Facts {...p} inverse className="border-t-2 border-[#f3f1c9] p-6" />
          </div>
        </section>
      );
    case "ballet-rehearsal-party":
      return (
        <section data-birthday-scene={id} className="bg-[#f8e9ee] p-8 text-[#7e4c68] md:p-14">
          <div className="grid items-center gap-10 md:grid-cols-[.8fr_1.2fr]">
            <div className="relative mx-auto aspect-[3/4] w-full max-w-sm rounded-t-full border-[12px] border-[#fff9f2] shadow-lg">
              <Art id={id} src={p.theme.heroImage} className="rounded-t-full" />
            </div>
            <div className="text-center">
              <p className="mb-6 font-serif text-2xl italic">A birthday, en pointe</p>
              <Copy {...p} titleClassName="italic !font-normal" />
              <div className="mx-auto my-7 h-px w-24 bg-[#7e4c68]" />
              <Facts {...p} className="justify-center" />
              <Rsvp {...p} className="mt-8 justify-center" />
            </div>
          </div>
        </section>
      );
    case "superhero-training-hq":
      return (
        <section data-birthday-scene={id} className="bg-[#ffe84c] p-5 text-[#202346] md:p-9">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="min-h-80 rotate-2 overflow-hidden border-[5px] border-[#202346]">
              <Art id={id} src={p.theme.heroImage} />
            </div>
            <div className="rotate-[-2deg] border-[5px] border-[#202346] bg-white p-7 shadow-[8px_8px_0_#202346]">
              <Label>Calling all birthday heroes!</Label>
              <Copy {...p} className="mt-6" titleClassName="uppercase italic" />
            </div>

          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-[1.5fr_1fr]">
            <Facts {...p} className="border-[4px] border-[#202346] bg-[#8bddf4] p-5" />
            <Rsvp {...p} className="border-[4px] border-[#202346] bg-[#ff7967] p-5" />
          </div>
        </section>
      );
    case "race-car-pit-stop":
      return (
        <section data-birthday-scene={id} className="bg-[#c9e4ed] text-[#bc3527]">
          <div className="grid md:grid-cols-[.9fr_1.1fr]">
            <div className="min-h-80 [clip-path:polygon(10%_0,100%_0,100%_100%,0_100%)]">
              <Art id={id} src={p.theme.heroImage} />
            </div>
            <div className="space-y-7 p-8 md:p-12">
              <Label>Your birthday pit pass</Label>
              <Copy {...p} titleClassName="uppercase italic" />
              <Rsvp {...p} />
            </div>

          </div>
          <div className="border-y-[10px] border-dashed border-[#20272b] bg-[#fff1d5] p-7">
            <Facts {...p} />
          </div>
        </section>
      );
    case "woodland-camping-night":
      return (
        <section data-birthday-scene={id} className="bg-[#101f35] text-[#ffdb9e]">
          <div className="relative h-80 md:h-[28rem]">
            <Art id={id} src={p.theme.heroImage} />
            <div className="absolute inset-x-0 top-8 text-center">
              <Label>Meet us under the stars</Label>
            </div>
          </div>
          <div className="relative mx-auto -mt-12 max-w-4xl bg-[#101f35] px-8 py-10 text-center [clip-path:polygon(0_8%,50%_0,100%_8%,100%_100%,0_100%)]">
            <Copy {...p} />
            <Facts {...p} inverse className="mt-7 justify-center" />
            <Rsvp {...p} inverse className="mt-7 justify-center" />
          </div>
        </section>
      );
    case "ice-cream-parlor":
      return (
        <section data-birthday-scene={id} className="bg-[#fcf3df] text-[#bd5570]">
          <div className="h-14 rounded-b-[25px] bg-[repeating-linear-gradient(90deg,#e37d8f_0px,#e37d8f_45px,#fff4df_45px,#fff4df_90px)]" />
          <div className="px-8 py-10 text-center">
            <div className="mx-auto h-64 max-w-4xl overflow-hidden rounded-[50%_50%_0_0]">
              <Art id={id} src={p.theme.heroImage} />
            </div>
            <Label>The sweetest birthday scoop</Label>
            <Copy {...p} className="mx-auto my-6 max-w-3xl" titleClassName="italic" />

            <Facts {...p} className="justify-center border-y-2 border-[#bd5570] py-5" />
            <Rsvp {...p} className="mt-7 justify-center" />
          </div>
        </section>
      );
    case "farmyard-harvest":
      return (
        <section data-birthday-scene={id} className="bg-[#eddfb7] p-6 text-[#8a362f] md:p-10">
          <div className="border-2 border-[#8a362f] p-6">
            <div className="grid gap-7 md:grid-cols-[1.4fr_1fr]">
              <div className="h-72 rounded-t-[50%] overflow-hidden">
                <Art id={id} src={p.theme.heroImage} />
              </div>
              <div className="flex flex-col justify-center gap-7 border-y-4 border-double border-[#8a362f] py-6">
                <Facts {...p} />
                <Rsvp {...p} />
              </div>
            </div>
            <div className="text-center">
              <Label>Fresh air. Good friends. Birthday fun.</Label>
              <Copy {...p} className="mx-auto my-7 max-w-3xl" />
            </div>

          </div>
        </section>
      );
    case "science-lab-spark":
      return (
        <section data-birthday-scene={id} className="bg-[#322185] text-[#dbff81]">
          <div className="grid md:grid-cols-2">
            <div className="min-h-96">
              <Art id={id} src={p.theme.heroImage} />
            </div>
            <div className="space-y-8 p-8 md:p-12">
              <span className="inline-block rounded-full border border-[#dbff81] px-4 py-2 font-mono text-xs">
                THE BIRTHDAY EXPERIMENT
              </span>
              <Copy {...p} />
              <Facts {...p} inverse />
              <Rsvp {...p} inverse />
            </div>
          </div>
          <p className="border-t border-[#dbff81]/40 px-8 py-5 font-mono text-xs tracking-widest">
            CURIOSITY + FRIENDS = A BRILLIANT CELEBRATION
          </p>
        </section>
      );
    case "pirate-treasure-port":
      return (
        <section
          data-birthday-scene={id}
          className="relative bg-[#edce8d] p-7 text-[#40352a] md:p-12"
        >
          <div className="absolute inset-0 opacity-30">
            <Art id={id} src={p.theme.heroImage} />
          </div>
          <div className="relative grid gap-10 border-2 border-dashed border-[#6e593c] p-6 md:grid-cols-[1.1fr_.9fr] md:p-9">
            <div className="flex flex-col justify-end">
              <div className="mb-6 aspect-square overflow-hidden rounded-full border-[6px] border-[#765538]">
                <Art id={id} src={p.theme.heroImage} />
              </div>
              <Facts {...p} className="bg-[#f7e5bb]/95 p-5" />
            </div>
            <div className="space-y-7">
              <Label>A birthday worth its weight in gold</Label>
              <Copy {...p} />
              <Rsvp {...p} />
            </div>

          </div>
        </section>
      );
    case "princess-garden-ball":
      return (
        <section data-birthday-scene={id} className="bg-[#f8e3e5] px-6 py-10 text-[#865267]">
          <div className="mx-auto max-w-4xl border border-[#bda07b] p-3">
            <div className="border border-[#bda07b] px-7 pt-10 text-center">
              <div className="h-64 overflow-hidden rounded-t-[50%]">
                <Art id={id} src={p.theme.heroImage} />
              </div>
              <Label>A royal birthday invitation</Label>
              <Copy {...p} className="mx-auto my-7 max-w-2xl" titleClassName="italic" />
              <Facts {...p} className="justify-center" />
              <Rsvp {...p} className="my-7 justify-center" />

            </div>
          </div>
        </section>
      );
    case "monster-truck-arena":
      return (
        <section data-birthday-scene={id} className="overflow-hidden bg-[#161c19] text-[#c5fb37]">
          <div className="relative min-h-96">
            <Art id={id} src={p.theme.heroImage} className="absolute inset-0" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#161c19] via-[#161c19]/70 to-transparent" />
            <div className="relative max-w-xl space-y-7 p-8 md:p-12">
              <Label>Big wheels. Bigger birthday.</Label>
              <Copy {...p} titleClassName="uppercase italic" />
              <Rsvp {...p} inverse />
            </div>
          </div>
          <Facts
            {...p}
            className="border-y-[5px] border-[#c5fb37] bg-[#c5fb37] p-7 !text-[#161c19]"
          />
        </section>
      );
    case "mini-golf-clubhouse":
      return (
        <section data-birthday-scene={id} className="bg-[#e6f2d7] p-7 text-[#286557] md:p-12">
          <div className="grid gap-9 md:grid-cols-[1fr_1.15fr]">
            <div className="overflow-hidden rounded-[45%_45%_12px_12px] border-[12px] border-[#f5adbd] min-h-80">
              <Art id={id} src={p.theme.heroImage} />
            </div>
            <div className="flex flex-col justify-center gap-7">
              <Label>The birthday clubhouse</Label>
              <Copy {...p} titleClassName="italic" />
              <Facts {...p} />
              <Rsvp {...p} />
            </div>

          </div>
          <div className="mt-8 h-3 rounded-full bg-[#f5adbd]" />
        </section>
      );
    case "teddy-bear-picnic":
      return (
        <section data-birthday-scene={id} className="bg-[#faf0dd] p-6 text-[#805b3d] md:p-10">
          <div className="rounded-[48%_48%_1rem_1rem] border-[12px] border-[#d99582]/50 bg-[#fffaf0] px-6 pb-8 pt-14 text-center">
            <div className="mx-auto my-5 h-64 max-w-2xl">
              <Art
                id={id}
                src={p.theme.heroImage}
                className="[mask-image:radial-gradient(ellipse,black_55%,transparent_75%)]"
              />
            </div>
            <Label>A beary special birthday</Label>
            <Copy {...p} className="mx-auto mt-5 max-w-2xl" />

            <Facts {...p} className="justify-center" />
            <Rsvp {...p} className="mt-7 justify-center" />
          </div>
        </section>
      );
    case "safari-expedition-camp":
      return (
        <section data-birthday-scene={id} className="bg-[#d6a056] text-[#37442a]">
          <div className="flex justify-between border-b border-[#37442a] px-7 py-4">
            <Label>Birthday safari club</Label>
            <span aria-hidden="true">✳</span>
          </div>
          <div className="grid md:grid-cols-[1.2fr_1fr]">
            <div className="min-h-96">
              <Art id={id} src={p.theme.heroImage} />
            </div>
            <div className="space-y-7 bg-[#f1ddb0] p-8 md:p-12">
              <Copy {...p} />
              <Facts {...p} className="border-y-2 border-dashed border-[#65764c] py-5" />
              <Rsvp {...p} />
            </div>
          </div>
        </section>
      );
    case "glow-dance-party":
      return (
        <section
          data-birthday-scene={id}
          className="relative isolate overflow-hidden bg-[#170c39] px-7 py-12 text-white"
        >
          <div className="absolute inset-0 -z-10">
            <Art id={id} src={p.theme.heroImage} />
            <div className="absolute inset-0 bg-gradient-to-b from-[#170c39]/35 via-[#170c39]/50 to-[#170c39]" />
          </div>
          <div className="mx-auto max-w-3xl border border-[#f97af9] p-7 text-center shadow-[0_0_35px_#d228df55] md:p-12">
            <Label>Birthday after dark</Label>
            <Copy
              {...p}
              inverse
              className="my-8"
              titleClassName="uppercase !font-black [text-shadow:3px_3px_0_#9331e5]"
            />
            <Facts {...p} inverse className="justify-center" />
            <Rsvp {...p} inverse className="mt-8 justify-center" />
          </div>
        </section>
      );
    case "train-station-adventure":
      return (
        <section data-birthday-scene={id} className="bg-[#e4eadb] text-[#3c665e]">
          <div className="h-64 md:h-80">
            <Art id={id} src={p.theme.heroImage} />
          </div>
          <div className="p-8 text-center">
            <Label>All aboard the birthday express</Label>
            <Copy {...p} className="mx-auto mt-6 max-w-3xl" />
          </div>

          <div className="mx-6 my-7 grid gap-5 rounded-xl border-2 border-dashed border-[#3c665e] bg-[#fff7df] p-6 md:grid-cols-[1.5fr_1fr]">
            <Facts {...p} />
            <Rsvp {...p} className="md:border-l-2 md:border-dashed md:border-[#3c665e] md:pl-6" />
          </div>
        </section>
      );
    case "airplane-travel-club":
      return (
        <section data-birthday-scene={id} className="bg-[#ddecf3] p-6 text-[#334d66] md:p-10">
          <div className="grid overflow-hidden rounded-3xl bg-[#fff6df] shadow-xl md:grid-cols-[1.2fr_.8fr]">
            <div>
              <div className="h-64">
                <Art id={id} src={p.theme.heroImage} />
              </div>
              <div className="space-y-6 p-8">
                <Label>Destination: Birthday</Label>
                <Copy {...p} />
              </div>

            </div>
            <div className="flex flex-col justify-between gap-8 border-t-2 border-dashed border-[#8197a7] p-8 md:border-l-2 md:border-t-0">
              <span className="text-4xl" aria-hidden="true">
                ✈
              </span>
              <Facts {...p} className="!flex-col !items-start" />
              <Rsvp {...p} />
              <p className="font-mono text-xs tracking-widest">YOUR BOARDING PASS TO FUN</p>
            </div>
          </div>
        </section>
      );
    case "comic-book-creator":
      return (
        <section data-birthday-scene={id} className="bg-[#ef554b] p-6 text-[#242129] md:p-10">
          <div className="mt-5 grid gap-5 md:grid-cols-[1.4fr_1fr]">
            <div className="h-72 border-[5px] border-[#242129]">
              <Art id={id} src={p.theme.heroImage} />
            </div>
            <div className="flex flex-col gap-5">
              <Facts {...p} className="flex-1 border-[5px] border-[#242129] bg-[#f2d34e] p-5" />
              <Rsvp {...p} className="border-[5px] border-[#242129] bg-white p-5" />
            </div>
          </div>
          <div className="border-[5px] border-[#242129] bg-[#fff7de] p-7">
            <Label>Every birthday deserves a great story</Label>
            <Copy {...p} className="mt-6" titleClassName="uppercase" />
          </div>

        </section>
      );
    case "puppy-adoption-party":
      return (
        <section data-birthday-scene={id} className="bg-[#f8dac6] p-7 text-[#3c6383] md:p-12">
          <div className="grid items-center gap-10 md:grid-cols-2">
            <div className="overflow-hidden rounded-[4rem_4rem_1rem_4rem] border-8 border-[#fff5e8] aspect-square">
              <Art id={id} src={p.theme.heroImage} />
            </div>
            <div className="space-y-7">
              <span className="inline-block rotate-[-4deg] rounded-full bg-[#fff5e8] px-5 py-3 text-xs font-bold uppercase tracking-widest">
                Pawsitively invited
              </span>
              <Copy {...p} />
              <Facts {...p} />
              <Rsvp {...p} />
            </div>
          </div>
        </section>
      );
    case "beach-surf-shack":
      return (
        <section data-birthday-scene={id} className="bg-[#f5ae84] text-[#285e63]">
          <div className="relative h-72 md:h-96">
            <Art id={id} src={p.theme.heroImage} />
          </div>
          <div className="relative mx-6 -mt-14 rotate-[-1deg] border-y-[6px] border-[#285e63] bg-[#ffe1ad] p-8 md:mx-14">
            <Label>Catch a birthday wave</Label>
            <Copy {...p} className="my-6" titleClassName="uppercase italic" />
            <div className="flex flex-wrap items-center justify-between gap-7">
              <Facts {...p} />
              <Rsvp {...p} />
            </div>
          </div>
          <div className="h-10" />
        </section>
      );
    case "winter-snow-lodge":
      return (
        <section data-birthday-scene={id} className="bg-[#edf1ef] p-7 text-[#305d70] md:p-12">
          <div className="grid items-center gap-10 md:grid-cols-2">
            <div className="relative overflow-hidden rounded-t-[50%] border-[12px] border-[#fffaf0] min-h-96 shadow-lg">
              <Art id={id} src={p.theme.heroImage} className="absolute inset-0" />
              <div className="absolute inset-y-0 left-1/2 w-3 bg-[#fffaf0]" />
              <div className="absolute inset-x-0 top-1/2 h-3 bg-[#fffaf0]" />
            </div>
            <div className="space-y-7">
              <Label>A cozy birthday gathering</Label>
              <Copy {...p} titleClassName="italic" />
              <Facts {...p} className="border-y border-[#8caeb5] py-6" />
              <Rsvp {...p} />
            </div>

          </div>
        </section>
      );
    default:
      return null;
  }
}
